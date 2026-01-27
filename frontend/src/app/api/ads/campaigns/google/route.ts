/**
 * Google Ads Campaign API
 *
 * POST: Create a PAUSED Google Responsive Display campaign
 * GET: Fetch campaign status and approval state
 *
 * Same HITL workflow as Meta: PAUSED → Preview → Approve → Activate
 *
 * @story US-AP07
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { GoogleAdsClient } from '@/lib/ads/google';
import type { CopyBankData } from '@/db/schema/copy-banks';

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
      refresh_token?: string;
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
// POST - Create PAUSED Google campaign
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
    const {
      projectId,
      name,
      dailyBudget,
      lifetimeBudget,
      targetCpa,
      finalUrl,
      startDate,
      endDate,
    } = body;

    if (!projectId || !name || !dailyBudget || !finalUrl) {
      return NextResponse.json(
        { error: 'projectId, name, dailyBudget, and finalUrl are required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get Copy Bank for the project
    const { data: copyBank, error: copyBankError } = await supabase
      .from('copy_banks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (copyBankError || !copyBank) {
      return NextResponse.json(
        { error: 'Copy Bank not found for this project. Please complete VPC first.' },
        { status: 400 }
      );
    }

    // Get selected images from the most recent ad campaign (or from request)
    const imageUrls = body.imageUrls || [];
    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'At least one image URL is required' },
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

    // Create Google Ads client
    const googleClient = new GoogleAdsClient(credentials);

    // Build Copy Bank data from database
    const copyBankData: CopyBankData = {
      headlines: copyBank.headlines,
      primary_texts: copyBank.primary_texts,
      pains: copyBank.pains,
      gains: copyBank.gains,
      product: copyBank.product,
      image_keywords: copyBank.image_keywords,
      ctas: copyBank.ctas,
    };

    // Create full campaign (PAUSED)
    const result = await googleClient.createFullCampaign({
      name: `${project.name} - ${name}`,
      dailyBudgetDollars: dailyBudget,
      targetCpaDollars: targetCpa,
      finalUrl,
      copyBank: copyBankData,
      imageUrls,
      startDate,
      endDate,
    });

    // Store campaign in database
    const { data: campaign, error: insertError } = await adminSupabase
      .from('ad_campaigns')
      .insert({
        user_id: user.id,
        project_id: projectId,
        name,
        platform: 'google',
        status: 'pending_approval', // Waiting for HITL approval
        platform_campaign_id: result.campaign.id,
        platform_ad_set_id: result.adGroup.id,
        platform_ad_id: result.adGroupAd.resourceName,
        budget_allocated: lifetimeBudget || dailyBudget * 7,
        daily_budget: dailyBudget,
        scheduled_start_at: startDate ? new Date(startDate).toISOString() : null,
        scheduled_end_at: endDate ? new Date(endDate).toISOString() : null,
        creative_data: {
          headlines: copyBankData.headlines,
          descriptions: copyBankData.primary_texts,
          longHeadline: `${copyBankData.product.differentiator} ${copyBankData.product.category}`,
          businessName: copyBankData.product.name,
          selectedImages: imageUrls.map((url: string, i: number) => ({
            id: `google-${i}`,
            url,
            source: 'user' as const,
          })),
          finalUrl,
        },
        targeting_data: body.targeting || null,
        created_by_agent: 'google_ads_api',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store campaign:', insertError);
      // Note: Campaign was created on Google, but we failed to store locally
      // In production, we might want to clean up the Google campaign
      return NextResponse.json(
        { error: 'Failed to store campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        googleCampaign: {
          id: result.campaign.id,
          resourceName: result.campaign.resourceName,
          status: result.campaign.status,
        },
        googleAdGroup: {
          id: result.adGroup.id,
          resourceName: result.adGroup.resourceName,
        },
        googleAd: {
          resourceName: result.adGroupAd.resourceName,
        },
      },
    });
  } catch (error) {
    console.error('Error in POST /api/ads/campaigns/google:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Fetch campaign status and approval state
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get campaign ID from query
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      // List all Google campaigns for user
      const { data: campaigns, error: listError } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'google')
        .order('created_at', { ascending: false });

      if (listError) {
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: { campaigns },
      });
    }

    // Fetch specific campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Optionally fetch live status from Google
    let googleStatus: {
      approvalStatus: string;
      reviewStatus: string;
      policyIssues: Array<{ topic: string; type: string }>;
    } | null = null;
    if (campaign.platform_ad_id) {
      try {
        const credentials = await getGoogleAdsCredentials();
        if (credentials) {
          const googleClient = new GoogleAdsClient(credentials);
          googleStatus = await googleClient.getAdApprovalStatus(campaign.platform_ad_id);
        }
      } catch (err) {
        console.warn('Failed to fetch Google status:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        googleStatus,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/ads/campaigns/google:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
