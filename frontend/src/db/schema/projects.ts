/**
 * Projects Schema
 * 
 * Stores user projects for evidence-led strategy development.
 * Each project contains evidence, reports, and AI-generated insights.
 */

import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, numeric, integer, date, jsonb } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

/**
 * Quick Start hints for optional context during project creation.
 * All fields are optional and help seed Phase 1 analysis.
 */
export type QuickStartHints = {
  industry?: string;
  target_user?: string;
  geography?: string;
};

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  
  // Foreign key to user_profiles
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  description: text('description'),

  // Quick Start fields (ADR-006)
  rawIdea: text('raw_idea'),  // Business idea from Quick Start form (min 10 chars)
  hints: jsonb('hints').$type<QuickStartHints>(),  // Optional: industry, target_user, geography
  additionalContext: text('additional_context'),  // Optional additional context (max 10k chars)

  // Project status and metadata
  status: text('status').default('active').notNull(), // active, archived, completed

  validationStage: text('validation_stage')
    .$type<'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY' | 'SCALE'>()
    .default('DESIRABILITY')
    .notNull(),

  gateStatus: text('gate_status')
    .$type<'Pending' | 'Passed' | 'Failed'>()
    .default('Pending'),

  riskBudgetPlanned: numeric('risk_budget_planned', { precision: 10, scale: 2 })
    .$type<number>()
    .default(0),
  riskBudgetActual: numeric('risk_budget_actual', { precision: 10, scale: 2 })
    .$type<number>()
    .default(0),
  riskBudgetDelta: numeric('risk_budget_delta', { precision: 10, scale: 2 })
    .$type<number>()
    .default(0),

  assignedConsultant: text('assigned_consultant'),

  lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow(),
  nextGateDate: date('next_gate_date'),

  evidenceQuality: numeric('evidence_quality', { precision: 3, scale: 2 })
    .$type<number>()
    .default(0),

  hypothesesCount: integer('hypotheses_count').default(0),
  experimentsCount: integer('experiments_count').default(0),
  evidenceCount: integer('evidence_count').default(0),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
