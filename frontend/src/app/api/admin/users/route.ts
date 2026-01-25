/**
 * Admin Users API Route
 *
 * GET: Search users by email, name, or project ID (admin only)
 *
 * @story US-A01
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
import { logAdminAction, ADMIN_ACTION_TYPES } from '@/lib/admin/audit';

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
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const projectId = searchParams.get('projectId');
    const role = searchParams.get('role');
    const { limit, offset } = parsePagination(searchParams);

    // Build query
    let query = supabase.from('user_profiles').select(
      `
        id,
        email,
        full_name,
        company,
        role,
        subscription_tier,
        subscription_status,
        plan_status,
        trial_intent,
        created_at,
        updated_at
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (email) {
      query = query.ilike('email', `%${email}%`);
    }

    if (name) {
      query = query.ilike('full_name', `%${name}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    // If searching by project ID, we need a different approach
    // Find the user who owns that project
    if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      if (project) {
        query = query.eq('id', project.user_id);
      } else {
        // No project found, return empty results
        return successResponse(
          { users: [] },
          { total: 0, limit, offset }
        );
      }
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error: queryError, count } = await query;

    if (queryError) {
      console.error('[api/admin/users] Query error:', queryError);
      throw queryError;
    }

    // Log the search action
    await logAdminAction({
      adminId: user.id,
      actionType: ADMIN_ACTION_TYPES.USER_SEARCH,
      actionDescription: `Searched users: ${email || name || projectId || role || 'all'}`,
      newValue: { filters: { email, name, projectId, role }, resultCount: users?.length || 0 },
    });

    // Transform response to match frontend types
    const transformedUsers = (users || []).map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      company: u.company,
      role: u.role,
      subscriptionTier: u.subscription_tier,
      subscriptionStatus: u.subscription_status,
      planStatus: u.plan_status,
      trialIntent: u.trial_intent,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));

    return successResponse(
      { users: transformedUsers },
      { total: count || 0, limit, offset }
    );
  } catch (error) {
    return handleApiError(error, 'api/admin/users');
  }
}
