/**
 * User Integrations Schema
 *
 * Stores OAuth tokens and preferences for external service integrations.
 * Supports 10 integration types across 6 categories.
 *
 * @story US-I01, US-I02, US-I03, US-I04, US-I05, US-I06
 */

import { pgEnum, pgTable, text, timestamp, uuid, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Integration type enum - all supported external services.
 *
 * Categories:
 * - Collaboration: slack, lark, notion
 * - Storage: google_drive, dropbox
 * - Project Management: linear, airtable
 * - Sales: hubspot
 * - Creation: figma
 * - Development: github
 */
export const integrationTypeEnum = pgEnum('integration_type', [
  'slack',
  'lark',
  'notion',
  'google_drive',
  'dropbox',
  'linear',
  'airtable',
  'hubspot',
  'figma',
  'github',
]);

/**
 * Integration status enum - connection lifecycle states.
 *
 * - active: Connected and tokens valid
 * - expired: Token has expired, needs reconnection
 * - revoked: User revoked access on provider side
 * - error: Connection error occurred
 */
export const integrationStatusEnum = pgEnum('integration_status', [
  'active',
  'expired',
  'revoked',
  'error',
]);

/**
 * User integrations table - stores OAuth tokens and connection state.
 *
 * SECURITY: access_token and refresh_token are never exposed to the client.
 * They are only used server-side for OAuth operations.
 */
export const userIntegrations = pgTable(
  'user_integrations',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    userId: uuid('user_id').notNull(),
    integrationType: integrationTypeEnum('integration_type').notNull(),
    status: integrationStatusEnum('status').default('active').notNull(),

    // OAuth tokens (never exposed to client)
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),

    // Provider account info (safe to expose)
    providerAccountId: text('provider_account_id'),
    providerAccountName: text('provider_account_name'),
    providerAccountEmail: text('provider_account_email'),

    // n8n sync tracking (stub for future use)
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),

    // Timestamps
    connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('user_integrations_user_id_idx').on(table.userId),
    index('user_integrations_status_idx').on(table.status),
    uniqueIndex('user_integrations_user_type_unique').on(table.userId, table.integrationType),
  ]
);

/**
 * User integration preferences table - stores per-integration settings.
 *
 * Preferences are stored as JSONB to allow flexible schema per integration type.
 * Examples:
 * - Slack: { channel: "#startupai-updates", notifyOnComplete: true }
 * - Notion: { workspaceId: "...", parentPageId: "...", autoExport: true }
 * - Google Drive: { folderId: "...", folderPath: "/StartupAI/Exports" }
 */
export const userIntegrationPreferences = pgTable(
  'user_integration_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    userId: uuid('user_id').notNull(),
    integrationType: integrationTypeEnum('integration_type').notNull(),

    // Flexible preferences storage
    preferences: jsonb('preferences').default({}).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('user_integration_prefs_user_id_idx').on(table.userId),
    uniqueIndex('user_integration_prefs_user_type_unique').on(table.userId, table.integrationType),
  ]
);

// Type exports
export type IntegrationType = (typeof integrationTypeEnum.enumValues)[number];
export type IntegrationStatus = (typeof integrationStatusEnum.enumValues)[number];
export type UserIntegration = typeof userIntegrations.$inferSelect;
export type NewUserIntegration = typeof userIntegrations.$inferInsert;
export type UserIntegrationPreferences = typeof userIntegrationPreferences.$inferSelect;
export type NewUserIntegrationPreferences = typeof userIntegrationPreferences.$inferInsert;
