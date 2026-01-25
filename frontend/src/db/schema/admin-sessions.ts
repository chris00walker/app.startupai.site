/**
 * Admin Sessions Schema
 *
 * Tracks admin impersonation sessions for debugging and support.
 * When an admin impersonates a user, they can view the app from that user's
 * perspective in read-only mode.
 *
 * Security Model:
 * - Admins cannot impersonate other admins
 * - All actions during impersonation are blocked (read-only mode)
 * - Sessions expire after 30 minutes
 * - All impersonation sessions are logged to admin_audit_log
 *
 * @story US-A03
 */

import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // The admin who started the impersonation session
    adminId: uuid('admin_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),

    // The user being impersonated
    impersonatingUserId: uuid('impersonating_user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),

    // Secure session token (stored in httpOnly cookie)
    sessionToken: text('session_token').notNull().unique(),

    // Admin-provided reason for impersonation (required)
    reason: text('reason').notNull(),

    // Session lifecycle
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_admin_sessions_token').on(table.sessionToken),
    index('idx_admin_sessions_admin').on(table.adminId),
    index('idx_admin_sessions_expires').on(table.expiresAt),
  ]
);

export type AdminSession = typeof adminSessions.$inferSelect;
export type NewAdminSession = typeof adminSessions.$inferInsert;

/**
 * Maximum impersonation session duration (30 minutes)
 */
export const MAX_IMPERSONATION_DURATION_MS = 30 * 60 * 1000;

/**
 * Maximum concurrent impersonation sessions per admin
 */
export const MAX_CONCURRENT_IMPERSONATIONS = 1;
