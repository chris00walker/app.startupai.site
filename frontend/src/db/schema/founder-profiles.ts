/**
 * Founder Profiles Schema
 *
 * Stores founder professional background data for the Team slide.
 * Separate from user_profiles (which stores auth/subscription data).
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2237-2255
 */

import { pgTable, timestamp, uuid, jsonb, text, varchar, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const founderProfiles = pgTable(
  'founder_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    // Foreign key to user
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),

    // Professional background
    professionalSummary: varchar('professional_summary', { length: 500 }),
    domainExpertise: text('domain_expertise').array(),
    previousVentures: jsonb('previous_ventures').$type<{
      name: string;
      role: string;
      outcome: string;
      year: number;
    }[]>(),
    linkedinUrl: varchar('linkedin_url', { length: 255 }),
    companyWebsite: varchar('company_website', { length: 255 }),
    yearsExperience: integer('years_experience'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('unique_user_founder_profile').on(table.userId),
  ]
);

export type FounderProfileRow = typeof founderProfiles.$inferSelect;
export type NewFounderProfileRow = typeof founderProfiles.$inferInsert;
