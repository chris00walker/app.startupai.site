/**
 * Validation Runs Schema
 *
 * Tracks CrewAI validation runs for projects.
 * Each run represents a validation flow (Phase 1-5) execution.
 *
 * Note: run_id is TEXT (not UUID) to support various ID formats from Modal.
 * The validation_progress table has run_id as UUID - this type mismatch
 * is tracked in Task #4 and will be fixed via migration.
 *
 * @story US-F08, US-F09
 */

import { pgTable, text, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { userProfiles } from './users';

/**
 * Validation run status
 */
export type ValidationRunStatus =
  | 'pending'    // Created but not started (Modal kickoff failed)
  | 'running'    // Currently executing
  | 'paused'     // Paused at HITL checkpoint
  | 'completed'  // Successfully finished
  | 'failed';    // Failed with error

/**
 * HITL checkpoint state
 */
export type HITLCheckpoint = {
  checkpoint_type: string;
  requires_approval: boolean;
  approval_data?: Record<string, unknown>;
  requested_at?: string;
};

export const validationRuns = pgTable('validation_runs', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign keys
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  // Run identification
  runId: text('run_id'),  // TEXT to match Modal's run ID format
  sessionId: text('session_id'),
  provider: text('provider').default('modal'),

  // Status and progress
  status: text('status').$type<ValidationRunStatus>().default('pending').notNull(),
  currentPhase: integer('current_phase').default(0).notNull(),
  phaseName: text('phase_name').default('Onboarding'),
  phaseState: jsonb('phase_state').$type<Record<string, unknown>>().default({}).notNull(),

  // HITL (Human-in-the-Loop) state
  hitlState: text('hitl_state'),
  hitlCheckpoint: jsonb('hitl_checkpoint').$type<HITLCheckpoint>(),
  hitlCheckpointAt: timestamp('hitl_checkpoint_at', { withTimezone: true }),

  // Modal integration
  modalFunctionId: text('modal_function_id'),

  // Input/Output data
  inputs: jsonb('inputs').$type<Record<string, unknown>>().default({}),
  outputs: jsonb('outputs').$type<Record<string, unknown>>().default({}),
  progress: jsonb('progress').$type<Record<string, unknown>>().default({}),

  // Error handling
  error: text('error'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0).notNull(),

  // Timestamps
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ValidationRun = typeof validationRuns.$inferSelect;
export type NewValidationRun = typeof validationRuns.$inferInsert;
