/**
 * Admin Dashboard TypeScript Types
 *
 * Shared type definitions for admin features.
 *
 * @story US-A01, US-A02, US-A03, US-A04, US-A05, US-A06, US-A07, US-A08
 */

import type { UserRole } from '@/db/schema';

/**
 * User search result (US-A01)
 */
export interface AdminUserSearchResult {
  id: string;
  email: string;
  fullName: string | null;
  company: string | null;
  role: UserRole;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  planStatus: string;
  trialIntent: string | null;
  createdAt: string;
  updatedAt: string;
  projectCount?: number;
}

/**
 * User profile for admin view (US-A02)
 */
export interface AdminUserProfile extends AdminUserSearchResult {
  consultantId: string | null;
  timezone: string | null;
  language: string | null;
  bio: string | null;
  trialExpiresAt: string | null;
  projects: AdminProjectSummary[];
  recentActivity: AdminActivityEntry[];
}

/**
 * Project summary for admin view
 */
export interface AdminProjectSummary {
  id: string;
  name: string;
  status: string;
  validationStage: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Activity entry for admin view
 */
export interface AdminActivityEntry {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

/**
 * Impersonation session (US-A03)
 */
export interface ImpersonationSession {
  id: string;
  adminId: string;
  impersonatingUserId: string;
  impersonatingUserEmail: string;
  sessionToken: string;
  reason: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Impersonation request payload
 */
export interface ImpersonationRequest {
  reason: string;
}

/**
 * Failed workflow for admin view (US-A04)
 */
export interface AdminWorkflow {
  id: string;
  userId: string;
  userEmail: string;
  projectId: string;
  projectName: string;
  status: 'failed' | 'timeout' | 'cancelled';
  phase: number;
  crewName: string | null;
  errorMessage: string | null;
  failedAt: string;
  retryCount: number;
  lastRetryAt: string | null;
}

/**
 * Workflow retry request
 */
export interface WorkflowRetryRequest {
  reason?: string;
}

/**
 * System health status (US-A05)
 */
export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  services: {
    modal: ServiceHealth;
    supabase: ServiceHealth;
    stripe?: ServiceHealth;
  };
  workflows: {
    active: number;
    failed24h: number;
    pendingHitl: number;
  };
  errors: {
    rate1h: number;
    recent: RecentError[];
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down';
  latencyMs?: number;
  lastCheck: string;
  error?: string;
}

export interface RecentError {
  id: string;
  userId?: string;
  errorType: string;
  message: string;
  timestamp: string;
}

/**
 * Feature flag (US-A06)
 */
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabledGlobally: boolean;
  percentageRollout: number;
  targetUserIds: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feature flag update request
 */
export interface FeatureFlagUpdateRequest {
  enabledGlobally?: boolean;
  percentageRollout?: number;
  targetUserIds?: string[];
  reason: string;
}

/**
 * Audit log entry (US-A07)
 */
export interface AdminAuditLogEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  actionType: string;
  actionDescription: string | null;
  targetUserId: string | null;
  targetUserEmail?: string | null;
  targetResourceType: string | null;
  targetResourceId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
}

/**
 * Audit log filter parameters
 */
export interface AuditLogFilters {
  actionType?: string;
  adminId?: string;
  targetUserId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Role change request (US-A08)
 */
export interface RoleChangeRequest {
  newRole: UserRole;
  reason: string;
}

/**
 * Data export request (US-A09)
 */
export interface DataExportRequest {
  exportType: 'full' | 'projects' | 'activity';
}

/**
 * Data export status
 */
export interface DataExportStatus {
  id: string;
  adminId: string;
  targetUserId: string;
  exportType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl: string | null;
  expiresAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Integrity check result (US-A10)
 */
export interface IntegrityCheckResult {
  id: string;
  adminId: string;
  targetUserId: string;
  status: 'running' | 'passed' | 'issues_found' | 'failed';
  checksRun: number;
  issues: IntegrityIssue[];
  createdAt: string;
  completedAt: string | null;
}

export interface IntegrityIssue {
  check: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Billing info (US-A12)
 */
export interface UserBillingInfo {
  userId: string;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPlan: string;
  nextBillingDate: string | null;
  paymentMethodLast4: string | null;
  paymentMethodBrand: string | null;
  invoices: BillingInvoice[];
}

export interface BillingInvoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  invoiceUrl: string | null;
}

/**
 * Billing action request
 */
export interface BillingActionRequest {
  action: 'retry' | 'refund' | 'credit';
  amount?: number;
  reason: string;
}

/**
 * Admin navigation item
 */
export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number | string;
}

/**
 * Admin dashboard stats
 */
export interface AdminDashboardStats {
  totalUsers: number;
  activeTrials: number;
  activeSubscriptions: number;
  failedWorkflows: number;
  pendingApprovals: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
}
