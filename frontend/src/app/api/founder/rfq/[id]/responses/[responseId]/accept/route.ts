/**
 * Founder Accept RFQ Response API
 *
 * POST: Accept an RFQ response from a consultant
 *
 * @story US-FM09
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validateUuid } from '@/lib/api/validation';

const acceptSchema = z.object({
  markAsFilled: z.boolean().optional().default(false),
});

type RouteContext = {
  params: Promise<{ id: string; responseId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id: rfqId, responseId } = await context.params;

  // Validate UUID parameters (TASK-007)
  const rfqIdError = validateUuid(rfqId, 'rfqId');
  if (rfqIdError) return rfqIdError;
  const responseIdError = validateUuid(responseId, 'responseId');
  if (responseIdError) return responseIdError;

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
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

  const { markAsFilled } = validation.data;

  // Verify founder owns the RFQ and get relationship_type
  const { data: rfq, error: rfqError } = await supabase
    .from('consultant_requests')
    .select('id, founder_id, relationship_type')
    .eq('id', rfqId)
    .single();

  if (rfqError || !rfq) {
    return NextResponse.json(
      { error: 'not_found', message: 'RFQ not found' },
      { status: 404 }
    );
  }

  if (rfq.founder_id !== user.id) {
    return NextResponse.json(
      { error: 'forbidden', message: 'You can only manage responses to your own RFQs' },
      { status: 403 }
    );
  }

  // Get the response and consultant info
  const { data: response, error: responseError } = await supabase
    .from('consultant_request_responses')
    .select('id, consultant_id, status')
    .eq('id', responseId)
    .eq('request_id', rfqId)
    .single();

  if (responseError || !response) {
    return NextResponse.json(
      { error: 'not_found', message: 'Response not found' },
      { status: 404 }
    );
  }

  if (response.status !== 'pending') {
    return NextResponse.json(
      { error: 'invalid_state', message: 'This response has already been processed' },
      { status: 409 }
    );
  }

  // Check for existing connection before creating a duplicate
  const { data: existingConnection } = await supabase
    .from('consultant_clients')
    .select('id, connection_status')
    .eq('consultant_id', response.consultant_id)
    .eq('client_id', user.id)
    .in('connection_status', ['requested', 'active'])
    .single();

  // Update response status
  const { error: updateError } = await supabase
    .from('consultant_request_responses')
    .update({
      status: 'accepted',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', responseId);

  if (updateError) {
    console.error('[founder/rfq/responses/accept] Update error:', updateError);
    return NextResponse.json(
      { error: 'Failed to accept response' },
      { status: 500 }
    );
  }

  // Create connection between founder and consultant (if not already connected)
  let connection: { id: string } | null = null;
  let existingConnectionUsed = false;

  if (existingConnection) {
    // Already connected - use existing connection
    connection = { id: existingConnection.id };
    existingConnectionUsed = true;
  } else {
    // Create new connection using RFQ's relationship_type
    const { data: newConnection, error: connectionError } = await supabase
      .from('consultant_clients')
      .insert({
        consultant_id: response.consultant_id,
        client_id: user.id,
        relationship_type: rfq.relationship_type, // Use RFQ's type, not hardcoded
        connection_status: 'active',
        initiated_by: 'founder',
        request_message: 'Connected via RFQ response',
        accepted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (connectionError) {
      console.error('[founder/rfq/responses/accept] Connection error:', connectionError);
      // Don't fail the whole operation - response is already accepted
    }
    connection = newConnection;
  }

  // Optionally mark RFQ as filled
  if (markAsFilled) {
    await supabase
      .from('consultant_requests')
      .update({ status: 'filled' })
      .eq('id', rfqId);
  }

  // Get consultant name for message
  const { data: consultant } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', response.consultant_id)
    .single();

  return NextResponse.json({
    responseId,
    status: 'accepted',
    connectionId: connection?.id,
    existingConnection: existingConnectionUsed,
    message: existingConnectionUsed
      ? `Already connected with ${consultant?.full_name || 'the consultant'}.`
      : `Connection established with ${consultant?.full_name || 'the consultant'}.`,
  });
}

export const dynamic = 'force-dynamic';
