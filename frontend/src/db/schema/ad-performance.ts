/**
 * Ad Performance Snapshots Schema
 *
 * Stores time-series performance data for ad campaigns.
 * Collected every 15 minutes by the ad monitoring job.
 *
 * @story US-AC03, US-AC04, US-AM04
 */

import { pgTable, timestamp, uuid, numeric, integer, text } from 'drizzle-orm/pg-core';
import { adCampaigns } from './ad-campaigns';

export const adPerformanceSnapshots = pgTable('ad_performance_snapshots', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign key to campaign
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => adCampaigns.id, { onDelete: 'cascade' }),

  // Snapshot timestamp
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).defaultNow().notNull(),

  // Raw metrics from ad platform
  impressions: integer('impressions').default(0).notNull(),
  clicks: integer('clicks').default(0).notNull(),
  conversions: integer('conversions').default(0).notNull(),
  spend: numeric('spend', { precision: 12, scale: 2 }).$type<number>().default(0).notNull(),

  // Engagement metrics
  reachUnique: integer('reach_unique').default(0),
  frequency: numeric('frequency', { precision: 6, scale: 3 }).$type<number>().default(0),
  videoViews: integer('video_views').default(0),
  videoViewsP25: integer('video_views_p25').default(0),
  videoViewsP50: integer('video_views_p50').default(0),
  videoViewsP75: integer('video_views_p75').default(0),
  videoViewsP100: integer('video_views_p100').default(0),

  // Conversion breakdown
  signups: integer('signups').default(0),
  surveyResponses: integer('survey_responses').default(0),
  pageViews: integer('page_views').default(0),
  timeOnSiteAvg: integer('time_on_site_avg').default(0), // seconds

  // Calculated metrics (computed at insert time)
  // CTR = clicks / impressions
  ctr: numeric('ctr', { precision: 8, scale: 6 }).$type<number>().default(0),
  // CPC = spend / clicks
  cpc: numeric('cpc', { precision: 12, scale: 4 }).$type<number>().default(0),
  // CPA = spend / conversions
  cpa: numeric('cpa', { precision: 12, scale: 2 }).$type<number>().default(0),
  // CPM = (spend / impressions) * 1000
  cpm: numeric('cpm', { precision: 12, scale: 4 }).$type<number>().default(0),

  // Delta from previous snapshot (for trend analysis)
  impressionsDelta: integer('impressions_delta').default(0),
  clicksDelta: integer('clicks_delta').default(0),
  conversionsDelta: integer('conversions_delta').default(0),
  spendDelta: numeric('spend_delta', { precision: 12, scale: 2 }).$type<number>().default(0),

  // Quality indicators
  relevanceScore: numeric('relevance_score', { precision: 4, scale: 2 }).$type<number>(),
  qualityRanking: text('quality_ranking'), // above_average, average, below_average
  engagementRateRanking: text('engagement_rate_ranking'),
  conversionRateRanking: text('conversion_rate_ranking'),

  // Platform-specific data (raw API response if needed)
  platformData: text('platform_data'), // JSON string for flexibility

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AdPerformanceSnapshot = typeof adPerformanceSnapshots.$inferSelect;
export type NewAdPerformanceSnapshot = typeof adPerformanceSnapshots.$inferInsert;
