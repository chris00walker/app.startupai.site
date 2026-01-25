/**
 * Authentication Client Actions
 * 
 * Client-side authentication functions for static export.
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, fullName?: string, company?: string) {
  const supabase = createClient();

  const data = {
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company,
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);
  
  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

/**
 * Sign in with email and password
 *
 * @story US-AS04
 */
export async function signIn(email: string, password: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Record login event and register session (non-blocking)
  try {
    await Promise.all([
      fetch('/api/settings/security/login-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginMethod: 'password' }),
      }),
      fetch('/api/settings/security/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    ]);
  } catch {
    // Don't fail login if recording fails
    console.warn('Failed to record login event');
  }

  return { success: true };
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

/**
 * Sign in with OAuth provider
 * MVP: GitHub only. Google and Microsoft can be added post-launch.
 * 
 * Returns the OAuth URL for client-side redirect
 */
export async function signInWithOAuth(provider: 'github' | 'google' | 'azure'): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();

  // Use environment-aware URL for OAuth redirect
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const redirectUrl = `${baseUrl}/auth/callback`;

  console.log('OAuth redirect URL:', redirectUrl); // Debug logging

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error('OAuth error:', error);
    return { error: error.message };
  }

  if (data.url) {
    return { url: data.url };
  }
  
  return { error: 'No OAuth URL returned from Supabase' };
}

/**
 * Sign in with GitHub (MVP primary OAuth provider)
 */
export async function signInWithGitHub() {
  return signInWithOAuth('github');
}

/**
 * Get current user
 */
export async function getUser() {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}
