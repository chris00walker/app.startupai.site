/**
 * Ad Metrics Collection Cron Job
 *
 * Called by pg_cron every 6 hours to collect metrics for all active campaigns.
 * Stores daily metrics and calculates desirability scores for evidence.
 *
 * Also implements auto-pause rules to protect budget:
 * - Pause if CPA > 2× target
 * - Pause if CTR < 0.5% after 10k impressions
 * - Pause if lifetime budget exhausted
 *
 * @story US-AP06
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { MetaInsightsClient, type ParsedInsight } from '@/lib/ads/meta';
import {
  calculateDesirabilityScore,
  getBenchmarkPerformance,
  type ConversionActions,
} from '@/db/schema/ad-metrics';

// ============================================================================
// TYPES
// ============================================================================

interface CollectionResult {
  campaignId: string;
  success: boolean;
  daysCollected: number;
  autoPaused: boolean;
  pauseReason?: string;
  error?: string;
}

interface AutoPauseRules {
  maxCpaCents: number;
  lifetimeBudgetCents: number;
  minCtr: number;
  minImpressionsForCtrCheck: number;
}

const DEFAULT_PAUSE_RULES: AutoPauseRules = {
  maxCpaCents: 2500, // $25 max CPA (will pause if > 2× this)
  lifetimeBudgetCents: 50000, // $500 lifetime
  minCtr: 0.005, // 0.5% minimum CTR
  minImpressionsForCtrCheck: 10000, // Need 10k impressions before CTR check
};

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
// HELPER: Store metrics
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
  const conversionRate =
    insight.clicks > 0
      ? (insight.formSubmissions + insight.leads) / insight.clicks
      : 0;

  const { score, confidence } = calculateDesirabilityScore(conversionRate, insight.clicks);
  const benchmark = getBenchmarkPerformance(insight.ctr, conversionRate, 'b2b_saas');

  const conversionActions: ConversionActions = {
    landing_page_view: insight.landingPageViews,
    lead: insight.leads,
    purchase: insight.purchases,
  };

  const totalConversions = insight.formSubmissions + insight.leads;
  const costPerConversionCents =
    totalConversions > 0 ? Math.round(insight.spendCents / totalConversions) : 0;

  await supabase.from('ad_performance_metrics').upsert(
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
    { onConflict: 'campaign_id,metric_date' }
  );
}

// ============================================================================
// HELPER: Check auto-pause rules
// ============================================================================

async function checkAutoPauseRules(
  supabase: ReturnType<typeof createAdminClient>,
  campaignId: string,
  insights: ParsedInsight[],
  rules: AutoPauseRules = DEFAULT_PAUSE_RULES
): Promise<{ shouldPause: boolean; reason?: string }> {
  // Calculate totals
  const totals = insights.reduce(
    (acc, i) => ({
      impressions: acc.impressions + i.impressions,
      clicks: acc.clicks + i.clicks,
      spendCents: acc.spendCents + i.spendCents,
      conversions: acc.conversions + i.formSubmissions + i.leads,
    }),
    { impressions: 0, clicks: 0, spendCents: 0, conversions: 0 }
  );

  // Rule 1: CPA too high (> 2× target)
  if (totals.conversions > 0) {
    const cpaCents = totals.spendCents / totals.conversions;
    if (cpaCents > rules.maxCpaCents * 2) {
      return {
        shouldPause: true,
        reason: `CPA ($${(cpaCents / 100).toFixed(2)}) exceeds 2× target ($${(rules.maxCpaCents / 100).toFixed(2)})`,
      };
    }
  }

  // Rule 2: Lifetime budget exhausted
  // Get total spend from all time
  const { data: allMetrics } = await supabase
    .from('ad_performance_metrics')
    .select('spend_cents')
    .eq('campaign_id', campaignId);

  const totalSpendCents = (allMetrics || []).reduce(
    (sum, m) => sum + (m.spend_cents || 0),
    0
  );

  if (totalSpendCents >= rules.lifetimeBudgetCents) {
    return {
      shouldPause: true,
      reason: `Lifetime budget ($${(rules.lifetimeBudgetCents / 100).toFixed(2)}) exhausted`,
    };
  }

  // Rule 3: CTR critically low after sufficient impressions
  if (totals.impressions >= rules.minImpressionsForCtrCheck) {
    const ctr = totals.clicks / totals.impressions;
    if (ctr < rules.minCtr) {
      return {
        shouldPause: true,
        reason: `CTR (${(ctr * 100).toFixed(2)}%) below minimum (${(rules.minCtr * 100).toFixed(1)}%) - consider refreshing creative`,
      };
    }
  }

  return { shouldPause: false };
}

// ============================================================================
// HELPER: Pause campaign on Meta
// ============================================================================

async function pauseCampaignOnMeta(
  accessToken: string,
  campaignId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${campaignId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAUSED',
          access_token: accessToken,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to pause campaign on Meta:', error);
    return false;
  }
}

// ============================================================================
// POST - Run batch metrics collection job
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Get Meta credentials
    const credentials = await getMetaCredentials();
    if (!credentials) {
      return NextResponse.json({ error: 'Meta platform not configured' }, { status: 503 });
    }

    // Fetch all active Meta campaigns
    const { data: campaigns, error: fetchError } = await supabase
      .from('ad_campaigns')
      .select('id, user_id, project_id, platform, platform_campaign_id, budget_allocated')
      .eq('platform', 'meta')
      .eq('status', 'active')
      .not('platform_campaign_id', 'is', null);

    if (fetchError) {
      console.error('Failed to fetch campaigns:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        totalCampaigns: 0,
        collected: 0,
        autoPaused: 0,
        errors: 0,
        results: [],
        executionTimeMs: Date.now() - startTime,
      });
    }

    // Create insights client
    const insightsClient = new MetaInsightsClient({
      accessToken: credentials.accessToken,
    });

    // Process each campaign
    const results: CollectionResult[] = [];
    let collected = 0;
    let autoPaused = 0;
    let errors = 0;

    for (const campaign of campaigns) {
      try {
        // Fetch insights
        const insights = await insightsClient.getCampaignInsights(
          campaign.platform_campaign_id!,
          {
            datePreset: 'last_7d',
            timeIncrement: 1,
          }
        );

        // Store metrics
        let storedCount = 0;
        for (const insight of insights) {
          try {
            await storeMetrics(
              supabase,
              campaign.id,
              campaign.user_id,
              campaign.project_id,
              campaign.platform,
              campaign.platform_campaign_id,
              insight
            );
            storedCount++;
          } catch (err) {
            console.error(`Failed to store metric:`, err);
          }
        }

        // Check auto-pause rules
        const pauseCheck = await checkAutoPauseRules(supabase, campaign.id, insights, {
          ...DEFAULT_PAUSE_RULES,
          lifetimeBudgetCents: Math.round((campaign.budget_allocated || 500) * 100),
        });

        let wasPaused = false;
        if (pauseCheck.shouldPause) {
          // Pause on Meta
          const pauseSuccess = await pauseCampaignOnMeta(
            credentials.accessToken,
            campaign.platform_campaign_id!
          );

          if (pauseSuccess) {
            // Update local status
            await supabase
              .from('ad_campaigns')
              .update({
                status: 'paused',
                status_reason: pauseCheck.reason,
                updated_at: new Date().toISOString(),
              })
              .eq('id', campaign.id);

            wasPaused = true;
            autoPaused++;
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

          await supabase
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
            .eq('id', campaign.id);
        }

        results.push({
          campaignId: campaign.id,
          success: true,
          daysCollected: storedCount,
          autoPaused: wasPaused,
          pauseReason: wasPaused ? pauseCheck.reason : undefined,
        });
        collected++;
      } catch (error) {
        console.error(`Failed to collect metrics for campaign ${campaign.id}:`, error);
        results.push({
          campaignId: campaign.id,
          success: false,
          daysCollected: 0,
          autoPaused: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errors++;
      }

      // Rate limiting: small delay between API calls
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return NextResponse.json({
      success: true,
      totalCampaigns: campaigns.length,
      collected,
      autoPaused,
      errors,
      results,
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error in POST /api/cron/collect-ad-metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// GET - Health check
// ============================================================================

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Count active campaigns
    const { count, error } = await supabase
      .from('ad_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'meta')
      .eq('status', 'active')
      .not('platform_campaign_id', 'is', null);

    if (error) {
      return NextResponse.json({ healthy: false, error: 'Database error' }, { status: 500 });
    }

    // Check Meta credentials
    const credentials = await getMetaCredentials();

    return NextResponse.json({
      healthy: true,
      metaConfigured: !!credentials,
      activeCampaigns: count || 0,
      cronEndpoint: '/api/cron/collect-ad-metrics',
      recommendedSchedule: '0 */6 * * *', // Every 6 hours
      autoPauseRules: DEFAULT_PAUSE_RULES,
    });
  } catch (error) {
    return NextResponse.json({ healthy: false, error: 'Internal error' }, { status: 500 });
  }
}
