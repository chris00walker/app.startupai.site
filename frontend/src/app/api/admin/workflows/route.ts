/**
 * Admin Failed Workflows API Route
 *
 * GET: List failed CrewAI workflows with filtering and pagination (admin only)
 *
 * @story US-A04
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminRole } from '@/lib/auth/validate-admin';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  handleApiError,
  parsePagination,
} from '@/lib/api/response';

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'failed', 'error', 'timeout', 'all'
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const phase = searchParams.get('phase');
    const { limit, offset } = parsePagination(searchParams);

    // Build query for failed workflows
    // Note: run_status column exists in DB but not yet in Drizzle schema
    let query = supabase
      .from('crewai_validation_states')
      .select(
        `
        id,
        run_id,
        user_id,
        project_id,
        run_status,
        phase,
        current_crew,
        error_message,
        updated_at,
        created_at
      `,
        { count: 'exact' }
      );

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('run_status', status);
    } else {
      // Default to showing failed/error/timeout states
      query = query.in('run_status', ['failed', 'error', 'timeout']);
    }

    // Apply additional filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (phase) {
      query = query.eq('phase', phase);
    }

    // Apply pagination and ordering
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: workflows, error: queryError, count } = await query;

    if (queryError) {
      console.error('[api/admin/workflows] Query error:', queryError);
      throw queryError;
    }

    // Get user emails and project names for display
    const userIds = [...new Set((workflows || []).map((w) => w.user_id))];
    const projectIds = [...new Set((workflows || []).map((w) => w.project_id))];

    const [usersResult, projectsResult] = await Promise.all([
      userIds.length > 0
        ? supabase.from('user_profiles').select('id, email').in('id', userIds)
        : { data: [] },
      projectIds.length > 0
        ? supabase.from('projects').select('id, name').in('id', projectIds)
        : { data: [] },
    ]);

    const userMap = new Map<string, string>(
      usersResult.data?.map((u): [string, string] => [u.id, u.email]) || []
    );
    const projectMap = new Map<string, string>(
      projectsResult.data?.map((p): [string, string] => [p.id, p.name]) || []
    );

    // Transform response
    const transformedWorkflows = (workflows || []).map((w) => ({
      id: w.id,
      runId: w.run_id || w.id,
      userId: w.user_id,
      userEmail: userMap.get(w.user_id) || 'Unknown',
      projectId: w.project_id,
      projectName: projectMap.get(w.project_id) || 'Unknown',
      status: w.run_status,
      phase: w.phase,
      crew: w.current_crew,
      errorMessage: w.error_message,
      failedAt: w.updated_at,
      createdAt: w.created_at,
    }));

    // Get stats for the response
    const statsQuery = await supabase
      .from('crewai_validation_states')
      .select('run_status', { count: 'exact', head: true })
      .in('run_status', ['failed', 'error', 'timeout']);

    return successResponse(
      {
        workflows: transformedWorkflows,
        stats: {
          total: count || 0,
          failed: statsQuery.count || 0,
        },
      },
      { total: count || 0, limit, offset }
    );
  } catch (error) {
    return handleApiError(error, 'api/admin/workflows');
  }
}
