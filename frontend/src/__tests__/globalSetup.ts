/**
 * Jest Global Setup
 *
 * Runs ONCE before all test files start.
 * Pre-cleans any orphan test data from previously aborted runs.
 *
 * This ensures a clean slate even if a previous test run crashed
 * without completing globalTeardown.
 */

import { createClient } from '@supabase/supabase-js';

const TEST_PREFIX = 'test-';

/**
 * Global setup: Clean up any orphan test data from previously aborted runs.
 * Runs once before test suite starts.
 */
export default async function globalSetup(): Promise<void> {
  const url = process.env.TEST_SUPABASE_URL;
  const key = process.env.TEST_SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.log('[globalSetup] Skipping pre-clean - no test Supabase configured');
    return;
  }

  if (url.includes('prod') || url.includes('production')) {
    console.error('[globalSetup] TEST_SUPABASE_URL appears to be production. Aborting.');
    return;
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('[globalSetup] Pre-cleaning orphan test data...');

  // Delete projects by name prefix - child tables cascade automatically (ON DELETE CASCADE)
  // This covers: hypotheses, experiments, evidence, reports, crewai_validation_states,
  // value_proposition_canvas, business_model_canvas, ad_campaigns, copy_banks, validation_runs
  const { error } = await admin
    .from('projects')
    .delete()
    .ilike('name', `${TEST_PREFIX}%`);

  if (error) {
    console.warn('[globalSetup] projects cleanup error:', error.message);
  }

  console.log('[globalSetup] Pre-clean complete');
}
