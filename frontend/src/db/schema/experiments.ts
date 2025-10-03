/**
 * Experiments Schema
 *
 * Stores validation experiments linked to hypotheses and projects.
 */

import { pgTable, text, timestamp, uuid, integer, date } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { hypotheses } from './hypotheses';

export const experiments = pgTable('experiments', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),

  hypothesisId: uuid('hypothesis_id')
    .references(() => hypotheses.id, { onDelete: 'set null' }),

  name: text('name').notNull(),
  description: text('description'),

  fitType: text('fit_type')
    .$type<'Desirability' | 'Feasibility' | 'Viability'>(),

  evidenceStrength: text('evidence_strength')
    .$type<'weak' | 'medium' | 'strong'>(),

  status: text('status')
    .$type<'planned' | 'running' | 'completed' | 'cancelled'>()
    .default('planned')
    .notNull(),

  progress: integer('progress').default(0),

  estimatedTime: text('estimated_time'),
  potentialImpact: text('potential_impact'),

  steps: text('steps').array(),

  resultsQuantitative: text('results_quantitative'),
  resultsQualitative: text('results_qualitative'),
  resultsSubmittedAt: timestamp('results_submitted_at', { withTimezone: true }),

  startDate: date('start_date'),
  endDate: date('end_date'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Experiment = typeof experiments.$inferSelect;
export type NewExperiment = typeof experiments.$inferInsert;
