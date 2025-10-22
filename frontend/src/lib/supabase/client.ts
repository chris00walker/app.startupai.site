/**
 * Supabase Client for Browser (Client Components)
 * 
 * Use this client in Client Components for authentication and real-time features.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false, // We handle this manually in callback
      },
    }
  );
}
