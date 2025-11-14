/**
 * OAuth Callback Route
 * 
 * Handles OAuth provider callbacks and exchanges code for session.
 */

import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserProfile } from '@/db/queries/users';
import { deriveRole, getRedirectForRole, sanitizePath } from '@/lib/auth/roles';

export async function GET(request: NextRequest) {
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

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

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
    
    // Update user metadata with plan and role selection if provided
    const plan = searchParams.get('plan');
    const role = searchParams.get('role');

    if ((plan || role) && data.session?.user) {
      console.log('Updating user metadata - plan:', plan, 'role:', role);
      try {
        const metadata: Record<string, string> = {};

        if (plan) {
          metadata.plan_type = plan;
          metadata.subscription_tier = plan;
        }

        if (role) {
          metadata.role = role;
        } else if (plan === 'trial') {
          // Default to founder for trial if no role specified
          metadata.role = 'founder';
        }

        await supabase.auth.updateUser({
          data: metadata
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
  supabase: ReturnType<typeof createServerClient>;
  userId?: string;
}) {
  const sanitizedNext = sanitizePath(next);
  if (sanitizedNext) {
    return buildRedirectUrl({ request, origin, path: sanitizedNext });
  }

  if (!userId) {
    console.warn('resolveRedirect: Missing user ID, using default role redirect');
    const defaultPath = getRedirectForRole({ role: 'trial', planStatus: null });
    return buildRedirectUrl({ request, origin, path: defaultPath });
  }

  let user;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.warn('Failed to get user from Supabase:', error);
    const defaultPath = getRedirectForRole({ role: 'trial', planStatus: null });
    return buildRedirectUrl({ request, origin, path: defaultPath });
  }

  let profile;
  try {
    profile = await getUserProfile(userId);
  } catch (error) {
    console.warn('Failed to get user profile:', error);
    const defaultPath = getRedirectForRole({ role: 'trial', planStatus: null });
    return buildRedirectUrl({ request, origin, path: defaultPath });
  }

  const role = deriveRole({
    profileRole: profile?.role,
    appRole: user?.app_metadata?.role as string | undefined,
  });

  const planStatus = profile?.plan_status ?? profile?.subscription_status ?? undefined;

  const resolvedPath = getRedirectForRole({ role, planStatus });
  console.log(`Redirecting ${role} user to: ${resolvedPath}`);
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
