/**
 * Internal Quality Assessment Endpoint
 *
 * Part of ADR-005 Split API Architecture:
 * Called by the queue worker to run quality assessment for Stage 7 completions.
 *
 * This endpoint is internal-only and protected by a bearer token.
 * It reuses the existing quality-assessment.ts logic to avoid code duplication.
 *
 * @see Plan: /home/chris/.claude/plans/shiny-growing-sprout.md
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  assessFounderConversation,
  type ConversationMessage,
} from '@/lib/onboarding/founder-quality-assessment';

// ============================================================================
// Types
// ============================================================================

interface AssessRequest {
  conversationHistory: ConversationMessage[];
  stageData: Record<string, unknown>;
  currentStage?: number;
}

interface AssessResponse {
  success: boolean;
  assessment?: {
    coverage: number;
    clarity: string;
    completeness: string;
    extractedData: Record<string, unknown>;
    keyInsights?: string[];
    recommendedNextSteps?: string[];
  };
  error?: string;
}

// ============================================================================
// Internal Assessment Handler
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse<AssessResponse>> {
  try {
    // ========================================================================
    // 1. Verify internal API key
    // ========================================================================
    const authHeader = req.headers.get('Authorization');
    const expectedToken = process.env.INTERNAL_API_KEY;

    if (!expectedToken) {
      console.error('[api/internal/assess] INTERNAL_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Internal API not configured' },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const providedToken = authHeader.slice(7);
    if (providedToken !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid authorization token' },
        { status: 403 }
      );
    }

    // ========================================================================
    // 2. Parse request
    // ========================================================================
    const body: AssessRequest = await req.json();
    const { conversationHistory, stageData, currentStage = 7 } = body;

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { success: false, error: 'conversationHistory is required' },
        { status: 400 }
      );
    }

    console.log('[api/internal/assess] Running assessment:', {
      messageCount: conversationHistory.length,
      currentStage,
    });

    // ========================================================================
    // 3. Run quality assessment (reuse existing logic)
    // ========================================================================
    const briefData = (stageData?.brief as Record<string, unknown>) || {};

    const assessment = await assessFounderConversation(
      currentStage,
      conversationHistory,
      briefData
    );

    if (!assessment) {
      console.warn('[api/internal/assess] Assessment returned null');
      return NextResponse.json({
        success: true,
        assessment: {
          coverage: 0.5,
          clarity: 'low',
          completeness: 'partial',
          extractedData: {},
          keyInsights: [],
          recommendedNextSteps: [],
        },
      });
    }

    console.log('[api/internal/assess] Assessment complete:', {
      coverage: assessment.coverage,
      clarity: assessment.clarity,
    });

    // ========================================================================
    // 4. Return assessment result
    // ========================================================================
    return NextResponse.json({
      success: true,
      assessment: {
        coverage: assessment.coverage,
        clarity: assessment.clarity,
        completeness: assessment.completeness,
        extractedData: assessment.extractedData || {},
        keyInsights: assessment.keyInsights,
        recommendedNextSteps: assessment.recommendedNextSteps,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/internal/assess] Error:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
