/**
 * Admin Audit Logs API Route
 *
 * GET: List admin audit logs with filtering (admin only)
 *
 * @story US-A07
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
    const actionType = searchParams.get('actionType');
    const adminId = searchParams.get('adminId');
    const targetUserId = searchParams.get('targetUserId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const { limit, offset } = parsePagination(searchParams);

    // Build query
    let query = supabase
      .from('admin_audit_log')
      .select('*', { count: 'exact' });

    // Apply filters
    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    if (targetUserId) {
      query = query.eq('target_user_id', targetUserId);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logs, error: queryError, count } = await query;

    if (queryError) {
      console.error('[api/admin/audit] Query error:', queryError);
      throw queryError;
    }

    // Get admin emails for display
    const adminIds = [...new Set((logs || []).map((l) => l.admin_id))];
    const targetUserIds = [...new Set((logs || []).filter((l) => l.target_user_id).map((l) => l.target_user_id))];
    const allUserIds = [...new Set([...adminIds, ...targetUserIds])];

    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, email')
      .in('id', allUserIds);

    const userMap = new Map(users?.map((u) => [u.id, u.email]) || []);

    // Transform response
    const transformedLogs = (logs || []).map((l) => ({
      id: l.id,
      adminId: l.admin_id,
      adminEmail: userMap.get(l.admin_id) || 'Unknown',
      actionType: l.action_type,
      actionDescription: l.action_description,
      targetUserId: l.target_user_id,
      targetUserEmail: l.target_user_id ? userMap.get(l.target_user_id) || null : null,
      targetResourceType: l.target_resource_type,
      targetResourceId: l.target_resource_id,
      oldValue: l.old_value,
      newValue: l.new_value,
      reason: l.audit_reason,
      ipAddress: l.ip_address,
      createdAt: l.created_at,
    }));

    return successResponse(
      { logs: transformedLogs },
      { total: count || 0, limit, offset }
    );
  } catch (error) {
    return handleApiError(error, 'api/admin/audit');
  }
}
