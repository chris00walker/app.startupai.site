/**
 * Experiments Schema
 *
 * Stores validation experiments linked to hypotheses and projects.
 * Extended with Strategyzer Test Card format fields.
 */

import { pgTable, text, timestamp, uuid, integer, date, numeric } from 'drizzle-orm/pg-core';
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

  // === Strategyzer Test Card Fields ===
  // The hypothesis statement ("We believe that...")
  hypothesis: text('hypothesis'),

  // Test method type
  testMethod: text('test_method')
    .$type<'interview' | 'survey' | 'prototype' | 'landing-page' | 'mvp' | 'concierge' | 'wizard-of-oz' | 'smoke-test' | 'a-b-test'>(),

  // What will be measured
  metric: text('metric'),

  // Success criteria (threshold for pass/fail)
  successCriteria: text('success_criteria'),

  // Expected outcome if test fails
  expectedOutcome: text('expected_outcome')
    .$type<'pivot' | 'iterate' | 'kill'>(),

  // Cost estimates
  costTime: text('cost_time'),
  costMoney: numeric('cost_money', { precision: 10, scale: 2 }),

  // Actual results (after completion)
  actualOutcome: text('actual_outcome')
    .$type<'pivot' | 'iterate' | 'kill'>(),
  actualMetricValue: text('actual_metric_value'),

  // Link to learning card
  learningCardId: uuid('learning_card_id'),

  // Experiment owner
  owner: text('owner'),
  // === End Strategyzer Fields ===

  fitType: text('fit_type')
    .$type<'Desirability' | 'Feasibility' | 'Viability'>(),

  evidenceStrength: text('evidence_strength')
    .$type<'none' | 'weak' | 'medium' | 'strong'>(),

  // Extended status to include draft
  status: text('status')
    .$type<'draft' | 'planned' | 'running' | 'completed' | 'cancelled'>()
    .default('draft')
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

/**
 * Learning Cards Schema
 *
 * Captures learnings and decisions from completed experiments.
 * Part of the Strategyzer Testing Business Ideas methodology.
 */
export const learningCards = pgTable('learning_cards', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),

  experimentId: uuid('experiment_id')
    .references(() => experiments.id, { onDelete: 'set null' }),

  // Core learning fields
  observations: text('observations'),
  insights: text('insights'),

  // Decision: pivot, iterate, or kill
  decision: text('decision')
    .$type<'pivot' | 'iterate' | 'kill'>(),

  // Metadata
  owner: text('owner'),
  decisionDate: timestamp('decision_date', { withTimezone: true }),

  status: text('status')
    .$type<'draft' | 'published'>()
    .default('draft')
    .notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type LearningCard = typeof learningCards.$inferSelect;
export type NewLearningCard = typeof learningCards.$inferInsert;
