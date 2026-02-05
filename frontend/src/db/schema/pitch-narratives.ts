/**
 * Pitch Narratives Schema
 *
 * Stores AI-generated pitch narratives from validation data.
 * One narrative per project (UNIQUE constraint on project_id).
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :1984-2041
 */

import { pgTable, text, timestamp, uuid, jsonb, boolean, integer, varchar, uniqueIndex } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { userProfiles } from './users';
import type { PitchNarrativeContent, EditHistoryEntry, AlignmentIssue } from '../../lib/narrative/types';

export const pitchNarratives = pgTable(
  'pitch_narratives',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    // Foreign keys
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),

    // Narrative content
    narrativeData: jsonb('narrative_data').$type<PitchNarrativeContent>().notNull(),
    baselineNarrative: jsonb('baseline_narrative').$type<PitchNarrativeContent>().notNull(),

    // Editing provenance
    isEdited: boolean('is_edited').default(false),
    editHistory: jsonb('edit_history').$type<EditHistoryEntry[]>().default([]),
    alignmentStatus: varchar('alignment_status', { length: 20 }).default('verified'),
    alignmentIssues: jsonb('alignment_issues').$type<AlignmentIssue[]>().default([]),

    // Generation metadata
    generationVersion: varchar('generation_version', { length: 10 }).notNull().default('1.0'),
    sourceEvidenceHash: varchar('source_evidence_hash', { length: 64 }).notNull(),
    agentRunId: varchar('agent_run_id', { length: 100 }),

    // Verification
    verificationRequestCount: integer('verification_request_count').default(0),

    // Publication state
    isPublished: boolean('is_published').default(false),
    firstPublishedAt: timestamp('first_published_at', { withTimezone: true }),
    lastPublishReviewAt: timestamp('last_publish_review_at', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('unique_project_narrative').on(table.projectId),
  ]
);

export type PitchNarrativeRow = typeof pitchNarratives.$inferSelect;
export type NewPitchNarrativeRow = typeof pitchNarratives.$inferInsert;
