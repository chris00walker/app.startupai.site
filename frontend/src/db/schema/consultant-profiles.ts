/**
 * Consultant Profiles Schema
 *
 * Extended profile data for consultant users.
 * Linked to user_profiles via the same id (user id).
 *
 * @story US-CT01
 */

import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, varchar } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const consultantProfiles = pgTable('consultant_profiles', {
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

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type ConsultantProfile = typeof consultantProfiles.$inferSelect;
export type NewConsultantProfile = typeof consultantProfiles.$inferInsert;
