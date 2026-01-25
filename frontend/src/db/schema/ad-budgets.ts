/**
 * Ad Budget Pools Schema
 *
 * Tracks ad budget allocation per founder from subscription fees.
 * Fulfills the product promise: "Real ad spend included (~$450-525 total)"
 *
 * @story US-AC05, US-AM04, US-AM05
 */

import { pgTable, text, timestamp, uuid, numeric, integer } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

/**
 * Budget pool status for tracking allocation state.
 */
export const budgetPoolStatusValues = ['active', 'depleted', 'suspended', 'expired'] as const;
export type BudgetPoolStatus = (typeof budgetPoolStatusValues)[number];

export const adBudgetPools = pgTable('ad_budget_pools', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Owner - one pool per founder
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' })
    .unique(),

  // Budget amounts (USD)
  totalAllocated: numeric('total_allocated', { precision: 12, scale: 2 })
    .$type<number>()
    .default(0)
    .notNull(),
  totalSpent: numeric('total_spent', { precision: 12, scale: 2 })
    .$type<number>()
    .default(0)
    .notNull(),
  // Available balance is calculated as: total_allocated - total_spent

  // Allocation tracking from subscriptions
  lastAllocationAmount: numeric('last_allocation_amount', { precision: 12, scale: 2 })
    .$type<number>()
    .default(0),
  lastAllocationAt: timestamp('last_allocation_at', { withTimezone: true }),
  subscriptionTier: text('subscription_tier'),

  // Usage limits
  perCampaignLimit: numeric('per_campaign_limit', { precision: 12, scale: 2 })
    .$type<number>()
    .default(50), // Default $50 per campaign
  dailySpendLimit: numeric('daily_spend_limit', { precision: 12, scale: 2 })
    .$type<number>()
    .default(25), // Default $25 per day

  // Rollover configuration
  rolloverEnabled: text('rollover_enabled').default('true'),
  rolloverExpiresDays: integer('rollover_expires_days').default(90),

  // Status
  status: text('status').$type<BudgetPoolStatus>().default('active').notNull(),

  // Campaign statistics
  totalCampaigns: integer('total_campaigns').default(0),
  activeCampaigns: integer('active_campaigns').default(0),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AdBudgetPool = typeof adBudgetPools.$inferSelect;
export type NewAdBudgetPool = typeof adBudgetPools.$inferInsert;
