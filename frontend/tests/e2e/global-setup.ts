import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

/**
 * Playwright Global Setup
 *
 * Resets onboarding state for test users before E2E test runs.
 * This ensures onboarding tests can access /onboarding instead of
 * being redirected to dashboard due to prior completed sessions.
 */

// Test user emails - must match helpers/auth.ts
const TEST_USER_EMAILS = [
  'chris00walker@gmail.com', // CONSULTANT_USER
  'chris00walker@proton.me', // FOUNDER_USER
  'admin@startupai.test',    // ADMIN_USER
];

async function globalSetup(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Gracefully skip if env vars missing (allows tests to run without reset)
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log(
      '[E2E Setup] Missing SUPABASE env vars, skipping test user reset'
    );
    console.log(
      '[E2E Setup] Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable reset'
    );
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Get test user IDs from auth.users
    const { data: usersData, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('[E2E Setup] Failed to list users:', listError.message);
      return;
    }

    const testUserIds = (usersData?.users || [])
      .filter((u) => u.email && TEST_USER_EMAILS.includes(u.email))
      .map((u) => u.id);

    if (testUserIds.length === 0) {
      console.log('[E2E Setup] No test users found in database, skipping reset');
      return;
    }

    console.log(
      `[E2E Setup] Resetting onboarding state for ${testUserIds.length} test users...`
    );

    // Delete in correct order to respect foreign key constraints
    // 1. Delete onboarding_sessions (references user_id)
    const { error: sessionsError } = await supabase
      .from('onboarding_sessions')
      .delete()
      .in('user_id', testUserIds);

    if (sessionsError) {
      console.warn(
        '[E2E Setup] Failed to delete onboarding_sessions:',
        sessionsError.message
      );
    } else {
      console.log('[E2E Setup] Deleted onboarding_sessions for test users');
    }

    // 2. Delete entrepreneur_briefs (references user_id and session_id)
    const { error: briefsError } = await supabase
      .from('entrepreneur_briefs')
      .delete()
      .in('user_id', testUserIds);

    if (briefsError) {
      console.warn(
        '[E2E Setup] Failed to delete entrepreneur_briefs:',
        briefsError.message
      );
    } else {
      console.log('[E2E Setup] Deleted entrepreneur_briefs for test users');
    }

    // 3. Delete consultant_onboarding_sessions (if applicable)
    const { error: consultantSessionsError } = await supabase
      .from('consultant_onboarding_sessions')
      .delete()
      .in('user_id', testUserIds);

    if (consultantSessionsError) {
      // Table may not exist or have no rows - non-fatal
      console.log(
        '[E2E Setup] consultant_onboarding_sessions:',
        consultantSessionsError.message
      );
    } else {
      console.log(
        '[E2E Setup] Deleted consultant_onboarding_sessions for test users'
      );
    }

    // 4. Delete test projects (onboarding creates projects on completion)
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .in('user_id', testUserIds);

    if (projectsError) {
      console.warn(
        '[E2E Setup] Failed to delete projects:',
        projectsError.message
      );
    } else {
      console.log('[E2E Setup] Deleted projects for test users');
    }

    console.log('[E2E Setup] Test user onboarding state reset complete');
  } catch (error) {
    // Log but don't fail - allows tests to attempt running
    console.error(
      '[E2E Setup] Unexpected error during setup:',
      error instanceof Error ? error.message : error
    );
  }
}

export default globalSetup;
