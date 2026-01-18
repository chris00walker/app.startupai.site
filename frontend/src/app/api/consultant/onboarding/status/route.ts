import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin client for database operations
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[ConsultantStatus] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = supabase;
    }

    // Fetch session from database (including stage_data for completion detection)
    const { data: session, error: sessionError } = await supabaseClient
      .from('consultant_onboarding_sessions')
      .select('current_stage, overall_progress, stage_progress, status, stage_data')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('[ConsultantStatus] Session not found:', sessionId);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Extract stage_data for completion detection and SummaryModal
    const stageData = session.stage_data as Record<string, unknown> | null;
    const isCompleted = session.status === 'completed' || !!stageData?.completion;
    const briefData = stageData?.brief || {};

    return NextResponse.json({
      success: true,
      currentStage: session.current_stage,
      overallProgress: session.overall_progress,
      stageProgress: session.stage_progress,
      status: session.status,
      completed: isCompleted,
      briefData: isCompleted ? briefData : undefined,
    });

  } catch (error: any) {
    console.error('[ConsultantStatus] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
