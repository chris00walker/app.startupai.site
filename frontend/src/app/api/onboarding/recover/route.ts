/**
 * Onboarding Recovery Endpoint
 *
 * Manually triggers CrewAI analysis for existing completed onboarding sessions
 * that were stuck in the broken state before the fix.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { kickoffCrewAIAnalysis } from '@/lib/crewai/amp-client';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get admin client
    const adminClient = createAdminClient();

    // Fetch session
    const { data: session, error: sessionError } = await adminClient
      .from('onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized for this session' },
        { status: 403 }
      );
    }

    console.log('[api/onboarding/recover] Recovering session:', {
      sessionId,
      currentStage: session.current_stage,
      progress: session.overall_progress,
      hasStageData: !!session.stage_data,
    });

    // Extract brief data from stage_data or conversation_history
    const stageData = session.stage_data as Record<string, any> || {};
    const briefData = stageData.brief || {};

    // Check if we have enough data to proceed
    if (!briefData || Object.keys(briefData).length === 0) {
      return NextResponse.json(
        {
          error: 'Insufficient data to recover',
          message: 'No brief data found in session. You may need to restart onboarding.',
          canRecover: false,
        },
        { status: 400 }
      );
    }

    console.log('[api/onboarding/recover] Extracted brief data:', {
      hasProblem: !!briefData.problem_description,
      hasSolution: !!briefData.solution_description,
      hasCustomers: !!briefData.primary_customer_segment,
    });

    // Save entrepreneur brief
    const { data: brief, error: briefError } = await adminClient
      .rpc('upsert_entrepreneur_brief', {
        p_session_id: sessionId,
        p_user_id: user.id,
        p_brief_data: {
          customer_segments: briefData.target_customers || [],
          primary_customer_segment: briefData.primary_segment || briefData.target_customers,
          problem_description: briefData.problem_description || briefData.problem,
          problem_pain_level: briefData.pain_level || 5,
          solution_description: briefData.solution_description || briefData.solution,
          unique_value_proposition: briefData.unique_value_prop || briefData.differentiation,
          differentiation_factors: briefData.differentiation || briefData.differentiators || [],
          competitors: briefData.competitors || [],
          budget_range: briefData.budget_range || briefData.budget || 'not specified',
          available_channels: briefData.available_channels || briefData.channels || [],
          business_stage: briefData.current_stage || briefData.business_stage || 'idea',
          three_month_goals: briefData.short_term_goals || briefData.goals || [],
        },
      });

    if (briefError) {
      console.error('[api/onboarding/recover] Failed to save brief:', briefError);
    }

    // Create project from onboarding
    const { data: projectId, error: projectError } = await adminClient
      .rpc('create_project_from_onboarding', {
        p_session_id: sessionId,
      });

    if (projectError) {
      console.error('[api/onboarding/recover] Failed to create project:', projectError);
      return NextResponse.json(
        {
          error: 'Failed to create project',
          details: projectError.message,
        },
        { status: 500 }
      );
    }

    console.log('[api/onboarding/recover] Project created:', projectId);

    // Kick off CrewAI workflow
    let workflowId: string;
    try {
      workflowId = await kickoffCrewAIAnalysis(
        briefData,
        projectId,
        user.id
      );

      console.log('[api/onboarding/recover] CrewAI workflow started:', workflowId);
    } catch (crewError: any) {
      console.error('[api/onboarding/recover] CrewAI kickoff failed:', crewError);
      return NextResponse.json(
        {
          error: 'Failed to start analysis',
          details: crewError.message,
          projectId, // Return projectId so user can at least see the project
        },
        { status: 500 }
      );
    }

    // Update project with workflow ID
    await adminClient
      .from('projects')
      .update({
        initial_analysis_workflow_id: workflowId,
        status: 'analyzing',
      })
      .eq('id', projectId);

    // Update session to completed
    await adminClient
      .from('onboarding_sessions')
      .update({
        status: 'completed',
        overall_progress: 100,
        stage_data: {
          ...stageData,
          completion: {
            projectId,
            workflowId,
            recoveredAt: new Date().toISOString(),
          },
        },
      })
      .eq('session_id', sessionId);

    console.log('[api/onboarding/recover] Session recovered successfully');

    return NextResponse.json({
      success: true,
      projectId,
      workflowId,
      message: 'Onboarding recovered successfully. Analysis is now running.',
    });

  } catch (error: any) {
    console.error('[api/onboarding/recover] Error:', error);
    return NextResponse.json(
      {
        error: 'Recovery failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
