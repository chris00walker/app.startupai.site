/**
 * Verification Lifecycle Module
 *
 * Manages Portfolio Holder verification status tied to Stripe subscriptions.
 * Verification grants marketplace access (Founder Directory, RFQ Board).
 *
 * Lifecycle:
 * - subscription.created/invoice.paid (Advisor/Capital plan) → verified
 * - invoice.payment_failed → grace (7-day window)
 * - subscription.deleted OR grace expired → revoked
 * - customer.subscription.updated (plan change) → check if still marketplace plan
 *
 * @story US-PH01-07, US-FM01-11
 */

import { createClient } from './supabase/admin';

/**
 * Verification status enum matching database constraint
 */
export type VerificationStatus = 'unverified' | 'verified' | 'grace' | 'revoked';

/**
 * Stripe plan IDs that grant marketplace access
 * From docs/decisions/ADR-003-pricing-tiers.md
 */
const MARKETPLACE_PLAN_IDS = new Set([
  // Advisor tier ($199/mo)
  process.env.STRIPE_ADVISOR_PRICE_ID,
  process.env.STRIPE_ADVISOR_ANNUAL_PRICE_ID,
  // Capital tier ($499/mo)
  process.env.STRIPE_CAPITAL_PRICE_ID,
  process.env.STRIPE_CAPITAL_ANNUAL_PRICE_ID,
]);

/**
 * Check if a Stripe price ID grants marketplace access
 */
export function isMarketplacePlan(priceId: string | undefined): boolean {
  if (!priceId) return false;
  return MARKETPLACE_PLAN_IDS.has(priceId);
}

/**
 * Grant verification to a consultant
 * Called when subscription is created or invoice is paid for Advisor/Capital plan
 *
 * @param consultantId - The consultant's user profile ID
 */
export async function grantVerification(consultantId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc('grant_verification', {
    consultant_id: consultantId,
  });

  if (error) {
    console.error('Failed to grant verification:', error);
    throw new Error(`Failed to grant verification: ${error.message}`);
  }

  console.log(`Granted verification to consultant ${consultantId}`);
}

/**
 * Start grace period for a consultant
 * Called when payment fails - gives 7 days to update payment method
 *
 * @param consultantId - The consultant's user profile ID
 */
export async function startGracePeriod(consultantId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc('start_grace_period', {
    consultant_id: consultantId,
  });

  if (error) {
    console.error('Failed to start grace period:', error);
    throw new Error(`Failed to start grace period: ${error.message}`);
  }

  console.log(`Started grace period for consultant ${consultantId}`);
}

/**
 * Revoke verification from a consultant
 * Called when subscription is deleted or grace period expires
 *
 * @param consultantId - The consultant's user profile ID
 */
export async function revokeVerification(consultantId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc('revoke_verification', {
    consultant_id: consultantId,
  });

  if (error) {
    console.error('Failed to revoke verification:', error);
    throw new Error(`Failed to revoke verification: ${error.message}`);
  }

  console.log(`Revoked verification from consultant ${consultantId}`);
}

/**
 * Get consultant verification status
 *
 * @param consultantId - The consultant's user profile ID
 * @returns The current verification status, or null if not found
 */
export async function getVerificationStatus(
  consultantId: string
): Promise<VerificationStatus | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('consultant_profiles')
    .select('verification_status, grace_started_at')
    .eq('id', consultantId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.verification_status as VerificationStatus;
}

/**
 * Check if a consultant is verified (has marketplace access)
 *
 * @param consultantId - The consultant's user profile ID
 * @returns true if verified or in grace period
 */
export async function isVerified(consultantId: string): Promise<boolean> {
  const status = await getVerificationStatus(consultantId);
  return status === 'verified' || status === 'grace';
}

/**
 * Get grace period details for a consultant
 *
 * @param consultantId - The consultant's user profile ID
 * @returns Grace period info or null if not in grace
 */
export async function getGracePeriodDetails(consultantId: string): Promise<{
  graceStartedAt: Date;
  graceEndsAt: Date;
  daysRemaining: number;
} | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('consultant_profiles')
    .select('verification_status, grace_started_at')
    .eq('id', consultantId)
    .single();

  if (error || !data || data.verification_status !== 'grace' || !data.grace_started_at) {
    return null;
  }

  const graceStartedAt = new Date(data.grace_started_at);
  const graceEndsAt = new Date(graceStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.max(
    0,
    Math.ceil((graceEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  );

  return {
    graceStartedAt,
    graceEndsAt,
    daysRemaining,
  };
}

/**
 * Handle Stripe subscription event and update verification status
 * Central handler for all subscription-related webhook events
 *
 * @param event - Stripe event type
 * @param consultantId - The consultant's user profile ID
 * @param priceId - The Stripe price ID (for plan change checks)
 */
export async function handleSubscriptionEvent(
  event:
    | 'customer.subscription.created'
    | 'invoice.paid'
    | 'invoice.payment_failed'
    | 'customer.subscription.deleted'
    | 'customer.subscription.updated',
  consultantId: string,
  priceId?: string
): Promise<void> {
  switch (event) {
    case 'customer.subscription.created':
    case 'invoice.paid':
      if (!priceId || isMarketplacePlan(priceId)) {
        await grantVerification(consultantId);
      }
      break;

    case 'invoice.payment_failed':
      await startGracePeriod(consultantId);
      break;

    case 'customer.subscription.deleted':
      await revokeVerification(consultantId);
      break;

    case 'customer.subscription.updated':
      // Check if the new plan still grants marketplace access
      if (priceId && !isMarketplacePlan(priceId)) {
        // Downgraded to non-marketplace plan - start grace period
        await startGracePeriod(consultantId);
      } else if (priceId && isMarketplacePlan(priceId)) {
        // Upgraded to marketplace plan or kept marketplace plan - verify
        await grantVerification(consultantId);
      }
      break;

    default:
      console.warn(`Unknown subscription event: ${event}`);
  }
}

/**
 * Sync verification status with Stripe for a consultant
 * Used for periodic reconciliation and manual fixes
 *
 * @param consultantId - The consultant's user profile ID
 * @param hasActiveMarketplacePlan - Whether they have an active Advisor/Capital subscription
 */
export async function syncVerification(
  consultantId: string,
  hasActiveMarketplacePlan: boolean
): Promise<void> {
  if (hasActiveMarketplacePlan) {
    await grantVerification(consultantId);
  } else {
    // Check if they're already in grace period
    const details = await getGracePeriodDetails(consultantId);
    if (!details) {
      // Not in grace - revoke immediately
      await revokeVerification(consultantId);
    }
    // If in grace, let the cron job handle expiration
  }
}
