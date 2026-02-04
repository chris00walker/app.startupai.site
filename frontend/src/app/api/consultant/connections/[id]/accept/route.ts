/**
 * Consultant Accept Connection API
 *
 * POST: Accept a connection request from a founder
 *
 * @story US-PH04
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateUuid } from '@/lib/api/validation';
import { trackMarketplaceServerEvent } from '@/lib/analytics/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id: connectionId } = await context.params;

  // Validate UUID parameter (TASK-007)
  const uuidError = validateUuid(connectionId, 'connectionId');
  if (uuidError) return uuidError;

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is a verified consultant
  const { data: isVerified } = await supabase.rpc('is_verified_consultant');

  if (!isVerified) {
    return NextResponse.json(
      {
        error: 'unverified',
        message: 'Upgrade to Advisor or Capital plan to accept connections.',
      },
      { status: 403 }
    );
  }

  // Fetch connection details for analytics via RPC (bypasses RLS)
  const { data: connectionDetailsArray } = await supabase.rpc('get_connection_for_analytics', {
    p_connection_id: connectionId,
  });
  const connectionDetails = connectionDetailsArray?.[0];

  // Call the SECURITY DEFINER function to accept
  const { data: result, error } = await supabase.rpc('accept_connection', {
    connection_id: connectionId,
  });

  if (error) {
    console.error('[consultant/connections/accept] RPC error:', error);
    return NextResponse.json(
      { error: 'Failed to accept connection' },
      { status: 500 }
    );
  }

  // Check for application-level errors returned by the function
  if (result?.error) {
    const statusMap: Record<string, number> = {
      not_found: 404,
      forbidden: 403,
      invalid_state: 409,
    };
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: statusMap[result.error] || 400 }
    );
  }

  // Server-side analytics tracking (non-blocking)
  if (connectionDetails) {
    const createdAt = new Date(connectionDetails.created_at);
    const acceptedAt = new Date(result.accepted_at);
    const daysToAccept = Math.floor((acceptedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    trackMarketplaceServerEvent.connectionAccepted(
      user.id,
      connectionId,
      connectionDetails.relationship_type,
      connectionDetails.initiated_by as 'founder' | 'consultant',
      daysToAccept
    );
  }

  return NextResponse.json({
    connectionId: result.connection_id,
    status: 'active',
    acceptedAt: result.accepted_at,
    message: 'Connection established. You can now view validation evidence.',
  });
}

export const dynamic = 'force-dynamic';
