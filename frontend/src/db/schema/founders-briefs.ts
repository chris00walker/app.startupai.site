/**
 * Founders Briefs Schema
 *
 * Stores the structured Founder's Brief output from Phase 1 Stage A (BriefGenerationCrew).
 * This is the Layer 2 artifact - the AI-compiled brief that gets human approval.
 * Layer 1 (entrepreneur_briefs) remains the raw interview capture.
 *
 * @story US-F01, US-F02
 */

import { pgTable, text, timestamp, uuid, numeric, integer, jsonb } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { userProfiles } from './users';

// Type for key assumptions array elements
export type KeyAssumption = {
  assumption: string;
  risk_level: 'high' | 'medium' | 'low';
  testable: boolean;
  how_to_test?: string;
};

// Type for QA issues
export type QAIssue = {
  type: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
};

// Status enum types
// NOTE: Using 'pending' (not 'pending_approval') to match webhook behavior (route.ts:994)
export type FoundersBriefStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type QACheckStatus = 'pass' | 'fail' | 'pending';

export const foundersBriefs = pgTable('founders_briefs', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign key to projects (UNIQUE - one brief per project)
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .unique(),

  // Session reference (for linking back to onboarding)
  sessionId: text('session_id'),
  userId: uuid('user_id')
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  // ============= THE IDEA =============
  ideaOneLiner: text('idea_one_liner'),
  ideaDescription: text('idea_description'),
  ideaInspiration: text('idea_inspiration'),
  ideaUniqueInsight: text('idea_unique_insight'),

  // ============= PROBLEM HYPOTHESIS =============
  problemStatement: text('problem_statement'),
  problemWhoHasThis: text('problem_who_has_this'),
  problemFrequency: text('problem_frequency'),
  // NOTE: Spec says JSONB but webhook treats as scalar string
  problemCurrentAlternatives: text('problem_current_alternatives'),
  problemWhyAlternativesFail: text('problem_why_alternatives_fail'),
  problemEvidence: text('problem_evidence'),

  // ============= CUSTOMER HYPOTHESIS =============
  customerPrimarySegment: text('customer_primary_segment'),
  customerSegmentDescription: text('customer_segment_description'),
  customerCharacteristics: jsonb('customer_characteristics').$type<string[]>().default([]),
  customerWhereToFind: text('customer_where_to_find'),
  customerEstimatedSize: text('customer_estimated_size'),

  // ============= SOLUTION HYPOTHESIS =============
  solutionProposed: text('solution_proposed'),
  solutionKeyFeatures: jsonb('solution_key_features').$type<string[]>().default([]),
  solutionDifferentiation: text('solution_differentiation'),
  solutionUnfairAdvantage: text('solution_unfair_advantage'),

  // ============= KEY ASSUMPTIONS =============
  keyAssumptions: jsonb('key_assumptions').$type<KeyAssumption[]>().default([]),

  // ============= SUCCESS CRITERIA =============
  problemResonanceTarget: numeric('problem_resonance_target', { precision: 3, scale: 2 }).default('0.50'),
  zombieRatioMax: numeric('zombie_ratio_max', { precision: 3, scale: 2 }).default('0.30'),
  fitScoreTarget: integer('fit_score_target').default(70),

  // ============= QA STATUS =============
  qaLegitimacyCheck: text('qa_legitimacy_check').$type<QACheckStatus>().default('pending'),
  qaLegitimacyNotes: text('qa_legitimacy_notes'),
  qaIntentVerification: text('qa_intent_verification').$type<QACheckStatus>().default('pending'),
  qaIntentNotes: text('qa_intent_notes'),
  qaOverallStatus: text('qa_overall_status').$type<QACheckStatus>().default('pending'),
  qaIssues: jsonb('qa_issues').$type<QAIssue[]>(),

  // ============= INTERVIEW METADATA =============
  interviewDurationMinutes: integer('interview_duration_minutes').default(0),
  interviewTurns: integer('interview_turns').default(0),
  interviewFollowupQuestions: integer('interview_followup_questions').default(0),
  interviewConfidenceScore: numeric('interview_confidence_score', { precision: 3, scale: 2 }).default('0'),

  // ============= WORKFLOW =============
  approvalStatus: text('approval_status').$type<FoundersBriefStatus>().default('pending'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: uuid('approved_by').references(() => userProfiles.id),

  // ============= TIMESTAMPS =============
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type FoundersBrief = typeof foundersBriefs.$inferSelect;
export type NewFoundersBrief = typeof foundersBriefs.$inferInsert;
