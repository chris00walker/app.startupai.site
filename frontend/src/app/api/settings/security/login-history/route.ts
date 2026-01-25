/**
 * Login History API Route
 *
 * GET: Fetch user's login history
 * POST: Record a new login event (called internally from auth callback)
 *
 * @story US-AS04
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = supabase
      .from('login_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      // If table doesn't exist yet, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({
          history: [],
          total: 0,
          limit,
          offset,
        });
      }
      console.error('[api/settings/security/login-history] Error fetching history:', error);
      return NextResponse.json({ error: 'Failed to fetch login history' }, { status: 500 });
    }

    return NextResponse.json({
      history: data || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('[api/settings/security/login-history] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Record a new login event
 * Called from auth callback after successful authentication
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

    // Parse optional body for additional info (login method, etc.)
    let loginMethod = 'password';
    let location = null;
    try {
      const body = await request.json();
      if (body.loginMethod) {
        loginMethod = body.loginMethod;
      }
      if (body.location) {
        location = body.location;
      }
    } catch {
      // No body provided, use defaults
    }

    // Insert login record (column names match Drizzle schema)
    const { error: insertError } = await supabase
      .from('login_history')
      .insert({
        user_id: user.id,
        login_method: loginMethod,
        ip_address: ipAddress,
        user_agent: userAgent.substring(0, 500), // Truncate to reasonable length
        device_type: deviceType,
        browser: browser.name ? `${browser.name} ${browser.version || ''}`.trim() : null,
        operating_system: os.name ? `${os.name} ${os.version || ''}`.trim() : null,
        location: location,
        success: true,
        is_suspicious: false, // TODO: Implement suspicious login detection
      });

    if (insertError) {
      // Don't fail silently, but also don't break the auth flow
      console.error('[api/settings/security/login-history] Error recording login:', insertError);
      // Return success anyway - login history is non-critical
      return NextResponse.json({ success: true, warning: 'Login recorded with errors' });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[api/settings/security/login-history] POST unexpected error:', error);
    // Return success anyway - login history is non-critical
    return NextResponse.json({ success: true, warning: 'Login history recording failed' });
  }
}
