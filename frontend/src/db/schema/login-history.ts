/**
 * Login History Schema
 *
 * Stores user login events for security monitoring.
 *
 * @story US-AS04
 */

import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const loginHistory = pgTable('login_history', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id').notNull(),

  // Login details
  loginMethod: text('login_method').notNull(), // 'password', 'oauth_github', 'oauth_google', etc.
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceType: text('device_type'), // 'desktop', 'mobile', 'tablet'
  browser: text('browser'),
  operatingSystem: text('operating_system'),
  location: text('location'), // Approximate location from IP

  // Status
  success: boolean('success').default(true).notNull(),
  failureReason: text('failure_reason'),
  isSuspicious: boolean('is_suspicious').default(false).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type LoginHistory = typeof loginHistory.$inferSelect;
export type NewLoginHistory = typeof loginHistory.$inferInsert;
