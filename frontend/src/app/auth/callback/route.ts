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
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const next = searchParams.get('next') ?? '/dashboard';

  console.log('Callback URL:', request.url);
  console.log('Code present:', !!code);
  console.log('Access token present:', !!accessToken);
  console.log('Refresh token present:', !!refreshToken);
  console.log('Next destination:', next);
  console.log('Origin:', origin);

  const supabase = await createClient();

  if (accessToken && refreshToken) {
    console.log('Setting session from provided tokens...');
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      console.error('Token session error:', sessionError);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=${encodeURIComponent(sessionError.message)}`
      );
    }

    const redirectUrl = buildRedirectUrl({ request, origin, next });
    console.log('Redirecting after token session set to:', redirectUrl);
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    console.log('Exchanging code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Exchange error:', error);
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
    }

    console.log('Session exchange successful!');
    console.log('User:', data?.user?.email);
    
    const redirectUrl = buildRedirectUrl({ request, origin, next });
    
    console.log('Redirecting to:', redirectUrl);
    return NextResponse.redirect(redirectUrl);
  }

  console.error('No code in callback - redirecting to error page');
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
}

function buildRedirectUrl({
  request,
  origin,
  next,
}: {
  request: Request;
  origin: string;
  next: string;
}) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';

  return isLocalEnv
    ? `${origin}${next}`
    : forwardedHost
      ? `https://${forwardedHost}${next}`
      : `${origin}${next}`;
}
