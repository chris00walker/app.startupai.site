/**
 * Ad Review Polling Cron Job
 *
 * Called by pg_cron to poll Meta for ad review status updates.
 * Uses progressive intervals to balance freshness vs API rate limits.
 *
 * @story US-AP04
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { MetaAdsClient } from '@/lib/ads/meta';
import {
  AdReviewPoller,
  AdReviewStatus,
  shouldPollCampaign,
  MAX_POLL_DURATION_SECONDS,
} from '@/lib/ads/polling';

// ============================================================================
// TYPES
// ============================================================================

interface PollResult {
  campaignId: string;
  success: boolean;
  previousStatus?: string;
  newStatus?: string;
  statusChanged: boolean;
  error?: string;
}

interface CronResponse {
  success: boolean;
  totalCampaigns: number;
  polled: number;
  skipped: number;
  errors: number;
  results: PollResult[];
  executionTimeMs: number;
}

// ============================================================================
// HELPER: Get Meta credentials
// ============================================================================

async function getMetaCredentials(): Promise<{
  accessToken: string;
  adAccountId: string;
  pageId: string;
} | null> {
  const supabase = createAdminClient();

  const { data: connection, error } = await supabase
    .from('ad_platform_connections')
    .select('credentials_encrypted, account_id')
    .eq('platform', 'meta')
    .eq('status', 'active')
    .single();

  if (error || !connection) {
    return null;
  }

  try {
    const credentials = JSON.parse(connection.credentials_encrypted) as {
      access_token?: string;
      page_id?: string;
    };

    return {
      accessToken: credentials.access_token || '',
      adAccountId: connection.account_id,
      pageId: credentials.page_id || '',
    };
  } catch {
    return null;
  }
}

// ============================================================================
// HELPER: Verify cron secret
// ============================================================================

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured - allowing request in development');
    return process.env.NODE_ENV === 'development';
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  return token === cronSecret;
}

// ============================================================================
// POST - Run batch polling job
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch all campaigns that might need polling
    const { data: campaigns, error: fetchError } = await supabase
      .from('ad_campaigns')
      .select('id, user_id, status, platform, platform_ad_id, created_at, updated_at')
      .eq('platform', 'meta')
      .in('status', ['pending_deployment', 'pending_review'])
      .not('platform_ad_id', 'is', null);

    if (fetchError) {
      console.error('Failed to fetch campaigns:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        totalCampaigns: 0,
        polled: 0,
        skipped: 0,
        errors: 0,
        results: [],
        executionTimeMs: Date.now() - startTime,
      } satisfies CronResponse);
    }

    // Get Meta credentials once
    const credentials = await getMetaCredentials();
    if (!credentials) {
      console.error('Meta platform not configured');
      return NextResponse.json(
        { error: 'Meta platform not configured' },
        { status: 503 }
      );
    }

    // Create poller
    const metaClient = new MetaAdsClient(credentials);
    const poller = new AdReviewPoller(metaClient);

    // Process campaigns
    const results: PollResult[] = [];
    let polled = 0;
    let skipped = 0;
    let errors = 0;

    for (const campaign of campaigns) {
      // Check if campaign should be polled based on timing
      const shouldPoll = shouldPollCampaign(
        campaign.status,
        campaign.updated_at ? new Date(campaign.updated_at) : null,
        new Date(campaign.created_at)
      );

      if (!shouldPoll) {
        skipped++;
        continue;
      }

      // Check if campaign is too old (past max poll duration)
      const elapsedSinceCreation =
        (Date.now() - new Date(campaign.created_at).getTime()) / 1000;
      if (elapsedSinceCreation > MAX_POLL_DURATION_SECONDS) {
        // Escalate - mark as stale
        await supabase
          .from('ad_campaigns')
          .update({
            status: 'error',
            status_reason: 'Review timeout - pending for over 48 hours',
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaign.id);

        results.push({
          campaignId: campaign.id,
          success: true,
          previousStatus: campaign.status,
          newStatus: 'error',
          statusChanged: true,
        });
        polled++;
        continue;
      }

      try {
        // Poll the ad status
        const result = await poller.pollAdStatus(campaign.platform_ad_id!);

        // Map status to database status
        let newStatus = campaign.status;
        let statusReason: string | null = null;

        switch (result.status) {
          case AdReviewStatus.APPROVED:
            newStatus = 'paused'; // Approved but still paused until user activates
            statusReason = 'Ad approved by Meta';
            break;
          case AdReviewStatus.REJECTED:
            newStatus = 'rejected';
            statusReason = result.issues?.[0]?.summary || 'Ad rejected by Meta';
            break;
          case AdReviewStatus.ERROR:
            newStatus = 'error';
            statusReason = result.issues?.[0]?.summary || 'Ad has issues';
            break;
          case AdReviewStatus.PENDING:
            newStatus = 'pending_review';
            statusReason = 'Pending Meta review';
            break;
        }

        const statusChanged = campaign.status !== newStatus;

        // Update campaign in database
        if (statusChanged || campaign.status === 'pending_deployment') {
          await supabase
            .from('ad_campaigns')
            .update({
              status: newStatus,
              status_reason: statusReason,
              updated_at: new Date().toISOString(),
            })
            .eq('id', campaign.id);
        }

        results.push({
          campaignId: campaign.id,
          success: true,
          previousStatus: campaign.status,
          newStatus,
          statusChanged,
        });
        polled++;
      } catch (pollError) {
        console.error(`Failed to poll campaign ${campaign.id}:`, pollError);
        results.push({
          campaignId: campaign.id,
          success: false,
          statusChanged: false,
          error:
            pollError instanceof Error ? pollError.message : 'Unknown error',
        });
        errors++;
      }

      // Rate limiting: small delay between API calls
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      totalCampaigns: campaigns.length,
      polled,
      skipped,
      errors,
      results,
      executionTimeMs: Date.now() - startTime,
    } satisfies CronResponse);
  } catch (error) {
    console.error('Error in POST /api/cron/poll-ad-reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Check cron job health
// ============================================================================

export async function GET(request: NextRequest) {
  // Allow health checks without authentication
  try {
    const supabase = createAdminClient();

    // Get count of campaigns that need polling
    const { count, error } = await supabase
      .from('ad_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'meta')
      .in('status', ['pending_deployment', 'pending_review'])
      .not('platform_ad_id', 'is', null);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch campaign count' },
        { status: 500 }
      );
    }

    // Check if Meta is configured
    const credentials = await getMetaCredentials();

    return NextResponse.json({
      healthy: true,
      metaConfigured: !!credentials,
      pendingCampaigns: count || 0,
      cronEndpoint: '/api/cron/poll-ad-reviews',
      recommendedSchedule: '*/5 * * * *', // Every 5 minutes
    });
  } catch (error) {
    console.error('Error in GET /api/cron/poll-ad-reviews:', error);
    return NextResponse.json(
      { healthy: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
