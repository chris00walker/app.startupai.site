/**
 * @deprecated DEPRECATED - Use split API endpoints instead (ADR-005)
 *
 * This monolithic endpoint is replaced by:
 * - /api/chat/stream - Stateless streaming (no persistence)
 * - /api/chat/save   - Atomic persistence via Supabase RPC
 *
 * The split API architecture provides:
 * - Guaranteed durability (no async ghost problem)
 * - Atomic commits with row-level locking
 * - Idempotent saves with message-level deduplication
 * - "Saved v{X}" UX confirmation
 *
 * This file is kept temporarily for backwards compatibility during migration.
 * It will be removed in a future release.
 *
 * @see /home/chris/.claude/plans/shiny-growing-sprout.md
 * @see startupai-crew/docs/adr/005-state-first-synchronized-loop.md
 */

import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createModalClient } from '@/lib/crewai/modal-client';
import { buildFounderValidationInputs } from '@/lib/crewai/founder-validation';
import {
  ONBOARDING_SYSTEM_PROMPT,
  getStageSystemContext,
} from '@/lib/ai/onboarding-prompt';
import {
  assessConversationQuality,
  shouldAdvanceStage,
  isOnboardingComplete,
  mergeExtractedData,
  hashMessageForIdempotency,
  calculateOverallProgress,
  type ConversationMessage,
} from '@/lib/onboarding/quality-assessment';

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
  console.log('[api/chat] Using OpenRouter model:', model, 'via provider:', provider);
  return openrouter(model);
}

// ============================================================================
// Main Chat API Handler
// ============================================================================

// Two-Pass Architecture:
// Pass 1: LLM generates conversational response (NO tools, streaming)
// Pass 2: Backend deterministically assesses quality after response (generateObject)
//
// This fixes the 18% tool call rate issue that caused sessions to get stuck.

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

    // Capture request context at START for idempotency (before any async work)
    // This ensures retries produce the same hash even if state changes
    const userMessage = messages[messages.length - 1]?.content || '';
    const requestContext = {
      sessionId,
      messageIndex: messages.length,
      stage: currentStage,
      userMessage,
    };

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

    // ========================================================================
    // PASS 1: Stream AI Response (Conversation Only - NO Tools)
    // ========================================================================
    let result;
    try {
      console.log('[api/chat] Calling streamText with:', {
        modelType: typeof model,
        systemPromptLength: `${ONBOARDING_SYSTEM_PROMPT}\n\n${stageContext}`.length,
        messagesCount: messages.length,
        temperature: 0.7,
      });

      console.log('[api/chat] Starting Pass 1: Conversation streaming (no tools)');

      result = streamText({
        model,
        system: `${ONBOARDING_SYSTEM_PROMPT}\n\n${stageContext}`,
        messages,
        temperature: 0.7,
        // NO tools - Pass 2 handles assessment deterministically
        onFinish: async ({ text, finishReason }) => {
          console.log('[api/chat] ========== PASS 1 COMPLETE ==========');
          console.log('[api/chat] Stream result:', {
            textLength: text.length,
            textPreview: text.substring(0, 100),
            finishReason,
          });

          try {
            // Skip if no text (edge case)
            const hasText = text && text.trim().length > 0;
            if (!hasText) {
              console.warn('[api/chat] Empty AI text response, skipping Pass 2');
              return;
            }

            // ================================================================
            // Build Updated Conversation History
            // ================================================================
            // Build updated history with timestamps for UI rendering (see Erratum 1)
            const now = new Date().toISOString();
            const updatedHistory: ConversationMessage[] = [
              ...((session.conversation_history || []) as ConversationMessage[]),
              {
                role: 'user',
                content: requestContext.userMessage,
                stage: requestContext.stage, // Use captured stage
                timestamp: now,
              },
              {
                role: 'assistant',
                content: text,
                stage: requestContext.stage, // Tagged with current stage BEFORE assessment
                timestamp: now,
              },
            ];

            // ================================================================
            // Check if Already Completed - Persist History Only
            // ================================================================
            const isSessionCompleted = !!stageData.completion;
            if (isSessionCompleted) {
              console.log('[api/chat] Session already completed, persisting history only');
              await supabaseClient
                .from('onboarding_sessions')
                .update({
                  conversation_history: updatedHistory,
                  last_activity: new Date().toISOString(),
                })
                .eq('session_id', sessionId);
              return;
            }

            // ================================================================
            // Idempotency Guard - Skip if Already Processed
            // ================================================================
            const assessmentKey = hashMessageForIdempotency(
              requestContext.sessionId,
              requestContext.messageIndex,
              requestContext.stage,
              requestContext.userMessage
            );

            if (stageData[assessmentKey]) {
              console.log('[api/chat] Assessment already exists for this message, skipping');
              return;
            }

            // ================================================================
            // PASS 2: Deterministic Quality Assessment
            // ================================================================
            console.log('[api/chat] Starting Pass 2: Backend quality assessment');

            const assessment = await assessConversationQuality(
              requestContext.stage,
              updatedHistory,
              briefData
            );

            // Handle assessment failure
            if (!assessment) {
              console.error('[api/chat] Assessment failed, storing failure marker');
              const failureStageData = {
                ...stageData,
                [`assessment_failure_${Date.now()}`]: {
                  timestamp: new Date().toISOString(),
                  stage: requestContext.stage,
                  error: 'Assessment failed after 3 retries',
                },
              };

              await supabaseClient
                .from('onboarding_sessions')
                .update({
                  conversation_history: updatedHistory,
                  stage_data: failureStageData,
                  last_activity: new Date().toISOString(),
                })
                .eq('session_id', sessionId);
              return;
            }

            console.log('[api/chat] Pass 2 Assessment result:', {
              stage: requestContext.stage,
              coverage: assessment.coverage,
              completeness: assessment.completeness,
              shouldAdvance: shouldAdvanceStage(assessment, requestContext.stage),
              extractedFields: Object.keys(assessment.extractedData || {}),
            });

            // ================================================================
            // State Machine: Process Assessment Results
            // ================================================================
            let newStage = requestContext.stage;
            let newStageData = { ...stageData };
            let completedNow = false;

            // Store idempotency key
            newStageData[assessmentKey] = {
              timestamp: new Date().toISOString(),
              coverage: assessment.coverage,
              stage: requestContext.stage,
            };

            // Store quality assessment
            newStageData[`stage_${requestContext.stage}_quality`] = {
              coverage: assessment.coverage,
              clarity: assessment.clarity,
              completeness: assessment.completeness,
              notes: assessment.notes,
              timestamp: new Date().toISOString(),
            };

            // Merge extracted data into brief
            newStageData.brief = mergeExtractedData(
              newStageData.brief || {},
              assessment.extractedData
            );

            // Check for stage advancement
            if (shouldAdvanceStage(assessment, requestContext.stage)) {
              const fromStage = requestContext.stage;
              newStage = requestContext.stage + 1;

              newStageData[`stage_${fromStage}_summary`] =
                `Auto-advanced after ${Math.round(assessment.coverage * 100)}% coverage`;

              console.log('[api/chat] AUTO-ADVANCING:', {
                from: fromStage,
                to: newStage,
                coverage: assessment.coverage,
              });
            }

            // Check for completion (Stage 7 finished)
            if (isOnboardingComplete(assessment, requestContext.stage)) {
              completedNow = true;
              console.log('[api/chat] Onboarding complete, preparing CrewAI trigger');

              // ============================================================
              // Atomic Completion Guard + CrewAI Trigger
              // ============================================================
              const completionData = {
                readinessScore: assessment.coverage,
                keyInsights: assessment.keyInsights || [],
                recommendedNextSteps: assessment.recommendedNextSteps || [],
                completedAt: new Date().toISOString(),
              };

              // Atomic update - only succeeds if completion doesn't exist yet
              const { data: completionResult, error: completionError } = await supabaseClient
                .from('onboarding_sessions')
                .update({
                  conversation_history: updatedHistory,
                  stage_data: { ...newStageData, completion: completionData },
                  current_stage: newStage,
                  overall_progress: 100,
                  status: 'completed',
                  last_activity: new Date().toISOString(),
                })
                .eq('session_id', sessionId)
                .is('stage_data->completion', null) // Only update if not already completed
                .select();

              if (completionError || !completionResult || completionResult.length === 0) {
                console.log('[api/chat] Completion already recorded by another request, skipping CrewAI');
                return;
              }

              // ============================================================
              // CrewAI Integration - Kickoff Analysis
              // ============================================================
              try {
                const crewBriefData = {
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

                // Save to entrepreneur_briefs table
                await supabaseClient.rpc('upsert_entrepreneur_brief', {
                  p_session_id: sessionId,
                  p_user_id: user.id,
                  p_brief_data: crewBriefData,
                });

                // Create project from onboarding session
                const { data: projectId, error: projectError } = await supabaseClient
                  .rpc('create_project_from_onboarding', {
                    p_session_id: sessionId,
                  });

                if (projectError) {
                  throw projectError;
                }

                console.log('[api/chat] Project created:', projectId);

                // Kick off validation workflow (Modal)
                const modalClient = createModalClient();
                const conversationTranscript = JSON.stringify(updatedHistory);

                const validationInputs = buildFounderValidationInputs(
                  crewBriefData,
                  projectId,
                  user.id,
                  sessionId,
                  conversationTranscript,
                  'founder'
                );

                const response = await modalClient.kickoff({
                  entrepreneur_input: validationInputs.entrepreneur_input,
                  project_id: validationInputs.project_id,
                  user_id: validationInputs.user_id,
                  session_id: validationInputs.session_id,
                });

                const workflowId = response.run_id;
                console.log('[api/chat] Modal workflow started:', workflowId);

                // Store workflow ID in project
                await supabaseClient
                  .from('projects')
                  .update({
                    initial_analysis_workflow_id: workflowId,
                    status: 'analyzing',
                  })
                  .eq('id', projectId);

                // Update completion data with projectId and workflowId
                await supabaseClient
                  .from('onboarding_sessions')
                  .update({
                    stage_data: {
                      ...newStageData,
                      completion: {
                        ...completionData,
                        projectId,
                        workflowId,
                      },
                    },
                  })
                  .eq('session_id', sessionId);

                console.log('[api/chat] CrewAI integration complete:', { projectId, workflowId });
              } catch (crewError) {
                console.error('[api/chat] Error in CrewAI integration:', crewError);
                // Store error but don't fail - user still gets completion
                await supabaseClient
                  .from('onboarding_sessions')
                  .update({
                    stage_data: {
                      ...newStageData,
                      completion: {
                        ...completionData,
                        error: crewError instanceof Error ? crewError.message : 'Unknown error',
                      },
                    },
                  })
                  .eq('session_id', sessionId);
              }

              return; // Completion handled, exit early
            }

            // ================================================================
            // Regular Update (Not Completed)
            // ================================================================
            // P2 Fix: After auto-advance, reset coverage to 0 for the NEW stage
            // Otherwise we'd record Stage 2 as 85% complete using Stage 1's coverage
            const didAutoAdvance = newStage !== requestContext.stage;
            const coverageForProgress = didAutoAdvance ? 0 : assessment.coverage;

            const overallProgress = calculateOverallProgress(
              newStage,
              coverageForProgress,
              false,
              updatedHistory.length
            );

            // Stage progress should be 0% after auto-advance (new stage has no data yet)
            const stageProgress = didAutoAdvance ? 0 : Math.round(assessment.coverage * 100);

            console.log('[api/chat] Updating database:', {
              sessionId,
              currentStage: newStage,
              overallProgress,
              stageProgress,
              briefFields: Object.keys(newStageData.brief || {}),
            });

            const { error: updateError } = await supabaseClient
              .from('onboarding_sessions')
              .update({
                conversation_history: updatedHistory,
                current_stage: newStage,
                stage_data: newStageData,
                overall_progress: overallProgress,
                stage_progress: stageProgress,
                last_activity: new Date().toISOString(),
              })
              .eq('session_id', sessionId);

            if (updateError) {
              console.error('[api/chat] Database update failed:', updateError);
            } else {
              console.log('[api/chat] Database updated successfully');
            }
          } catch (error) {
            console.error('[api/chat] Error in onFinish callback:', error);
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
