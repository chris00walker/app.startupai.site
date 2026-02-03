/**
 * Consultant Clients Schema
 *
 * Tracks the relationship between consultants and their clients,
 * including invite status, tokens, connection flows, and archival state.
 *
 * @story US-C02, US-PH03, US-PH04, US-FM03, US-FM05, US-FM06
 */

import { pgTable, text, timestamp, uuid, index, boolean } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

/**
 * Relationship types for Portfolio Holder marketplace
 * @see docs/specs/portfolio-holder-vision.md
 */
export const relationshipTypeEnum = ['advisory', 'capital', 'program', 'service', 'ecosystem'] as const;
export type RelationshipType = (typeof relationshipTypeEnum)[number];

/**
 * Connection status - expanded for marketplace flows
 * - invited: Traditional invite flow (email sent, awaiting signup)
 * - requested: Marketplace connection request (awaiting acceptance)
 * - active: Relationship established
 * - declined: Request was declined (30-day cooldown applies)
 * - archived: Relationship ended by either party
 */
export const connectionStatusEnum = ['invited', 'requested', 'active', 'declined', 'archived'] as const;
export type ConnectionStatus = (typeof connectionStatusEnum)[number];

/**
 * Who initiated the connection
 */
export const initiatedByEnum = ['consultant', 'founder'] as const;
export type InitiatedBy = (typeof initiatedByEnum)[number];

// Legacy enums for backwards compatibility
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

    // Invite details (for Flow 1: Invite-New) - nullable for marketplace flows
    inviteEmail: text('invite_email'),
    inviteToken: text('invite_token').unique(),
    inviteExpiresAt: timestamp('invite_expires_at', { withTimezone: true }),

    // Optional: Client name for personalization before they sign up
    clientName: text('client_name'),

    // Connection details (Portfolio Holder marketplace - added 2026-02-03)
    // @story US-PH03, US-FM03
    relationshipType: text('relationship_type').notNull(), // NO DEFAULT - must be explicitly selected
    connectionStatus: text('connection_status').default('invited').notNull(),
    initiatedBy: text('initiated_by').default('consultant').notNull(),
    requestMessage: text('request_message'), // Optional message with connection request
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    declinedAt: timestamp('declined_at', { withTimezone: true }),

    // Legacy status field (kept for backwards compatibility during migration)
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
    index('idx_consultant_clients_status').on(table.connectionStatus),
    index('idx_consultant_clients_invite_email').on(table.inviteEmail),
    index('idx_consultant_clients_consultant_status').on(table.consultantId, table.connectionStatus),
    // New indexes for marketplace queries
    index('idx_consultant_clients_relationship_type').on(table.relationshipType),
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
  inviteEmail: string | null; // Nullable for marketplace flows
  inviteToken: string | null; // Nullable for marketplace flows
  inviteExpiresAt: Date | null; // Nullable for marketplace flows
  clientName: string | null;
  relationshipType: RelationshipType;
  connectionStatus: ConnectionStatus;
  invitedAt: Date;
}

/**
 * Type for linked client response (what the API returns)
 */
export interface LinkedClient {
  id: string;
  consultantId: string;
  clientId: string;
  inviteEmail: string | null; // Nullable for marketplace flows
  clientName: string | null;
  relationshipType: RelationshipType;
  connectionStatus: ConnectionStatus;
  linkedAt: Date;
  acceptedAt: Date | null;
  // Joined from user_profiles
  fullName?: string;
  company?: string;
}

/**
 * Type for connection request response (marketplace flows)
 * @story US-PH03, US-FM03
 */
export interface ConnectionRequest {
  id: string;
  consultantId: string;
  clientId: string | null;
  relationshipType: RelationshipType;
  connectionStatus: ConnectionStatus;
  initiatedBy: InitiatedBy;
  requestMessage: string | null;
  createdAt: Date;
  // Joined from user_profiles (for display)
  consultantName?: string;
  consultantOrganization?: string;
  founderName?: string;
  founderCompany?: string;
}
