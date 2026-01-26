/**
 * Stripe Webhook Endpoint
 *
 * POST: Handle Stripe webhook events for subscription management
 *
 * Supported events:
 * - checkout.session.completed: User completed payment
 * - customer.subscription.updated: Subscription changed
 * - customer.subscription.deleted: Subscription cancelled
 *
 * @story US-FT03
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, deriveUpgradeRole } from '@/lib/stripe/client';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { handleMockClientsOnUpgrade } from '@/lib/mock-data';
import type Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Process checkout.session.completed event
 * - Upgrade user from trial to paid plan
 * - Store subscription ID
 * - Clear trial expiration
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const plan = session.metadata?.plan;
  const currentRole = session.metadata?.current_role;

  if (!userId) {
    console.error('[stripe/webhook] No user_id in session metadata');
    return;
  }

  console.log(`[stripe/webhook] Processing checkout for user ${userId}, plan: ${plan}`);

  const supabase = createAdminClient();

  // Determine the new role based on the plan or current role
  let newRole: 'founder' | 'consultant';
  if (plan === 'consultant') {
    newRole = 'consultant';
  } else if (plan === 'founder') {
    newRole = 'founder';
  } else {
    // Fall back to deriving from current role
    newRole = deriveUpgradeRole(currentRole || 'founder_trial');
  }

  // Determine subscription tier from plan
  const subscriptionTier = plan || 'founder';

  // Update user profile with new plan
  const { error } = await supabase
    .from('user_profiles')
    .update({
      role: newRole,
      subscription_tier: subscriptionTier,
      subscription_status: 'active',
      plan_status: 'active',
      stripe_subscription_id: typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id,
      plan_started_at: new Date().toISOString(),
      trial_expires_at: null, // Clear trial expiration
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[stripe/webhook] Failed to update user profile:', error);
    throw error;
  }

  console.log(`[stripe/webhook] User ${userId} upgraded to ${newRole} plan`);

  // US-CT05: Archive mock clients when consultant trial upgrades
  if (currentRole === 'consultant_trial' && newRole === 'consultant') {
    try {
      await handleMockClientsOnUpgrade(userId, true);
      console.log(`[stripe/webhook] Archived mock clients for consultant ${userId}`);
    } catch (err) {
      // Don't fail webhook if mock client handling fails
      console.warn('[stripe/webhook] Failed to archive mock clients:', err);
    }
  }

  // Log the upgrade event
  try {
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'upgrade_completed',
      event_data: {
        plan: newRole,
        subscription_tier: subscriptionTier,
        session_id: session.id,
        amount_total: session.amount_total,
        currency: session.currency,
      },
    });
  } catch (err) {
    // Don't fail the webhook if analytics logging fails
    console.warn('[stripe/webhook] Failed to log analytics event:', err);
  }

  // TODO: Send welcome email (will be implemented with email infrastructure)
  // sendUpgradeWelcomeEmail(userId, newRole);
}

/**
 * Process customer.subscription.updated event
 * - Handle plan changes, cancellation scheduling, etc.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.warn('[stripe/webhook] No user_id in subscription metadata');
    return;
  }

  const supabase = createAdminClient();

  // Determine subscription status
  let subscriptionStatus: string;
  if (subscription.cancel_at_period_end) {
    subscriptionStatus = 'canceling';
  } else if (subscription.status === 'active') {
    subscriptionStatus = 'active';
  } else if (subscription.status === 'past_due') {
    subscriptionStatus = 'past_due';
  } else {
    subscriptionStatus = subscription.status;
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[stripe/webhook] Failed to update subscription status:', error);
    throw error;
  }

  console.log(`[stripe/webhook] Updated subscription status for user ${userId}: ${subscriptionStatus}`);
}

/**
 * Process customer.subscription.deleted event
 * - Downgrade user to trial (limited access, not full trial again)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.warn('[stripe/webhook] No user_id in subscription metadata');
    return;
  }

  const supabase = createAdminClient();

  // Don't reset to full trial - keep data but mark as canceled
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'canceled',
      plan_status: 'canceled',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[stripe/webhook] Failed to update canceled subscription:', error);
    throw error;
  }

  console.log(`[stripe/webhook] Subscription canceled for user ${userId}`);

  // Log cancellation event
  try {
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'subscription_canceled',
      event_data: {
        subscription_id: subscription.id,
        canceled_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn('[stripe/webhook] Failed to log cancellation event:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[stripe/webhook] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[stripe/webhook] Signature verification failed:', message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 }
      );
    }

    console.log(`[stripe/webhook] Received event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[stripe/webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Stripe webhooks should not be cached
export const dynamic = 'force-dynamic';
