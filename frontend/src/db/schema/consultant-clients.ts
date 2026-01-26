/**
 * Consultant Clients Schema
 *
 * Tracks the relationship between consultants and their clients,
 * including invite status, tokens, and archival state.
 */

import { pgTable, text, timestamp, uuid, index, uniqueIndex, boolean } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const consultantClientsStatusEnum = ['invited', 'active', 'archived'] as const;
export type ConsultantClientStatus = (typeof consultantClientsStatusEnum)[number];

export const consultantClientsArchivedByEnum = ['consultant', 'client', 'system'] as const;
export type ConsultantClientArchivedBy = (typeof consultantClientsArchivedByEnum)[number];

export const consultantClients = pgTable(
  'consultant_clients',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // Relationships
    consultantId: uuid('consultant_id')
      .references(() => userProfiles.id, { onDelete: 'cascade' })
      .notNull(),
    clientId: uuid('client_id').references(() => userProfiles.id, {
      onDelete: 'set null',
    }),

    // Invite details
    inviteEmail: text('invite_email').notNull(),
    inviteToken: text('invite_token').unique().notNull(),
    inviteExpiresAt: timestamp('invite_expires_at', { withTimezone: true }).notNull(),

    // Optional: Client name for personalization before they sign up
    clientName: text('client_name'),

    // Status tracking
    status: text('status').default('invited').notNull(),

    // Timestamps
    invitedAt: timestamp('invited_at', { withTimezone: true }).defaultNow().notNull(),
    linkedAt: timestamp('linked_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedBy: text('archived_by'),

    // Mock client flag for trial users (US-CT01)
    isMock: boolean('is_mock').default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_consultant_clients_consultant').on(table.consultantId),
    index('idx_consultant_clients_client').on(table.clientId),
    index('idx_consultant_clients_token').on(table.inviteToken),
    index('idx_consultant_clients_status').on(table.status),
    index('idx_consultant_clients_invite_email').on(table.inviteEmail),
    index('idx_consultant_clients_consultant_status').on(table.consultantId, table.status),
  ]
);

export type ConsultantClient = typeof consultantClients.$inferSelect;
export type NewConsultantClient = typeof consultantClients.$inferInsert;

/**
 * Type for invite response (what the API returns)
 */
export interface ConsultantInvite {
  id: string;
  consultantId: string;
  inviteEmail: string;
  inviteToken: string;
  inviteExpiresAt: Date;
  clientName: string | null;
  status: ConsultantClientStatus;
  invitedAt: Date;
}

/**
 * Type for linked client response (what the API returns)
 */
export interface LinkedClient {
  id: string;
  consultantId: string;
  clientId: string;
  inviteEmail: string;
  clientName: string | null;
  status: ConsultantClientStatus;
  linkedAt: Date;
  // Joined from user_profiles
  fullName?: string;
  company?: string;
}
