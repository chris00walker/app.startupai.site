import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import {
  ONBOARDING_SYSTEM_PROMPT,
  ONBOARDING_STAGES,
  getStageSystemContext,
} from '@/lib/ai/onboarding-prompt';

// ============================================================================
// AI Model Configuration
// ============================================================================

function getAIModel() {
  // Prefer Anthropic Claude for conversational quality
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic('claude-3-5-sonnet-20241022');
  }

  // Use OpenAI GPT-4.1-nano (fastest, most cost-effective with 1M token context)
  if (process.env.OPENAI_API_KEY) {
    const model = process.env.OPENAI_MODEL_DEFAULT || 'gpt-4.1-nano';
    return openai(model);
  }

  throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY');
}

// ============================================================================
// AI Tools - Temporarily Removed
// ============================================================================

// Note: Tools will be added back once we resolve AI SDK 5.x tool API patterns
// For now, we rely on the AI's conversational ability to guide through stages

// ============================================================================
// Main Chat API Handler
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Parse request
    const { messages, sessionId, data } = await req.json();

    // Authenticate user
    const sessionClient = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    // Allow test user in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTestUser = sessionId?.startsWith('test-') || sessionId?.includes('demo');

    if ((userError || !user) && !(isDevelopment && isTestUser)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const effectiveUser = user || (isDevelopment && isTestUser ? { id: 'test-user-id', email: 'test@example.com' } : null);
    if (!effectiveUser) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!sessionId) {
      return new Response('Session ID required', { status: 400 });
    }

    // Get admin client for database operations
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[api/chat] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = sessionClient;
    }

    // Fetch session from database (mock for test users in development)
    let session: any;
    if (isDevelopment && isTestUser) {
      // Mock session for test users
      session = {
        session_id: sessionId,
        user_id: 'test-user-id',
        current_stage: 1,
        stage_data: { brief: {} },
        conversation_history: [],
        overall_progress: 0,
      };
      console.log('[api/chat] Using mock session for test user in development mode');
    } else {
      const { data: sessionData, error: sessionError } = await supabaseClient
        .from('onboarding_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        return new Response('Session not found', { status: 404 });
      }

      session = sessionData;

      // Verify session ownership
      if (session.user_id !== effectiveUser.id) {
        return new Response('Session ownership mismatch', { status: 403 });
      }
    }

    // Prepare AI context
    const currentStage = session.current_stage || 1;
    const stageData = (session.stage_data as Record<string, any>) || {};
    const briefData = stageData.brief || {};

    const stageContext = getStageSystemContext(currentStage, briefData);

    // Stream AI response
    const result = streamText({
      model: getAIModel(),
      system: `${ONBOARDING_SYSTEM_PROMPT}\n\n${stageContext}`,
      messages,
      temperature: 0.7,
      onFinish: async ({ text, finishReason }) => {
        try {
          // Skip database update for test users in development
          if (isDevelopment && isTestUser) {
            console.log('[api/chat] Skipping database update for test user in development mode');
            return;
          }

          // Update conversation history
          const updatedHistory = [
            ...(session.conversation_history || []),
            {
              role: 'user',
              content: messages[messages.length - 1].content,
              timestamp: new Date().toISOString(),
              stage: currentStage,
            },
            {
              role: 'assistant',
              content: text,
              timestamp: new Date().toISOString(),
              stage: currentStage,
            },
          ];

          // Simple progress tracking based on message count
          const messageCount = updatedHistory.length;
          const estimatedProgress = Math.min(95, Math.floor((messageCount / 30) * 100)); // ~30 messages for full conversation

          // Update session in database
          await supabaseClient
            .from('onboarding_sessions')
            .update({
              conversation_history: updatedHistory,
              overall_progress: estimatedProgress,
              last_activity: new Date().toISOString(),
            })
            .eq('session_id', sessionId);

          console.log(
            `[api/chat] Session ${sessionId} updated: ${messageCount} messages, ${estimatedProgress}% progress`
          );
        } catch (error) {
          console.error('[api/chat] Error in onFinish callback:', error);
          // Don't throw - we still want to return the stream to the user
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[api/chat] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
