/**
 * Google Ads Campaign Activation API
 *
 * POST: Activate a PAUSED Google campaign after HITL approval
 *
 * @story US-AP07
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { GoogleAdsClient } from '@/lib/ads/google';

// ============================================================================
// HELPER: Get Google Ads credentials
// ============================================================================

async function getGoogleAdsCredentials(): Promise<{
  developerToken: string;
  customerId: string;
  accessToken: string;
} | null> {
  const supabase = createAdminClient();

  const { data: connection, error } = await supabase
    .from('ad_platform_connections')
    .select('credentials_encrypted, account_id')
    .eq('platform', 'google')
    .eq('status', 'active')
    .single();

  if (error || !connection) {
    return null;
  }

  try {
    const credentials = JSON.parse(connection.credentials_encrypted) as {
      developer_token?: string;
      access_token?: string;
    };

    return {
      developerToken: credentials.developer_token || '',
      customerId: connection.account_id,
      accessToken: credentials.access_token || '',
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
    if (campaign.platform !== 'google') {
      return NextResponse.json(
        { error: 'This endpoint is for Google campaigns only' },
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

    // Get Google Ads credentials
    const credentials = await getGoogleAdsCredentials();
    if (!credentials) {
      return NextResponse.json(
        { error: 'Google Ads platform not configured' },
        { status: 503 }
      );
    }

    // Need the campaign resource name
    if (!campaign.platform_campaign_id) {
      return NextResponse.json(
        { error: 'Campaign has no Google campaign ID' },
        { status: 400 }
      );
    }

    // Create Google Ads client and activate
    const googleClient = new GoogleAdsClient(credentials);

    // Construct resource name (format: customers/{customer_id}/campaigns/{campaign_id})
    const campaignResourceName = `customers/${credentials.customerId.replace(/-/g, '')}/campaigns/${campaign.platform_campaign_id}`;

    await googleClient.activateCampaign(campaignResourceName);

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
      // Campaign was activated on Google, but local update failed
      // This is a partial success
    }

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        status: 'active',
        activatedAt: new Date().toISOString(),
        message: 'Campaign is now active and will start spending.',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/ads/campaigns/google/activate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
