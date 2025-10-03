/**
 * Projects Schema
 * 
 * Stores user projects for evidence-led strategy development.
 * Each project contains evidence, reports, and AI-generated insights.
 */

import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, numeric, integer, date } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  
  // Foreign key to user_profiles
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  description: text('description'),
  
  // Project status and metadata
  status: text('status').default('active').notNull(), // active, archived, completed

  stage: text('stage')
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
