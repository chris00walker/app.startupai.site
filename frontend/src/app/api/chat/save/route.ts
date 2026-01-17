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
  expectedVersion?: number;  // ADR-005: Optional version for conflict detection
}

interface SaveResponse {
  success: boolean;
  status: 'committed' | 'duplicate' | 'version_conflict' | 'error';
  version?: number;
  currentVersion?: number;     // ADR-005: Current version (for conflict resolution)
  expectedVersion?: number;    // ADR-005: What version client expected
  currentStage?: number;
  overallProgress?: number;
  stageProgress?: number;
  stageAdvanced?: boolean;
  completed?: boolean;
  queued?: boolean;  // ADR-005: Stage 7 completion queued for background processing
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
    const { sessionId, messageId, userMessage, assistantMessage, expectedVersion } = body;

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
    console.log('[api/chat/save] Calling apply_onboarding_turn RPC', {
      expectedVersion,
    });

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
      p_expected_version: expectedVersion ?? null,  // ADR-005: Pass version for conflict detection
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
      current_version?: number;
      expected_version?: number;
      current_stage: number;
      overall_progress: number;
      stage_progress: number;
      stage_advanced: boolean;
      completed: boolean;
      message?: string;
    };

    console.log('[api/chat/save] RPC result:', result);

    // Handle version conflict (ADR-005)
    if (result.status === 'version_conflict') {
      console.warn('[api/chat/save] Version conflict detected:', {
        currentVersion: result.current_version,
        expectedVersion: result.expected_version,
      });
      return NextResponse.json({
        success: false,
        status: 'version_conflict',
        currentVersion: result.current_version,
        expectedVersion: result.expected_version,
        error: result.message || 'Session has been modified. Please refresh and retry.',
      });
    }

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
    // 6. If completed, queue for background processing (ADR-005)
    // ========================================================================
    // IMPORTANT: We no longer call Modal directly here.
    // Instead, we atomically mark completion AND insert a queue row.
    // A background worker will handle the CrewAI kickoff with retries.

    let queued = false;

    if (result.completed) {
      console.log('[api/chat/save] Onboarding completed, queuing for CrewAI kickoff');

      try {
        // Call atomic RPC: marks session complete AND inserts queue row
        const { data: queueResult, error: queueError } = await supabaseClient.rpc(
          'complete_onboarding_with_kickoff',
          {
            p_session_id: sessionId,
            p_user_id: user.id,
          }
        );

        if (queueError) {
          console.error('[api/chat/save] Queue RPC error:', queueError);
          // Don't fail the save - session is already marked complete by apply_onboarding_turn
          // The recovery mechanism in complete_onboarding_with_kickoff will handle re-queuing
        } else {
          const queueStatus = (queueResult as { status: string })?.status;
          console.log('[api/chat/save] Queue result:', queueStatus);

          if (queueStatus === 'queued' || queueStatus === 'requeued' || queueStatus === 'already_completed') {
            queued = true;
          }
        }
      } catch (queueError) {
        console.error('[api/chat/save] Error queuing completion:', queueError);
        // Non-fatal: worker can recover from completed sessions missing queue rows
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
      queued,
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
