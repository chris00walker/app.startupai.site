/**
 * Ad Performance Metrics Schema
 *
 * Stores daily performance metrics collected from ad platforms (Meta, Google, LinkedIn).
 * Used to calculate desirability evidence and make validation decisions.
 *
 * @story US-AP06
 */

import { pgEnum, pgTable, text, timestamp, uuid, numeric, integer, jsonb, date, unique } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';
import { projects } from './projects';
import { adCampaigns } from './ad-campaigns';
import { adPlatformEnum } from './ad-platforms';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Confidence level for desirability score
 * Based on statistical significance (click volume)
 */
export const confidenceLevelEnum = pgEnum('confidence_level', [
  'low',      // < 100 clicks
  'medium',   // 100-500 clicks
  'high',     // > 500 clicks
]);

// ============================================================================
// TYPES
// ============================================================================

/**
 * Conversion actions from Meta (page views, form submissions, etc.)
 */
export interface ConversionActions {
  landing_page_view?: number;
  lead?: number;
  complete_registration?: number;
  purchase?: number;
  custom_events?: Record<string, number>;
}

/**
 * Benchmark comparison data
 */
export interface BenchmarkComparison {
  industry: string;
  ctr_benchmark: number;
  conversion_benchmark: number;
  cpc_benchmark: number;
  performance_vs_benchmark: 'below' | 'average' | 'above' | 'excellent';
}

// ============================================================================
// TABLE DEFINITION
// ============================================================================

export const adPerformanceMetrics = pgTable('ad_performance_metrics', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign keys
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => adCampaigns.id, { onDelete: 'cascade' }),

  // Platform identification
  platform: adPlatformEnum('platform').notNull(),
  platformCampaignId: text('platform_campaign_id'),
  platformAdSetId: text('platform_ad_set_id'),
  platformAdId: text('platform_ad_id'),

  // Time period
  metricDate: date('metric_date').notNull(),
  collectedAt: timestamp('collected_at', { withTimezone: true }).defaultNow().notNull(),

  // Reach metrics
  impressions: integer('impressions').default(0).notNull(),
  reach: integer('reach').default(0).notNull(),               // Unique users
  frequency: numeric('frequency', { precision: 8, scale: 4 }).$type<number>().default(0),  // Avg impressions per user

  // Engagement metrics
  clicks: integer('clicks').default(0).notNull(),
  uniqueClicks: integer('unique_clicks').default(0).notNull(),
  ctr: numeric('ctr', { precision: 8, scale: 6 }).$type<number>().default(0),  // Click-through rate (decimal)

  // Cost metrics (in cents for precision)
  spendCents: integer('spend_cents').default(0).notNull(),    // Total spend in cents
  cpcCents: integer('cpc_cents').default(0),                  // Cost per click in cents
  cpmCents: integer('cpm_cents').default(0),                  // Cost per 1000 impressions in cents

  // Conversion metrics
  landingPageViews: integer('landing_page_views').default(0).notNull(),
  formSubmissions: integer('form_submissions').default(0).notNull(),
  conversionRate: numeric('conversion_rate', { precision: 8, scale: 6 }).$type<number>().default(0),
  costPerConversionCents: integer('cost_per_conversion_cents').default(0),
  conversionActions: jsonb('conversion_actions').$type<ConversionActions>(),

  // Calculated scores
  desirabilityScore: integer('desirability_score').default(0).notNull(),  // 0-100
  confidenceLevel: confidenceLevelEnum('confidence_level').default('low').notNull(),

  // Benchmark comparison
  benchmarkComparison: jsonb('benchmark_comparison').$type<BenchmarkComparison>(),

  // Raw API response for debugging
  rawInsights: jsonb('raw_insights'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one record per campaign per day
  uniqueCampaignDate: unique().on(table.campaignId, table.metricDate),
}));

// ============================================================================
// AGGREGATED METRICS VIEW TYPE
// ============================================================================

/**
 * Campaign totals (aggregated across all days)
 */
export interface CampaignMetricsTotals {
  campaignId: string;
  projectId: string;
  platform: string;

  // Period
  startDate: string;
  endDate: string;
  daysActive: number;

  // Totals
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  totalSpendCents: number;
  totalConversions: number;

  // Averages
  avgCtr: number;
  avgCpcCents: number;
  avgConversionRate: number;
  avgCostPerConversionCents: number;

  // Final scores
  desirabilityScore: number;
  confidenceLevel: 'low' | 'medium' | 'high';

  // Trend
  trend: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate desirability score based on conversion rate
 *
 * Benchmarks (B2B SaaS landing pages):
 * - Poor: < 2% conversion → score 30
 * - Average: 2-5% conversion → score 50
 * - Good: 5-10% conversion → score 70
 * - Excellent: > 10% conversion → score 90
 */
export function calculateDesirabilityScore(
  conversionRate: number,
  totalClicks: number
): { score: number; confidence: 'low' | 'medium' | 'high' } {
  // Base score from conversion rate
  let baseScore: number;
  if (conversionRate >= 0.10) {
    baseScore = 90;
  } else if (conversionRate >= 0.05) {
    baseScore = 70;
  } else if (conversionRate >= 0.02) {
    baseScore = 50;
  } else {
    baseScore = 30;
  }

  // Confidence level and adjustment based on click volume
  let confidence: 'low' | 'medium' | 'high';
  let adjustment: number;

  if (totalClicks < 100) {
    confidence = 'low';
    adjustment = -10;
  } else if (totalClicks < 500) {
    confidence = 'medium';
    adjustment = 0;
  } else {
    confidence = 'high';
    adjustment = 5;
  }

  const score = Math.min(100, Math.max(0, baseScore + adjustment));

  return { score, confidence };
}

/**
 * Determine benchmark performance category
 */
export function getBenchmarkPerformance(
  ctr: number,
  conversionRate: number,
  industry: string = 'b2b_saas'
): BenchmarkComparison {
  // Industry benchmarks (B2B SaaS defaults)
  const benchmarks: Record<string, { ctr: number; conversion: number; cpc: number }> = {
    b2b_saas: { ctr: 0.02, conversion: 0.03, cpc: 250 },  // 2% CTR, 3% conv, $2.50 CPC
    ecommerce: { ctr: 0.015, conversion: 0.025, cpc: 150 },
    consumer_app: { ctr: 0.025, conversion: 0.04, cpc: 100 },
  };

  const benchmark = benchmarks[industry] || benchmarks.b2b_saas;

  // Calculate performance vs benchmark
  const ctrRatio = ctr / benchmark.ctr;
  const convRatio = conversionRate / benchmark.conversion;
  const avgRatio = (ctrRatio + convRatio) / 2;

  let performance: 'below' | 'average' | 'above' | 'excellent';
  if (avgRatio < 0.7) {
    performance = 'below';
  } else if (avgRatio < 1.0) {
    performance = 'average';
  } else if (avgRatio < 1.5) {
    performance = 'above';
  } else {
    performance = 'excellent';
  }

  return {
    industry,
    ctr_benchmark: benchmark.ctr,
    conversion_benchmark: benchmark.conversion,
    cpc_benchmark: benchmark.cpc,
    performance_vs_benchmark: performance,
  };
}

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type AdPerformanceMetric = typeof adPerformanceMetrics.$inferSelect;
export type NewAdPerformanceMetric = typeof adPerformanceMetrics.$inferInsert;
export type ConfidenceLevel = (typeof confidenceLevelEnum.enumValues)[number];
