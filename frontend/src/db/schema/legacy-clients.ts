/**
 * Legacy Clients Schema
 *
 * Original clients table for consultant-managed client relationships.
 * Note: consultant_clients table is the newer, preferred schema.
 * This schema exists for backwards compatibility with existing code.
 *
 * @deprecated Use consultant_clients for new implementations
 */

import { pgTable, text, timestamp, uuid, numeric, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

/**
 * Client status
 */
export type LegacyClientStatus = 'discovery' | 'active' | 'paused' | 'completed' | 'churned';

export const legacyClients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Consultant relationship
  consultantId: uuid('consultant_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  // Client info
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company').notNull(),
  industry: text('industry').notNull(),
  description: text('description'),

  // Business details
  businessModel: text('business_model'),
  targetMarket: text('target_market'),
  currentChallenges: text('current_challenges').array().default([]),
  goals: text('goals').array().default([]),
  budget: numeric('budget', { precision: 12, scale: 2 }),
  timeline: text('timeline'),

  // Assignment
  assignedConsultant: text('assigned_consultant'),

  // Status
  status: text('status').$type<LegacyClientStatus>().default('discovery').notNull(),

  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type LegacyClient = typeof legacyClients.$inferSelect;
export type NewLegacyClient = typeof legacyClients.$inferInsert;

/**
 * Archived Clients Junction Table
 *
 * Tracks which clients a consultant has archived (hidden from portfolio view).
 * Does NOT affect the client's actual data - only visibility in consultant's view.
 */
export const archivedClients = pgTable('archived_clients', {
  consultantId: uuid('consultant_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  archivedAt: timestamp('archived_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.consultantId, table.clientId] }),
]);

export type ArchivedClient = typeof archivedClients.$inferSelect;
export type NewArchivedClient = typeof archivedClients.$inferInsert;
