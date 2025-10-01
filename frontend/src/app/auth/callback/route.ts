/**
 * OAuth Callback Route
 * 
 * Handles OAuth provider callbacks and exchanges code for session.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  console.log('=== OAuth Callback Started ===');
  
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  
  console.log('Callback URL:', request.url);
  console.log('Code present:', !!code);
  console.log('Next destination:', next);
  console.log('Origin:', origin);

  if (code) {
    console.log('Exchanging code for session...');
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Exchange error:', error);
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
    }
    
    console.log('Session exchange successful!');
    console.log('User:', data?.user?.email);
    
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    
    const redirectUrl = isLocalEnv 
      ? `${origin}${next}`
      : forwardedHost 
        ? `https://${forwardedHost}${next}`
        : `${origin}${next}`;
    
    console.log('Redirecting to:', redirectUrl);
    return NextResponse.redirect(redirectUrl);
  }

  console.error('No code in callback - redirecting to error page');
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
}
