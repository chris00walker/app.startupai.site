/**
 * OAuth Callback Route
 *
 * Handles OAuth provider callbacks and exchanges code for session.
 * @story US-FT01, US-F01, US-AS04
 */

import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { getUserProfile } from '@/db/queries/users';
import { deriveRole, getRedirectForRole, sanitizePath } from '@/lib/auth/roles';

import { UAParser } from 'ua-parser-js';

/**
 * Record login event directly to login_history table
 * Non-blocking - failures are logged but don't affect auth flow
 */
async function recordLoginEvent(
  request: NextRequest,
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  loginMethod: string
): Promise<void> {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // Parse user agent for device info
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    // Determine device type
    let deviceType = 'desktop';
    if (device.type === 'mobile') {
      deviceType = 'mobile';
    } else if (device.type === 'tablet') {
      deviceType = 'tablet';
    }

    // Insert login record directly
    const { error } = await supabase
      .from('login_history')
      .insert({
        user_id: userId,
        login_method: loginMethod,
        ip_address: ipAddress,
        user_agent: userAgent.substring(0, 500),
        device_type: deviceType,
        browser: browser.name ? `${browser.name} ${browser.version || ''}`.trim() : null,
        operating_system: os.name ? `${os.name} ${os.version || ''}`.trim() : null,
        success: true,
        is_suspicious: false,
      });

    if (error) {
      console.error('Failed to record login event:', error);
    } else {
      console.log('Login event recorded for user:', userId);
    }
  } catch (error) {
    // Log but don't fail the auth flow
    console.error('Failed to record login event:', error);
  }
}

import crypto from 'crypto';

/**
 * Register a new session in user_sessions table
 * Non-blocking - failures are logged but don't affect auth flow
 *
 * @story US-AS05
 */
async function registerSession(
  request: NextRequest,
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<void> {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // Parse user agent for device info
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    // Determine device type
    let deviceType = 'desktop';
    if (device.type === 'mobile') {
      deviceType = 'mobile';
    } else if (device.type === 'tablet') {
      deviceType = 'tablet';
    }

    const browserName = browser.name ? `${browser.name} ${browser.version || ''}`.trim() : undefined;
    const osName = os.name ? `${os.name} ${os.version || ''}`.trim() : undefined;
    const deviceName = browserName && osName ? `${browserName} on ${osName}` : 'Unknown Device';

    // Mark all other sessions as not current
    await supabase
      .from('user_sessions')
      .update({ is_current: false })
      .eq('user_id', userId);

    // Create new session record
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const { error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent.substring(0, 500),
        device_type: deviceType,
        browser: browserName,
        operating_system: osName,
        device_name: deviceName,
        is_current: true,
        last_active_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to register session:', error);
    } else {
      console.log('Session registered for user:', userId);
    }
  } catch (error) {
    // Log but don't fail the auth flow
    console.error('Failed to register session:', error);
  }
}

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

    // Record login event and register session (non-blocking)
    if (sessionData?.session?.user?.id) {
      recordLoginEvent(request, supabase, sessionData.session.user.id, 'oauth_token');
      registerSession(request, supabase, sessionData.session.user.id);
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
    
    // Update user metadata with plan, role, and trial_intent selection if provided
    const plan = searchParams.get('plan');
    const role = searchParams.get('role');
    const trialIntent = searchParams.get('trial_intent');
    const inviteToken = searchParams.get('invite');

    if ((plan || role || trialIntent) && data.session?.user) {
      console.log('Updating user metadata - plan:', plan, 'role:', role, 'trial_intent:', trialIntent);
      try {
        const metadata: Record<string, string | null> = {};

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

        // Store trial_intent for trial users
        if (trialIntent && plan === 'trial') {
          metadata.trial_intent = trialIntent;
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

    // Handle invite token linking if present
    if (inviteToken && data.session?.user) {
      console.log('Linking account via invite token...');
      try {
        // Use the database function to link the account
        const { data: linkResult, error: linkError } = await supabase.rpc('link_client_via_invite', {
          p_invite_token: inviteToken,
          p_client_id: data.session.user.id,
        });

        if (linkError) {
          console.error('Failed to link account via invite:', linkError);
          // Don't fail the auth flow, just log the error
        } else if (linkResult?.success) {
          console.log('Account linked to consultant:', linkResult.consultant_name);
        } else {
          console.warn('Invite linking returned:', linkResult);
        }
      } catch (linkError) {
        console.error('Exception linking account via invite:', linkError);
        // Don't fail the auth flow, just log the error
      }
    }

    // Record login event and register session (non-blocking)
    if (data.session?.user?.id) {
      recordLoginEvent(request, supabase, data.session.user.id, 'oauth_code');
      registerSession(request, supabase, data.session.user.id);
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
