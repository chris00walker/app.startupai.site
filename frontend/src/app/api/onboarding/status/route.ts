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
 * If sessionId is provided, returns that specific session.
 * If no sessionId is provided, finds the most recent active/paused session for the user.
 *
 * Used by the frontend to update UI after AI tool calls advance stages,
 * and to check for resumable sessions on the dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

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

    let sessionData;
    let sessionError;

    if (sessionId) {
      // Fetch specific session by ID
      const result = await supabaseClient
        .from('onboarding_sessions')
        .select('session_id, current_stage, overall_progress, stage_progress, status, conversation_history, last_activity, stage_data')
        .eq('session_id', sessionId)
        .single();
      sessionData = result.data;
      sessionError = result.error;
    } else {
      // Find most recent active or paused session for user
      const result = await supabaseClient
        .from('onboarding_sessions')
        .select('session_id, current_stage, overall_progress, stage_progress, status, conversation_history, last_activity, stage_data')
        .eq('user_id', user.id)
        .in('status', ['active', 'paused'])
        .order('last_activity', { ascending: false })
        .limit(1)
        .single();
      sessionData = result.data;
      sessionError = result.error;
    }

    if (sessionError || !sessionData) {
      // No session found - return success with no data (not an error)
      if (!sessionId) {
        return NextResponse.json({
          success: true,
          sessionId: null,
          status: null,
        });
      }
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
      lastActivity: sessionData.last_activity,
      // Include completion data when session is completed (for fallback fetch)
      ...(sessionData.status === 'completed' && sessionData.stage_data?.completion
        ? { completion: sessionData.stage_data.completion }
        : {}),
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
