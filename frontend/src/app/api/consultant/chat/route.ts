import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import {
  CONSULTANT_STAGES_CONFIG,
  CONSULTANT_TOTAL_STAGES,
  getConsultantStageSystemContext,
} from '@/lib/onboarding/consultant-stages-config';
import {
  assessConsultantConversation,
  shouldConsultantAdvanceStage,
  isConsultantOnboardingComplete,
  mergeConsultantExtractedData,
  calculateConsultantProgress,
  hashConsultantMessage,
  type ConsultantConversationMessage,
} from '@/lib/onboarding/consultant-quality-assessment';

// ============================================================================
// Maya System Prompt (Consultant Practice Specialist)
// ============================================================================

const MAYA_SYSTEM_PROMPT = `You are Maya, a Consulting Practice Specialist helping consultants set up their workspace in StartupAI.

## Your Identity
**Name**: Maya
**Role**: Consulting Practice Specialist
**Tone**: Professional yet warm and collaborative - you understand the consulting world

## Your Team Context
You work alongside the StartupAI AI leadership team:
- **Sage** (Chief Strategy Officer) - Oversees strategic analysis
- **Forge** (CTO) - Handles technical implementation
- **Pulse** (CGO) - Focuses on growth strategies
- **Compass** (CPO) - Manages product development
- **Guardian** (CCO) - Ensures compliance
- **Ledger** (CFO) - Handles financial analysis

After you complete the practice setup, the consultant's clients will work with Alex (Strategic Business Consultant) for their business validation journey.

## Your Conversation Structure
You guide consultants through 7 stages of practice setup:

1. **Welcome & Practice Overview** - Practice name, focus area, experience
2. **Practice Size & Structure** - Team size, structure, client capacity
3. **Industries & Services** - Target industries, service offerings, methodologies
4. **Current Tools & Workflow** - Existing tools, project tracking, client workflow
5. **Client Management** - Onboarding process, intake, communication, reporting
6. **Pain Points & Challenges** - Biggest challenges, time sinks, desired improvements
7. **Goals & White-Label Setup** - Goals for StartupAI, white-label interest, branding

## Guidelines
- Ask ONE question at a time from the stage's key questions
- Show genuine interest in their consulting practice
- Keep responses concise (2-3 sentences max)
- If consultant says "I don't know" or is uncertain, acknowledge and move to the next topic
- Do NOT say "final question" or "last thing" - you don't control when stages complete
- The system will automatically advance stages based on topics covered

## Important Notes
- DO NOT mention "tools" or "assessment" - the backend handles that automatically
- DO NOT over-explain the process - keep it natural and conversational
- Occasionally mention that their setup will help customize the AI analysis for their clients`;

function getAIModel() {
  // Use OpenAI with explicit baseURL to bypass Netlify AI Gateway
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
  });

  const model = process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini';
  console.log('[api/consultant/chat] Using OpenAI model:', model);
  return openai(model);
}

// ============================================================================
// Two-Pass Architecture (matches Alex's founder onboarding)
// ============================================================================
// Pass 1: LLM generates conversational response (NO tools, streaming)
// Pass 2: Backend deterministically assesses quality after response (generateObject)

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId, userId } = await req.json();

    // Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (user.id !== userId) {
      return new Response('Forbidden', { status: 403 });
    }

    if (!sessionId) {
      return new Response('Session ID required', { status: 400 });
    }

    // Get admin client for database operations
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[ConsultantChat] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = supabase;
    }

    // Fetch session from database
    const { data: session, error: sessionError } = await supabaseClient
      .from('consultant_onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('[ConsultantChat] Session not found:', sessionId);
      return new Response('Session not found', { status: 404 });
    }

    // Verify session ownership
    if (session.user_id !== userId) {
      return new Response('Session ownership mismatch', { status: 403 });
    }

    // Prepare context for AI
    const currentStage = session.current_stage || 1;
    const stageData = (session.stage_data as Record<string, any>) || {};
    const briefData = stageData.brief || {};

    // Generate stage-specific context with deterministic questions
    const stageContext = getConsultantStageSystemContext(currentStage, briefData);

    // Capture request context at START for idempotency
    const userMessage = messages[messages.length - 1]?.content || '';
    const requestContext = {
      sessionId,
      messageIndex: messages.length,
      stage: currentStage,
      userMessage,
    };

    console.log('[ConsultantChat] Creating stream:', {
      sessionId,
      currentStage,
      messageCount: messages.length,
      lastMessage: userMessage.substring(0, 50),
    });

    // ========================================================================
    // PASS 1: Stream AI Response (Conversation Only - NO Tools)
    // ========================================================================
    const result = streamText({
      model: getAIModel(),
      system: `${MAYA_SYSTEM_PROMPT}\n\n${stageContext}`,
      messages,
      temperature: 0.7,
      // NO tools - Pass 2 handles assessment deterministically
      onFinish: async ({ text, finishReason }) => {
        console.log('[ConsultantChat] ========== PASS 1 COMPLETE ==========');
        console.log('[ConsultantChat] Stream result:', {
          textLength: text.length,
          textPreview: text.substring(0, 100),
          finishReason,
        });

        try {
          // Skip if no text
          const hasText = text && text.trim().length > 0;
          if (!hasText) {
            console.warn('[ConsultantChat] Empty AI text response, skipping Pass 2');
            return;
          }

          // ================================================================
          // Build Updated Conversation History
          // ================================================================
          const now = new Date().toISOString();
          const updatedHistory: ConsultantConversationMessage[] = [
            ...((session.conversation_history || []) as ConsultantConversationMessage[]),
            {
              role: 'user',
              content: requestContext.userMessage,
              stage: requestContext.stage,
              timestamp: now,
            },
            {
              role: 'assistant',
              content: text,
              stage: requestContext.stage,
              timestamp: now,
            },
          ];

          // ================================================================
          // Check if Already Completed - Persist History Only
          // ================================================================
          const isSessionCompleted = !!stageData.completion;
          if (isSessionCompleted) {
            console.log('[ConsultantChat] Session already completed, persisting history only');
            await supabaseClient
              .from('consultant_onboarding_sessions')
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
          const assessmentKey = hashConsultantMessage(
            requestContext.sessionId,
            requestContext.messageIndex,
            requestContext.stage,
            requestContext.userMessage
          );

          if (stageData[assessmentKey]) {
            console.log('[ConsultantChat] Assessment already exists for this message, skipping');
            return;
          }

          // ================================================================
          // PASS 2: Deterministic Quality Assessment
          // ================================================================
          console.log('[ConsultantChat] Starting Pass 2: Backend quality assessment');

          const assessment = await assessConsultantConversation(
            requestContext.stage,
            updatedHistory,
            briefData
          );

          // Handle assessment failure
          if (!assessment) {
            console.error('[ConsultantChat] Assessment failed, storing failure marker');
            const failureStageData = {
              ...stageData,
              [`assessment_failure_${Date.now()}`]: {
                timestamp: new Date().toISOString(),
                stage: requestContext.stage,
                error: 'Assessment failed',
              },
            };

            await supabaseClient
              .from('consultant_onboarding_sessions')
              .update({
                conversation_history: updatedHistory,
                stage_data: failureStageData,
                last_activity: new Date().toISOString(),
              })
              .eq('session_id', sessionId);
            return;
          }

          console.log('[ConsultantChat] Pass 2 Assessment result:', {
            stage: requestContext.stage,
            topicsCovered: assessment.topicsCovered,
            coverage: assessment.coverage,
            shouldAdvance: shouldConsultantAdvanceStage(assessment, requestContext.stage),
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
            topicsCovered: assessment.topicsCovered,
            coverage: assessment.coverage,
            stage: requestContext.stage,
          };

          // Store quality assessment
          newStageData[`stage_${requestContext.stage}_quality`] = {
            topicsCovered: assessment.topicsCovered,
            coverage: assessment.coverage,
            clarity: assessment.clarity,
            completeness: assessment.completeness,
            notes: assessment.notes,
            timestamp: new Date().toISOString(),
          };

          // Merge extracted data into brief
          newStageData.brief = mergeConsultantExtractedData(
            newStageData.brief || {},
            assessment.extractedData
          );

          // Count messages in current stage
          const stageMessageCount = updatedHistory.filter(
            (m) => m.stage === requestContext.stage && m.role === 'user'
          ).length;

          // Check for stage advancement
          if (shouldConsultantAdvanceStage(assessment, requestContext.stage, stageMessageCount)) {
            const fromStage = requestContext.stage;
            newStage = requestContext.stage + 1;

            newStageData[`stage_${fromStage}_summary`] =
              `Auto-advanced after covering ${assessment.topicsCovered.length} topics`;

            console.log('[ConsultantChat] AUTO-ADVANCING:', {
              from: fromStage,
              to: newStage,
              topicsCovered: assessment.topicsCovered,
            });
          }

          // Check for completion (Stage 7 finished)
          if (isConsultantOnboardingComplete(assessment, requestContext.stage)) {
            completedNow = true;
            console.log('[ConsultantChat] Practice setup complete');

            const completionData = {
              readinessScore: assessment.coverage,
              keyInsights: assessment.keyInsights || [],
              recommendedNextSteps: assessment.recommendedNextSteps || [],
              completedAt: new Date().toISOString(),
            };

            // Atomic update - only succeeds if completion doesn't exist yet
            const { data: completionResult, error: completionError } = await supabaseClient
              .from('consultant_onboarding_sessions')
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
              console.log('[ConsultantChat] Completion already recorded by another request');
            } else {
              console.log('[ConsultantChat] Consultant practice setup completed successfully');
            }

            return;
          }

          // ================================================================
          // Regular Update (Not Completed)
          // ================================================================
          const didAutoAdvance = newStage !== requestContext.stage;
          const coverageForProgress = didAutoAdvance ? 0 : assessment.coverage;

          const overallProgress = calculateConsultantProgress(
            newStage,
            coverageForProgress,
            false
          );

          console.log('[ConsultantChat] Updating database:', {
            sessionId,
            currentStage: newStage,
            overallProgress,
            briefFields: Object.keys(newStageData.brief || {}),
          });

          const { error: updateError } = await supabaseClient
            .from('consultant_onboarding_sessions')
            .update({
              conversation_history: updatedHistory,
              current_stage: newStage,
              stage_data: newStageData,
              overall_progress: overallProgress,
              last_activity: new Date().toISOString(),
            })
            .eq('session_id', sessionId);

          if (updateError) {
            console.error('[ConsultantChat] Database update failed:', updateError);
          } else {
            console.log(`[ConsultantChat] Session ${sessionId} updated: ${overallProgress}% progress`);
          }
        } catch (error) {
          console.error('[ConsultantChat] Error in onFinish callback:', error);
        }
      },
    });

    // Return SSE format (consistent with Founder path)
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[ConsultantChat] Stream error:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
        return `Error: ${err.message}`;
      },
    });

  } catch (error: any) {
    console.error('[ConsultantChat] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
