#!/usr/bin/env node

/**
 * Simulates an authenticated founder making onboarding + chat API calls
 * against the production Netlify deployment. Generates a Supabase-authenticated
 * cookie jar using @supabase/ssr so we can exercise the same flow as the app.
 */

import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(PROJECT_ROOT, '.env.local');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const contents = fs.readFileSync(filePath, 'utf8');
  for (const line of contents.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(ENV_PATH);

const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`[simulate-auth-chat] Missing required env var: ${key}`);
  }
}

const NETLIFY_BASE_URL =
  process.env.NETLIFY_PROD_URL?.replace(/\/$/, '') || 'https://app-startupai-site.netlify.app';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'founder@startupai.site';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestFounder123!';

const cookieStore = new Map();
const cookieJar = {
  async get(name) {
    return cookieStore.get(name) ?? null;
  },
  async set(name, value) {
    if (typeof value === 'string') {
      cookieStore.set(name, value);
    }
  },
  async remove(name) {
    cookieStore.delete(name);
  },
};

function buildCookieHeader() {
  return Array.from(cookieStore.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function applySetCookies(headers) {
  const getSetCookie = headers?.getSetCookie?.bind(headers);
  const rawHeaders = getSetCookie
    ? getSetCookie()
    : headers?.raw?.()['set-cookie'] ||
      (headers?.get('set-cookie') ? [headers.get('set-cookie')] : []);

  if (!rawHeaders) return;

  for (const cookieLine of rawHeaders) {
    if (!cookieLine) continue;
    const [nameValue] = cookieLine.split(';');
    const eqIndex = nameValue.indexOf('=');
    if (eqIndex === -1) continue;
    const name = nameValue.slice(0, eqIndex).trim();
    const value = nameValue.slice(eqIndex + 1).trim();
    if (name) {
      cookieStore.set(name, value);
    }
  }
}

async function postJson(endpoint, payload) {
  const response = await fetch(`${NETLIFY_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: buildCookieHeader(),
    },
    body: JSON.stringify(payload),
  });

  applySetCookies(response.headers);

  const rawBody = await response.text();
  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    data = rawBody;
  }

  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    data,
    rawBody,
  };
}

async function ensureTestUser(email, password) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.warn('[simulate-auth-chat] No service role key; assuming test user already exists');
    return;
  }

  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let userId;
  try {
    const { data: listData, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;
    const existingUser = listData?.users?.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
      await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
      console.log('[simulate-auth-chat] Updated existing test user credentials');
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'CLI Test Founder' },
      });
      if (createError) throw createError;
      userId = created.user?.id;
      console.log('[simulate-auth-chat] Created new test user');
    }
  } catch (error) {
    console.warn('[simulate-auth-chat] Warning: unable to ensure test user via admin API', error);
    return;
  }

  if (!userId) return;

  const { data: profile } = await admin
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!profile) {
    await admin.from('user_profiles').upsert({
      id: userId,
      email,
      full_name: 'CLI Test Founder',
      company: 'Automation QA',
      role: 'founder',
      plan_status: 'active',
      subscription_status: 'active',
      subscription_tier: 'founder',
    });
    console.log('[simulate-auth-chat] Inserted user_profiles row for test user');
  }
}

async function main() {
  await ensureTestUser(TEST_EMAIL, TEST_PASSWORD);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: cookieJar }
  );

  console.log('[simulate-auth-chat] Signing in test user...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error || !data.user) {
    throw new Error(`[simulate-auth-chat] Sign-in failed: ${error?.message || 'unknown error'}`);
  }

  console.log(`[simulate-auth-chat] Signed in as ${data.user.email}`);
  console.log(`[simulate-auth-chat] Cookie names: ${Array.from(cookieStore.keys()).join(', ')}`);

  const onboardingPayload = {
    planType: 'trial',
    userContext: {
      referralSource: 'automated-test',
      previousExperience: 'experienced',
      timeAvailable: 20,
    },
  };

  console.log('[simulate-auth-chat] Starting onboarding session...');
  const startResponse = await postJson('/api/onboarding/start', onboardingPayload);
  if (!startResponse.ok) {
    console.error('[simulate-auth-chat] Onboarding start failed payload:', startResponse.data);
    throw new Error(`[simulate-auth-chat] Onboarding start failed with ${startResponse.status}`);
  }

  const sessionId = startResponse.data?.sessionId;
  if (!sessionId) {
    throw new Error('[simulate-auth-chat] Missing sessionId in onboarding response');
  }

  console.log(`[simulate-auth-chat] Using sessionId: ${sessionId}`);

  const chatPayload = {
    sessionId,
    data: {
      planType: onboardingPayload.planType,
    },
    messages: [
      {
        role: 'user',
        content:
          'Hi Alex! I am testing the onboarding flow for StartupAI. I want to validate a marketplace idea that connects fractional CFOs with climate tech startups.',
      },
    ],
  };

  console.log('[simulate-auth-chat] Sending chat request...');
  const chatResponse = await postJson('/api/chat', chatPayload);

  const requestId = chatResponse.headers.get('x-nf-request-id');
  console.log(
    `[simulate-auth-chat] Chat status ${chatResponse.status}, x-nf-request-id: ${requestId || 'n/a'}`
  );

  if (!chatResponse.ok) {
    console.error('[simulate-auth-chat] Chat error payload:', chatResponse.data);
    throw new Error(`[simulate-auth-chat] Chat failed with ${chatResponse.status}`);
  }

  const preview = typeof chatResponse.rawBody === 'string'
    ? chatResponse.rawBody.slice(0, 240)
    : '[non-string body]';

  console.log('[simulate-auth-chat] Chat response preview:', preview);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
