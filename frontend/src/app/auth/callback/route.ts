/**
 * OAuth Callback Route
 * 
 * Handles OAuth provider callbacks and exchanges code for session.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// TODO: Implement proper database query
// import { getUserProfile } from '@/db/queries/users';

// Temporary stub function until database layer is implemented
async function getUserProfile(userId: string) {
  // TODO: Implement actual database query
  return {
    role: 'trial' as const,
    planStatus: 'trialing' as const,
    subscriptionStatus: 'trialing' as const
  };
}
import { deriveRole, getRedirectForRole, sanitizePath } from '@/lib/auth/roles';

export async function GET(request: Request) {
  console.log('=== OAuth Callback Started ===');
  
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const rawNext = searchParams.get('next');

    console.log('Callback URL:', request.url);
    console.log('Code present:', !!code);
    console.log('Access token present:', !!accessToken);
    console.log('Refresh token present:', !!refreshToken);
    console.log('Next destination:', rawNext);
    console.log('Origin:', origin);

    const supabase = await createClient();

  if (accessToken && refreshToken) {
    console.log('Setting session from provided tokens...');
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      console.error('Token session error:', sessionError);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=${encodeURIComponent(sessionError.message)}`
      );
    }
    const redirectUrl = await resolveRedirect({
      request,
      origin,
      next: rawNext,
      supabase,
      userId: sessionData?.session?.user?.id,
    });
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
    
    // Update user metadata with plan selection if provided
    const plan = searchParams.get('plan');
    if (plan && data.session?.user) {
      console.log('Updating user metadata with plan:', plan);
      try {
        await supabase.auth.updateUser({
          data: {
            plan_type: plan,
            subscription_tier: plan,
            role: 'trial',
          }
        });
        console.log('User metadata updated successfully');
      } catch (metaError) {
        console.error('Failed to update user metadata:', metaError);
        // Don't fail the auth flow, just log the error
      }
    }
    
    const redirectUrl = await resolveRedirect({
      request,
      origin,
      next: rawNext,
      supabase,
      userId: data.session?.user?.id,
    });

    console.log('Redirecting to:', redirectUrl);
    return NextResponse.redirect(redirectUrl);
  }

    console.error('No code in callback - redirecting to error page');
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=callback_error`);
  }
}

async function resolveRedirect({
  request,
  origin,
  next,
  supabase,
  userId,
}: {
  request: Request;
  origin: string;
  next: string | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId?: string;
}) {
  const defaultPath = '/dashboard';
  const sanitizedNext = sanitizePath(next);
  if (sanitizedNext) {
    return buildRedirectUrl({ request, origin, path: sanitizedNext });
  }

  if (!userId) {
    console.warn('resolveRedirect: Missing user ID, falling back to default path');
    return buildRedirectUrl({ request, origin, path: defaultPath });
  }

  let user;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.warn('Failed to get user from Supabase:', error);
    return buildRedirectUrl({ request, origin, path: defaultPath });
  }

  let profile;
  try {
    profile = await getUserProfile(userId);
  } catch (error) {
    console.warn('Failed to get user profile:', error);
    profile = undefined;
  }

  const role = deriveRole({
    profileRole: profile?.role,
    appRole: user?.app_metadata?.role as string | undefined,
  });

  const planStatus = profile?.planStatus ?? profile?.subscriptionStatus ?? undefined;

  const resolvedPath = getRedirectForRole({ role, planStatus });
  return buildRedirectUrl({ request, origin, path: resolvedPath });
}

function buildRedirectUrl({
  request,
  origin,
  path,
}: {
  request: Request;
  origin: string;
  path: string;
}) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';

  return isLocalEnv
    ? `${origin}${path}`
    : forwardedHost
      ? `https://${forwardedHost}${path}`
      : `${origin}${path}`;
}
