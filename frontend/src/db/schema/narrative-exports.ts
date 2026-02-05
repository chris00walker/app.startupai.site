/**
 * Narrative Exports Schema
 *
 * Export history with per-export verification tokens.
 * Each export captures a point-in-time snapshot with its own verification URL.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2048-2081
 */

import { pgTable, timestamp, uuid, varchar, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { pitchNarratives } from './pitch-narratives';
import { evidencePackages } from './evidence-packages';

export const narrativeExports = pgTable(
  'narrative_exports',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    // Foreign key to parent narrative
    narrativeId: uuid('narrative_id')
      .notNull()
      .references(() => pitchNarratives.id, { onDelete: 'cascade' }),

    // Verification
    verificationToken: uuid('verification_token').notNull().default(sql`gen_random_uuid()`).unique(),
    generationHash: varchar('generation_hash', { length: 64 }).notNull(),

    // Evidence snapshot
    evidencePackageId: uuid('evidence_package_id')
      .notNull()
      .references(() => evidencePackages.id),
    ventureNameAtExport: varchar('venture_name_at_export', { length: 200 }).notNull(),
    validationStageAtExport: varchar('validation_stage_at_export', { length: 50 }).notNull(),

    // Export metadata
    exportFormat: varchar('export_format', { length: 10 }).notNull(),
    storagePath: varchar('storage_path', { length: 500 }).notNull(),
    qrCodeIncluded: boolean('qr_code_included').default(true),
    exportedAt: timestamp('exported_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_narrative_exports_verification_token').on(table.verificationToken),
    index('idx_narrative_exports_narrative_id').on(table.narrativeId),
  ]
);

export type NarrativeExportRow = typeof narrativeExports.$inferSelect;
export type NewNarrativeExportRow = typeof narrativeExports.$inferInsert;
