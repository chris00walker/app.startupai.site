/**
 * LinkedIn Ads Campaign API
 *
 * POST: Create a PAUSED LinkedIn Sponsored Content campaign
 * GET: Fetch campaign status and approval state
 *
 * Optimized for B2B validation with professional targeting.
 * Same HITL workflow as Meta/Google: PAUSED → Preview → Approve → Activate
 *
 * @story US-AP08
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { LinkedInAdsClient } from '@/lib/ads/linkedin';
import type { CopyBankData } from '@/db/schema/copy-banks';
import type { LinkedInB2BTargeting } from '@/lib/ads/linkedin';

// ============================================================================
// HELPER: Get LinkedIn credentials
// ============================================================================

async function getLinkedInCredentials(): Promise<{
  accessToken: string;
  accountId: string;
  organizationId: string;
} | null> {
  const supabase = createAdminClient();

  const { data: connection, error } = await supabase
    .from('ad_platform_connections')
    .select('credentials_encrypted, account_id, organization_id')
    .eq('platform', 'linkedin')
    .eq('status', 'active')
    .single();

  if (error || !connection) {
    return null;
  }

  try {
    const credentials = JSON.parse(connection.credentials_encrypted) as {
      access_token?: string;
      refresh_token?: string;
    };

    return {
      accessToken: credentials.access_token || '',
      accountId: connection.account_id,
      organizationId: connection.organization_id || connection.account_id,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// POST - Create PAUSED LinkedIn campaign
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
      finalUrl,
      targeting,
      startDate,
      endDate,
    } = body;

    if (!projectId || !name || !dailyBudget || !finalUrl) {
      return NextResponse.json(
        { error: 'projectId, name, dailyBudget, and finalUrl are required' },
        { status: 400 }
      );
    }

    // Validate B2B targeting (at least one targeting option required)
    const b2bTargeting: LinkedInB2BTargeting = targeting || {};
    const hasTargeting =
      b2bTargeting.locations?.length ||
      b2bTargeting.jobTitles?.length ||
      b2bTargeting.jobFunctions?.length ||
      b2bTargeting.industries?.length ||
      b2bTargeting.seniorityLevels?.length ||
      b2bTargeting.companySizes?.length ||
      b2bTargeting.skills?.length;

    if (!hasTargeting) {
      return NextResponse.json(
        { error: 'At least one B2B targeting option is required (locations, jobTitles, industries, etc.)' },
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

    // Get image URL (from request or from ad campaign)
    const imageUrl = body.imageUrl;
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'An image URL is required for LinkedIn Sponsored Content' },
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

    // Create LinkedIn Ads client
    const linkedInClient = new LinkedInAdsClient({
      accessToken: credentials.accessToken,
    });

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

    // Convert daily budget from dollars to cents
    const dailyBudgetCents = Math.round(dailyBudget * 100);
    const lifetimeBudgetCents = lifetimeBudget ? Math.round(lifetimeBudget * 100) : undefined;

    // Create full campaign (PAUSED)
    const result = await linkedInClient.createFullCampaign({
      accountId: credentials.accountId,
      organizationId: credentials.organizationId,
      name: `${project.name} - ${name}`,
      dailyBudgetCents,
      totalBudgetCents: lifetimeBudgetCents,
      finalUrl,
      copyBank: copyBankData,
      imageUrl,
      targeting: b2bTargeting,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    // Store campaign in database
    const { data: campaign, error: insertError } = await adminSupabase
      .from('ad_campaigns')
      .insert({
        user_id: user.id,
        project_id: projectId,
        name,
        platform: 'linkedin',
        status: 'pending_approval', // Waiting for HITL approval
        platform_campaign_id: result.campaign.id,
        platform_ad_set_id: result.campaignGroup.id, // LinkedIn uses campaign group as container
        platform_ad_id: result.creative.id,
        budget_allocated: lifetimeBudget || dailyBudget * 7,
        daily_budget: dailyBudget,
        scheduled_start_at: startDate ? new Date(startDate).toISOString() : null,
        scheduled_end_at: endDate ? new Date(endDate).toISOString() : null,
        creative_data: {
          headlines: copyBankData.headlines,
          descriptions: copyBankData.primary_texts,
          shareUrn: result.shareUrn,
          businessName: copyBankData.product.name,
          selectedImages: [
            {
              id: 'linkedin-0',
              url: imageUrl,
              source: 'user' as const,
            },
          ],
          finalUrl,
          previewUrl: result.preview?.previewUrl,
        },
        targeting_data: {
          platform: 'linkedin',
          b2b: b2bTargeting,
        },
        created_by_agent: 'linkedin_ads_api',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store campaign:', insertError);
      // Note: Campaign was created on LinkedIn, but we failed to store locally
      return NextResponse.json(
        { error: 'Failed to store campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        linkedInCampaignGroup: {
          id: result.campaignGroup.id,
          status: result.campaignGroup.status,
        },
        linkedInCampaign: {
          id: result.campaign.id,
          status: result.campaign.status,
        },
        linkedInCreative: {
          id: result.creative.id,
          status: result.creative.status,
        },
        shareUrn: result.shareUrn,
        preview: result.preview,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/ads/campaigns/linkedin:', error);
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
      // List all LinkedIn campaigns for user
      const { data: campaigns, error: listError } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'linkedin')
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

    // Optionally fetch live status from LinkedIn
    let linkedInStatus: {
      creative: {
        status: string;
        review?: {
          status: string;
          rejectionReasons?: string[];
        };
      };
    } | null = null;

    if (campaign.platform_ad_id) {
      try {
        const credentials = await getLinkedInCredentials();
        if (credentials) {
          const linkedInClient = new LinkedInAdsClient({
            accessToken: credentials.accessToken,
          });
          const creative = await linkedInClient.getCreative(campaign.platform_ad_id);
          linkedInStatus = {
            creative: {
              status: creative.status,
              review: creative.review,
            },
          };
        }
      } catch (err) {
        console.warn('Failed to fetch LinkedIn status:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        linkedInStatus,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/ads/campaigns/linkedin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
