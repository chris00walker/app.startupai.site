/**
 * Admin User Data Integrity Check API Route
 *
 * POST: Run integrity checks for a user
 * GET: Get recent integrity check results
 *
 * @story US-A10
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { validateAdminRole } from '@/lib/auth/validate-admin';
import { logAdminAction } from '@/lib/admin/audit';
import { runIntegrityChecks } from '@/lib/admin/integrity';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  handleApiError,
} from '@/lib/api/response';

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

    // Run integrity checks
    const result = await runIntegrityChecks(admin, targetUserId);

    // Log the integrity check
    logAdminAction({
      adminId: user.id,
      actionType: 'integrity_check_run',
      targetUserId,
      oldValue: null,
      newValue: {
        checksRun: result.checksRun,
        status: result.status,
        issueCount: result.issuesFound.length,
      },
      reason: 'Data integrity check',
    });

    return successResponse({
      result,
      user: {
        id: targetUser.id,
        email: targetUser.email,
      },
    });
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]/integrity');
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

    // For now, return checks available
    // In a full implementation, this would return stored check results
    return successResponse({
      availableChecks: [
        'User Profile',
        'Project Ownership',
        'Hypotheses Integrity',
        'Evidence Integrity',
        'Validation State Integrity',
      ],
      lastCheckAt: null,
      lastCheckResult: null,
    });
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]/integrity');
  }
}
