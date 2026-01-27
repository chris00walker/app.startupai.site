/**
 * Ad Campaign Poll Status API
 *
 * POST: Poll Meta for ad review status and update database
 *
 * @story US-AP04
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { MetaAdsClient } from '@/lib/ads/meta';
import {
  AdReviewPoller,
  AdReviewStatus,
  shouldPollCampaign,
} from '@/lib/ads/polling';

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
// POST - Poll ad review status
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: campaignId } = await params;

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch campaign from database
    const { data: campaign, error: fetchError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Verify user owns this campaign
    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if campaign should be polled
    if (campaign.platform !== 'meta') {
      return NextResponse.json(
        { error: 'Only Meta campaigns support polling' },
        { status: 400 }
      );
    }

    if (!campaign.platform_ad_id) {
      return NextResponse.json(
        { error: 'Campaign has no Meta ad ID to poll' },
        { status: 400 }
      );
    }

    // Get Meta credentials
    const credentials = await getMetaCredentials();
    if (!credentials) {
      return NextResponse.json(
        { error: 'Meta platform not configured' },
        { status: 503 }
      );
    }

    // Create poller and poll status
    const metaClient = new MetaAdsClient(credentials);
    const poller = new AdReviewPoller(metaClient);

    const result = await poller.pollAdStatus(campaign.platform_ad_id);

    // Map status to database status
    let newStatus = campaign.status;
    let statusReason = campaign.status_reason;

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
        newStatus = 'pending_deployment';
        statusReason = 'Pending Meta review';
        break;
    }

    // Update campaign in database
    const { error: updateError } = await supabase
      .from('ad_campaigns')
      .update({
        status: newStatus,
        status_reason: statusReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Failed to update campaign status:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        previousStatus: campaign.status,
        newStatus,
        reviewStatus: result.status,
        effectiveStatus: result.effectiveStatus,
        issues: result.issues,
        pollTimestamp: result.pollTimestamp,
        statusChanged: campaign.status !== newStatus,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/ads/campaigns/[id]/poll-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// GET - Check if campaign should be polled
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: campaignId } = await params;

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch campaign
    const { data: campaign, error: fetchError } = await supabase
      .from('ad_campaigns')
      .select('status, created_at, updated_at')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const shouldPoll = shouldPollCampaign(
      campaign.status,
      campaign.updated_at ? new Date(campaign.updated_at) : null,
      new Date(campaign.created_at)
    );

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        status: campaign.status,
        shouldPoll,
        lastUpdated: campaign.updated_at,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/ads/campaigns/[id]/poll-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
