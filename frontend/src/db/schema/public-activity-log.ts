/**
 * Public Activity Log Schema
 *
 * Stores anonymized agent activities for public marketing display.
 * Populated by the CrewAI webhook when validation results arrive.
 *
 * This table intentionally has NO RLS - data is public by design.
 */

import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

// Type definitions for enum columns
export type FounderId = 'sage' | 'forge' | 'pulse' | 'compass' | 'guardian' | 'ledger';
export type ActivityType = 'analysis' | 'build' | 'validation' | 'research' | 'review';

export const publicActivityLog = pgTable(
  'public_activity_log',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    // Founder who performed the activity
    founderId: text('founder_id').$type<FounderId>().notNull(),

    // Activity type classification
    activityType: text('activity_type').$type<ActivityType>().notNull(),

    // Anonymized description (NO project identifiers)
    description: text('description').notNull(),

    // Internal tracking (not exposed in public API response)
    projectId: uuid('project_id'),
    kickoffId: text('kickoff_id'),

    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_public_activity_log_founder_id').on(table.founderId),
    index('idx_public_activity_log_activity_type').on(table.activityType),
    index('idx_public_activity_log_created_at').on(table.createdAt),
    index('idx_public_activity_log_kickoff_id').on(table.kickoffId),
  ]
);

// Export inferred types
export type PublicActivity = typeof publicActivityLog.$inferSelect;
export type NewPublicActivity = typeof publicActivityLog.$inferInsert;
