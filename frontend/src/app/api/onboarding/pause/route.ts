import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/onboarding/pause
 *
 * Pauses an onboarding session so it can be resumed later.
 * This updates the session status to 'paused' and preserves all conversation data.
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
      console.warn('[api/onboarding/pause] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
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

    // Verify ownership
    if (existingSession.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Session does not belong to user' },
        { status: 403 }
      );
    }

    // Only allow pausing active sessions (already paused is idempotent)
    if (existingSession.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Cannot pause completed session' },
        { status: 400 }
      );
    }

    if (existingSession.status === 'abandoned') {
      return NextResponse.json(
        { success: false, error: 'Cannot pause abandoned session' },
        { status: 400 }
      );
    }

    // If already paused, return success (idempotent)
    if (existingSession.status === 'paused') {
      return NextResponse.json({
        success: true,
        message: 'Session already paused',
      });
    }

    // Mark session as paused
    const { error: updateError } = await supabaseClient
      .from('onboarding_sessions')
      .update({
        status: 'paused',
        last_activity: new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('[api/onboarding/pause] Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to pause session' },
        { status: 500 }
      );
    }

    console.log('[api/onboarding/pause] Session paused:', sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session paused successfully',
    });

  } catch (error) {
    console.error('[api/onboarding/pause] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to pause session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
