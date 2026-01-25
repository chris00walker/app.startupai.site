/**
 * User Sessions Schema
 *
 * Tracks active user sessions for device management.
 * Enables users to see where they're logged in and revoke sessions.
 *
 * @story US-AS05
 */

import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id').notNull(),

  // Session identifiers
  sessionToken: text('session_token').notNull().unique(),

  // Device information (same as login_history for consistency)
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceType: text('device_type'), // 'desktop', 'mobile', 'tablet'
  browser: text('browser'),
  operatingSystem: text('operating_system'),
  location: text('location'),

  // Session metadata
  deviceName: text('device_name'), // User-friendly name like "Chrome on Windows"
  isCurrent: boolean('is_current').default(false).notNull(), // Is this the current session?
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
