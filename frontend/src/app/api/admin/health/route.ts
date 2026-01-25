/**
 * Admin System Health API Route
 *
 * GET: Get system health status (admin only)
 *
 * @story US-A05
 */

import { createClient } from '@/lib/supabase/server';
import { validateAdminRole } from '@/lib/auth/validate-admin';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  handleApiError,
} from '@/lib/api/response';
import type { SystemHealth, ServiceHealth } from '@/lib/types/admin';

const MODAL_ENDPOINT = process.env.MODAL_ENDPOINT_URL || 'https://api.modal.com';

async function checkModalHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${MODAL_ENDPOINT}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      return {
        status: 'healthy',
        latencyMs,
        lastCheck: new Date().toISOString(),
      };
    }

    return {
      status: 'degraded',
      latencyMs,
      lastCheck: new Date().toISOString(),
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'down',
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkSupabaseHealth(supabase: Awaited<ReturnType<typeof createClient>>): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    // Simple query to check database connectivity
    const { error } = await supabase.from('user_profiles').select('id').limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      return {
        status: 'degraded',
        latencyMs,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };
    }

    return {
      status: 'healthy',
      latencyMs,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse();
    }

    // Verify admin role
    const { isAdmin, error: adminError } = await validateAdminRole(supabase, user.id);
    if (!isAdmin) {
      return forbiddenResponse(adminError || 'Admin access required');
    }

    // Check service health in parallel
    const [modalHealth, supabaseHealth] = await Promise.all([
      checkModalHealth(),
      checkSupabaseHealth(supabase),
    ]);

    // Get workflow stats from multiple sources
    const workflowStats = {
      active: 0,
      failed24h: 0,
      pendingHitl: 0,
    };

    // Query workflow counts in parallel with proper error handling
    try {
      const [activeResult, failedResult, pendingHitlResult] = await Promise.all([
        // Active workflows from crewai_validation_states
        supabase
          .from('crewai_validation_states')
          .select('*', { count: 'exact', head: true })
          .in('run_status', ['running', 'pending', 'in_progress']),

        // Failed workflows in last 24 hours
        supabase
          .from('crewai_validation_states')
          .select('*', { count: 'exact', head: true })
          .in('run_status', ['failed', 'error', 'timeout'])
          .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

        // Pending HITL approvals
        supabase
          .from('approval_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      if (activeResult.count !== null) workflowStats.active = activeResult.count;
      if (failedResult.count !== null) workflowStats.failed24h = failedResult.count;
      if (pendingHitlResult.count !== null) workflowStats.pendingHitl = pendingHitlResult.count;
    } catch (err) {
      // Log but don't fail - workflow stats are non-critical
      console.warn('[api/admin/health] Failed to fetch workflow stats:', err);
    }

    // Get recent errors from security audit log
    const { data: recentErrors } = await supabase
      .from('security_audit_log')
      .select('id, user_id, event_type, event_description, created_at')
      .eq('severity', 'critical')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    const errorRate1h = recentErrors?.length || 0;

    // Determine overall status
    const statuses = [modalHealth.status, supabaseHealth.status];
    let overall: 'healthy' | 'degraded' | 'down' = 'healthy';

    if (statuses.some((s) => s === 'down')) {
      overall = 'down';
    } else if (statuses.some((s) => s === 'degraded')) {
      overall = 'degraded';
    }

    const health: SystemHealth = {
      overall,
      lastCheck: new Date().toISOString(),
      services: {
        modal: modalHealth,
        supabase: supabaseHealth,
      },
      workflows: workflowStats,
      errors: {
        rate1h: errorRate1h,
        recent: (recentErrors || []).map((e) => ({
          id: e.id,
          userId: e.user_id,
          errorType: e.event_type,
          message: e.event_description || e.event_type,
          timestamp: e.created_at,
        })),
      },
    };

    return successResponse(health);
  } catch (error) {
    return handleApiError(error, 'api/admin/health');
  }
}
