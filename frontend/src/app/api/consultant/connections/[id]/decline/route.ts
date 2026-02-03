/**
 * Consultant Decline Connection API
 *
 * POST: Decline a connection request from a founder
 *
 * @story US-PH04
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validateUuid } from '@/lib/api/validation';

const declineSchema = z.object({
  reason: z.enum(['not_right_fit', 'timing', 'other']).optional(),
});

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
        message: 'Upgrade to Advisor or Capital plan to decline connections.',
      },
      { status: 403 }
    );
  }

  // Parse request body (optional)
  let body = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const validation = declineSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    );
  }

  // Call the SECURITY DEFINER function to decline
  const { data: result, error } = await supabase.rpc('decline_connection', {
    connection_id: connectionId,
    decline_reason: validation.data?.reason || null,
  });

  if (error) {
    console.error('[consultant/connections/decline] RPC error:', error);
    return NextResponse.json(
      { error: 'Failed to decline connection' },
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

  return NextResponse.json({
    connectionId: result.connection_id,
    status: 'declined',
    declinedAt: result.declined_at,
    cooldownEndsAt: result.cooldown_ends_at,
    message: 'Request declined. A new request can be sent after 30 days.',
  });
}

export const dynamic = 'force-dynamic';
