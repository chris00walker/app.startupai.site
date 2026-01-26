/**
 * Stripe Client Configuration
 *
 * Server-side Stripe SDK initialization for payment processing.
 * @story US-FT03
 */

import Stripe from 'stripe';

// Lazy-initialized Stripe client to prevent build-time failures
let _stripe: Stripe | null = null;

/**
 * Get the Stripe client instance (lazy initialization)
 * Throws an error if STRIPE_SECRET_KEY is not configured
 */
export function getStripe(): Stripe {
  if (_stripe) {
    return _stripe;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error('[stripe] STRIPE_SECRET_KEY not configured');
    throw new Error('Stripe is not configured. Missing STRIPE_SECRET_KEY.');
  }

  _stripe = new Stripe(stripeKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });

  return _stripe;
}

/**
 * Price IDs for different plans
 * These should be configured in the Stripe Dashboard
 */
export const PRICE_IDS = {
  founder_monthly: process.env.STRIPE_FOUNDER_MONTHLY_PRICE_ID || '',
  founder_annual: process.env.STRIPE_FOUNDER_ANNUAL_PRICE_ID || '',
  consultant_monthly: process.env.STRIPE_CONSULTANT_MONTHLY_PRICE_ID || '',
  consultant_annual: process.env.STRIPE_CONSULTANT_ANNUAL_PRICE_ID || '',
} as const;

export type PlanType = 'founder' | 'consultant';
export type BillingPeriod = 'monthly' | 'annual';

/**
 * Get the Stripe Price ID for a given plan and billing period
 */
export function getPriceId(plan: PlanType, billingPeriod: BillingPeriod): string {
  const key = `${plan}_${billingPeriod}` as keyof typeof PRICE_IDS;
  const priceId = PRICE_IDS[key];

  if (!priceId) {
    throw new Error(`Price ID not configured for ${plan} ${billingPeriod} plan`);
  }

  return priceId;
}

/**
 * Derive the target role from the current trial role
 */
export function deriveUpgradeRole(currentRole: string): 'founder' | 'consultant' {
  if (currentRole === 'consultant_trial' || currentRole === 'consultant') {
    return 'consultant';
  }
  // Default to founder for founder_trial or any other role
  return 'founder';
}
