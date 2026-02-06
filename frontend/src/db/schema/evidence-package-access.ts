/**
 * Evidence Package Access Schema
 *
 * Tracks which Portfolio Holders have accessed which evidence packages.
 * Supports access counting, duration tracking, and feedback requests.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2218-2235, :2644-2648
 */

import { pgTable, timestamp, uuid, integer, boolean, text, varchar, uniqueIndex } from 'drizzle-orm/pg-core';
import { evidencePackages } from './evidence-packages';
import { userProfiles } from './users';
import { consultantClients } from './consultant-clients';

export const evidencePackageAccess = pgTable(
  'evidence_package_access',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),

    // Foreign keys
    evidencePackageId: uuid('evidence_package_id')
      .notNull()
      .references(() => evidencePackages.id),
    portfolioHolderId: uuid('portfolio_holder_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    connectionId: uuid('connection_id')
      .references(() => consultantClients.id),

    // Access tracking
    firstAccessedAt: timestamp('first_accessed_at', { withTimezone: true }).defaultNow(),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    accessCount: integer('access_count').default(1),
    viewDurationSeconds: integer('view_duration_seconds').default(0),

    // Feedback (Phase 3)
    feedbackRequested: boolean('feedback_requested').default(false),
    feedbackAreas: text('feedback_areas').array(),

    // Verification to connection conversion tracking (spec :2644-2648)
    verificationTokenUsed: uuid('verification_token_used'),
    source: varchar('source', { length: 50 }),
  },
  (table) => [
    uniqueIndex('unique_package_holder').on(table.evidencePackageId, table.portfolioHolderId),
  ]
);

export type EvidencePackageAccessRow = typeof evidencePackageAccess.$inferSelect;
export type NewEvidencePackageAccessRow = typeof evidencePackageAccess.$inferInsert;
