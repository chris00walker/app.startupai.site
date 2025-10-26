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

interface StartOnboardingResponse {
  success: boolean;
  sessionId: string;
  agentIntroduction: string;
  firstQuestion: string;
  estimatedDuration: string;
  stageInfo: {
    currentStage: 1;
    totalStages: 7;
    stageName: string;
    stageDescription: string;
  };
  conversationContext: {
    agentPersonality: any;
    expectedOutcomes: string[];
    privacyNotice: string;
  };
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

async function initializeOnboardingAgent(params: {
  sessionId: string;
  userId: string;
  planType: string;
  userContext?: any;
}) {
  // For now, return a structured response
  // TODO: Replace with actual CrewAI integration
  const agentPersonalities = {
    trial: {
      name: 'Alex',
      role: 'Strategic Consultant',
      tone: 'encouraging and supportive',
      expertise: 'early-stage validation',
    },
    sprint: {
      name: 'Jordan',
      role: 'Business Strategist',
      tone: 'focused and analytical',
      expertise: 'rapid validation and testing',
    },
    founder: {
      name: 'Morgan',
      role: 'Senior Strategy Advisor',
      tone: 'experienced and insightful',
      expertise: 'scaling and growth strategies',
    },
    enterprise: {
      name: 'Taylor',
      role: 'Executive Consultant',
      tone: 'sophisticated and comprehensive',
      expertise: 'enterprise-level strategic planning',
    },
  };
  
  const personality = agentPersonalities[params.planType as keyof typeof agentPersonalities] || agentPersonalities.trial;
  
  return {
    introduction: `Hi! I'm ${personality.name}, your ${personality.role}. I'm here to help you develop a comprehensive strategic analysis of your business idea. I'll guide you through a structured conversation to understand your vision, validate your assumptions, and create actionable insights.`,
    firstQuestion: "Let's start with the big picture. What's the business idea or opportunity you're most excited about right now? Don't worry about having all the details figured out - I'm here to help you think through everything systematically.",
    initialState: {
      agentPersonality: personality,
      conversationPhase: 'introduction',
      dataCollectionGoals: [
        'Understand core business concept',
        'Identify target customer segments',
        'Define problem and solution fit',
        'Assess competitive landscape',
        'Evaluate resources and constraints',
        'Set strategic goals and metrics',
      ],
    },
    context: {
      agentPersonality: personality,
      expectedOutcomes: [
        'Comprehensive entrepreneur brief',
        'Strategic recommendations',
        'Validation plan with specific next steps',
        'Business model canvas',
        'Competitive analysis',
        'Resource allocation strategy',
      ],
      privacyNotice: 'Your conversation is private and secure. All information shared will be used solely to provide personalized strategic guidance and will not be shared with third parties.',
    },
  };
}

async function saveOnboardingSession(
  client: SupabaseClient,
  sessionData: {
    sessionId: string;
    userId: string;
    planType: string;
    status: string;
    startedAt: Date;
    agentState: any;
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
        current_stage: 1,
        stage_progress: 0,
        overall_progress: 0,
        conversation_history: [],
        stage_data: {},
        ai_context: sessionData.agentState,
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
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

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

    let supabaseClient: SupabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn(
        '[onboarding/start] SUPABASE_SERVICE_ROLE_KEY unavailable, falling back to user-scoped client.',
      );
      supabaseClient = sessionClient;
    }

    const allowedPlans = new Set<StartOnboardingRequest['planType']>([
      'trial',
      'sprint',
      'founder',
      'enterprise',
    ]);

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

    const agentResponse = await initializeOnboardingAgent({
      sessionId,
      userId: user.id,
      planType,
      userContext,
    });

    await saveOnboardingSession(supabaseClient, {
      sessionId,
      userId: user.id,
      planType,
      status: 'active',
      startedAt,
      agentState: agentResponse.initialState,
      userContext,
    });

    const response: StartOnboardingResponse = {
      success: true,
      sessionId,
      agentIntroduction: agentResponse.introduction,
      firstQuestion: agentResponse.firstQuestion,
      estimatedDuration: '20-25 minutes',
      stageInfo: {
        currentStage: 1,
        totalStages: 7,
        stageName: 'Welcome & Introduction',
        stageDescription: 'Getting to know you and your business idea',
      },
      conversationContext: agentResponse.context,
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
