/**
 * Admin User Billing API Route
 *
 * GET: Get billing information for a user
 *
 * @story US-A12
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { validateAdminRole } from '@/lib/auth/validate-admin';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  handleApiError,
} from '@/lib/api/response';

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

    const admin = createAdminClient();

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .select(`
        id,
        email,
        subscription_tier,
        subscription_status,
        plan_status,
        trial_expires_at,
        stripe_customer_id
      `)
      .eq('id', targetUserId)
      .single();

    if (profileError || !profile) {
      return notFoundResponse('User not found');
    }

    // Build billing info response
    // Note: Full Stripe integration is deferred
    const billingInfo = {
      userId: profile.id,
      email: profile.email,
      subscriptionTier: profile.subscription_tier || 'free',
      subscriptionStatus: profile.subscription_status || 'none',
      planStatus: profile.plan_status || 'trial',
      trialExpiresAt: profile.trial_expires_at,
      stripeCustomerId: profile.stripe_customer_id || null,
      // Placeholder values - would be populated from Stripe
      billing: {
        hasStripeAccount: !!profile.stripe_customer_id,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        paymentMethod: null,
        invoices: [],
      },
      actions: {
        canRetryPayment: false,
        canRefund: false,
        canApplyCredit: true,
        stripeIntegrationPending: true,
      },
    };

    return successResponse(billingInfo);
  } catch (error) {
    return handleApiError(error, 'api/admin/users/[id]/billing');
  }
}
