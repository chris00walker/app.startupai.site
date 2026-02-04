/**
 * Validation Progress Schema
 *
 * Append-only log of progress events for validation runs.
 * Each event represents a crew/task/agent activity.
 *
 * @story US-F08, US-F09, US-E04
 */

import { pgTable, text, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core';
import { validationRuns } from './validation-runs';

/**
 * Progress event status
 */
export type ProgressEventStatus =
  | 'started'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'skipped';

export const validationProgress = pgTable('validation_progress', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Run identification - TEXT to match validation_runs.run_id
  runId: text('run_id').notNull(),

  // Phase and crew information
  validationPhase: integer('validation_phase').notNull(),
  crew: text('crew').notNull(),
  task: text('task'),
  agent: text('agent'),

  // Status and progress
  status: text('status').$type<ProgressEventStatus>().notNull(),
  progressPct: integer('progress_pct'),

  // Output and errors
  output: jsonb('output').$type<Record<string, unknown>>(),
  errorMessage: text('error_message'),

  // Performance
  durationMs: integer('duration_ms'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ValidationProgress = typeof validationProgress.$inferSelect;
export type NewValidationProgress = typeof validationProgress.$inferInsert;
