/**
 * Consultant RFQ Response API
 *
 * POST: Respond to an RFQ
 *
 * @story US-PH06
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validateUuid } from '@/lib/api/validation';

const respondSchema = z.object({
  message: z.string().min(50).max(1000),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id: rfqId } = await context.params;

  // Validate UUID parameter (TASK-007)
  const uuidError = validateUuid(rfqId, 'rfqId');
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
        message: 'Upgrade to Advisor or Capital plan to respond to RFQs.',
      },
      { status: 403 }
    );
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = respondSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    );
  }

  const { message } = validation.data;

  // Verify RFQ exists and is open
  const { data: rfq, error: rfqError } = await supabase
    .from('consultant_requests')
    .select('id, status, expires_at')
    .eq('id', rfqId)
    .single();

  if (rfqError || !rfq) {
    return NextResponse.json(
      { error: 'not_found', message: 'RFQ not found' },
      { status: 404 }
    );
  }

  if (rfq.status !== 'open') {
    if (rfq.status === 'filled') {
      return NextResponse.json(
        { error: 'rfq_filled', message: 'This request has been filled.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'rfq_closed', message: 'This request is no longer accepting responses.' },
      { status: 409 }
    );
  }

  if (new Date(rfq.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'rfq_expired', message: 'This request is no longer accepting responses.' },
      { status: 409 }
    );
  }

  // Create response (unique constraint will catch duplicates)
  const { data: response, error } = await supabase
    .from('consultant_request_responses')
    .insert({
      request_id: rfqId,
      consultant_id: user.id,
      message,
      status: 'pending',
    })
    .select('id, status, responded_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return NextResponse.json(
        { error: 'already_responded', message: "You've already responded to this request." },
        { status: 409 }
      );
    }
    console.error('[consultant/rfq/respond] Insert error:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      responseId: response.id,
      status: response.status,
      respondedAt: response.responded_at,
    },
    { status: 201 }
  );
}

export const dynamic = 'force-dynamic';
