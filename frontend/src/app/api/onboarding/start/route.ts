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
  forceNew?: boolean; // Skip session resumption and create fresh session
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

function resolveAgentUrl(): string {
  // Use Agentuity agent URL if configured
  if (process.env.AGENTUITY_AGENT_URL) {
    return process.env.AGENTUITY_AGENT_URL;
  }

  // Fallback to legacy CrewAI URL if still using Netlify functions
  if (process.env.CREW_ANALYZE_URL) {
    console.warn('[onboarding] Using legacy CREW_ANALYZE_URL - consider migrating to Agentuity');
    return process.env.CREW_ANALYZE_URL;
  }

  // Default to local Agentuity agent for development
  return 'http://localhost:8000/onboarding';
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
    const { planType, resumeSessionId, forceNew, userContext }: StartOnboardingRequest = body;

    const sessionClient = await createServerClient();
    const [
      {
        data: { user },
        error: userError,
      },
      sessionResult,
    ] = await Promise.all([sessionClient.auth.getUser(), sessionClient.auth.getSession()]);

    const accessToken = sessionResult.data.session?.access_token;

    // Allow test user in development mode for API testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTestUser = body.userId === 'test-user-id';

    if ((userError || !user) && !(isDevelopment && isTestUser)) {
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

    // Use test user data if in dev mode with test user
    const effectiveUser = user || (isDevelopment && isTestUser ? { id: 'test-user-id', email: 'test@example.com' } : null);
    if (!effectiveUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not authenticated',
            retryable: false,
          },
        } as StartOnboardingError,
        { status: 401 },
      );
    }

    // Skip token check for test users in development
    if (!accessToken && !(isDevelopment && isTestUser)) {
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

    // Skip plan limits check for test users in development
    if (!(isDevelopment && isTestUser)) {
      const planCheck = await checkPlanLimits(supabaseClient, effectiveUser.id as string, planType);
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
    }

    // Check for existing active sessions to enable session resumption (skip if forceNew)
    const { data: existingSessions } = forceNew ? { data: null } : await supabaseClient
      .from('onboarding_sessions')
      .select('*')
      .eq('user_id', effectiveUser.id)
      .in('status', ['active', 'paused'])
      .order('last_activity', { ascending: false })
      .limit(1);

    // If existing active session found and not forcing new, resume it
    if (!forceNew && existingSessions && existingSessions.length > 0) {
      const session = existingSessions[0];

      console.log('[onboarding/start] Resuming existing session:', session.session_id);

      // Return existing session data for resumption
      return NextResponse.json({
        success: true,
        sessionId: session.session_id,
        stageInfo: {
          currentStage: session.current_stage,
          totalStages: 7,
          stageName: getStageName(session.current_stage),
        },
        conversationContext: {
          agentPersonality: session.ai_context?.agentPersonality || {
            name: 'Alex',
            role: 'Strategic Consultant',
            tone: 'Warm yet analytical',
            expertise: 'early-stage validation and strategic planning',
          },
          userRole: 'founder',
          planType: session.plan_type,
        },
        resuming: true,
        conversationHistory: session.conversation_history || [],
        overallProgress: session.overall_progress,
        stageProgress: session.stage_progress,
        stageData: session.stage_data,
      } as any);
    }

    if (resumeSessionId) {
      console.info(
        `[onboarding/start] Received explicit resumeSessionId (${resumeSessionId}) but session not found. Creating new session.`,
      );
    }

    // Generate session ID with 'test' prefix for test users in development
    const sessionId = (isDevelopment && isTestUser)
      ? `test-${generateSessionId()}`
      : generateSessionId();
    const startedAt = new Date();

    // Initialize with default stage info (no external API call needed)
    const initialStage = {
      currentStage: 1,
      totalStages: 7,
      stageName: 'Welcome & Introduction',
      stageDescription: 'Getting to know you and your business idea',
    };

    const initialStageData = {
      brief: {},
      coverage: {
        stage_1: {
          stage: 1,
          coverage: 0,
          quality: {
            clarity: { label: 'medium' as const, score: 0.5 },
            completeness: { label: 'partial' as const, score: 0.5 },
            detail_score: 0.5,
          },
          brief_fields: [],
          updated_at: startedAt.toISOString(),
        },
      },
    };

    const aiContext = {
      persona: {
        name: 'Alex',
        role: 'Strategic Business Consultant',
        tone: 'friendly, encouraging, professionally direct',
        expertise: 'Lean Startup, Customer Development, Business Model Design',
        supervisor: 'Sage (Chief Strategy Officer)',
        team: ['Sage', 'Forge', 'Pulse', 'Compass', 'Guardian', 'Ledger'],
      },
      qualitySignals: {
        clarity: { label: 'medium' as const, score: 0.5 },
        completeness: { label: 'partial' as const, score: 0.5 },
        detail_score: 0.5,
        overall: 0.5,
      },
    };

    // Save session to database (skip for test users in development)
    if (!(isDevelopment && isTestUser)) {
      await saveOnboardingSession(supabaseClient, {
        sessionId,
        userId: effectiveUser.id as string,
        planType,
        status: 'active',
        startedAt,
        stageData: initialStageData,
        aiContext,
        stageState: initialStage,
        stageProgress: 0,
        overallProgress: 0,
        userContext,
      });
    } else {
      console.log('[onboarding/start] Skipping database save for test user in development mode');
    }

    const response: StartOnboardingResponse = {
      success: true,
      sessionId,
      agentIntroduction: `Hi there! I'm Alex, and I'm excited to help you think through your business idea using proven validation methods.

Over the next 15-20 minutes, I'll ask you questions about your customers, the problem you're solving, your solution approach, and your goals. This isn't a pitch session - it's a strategic conversation to help you identify what assumptions you need to test and what experiments you should run first.

There are no wrong answers here. In fact, "I don't know yet" is often the most honest and valuable response because it helps us identify what you need to learn.`,
      firstQuestion: `Ready to dive in? Let's start with the most important question:

**What business idea are you most excited about right now?**`,
      estimatedDuration: '15-20 minutes',
      stageInfo: initialStage,
      conversationContext: {
        agentPersonality: aiContext.persona,
        expectedOutcomes: [
          'Clear understanding of your target customer',
          'Validated problem statement',
          'Defined unique value proposition',
          'Strategic validation roadmap',
        ],
        privacyNotice: 'Your responses are confidential and used only to generate strategic recommendations.',
      },
      qualitySignals: aiContext.qualitySignals,
      stageSnapshot: initialStageData.coverage.stage_1,
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
// Helper Functions
// ============================================================================

function getStageName(stage: number): string {
  const stageNames = [
    'Welcome & Introduction',
    'Customer Segment',
    'Problem Definition',
    'Solution Concept',
    'Competitive Landscape',
    'Resources & Constraints',
    'Business Goals',
  ];
  return stageNames[stage - 1] || 'Unknown Stage';
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
