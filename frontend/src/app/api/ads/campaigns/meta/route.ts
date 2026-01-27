/**
 * Meta Ad Campaign API
 *
 * POST: Create a complete PAUSED Meta campaign ready for HITL approval
 * GET: Fetch campaign status and previews
 *
 * @story US-AP03
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { MetaAdsClient, MetaApiError, type MetaTargeting } from '@/lib/ads/meta';
import type { CopyBankData } from '@/db/schema/copy-banks';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createCampaignSchema = z.object({
  projectId: z.string().uuid(),
  landingPageUrl: z.string().url(),
  imageUrls: z.array(z.string().url()).min(1).max(10),
  dailyBudgetCents: z.number().int().min(100).max(50000).optional(), // $1-$500/day
  targeting: z
    .object({
      age_min: z.number().int().min(18).max(65).optional(),
      age_max: z.number().int().min(18).max(65).optional(),
      genders: z.array(z.number()).optional(),
      countries: z.array(z.string()).optional(),
      interests: z.array(z.object({ id: z.string(), name: z.string().optional() })).optional(),
    })
    .optional(),
});

// ============================================================================
// HELPER: Get Meta credentials from platform connection
// ============================================================================

async function getMetaCredentials(): Promise<{
  accessToken: string;
  adAccountId: string;
  pageId: string;
} | null> {
  const supabase = createAdminClient();

  // Get the active Meta platform connection (admin-managed)
  const { data: connection, error } = await supabase
    .from('ad_platform_connections')
    .select('credentials_encrypted, account_id, business_manager_id')
    .eq('platform', 'meta')
    .eq('status', 'active')
    .single();

  if (error || !connection) {
    console.error('No active Meta platform connection found:', error);
    return null;
  }

  try {
    // In production, credentials_encrypted would be decrypted here
    // For now, we assume it's a JSON string with the tokens
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
    console.error('Failed to parse Meta credentials');
    return null;
  }
}

// ============================================================================
// HELPER: Convert targeting params to Meta format
// ============================================================================

function buildMetaTargeting(
  params?: z.infer<typeof createCampaignSchema>['targeting']
): MetaTargeting {
  const targeting: MetaTargeting = {};

  if (params?.age_min) targeting.age_min = params.age_min;
  if (params?.age_max) targeting.age_max = params.age_max;
  if (params?.genders) targeting.genders = params.genders;

  if (params?.countries && params.countries.length > 0) {
    targeting.geo_locations = {
      countries: params.countries,
    };
  }

  if (params?.interests && params.interests.length > 0) {
    targeting.interests = params.interests;
  }

  // Default targeting if nothing specified
  if (Object.keys(targeting).length === 0) {
    return {
      age_min: 18,
      age_max: 65,
      geo_locations: {
        countries: ['US'], // Default to US
      },
    };
  }

  return targeting;
}

// ============================================================================
// POST - Create PAUSED Meta campaign
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
    const validationResult = createCampaignSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { projectId, landingPageUrl, imageUrls, dailyBudgetCents, targeting } =
      validationResult.data;

    // Verify user owns this project
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

    // Fetch Copy Bank for this project
    const { data: copyBank, error: copyBankError } = await supabase
      .from('copy_banks')
      .select('*')
      .eq('project_id', projectId)
      .order('vpc_version', { ascending: false })
      .limit(1)
      .single();

    if (copyBankError || !copyBank) {
      return NextResponse.json(
        {
          error: 'Copy Bank not found',
          message: 'Generate a Copy Bank first by creating or updating the VPC',
        },
        { status: 400 }
      );
    }

    // Get Meta credentials
    const credentials = await getMetaCredentials();
    if (!credentials) {
      return NextResponse.json(
        {
          error: 'Meta platform not configured',
          message: 'Admin must configure Meta Marketing API connection first',
        },
        { status: 503 }
      );
    }

    // Create Meta client
    const metaClient = new MetaAdsClient(credentials);

    // Build Copy Bank data structure
    const copyBankData: CopyBankData = {
      headlines: copyBank.headlines as CopyBankData['headlines'],
      primary_texts: copyBank.primary_texts as CopyBankData['primary_texts'],
      pains: copyBank.pains as string[],
      gains: copyBank.gains as string[],
      product: copyBank.product as CopyBankData['product'],
      image_keywords: copyBank.image_keywords as string[],
      ctas: copyBank.ctas as CopyBankData['ctas'],
    };

    // Create full campaign (PAUSED)
    const result = await metaClient.createFullCampaign({
      projectName: project.name,
      copyBank: copyBankData,
      imageUrls,
      landingPageUrl,
      targeting: buildMetaTargeting(targeting),
      dailyBudgetCents: dailyBudgetCents || 2000, // Default $20/day
    });

    // Store campaign in our database
    const { data: campaign, error: saveError } = await supabase
      .from('ad_campaigns')
      .insert({
        user_id: user.id,
        project_id: projectId,
        name: `${project.name} - Meta Validation`,
        platform: 'meta',
        platform_campaign_id: result.campaign.id,
        platform_ad_set_id: result.adSet.id,
        platform_ad_id: result.ad.id,
        status: 'pending_approval',
        budget_allocated: (dailyBudgetCents || 2000) / 100,
        campaign_type: 'landing_page_traffic',
        creative_data: {
          selectedImages: imageUrls.map((url, i) => ({
            id: result.imageHashes[i] || `img-${i}`,
            url,
            source: 'unsplash' as const,
          })),
          landingPageUrl,
          copyBankId: copyBank.id,
          previews: result.previews.map((p) => ({
            format: p.format,
            html: p.html,
          })),
        },
        targeting_data: targeting || {},
        created_by_agent: 'meta_ads_integration',
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save campaign to database:', saveError);
      // Campaign was created in Meta but failed to save locally
      // In production, we'd need to handle this gracefully
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign?.id,
          metaCampaignId: result.campaign.id,
          metaAdSetId: result.adSet.id,
          metaAdId: result.ad.id,
          metaCreativeId: result.creative.id,
          status: 'pending_approval',
        },
        previews: result.previews,
        imageHashes: result.imageHashes,
        message:
          'Campaign created in PAUSED state. Submit for HITL approval to activate.',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/ads/campaigns/meta:', error);

    if (error instanceof MetaApiError) {
      return NextResponse.json(
        {
          error: 'Meta API error',
          message: error.message,
          code: error.code,
          type: error.type,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// GET - Fetch campaign status and previews
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch campaign from our database
    const { data: campaign, error: fetchError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If campaign is from Meta, fetch latest status
    if (campaign.platform === 'meta' && campaign.platform_ad_id) {
      const credentials = await getMetaCredentials();
      if (credentials) {
        try {
          const metaClient = new MetaAdsClient(credentials);
          const metaAd = await metaClient.getAd(campaign.platform_ad_id);

          // Update local status if changed
          const newStatus = mapMetaStatusToLocal(metaAd.effective_status);
          if (newStatus !== campaign.status) {
            await supabase
              .from('ad_campaigns')
              .update({
                status: newStatus,
                status_reason: metaAd.issues_info?.[0]?.error_message,
              })
              .eq('id', campaignId);

            campaign.status = newStatus;
          }
        } catch (error) {
          console.warn('Failed to fetch Meta ad status:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        statusReason: campaign.status_reason,
        budgetAllocated: campaign.budget_allocated,
        budgetSpent: campaign.budget_spent,
        creativeData: campaign.creative_data,
        targetingData: campaign.targeting_data,
        performanceData: campaign.performance_data,
        createdAt: campaign.created_at,
        approvedAt: campaign.approved_at,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/ads/campaigns/meta:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// HELPER: Map Meta status to local status
// ============================================================================

function mapMetaStatusToLocal(
  effectiveStatus: string
): 'draft' | 'pending_approval' | 'pending_deployment' | 'active' | 'paused' | 'completed' | 'error' | 'rejected' {
  switch (effectiveStatus) {
    case 'ACTIVE':
      return 'active';
    case 'PAUSED':
    case 'CAMPAIGN_PAUSED':
    case 'ADSET_PAUSED':
      return 'paused';
    case 'PENDING_REVIEW':
    case 'IN_PROCESS':
      return 'pending_deployment';
    case 'DISAPPROVED':
      return 'rejected';
    case 'WITH_ISSUES':
      return 'error';
    case 'DELETED':
    case 'ARCHIVED':
      return 'completed';
    default:
      return 'pending_approval';
  }
}
