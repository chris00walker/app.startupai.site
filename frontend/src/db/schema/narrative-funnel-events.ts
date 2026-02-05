/**
 * Narrative Funnel Events Schema
 *
 * Analytics table tracking the narrative generation journey.
 * Written by service role only; no user-facing RLS policies.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2582-2598
 */

import { pgTable, timestamp, uuid, jsonb, varchar, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { userProfiles } from './users';

export const narrativeFunnelEvents = pgTable(
  'narrative_funnel_events',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    // Foreign keys
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id),

    // Event data
    eventType: varchar('event_type', { length: 50 }).notNull(),
    eventMetadata: jsonb('event_metadata'),

    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_narrative_funnel_project').on(table.projectId, table.eventType),
    index('idx_narrative_funnel_time').on(table.createdAt),
  ]
);

export type NarrativeFunnelEventRow = typeof narrativeFunnelEvents.$inferSelect;
export type NewNarrativeFunnelEventRow = typeof narrativeFunnelEvents.$inferInsert;
