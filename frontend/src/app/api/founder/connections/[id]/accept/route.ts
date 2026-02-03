/**
 * Founder Accept Connection API
 *
 * POST: Accept a connection request from a consultant
 *
 * @story US-FM05
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validateUuid } from '@/lib/api/validation';

const acceptSchema = z.object({
  confirmedRelationshipType: z
    .enum(['advisory', 'capital', 'program', 'service', 'ecosystem'])
    .optional(),
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

  // Parse request body (optional)
  let body = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const validation = acceptSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    );
  }

  // Call the SECURITY DEFINER function to accept (TASK-012: pass confirmedRelationshipType)
  const { data: result, error } = await supabase.rpc('accept_connection', {
    connection_id: connectionId,
    confirmed_relationship_type: validation.data?.confirmedRelationshipType || null,
  });

  if (error) {
    console.error('[founder/connections/accept] RPC error:', error);
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

  return NextResponse.json({
    connectionId: result.connection_id,
    status: 'active',
    relationshipType: result.relationship_type,
    acceptedAt: result.accepted_at,
    message: 'Connection established. You can now share validation evidence.',
  });
}

export const dynamic = 'force-dynamic';
