/**
 * Meta Campaign Activation API
 *
 * POST: Activate a PAUSED campaign after HITL approval
 *
 * @story US-AP03
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { MetaAdsClient, MetaApiError } from '@/lib/ads/meta';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const activateSchema = z.object({
  campaignId: z.string().uuid(),
});

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
// POST - Activate campaign after HITL approval
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = activateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { campaignId } = validationResult.data;

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

    // Verify campaign is pending approval
    if (campaign.status !== 'pending_approval') {
      return NextResponse.json(
        {
          error: 'Cannot activate campaign',
          message: `Campaign status is ${campaign.status}, must be pending_approval`,
        },
        { status: 400 }
      );
    }

    // Verify it's a Meta campaign with required IDs
    if (campaign.platform !== 'meta') {
      return NextResponse.json(
        { error: 'This endpoint only supports Meta campaigns' },
        { status: 400 }
      );
    }

    if (!campaign.platform_campaign_id || !campaign.platform_ad_set_id || !campaign.platform_ad_id) {
      return NextResponse.json(
        { error: 'Campaign missing Meta platform IDs' },
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

    // Create Meta client and activate
    const metaClient = new MetaAdsClient(credentials);

    await metaClient.activateCampaign(
      campaign.platform_campaign_id,
      campaign.platform_ad_set_id,
      campaign.platform_ad_id
    );

    // Update local database
    const { error: updateError } = await supabase
      .from('ad_campaigns')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        actual_start_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Failed to update campaign status:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        status: 'active',
        message: 'Campaign activated successfully. Ads will begin serving shortly.',
        activatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in POST /api/ads/campaigns/meta/activate:', error);

    if (error instanceof MetaApiError) {
      return NextResponse.json(
        {
          error: 'Meta API error',
          message: error.message,
          code: error.code,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
