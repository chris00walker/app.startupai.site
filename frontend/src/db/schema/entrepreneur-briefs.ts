/**
 * Entrepreneur Briefs Schema
 *
 * Legacy format for AI-compiled briefs from onboarding conversations.
 * Different from founders_briefs - this stores the structured output
 * in a flatter, JSONB-heavy format.
 *
 * Note: This table coexists with founders_briefs. New implementations
 * should prefer founders_briefs which has a more normalized structure.
 *
 * @story US-FT01, US-F01
 */

import { pgTable, text, timestamp, uuid, integer, jsonb, varchar } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const entrepreneurBriefs = pgTable('entrepreneur_briefs', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Session and user linkage
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  // Customer segment analysis
  customerSegments: jsonb('customer_segments').$type<Array<Record<string, unknown>>>().default([]),
  primaryCustomerSegment: jsonb('primary_customer_segment').$type<Record<string, unknown>>(),
  customerSegmentConfidence: integer('customer_segment_confidence'),

  // Problem definition
  problemDescription: text('problem_description'),
  problemPainLevel: integer('problem_pain_level'),
  problemFrequency: varchar('problem_frequency', { length: 100 }),
  problemImpact: jsonb('problem_impact').$type<Record<string, unknown>>().default({}),
  problemEvidence: jsonb('problem_evidence').$type<Array<Record<string, unknown>>>().default([]),

  // Solution concept
  solutionDescription: text('solution_description'),
  solutionMechanism: text('solution_mechanism'),
  uniqueValueProposition: text('unique_value_proposition'),
  differentiationFactors: jsonb('differentiation_factors').$type<string[]>().default([]),
  solutionConfidence: integer('solution_confidence'),

  // Competitive landscape
  competitors: jsonb('competitors').$type<Array<Record<string, unknown>>>().default([]),
  competitiveAlternatives: jsonb('competitive_alternatives').$type<Array<Record<string, unknown>>>().default([]),
  switchingBarriers: jsonb('switching_barriers').$type<string[]>().default([]),
  competitiveAdvantages: jsonb('competitive_advantages').$type<string[]>().default([]),

  // Resources and constraints
  budgetRange: varchar('budget_range', { length: 100 }),
  budgetConstraints: jsonb('budget_constraints').$type<Record<string, unknown>>().default({}),
  availableChannels: jsonb('available_channels').$type<string[]>().default([]),
  existingAssets: jsonb('existing_assets').$type<string[]>().default([]),
  teamCapabilities: jsonb('team_capabilities').$type<string[]>().default([]),
  timeConstraints: jsonb('time_constraints').$type<Record<string, unknown>>().default({}),

  // Business goals
  businessStage: varchar('business_stage', { length: 100 }),
  threeMonthGoals: jsonb('three_month_goals').$type<string[]>().default([]),
  sixMonthGoals: jsonb('six_month_goals').$type<string[]>().default([]),
  successCriteria: jsonb('success_criteria').$type<string[]>().default([]),
  keyMetrics: jsonb('key_metrics').$type<string[]>().default([]),

  // Quality scores
  completenessScore: integer('completeness_score'),
  clarityScore: integer('clarity_score'),
  consistencyScore: integer('consistency_score'),
  overallQualityScore: integer('overall_quality_score'),
  aiConfidenceScores: jsonb('ai_confidence_scores').$type<Record<string, number>>().default({}),

  // Validation and next steps
  validationFlags: jsonb('validation_flags').$type<string[]>().default([]),
  recommendedNextSteps: jsonb('recommended_next_steps').$type<Array<Record<string, unknown>>>().default([]),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  // Versioning
  briefVersion: integer('brief_version').default(1).notNull(),
  previousVersionId: uuid('previous_version_id'),
});

export type EntrepreneurBrief = typeof entrepreneurBriefs.$inferSelect;
export type NewEntrepreneurBrief = typeof entrepreneurBriefs.$inferInsert;
