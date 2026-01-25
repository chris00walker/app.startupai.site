/**
 * Ad Platform Connections Schema
 *
 * Stores StartupAI's business account connections to ad platforms.
 * Admin managed - used for agency-level access to Meta, Google, TikTok, etc.
 *
 * @story US-AM01, US-AM02, US-AM03, US-AM06, US-AM07
 */

import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Supported ad platforms for validation campaigns.
 * Initial launch: Meta, Google
 * Phase 2: TikTok, LinkedIn
 * Phase 3: X (Twitter), Pinterest
 */
export const adPlatformEnum = pgEnum('ad_platform', [
  'meta',
  'google',
  'tiktok',
  'linkedin',
  'x',
  'pinterest',
]);

/**
 * Connection status for ad platform integrations.
 */
export const adPlatformStatusEnum = pgEnum('ad_platform_status', [
  'active',
  'paused',
  'error',
  'expired',
]);

export const adPlatformConnections = pgTable('ad_platform_connections', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Platform identification
  platform: adPlatformEnum('platform').notNull(),
  accountId: text('account_id').notNull(),
  accountName: text('account_name'),

  // Encrypted credentials (API keys, OAuth tokens)
  // Stored as encrypted JSON string, decrypted at application layer
  credentialsEncrypted: text('credentials_encrypted').notNull(),

  // Business Manager / Agency Account IDs
  businessManagerId: text('business_manager_id'),
  agencyAccountId: text('agency_account_id'),

  // Webhook configuration
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),

  // Status and health
  status: adPlatformStatusEnum('status').default('active').notNull(),
  lastHealthCheck: timestamp('last_health_check', { withTimezone: true }),
  lastSuccessfulCall: timestamp('last_successful_call', { withTimezone: true }),
  errorMessage: text('error_message'),
  errorCode: text('error_code'),

  // Rate limiting tracking
  rateLimitRemaining: text('rate_limit_remaining'),
  rateLimitResetAt: timestamp('rate_limit_reset_at', { withTimezone: true }),

  // Credential expiry tracking
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AdPlatformConnection = typeof adPlatformConnections.$inferSelect;
export type NewAdPlatformConnection = typeof adPlatformConnections.$inferInsert;
export type AdPlatform = (typeof adPlatformEnum.enumValues)[number];
export type AdPlatformStatus = (typeof adPlatformStatusEnum.enumValues)[number];
