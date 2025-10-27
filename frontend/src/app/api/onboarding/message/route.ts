import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>;
type SupabaseClient = SupabaseAdminClient | SupabaseServerClient;

// ============================================================================
// Types and Interfaces
// ============================================================================

interface SendMessageRequest {
  sessionId: string;
  userMessage: string;
  messageType: 'text' | 'voice_transcript';
  timestamp: string;
  messageId: string; // Client-generated for deduplication
  conversationContext?: {
    previousMessageId?: string;
    userConfidence?: 'high' | 'medium' | 'low';
    needsHelp?: boolean;
  };
}

interface CrewQualityScore {
  label: string;
  score: number;
}

interface CrewQualitySignals {
  clarity: CrewQualityScore;
  completeness: CrewQualityScore;
  detail_score: number;
  overall: number;
  quality_tags?: string[];
  suggestions?: string[];
  encouragement?: string;
}

interface CrewStageSnapshot {
  stage: number;
  coverage: number;
  quality: {
    clarity: CrewQualityScore;
    completeness: CrewQualityScore;
    detail_score: number;
  };
  brief_fields: string[];
  last_message_excerpt?: string;
  updated_at: string;
  notes?: string;
}

interface CrewConversationMessage {
  agent_response: string;
  follow_up_question?: string;
  quality_signals: CrewQualitySignals;
  brief_update: Record<string, any>;
  stage_state: {
    previous_stage: number;
    current_stage: number;
    stage_progress: number;
    overall_progress: number;
    stage_name: string;
    next_stage_name?: string;
    total_stages: number;
    is_stage_complete: boolean;
  };
  stage_snapshot: CrewStageSnapshot;
  system_actions: {
    trigger_workflow: boolean;
    save_checkpoint: boolean;
    request_clarification: boolean;
    needs_review?: boolean;
  };
  conversation_metrics: {
    stage_progress: number;
    overall_progress: number;
    clarity_label: 'high' | 'medium' | 'low';
    completeness_label: 'complete' | 'partial' | 'insufficient';
  };
}

interface CrewConversationMessageResponse {
  success: boolean;
  kind: 'conversation_message';
  message: CrewConversationMessage;
}

interface SendMessageResponse {
  success: boolean;
  messageId: string;
  agentResponse: string;
  followUpQuestion?: string;
  stageProgress: {
    currentStage: number;
    stageProgress: number; // 0-100% within current stage
    overallProgress: number; // 0-100% total conversation
    nextStageName?: string;
  };
  briefUpdate: Partial<any>; // EntrepreneurBrief
  qualitySignals: CrewQualitySignals;
  stageSnapshot: CrewStageSnapshot;
  validationFeedback?: {
    clarity: 'high' | 'medium' | 'low';
    completeness: 'complete' | 'partial' | 'insufficient';
    suggestions: string[];
    encouragement?: string;
  };
  conversationState: {
    isStageComplete: boolean;
    canAdvanceStage: boolean;
    requiredDataMissing?: string[];
    nextStage?: any; // StageInfo
  };
  systemActions?: {
    triggerWorkflow?: boolean;
    saveCheckpoint?: boolean;
    requestClarification?: boolean;
    needsReview?: boolean;
  };
}

interface MessageError {
  success: false;
  error: {
    code: 'INVALID_REQUEST' | 'INVALID_SESSION' | 'PROCESSING_ERROR' | 'DUPLICATE_MESSAGE' | 'RATE_LIMITED';
    message: string;
    retryable: boolean;
  };
}

// ============================================================================
// Conversation Stage Configuration
// ============================================================================

const CONVERSATION_STAGES = {
  1: {
    name: 'Welcome & Introduction',
    description: 'Getting to know you and your business idea',
    keyQuestions: [
      'What business idea are you most excited about?',
      'What inspired this idea?',
      'What stage is your business currently in?',
    ],
    dataToCollect: ['business_concept', 'inspiration', 'current_stage'],
    progressThreshold: 80,
  },
  2: {
    name: 'Customer Discovery',
    description: 'Understanding your target customers',
    keyQuestions: [
      'Who do you think would be most interested in this solution?',
      'What specific group of people have this problem most acutely?',
      'How do these customers currently solve this problem?',
    ],
    dataToCollect: ['target_customers', 'customer_segments', 'current_solutions'],
    progressThreshold: 75,
  },
  3: {
    name: 'Problem Definition',
    description: 'Defining the core problem you\'re solving',
    keyQuestions: [
      'What specific problem does your solution address?',
      'How painful is this problem for your customers?',
      'How often do they encounter this problem?',
    ],
    dataToCollect: ['problem_description', 'pain_level', 'frequency'],
    progressThreshold: 80,
  },
  4: {
    name: 'Solution Validation',
    description: 'Exploring your proposed solution',
    keyQuestions: [
      'How does your solution solve this problem?',
      'What makes your approach unique?',
      'What\'s your key differentiator?',
    ],
    dataToCollect: ['solution_description', 'unique_value_prop', 'differentiation'],
    progressThreshold: 75,
  },
  5: {
    name: 'Competitive Analysis',
    description: 'Understanding the competitive landscape',
    keyQuestions: [
      'Who else is solving this problem?',
      'What alternatives do customers have?',
      'What would make customers switch to your solution?',
    ],
    dataToCollect: ['competitors', 'alternatives', 'switching_barriers'],
    progressThreshold: 70,
  },
  6: {
    name: 'Resources & Constraints',
    description: 'Assessing your available resources',
    keyQuestions: [
      'What\'s your budget for getting started?',
      'What skills and resources do you have available?',
      'What are your main constraints?',
    ],
    dataToCollect: ['budget_range', 'available_resources', 'constraints'],
    progressThreshold: 75,
  },
  7: {
    name: 'Goals & Next Steps',
    description: 'Setting strategic goals and priorities',
    keyQuestions: [
      'What do you want to achieve in the next 3 months?',
      'How will you measure success?',
      'What\'s your biggest priority right now?',
    ],
    dataToCollect: ['short_term_goals', 'success_metrics', 'priorities'],
    progressThreshold: 85,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function resolveCrewFunctionUrl(request: NextRequest): string {
  if (process.env.CREW_ANALYZE_URL) {
    return process.env.CREW_ANALYZE_URL;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost ?? request.headers.get('host');

  if (host) {
    const protocol = forwardedProto ?? (host.includes('localhost') ? 'http' : 'https');
    return `${protocol}://${host}/.netlify/functions/crew-analyze`;
  }

  return 'http://localhost:8888/.netlify/functions/crew-analyze';
}

async function getOnboardingSession(client: SupabaseClient, sessionId: string, expectedUserId?: string) {
  try {
    const { data: session, error } = await client
      .from('onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    if (expectedUserId && session?.user_id && session.user_id !== expectedUserId) {
      console.warn(
        `[onboarding/message] Session ownership mismatch. Expected ${expectedUserId}, got ${session.user_id}.`,
      );
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

async function checkDuplicateMessage(client: SupabaseClient, sessionId: string, messageId: string) {
  try {
    const { data: session } = await client
      .from('onboarding_sessions')
      .select('conversation_history')
      .eq('session_id', sessionId)
      .single();
    
    if (!session?.conversation_history) return false;
    
    const history = Array.isArray(session.conversation_history) ? session.conversation_history : [];
    return history.some((msg: any) => msg.messageId === messageId);
  } catch (error) {
    console.error('Duplicate check error:', error);
    return false;
  }
}

function generateResponseId(): string {
  return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function updateOnboardingSession(
  client: SupabaseClient,
  sessionId: string,
  updates: {
    conversationHistory: any[];
    currentStage: number;
    stageData: any;
    lastActivity: Date;
    stageProgress: number;
    overallProgress: number;
  },
) {
  try {
    const { data, error } = await client
      .from('onboarding_sessions')
      .update({
        conversation_history: updates.conversationHistory,
        current_stage: updates.currentStage,
        stage_data: updates.stageData,
        stage_progress: updates.stageProgress,
        overall_progress: updates.overallProgress,
        last_activity: updates.lastActivity.toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Extend expiry
      })
      .eq('session_id', sessionId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating session:', error);
      throw new Error('Failed to update session');
    }
    
    return data;
  } catch (error) {
    console.error('Update session error:', error);
    throw error;
  }
}

// Simple in-memory cache for demonstration
// TODO: Replace with Redis or proper caching solution
const responseCache = new Map<string, any>();

async function cacheResponse(sessionId: string, messageId: string, response: any) {
  const cacheKey = `${sessionId}:${messageId}`;
  responseCache.set(cacheKey, {
    response,
    timestamp: Date.now(),
  });
  
  // Clean up old cache entries (keep only last 100)
  if (responseCache.size > 100) {
    const entries = Array.from(responseCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < entries.length - 100; i++) {
      responseCache.delete(entries[i][0]);
    }
  }
}

async function getCachedResponse(sessionId: string, messageId: string) {
  const cacheKey = `${sessionId}:${messageId}`;
  const cached = responseCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minute cache
    return NextResponse.json({
      success: true,
      ...cached.response,
      cached: true,
    });
  }
  
  return null;
}

// ============================================================================
// Main API Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userMessage, messageType, timestamp, messageId }: SendMessageRequest = body;

    const sessionClient = await createServerClient();
    const [
      {
        data: { user },
        error: userError,
      },
      sessionResult,
    ] = await Promise.all([sessionClient.auth.getUser(), sessionClient.auth.getSession()]);

    const accessToken = sessionResult.data.session?.access_token;

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SESSION',
            message: 'User session is required',
            retryable: false,
          },
        } as MessageError,
        { status: 401 },
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SESSION',
            message: 'Authentication token missing',
            retryable: false,
          },
        } as MessageError,
        { status: 401 },
      );
    }

    let supabaseClient: SupabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[onboarding/message] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = sessionClient;
    }

    if (!sessionId || !userMessage || !messageId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: sessionId, userMessage, messageId',
            retryable: false,
          },
        } as MessageError,
        { status: 400 },
      );
    }

    const session = await getOnboardingSession(supabaseClient, sessionId, user.id);
    if (!session || session.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SESSION',
            message: 'Session not found, expired, or inactive',
            retryable: false,
          },
        } as MessageError,
        { status: 404 },
      );
    }

    const isDuplicate = await checkDuplicateMessage(supabaseClient, sessionId, messageId);
    if (isDuplicate) {
      const cachedResponse = await getCachedResponse(sessionId, messageId);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    let crewPayload: CrewConversationMessageResponse;
    try {
      const crewUrl = resolveCrewFunctionUrl(request);
      const crewResponse = await fetch(crewUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'conversation_message',
          session_id: sessionId,
          message: userMessage,
          message_type: messageType || 'text',
          current_stage: session.current_stage || 1,
          conversation_history: session.conversation_history || [],
          stage_data: session.stage_data || {},
        }),
      });

      if (crewResponse.status === 429) {
        const rateLimitPayload = await crewResponse.json().catch(() => ({}));
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: rateLimitPayload?.error || 'CrewAI rate limit reached. Please wait and try again.',
              retryable: true,
            },
          } as MessageError,
          { status: 429 },
        );
      }

      if (!crewResponse.ok) {
        const errorText = await crewResponse.text();
        throw new Error(`CrewAI message failed (${crewResponse.status}): ${errorText}`);
      }

      const payload = (await crewResponse.json()) as CrewConversationMessageResponse;
      if (!payload?.success || !payload.message) {
        throw new Error('CrewAI message payload was invalid');
      }

      crewPayload = payload;
    } catch (crewError) {
      console.error('[onboarding/message] CrewAI conversation error:', crewError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROCESSING_ERROR',
            message: 'Unable to process message right now. Please try again.',
            retryable: true,
          },
        } as MessageError,
        { status: 502 },
      );
    }

    const crewMessage = crewPayload.message;
    const timestampIso = timestamp || new Date().toISOString();
    const stageSnapshot = crewMessage.stage_snapshot;
    const stageKey = `stage_${stageSnapshot.stage ?? session.current_stage ?? 1}`;

    const existingStageData = session.stage_data || {};
    const previousBrief =
      existingStageData && typeof (existingStageData as any).brief === 'object'
        ? (existingStageData as any).brief
        : existingStageData;
    const previousCoverage =
      existingStageData && typeof (existingStageData as any).coverage === 'object'
        ? (existingStageData as any).coverage
        : {};

    const updatedStageData = {
      brief: {
        ...(previousBrief ?? {}),
        ...crewMessage.brief_update,
      },
      coverage: {
        ...(previousCoverage ?? {}),
        [stageKey]: {
          ...stageSnapshot,
          quality_signals: crewMessage.quality_signals,
          system_actions: crewMessage.system_actions,
        },
      },
    };

    const newConversationEntry = {
      messageId,
      userMessage,
      agentResponse: crewMessage.agent_response,
      timestamp: timestampIso,
      stage: crewMessage.stage_state.previous_stage ?? session.current_stage,
      messageType: messageType || 'text',
      qualitySignals: crewMessage.quality_signals,
      systemActions: crewMessage.system_actions,
    };

    const updatedHistory = [...(session.conversation_history || []), newConversationEntry];
    const stageProgressValue = Math.round(
      Math.max(0, Math.min(100, crewMessage.conversation_metrics.stage_progress ?? 0)),
    );
    const overallProgressValue = Math.round(
      Math.max(0, Math.min(100, crewMessage.conversation_metrics.overall_progress ?? 0)),
    );

    await updateOnboardingSession(supabaseClient, sessionId, {
      conversationHistory: updatedHistory,
      currentStage: crewMessage.stage_state.current_stage,
      stageData: updatedStageData,
      stageProgress: stageProgressValue,
      overallProgress: overallProgressValue,
      lastActivity: new Date(),
    });

    const systemActions = {
      triggerWorkflow: crewMessage.system_actions.trigger_workflow,
      saveCheckpoint: crewMessage.system_actions.save_checkpoint,
      requestClarification: crewMessage.system_actions.request_clarification,
      needsReview: crewMessage.system_actions.needs_review ?? false,
    };

    const validationFeedback = {
      clarity: crewMessage.conversation_metrics.clarity_label,
      completeness: crewMessage.conversation_metrics.completeness_label,
      suggestions: crewMessage.quality_signals.suggestions ?? [],
      encouragement:
        crewMessage.quality_signals.encouragement ??
        "You're making great progress! Your insights are helping build a comprehensive picture of your business opportunity.",
    };

    const nextStageInfo =
      CONVERSATION_STAGES[crewMessage.stage_state.current_stage as keyof typeof CONVERSATION_STAGES];

    const response: SendMessageResponse = {
      success: true,
      messageId: generateResponseId(),
      agentResponse: crewMessage.agent_response,
      followUpQuestion: crewMessage.follow_up_question,
      stageProgress: {
        currentStage: crewMessage.stage_state.current_stage,
        stageProgress: stageProgressValue,
        overallProgress: overallProgressValue,
        nextStageName: crewMessage.stage_state.next_stage_name ?? nextStageInfo?.name,
      },
      briefUpdate: crewMessage.brief_update,
      qualitySignals: crewMessage.quality_signals,
      stageSnapshot,
      validationFeedback,
      conversationState: {
        isStageComplete: crewMessage.stage_state.is_stage_complete,
        canAdvanceStage:
          crewMessage.stage_state.is_stage_complete &&
          crewMessage.stage_state.current_stage < crewMessage.stage_state.total_stages,
        requiredDataMissing: systemActions.requestClarification ? ['more_details'] : [],
        nextStage: nextStageInfo,
      },
      systemActions,
    };

    await cacheResponse(sessionId, messageId, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Message processing error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Unable to process message. Please try again.',
          retryable: true,
        },
      } as MessageError,
      { status: 500 },
    );
  }
}

// ============================================================================
// OPTIONS handler for CORS
// ============================================================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
