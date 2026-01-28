/**
 * Gate Policies Schema
 *
 * Configurable gate criteria per user for phase transitions.
 * Allows customization of evidence requirements, thresholds, and approval rules.
 *
 * @story US-AD10, US-ADB05, US-AFB03, US-AVB03
 */

import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

/**
 * Gate types for phase transitions
 */
export type GateType = 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY';

/**
 * Custom thresholds for gate evaluation
 */
export type GateThresholds = {
  fit_score?: number;
  ctr?: number;
  signup_rate?: number;
  ltv_cac_ratio?: number;
  monthly_cost_max?: number;
  [key: string]: number | undefined;
};

/**
 * Default gate policies used when no custom policy exists
 */
export const DEFAULT_GATE_POLICIES: Record<GateType, {
  minExperiments: number;
  requiredFitTypes: string[];
  minWeakEvidence: number;
  minMediumEvidence: number;
  minStrongEvidence: number;
  thresholds: GateThresholds;
  requiresApproval: boolean;
}> = {
  DESIRABILITY: {
    minExperiments: 3,
    requiredFitTypes: ['Desirability'],
    minWeakEvidence: 0,
    minMediumEvidence: 1,
    minStrongEvidence: 1,
    thresholds: { fit_score: 70, ctr: 0.02 },
    requiresApproval: true,
  },
  FEASIBILITY: {
    minExperiments: 2,
    requiredFitTypes: ['Feasibility'],
    minWeakEvidence: 0,
    minMediumEvidence: 1,
    minStrongEvidence: 0,
    thresholds: { monthly_cost_max: 10000 },
    requiresApproval: true,
  },
  VIABILITY: {
    minExperiments: 2,
    requiredFitTypes: ['Viability'],
    minWeakEvidence: 0,
    minMediumEvidence: 0,
    minStrongEvidence: 1,
    thresholds: { ltv_cac_ratio: 3.0 },
    requiresApproval: true,
  },
};

export const gatePolicies = pgTable('gate_policies', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  gate: text('gate').$type<GateType>().notNull(),

  // Evidence requirements
  minExperiments: integer('min_experiments').notNull().default(3),
  requiredFitTypes: text('required_fit_types').array().notNull().default(['Desirability', 'Feasibility']),
  minWeakEvidence: integer('min_weak_evidence').default(0),
  minMediumEvidence: integer('min_medium_evidence').default(1),
  minStrongEvidence: integer('min_strong_evidence').default(1),

  // Custom thresholds
  thresholds: jsonb('thresholds').$type<GateThresholds>(),

  // Override settings
  overrideRoles: text('override_roles').array().default(['admin', 'senior_consultant']),
  requiresApproval: boolean('requires_approval').default(true),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique().on(table.userId, table.gate),
]);

export type GatePolicy = typeof gatePolicies.$inferSelect;
export type NewGatePolicy = typeof gatePolicies.$inferInsert;
