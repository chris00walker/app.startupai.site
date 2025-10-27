import { NextRequest, NextResponse } from 'next/server';
import { BYPASS_LIMITS } from '@/lib/env';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>;
type SupabaseClient = SupabaseAdminClient | SupabaseServerClient;

// ============================================================================
// Types and Interfaces
// ============================================================================

interface StartOnboardingRequest {
  userId?: string;
  planType: 'trial' | 'sprint' | 'founder' | 'enterprise';
  resumeSessionId?: string;
  userContext?: {
    referralSource?: string;
    previousExperience?: 'first_time' | 'experienced' | 'serial_entrepreneur';
    timeAvailable?: number; // minutes available for conversation
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

interface CrewConversationStartSession {
  agent_introduction: string;
  first_question: string;
  context: {
    agentPersonality: Record<string, any>;
    expectedOutcomes: string[];
    privacyNotice: string;
  };
  stage_state: {
    current_stage: number;
    total_stages: number;
    stage_name: string;
    summary?: string;
  };
  stage_snapshot: CrewStageSnapshot;
  quality_signals: CrewQualitySignals;
  estimated_duration: string;
  user_context: Record<string, any>;
}

interface CrewConversationStartResponse {
  success: boolean;
  kind: 'conversation_start';
  session: CrewConversationStartSession;
}

interface StartOnboardingResponse {
  success: boolean;
  sessionId: string;
  agentIntroduction: string;
  firstQuestion: string;
  estimatedDuration: string;
  stageInfo: {
    currentStage: number;
    totalStages: number;
    stageName: string;
    stageDescription: string;
  };
  conversationContext: {
    agentPersonality: Record<string, any>;
    expectedOutcomes: string[];
    privacyNotice: string;
  };
  qualitySignals: CrewQualitySignals;
  stageSnapshot: CrewStageSnapshot;
}

interface StartOnboardingError {
  success: false;
  error: {
    code: 'INVALID_REQUEST' | 'USER_NOT_FOUND' | 'INVALID_PLAN' | 'SESSION_LIMIT_EXCEEDED' | 'AI_SERVICE_UNAVAILABLE';
    message: string;
    retryable: boolean;
    fallbackOptions?: string[];
  };
}

// ============================================================================
// Plan Limits Configuration
// ============================================================================

const PLAN_LIMITS = {
  trial: {
    sessionsPerMonth: 3,
    messagesPerSession: 100,
    analysisWorkflowsPerMonth: 3,
  },
  sprint: {
    sessionsPerMonth: 5,
    messagesPerSession: 150,
    analysisWorkflowsPerMonth: 5,
  },
  founder: {
    sessionsPerMonth: 15,
    messagesPerSession: 300,
    analysisWorkflowsPerMonth: 25,
  },
  enterprise: {
    sessionsPerMonth: 100,
    messagesPerSession: 1000,
    analysisWorkflowsPerMonth: 200,
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

async function checkPlanLimits(
  client: SupabaseClient,
  userId: string,
  planType: string
) {
  if (BYPASS_LIMITS) {
    return {
      allowed: true,
      reason: null,
      message: null,
    };
  }

  try {
    // Get user's current month sessions
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: sessions, error } = await client
      .from('onboarding_sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('started_at', startOfMonth.toISOString());

    if (error) {
      console.error('Error checking plan limits:', error);
      return {
        allowed: true, // Allow on error to avoid blocking users
        reason: null,
        message: null,
      };
    }
    
    const currentSessions = sessions?.length || 0;
    const limit = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS]?.sessionsPerMonth || 3;
    
    if (currentSessions >= limit) {
      return {
        allowed: false,
        reason: 'SESSION_LIMIT_EXCEEDED',
        message: `You've reached your monthly limit of ${limit} onboarding sessions. Please upgrade your plan or wait until next month.`,
        fallbackOptions: ['upgrade_plan', 'contact_support'],
      };
    }
    
    return {
      allowed: true,
      reason: null,
      message: null,
    };
  } catch (error) {
    console.error('Plan limits check error:', error);
    return {
      allowed: true, // Allow on error to avoid blocking users
      reason: null,
      message: null,
    };
  }
}

function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(36))
    .join('');
  return `onb_${timestamp}_${randomBytes}`;
}

async function saveOnboardingSession(
  client: SupabaseClient,
  sessionData: {
    sessionId: string;
    userId: string;
    planType: string;
    status: string;
    startedAt: Date;
    stageData: Record<string, any>;
    aiContext: Record<string, any>;
    stageState: {
      currentStage: number;
      totalStages: number;
      stageName: string;
      stageDescription: string;
    };
    stageProgress: number;
    overallProgress: number;
    userContext?: Record<string, any>;
  }
) {
  try {
    const { data, error } = await client
      .from('onboarding_sessions')
      .insert({
        session_id: sessionData.sessionId,
        user_id: sessionData.userId,
        plan_type: sessionData.planType,
        status: sessionData.status,
        current_stage: sessionData.stageState.currentStage,
        stage_progress: sessionData.stageProgress,
        overall_progress: sessionData.overallProgress,
        conversation_history: [],
        stage_data: sessionData.stageData,
        ai_context: {
          ...sessionData.aiContext,
          stageState: sessionData.stageState,
        },
        user_context: sessionData.userContext ?? {},
        started_at: sessionData.startedAt.toISOString(),
        last_activity: sessionData.startedAt.toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving onboarding session:', error);
      throw new Error('Failed to save session');
    }

    return data;
  } catch (error) {
    console.error('Save session error:', error);
    throw error;
  }
}

// ============================================================================
// Main API Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planType, resumeSessionId, userContext }: StartOnboardingRequest = body;

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
            code: 'USER_NOT_FOUND',
            message: 'User not authenticated or not found',
            retryable: false,
          },
        } as StartOnboardingError,
        { status: 401 },
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Authentication token missing from session',
            retryable: false,
          },
        } as StartOnboardingError,
        { status: 401 },
      );
    }

    let supabaseClient: SupabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[onboarding/start] SUPABASE_SERVICE_ROLE_KEY unavailable, falling back to user-scoped client.');
      supabaseClient = sessionClient;
    }

    const allowedPlans = new Set<StartOnboardingRequest['planType']>(['trial', 'sprint', 'founder', 'enterprise']);

    if (!planType || !allowedPlans.has(planType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PLAN',
            message: 'Invalid or missing plan type',
            retryable: false,
          },
        } as StartOnboardingError,
        { status: 400 },
      );
    }

    const planCheck = await checkPlanLimits(supabaseClient, user.id, planType);
    if (!planCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: (planCheck.reason as StartOnboardingError['error']['code']) ?? 'SESSION_LIMIT_EXCEEDED',
            message: planCheck.message || 'Plan limit reached',
            retryable: false,
            fallbackOptions: planCheck.fallbackOptions || ['upgrade_plan', 'contact_support'],
          },
        } as StartOnboardingError,
        { status: 403 },
      );
    }

    if (resumeSessionId) {
      console.info(
        `[onboarding/start] Received resumeSessionId (${resumeSessionId}) but resume flow is not yet implemented. Creating a new session instead.`,
      );
    }

    const sessionId = generateSessionId();
    const startedAt = new Date();

    let crewSession: CrewConversationStartSession;
    try {
      const crewUrl = resolveCrewFunctionUrl(request);
      const crewResponse = await fetch(crewUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'conversation_start',
          plan_type: planType,
          user_context: userContext ?? {},
        }),
      });

      if (!crewResponse.ok) {
        const errorText = await crewResponse.text();
        throw new Error(`CrewAI start failed (${crewResponse.status}): ${errorText}`);
      }

      const payload = (await crewResponse.json()) as CrewConversationStartResponse;
      if (!payload?.success || !payload.session) {
        throw new Error('CrewAI start payload was invalid');
      }

      crewSession = payload.session;
    } catch (error) {
      console.error('[onboarding/start] CrewAI start error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: 'The AI onboarding agent is unavailable right now. Please try again shortly.',
            retryable: true,
            fallbackOptions: ['retry', 'contact_support'],
          },
        } as StartOnboardingError,
        { status: 503 },
      );
    }

    const stageSnapshot = crewSession.stage_snapshot;
    const stageKey = `stage_${stageSnapshot.stage ?? crewSession.stage_state.current_stage}`;
    const initialStageData = {
      brief: {},
      coverage: {
        [stageKey]: {
          ...stageSnapshot,
          quality_signals: crewSession.quality_signals,
        },
      },
    };

    const stageDescription =
      crewSession.stage_state.summary ?? 'Getting to know you and your business idea';

    const aiContext = {
      persona: crewSession.context.agentPersonality,
      qualitySignals: crewSession.quality_signals,
    };

    await saveOnboardingSession(supabaseClient, {
      sessionId,
      userId: user.id,
      planType,
      status: 'active',
      startedAt,
      stageData: initialStageData,
      aiContext,
      stageState: {
        currentStage: crewSession.stage_state.current_stage,
        totalStages: crewSession.stage_state.total_stages,
        stageName: crewSession.stage_state.stage_name,
        stageDescription,
      },
      stageProgress: Math.round((stageSnapshot.coverage ?? 0) * 100),
      overallProgress: Math.round((stageSnapshot.coverage ?? 0) * 100),
      userContext,
    });

    const response: StartOnboardingResponse = {
      success: true,
      sessionId,
      agentIntroduction: crewSession.agent_introduction,
      firstQuestion: crewSession.first_question,
      estimatedDuration: crewSession.estimated_duration,
      stageInfo: {
        currentStage: crewSession.stage_state.current_stage,
        totalStages: crewSession.stage_state.total_stages,
        stageName: crewSession.stage_state.stage_name,
        stageDescription,
      },
      conversationContext: crewSession.context,
      qualitySignals: crewSession.quality_signals,
      stageSnapshot,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Onboarding start error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_SERVICE_UNAVAILABLE',
          message: 'Unable to start conversation. Please try again in a moment.',
          retryable: true,
        },
      } as StartOnboardingError,
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
