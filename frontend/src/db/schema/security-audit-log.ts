/**
 * Security Audit Log Schema
 *
 * Records all security-sensitive actions for audit and compliance.
 *
 * @story US-AS02, US-AS03, US-AS04, US-AS05
 */

import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const securityAuditLog = pgTable('security_audit_log', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id').notNull(),

  // Event information
  eventType: text('event_type').notNull(), // 'password_change', '2fa_enable', '2fa_disable', 'session_revoke', 'recovery_code_used', etc.
  eventDescription: text('event_description'),
  severity: text('severity').default('info').notNull(), // 'info', 'warning', 'critical'

  // Request context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  resourceType: text('resource_type'), // What resource was affected (optional)
  resourceId: text('resource_id'), // ID of affected resource (optional)

  // Additional metadata as JSON
  metadata: jsonb('metadata'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SecurityAuditLog = typeof securityAuditLog.$inferSelect;
export type NewSecurityAuditLog = typeof securityAuditLog.$inferInsert;

// Event type constants for consistency
export const SECURITY_EVENT_TYPES = {
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_CHANGE_FAILED: 'password_change_failed',
  TWO_FACTOR_ENABLED: '2fa_enabled',
  TWO_FACTOR_DISABLED: '2fa_disabled',
  TWO_FACTOR_VERIFY_SUCCESS: '2fa_verify_success',
  TWO_FACTOR_VERIFY_FAILED: '2fa_verify_failed',
  RECOVERY_CODE_USED: 'recovery_code_used',
  RECOVERY_CODE_FAILED: 'recovery_code_failed',
  SESSION_CREATED: 'session_created',
  SESSION_REVOKED: 'session_revoked',
  ALL_SESSIONS_REVOKED: 'all_sessions_revoked',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PROFILE_UPDATED: 'profile_updated',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
} as const;

export type SecurityEventType = typeof SECURITY_EVENT_TYPES[keyof typeof SECURITY_EVENT_TYPES];
