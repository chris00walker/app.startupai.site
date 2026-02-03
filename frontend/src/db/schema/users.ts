/**
 * User Profiles Schema
 *
 * Stores user profile information linked to Supabase Auth.
 * Extends the built-in auth.users table with application-specific data.
 *
 * @see docs/user-experience/roles/role-definitions.md - Canonical persona definitions
 * @see docs/user-experience/stories/README.md - User stories with acceptance criteria
 * @story US-FT01, US-F01, US-FM10
 */

import { pgEnum, pgTable, text, timestamp, uuid, boolean, index } from 'drizzle-orm/pg-core';

/**
 * User role enum - canonical definition for the application.
 *
 * - `admin`: Internal system administrator (full access)
 * - `founder`: Entrepreneur with paid Founder plan
 * - `consultant`: Advisor managing founder clients with paid Consultant plan
 * - `founder_trial`: Founder evaluating platform before subscribing
 * - `consultant_trial`: Consultant evaluating platform before subscribing
 *
 * @see docs/user-experience/roles/role-definitions.md for complete role definitions
 */
export const userRoleEnum = pgEnum('user_role', ['admin', 'founder', 'consultant', 'founder_trial', 'consultant_trial']);

export const userProfiles = pgTable(
  'user_profiles',
  {
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
    role: userRoleEnum('role').default('founder_trial').notNull(),

    // Note: trialIntent is deprecated - role now directly indicates trial type
    // Kept for backwards compatibility during migration
    trialIntent: text('trial_intent'),

    // Extended profile fields (US-AS01)
    timezone: text('timezone').default('America/New_York'),
    language: text('language').default('English'),
    bio: text('bio'),

    // Stripe integration (US-FT03)
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    planStartedAt: timestamp('plan_started_at', { withTimezone: true }),

    // Founder Directory opt-in (added 2026-02-03)
    // Founder must explicitly opt-in to be browsed by verified consultants
    // Combined with VPD gate: opt_in AND problem_fit qualifies for directory
    // @story US-FM10
    founderDirectoryOptIn: boolean('founder_directory_opt_in').default(false).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Index for Founder Directory browsing (opt-in founders)
    index('idx_user_profiles_founder_opt_in').on(table.founderDirectoryOptIn),
  ]
);

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type { userProfiles as UserProfilesTable };
