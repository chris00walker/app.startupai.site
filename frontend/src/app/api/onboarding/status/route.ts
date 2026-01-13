import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/onboarding/status
 *
 * Returns the current state of an onboarding session including:
 * - Current stage (1-7)
 * - Overall progress percentage
 * - Stage-specific progress
 * - Conversation history length
 *
 * Used by the frontend to update UI after AI tool calls advance stages.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get admin client for database operations
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[api/onboarding/status] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = sessionClient;
    }

    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('onboarding_sessions')
      .select('session_id, current_stage, overall_progress, stage_progress, status, conversation_history')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Return session status
    return NextResponse.json({
      success: true,
      sessionId: sessionData.session_id,
      currentStage: sessionData.current_stage || 1,
      totalStages: 7,
      overallProgress: sessionData.overall_progress || 0,
      stageProgress: sessionData.stage_progress || 0,
      messageCount: sessionData.conversation_history?.length || 0,
      status: sessionData.status || 'active',
    });

  } catch (error) {
    console.error('[api/onboarding/status] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch session status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
