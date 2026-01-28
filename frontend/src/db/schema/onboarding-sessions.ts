/**
 * Onboarding Sessions Schema
 *
 * Stores AI-guided onboarding conversation state for founders and consultants.
 * Tracks progress through the 7-stage onboarding journey.
 *
 * @story US-FT01, US-F01
 */

import { pgTable, text, timestamp, uuid, integer, jsonb, inet } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

/**
 * Onboarding session status
 */
export type OnboardingSessionStatus = 'active' | 'paused' | 'completed' | 'abandoned' | 'expired';

/**
 * Conversation message structure
 */
export type ConversationMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  stage?: number;
  metadata?: Record<string, unknown>;
};

/**
 * Quality score structure
 */
export type QualityScore = {
  clarity?: { label: string; score: number };
  completeness?: { label: string; score: number };
  detail_score?: number;
  overall?: number;
  quality_tags?: string[];
  suggestions?: string[];
  encouragement?: string;
};

export const onboardingSessions = pgTable('onboarding_sessions', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Session identification
  sessionId: text('session_id').notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  // Plan context
  planType: text('plan_type').notNull(),
  userContext: jsonb('user_context').$type<Record<string, unknown>>().default({}),

  // Status and progress
  status: text('status').$type<OnboardingSessionStatus>().default('active').notNull(),
  currentStage: integer('current_stage').default(1).notNull(),
  stageProgress: integer('stage_progress').default(0).notNull(),
  overallProgress: integer('overall_progress').default(0).notNull(),

  // Conversation data
  conversationHistory: jsonb('conversation_history').$type<ConversationMessage[]>().default([]).notNull(),
  stageData: jsonb('stage_data').$type<Record<string, unknown>>().default({}).notNull(),
  aiContext: jsonb('ai_context').$type<Record<string, unknown>>().default({}),

  // Quality tracking
  responseQualityScores: jsonb('response_quality_scores').$type<Record<string, QualityScore>>().default({}),
  conversationQualityScore: integer('conversation_quality_score'),

  // Timing
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

  // User feedback
  userFeedback: jsonb('user_feedback').$type<Record<string, unknown>>(),
  satisfactionRating: integer('satisfaction_rating'),

  // Analytics context
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  referralSource: text('referral_source'),

  // Versioning
  version: integer('version').default(1).notNull(),
});

export type OnboardingSession = typeof onboardingSessions.$inferSelect;
export type NewOnboardingSession = typeof onboardingSessions.$inferInsert;
