/**
 * Admin Audit Log Schema
 *
 * Records all administrative actions for audit, compliance, and debugging.
 * Distinct from security_audit_log which tracks user security events.
 *
 * @story US-A07
 */

import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

/**
 * Admin action type constants for consistency
 */
export const ADMIN_ACTION_TYPES = {
  // User Management
  USER_SEARCH: 'user_search',
  USER_VIEW: 'user_view',
  USER_IMPERSONATE: 'user_impersonate',
  USER_IMPERSONATE_END: 'user_impersonate_end',
  USER_ROLE_CHANGE: 'user_role_change',

  // Workflow Operations
  WORKFLOW_RETRY: 'workflow_retry',
  WORKFLOW_CANCEL: 'workflow_cancel',

  // Feature Flags
  FEATURE_FLAG_CREATE: 'feature_flag_create',
  FEATURE_FLAG_UPDATE: 'feature_flag_update',
  FEATURE_FLAG_DELETE: 'feature_flag_delete',

  // Data Operations
  DATA_EXPORT_START: 'data_export_start',
  DATA_EXPORT_COMPLETE: 'data_export_complete',
  INTEGRITY_CHECK_RUN: 'integrity_check_run',

  // Authentication
  ADMIN_LOGIN: 'admin_login',
  ADMIN_LOGOUT: 'admin_logout',

  // Billing
  BILLING_RETRY: 'billing_retry',
  BILLING_REFUND: 'billing_refund',
  BILLING_CREDIT: 'billing_credit',

  // Ad Platform
  AD_PLATFORM_CONNECT: 'ad_platform_connect',
  AD_PLATFORM_DISCONNECT: 'ad_platform_disconnect',
  AD_PLATFORM_UPDATE: 'ad_platform_update',
} as const;

export type AdminActionType = (typeof ADMIN_ACTION_TYPES)[keyof typeof ADMIN_ACTION_TYPES];

export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // Admin who performed the action
    adminId: uuid('admin_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'set null' }),

    // Action details
    actionType: text('action_type').notNull(),
    actionDescription: text('action_description'),

    // Target of the action (optional)
    targetUserId: uuid('target_user_id').references(() => userProfiles.id, { onDelete: 'set null' }),
    targetResourceType: text('target_resource_type'), // 'feature_flag', 'workflow', 'ad_platform', etc.
    targetResourceId: text('target_resource_id'),

    // Before/after values for audit trail
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),

    // Admin-provided reason for the action (required for sensitive operations)
    reason: text('reason'),

    // Request context
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_admin_audit_admin_id').on(table.adminId),
    index('idx_admin_audit_action_type').on(table.actionType),
    index('idx_admin_audit_target_user').on(table.targetUserId),
    index('idx_admin_audit_created_at').on(table.createdAt),
  ]
);

export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditLog = typeof adminAuditLog.$inferInsert;
