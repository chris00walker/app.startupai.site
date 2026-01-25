/**
 * Security Audit Logging Utility
 *
 * Provides functions to log security-sensitive actions for audit and compliance.
 *
 * @story US-AS02, US-AS03, US-AS04, US-AS05
 */

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { SECURITY_EVENT_TYPES, type SecurityEventType } from '@/db/schema/security-audit-log';

export { SECURITY_EVENT_TYPES };
export type { SecurityEventType };

export type AuditLogSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogEntry {
  userId: string;
  eventType: SecurityEventType;
  eventDescription?: string;
  severity?: AuditLogSeverity;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a security event to the audit log
 *
 * This function is non-blocking and will not throw errors - it logs failures
 * but doesn't affect the calling code.
 *
 * @param entry - The audit log entry to record
 */
export async function logSecurityEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();

    // Get request context
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // Insert audit log entry
    const { error } = await supabase
      .from('security_audit_log')
      .insert({
        user_id: entry.userId,
        event_type: entry.eventType,
        event_description: entry.eventDescription,
        severity: entry.severity || 'info',
        ip_address: ipAddress,
        user_agent: userAgent.substring(0, 500),
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      });

    if (error) {
      console.error('[audit-log] Failed to log security event:', error);
    } else {
      console.log('[audit-log] Security event logged:', entry.eventType);
    }
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('[audit-log] Error logging security event:', error);
  }
}

/**
 * Log a password change event
 */
export async function logPasswordChange(userId: string, success: boolean): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: success ? SECURITY_EVENT_TYPES.PASSWORD_CHANGE : SECURITY_EVENT_TYPES.PASSWORD_CHANGE_FAILED,
    eventDescription: success ? 'Password changed successfully' : 'Password change attempt failed',
    severity: success ? 'info' : 'warning',
  });
}

/**
 * Log a 2FA status change event
 */
export async function log2FAChange(userId: string, enabled: boolean): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: enabled ? SECURITY_EVENT_TYPES.TWO_FACTOR_ENABLED : SECURITY_EVENT_TYPES.TWO_FACTOR_DISABLED,
    eventDescription: enabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
    severity: enabled ? 'info' : 'warning',
  });
}

/**
 * Log a 2FA verification event
 */
export async function log2FAVerification(userId: string, success: boolean): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: success ? SECURITY_EVENT_TYPES.TWO_FACTOR_VERIFY_SUCCESS : SECURITY_EVENT_TYPES.TWO_FACTOR_VERIFY_FAILED,
    eventDescription: success ? '2FA code verified successfully' : '2FA verification failed',
    severity: success ? 'info' : 'warning',
  });
}

/**
 * Log a recovery code usage event
 */
export async function logRecoveryCodeUsage(userId: string, success: boolean, remainingCodes?: number): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: success ? SECURITY_EVENT_TYPES.RECOVERY_CODE_USED : SECURITY_EVENT_TYPES.RECOVERY_CODE_FAILED,
    eventDescription: success
      ? `Recovery code used successfully (${remainingCodes ?? 'unknown'} remaining)`
      : 'Recovery code validation failed',
    severity: success ? 'warning' : 'critical', // Recovery code usage is always notable
    metadata: success ? { remainingCodes } : undefined,
  });
}

/**
 * Log a session revocation event
 */
export async function logSessionRevocation(userId: string, sessionId?: string): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: sessionId ? SECURITY_EVENT_TYPES.SESSION_REVOKED : SECURITY_EVENT_TYPES.ALL_SESSIONS_REVOKED,
    eventDescription: sessionId
      ? `Session revoked: ${sessionId.substring(0, 8)}...`
      : 'All sessions revoked',
    severity: 'info',
    resourceType: sessionId ? 'session' : undefined,
    resourceId: sessionId,
  });
}

/**
 * Log a suspicious activity event
 */
export async function logSuspiciousActivity(
  userId: string,
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    userId,
    eventType: SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY,
    eventDescription: description,
    severity: 'critical',
    metadata,
  });
}
