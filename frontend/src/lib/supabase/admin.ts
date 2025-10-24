/**
 * Supabase Admin Client
 * 
 * SERVER-SIDE ONLY - DO NOT IMPORT IN CLIENT COMPONENTS
 * 
 * This module creates a Supabase client with service role privileges.
 * It should ONLY be used in:
 * - API routes (/app/api/*)
 * - Server components
 * - Server-side functions
 * 
 * The SUPABASE_SERVICE_ROLE_KEY provides full admin access and must
 * never be exposed to the client. Netlify secrets scanner is configured
 * to allow this variable name in netlify.toml.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (() => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  return value;
})();

/**
 * Create Supabase admin client with service role key
 * 
 * @returns Supabase client with admin privileges
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not set
 */
export function createClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
