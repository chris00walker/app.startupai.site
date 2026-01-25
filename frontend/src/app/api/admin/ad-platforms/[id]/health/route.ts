/**
 * Admin Ad Platform Health Check API Route
 *
 * POST: Run a health check on a platform connection
 *
 * @story US-AM06, US-AM07
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Validate admin role
async function validateAdminRole(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, userId: string) {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    return false;
  }
  return true;
}

/**
 * Perform a health check on the platform connection.
 * In production, this would make an actual API call to verify credentials.
 * For now, we simulate the health check.
 */
async function performHealthCheck(connection: {
  id: string;
  platform: string;
  credentials_encrypted: string;
}) {
  // In production, decrypt credentials and make API call to platform
  // For now, simulate a successful health check with random latency
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

  // Simulate occasional errors for testing
  const shouldSimulateError = false; // Set to true to test error handling

  if (shouldSimulateError && Math.random() < 0.2) {
    return {
      success: false,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      errorMessage: 'API rate limit exceeded. Try again in a few minutes.',
      rateLimitRemaining: '0',
      rateLimitResetAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }

  return {
    success: true,
    rateLimitRemaining: String(Math.floor(Math.random() * 5000) + 1000),
    rateLimitResetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const isAdmin = await validateAdminRole(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch connection
    const { data: connection, error: connectionError } = await supabase
      .from('ad_platform_connections')
      .select('id, platform, credentials_encrypted')
      .eq('id', id)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Perform health check
    const healthResult = await performHealthCheck(connection);

    // Update connection with health check results
    const updates: Record<string, unknown> = {
      last_health_check: new Date().toISOString(),
      rate_limit_remaining: healthResult.rateLimitRemaining,
      rate_limit_reset_at: healthResult.rateLimitResetAt,
      updated_at: new Date().toISOString(),
    };

    if (healthResult.success) {
      updates.last_successful_call = new Date().toISOString();
      updates.error_message = null;
      updates.error_code = null;
      // If connection was in error state and health check passed, set to active
      updates.status = 'active';
    } else {
      updates.error_code = healthResult.errorCode;
      updates.error_message = healthResult.errorMessage;
      updates.status = 'error';
    }

    const { data: updatedConnection, error: updateError } = await supabase
      .from('ad_platform_connections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[api/admin/ad-platforms/[id]/health] Error updating connection:', updateError);
      return NextResponse.json({ error: 'Failed to update health status' }, { status: 500 });
    }

    return NextResponse.json({
      success: healthResult.success,
      connection: updatedConnection,
      healthCheck: {
        checkedAt: updates.last_health_check,
        rateLimitRemaining: healthResult.rateLimitRemaining,
        rateLimitResetAt: healthResult.rateLimitResetAt,
        ...(healthResult.success ? {} : {
          errorCode: healthResult.errorCode,
          errorMessage: healthResult.errorMessage,
        }),
      },
    });

  } catch (error) {
    console.error('[api/admin/ad-platforms/[id]/health] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
