/**
 * Evidence Packages Schema
 *
 * Evidence packages shared with Portfolio Holders.
 * Combines pitch narrative with validation methodology artifacts.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2186-2215
 */

import { pgTable, timestamp, uuid, jsonb, boolean, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';
import { userProfiles } from './users';
import { pitchNarratives } from './pitch-narratives';

export const evidencePackages = pgTable(
  'evidence_packages',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    // Foreign keys
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    founderId: uuid('founder_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),

    // Package content
    pitchNarrativeId: uuid('pitch_narrative_id')
      .references(() => pitchNarratives.id),
    evidenceData: jsonb('evidence_data').notNull(),
    integrityHash: varchar('integrity_hash', { length: 64 }).notNull(),

    // Access control
    isPublic: boolean('is_public').default(false),
    isPrimary: boolean('is_primary').default(false),
    founderConsent: boolean('founder_consent').notNull().default(false),
    consentTimestamp: timestamp('consent_timestamp', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

export type EvidencePackageRow = typeof evidencePackages.$inferSelect;
export type NewEvidencePackageRow = typeof evidencePackages.$inferInsert;
