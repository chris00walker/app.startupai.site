/**
 * Ad Campaigns Schema
 *
 * Stores ad campaigns created by AI agents for validation testing.
 * Links to projects, hypotheses, and budget pools.
 *
 * @story US-AC01, US-AC02, US-AC03, US-AC04, US-H04
 */

import { pgEnum, pgTable, text, timestamp, uuid, numeric, jsonb } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';
import { projects } from './projects';
import { hypotheses } from './hypotheses';
import { adPlatformEnum } from './ad-platforms';

/**
 * Campaign status lifecycle.
 * draft → pending (approval) → active → completed/paused/error
 */
export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'pending_approval',
  'pending_deployment',
  'active',
  'paused',
  'completed',
  'error',
  'rejected',
]);

/**
 * Campaign types for different validation goals.
 */
export const campaignTypeEnum = pgEnum('campaign_type', [
  'landing_page_traffic',
  'signup_conversion',
  'survey_response',
  'brand_awareness',
  'price_test',
]);

/**
 * Creative data structure for ad campaigns.
 */
export type CampaignCreativeData = {
  templateId?: string;
  headline?: string;
  description?: string;
  callToAction?: string;
  imageUrl?: string;
  videoUrl?: string;
  landingPageUrl?: string;
  variants?: Array<{
    variantId: string;
    headline: string;
    description: string;
  }>;
};

/**
 * Targeting data structure derived from VPC.
 */
export type CampaignTargetingData = {
  segment?: string;
  demographics?: {
    ageMin?: number;
    ageMax?: number;
    genders?: string[];
  };
  interests?: string[];
  behaviors?: string[];
  locations?: Array<{
    country?: string;
    region?: string;
    city?: string;
    radius?: number;
  }>;
  customAudiences?: string[];
  lookalike?: {
    sourceAudienceId?: string;
    percentage?: number;
  };
};

/**
 * Performance metrics snapshot.
 */
export type CampaignPerformanceData = {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spend?: number;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  reachUnique?: number;
  frequency?: number;
  lastUpdated?: string;
};

export const adCampaigns = pgTable('ad_campaigns', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign keys
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  hypothesisId: uuid('hypothesis_id').references(() => hypotheses.id, { onDelete: 'set null' }),

  // Campaign identification
  name: text('name').notNull(),
  description: text('description'),
  campaignType: campaignTypeEnum('campaign_type').default('landing_page_traffic').notNull(),

  // Platform details
  platform: adPlatformEnum('platform').notNull(),
  platformCampaignId: text('platform_campaign_id'), // ID from the ad platform
  platformAdSetId: text('platform_ad_set_id'),
  platformAdId: text('platform_ad_id'),

  // Status
  status: campaignStatusEnum('status').default('draft').notNull(),
  statusReason: text('status_reason'), // Reason for current status (e.g., error message)

  // Budget (USD)
  budgetAllocated: numeric('budget_allocated', { precision: 12, scale: 2 })
    .$type<number>()
    .notNull(),
  budgetSpent: numeric('budget_spent', { precision: 12, scale: 2 })
    .$type<number>()
    .default(0)
    .notNull(),
  dailyBudget: numeric('daily_budget', { precision: 12, scale: 2 }).$type<number>(),

  // Schedule
  scheduledStartAt: timestamp('scheduled_start_at', { withTimezone: true }),
  scheduledEndAt: timestamp('scheduled_end_at', { withTimezone: true }),
  actualStartAt: timestamp('actual_start_at', { withTimezone: true }),
  actualEndAt: timestamp('actual_end_at', { withTimezone: true }),

  // Creative and targeting (JSONB)
  templateId: text('template_id'),
  creativeData: jsonb('creative_data').$type<CampaignCreativeData>(),
  targetingData: jsonb('targeting_data').$type<CampaignTargetingData>(),

  // Performance snapshot (updated by monitoring job)
  performanceData: jsonb('performance_data').$type<CampaignPerformanceData>(),

  // HITL tracking
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: uuid('approved_by'),
  rejectionReason: text('rejection_reason'),

  // Agent tracking
  createdByAgent: text('created_by_agent'), // e.g., 'growth_crew_agent'
  lastUpdatedByAgent: text('last_updated_by_agent'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AdCampaign = typeof adCampaigns.$inferSelect;
export type NewAdCampaign = typeof adCampaigns.$inferInsert;
export type CampaignStatus = (typeof campaignStatusEnum.enumValues)[number];
export type CampaignType = (typeof campaignTypeEnum.enumValues)[number];
