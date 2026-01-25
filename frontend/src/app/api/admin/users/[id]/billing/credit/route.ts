/**
 * Admin User Billing Credit API Route
 *
 * POST: Apply a credit to a user's account
 *
 * @story US-A12
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

const CreditRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required').max(500),
  type: z.enum(['trial_extension', 'compensation', 'promotional', 'other']).default('other'),
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

    // Parse and validate request
    const body = await request.json().catch(() => ({}));
    const result = CreditRequestSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.flatten());
    }

    const { amount, reason, type } = result.data;
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

    // For trial extension credits, we can extend the trial
    if (type === 'trial_extension') {
      const extensionDays = Math.ceil(amount); // Treat amount as days for trial extension
      const { data: profile } = await admin
        .from('user_profiles')
        .select('trial_expires_at')
        .eq('id', targetUserId)
        .single();

      const currentExpiry = profile?.trial_expires_at
        ? new Date(profile.trial_expires_at)
        : new Date();
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + extensionDays);

      await admin
        .from('user_profiles')
        .update({ trial_expires_at: newExpiry.toISOString() })
        .eq('id', targetUserId);

      // Log the action
      logAdminAction({
        adminId: user.id,
        actionType: 'billing_credit',
        targetUserId,
        oldValue: { trialExpiresAt: profile?.trial_expires_at },
        newValue: { trialExpiresAt: newExpiry.toISOString(), extensionDays },
        reason,
      });

      return successResponse({
        applied: true,
        type: 'trial_extension',
        amount: extensionDays,
        newTrialExpiry: newExpiry.toISOString(),
        message: `Extended trial by ${extensionDays} days`,
      });
    }

    // For monetary credits, log the action but note Stripe is required
    logAdminAction({
      adminId: user.id,
      actionType: 'billing_credit',
      targetUserId,
      oldValue: null,
      newValue: { amount, type, reason, action: 'credit_noted' },
      reason,
    });

    return successResponse({
      applied: false,
      type,
      amount,
      message: 'Credit noted. Stripe integration required for monetary credits.',
      stripeRequired: true,
    });
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]/billing/credit');
  }
}
