/**
 * LinkedIn Ads Campaign Activation API
 *
 * POST: Activate a PAUSED LinkedIn campaign after HITL approval
 *
 * @story US-AP08
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { LinkedInAdsClient } from '@/lib/ads/linkedin';

// ============================================================================
// HELPER: Get LinkedIn credentials
// ============================================================================

async function getLinkedInCredentials(): Promise<{
  accessToken: string;
  accountId: string;
} | null> {
  const supabase = createAdminClient();

  const { data: connection, error } = await supabase
    .from('ad_platform_connections')
    .select('credentials_encrypted, account_id')
    .eq('platform', 'linkedin')
    .eq('status', 'active')
    .single();

  if (error || !connection) {
    return null;
  }

  try {
    const credentials = JSON.parse(connection.credentials_encrypted) as {
      access_token?: string;
    };

    return {
      accessToken: credentials.access_token || '',
      accountId: connection.account_id,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// POST - Activate campaign
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Verify ownership
    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify platform
    if (campaign.platform !== 'linkedin') {
      return NextResponse.json(
        { error: 'This endpoint is for LinkedIn campaigns only' },
        { status: 400 }
      );
    }

    // Verify status allows activation
    const validStatuses = ['pending_approval', 'paused'];
    if (!validStatuses.includes(campaign.status)) {
      return NextResponse.json(
        { error: `Cannot activate campaign in ${campaign.status} status` },
        { status: 400 }
      );
    }

    // Get LinkedIn credentials
    const credentials = await getLinkedInCredentials();
    if (!credentials) {
      return NextResponse.json(
        { error: 'LinkedIn Ads platform not configured' },
        { status: 503 }
      );
    }

    // Need both campaign ID and campaign group ID
    if (!campaign.platform_campaign_id) {
      return NextResponse.json(
        { error: 'Campaign has no LinkedIn campaign ID' },
        { status: 400 }
      );
    }

    if (!campaign.platform_ad_set_id) {
      return NextResponse.json(
        { error: 'Campaign has no LinkedIn campaign group ID' },
        { status: 400 }
      );
    }

    // Create LinkedIn Ads client and activate
    const linkedInClient = new LinkedInAdsClient({
      accessToken: credentials.accessToken,
    });

    // Activate both campaign group and campaign
    await linkedInClient.activateCampaign(
      campaign.platform_campaign_id,
      campaign.platform_ad_set_id
    );

    // Update local campaign status
    const { error: updateError } = await adminSupabase
      .from('ad_campaigns')
      .update({
        status: 'active',
        status_reason: 'Campaign activated after HITL approval',
        actual_start_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Failed to update campaign status:', updateError);
      // Campaign was activated on LinkedIn, but local update failed
      // This is a partial success
    }

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        status: 'active',
        activatedAt: new Date().toISOString(),
        message: 'LinkedIn campaign is now active. B2B targeting will reach professionals in your target audience.',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/ads/campaigns/linkedin/activate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
