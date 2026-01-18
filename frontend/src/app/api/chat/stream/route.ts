/**
 * Stateless Chat Streaming Endpoint
 *
 * Part of ADR-005 Split API Architecture:
 * - /api/chat/stream - Streaming only, NO persistence (this file)
 * - /api/chat/save   - Atomic persistence via Supabase RPC
 *
 * This endpoint handles Pass 1 (conversational streaming) only.
 * Persistence happens in /api/chat/save after stream completes.
 *
 * @see Plan: /home/chris/.claude/plans/shiny-growing-sprout.md
 */

import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import {
  FOUNDER_SYSTEM_PROMPT,
  getFounderStageSystemContext,
  getSystemPrompt,
  type OnboardingMode,
} from '@/lib/ai/founder-onboarding-prompt';

// ============================================================================
// AI Model Configuration - OpenRouter (Multi-Provider Gateway)
// ============================================================================

function getAIModel() {
  // Use OpenRouter with Groq as the preferred provider for speed
  // Groq offers ~300 tokens/sec vs ~50-100 for other providers
  const provider = process.env.OPENROUTER_PROVIDER || 'Groq';

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    extraBody: {
      provider: {
        order: [provider],
        allow_fallbacks: true, // Fall back to other providers if Groq is unavailable
      },
    },
  });

  // Default to Llama 3.3 70B for conversational quality
  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';
  console.log('[api/chat/stream] Using OpenRouter model:', model, 'via provider:', provider);
  return openrouter(model);
}

// ============================================================================
// Stream-Only Chat API Handler
// ============================================================================

/**
 * Stateless streaming endpoint.
 *
 * Flow:
 * 1. Auth + session validation (read-only)
 * 2. Build context from session state
 * 3. Stream AI response
 * 4. Return immediately after stream - NO persistence
 *
 * Persistence happens when client calls /api/chat/save after stream completes.
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[api/chat/stream] Request received');

    // Parse request
    const { messages, sessionId } = await req.json();

    // ========================================================================
    // 1. Authenticate user
    // ========================================================================
    const sessionClient = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      console.error('[api/chat/stream] Authentication failed:', { userError, hasUser: !!user });
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('[api/chat/stream] User authenticated:', { userId: user.id, email: user.email });

    if (!sessionId) {
      return new Response('Session ID required', { status: 400 });
    }

    // ========================================================================
    // 2. Get session for context (read-only)
    // ========================================================================
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[api/chat/stream] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = sessionClient;
    }

    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('onboarding_sessions')
      .select('current_stage, stage_data, user_id, status, ai_context')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('[api/chat/stream] Session not found:', sessionError);
      return new Response('Session not found', { status: 404 });
    }

    // Verify session ownership
    if (sessionData.user_id !== user.id) {
      return new Response('Session ownership mismatch', { status: 403 });
    }

    // Check session is active
    if (sessionData.status === 'completed') {
      return new Response('Session already completed', { status: 400 });
    }

    // ========================================================================
    // 3. Build AI context
    // ========================================================================
    const currentStage = sessionData.current_stage || 1;
    const stageData = (sessionData.stage_data as Record<string, unknown>) || {};
    const briefData = (stageData.brief as Record<string, unknown>) || {};
    const aiContext = (sessionData.ai_context as Record<string, unknown>) || {};

    // Determine mode from session context (defaults to 'founder')
    const mode: OnboardingMode = (aiContext.mode as OnboardingMode) || 'founder';
    const systemPrompt = getSystemPrompt(mode);
    const stageContext = getFounderStageSystemContext(currentStage, briefData);

    console.log('[api/chat/stream] Creating stream:', {
      sessionId,
      currentStage,
      mode,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 50),
    });

    // ========================================================================
    // 4. Stream AI response (NO persistence, NO onFinish)
    // ========================================================================
    let model;
    try {
      model = getAIModel();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[api/chat/stream] Failed to get AI model:', error);
      return new Response(
        JSON.stringify({ error: 'AI model configuration error', details: errorMessage }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = streamText({
      model,
      system: `${systemPrompt}\n\n${stageContext}`,
      messages,
      temperature: 0.7,
      // NO onFinish callback - persistence handled by /api/chat/save
    });

    console.log('[api/chat/stream] Returning stream response (stateless - no persistence)');

    // Return streaming response
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[api/chat/stream] Stream error:', {
          name: err.name,
          message: err.message,
        });
        return `Error: ${err.message}`;
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/chat/stream] Top-level error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
