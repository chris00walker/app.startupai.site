/**
 * Consultant Profiles Schema
 *
 * Extended profile data for consultant users.
 * Linked to user_profiles via the same id (user id).
 *
 * @story US-CT01, US-PH07
 */

import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, varchar, index } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

/**
 * Verification status for Portfolio Holder marketplace
 * - unverified: Trial or no paid plan
 * - verified: Active paid subscription (Advisor or Capital tier)
 * - grace: Payment failed, within 7-day grace period
 * - revoked: Payment failed, past grace period
 *
 * @story US-PH01, US-PH05
 */
export const verificationStatusEnum = ['unverified', 'verified', 'grace', 'revoked'] as const;
export type VerificationStatus = (typeof verificationStatusEnum)[number];

export const consultantProfiles = pgTable(
  'consultant_profiles',
  {
    // Primary key - same as user_profiles.id
    id: uuid('id')
      .primaryKey()
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),

    // Practice info
    companyName: text('company_name'),
    practiceSize: text('practice_size'),
    currentClients: integer('current_clients').default(0),

    // Expertise arrays
    industries: text('industries').array().default([]),
    services: text('services').array().default([]),
    toolsUsed: text('tools_used').array().default([]),

    // Pain points and goals
    painPoints: text('pain_points'),

    // White label configuration
    whiteLabelEnabled: boolean('white_label_enabled').default(false),
    whiteLabelConfig: jsonb('white_label_config').$type<Record<string, unknown>>().default({}),

    // Onboarding state
    onboardingCompleted: boolean('onboarding_completed').default(false),
    lastSessionId: varchar('last_session_id', { length: 255 }),
    lastOnboardingAt: timestamp('last_onboarding_at', { withTimezone: true }),

    // Marketplace verification (added 2026-02-03)
    // @story US-PH01, US-PH05, US-PH07
    verificationStatus: text('verification_status').default('unverified').notNull(),
    directoryOptIn: boolean('directory_opt_in').default(false).notNull(),
    defaultRelationshipType: text('default_relationship_type'), // advisory, capital, program, service, ecosystem
    graceStartedAt: timestamp('grace_started_at', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // Index for directory browsing (verified + opted-in consultants)
    index('idx_consultant_profiles_directory').on(table.verificationStatus, table.directoryOptIn),
  ]
);

export type ConsultantProfile = typeof consultantProfiles.$inferSelect;
export type NewConsultantProfile = typeof consultantProfiles.$inferInsert;

/**
 * Type for public consultant profile (Consultant Directory)
 * @story US-FM01, US-FM02
 */
export interface PublicConsultantProfile {
  id: string;
  name: string; // from user_profiles.full_name
  organization: string | null; // company_name or user_profiles.company
  expertiseAreas: string[]; // industries + services combined
  bioSummary: string | null; // from user_profiles.bio, truncated
  verificationBadge: 'verified' | 'grace';
  relationshipTypesOffered: string | null; // default_relationship_type
  connectionCount: number; // derived from consultant_clients
}
