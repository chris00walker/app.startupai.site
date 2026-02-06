import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const TEST_PREFIX = 'test-';
const TEST_USER_EMAILS = [
  'chris00walker@gmail.com',
  'chris00walker@proton.me',
  'admin@startupai.test',
];

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';
const HEALTH_PATH = process.env.PLAYWRIGHT_HEALTH_PATH ?? '/api/health';
const APP_READY_TIMEOUT_MS = Number(process.env.PLAYWRIGHT_APP_READY_TIMEOUT_MS ?? 45_000);
const APP_READY_RETRY_MS = Number(process.env.PLAYWRIGHT_APP_READY_RETRY_MS ?? 1_500);
const GLOBAL_SETUP_TIMEOUT_MS = Number(
  process.env.PLAYWRIGHT_GLOBAL_SETUP_TIMEOUT_MS ?? 180_000
);

type SetupFailureClass =
  | 'SERVER_START_TIMEOUT'
  | 'GLOBAL_SETUP_TIMEOUT'
  | 'EXTERNAL_INFRA_FAILURE';

function createClassifiedError(
  failureClass: SetupFailureClass,
  message: string,
  cause?: unknown
): Error {
  const detail =
    cause instanceof Error
      ? `${cause.message}\n${cause.stack ?? ''}`.trim()
      : cause
        ? String(cause)
        : '';
  const suffix = detail ? `\nCause: ${detail}` : '';
  return new Error(`[E2E_CLASS=${failureClass}] ${message}${suffix}`);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutClass: SetupFailureClass,
  timeoutMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(createClassifiedError(timeoutClass, timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function waitForAppReadiness(): Promise<void> {
  const healthUrl = new URL(HEALTH_PATH, BASE_URL).toString();
  const deadline = Date.now() + APP_READY_TIMEOUT_MS;
  let lastError = '';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        console.log(`[E2E Setup] App readiness probe passed: ${healthUrl}`);
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(APP_READY_RETRY_MS);
  }

  throw createClassifiedError(
    'SERVER_START_TIMEOUT',
    `Timed out waiting for app readiness at ${healthUrl} after ${APP_READY_TIMEOUT_MS}ms. Last error: ${lastError || 'unknown'}`
  );
}

async function cleanupTestData(
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  console.log('[E2E Setup] Cleaning up stale test data...');

  const { error } = await supabase
    .from('projects')
    .delete()
    .ilike('name', `${TEST_PREFIX}%`);

  if (error) {
    console.warn('[E2E Setup] projects cleanup warning:', error.message);
  } else {
    console.log('[E2E Setup] Deleted stale test projects (+ cascaded children)');
  }
}

async function globalSetupInner(): Promise<void> {
  await waitForAppReadiness();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log(
      '[E2E Setup] Missing SUPABASE env vars, skipping test user reset'
    );
    return;
  }

  if (supabaseUrl.includes('prod') || supabaseUrl.includes('production')) {
    throw createClassifiedError(
      'EXTERNAL_INFRA_FAILURE',
      'SUPABASE URL appears to be production. Refusing to run E2E global setup.'
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await cleanupTestData(supabase);

  const { data: usersData, error: listError } =
    await supabase.auth.admin.listUsers();

  if (listError) {
    throw createClassifiedError(
      'EXTERNAL_INFRA_FAILURE',
      `Failed to list users for E2E setup.`,
      listError
    );
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

  const { error: sessionsError } = await supabase
    .from('onboarding_sessions')
    .delete()
    .in('user_id', testUserIds);
  if (sessionsError) {
    console.warn('[E2E Setup] Failed to delete onboarding_sessions:', sessionsError.message);
  }

  const { error: briefsError } = await supabase
    .from('entrepreneur_briefs')
    .delete()
    .in('user_id', testUserIds);
  if (briefsError) {
    console.warn('[E2E Setup] Failed to delete entrepreneur_briefs:', briefsError.message);
  }

  const { error: consultantSessionsError } = await supabase
    .from('consultant_onboarding_sessions')
    .delete()
    .in('user_id', testUserIds);
  if (consultantSessionsError) {
    console.warn(
      '[E2E Setup] consultant_onboarding_sessions cleanup warning:',
      consultantSessionsError.message
    );
  }

  const { error: projectsError } = await supabase
    .from('projects')
    .delete()
    .in('user_id', testUserIds);
  if (projectsError) {
    console.warn('[E2E Setup] Failed to delete projects:', projectsError.message);
  }

  console.log('[E2E Setup] Test user onboarding state reset complete');
}

async function globalSetup(): Promise<void> {
  const startedAt = Date.now();

  try {
    await withTimeout(
      globalSetupInner(),
      GLOBAL_SETUP_TIMEOUT_MS,
      'GLOBAL_SETUP_TIMEOUT',
      `Global setup exceeded ${GLOBAL_SETUP_TIMEOUT_MS}ms`
    );
    console.log(`[E2E Setup] Completed in ${Date.now() - startedAt}ms`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('[E2E_CLASS=')) {
      throw error;
    }
    throw createClassifiedError(
      'EXTERNAL_INFRA_FAILURE',
      'Unexpected global setup failure',
      error
    );
  }
}

export default globalSetup;
