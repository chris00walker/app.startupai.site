/**
 * Admin User Billing Refund API Route
 *
 * POST: Process a refund for a user
 *
 * @story US-A12
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminRole } from '@/lib/auth/validate-admin';
import { logAdminAction } from '@/lib/admin/audit';
import {
  unauthorizedResponse,
  forbiddenResponse,
  handleApiError,
  validationErrorResponse,
} from '@/lib/api/response';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const RefundRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  reason: z.string().min(1, 'Reason is required').max(500),
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
    const result = RefundRequestSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.flatten());
    }

    const { amount, reason } = result.data;

    // Log the attempt
    logAdminAction({
      adminId: user.id,
      actionType: 'billing_refund',
      targetUserId,
      oldValue: null,
      newValue: { amount, reason, action: 'refund_attempted' },
      reason,
    });

    // Stripe integration is pending - return stub response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STRIPE_NOT_INTEGRATED',
          message: 'Stripe refund processing is not yet available. This feature is coming soon.',
        },
      },
      { status: 501 }
    );
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]/billing/refund');
  }
}
