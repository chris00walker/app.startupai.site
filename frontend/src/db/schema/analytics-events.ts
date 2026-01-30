/**
 * Analytics Events Schema
 *
 * Captures product analytics events written by server-side handlers.
 */

import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Optional user association (some events may be anonymous)
  userId: uuid('user_id').references(() => userProfiles.id, { onDelete: 'set null' }),

  eventType: text('event_type').notNull(),
  eventData: jsonb('event_data').$type<Record<string, unknown>>(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
