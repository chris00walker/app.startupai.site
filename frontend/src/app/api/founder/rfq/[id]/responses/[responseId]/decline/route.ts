/**
 * Founder Decline RFQ Response API
 *
 * POST: Decline an RFQ response from a consultant
 *
 * @story US-FM11
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validateUuid } from '@/lib/api/validation';
import { trackMarketplaceServerEvent } from '@/lib/analytics/server';

const declineSchema = z.object({
  reason: z.enum(['not_right_fit', 'went_another_direction', 'other']).optional(),
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

  const validation = declineSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    );
  }

  // Verify founder owns the RFQ
  const { data: rfq, error: rfqError } = await supabase
    .from('consultant_requests')
    .select('id, founder_id')
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

  // Get the response
  const { data: response, error: responseError } = await supabase
    .from('consultant_request_responses')
    .select('id, status')
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

  // Update response status
  const { error: updateError } = await supabase
    .from('consultant_request_responses')
    .update({
      status: 'declined',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', responseId);

  if (updateError) {
    console.error('[founder/rfq/responses/decline] Update error:', updateError);
    return NextResponse.json(
      { error: 'Failed to decline response' },
      { status: 500 }
    );
  }

  // Server-side analytics tracking (non-blocking)
  trackMarketplaceServerEvent.rfqResponseDeclined(user.id, rfqId, responseId, validation.data?.reason);

  return NextResponse.json({
    responseId,
    status: 'declined',
  });
}

export const dynamic = 'force-dynamic';
