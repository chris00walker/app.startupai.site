import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/onboarding/abandon
 *
 * Marks an onboarding session as abandoned.
 * This allows the user to start a fresh conversation without losing historical data.
 *
 * The session data is preserved (not deleted) for analytics and potential recovery.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const sessionClient = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get admin client for database operations
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[api/onboarding/abandon] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = sessionClient;
    }

    // Verify session exists and belongs to user
    const { data: existingSession, error: fetchError } = await supabaseClient
      .from('onboarding_sessions')
      .select('session_id, user_id, status')
      .eq('session_id', sessionId)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership (skip for admin client which can access all)
    if (user && existingSession.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Session does not belong to user' },
        { status: 403 }
      );
    }

    // Don't abandon already completed sessions
    if (existingSession.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Cannot abandon completed session' },
        { status: 400 }
      );
    }

    // Mark session as abandoned
    const { error: updateError } = await supabaseClient
      .from('onboarding_sessions')
      .update({
        status: 'abandoned',
        last_activity: new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('[api/onboarding/abandon] Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to abandon session' },
        { status: 500 }
      );
    }

    console.log('[api/onboarding/abandon] Session abandoned:', sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session abandoned successfully',
    });

  } catch (error) {
    console.error('[api/onboarding/abandon] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to abandon session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
