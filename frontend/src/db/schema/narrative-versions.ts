/**
 * Narrative Versions Schema
 *
 * Stores version history of pitch narratives for founder learning.
 * Each regeneration creates a new version row.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2164-2183
 */

import { pgTable, timestamp, uuid, jsonb, integer, varchar, text, decimal, uniqueIndex } from 'drizzle-orm/pg-core';
import { pitchNarratives } from './pitch-narratives';
import type { PitchNarrativeContent } from '../../lib/narrative/types';

export const narrativeVersions = pgTable(
  'narrative_versions',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    // Foreign key to parent narrative
    narrativeId: uuid('narrative_id')
      .notNull()
      .references(() => pitchNarratives.id, { onDelete: 'cascade' }),

    versionNumber: integer('version_number').notNull(),

    // Snapshot at this version
    narrativeData: jsonb('narrative_data').$type<PitchNarrativeContent>().notNull(),
    sourceEvidenceHash: varchar('source_evidence_hash', { length: 64 }).notNull(),
    fitScoreAtVersion: decimal('fit_score_at_version', { precision: 3, scale: 2 }).$type<number>(),

    // Change context
    triggerReason: text('trigger_reason'),
    evidenceChanges: jsonb('evidence_changes').$type<Record<string, unknown>>(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('unique_narrative_version').on(table.narrativeId, table.versionNumber),
  ]
);

export type NarrativeVersionRow = typeof narrativeVersions.$inferSelect;
export type NewNarrativeVersionRow = typeof narrativeVersions.$inferInsert;
