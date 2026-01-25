/**
 * Admin Feature Flags API Route
 *
 * GET: List all feature flags (admin only)
 * POST: Create a new feature flag (admin only)
 * PATCH: Update a feature flag (admin only)
 *
 * @story US-A06
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminRole } from '@/lib/auth/validate-admin';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  handleApiError,
} from '@/lib/api/response';
import { logFeatureFlagChange, logAdminAction, ADMIN_ACTION_TYPES } from '@/lib/admin/audit';
import { z } from 'zod';

const CreateFlagSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Key must be lowercase with underscores'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  enabledGlobally: z.boolean().default(false),
  percentageRollout: z.number().min(0).max(100).default(0),
  targetUserIds: z.array(z.string().uuid()).optional(),
});

const UpdateFlagSchema = z.object({
  id: z.string().uuid(),
  enabledGlobally: z.boolean().optional(),
  percentageRollout: z.number().min(0).max(100).optional(),
  targetUserIds: z.array(z.string().uuid()).optional(),
  reason: z.string().min(1).max(500),
});

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

    // Fetch all feature flags
    const { data: flags, error: queryError } = await supabase
      .from('feature_flags')
      .select('*')
      .order('key');

    if (queryError) {
      console.error('[api/admin/features] Query error:', queryError);
      throw queryError;
    }

    // Transform response
    const transformedFlags = (flags || []).map((f) => ({
      id: f.id,
      key: f.key,
      name: f.name,
      description: f.description,
      enabledGlobally: f.enabled_globally,
      percentageRollout: f.percentage_rollout,
      targetUserIds: f.target_user_ids,
      createdById: f.created_by_id,
      updatedById: f.updated_by_id,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    }));

    return successResponse({ flags: transformedFlags });
  } catch (error) {
    return handleApiError(error, 'api/admin/features');
  }
}

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const result = CreateFlagSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.flatten());
    }

    const { key, name, description, enabledGlobally, percentageRollout, targetUserIds } =
      result.data;

    // Create feature flag
    const { data: flag, error: insertError } = await supabase
      .from('feature_flags')
      .insert({
        key,
        name,
        description,
        enabled_globally: enabledGlobally,
        percentage_rollout: percentageRollout,
        target_user_ids: targetUserIds?.join(',') || null,
        created_by_id: user.id,
        updated_by_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[api/admin/features] Insert error:', insertError);
      throw insertError;
    }

    // Log the action
    await logAdminAction({
      adminId: user.id,
      actionType: ADMIN_ACTION_TYPES.FEATURE_FLAG_CREATE,
      actionDescription: `Created feature flag: ${key}`,
      targetResourceType: 'feature_flag',
      targetResourceId: flag.id,
      newValue: { key, name, enabledGlobally, percentageRollout },
    });

    return successResponse(
      {
        flag: {
          id: flag.id,
          key: flag.key,
          name: flag.name,
          description: flag.description,
          enabledGlobally: flag.enabled_globally,
          percentageRollout: flag.percentage_rollout,
          targetUserIds: flag.target_user_ids,
          createdAt: flag.created_at,
          updatedAt: flag.updated_at,
        },
      },
      undefined,
      201
    );
  } catch (error) {
    return handleApiError(error, 'api/admin/features');
  }
}

export async function PATCH(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const result = UpdateFlagSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.flatten());
    }

    const { id, enabledGlobally, percentageRollout, targetUserIds, reason } = result.data;

    // Get current flag state
    const { data: currentFlag, error: fetchError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentFlag) {
      return forbiddenResponse('Feature flag not found');
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_by_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (enabledGlobally !== undefined) {
      updates.enabled_globally = enabledGlobally;
    }

    if (percentageRollout !== undefined) {
      updates.percentage_rollout = percentageRollout;
    }

    if (targetUserIds !== undefined) {
      updates.target_user_ids = targetUserIds.join(',') || null;
    }

    // Update feature flag
    const { data: updatedFlag, error: updateError } = await supabase
      .from('feature_flags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[api/admin/features] Update error:', updateError);
      throw updateError;
    }

    // Log the change
    await logFeatureFlagChange(
      user.id,
      id,
      currentFlag.key,
      {
        enabledGlobally: currentFlag.enabled_globally,
        percentageRollout: currentFlag.percentage_rollout,
        targetUserIds: currentFlag.target_user_ids,
      },
      {
        enabledGlobally: updatedFlag.enabled_globally,
        percentageRollout: updatedFlag.percentage_rollout,
        targetUserIds: updatedFlag.target_user_ids,
      },
      reason
    );

    return successResponse({
      flag: {
        id: updatedFlag.id,
        key: updatedFlag.key,
        name: updatedFlag.name,
        description: updatedFlag.description,
        enabledGlobally: updatedFlag.enabled_globally,
        percentageRollout: updatedFlag.percentage_rollout,
        targetUserIds: updatedFlag.target_user_ids,
        createdAt: updatedFlag.created_at,
        updatedAt: updatedFlag.updated_at,
      },
    });
  } catch (error) {
    return handleApiError(error, 'api/admin/features');
  }
}
