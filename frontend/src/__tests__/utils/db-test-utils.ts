/**
 * Test Database Utilities
 *
 * Provides utilities for integration tests that use the dedicated TEST Supabase project.
 *
 * Key patterns:
 * 1. TEST_PREFIX naming convention - All test data uses 'test-' prefix for cleanup
 * 2. createTestAdminClient() - Fails fast if not configured (no silent fallback)
 * 3. createTestId/Email/Name() - Helpers to generate test data with naming convention
 *
 * Cleanup is handled by globalSetup.ts (pre-clean) and globalTeardown.ts (post-clean).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Prefix for all test data - enables cleanup by naming convention
export const TEST_PREFIX = 'test-';

/**
 * Create admin client for dedicated TEST Supabase project.
 * Fails fast if not configured (no silent fallback to staging/prod).
 */
export function createTestAdminClient(): SupabaseClient {
  const url = process.env.TEST_SUPABASE_URL;
  const key = process.env.TEST_SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      'Integration tests require TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_KEY.\n' +
        'These must point to a DEDICATED test Supabase project, not staging/prod.'
    );
  }

  // Safety check: prevent accidentally hitting production
  if (url.includes('prod') || url.includes('production')) {
    throw new Error('TEST_SUPABASE_URL appears to be a production URL. Aborting.');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Check if the test Supabase is configured.
 * Use this for conditional test skipping.
 */
export function isTestSupabaseConfigured(): boolean {
  const url = process.env.TEST_SUPABASE_URL;
  const key = process.env.TEST_SUPABASE_SERVICE_KEY;

  if (!url || !key) return false;
  if (url.includes('prod') || url.includes('production')) return false;

  return true;
}

/**
 * Generate a valid UUID v4 for test data.
 */
export function createTestId(): string {
  return randomUUID();
}

/**
 * Generate a test email with naming convention prefix.
 * Example: test-a1b2c3d4@startupai.test
 */
export function createTestEmail(): string {
  return `${TEST_PREFIX}${randomUUID().slice(0, 8)}@startupai.test`;
}

/**
 * Generate a test name with naming convention prefix.
 * Example: test-Integration Project-a1b2c3d4
 */
export function createTestName(suffix: string): string {
  return `${TEST_PREFIX}${suffix}-${randomUUID().slice(0, 8)}`;
}

/**
 * Generate a test title with naming convention prefix.
 * Alias for createTestName for clarity in report/evidence contexts.
 */
export function createTestTitle(description: string): string {
  return createTestName(description);
}

/**
 * Type guard to check if a value is a valid test-prefixed string.
 */
export function isTestData(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith(TEST_PREFIX);
}
