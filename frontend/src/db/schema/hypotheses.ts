/**
 * Hypotheses Schema
 *
 * Captures business assumptions for each project with importance and evidence signals.
 */

import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const hypotheses = pgTable('hypotheses', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),

  statement: text('statement').notNull(),

  hypothesisType: text('hypothesis_type')
    .$type<'desirable' | 'feasible' | 'viable'>()
    .notNull(),

  importance: text('importance')
    .$type<'high' | 'medium' | 'low'>()
    .notNull(),

  evidenceStrength: text('evidence_strength')
    .$type<'none' | 'weak' | 'medium' | 'strong'>()
    .notNull(),

  status: text('status')
    .$type<'untested' | 'testing' | 'validated' | 'invalidated'>()
    .notNull(),

  hypothesisSource: text('hypothesis_source'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Hypothesis = typeof hypotheses.$inferSelect;
export type NewHypothesis = typeof hypotheses.$inferInsert;
