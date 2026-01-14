import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/onboarding/debug?sessionId=xxx
 *
 * DEBUG ONLY: Returns raw session data from database to diagnose progress issues.
 * Shows stage_data including tool call results.
 */
export async function GET(request: NextRequest) {
  // Only allow in development/preview
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV?.includes('preview')) {
    return NextResponse.json({ error: 'Debug endpoint disabled in production' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    // Authenticate user
    const sessionClient = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin client
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch {
      supabaseClient = sessionClient;
    }

    // Get raw session data
    const { data: session, error } = await supabaseClient
      .from('onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found', details: error }, { status: 404 });
    }

    // Verify ownership
    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Not your session' }, { status: 403 });
    }

    // Extract key diagnostic info
    const stageData = session.stage_data || {};
    const diagnostics = {
      sessionId: session.session_id,
      status: session.status,
      currentStage: session.current_stage,
      overallProgress: session.overall_progress,
      stageProgress: session.stage_progress,
      lastActivity: session.last_activity,
      conversationHistoryLength: session.conversation_history?.length || 0,

      // Tool call evidence - these only exist if tools were called
      hasQualityAssessments: Object.keys(stageData).filter(k => k.includes('_quality')).length,
      hasStageSummaries: Object.keys(stageData).filter(k => k.includes('_summary')).length,
      hasStageData: Object.keys(stageData).filter(k => k.includes('_data')).length,
      hasCompletion: !!stageData.completion,
      hasBrief: !!stageData.brief,

      // Raw stage_data for inspection
      stageDataKeys: Object.keys(stageData),

      // Sample of actual data
      brief: stageData.brief || null,
      completion: stageData.completion || null,
      qualityAssessments: Object.entries(stageData)
        .filter(([k]) => k.includes('_quality'))
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
    };

    return NextResponse.json({
      success: true,
      diagnostics,
      rawSession: {
        current_stage: session.current_stage,
        overall_progress: session.overall_progress,
        stage_progress: session.stage_progress,
        status: session.status,
        stage_data: stageData,
      },
    });

  } catch (error) {
    console.error('[api/onboarding/debug] Error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
