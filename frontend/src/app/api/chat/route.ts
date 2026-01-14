import { streamText, tool, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createModalClient } from '@/lib/crewai/modal-client';
import { buildFounderValidationInputs } from '@/lib/crewai/founder-validation';
import {
  ONBOARDING_SYSTEM_PROMPT,
  ONBOARDING_STAGES,
  getStageSystemContext,
} from '@/lib/ai/onboarding-prompt';

// ============================================================================
// AI Model Configuration
// ============================================================================

function getAIModel() {
  // Use OpenAI with explicit baseURL to bypass Netlify AI Gateway
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
  });

  const model = process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o';
  console.log('[api/chat] Using OpenAI model:', model);
  return openai(model);
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

    if (userError || !user) {
      console.error('[api/chat] Authentication failed:', { userError, hasUser: !!user });
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('[api/chat] User authenticated:', { userId: user.id, email: user.email });

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

    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return new Response('Session not found', { status: 404 });
    }

    const session = sessionData;

    // Verify session ownership
    if (session.user_id !== user.id) {
      return new Response('Session ownership mismatch', { status: 403 });
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
        toolChoice: 'auto',
        // If step 1 was tool-only, force step 2 to emit text (no tools allowed)
        prepareStep: ({ steps }) => {
          if (steps.length > 0) {
            return { toolChoice: 'none' }; // Force user-visible text after tool calls
          }
        },
        stopWhen: stepCountIs(2), // Allow up to 2 steps so tool-then-text works
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

                console.log('[api/chat] Onboarding completed, triggering CrewAI workflow');

                // ========================================
                // CrewAI Integration - Kickoff Analysis
                // ========================================

                try {
                  // Step 1: Extract structured brief from stage_data
                  const briefData = {
                    customer_segments: newStageData.brief?.target_customers || [],
                    primary_customer_segment: newStageData.brief?.primary_segment || newStageData.brief?.target_customers,
                    problem_description: newStageData.brief?.problem_description || newStageData.brief?.problem,
                    problem_pain_level: newStageData.brief?.pain_level || 5,
                    solution_description: newStageData.brief?.solution_description || newStageData.brief?.solution,
                    unique_value_proposition: newStageData.brief?.unique_value_prop || newStageData.brief?.differentiation,
                    differentiation_factors: newStageData.brief?.differentiation || newStageData.brief?.differentiators || [],
                    competitors: newStageData.brief?.competitors || [],
                    budget_range: newStageData.brief?.budget_range || newStageData.brief?.budget || 'not specified',
                    available_channels: newStageData.brief?.available_channels || newStageData.brief?.channels || [],
                    business_stage: newStageData.brief?.current_stage || newStageData.brief?.business_stage || 'idea',
                    three_month_goals: newStageData.brief?.short_term_goals || newStageData.brief?.goals || [],
                  };

                  console.log('[api/chat] Extracted brief data:', {
                    hasDescription: !!briefData.problem_description,
                    hasSolution: !!briefData.solution_description,
                    hasCustomers: !!briefData.primary_customer_segment,
                  });

                  // Step 2: Save to entrepreneur_briefs table
                  const { data: brief, error: briefError } = await supabaseClient
                    .rpc('upsert_entrepreneur_brief', {
                      p_session_id: sessionId,
                      p_user_id: user.id,
                      p_brief_data: briefData,
                    });

                  if (briefError) {
                    console.error('[api/chat] Failed to save entrepreneur brief:', briefError);
                  } else {
                    console.log('[api/chat] Entrepreneur brief saved');
                  }

                  // Step 3: Create project from onboarding session
                  const { data: projectId, error: projectError } = await supabaseClient
                    .rpc('create_project_from_onboarding', {
                      p_session_id: sessionId,
                    });

                  if (projectError) {
                    console.error('[api/chat] Failed to create project:', projectError);
                    throw projectError;
                  }

                  console.log('[api/chat] Project created:', projectId);

                  // Step 4: Kick off validation workflow (Modal)
                  const modalClient = createModalClient();
                  const validationInputs = buildFounderValidationInputs(
                    briefData,
                    projectId,
                    user.id,
                    sessionId
                  );

                  const response = await modalClient.kickoff({
                    entrepreneur_input: validationInputs.entrepreneur_input,
                    project_id: validationInputs.project_id,
                    user_id: validationInputs.user_id,
                    session_id: validationInputs.session_id,
                  });

                  const workflowId = response.run_id;
                  console.log('[api/chat] Modal workflow started:', workflowId);

                  // Step 5: Store workflow ID in project
                  await supabaseClient
                    .from('projects')
                    .update({
                      initial_analysis_workflow_id: workflowId,
                      status: 'analyzing',
                    })
                    .eq('id', projectId);

                  // Step 6: Store projectId and workflowId in completion data for frontend
                  newStageData.completion.projectId = projectId;
                  newStageData.completion.workflowId = workflowId;

                  console.log('[api/chat] CrewAI integration complete:', {
                    projectId,
                    workflowId,
                  });

                } catch (error) {
                  console.error('[api/chat] Error in CrewAI integration:', error);
                  // Don't fail the whole response - user still gets completion message
                  // Store error info for debugging
                  newStageData.completion.error = error instanceof Error ? error.message : 'Unknown error';
                }
              }
            }
          }

          // Validate AI response is not empty before saving to conversation history
          if (!text || text.trim().length === 0) {
            console.warn('[api/chat] Skipping empty AI response - stream may have failed');
            // Still update session activity but don't add empty message
            await supabaseClient
              .from('onboarding_sessions')
              .update({ last_activity: new Date().toISOString() })
              .eq('session_id', sessionId);
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
            const qualityBasedProgress = baseProgress + Math.floor(stageProgress * stageWeight);

            // Ensure minimum progress based on conversation activity
            // Each message exchange (user + assistant) = ~1% progress, capped at stage max
            const messageCount = updatedHistory.length;
            const messageBasedProgress = Math.min(
              baseProgress + stageWeight - 1, // Cap at current stage max minus 1%
              Math.floor(messageCount * 0.5) // 0.5% per message
            );

            // Use the higher of quality-based or message-based progress
            updateData.overall_progress = Math.min(
              95,
              Math.max(qualityBasedProgress, messageBasedProgress)
            );
          }

          await supabaseClient
            .from('onboarding_sessions')
            .update(updateData)
            .eq('session_id', sessionId);

          console.log(
            `[api/chat] Session ${sessionId} updated in database: ${updateData.overall_progress}% progress`
          );
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
    // Use toUIMessageStreamResponse - this is the format that was working
    // It outputs SSE with data: prefix and JSON objects like {"type": "text-delta", "delta": "..."}
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[api/chat] Stream error in toUIMessageStreamResponse:', {
          name: err.name,
          message: err.message,
          cause: err.cause,
          stack: err.stack,
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
