/**
 * HITL Requests Schema
 *
 * Stores Human-in-the-Loop approval requests from CrewAI validation flows.
 * Each request represents a checkpoint where human decision is required.
 *
 * @story US-F08, US-F09
 */

import { pgTable, text, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core';
import { validationRuns } from './validation-runs';
import { userProfiles } from './users';

/**
 * HITL request status
 */
export type HITLRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';

/**
 * HITL option for user selection
 */
export type HITLOption = {
  key: string;
  label: string;
  description?: string;
};

export const hitlRequests = pgTable('hitl_requests', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign key to validation run
  runId: uuid('run_id')
    .notNull()
    .references(() => validationRuns.id, { onDelete: 'cascade' }),

  // Checkpoint identification
  checkpointName: text('checkpoint_name').notNull(),
  phase: integer('phase').notNull(),

  // Request content
  context: jsonb('context').$type<Record<string, unknown>>().default({}).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  options: jsonb('options').$type<HITLOption[]>(),
  recommendedOption: text('recommended_option'),

  // Status and decision
  status: text('status').$type<HITLRequestStatus>().default('pending').notNull(),
  decision: text('decision'),
  decisionBy: uuid('decision_by')
    .references(() => userProfiles.id, { onDelete: 'set null' }),
  decisionAt: timestamp('decision_at', { withTimezone: true }),
  feedback: text('feedback'),

  // Expiration
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type HITLRequest = typeof hitlRequests.$inferSelect;
export type NewHITLRequest = typeof hitlRequests.$inferInsert;
