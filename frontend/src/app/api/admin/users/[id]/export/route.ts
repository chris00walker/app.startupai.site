/**
 * Admin User Data Export API Route
 *
 * POST: Start a data export for a user
 * GET: Get export status and download link
 *
 * @story US-A09
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { validateAdminRole } from '@/lib/auth/validate-admin';
import { logAdminAction } from '@/lib/admin/audit';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  handleApiError,
  validationErrorResponse,
} from '@/lib/api/response';
import { z } from 'zod';

const ExportRequestSchema = z.object({
  exportType: z.enum(['full', 'projects', 'activity']).default('full'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
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

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const result = ExportRequestSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.flatten());
    }

    const { exportType } = result.data;
    const admin = createAdminClient();

    // Verify target user exists
    const { data: targetUser, error: targetError } = await admin
      .from('user_profiles')
      .select('id, email')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUser) {
      return notFoundResponse('User not found');
    }

    // Collect user data based on export type
    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      exportType,
      userId: targetUserId,
      userEmail: targetUser.email,
    };

    // Always include profile
    const { data: profile } = await admin
      .from('user_profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    exportData.profile = profile;

    // Collect projects
    if (exportType === 'full' || exportType === 'projects') {
      const { data: projects } = await admin
        .from('projects')
        .select('*')
        .eq('user_id', targetUserId);

      exportData.projects = projects || [];

      // Get related data for each project
      if (projects && projects.length > 0) {
        const projectIds = projects.map((p) => p.id);

        const [
          { data: hypotheses },
          { data: evidence },
          { data: validationStates },
        ] = await Promise.all([
          admin.from('hypotheses').select('*').in('project_id', projectIds),
          admin.from('evidence').select('*').in('project_id', projectIds),
          admin.from('crewai_validation_states').select('*').in('project_id', projectIds),
        ]);

        exportData.hypotheses = hypotheses || [];
        exportData.evidence = evidence || [];
        exportData.validationStates = validationStates || [];
      }
    }

    // Collect activity
    if (exportType === 'full' || exportType === 'activity') {
      const { data: auditLogs } = await admin
        .from('security_audit_log')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1000);

      exportData.activityLogs = auditLogs || [];
    }

    // Log the export action
    logAdminAction({
      adminId: user.id,
      actionType: 'data_export_start',
      targetUserId,
      oldValue: null,
      newValue: { exportType },
      reason: `Data export requested (${exportType})`,
    });

    // Return export data directly (for small datasets)
    // For large datasets, this could be refactored to use async job + file storage
    return successResponse({
      export: exportData,
      downloadUrl: null, // Would be S3/storage URL for async exports
      format: 'json',
    });
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]/export');
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
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

    // For now, return available export types
    // In a full implementation, this would return the status of pending exports
    return successResponse({
      availableTypes: ['full', 'projects', 'activity'],
      pendingExports: [],
      completedExports: [],
    });
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]/export');
  }
}
