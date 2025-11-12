import { streamText, tool, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import {
  ONBOARDING_SYSTEM_PROMPT,
  ONBOARDING_STAGES,
  getStageSystemContext,
} from '@/lib/ai/onboarding-prompt';

// ============================================================================
// Test Session State Management (for development mode)
// ============================================================================

// In-memory session state for test users (development mode only)
// Exported so the status endpoint can access the same state
export const testSessionState = new Map<string, any>();

// ============================================================================
// AI Model Configuration
// ============================================================================

function getAIModel() {
  // Prefer Anthropic Claude for conversational quality
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic('claude-3-5-sonnet-20241022');
  }

  // Use OpenAI directly, bypassing Netlify AI Gateway
  if (process.env.OPENAI_API_KEY) {
    // Create OpenAI provider with explicit baseURL to bypass Netlify AI Gateway
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    });

    const model = process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini';
    console.log('[api/chat] Using OpenAI model directly:', model);
    return openai(model);
  }

  throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY');
}

// ============================================================================
// AI Tools for Stage Progression
// ============================================================================

// These tools allow the AI to manage the 7-stage onboarding flow
// The AI uses these to assess response quality and advance through stages

const assessQualityTool = tool({
  description: 'Assess the quality and completeness of a user response for the current stage. Use this frequently after receiving substantial information from the user.',
  inputSchema: z.object({
    coverage: z.number().min(0).max(1).describe('How much of the required information has been collected (0.0 to 1.0)'),
    clarity: z.enum(['high', 'medium', 'low']).describe('How clear and specific are the responses'),
    completeness: z.enum(['complete', 'partial', 'insufficient']).describe('Is there enough information to move forward'),
    notes: z.string().describe('Brief observations about response quality and any gaps'),
  }),
  execute: async ({ coverage, clarity, completeness, notes }) => {
    return {
      assessment: { coverage, clarity, completeness, notes },
      message: 'Quality assessment recorded',
    };
  },
});

const advanceStageTool = tool({
  description: 'Advance from the current stage to the next stage. Only use this when you have collected sufficient information (coverage above threshold) and the user has shown good clarity. Do not use this prematurely.',
  inputSchema: z.object({
    fromStage: z.number().min(1).max(7).describe('The current stage number'),
    toStage: z.number().min(1).max(7).describe('The next stage number (usually fromStage + 1)'),
    summary: z.string().describe('Brief summary of what was learned in this stage'),
    collectedData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).describe('Key data points collected in this stage as key-value pairs'),
  }),
  execute: async ({ fromStage, toStage, summary, collectedData }) => {
    return {
      transition: { fromStage, toStage, summary, collectedData },
      message: `Advancing from Stage ${fromStage} to Stage ${toStage}`,
    };
  },
});

const completeOnboardingTool = tool({
  description: 'Signal that all 7 stages are complete and the onboarding conversation is ready for strategic analysis. Only use this after Stage 7 is thoroughly completed with high-quality responses.',
  inputSchema: z.object({
    readinessScore: z.number().min(0).max(1).describe('Overall readiness for strategic analysis (0.0 to 1.0)'),
    keyInsights: z.array(z.string()).describe('3-5 key insights from the entire conversation'),
    recommendedNextSteps: z.array(z.string()).describe('3-5 recommended experiments or actions'),
  }),
  execute: async ({ readinessScore, keyInsights, recommendedNextSteps }) => {
    return {
      completion: { readinessScore, keyInsights, recommendedNextSteps },
      message: 'Onboarding complete - ready for strategic analysis',
    };
  },
});

const onboardingTools = {
  assessQuality: assessQualityTool,
  advanceStage: advanceStageTool,
  completeOnboarding: completeOnboardingTool,
};

// ============================================================================
// Main Chat API Handler
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    console.log('[api/chat] Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });

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
      console.error('[api/chat] Authentication failed:', { userError, hasUser: !!user, isDevelopment, isTestUser });
      return new Response('Unauthorized', { status: 401 });
    }

    const effectiveUser = user || (isDevelopment && isTestUser ? { id: 'test-user-id', email: 'test@example.com' } : null);
    if (!effectiveUser) {
      console.error('[api/chat] No effective user');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('[api/chat] User authenticated:', { userId: effectiveUser.id, email: effectiveUser.email, isTestUser });

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
      // Check if we have an existing test session in memory
      if (testSessionState.has(sessionId)) {
        session = testSessionState.get(sessionId);
        console.log('[api/chat] Retrieved test session from memory:', { stage: session.current_stage, progress: session.overall_progress });
      } else {
        // Create initial mock session for test users
        session = {
          session_id: sessionId,
          user_id: 'test-user-id',
          current_stage: 1,
          stage_data: { brief: {} },
          conversation_history: [],
          overall_progress: 0,
        };
        testSessionState.set(sessionId, session);
        console.log('[api/chat] Created new test session in memory');
      }
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

    // Log request details for debugging
    console.log('[api/chat] Creating stream:', {
      sessionId,
      currentStage,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 50),
    });

    // Get AI model with error handling
    let model;
    try {
      model = getAIModel();
      console.log('[api/chat] Model loaded successfully');
    } catch (error: any) {
      console.error('[api/chat] Failed to get AI model:', error);
      return new Response(
        JSON.stringify({ error: 'AI model configuration error', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stream AI response
    let result;
    try {
      console.log('[api/chat] Calling streamText with:', {
        modelType: typeof model,
        systemPromptLength: `${ONBOARDING_SYSTEM_PROMPT}\n\n${stageContext}`.length,
        messagesCount: messages.length,
        temperature: 0.7,
      });

      result = streamText({
        model,
        system: `${ONBOARDING_SYSTEM_PROMPT}\n\n${stageContext}`,
        messages,
        temperature: 0.7,
        tools: onboardingTools,
        stopWhen: stepCountIs(10), // Allow multiple tool calls per response
        onFinish: async ({ text, finishReason, toolCalls, toolResults }) => {
          console.log('[api/chat] Stream finished:', {
            textLength: text.length,
            finishReason,
            toolCallsCount: toolCalls?.length || 0,
            toolResultsCount: toolResults?.length || 0,
          });

          try {

          // Process tool results
          let newStage = currentStage;
          let newStageData = { ...stageData };
          let isCompleted = false;

          if (toolResults && toolResults.length > 0) {
            for (const result of toolResults) {
              const toolCall = toolCalls?.find(tc => tc.toolCallId === result.toolCallId);
              if (!toolCall) continue;

              console.log('[api/chat] Processing tool result:', {
                toolName: toolCall.toolName,
                input: toolCall.input,
              });

              // Handle advanceStage tool
              if (toolCall.toolName === 'advanceStage') {
                const { fromStage, toStage, summary, collectedData } = toolCall.input as any;
                newStage = toStage;

                // Store stage summary and collected data
                newStageData[`stage_${fromStage}_summary`] = summary;
                newStageData[`stage_${fromStage}_data`] = collectedData;

                // Merge collected data into brief
                newStageData.brief = {
                  ...(newStageData.brief || {}),
                  ...collectedData,
                };

                console.log('[api/chat] Stage advanced:', {
                  from: fromStage,
                  to: toStage,
                });
              }

              // Handle assessQuality tool
              if (toolCall.toolName === 'assessQuality') {
                const { coverage, clarity, completeness, notes } = toolCall.input as any;

                // Store quality assessment for current stage
                newStageData[`stage_${currentStage}_quality`] = {
                  coverage,
                  clarity,
                  completeness,
                  notes,
                  timestamp: new Date().toISOString(),
                };

                console.log('[api/chat] Quality assessed:', {
                  stage: currentStage,
                  coverage,
                  clarity,
                  completeness,
                });
              }

              // Handle completeOnboarding tool
              if (toolCall.toolName === 'completeOnboarding') {
                const { readinessScore, keyInsights, recommendedNextSteps } = toolCall.input as any;

                isCompleted = true;
                newStageData.completion = {
                  readinessScore,
                  keyInsights,
                  recommendedNextSteps,
                  completedAt: new Date().toISOString(),
                };

                console.log('[api/chat] Onboarding completed:', {
                  readinessScore,
                  insightsCount: keyInsights.length,
                });
              }
            }
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
              stage: newStage, // Use new stage if advanced
              toolCalls: toolCalls || [],
            },
          ];

          // Initialize update object
          const updateData: any = {
            conversation_history: updatedHistory,
            last_activity: new Date().toISOString(),
            current_stage: newStage,
            stage_data: newStageData,
          };

          // Calculate progress based on stage completion
          if (isCompleted) {
            updateData.overall_progress = 100;
            updateData.status = 'completed';
          } else {
            // Progress based on stage: Stage 1 = 0-14%, Stage 2 = 14-28%, ..., Stage 7 = 85-100%
            const baseProgress = Math.floor(((newStage - 1) / 7) * 100);

            // Check if we have quality assessment for current stage
            const stageQuality = newStageData[`stage_${newStage}_quality`];
            const stageProgress = stageQuality?.coverage || 0;

            // Calculate overall progress: base progress + (stage progress * stage weight)
            const stageWeight = Math.floor(100 / 7); // ~14% per stage
            updateData.overall_progress = Math.min(
              95,
              baseProgress + Math.floor(stageProgress * stageWeight)
            );
          }

          // Update session (database for real users, memory for test users)
          if (isDevelopment && isTestUser) {
            // Update in-memory test session
            const updatedSession = {
              ...session,
              ...updateData,
            };
            testSessionState.set(sessionId, updatedSession);
            console.log(
              `[api/chat] Test session ${sessionId} updated in memory: ${updateData.overall_progress}% progress`
            );
          } else {
            // Update in database
            await supabaseClient
              .from('onboarding_sessions')
              .update(updateData)
              .eq('session_id', sessionId);

            console.log(
              `[api/chat] Session ${sessionId} updated in database: ${updateData.overall_progress}% progress`
            );
          }
        } catch (error) {
          console.error('[api/chat] Error in onFinish callback:', error);
          // Don't throw - we still want to return the stream to the user
        }
      },
    });

      console.log('[api/chat] streamText() completed successfully, preparing response');
    } catch (streamError: any) {
      console.error('[api/chat] Error creating stream:', {
        name: streamError?.name,
        message: streamError?.message,
        stack: streamError?.stack,
        cause: streamError?.cause,
        status: streamError?.status,
        statusText: streamError?.statusText,
        response: streamError?.response,
        fullError: streamError,
      });
      return new Response(
        JSON.stringify({
          error: 'Failed to create AI stream',
          details: streamError.message,
          stack: streamError.stack,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[api/chat] Returning stream response to client');
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[api/chat] Stream error in toUIMessageStreamResponse:', {
          name: err.name,
          message: err.message,
          cause: err.cause,
          stack: err.stack,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
        });
        return `Error: ${err.message}`;
      },
    });
  } catch (error: any) {
    console.error('[api/chat] Top-level error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause,
      status: error?.status,
      statusText: error?.statusText,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      fullError: error,
    });
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
