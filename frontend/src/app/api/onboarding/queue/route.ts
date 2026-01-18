/**
 * Queue Onboarding for CrewAI Processing
 *
 * Called when user clicks "Approve" in SummaryModal.
 * Inserts the pending_completions queue row.
 *
 * Part of the split completion flow that enables Approve/Revise:
 * - Stage 7 completes → Session marked complete (no queue)
 * - User clicks Approve → This endpoint inserts queue row
 * - User clicks Revise → /api/onboarding/revise resets session
 *
 * @see prancy-tickling-quokka.md
 * @see precious-kindling-balloon.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface QueueRequest {
  sessionId: string;
}

interface QueueResponse {
  success: boolean;
  status: 'queued' | 'already_queued' | 'invalid_state' | 'error';
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<QueueResponse>> {
  try {
    const body = await req.json();
    const { sessionId } = body as QueueRequest;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, status: 'error', error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    console.log('[api/onboarding/queue] Queueing session for processing:', sessionId);

    // Authenticate
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[api/onboarding/queue] Auth error:', authError);
      return NextResponse.json(
        { success: false, status: 'error', error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call RPC to queue for processing
    const { data, error } = await supabase.rpc('queue_onboarding_for_kickoff', {
      p_session_id: sessionId,
      p_user_id: user.id,
    });

    if (error) {
      console.error('[api/onboarding/queue] RPC error:', error);
      return NextResponse.json(
        { success: false, status: 'error', error: error.message },
        { status: 500 }
      );
    }

    const result = data as { status: string; error?: string };
    console.log('[api/onboarding/queue] RPC result:', result);

    if (result.status === 'queued') {
      return NextResponse.json({
        success: true,
        status: 'queued',
      });
    }

    if (result.status === 'already_queued') {
      return NextResponse.json({
        success: true,
        status: 'already_queued',
      });
    }

    if (result.status === 'invalid_state') {
      return NextResponse.json(
        { success: false, status: 'invalid_state', error: result.error || 'Session not in completed state' },
        { status: 400 }
      );
    }

    // not_found, unauthorized, or other errors
    return NextResponse.json(
      { success: false, status: 'error', error: result.error || 'Unknown error' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[api/onboarding/queue] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, status: 'error', error: errorMessage },
      { status: 500 }
    );
  }
}
