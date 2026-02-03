#!/usr/bin/env npx tsx
/**
 * Verification Backfill Script
 *
 * One-time script to backfill verification status for existing paid consultants.
 * Run this after deploying the Portfolio Holder schema migration.
 *
 * Usage:
 *   npx tsx scripts/verification-backfill.ts [--dry-run]
 *
 * Options:
 *   --dry-run  Show what would be updated without making changes
 *
 * Required environment variables:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - STRIPE_SECRET_KEY
 *
 * @story US-PH01-07
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Parse arguments
const isDryRun = process.argv.includes('--dry-run');

// Validate environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  if (!stripeSecretKey) console.error('  - STRIPE_SECRET_KEY');
  process.exit(1);
}

// Marketplace plan IDs (Advisor and Capital tiers)
const MARKETPLACE_PLAN_IDS = new Set([
  process.env.STRIPE_ADVISOR_PRICE_ID,
  process.env.STRIPE_ADVISOR_ANNUAL_PRICE_ID,
  process.env.STRIPE_CAPITAL_PRICE_ID,
  process.env.STRIPE_CAPITAL_ANNUAL_PRICE_ID,
].filter(Boolean));

function isMarketplacePlan(priceId: string | undefined): boolean {
  if (!priceId) return false;
  return MARKETPLACE_PLAN_IDS.has(priceId);
}

async function main() {
  console.log('=== Verification Backfill Script ===');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Initialize clients
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

  // Fetch all consultants with active subscriptions
  console.log('Fetching consultants...');
  const { data: consultants, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      full_name,
      email,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_status
    `)
    .eq('role', 'consultant')
    .not('stripe_subscription_id', 'is', null);

  if (error) {
    console.error('Failed to fetch consultants:', error);
    process.exit(1);
  }

  if (!consultants || consultants.length === 0) {
    console.log('No consultants with subscriptions found.');
    return;
  }

  console.log(`Found ${consultants.length} consultants with subscriptions`);
  console.log('');

  // Track results
  const results = {
    verified: 0,
    unverified: 0,
    errors: 0,
  };

  for (const consultant of consultants) {
    console.log(`Processing: ${consultant.full_name || consultant.email || consultant.id}`);

    try {
      // Fetch subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(
        consultant.stripe_subscription_id
      );

      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const hasMarketplacePlan = isMarketplacePlan(priceId);
      const shouldVerify = isActive && hasMarketplacePlan;

      console.log(`  Stripe status: ${subscription.status}`);
      console.log(`  Price ID: ${priceId || 'none'}`);
      console.log(`  Marketplace plan: ${hasMarketplacePlan ? 'yes' : 'no'}`);
      console.log(`  Should verify: ${shouldVerify ? 'yes' : 'no'}`);

      if (!isDryRun) {
        // Update verification status
        const { error: updateError } = await supabase
          .from('consultant_profiles')
          .update({
            verification_status: shouldVerify ? 'verified' : 'unverified',
            grace_started_at: null,
          })
          .eq('id', consultant.id);

        if (updateError) {
          console.error(`  Error updating: ${updateError.message}`);
          results.errors++;
        } else {
          console.log(`  Updated to: ${shouldVerify ? 'verified' : 'unverified'}`);
          shouldVerify ? results.verified++ : results.unverified++;
        }
      } else {
        console.log(`  Would update to: ${shouldVerify ? 'verified' : 'unverified'}`);
        shouldVerify ? results.verified++ : results.unverified++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`  Stripe error: ${message}`);
      results.errors++;
    }

    console.log('');
  }

  // Summary
  console.log('=== Summary ===');
  console.log(`Verified: ${results.verified}`);
  console.log(`Unverified: ${results.unverified}`);
  console.log(`Errors: ${results.errors}`);

  if (isDryRun) {
    console.log('');
    console.log('This was a dry run. No changes were made.');
    console.log('Run without --dry-run to apply changes.');
  }
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
