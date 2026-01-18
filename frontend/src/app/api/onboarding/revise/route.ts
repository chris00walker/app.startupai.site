/**
 * Reset Session for Revision
 *
 * Called when user clicks "Revise" in SummaryModal.
 * Cancels any pending queue row and resets session to active.
 *
 * Part of the split completion flow that enables Approve/Revise:
 * - Stage 7 completes → Session marked complete (no queue)
 * - User clicks Approve → /api/onboarding/queue inserts queue row
 * - User clicks Revise → This endpoint resets session to active
 *
 * @see prancy-tickling-quokka.md
 * @see precious-kindling-balloon.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface ReviseRequest {
  sessionId: string;
}

interface ReviseResponse {
  success: boolean;
  status: 'reset' | 'cannot_revise' | 'error';
  queueDeleted?: boolean;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<ReviseResponse>> {
  try {
    const body = await req.json();
    const { sessionId } = body as ReviseRequest;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, status: 'error', error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    console.log('[api/onboarding/revise] Resetting session for revision:', sessionId);

    // Authenticate
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[api/onboarding/revise] Auth error:', authError);
      return NextResponse.json(
        { success: false, status: 'error', error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call RPC to reset session
    const { data, error } = await supabase.rpc('reset_session_for_revision', {
      p_session_id: sessionId,
      p_user_id: user.id,
    });

    if (error) {
      console.error('[api/onboarding/revise] RPC error:', error);
      return NextResponse.json(
        { success: false, status: 'error', error: error.message },
        { status: 500 }
      );
    }

    const result = data as { status: string; queue_deleted?: boolean; error?: string };
    console.log('[api/onboarding/revise] RPC result:', result);

    if (result.status === 'reset') {
      return NextResponse.json({
        success: true,
        status: 'reset',
        queueDeleted: result.queue_deleted ?? false,
      });
    }

    if (result.status === 'cannot_revise') {
      return NextResponse.json({
        success: false,
        status: 'cannot_revise',
        error: result.error || 'Analysis already in progress or completed',
      });
    }

    // not_found, unauthorized, or other errors
    return NextResponse.json(
      { success: false, status: 'error', error: result.error || 'Unknown error' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[api/onboarding/revise] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, status: 'error', error: errorMessage },
      { status: 500 }
    );
  }
}
