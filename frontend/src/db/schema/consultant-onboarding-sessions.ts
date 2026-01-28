/**
 * Consultant Onboarding Sessions Schema
 *
 * Stores AI-guided onboarding conversation state for consultants.
 * Similar to onboarding_sessions but with consultant-specific fields.
 *
 * @story US-CT01
 */

import { pgTable, text, timestamp, uuid, integer, jsonb, varchar, inet } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

/**
 * Consultant onboarding session status
 */
export type ConsultantOnboardingStatus = 'active' | 'paused' | 'completed' | 'abandoned' | 'expired';

export const consultantOnboardingSessions = pgTable('consultant_onboarding_sessions', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Session identification
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  userEmail: varchar('user_email', { length: 255 }),

  // Context
  userContext: jsonb('user_context').$type<Record<string, unknown>>().default({}),

  // Status and progress
  status: varchar('status', { length: 50 }).$type<ConsultantOnboardingStatus>().default('active').notNull(),
  currentStage: integer('current_stage').default(1).notNull(),
  stageProgress: integer('stage_progress').default(0).notNull(),
  overallProgress: integer('overall_progress').default(0).notNull(),

  // Conversation data
  conversationHistory: jsonb('conversation_history').$type<Array<Record<string, unknown>>>().default([]).notNull(),
  stageData: jsonb('stage_data').$type<Record<string, unknown>>().default({}).notNull(),

  // Consultant-specific extracted data
  practiceInfo: jsonb('practice_info').$type<Record<string, unknown>>().default({}),
  industries: jsonb('industries').$type<string[]>().default([]),
  services: jsonb('services').$type<string[]>().default([]),
  toolsUsed: jsonb('tools_used').$type<string[]>().default([]),
  clientManagement: jsonb('client_management').$type<Record<string, unknown>>().default({}),
  painPoints: jsonb('pain_points').$type<string[]>().default([]),
  goals: jsonb('goals').$type<Record<string, unknown>>().default({}),

  // Timing
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

  // Analytics context
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
});

export type ConsultantOnboardingSession = typeof consultantOnboardingSessions.$inferSelect;
export type NewConsultantOnboardingSession = typeof consultantOnboardingSessions.$inferInsert;
