/**
 * Admin Audit Logging Utility
 *
 * Provides functions to log administrative actions for audit and compliance.
 * Distinct from security audit logging which tracks user security events.
 *
 * @story US-A07
 */

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { ADMIN_ACTION_TYPES, type AdminActionType } from '@/db/schema/admin-audit-log';

export { ADMIN_ACTION_TYPES };
export type { AdminActionType };

export interface AdminAuditEntry {
  adminId: string;
  actionType: AdminActionType;
  actionDescription?: string;
  targetUserId?: string;
  targetResourceType?: string;
  targetResourceId?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  reason?: string;
}

/**
 * Log an admin action to the audit log.
 *
 * This function is non-blocking and will not throw errors - it logs failures
 * but doesn't affect the calling code.
 *
 * @param entry - The audit log entry to record
 *
 * @example
 * ```ts
 * await logAdminAction({
 *   adminId: user.id,
 *   actionType: ADMIN_ACTION_TYPES.USER_ROLE_CHANGE,
 *   targetUserId: targetUser.id,
 *   oldValue: { role: 'trial' },
 *   newValue: { role: 'founder' },
 *   reason: 'User completed trial',
 * });
 * ```
 */
export async function logAdminAction(entry: AdminAuditEntry): Promise<void> {
  try {
    const supabase = await createClient();

    // Get request context
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // Insert audit log entry
    const { error } = await supabase.from('admin_audit_log').insert({
      admin_id: entry.adminId,
      action_type: entry.actionType,
      action_description: entry.actionDescription,
      target_user_id: entry.targetUserId || null,
      target_resource_type: entry.targetResourceType || null,
      target_resource_id: entry.targetResourceId || null,
      old_value: entry.oldValue || null,
      new_value: entry.newValue || null,
      audit_reason: entry.reason || null,
      ip_address: ipAddress,
      user_agent: userAgent.substring(0, 500),
    });

    if (error) {
      console.error('[admin-audit] Failed to log admin action:', error);
    } else {
      console.log('[admin-audit] Admin action logged:', entry.actionType);
    }
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('[admin-audit] Error logging admin action:', error);
  }
}

/**
 * Log a user impersonation start event.
 */
export async function logImpersonationStart(
  adminId: string,
  targetUserId: string,
  reason: string
): Promise<void> {
  await logAdminAction({
    adminId,
    actionType: ADMIN_ACTION_TYPES.USER_IMPERSONATE,
    actionDescription: 'Started impersonation session',
    targetUserId,
    reason,
  });
}

/**
 * Log a user impersonation end event.
 */
export async function logImpersonationEnd(adminId: string, targetUserId: string): Promise<void> {
  await logAdminAction({
    adminId,
    actionType: ADMIN_ACTION_TYPES.USER_IMPERSONATE_END,
    actionDescription: 'Ended impersonation session',
    targetUserId,
  });
}

/**
 * Log a user role change event.
 */
export async function logRoleChange(
  adminId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  reason?: string
): Promise<void> {
  await logAdminAction({
    adminId,
    actionType: ADMIN_ACTION_TYPES.USER_ROLE_CHANGE,
    actionDescription: `Changed user role from ${oldRole} to ${newRole}`,
    targetUserId,
    oldValue: { role: oldRole },
    newValue: { role: newRole },
    reason,
  });
}

/**
 * Log a feature flag change event.
 */
export async function logFeatureFlagChange(
  adminId: string,
  flagId: string,
  flagKey: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  reason: string
): Promise<void> {
  await logAdminAction({
    adminId,
    actionType: ADMIN_ACTION_TYPES.FEATURE_FLAG_UPDATE,
    actionDescription: `Updated feature flag: ${flagKey}`,
    targetResourceType: 'feature_flag',
    targetResourceId: flagId,
    oldValue,
    newValue,
    reason,
  });
}

/**
 * Log a workflow retry event.
 */
export async function logWorkflowRetry(
  adminId: string,
  workflowId: string,
  targetUserId?: string,
  reason?: string
): Promise<void> {
  await logAdminAction({
    adminId,
    actionType: ADMIN_ACTION_TYPES.WORKFLOW_RETRY,
    actionDescription: 'Retried failed workflow',
    targetUserId,
    targetResourceType: 'workflow',
    targetResourceId: workflowId,
    reason,
  });
}

/**
 * Log a data export start event.
 */
export async function logDataExportStart(
  adminId: string,
  targetUserId: string,
  exportType: string
): Promise<void> {
  await logAdminAction({
    adminId,
    actionType: ADMIN_ACTION_TYPES.DATA_EXPORT_START,
    actionDescription: `Started ${exportType} data export`,
    targetUserId,
    newValue: { exportType },
  });
}

/**
 * Log a billing action event.
 */
export async function logBillingAction(
  adminId: string,
  targetUserId: string,
  actionType: 'retry' | 'refund' | 'credit',
  details: Record<string, unknown>,
  reason?: string
): Promise<void> {
  const actionMap = {
    retry: ADMIN_ACTION_TYPES.BILLING_RETRY,
    refund: ADMIN_ACTION_TYPES.BILLING_REFUND,
    credit: ADMIN_ACTION_TYPES.BILLING_CREDIT,
  };

  await logAdminAction({
    adminId,
    actionType: actionMap[actionType],
    actionDescription: `Billing ${actionType} action`,
    targetUserId,
    newValue: details,
    reason,
  });
}

/**
 * Log an ad platform connection change event.
 */
export async function logAdPlatformAction(
  adminId: string,
  action: 'connect' | 'disconnect' | 'update',
  platformId: string,
  platformName: string,
  details?: Record<string, unknown>
): Promise<void> {
  const actionMap = {
    connect: ADMIN_ACTION_TYPES.AD_PLATFORM_CONNECT,
    disconnect: ADMIN_ACTION_TYPES.AD_PLATFORM_DISCONNECT,
    update: ADMIN_ACTION_TYPES.AD_PLATFORM_UPDATE,
  };

  await logAdminAction({
    adminId,
    actionType: actionMap[action],
    actionDescription: `${action} ad platform: ${platformName}`,
    targetResourceType: 'ad_platform',
    targetResourceId: platformId,
    newValue: details,
  });
}
