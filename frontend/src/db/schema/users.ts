/**
 * User Profiles Schema
 *
 * Stores user profile information linked to Supabase Auth.
 * Extends the built-in auth.users table with application-specific data.
 *
 * @see docs/user-experience/roles/role-definitions.md - Canonical persona definitions
 * @see docs/user-experience/stories/README.md - User stories with acceptance criteria
 * @story US-FT01, US-F01
 */

import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * User role enum - canonical definition for the application.
 *
 * - `admin`: Internal system administrator (full access)
 * - `founder`: Entrepreneur validating business idea
 * - `consultant`: Advisor managing founder clients
 * - `trial`: Free trial user with limited access
 *
 * @see docs/user-experience/roles/role-definitions.md for complete role definitions
 */
export const userRoleEnum = pgEnum('user_role', ['admin', 'founder', 'consultant', 'trial']);

export const userProfiles = pgTable('user_profiles', {
  // Primary key references auth.users(id) from Supabase Auth
  id: uuid('id').primaryKey().notNull(),

  email: text('email').notNull(),
  fullName: text('full_name'),
  company: text('company'),

  // Consultant relationship - links founder to their assigned consultant
  consultantId: uuid('consultant_id'),

  // Subscription and tier information
  subscriptionTier: text('subscription_tier').default('free').notNull(),
  subscriptionStatus: text('subscription_status').default('trial'),
  trialExpiresAt: timestamp('trial_expires_at', { withTimezone: true }),
  planStatus: text('plan_status').default('active').notNull(),
  role: userRoleEnum('role').default('trial').notNull(),

  // Trial intent - captures founder vs consultant trial path
  // 'founder_trial' = validating own idea
  // 'consultant_trial' = exploring AI validation for clients
  trialIntent: text('trial_intent').default('founder_trial'),

  // Extended profile fields (US-AS01)
  timezone: text('timezone').default('America/New_York'),
  language: text('language').default('English'),
  bio: text('bio'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type { userProfiles as UserProfilesTable };
