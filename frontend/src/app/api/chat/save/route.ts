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
  collectedTopics?: string[];  // Bug B6 fix: Keys of extracted data for question counter
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
      // Bug B7 fix: Calculate stage message count for fallback advancement
      const stageMessageCount = updatedHistory.filter(m => m.stage === currentStage).length;
      const shouldAdvance = shouldAdvanceStage(assessment, currentStage, stageMessageCount);
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
        topicsCovered: assessment.topicsCovered || [],
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
        topicsCovered: assessment.topicsCovered || [],
        coverage: assessment.coverage,
        shouldAdvance,
        isComplete,
      });
    } else {
      console.warn('[api/chat/save] Assessment failed, using fallback progress calculation');

      // ADR-005 Bug B1/B4 Fix: Even when assessment fails, provide minimum progress
      // based on message count to prevent "stuck at 0%" issue
      const messageBasedProgress = Math.min(10, Math.floor(updatedHistory.length * 0.5));
      const fallbackStageProgress = Math.min(25, updatedHistory.length * 5);

      assessmentData = {
        coverage: 0.1, // Minimum coverage to show some progress
        clarity: 'medium',
        completeness: 'partial',
        extractedData: {},
        shouldAdvance: false,
        isComplete: false,
        overallProgress: messageBasedProgress,
        stageProgress: fallbackStageProgress,
      };

      console.log('[api/chat/save] Fallback progress:', {
        messageCount: updatedHistory.length,
        overallProgress: messageBasedProgress,
        stageProgress: fallbackStageProgress,
      });
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
    // 6. Completion handling (Split flow for SummaryModal Approve/Revise)
    // ========================================================================
    // CHANGED: We no longer auto-queue on completion.
    // Session is marked completed by apply_onboarding_turn, but queue insertion
    // now happens when user clicks "Approve" in SummaryModal.
    // This enables the Revise flow to work correctly.
    //
    // Queue insertion: /api/onboarding/queue (calls queue_onboarding_for_kickoff RPC)
    // Revise handling: /api/onboarding/revise (calls reset_session_for_revision RPC)
    //
    // @see prancy-tickling-quokka.md, precious-kindling-balloon.md

    if (result.completed) {
      console.log('[api/chat/save] Onboarding completed - awaiting user approval in SummaryModal');
    }

    // Always false - queue insertion happens on explicit user approval
    const queued = false;

    // ========================================================================
    // 7. Return success response
    // ========================================================================

    // Bug B6 fix: Extract collected topic keys for question counter
    const extractedData = (assessmentData?.extractedData as Record<string, unknown>) || {};
    const collectedTopics = Object.keys(extractedData).filter(
      key => extractedData[key] !== undefined && extractedData[key] !== null && extractedData[key] !== ''
    );

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
      collectedTopics, // Bug B6: For question counter updates
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
