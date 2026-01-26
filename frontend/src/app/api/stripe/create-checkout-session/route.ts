/**
 * Stripe Checkout Session API Route
 *
 * POST: Create a Stripe Checkout session for plan upgrades
 *
 * @story US-FT03
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { stripe, getPriceId, type PlanType, type BillingPeriod } from '@/lib/stripe/client';
import {
  unauthorizedResponse,
  handleApiError,
  validationErrorResponse,
} from '@/lib/api/response';

const CreateCheckoutSchema = z.object({
  plan: z.enum(['founder', 'consultant']),
  billing_period: z.enum(['monthly', 'annual']).default('monthly'),
});

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

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const result = CreateCheckoutSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.flatten());
    }

    const { plan, billing_period } = result.data;

    // Get user profile to check for existing Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, role, email')
      .eq('id', user.id)
      .single();

    // Determine price ID
    const priceId = getPriceId(plan as PlanType, billing_period as BillingPeriod);

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan configuration' },
        { status: 400 }
      );
    }

    // Build success/cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
    const successUrl = `${origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/upgrade/cancel`;

    // Create or retrieve Stripe customer
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        plan,
        billing_period,
        current_role: profile?.role || 'founder_trial',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
        },
      },
    });

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    return handleApiError(error, 'api/stripe/create-checkout-session');
  }
}
