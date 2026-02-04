import { pgTable, uuid, text, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const trialUsageCounters = pgTable(
  'trial_usage_counters',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    trackedAction: text('tracked_action').notNull(),
    period: text('period').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    usageCount: integer('usage_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('trial_usage_user_action_period_idx').on(
      table.userId,
      table.trackedAction,
      table.period,
      table.periodStart,
    ),
  ],
);

export type TrialUsageCounter = typeof trialUsageCounters.$inferSelect;
export type NewTrialUsageCounter = typeof trialUsageCounters.$inferInsert;
