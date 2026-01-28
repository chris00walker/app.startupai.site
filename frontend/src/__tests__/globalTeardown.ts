/**
 * Jest Global Teardown
 *
 * Runs ONCE after all test files complete.
 * Cleans up ALL test data by naming convention (test-* prefix).
 *
 * Design decisions:
 * - Global teardown (not per-file) avoids parallel worker conflicts
 * - Jest maxWorkers: 1 ensures sequential execution within a run
 * - CI concurrency control ensures sequential runs across PRs
 * - Error tolerance - logs errors but doesn't fail the suite
 *
 * Cleanup coverage (via ON DELETE CASCADE):
 * - projects → hypotheses, experiments, evidence, reports, crewai_validation_states,
 *              value_proposition_canvas, business_model_canvas, ad_campaigns,
 *              copy_banks, validation_runs, ad_metrics (all cascade)
 * - user_profiles → consultant_clients, ad_budgets, usage_quota, admin_sessions (all cascade)
 */

import { createClient } from '@supabase/supabase-js';

const TEST_PREFIX = 'test-';

/**
 * Global teardown: Clean up ALL test data by naming convention.
 * Runs once after entire test suite completes.
 */
export default async function globalTeardown(): Promise<void> {
  const url = process.env.TEST_SUPABASE_URL;
  const key = process.env.TEST_SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.log('[globalTeardown] Skipping - no test Supabase configured');
    return;
  }

  // Safety check: prevent accidentally hitting production
  if (url.includes('prod') || url.includes('production')) {
    console.error('[globalTeardown] TEST_SUPABASE_URL appears to be production. Aborting cleanup.');
    return;
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('[globalTeardown] Cleaning up test data...');

  // Delete parent tables only - ON DELETE CASCADE handles all children automatically
  // Verified FK relationships with CASCADE:
  // - projects → hypotheses, experiments, evidence, reports, crewai_validation_states,
  //              value_proposition_canvas, business_model_canvas, ad_campaigns,
  //              copy_banks, validation_runs, ad_metrics (all cascade)
  // - user_profiles → consultant_clients, ad_budgets, usage_quota, admin_sessions (all cascade)

  // 1. Delete projects first (cascades to all project-related tables)
  const { error: projectsError } = await admin
    .from('projects')
    .delete()
    .ilike('name', `${TEST_PREFIX}%`);

  if (projectsError) {
    console.warn('[globalTeardown] projects cleanup error:', projectsError.message);
  } else {
    console.log('[globalTeardown] Deleted test projects (+ cascaded children)');
  }

  // 2. Delete user_profiles (only if tests create standalone users)
  const { error: usersError } = await admin
    .from('user_profiles')
    .delete()
    .ilike('email', `${TEST_PREFIX}%`);

  if (usersError) {
    console.warn('[globalTeardown] user_profiles cleanup error:', usersError.message);
  } else {
    console.log('[globalTeardown] Deleted test users (+ cascaded children)');
  }

  console.log('[globalTeardown] Cleanup complete');
}
