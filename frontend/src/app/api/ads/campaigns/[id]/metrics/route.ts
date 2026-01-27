/**
 * Ad Campaign Metrics API
 *
 * GET: Fetch stored metrics for a campaign
 * POST: Trigger metrics collection from Meta Insights API
 *
 * @story US-AP06
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { MetaInsightsClient, type ParsedInsight } from '@/lib/ads/meta';
import {
  calculateDesirabilityScore,
  getBenchmarkPerformance,
  type ConversionActions,
} from '@/db/schema/ad-metrics';

// ============================================================================
// HELPER: Get Meta credentials
// ============================================================================

async function getMetaCredentials(): Promise<{
  accessToken: string;
  adAccountId: string;
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
    };

    return {
      accessToken: credentials.access_token || '',
      adAccountId: connection.account_id,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// HELPER: Store metrics in database
// ============================================================================

async function storeMetrics(
  supabase: ReturnType<typeof createAdminClient>,
  campaignId: string,
  userId: string,
  projectId: string,
  platform: string,
  platformCampaignId: string | null,
  insight: ParsedInsight
): Promise<void> {
  // Calculate conversion rate
  const conversionRate =
    insight.clicks > 0
      ? (insight.formSubmissions + insight.leads) / insight.clicks
      : 0;

  // Calculate desirability score
  const { score, confidence } = calculateDesirabilityScore(
    conversionRate,
    insight.clicks
  );

  // Get benchmark comparison
  const benchmark = getBenchmarkPerformance(insight.ctr, conversionRate, 'b2b_saas');

  // Build conversion actions
  const conversionActions: ConversionActions = {
    landing_page_view: insight.landingPageViews,
    lead: insight.leads,
    purchase: insight.purchases,
  };

  // Calculate cost per conversion
  const totalConversions = insight.formSubmissions + insight.leads;
  const costPerConversionCents =
    totalConversions > 0 ? Math.round(insight.spendCents / totalConversions) : 0;

  // Upsert metric (unique on campaign_id + metric_date)
  const { error } = await supabase.from('ad_performance_metrics').upsert(
    {
      user_id: userId,
      project_id: projectId,
      campaign_id: campaignId,
      platform,
      platform_campaign_id: platformCampaignId,
      metric_date: insight.date,
      collected_at: new Date().toISOString(),
      impressions: insight.impressions,
      reach: insight.reach,
      frequency: insight.frequency,
      clicks: insight.clicks,
      unique_clicks: insight.uniqueClicks,
      ctr: insight.ctr,
      spend_cents: insight.spendCents,
      cpc_cents: insight.cpcCents,
      cpm_cents: insight.cpmCents,
      landing_page_views: insight.landingPageViews,
      form_submissions: insight.formSubmissions,
      conversion_rate: conversionRate,
      cost_per_conversion_cents: costPerConversionCents,
      conversion_actions: conversionActions,
      desirability_score: score,
      confidence_level: confidence,
      benchmark_comparison: benchmark,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'campaign_id,metric_date',
    }
  );

  if (error) {
    console.error('Failed to store metrics:', error);
    throw error;
  }
}

// ============================================================================
// GET - Fetch stored metrics for a campaign
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: campaignId } = await params;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch campaign to verify ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .select('id, user_id, project_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('ad_performance_metrics')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: false });

    if (metricsError) {
      console.error('Failed to fetch metrics:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    // Calculate totals
    const totals = (metrics || []).reduce(
      (acc, m) => ({
        impressions: acc.impressions + (m.impressions || 0),
        reach: acc.reach + (m.reach || 0),
        clicks: acc.clicks + (m.clicks || 0),
        spendCents: acc.spendCents + (m.spend_cents || 0),
        conversions: acc.conversions + (m.form_submissions || 0) + (m.landing_page_views || 0),
        landingPageViews: acc.landingPageViews + (m.landing_page_views || 0),
        formSubmissions: acc.formSubmissions + (m.form_submissions || 0),
      }),
      {
        impressions: 0,
        reach: 0,
        clicks: 0,
        spendCents: 0,
        conversions: 0,
        landingPageViews: 0,
        formSubmissions: 0,
      }
    );

    // Calculate aggregates
    const avgCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
    const avgCpcCents = totals.clicks > 0 ? Math.round(totals.spendCents / totals.clicks) : 0;
    const avgConversionRate =
      totals.clicks > 0 ? totals.formSubmissions / totals.clicks : 0;

    // Get latest desirability score
    const latestScore = metrics?.[0]?.desirability_score || 0;
    const latestConfidence = metrics?.[0]?.confidence_level || 'low';

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        period: { days, startDate: startDate.toISOString().split('T')[0] },
        dailyMetrics: metrics || [],
        totals: {
          ...totals,
          avgCtr,
          avgCpcCents,
          avgConversionRate,
        },
        desirabilityScore: latestScore,
        confidenceLevel: latestConfidence,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/ads/campaigns/[id]/metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST - Trigger metrics collection from Meta
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { id: campaignId } = await params;

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify campaign is on Meta platform
    if (campaign.platform !== 'meta') {
      return NextResponse.json(
        { error: 'Only Meta campaigns support metrics collection' },
        { status: 400 }
      );
    }

    // Need platform campaign ID
    if (!campaign.platform_campaign_id) {
      return NextResponse.json(
        { error: 'Campaign has no Meta campaign ID' },
        { status: 400 }
      );
    }

    // Get Meta credentials
    const credentials = await getMetaCredentials();
    if (!credentials) {
      return NextResponse.json({ error: 'Meta platform not configured' }, { status: 503 });
    }

    // Create insights client and fetch metrics
    const insightsClient = new MetaInsightsClient({
      accessToken: credentials.accessToken,
    });

    const insights = await insightsClient.getCampaignInsights(
      campaign.platform_campaign_id,
      {
        datePreset: 'last_7d',
        timeIncrement: 1, // Daily breakdown
      }
    );

    // Store each day's metrics
    let storedCount = 0;
    for (const insight of insights) {
      try {
        await storeMetrics(
          adminSupabase,
          campaignId,
          user.id,
          campaign.project_id,
          campaign.platform,
          campaign.platform_campaign_id,
          insight
        );
        storedCount++;
      } catch (err) {
        console.error(`Failed to store metric for ${insight.date}:`, err);
      }
    }

    // Update campaign performance snapshot
    if (insights.length > 0) {
      const totals = insights.reduce(
        (acc, i) => ({
          impressions: acc.impressions + i.impressions,
          clicks: acc.clicks + i.clicks,
          spend: acc.spend + i.spendCents / 100,
          conversions: acc.conversions + i.formSubmissions + i.leads,
        }),
        { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
      );

      await adminSupabase
        .from('ad_campaigns')
        .update({
          performance_data: {
            impressions: totals.impressions,
            clicks: totals.clicks,
            spend: totals.spend,
            conversions: totals.conversions,
            ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
            cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
            lastUpdated: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
    }

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        daysCollected: storedCount,
        totalInsights: insights.length,
        collectedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in POST /api/ads/campaigns/[id]/metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
