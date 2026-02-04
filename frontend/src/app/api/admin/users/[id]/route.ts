/**
 * Admin User Profile API Route
 *
 * GET: Get detailed user profile (admin only)
 * PATCH: Update user role (admin only)
 *
 * @story US-A02, US-A08
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminRole } from '@/lib/auth/validate-admin';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  handleApiError,
} from '@/lib/api/response';
import { logAdminAction, logRoleChange, ADMIN_ACTION_TYPES } from '@/lib/admin/audit';
import { z } from 'zod';

const RoleChangeSchema = z.object({
  newRole: z.enum(['admin', 'founder', 'consultant', 'trial']),
  reason: z.string().min(1, 'Reason is required').max(500),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
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

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        company,
        role,
        subscription_tier,
        subscription_status,
        plan_status,
        trial_intent,
        consultant_id,
        timezone,
        language,
        bio,
        trial_expires_at,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return notFoundResponse('User');
    }

    // Fetch user's projects
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        validation_stage,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent activity from security audit log
    const { data: activity } = await supabase
      .from('security_audit_log')
      .select(`
        id,
        event_type,
        event_description,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Log the view action
    await logAdminAction({
      adminId: user.id,
      actionType: ADMIN_ACTION_TYPES.USER_VIEW,
      actionDescription: `Viewed user profile: ${profile.email}`,
      targetUserId: userId,
    });

    // Transform response
    const userProfile = {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      company: profile.company,
      role: profile.role,
      subscriptionTier: profile.subscription_tier,
      subscriptionStatus: profile.subscription_status,
      planStatus: profile.plan_status,
      trialIntent: profile.trial_intent,
      consultantId: profile.consultant_id,
      timezone: profile.timezone,
      language: profile.language,
      bio: profile.bio,
      trialExpiresAt: profile.trial_expires_at,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      projects: (projects || []).map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        validationStage: p.validation_stage,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
      recentActivity: (activity || []).map((a) => ({
        id: a.id,
        type: a.event_type,
        description: a.event_description || a.event_type,
        createdAt: a.created_at,
      })),
    };

    return successResponse({ user: userProfile });
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
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

    // Parse and validate request body
    const body = await request.json();
    const result = RoleChangeSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.flatten());
    }

    const { newRole, reason } = result.data;

    // Get current user profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('id', userId)
      .single();

    if (fetchError || !currentProfile) {
      return notFoundResponse('User');
    }

    // Prevent self-demotion from admin
    if (userId === user.id && currentProfile.role === 'admin' && newRole !== 'admin') {
      return forbiddenResponse('Cannot change your own admin role');
    }

    const oldRole = currentProfile.role;

    // Update role
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, email, role')
      .single();

    if (updateError) {
      console.error('[api/admin/users/[id]] Update error:', updateError);
      throw updateError;
    }

    // Log the role change
    await logRoleChange(user.id, userId, oldRole, newRole, reason);

    return successResponse({
      user: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        role: updatedProfile.role,
      },
      message: `Role changed from ${oldRole} to ${newRole}`,
    });
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]');
  }
}
