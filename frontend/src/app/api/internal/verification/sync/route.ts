/**
 * Verification Sync Endpoint
 *
 * POST: Sync verification status with Stripe for all consultants
 *
 * This endpoint is designed to be called periodically (e.g., daily via cron)
 * to reconcile verification status with actual Stripe subscription state.
 *
 * Security: Requires internal API key (INTERNAL_API_KEY env var)
 *
 * @story US-PH01-07
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { isMarketplacePlan, syncVerification } from '@/lib/verification';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

/**
 * Verify internal API key
 */
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice(7);
  return INTERNAL_API_KEY ? token === INTERNAL_API_KEY : false;
}

export async function POST(request: NextRequest) {
  // Verify authorization
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();
  const stripe = getStripe();

  try {
    // Get all consultants with their Stripe subscription info
    const { data: consultants, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        stripe_customer_id,
        stripe_subscription_id,
        consultant_profiles!inner(
          verification_status,
          grace_started_at
        )
      `)
      .eq('role', 'consultant')
      .not('stripe_customer_id', 'is', null);

    if (error) {
      console.error('[verification/sync] Failed to fetch consultants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch consultants' },
        { status: 500 }
      );
    }

    if (!consultants || consultants.length === 0) {
      return NextResponse.json({
        message: 'No consultants to sync',
        synced: 0,
      });
    }

    let synced = 0;
    let errors = 0;
    const results: Array<{ id: string; status: string; error?: string }> = [];

    for (const consultant of consultants) {
      try {
        // Check Stripe subscription status
        let hasActiveMarketplacePlan = false;

        if (consultant.stripe_subscription_id) {
          const subscription = await stripe.subscriptions.retrieve(
            consultant.stripe_subscription_id
          );

          if (subscription.status === 'active' || subscription.status === 'trialing') {
            const priceId = subscription.items?.data?.[0]?.price?.id;
            hasActiveMarketplacePlan = isMarketplacePlan(priceId);
          }
        }

        // Sync verification status
        await syncVerification(consultant.id, hasActiveMarketplacePlan);

        results.push({
          id: consultant.id,
          status: hasActiveMarketplacePlan ? 'verified' : 'unverified',
        });
        synced++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[verification/sync] Failed to sync ${consultant.id}:`, message);
        results.push({
          id: consultant.id,
          status: 'error',
          error: message,
        });
        errors++;
      }
    }

    console.log(`[verification/sync] Synced ${synced} consultants, ${errors} errors`);

    return NextResponse.json({
      message: `Synced ${synced} consultants`,
      synced,
      errors,
      results,
    });
  } catch (error) {
    console.error('[verification/sync] Error:', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}

// This endpoint should not be cached
export const dynamic = 'force-dynamic';
