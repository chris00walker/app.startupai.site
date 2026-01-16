/**
 * Atomic Chat Save Endpoint
 *
 * Part of ADR-005 Split API Architecture:
 * - /api/chat/stream - Streaming only, NO persistence
 * - /api/chat/save   - Atomic persistence via Supabase RPC (this file)
 *
 * This endpoint handles:
 * - Pass 2 (quality assessment)
 * - Atomic state commit via apply_onboarding_turn RPC
 * - CrewAI/Modal kickoff on completion
 *
 * @see Plan: /home/chris/.claude/plans/shiny-growing-sprout.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createModalClient } from '@/lib/crewai/modal-client';
import { buildFounderValidationInputs } from '@/lib/crewai/founder-validation';
import {
  assessConversationQuality,
  shouldAdvanceStage,
  isOnboardingComplete,
  calculateOverallProgress,
  type ConversationMessage,
} from '@/lib/onboarding/quality-assessment';

// ============================================================================
// Types
// ============================================================================

interface SaveRequest {
  sessionId: string;
  messageId: string;
  userMessage: {
    role: 'user';
    content: string;
    timestamp: string;
  };
  assistantMessage: {
    role: 'assistant';
    content: string;
    timestamp: string;
  };
}

interface SaveResponse {
  success: boolean;
  status: 'committed' | 'duplicate' | 'error';
  version?: number;
  currentStage?: number;
  overallProgress?: number;
  stageProgress?: number;
  stageAdvanced?: boolean;
  completed?: boolean;
  workflowId?: string;
  projectId?: string;
  error?: string;
}

// ============================================================================
// Save API Handler
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse<SaveResponse>> {
  try {
    console.log('[api/chat/save] Request received');

    // Parse request
    const body: SaveRequest = await req.json();
    const { sessionId, messageId, userMessage, assistantMessage } = body;

    // Validate required fields
    if (!sessionId || !messageId || !userMessage || !assistantMessage) {
      return NextResponse.json(
        { success: false, status: 'error', error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 1. Authenticate user
    // ========================================================================
    const sessionClient = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      console.error('[api/chat/save] Authentication failed:', { userError, hasUser: !!user });
      return NextResponse.json(
        { success: false, status: 'error', error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[api/chat/save] User authenticated:', { userId: user.id, email: user.email });

    // ========================================================================
    // 2. Get session for context
    // ========================================================================
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[api/chat/save] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = sessionClient;
    }

    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('[api/chat/save] Session not found:', sessionError);
      return NextResponse.json(
        { success: false, status: 'error', error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify session ownership
    if (sessionData.user_id !== user.id) {
      return NextResponse.json(
        { success: false, status: 'error', error: 'Session ownership mismatch' },
        { status: 403 }
      );
    }

    const session = sessionData;
    const currentStage = session.current_stage || 1;
    const stageData = (session.stage_data as Record<string, unknown>) || {};
    const briefData = (stageData.brief as Record<string, unknown>) || {};

    // ========================================================================
    // 3. Build conversation history for assessment
    // ========================================================================
    const existingHistory = (session.conversation_history || []) as ConversationMessage[];
    const updatedHistory: ConversationMessage[] = [
      ...existingHistory,
      {
        role: 'user' as const,
        content: userMessage.content,
        stage: currentStage,
        timestamp: userMessage.timestamp,
      },
      {
        role: 'assistant' as const,
        content: assistantMessage.content,
        stage: currentStage,
        timestamp: assistantMessage.timestamp,
      },
    ];

    // ========================================================================
    // 4. Pass 2: Quality assessment
    // ========================================================================
    console.log('[api/chat/save] Running Pass 2 assessment for stage', currentStage);

    const assessment = await assessConversationQuality(currentStage, updatedHistory, briefData);

    // Build assessment data for RPC (even if assessment failed)
    let assessmentData: Record<string, unknown> | null = null;

    if (assessment) {
      const shouldAdvance = shouldAdvanceStage(assessment, currentStage);
      const isComplete = isOnboardingComplete(assessment, currentStage);

      // Calculate progress
      const coverageForProgress = shouldAdvance ? 0 : assessment.coverage;
      const overallProgress = calculateOverallProgress(
        shouldAdvance ? currentStage + 1 : currentStage,
        coverageForProgress,
        isComplete,
        updatedHistory.length
      );
      const stageProgress = shouldAdvance ? 0 : Math.round(assessment.coverage * 100);

      assessmentData = {
        coverage: assessment.coverage,
        clarity: assessment.clarity,
        completeness: assessment.completeness,
        extractedData: assessment.extractedData || {},
        shouldAdvance,
        isComplete,
        overallProgress,
        stageProgress,
        keyInsights: assessment.keyInsights,
        recommendedNextSteps: assessment.recommendedNextSteps,
      };

      console.log('[api/chat/save] Assessment result:', {
        stage: currentStage,
        coverage: assessment.coverage,
        shouldAdvance,
        isComplete,
      });
    } else {
      console.warn('[api/chat/save] Assessment failed, proceeding with null assessment');
    }

    // ========================================================================
    // 5. Call apply_onboarding_turn RPC
    // ========================================================================
    console.log('[api/chat/save] Calling apply_onboarding_turn RPC');

    const { data: rpcResult, error: rpcError } = await supabaseClient.rpc('apply_onboarding_turn', {
      p_session_id: sessionId,
      p_message_id: messageId,
      p_user_message: {
        role: 'user',
        content: userMessage.content,
        timestamp: userMessage.timestamp,
      },
      p_assistant_message: {
        role: 'assistant',
        content: assistantMessage.content,
        timestamp: assistantMessage.timestamp,
      },
      p_assessment: assessmentData,
    });

    if (rpcError) {
      console.error('[api/chat/save] RPC error:', rpcError);
      return NextResponse.json(
        { success: false, status: 'error', error: rpcError.message },
        { status: 500 }
      );
    }

    const result = rpcResult as {
      status: string;
      version: number;
      current_stage: number;
      overall_progress: number;
      stage_progress: number;
      stage_advanced: boolean;
      completed: boolean;
    };

    console.log('[api/chat/save] RPC result:', result);

    // Handle duplicate (idempotency)
    if (result.status === 'duplicate') {
      return NextResponse.json({
        success: true,
        status: 'duplicate',
        version: result.version,
        currentStage: result.current_stage,
        overallProgress: result.overall_progress,
        stageProgress: result.stage_progress,
        stageAdvanced: false,
        completed: result.completed,
      });
    }

    // ========================================================================
    // 6. If completed, trigger CrewAI/Modal kickoff
    // ========================================================================
    let workflowId: string | undefined;
    let projectId: string | undefined;

    if (result.completed) {
      console.log('[api/chat/save] Onboarding completed, triggering CrewAI kickoff');

      try {
        // Refresh session to get latest stage_data with completion info
        const { data: completedSession } = await supabaseClient
          .from('onboarding_sessions')
          .select('stage_data, conversation_history')
          .eq('session_id', sessionId)
          .single();

        const finalStageData = (completedSession?.stage_data as Record<string, unknown>) || {};
        const finalBrief = (finalStageData.brief as Record<string, unknown>) || {};
        const finalHistory = completedSession?.conversation_history || [];

        // Build CrewAI brief data
        const crewBriefData = {
          customer_segments: finalBrief.target_customers || [],
          primary_customer_segment: finalBrief.primary_segment || finalBrief.target_customers,
          problem_description: finalBrief.problem_description || finalBrief.problem,
          problem_pain_level: finalBrief.pain_level || 5,
          solution_description: finalBrief.solution_description || finalBrief.solution,
          unique_value_proposition: finalBrief.unique_value_prop || finalBrief.differentiation,
          differentiation_factors: finalBrief.differentiation || finalBrief.differentiators || [],
          competitors: finalBrief.competitors || [],
          budget_range: finalBrief.budget_range || finalBrief.budget || 'not specified',
          available_channels: finalBrief.available_channels || finalBrief.channels || [],
          business_stage: finalBrief.current_stage || finalBrief.business_stage || 'idea',
          three_month_goals: finalBrief.short_term_goals || finalBrief.goals || [],
        };

        // Save to entrepreneur_briefs table
        await supabaseClient.rpc('upsert_entrepreneur_brief', {
          p_session_id: sessionId,
          p_user_id: user.id,
          p_brief_data: crewBriefData,
        });

        // Create project from onboarding session
        const { data: newProjectId, error: projectError } = await supabaseClient.rpc(
          'create_project_from_onboarding',
          { p_session_id: sessionId }
        );

        if (projectError) {
          throw projectError;
        }

        projectId = newProjectId as string;
        console.log('[api/chat/save] Project created:', projectId);

        // Kick off validation workflow (Modal)
        const modalClient = createModalClient();
        const conversationTranscript = JSON.stringify(finalHistory);

        const validationInputs = buildFounderValidationInputs(
          crewBriefData,
          projectId,
          user.id,
          sessionId,
          conversationTranscript,
          'founder'
        );

        const modalResponse = await modalClient.kickoff({
          entrepreneur_input: validationInputs.entrepreneur_input,
          project_id: validationInputs.project_id,
          user_id: validationInputs.user_id,
          session_id: validationInputs.session_id,
        });

        workflowId = modalResponse.run_id;
        console.log('[api/chat/save] Modal workflow started:', workflowId);

        // Store workflow ID in project
        await supabaseClient
          .from('projects')
          .update({
            initial_analysis_workflow_id: workflowId,
            status: 'analyzing',
          })
          .eq('id', projectId);

        // Update session with workflow info
        await supabaseClient
          .from('onboarding_sessions')
          .update({
            stage_data: {
              ...finalStageData,
              completion: {
                ...(finalStageData.completion as Record<string, unknown> || {}),
                projectId,
                workflowId,
              },
            },
          })
          .eq('session_id', sessionId);

        console.log('[api/chat/save] CrewAI integration complete:', { projectId, workflowId });
      } catch (crewError) {
        console.error('[api/chat/save] Error in CrewAI integration:', crewError);
        // Store error but don't fail the save - user still gets completion
        const errorMessage = crewError instanceof Error ? crewError.message : 'Unknown error';

        await supabaseClient
          .from('onboarding_sessions')
          .update({
            stage_data: {
              ...stageData,
              completion: {
                ...(stageData.completion as Record<string, unknown> || {}),
                crewError: errorMessage,
              },
            },
          })
          .eq('session_id', sessionId);
      }
    }

    // ========================================================================
    // 7. Return success response
    // ========================================================================
    return NextResponse.json({
      success: true,
      status: 'committed',
      version: result.version,
      currentStage: result.current_stage,
      overallProgress: result.overall_progress,
      stageProgress: result.stage_progress,
      stageAdvanced: result.stage_advanced,
      completed: result.completed,
      workflowId,
      projectId,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/chat/save] Top-level error:', error);
    return NextResponse.json(
      { success: false, status: 'error', error: errorMessage },
      { status: 500 }
    );
  }
}
