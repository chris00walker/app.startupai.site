/**
 * Package Engagement Events Schema
 *
 * Analytics table tracking tab and slide-level engagement for evidence packages.
 * Written by service role only; no user-facing RLS policies.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2600-2616
 */

import { pgTable, timestamp, uuid, jsonb, varchar, index } from 'drizzle-orm/pg-core';
import { evidencePackageAccess } from './evidence-package-access';

export const packageEngagementEvents = pgTable(
  'package_engagement_events',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    // Foreign key to access record
    accessId: uuid('access_id')
      .notNull()
      .references(() => evidencePackageAccess.id),

    // Event data
    eventType: varchar('event_type', { length: 50 }).notNull(),
    eventValue: jsonb('event_value').notNull(),

    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_package_engagement_access').on(table.accessId),
  ]
);

export type PackageEngagementEventRow = typeof packageEngagementEvents.$inferSelect;
export type NewPackageEngagementEventRow = typeof packageEngagementEvents.$inferInsert;
