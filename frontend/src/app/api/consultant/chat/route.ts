import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// Consultant-specific system prompt
const CONSULTANT_SYSTEM_PROMPT = `You are Maya, a Consulting Practice Specialist helping consultants set up their workspace.

Your goal is to gather information about their consulting practice in a conversational, friendly way:

**Stage 1: Welcome & Practice Overview** - Get company name and basic overview
**Stage 2: Practice Size & Structure** - Understand team size (solo, 2-10, 11-50, 51+)
**Stage 3: Industries & Services** - Learn which industries and services they focus on
**Stage 4: Current Tools & Workflow** - Discover what tools they currently use
**Stage 5: Client Management** - Understand how they manage client relationships
**Stage 6: Pain Points & Challenges** - Identify their biggest challenges
**Stage 7: Goals & White-Label Setup** - Explore goals and white-label interest

Guidelines:
- Be professional yet warm and collaborative
- Ask one clear question at a time
- Show genuine interest in their practice
- Provide helpful context when asking questions
- Keep responses concise (2-3 sentences)
- Progress naturally through stages based on their responses
- Use the assessment tools to evaluate response quality and advance stages appropriately`;

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
// AI Tools for Stage Progression
// ============================================================================

const assessQualityTool = tool({
  description: 'Assess the quality and completeness of a consultant response for the current stage. Use this frequently after receiving substantial information.',
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
  description: 'Advance from the current stage to the next stage. Only use this when you have collected sufficient information (coverage above 0.7) and the consultant has shown good clarity.',
  inputSchema: z.object({
    fromStage: z.number().min(1).max(7).describe('The current stage number'),
    toStage: z.number().min(1).max(7).describe('The next stage number (usually fromStage + 1)'),
    summary: z.string().describe('Brief summary of what was learned in this stage'),
    collectedData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).describe('Key data points collected in this stage as key-value pairs'),
  }),
  execute: async ({ fromStage, toStage, summary, collectedData }) => {
    return {
      transition: { fromStage, toStage, summary, collectedData },
      message: `Advancing from Stage ${fromStage} to Stage ${toStage}`,
    };
  },
});

const completeOnboardingTool = tool({
  description: 'Signal that all 7 stages are complete and the onboarding conversation is ready for workspace setup. Only use this after Stage 7 is thoroughly completed.',
  inputSchema: z.object({
    readinessScore: z.number().min(0).max(1).describe('Overall readiness for workspace setup (0.0 to 1.0)'),
    keyInsights: z.array(z.string()).describe('3-5 key insights about their consulting practice'),
    recommendedActions: z.array(z.string()).describe('3-5 recommended setup actions'),
  }),
  execute: async ({ readinessScore, keyInsights, recommendedActions }) => {
    return {
      completion: { readinessScore, keyInsights, recommendedActions },
      message: 'Onboarding complete - ready for workspace setup',
    };
  },
});

const consultantTools = {
  assessQuality: assessQualityTool,
  advanceStage: advanceStageTool,
  completeOnboarding: completeOnboardingTool,
};

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

    // Stream AI response with tools
    const result = streamText({
      model: getAIModel(),
      system: CONSULTANT_SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      tools: consultantTools,
      onFinish: async ({ text, toolCalls, toolResults }) => {
        try {
          console.log('[ConsultantChat] onFinish triggered:', {
            toolCallsCount: toolCalls?.length || 0,
            toolResultsCount: toolResults?.length || 0,
          });

          // Process tool results
          let newStage = currentStage;
          let newStageData = { ...stageData };
          let isCompleted = false;

          if (toolResults && toolResults.length > 0) {
            for (const result of toolResults) {
              const toolCall = toolCalls?.find(tc => tc.toolCallId === result.toolCallId);
              if (!toolCall) continue;

              console.log('[ConsultantChat] Processing tool result:', {
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

                console.log('[ConsultantChat] Stage advanced:', {
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

                console.log('[ConsultantChat] Quality assessed:', {
                  stage: currentStage,
                  coverage,
                  clarity,
                  completeness,
                });
              }

              // Handle completeOnboarding tool
              if (toolCall.toolName === 'completeOnboarding') {
                const { readinessScore, keyInsights, recommendedActions } = toolCall.input as any;

                isCompleted = true;
                newStageData.completion = {
                  readinessScore,
                  keyInsights,
                  recommendedActions,
                  completedAt: new Date().toISOString(),
                };

                console.log('[ConsultantChat] Onboarding completed:', {
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

          // Update session in database
          await supabaseClient
            .from('consultant_onboarding_sessions')
            .update(updateData)
            .eq('session_id', sessionId);

          console.log(`[ConsultantChat] Session ${sessionId} updated: ${updateData.overall_progress}% progress`);
        } catch (error) {
          console.error('[ConsultantChat] Error updating session:', error);
          // Don't throw - we still want to return the stream to the user
        }
      },
    });

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('[ConsultantChat] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
