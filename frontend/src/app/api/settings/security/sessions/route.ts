/**
 * Session Management API Route
 *
 * GET: List all active sessions for the current user
 * POST: Register a new session (called from auth callback)
 * DELETE: Revoke all sessions except current
 *
 * @story US-AS05
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';
import { logSessionRevocation } from '@/lib/security/audit-log';

/**
 * Generate a session token for tracking
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a user-friendly device name
 */
function generateDeviceName(browser: string | undefined, os: string | undefined): string {
  const parts: string[] = [];
  if (browser) parts.push(browser);
  if (os) parts.push(`on ${os}`);
  return parts.length > 0 ? parts.join(' ') : 'Unknown Device';
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current session token from cookie or generate identifier
    const { data: sessionData } = await supabase.auth.getSession();
    const currentAccessToken = sessionData?.session?.access_token;

    // Query user_sessions table
    const { data: sessions, error: queryError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_active_at', { ascending: false });

    if (queryError) {
      // If table doesn't exist yet, return empty array
      if (queryError.code === '42P01') {
        return NextResponse.json({
          sessions: [],
          total: 0,
        });
      }
      console.error('[api/settings/security/sessions] Error fetching sessions:', queryError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Mark which session is current (by comparing with stored token or using heuristics)
    const processedSessions = (sessions || []).map(session => ({
      id: session.id,
      deviceName: session.device_name || 'Unknown Device',
      browser: session.browser,
      operatingSystem: session.operating_system,
      deviceType: session.device_type,
      ipAddress: session.ip_address,
      location: session.location,
      isCurrent: session.is_current || false,
      lastActiveAt: session.last_active_at,
      createdAt: session.created_at,
    }));

    return NextResponse.json({
      sessions: processedSessions,
      total: processedSessions.length,
    });

  } catch (error) {
    console.error('[api/settings/security/sessions] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Register a new session (called from auth callback)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request headers for device info
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

    // Mark all other sessions as not current
    await supabase
      .from('user_sessions')
      .update({ is_current: false })
      .eq('user_id', user.id);

    // Create new session record
    const sessionToken = generateSessionToken();
    const deviceName = generateDeviceName(browserName, osName);

    const { data: session, error: insertError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent.substring(0, 500),
        device_type: deviceType,
        browser: browserName,
        operating_system: osName,
        device_name: deviceName,
        is_current: true,
        last_active_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[api/settings/security/sessions] Error creating session:', insertError);
      // Don't fail - session tracking is non-critical
      return NextResponse.json({ success: true, warning: 'Session tracking failed' });
    }

    return NextResponse.json({
      success: true,
      sessionId: session?.id,
    });

  } catch (error) {
    console.error('[api/settings/security/sessions] POST unexpected error:', error);
    return NextResponse.json({ success: true, warning: 'Session tracking failed' });
  }
}

/**
 * Revoke all sessions except current
 */
export async function DELETE() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all sessions for this user from our tracking table
    const { error: deleteError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', user.id)
      .eq('is_current', false);

    if (deleteError) {
      console.error('[api/settings/security/sessions] Error deleting sessions:', deleteError);
    }

    // Log session revocation before signing out (user context will be lost after)
    logSessionRevocation(user.id);

    // Also sign out from all Supabase sessions
    const { error } = await supabase.auth.signOut({ scope: 'global' });

    if (error) {
      console.error('[api/settings/security/sessions] Error signing out:', error);
      return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All sessions have been revoked. Please sign in again.',
    });

  } catch (error) {
    console.error('[api/settings/security/sessions] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
