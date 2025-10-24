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

async function processUserMessage(params: {
  sessionId: string;
  userMessage: string;
  messageType: string;
  conversationHistory: any[];
  currentStage: number;
  stageData: any;
}) {
  // This is a sophisticated AI processing simulation
  // TODO: Replace with actual CrewAI integration
  
  const { userMessage, currentStage, conversationHistory, stageData } = params;
  const stage = CONVERSATION_STAGES[currentStage as keyof typeof CONVERSATION_STAGES];
  
  // Analyze message content
  const messageLength = userMessage.length;
  const hasDetails = messageLength > 50;
  const hasSpecifics = /\b(specifically|exactly|particularly|mainly|primarily)\b/i.test(userMessage);
  
  // Calculate stage progress based on message quality and stage requirements
  let stageProgress = Math.min(100, (conversationHistory.length * 15) + (hasDetails ? 20 : 10) + (hasSpecifics ? 15 : 0));
  let overallProgress = Math.min(100, ((currentStage - 1) * 14) + (stageProgress * 0.14));
  
  // Determine if stage is complete
  const isStageComplete = stageProgress >= (stage?.progressThreshold || 75);
  const nextStage = isStageComplete && currentStage < 7 ? currentStage + 1 : currentStage;
  
  // Generate contextual AI response
  let agentResponse = '';
  let followUpQuestion = '';
  let briefUpdate: any = {};
  
  if (currentStage === 1) {
    // Welcome & Introduction stage
    if (userMessage.toLowerCase().includes('app') || userMessage.toLowerCase().includes('software')) {
      agentResponse = "A software solution - that's exciting! The digital space offers incredible opportunities for scalability and impact. ";
      briefUpdate.business_stage = 'idea';
      briefUpdate.solution_type = 'software';
    } else if (userMessage.toLowerCase().includes('service') || userMessage.toLowerCase().includes('consulting')) {
      agentResponse = "A service-based business can be a great way to start with lower upfront costs and direct customer feedback. ";
      briefUpdate.business_stage = 'idea';
      briefUpdate.solution_type = 'service';
    } else {
      agentResponse = "Thank you for sharing that with me! I can hear the passion in your description. ";
    }
    
    if (isStageComplete) {
      agentResponse += "Now that I understand your core concept, let's dive deeper into who this would serve. ";
      followUpQuestion = "Who do you envision as your ideal customer? Think about the specific type of person or business that would get the most value from what you're creating.";
    } else {
      followUpQuestion = "Can you tell me more about what inspired this idea? What problem or opportunity did you notice that led you here?";
    }
  } else if (currentStage === 2) {
    // Customer Discovery stage
    if (userMessage.toLowerCase().includes('business') || userMessage.toLowerCase().includes('company')) {
      agentResponse = "B2B customers can be fantastic - they often have bigger budgets and longer-term relationships. ";
      briefUpdate.customer_type = 'b2b';
    } else if (userMessage.toLowerCase().includes('people') || userMessage.toLowerCase().includes('individual')) {
      agentResponse = "Consumer markets offer great opportunities for scale and direct impact. ";
      briefUpdate.customer_type = 'b2c';
    }
    
    agentResponse += "Understanding your customers deeply is crucial for success. ";
    
    if (isStageComplete) {
      followUpQuestion = "Perfect! Now let's get specific about the problem you're solving. What exact pain point or challenge do these customers face that your solution addresses?";
    } else {
      followUpQuestion = "Can you be more specific about this customer segment? What characteristics do they share? What's their situation that makes them need your solution?";
    }
  } else if (currentStage === 3) {
    // Problem Definition stage
    const painWords = ['painful', 'frustrating', 'difficult', 'expensive', 'time-consuming', 'annoying'];
    const hasPainLanguage = painWords.some(word => userMessage.toLowerCase().includes(word));
    
    if (hasPainLanguage) {
      agentResponse = "I can tell this is a real pain point - that emotional language tells me customers would be motivated to find a solution. ";
      briefUpdate.problem_pain_level = 8;
    } else {
      agentResponse = "Thanks for explaining that. Understanding the problem clearly is essential for building the right solution. ";
      briefUpdate.problem_pain_level = 6;
    }
    
    briefUpdate.problem_description = userMessage.substring(0, 500); // Store first 500 chars
    
    if (isStageComplete) {
      followUpQuestion = "Excellent! Now I'd love to understand your solution. How exactly do you plan to solve this problem? What's your approach?";
    } else {
      followUpQuestion = "Help me understand the impact of this problem. How often do your customers encounter it, and what does it cost them when they do?";
    }
  } else if (currentStage === 4) {
    // Solution Validation stage
    briefUpdate.solution_description = userMessage.substring(0, 500);
    
    if (userMessage.toLowerCase().includes('unique') || userMessage.toLowerCase().includes('different')) {
      agentResponse = "I love that you're thinking about differentiation! That's what will make customers choose you over alternatives. ";
    } else {
      agentResponse = "That's a solid approach to solving the problem. ";
    }
    
    if (isStageComplete) {
      followUpQuestion = "Great solution! Now let's look at the competitive landscape. Who else is trying to solve this problem, and how are customers handling it today?";
    } else {
      followUpQuestion = "What makes your solution unique? Why would customers choose your approach over other ways of solving this problem?";
    }
  } else if (currentStage === 5) {
    // Competitive Analysis stage
    agentResponse = "Understanding the competition helps you position yourself effectively and identify opportunities. ";
    
    if (userMessage.toLowerCase().includes('no competition') || userMessage.toLowerCase().includes('no one else')) {
      agentResponse += "While it might seem like there's no direct competition, customers are always solving this problem somehow - even if it's manual processes or workarounds. ";
    }
    
    if (isStageComplete) {
      followUpQuestion = "Perfect! Now let's talk resources. What's your budget range for getting this business started, and what skills or assets do you already have?";
    } else {
      followUpQuestion = "What would convince a customer to switch from their current solution to yours? What's the compelling reason to change?";
    }
  } else if (currentStage === 6) {
    // Resources & Constraints stage
    if (userMessage.match(/\$[\d,]+/) || userMessage.toLowerCase().includes('thousand') || userMessage.toLowerCase().includes('budget')) {
      agentResponse = "Having a clear budget helps with planning and prioritization. ";
      briefUpdate.budget_range = userMessage.match(/\$[\d,]+/)?.[0] || 'specified';
    }
    
    agentResponse += "Understanding your resources helps us create a realistic roadmap. ";
    
    if (isStageComplete) {
      followUpQuestion = "Excellent! For our final topic, let's set some strategic goals. What do you want to achieve with this business in the next 3 months?";
    } else {
      followUpQuestion = "What skills, connections, or assets do you already have that could help with this business? And what are your biggest constraints or limitations?";
    }
  } else if (currentStage === 7) {
    // Goals & Next Steps stage
    agentResponse = "Setting clear, measurable goals is crucial for making progress and staying motivated. ";
    briefUpdate.three_month_goals = [userMessage.substring(0, 200)];
    
    if (isStageComplete) {
      agentResponse += "Fantastic! We've covered all the key areas. I have everything I need to create your comprehensive strategic analysis. ";
      followUpQuestion = "Before I generate your personalized strategic report, is there anything else about your business idea that you think is important for me to know?";
    } else {
      followUpQuestion = "How will you measure success? What specific metrics or milestones will tell you that you're making progress?";
    }
  }
  
  // Generate validation feedback
  const clarity = hasDetails ? (hasSpecifics ? 'high' : 'medium') : 'low';
  const completeness = isStageComplete ? 'complete' : (stageProgress > 50 ? 'partial' : 'insufficient');
  
  const validationFeedback = {
    clarity: clarity as 'high' | 'medium' | 'low',
    completeness: completeness as 'complete' | 'partial' | 'insufficient',
    suggestions: [] as string[],
    encouragement: "You're making great progress! Your insights are helping build a comprehensive picture of your business opportunity.",
  };
  
  if (!hasDetails) {
    validationFeedback.suggestions.push("Try to provide more specific details to help me understand your situation better.");
  }
  
  if (stageProgress < 50) {
    validationFeedback.suggestions.push("Consider sharing examples or specific scenarios to illustrate your points.");
  }
  
  return {
    response: agentResponse,
    followUpQuestion: isStageComplete && nextStage > currentStage ? '' : followUpQuestion,
    stageProgress: {
      currentStage: nextStage,
      stageProgress: nextStage > currentStage ? 0 : stageProgress,
      overallProgress,
      nextStageName: nextStage < 7 ? CONVERSATION_STAGES[(nextStage + 1) as keyof typeof CONVERSATION_STAGES]?.name : undefined,
    },
    briefUpdate,
    validationFeedback,
    conversationState: {
      isStageComplete,
      canAdvanceStage: isStageComplete && currentStage < 7,
      requiredDataMissing: stageProgress < 50 ? ['more_details'] : [],
      nextStage: nextStage > currentStage ? CONVERSATION_STAGES[nextStage as keyof typeof CONVERSATION_STAGES] : undefined,
    },
    systemActions: {
      triggerWorkflow: currentStage === 7 && isStageComplete,
      saveCheckpoint: isStageComplete,
      requestClarification: stageProgress < 30,
    },
    newStage: nextStage > currentStage ? nextStage : undefined,
  };
}

async function updateOnboardingSession(
  client: SupabaseClient,
  sessionId: string,
  updates: {
    conversationHistory: any[];
    currentStage: number;
    stageData: any;
    lastActivity: Date;
  },
) {
  try {
    const { data, error } = await client
      .from('onboarding_sessions')
      .update({
        conversation_history: updates.conversationHistory,
        current_stage: updates.currentStage,
        stage_data: updates.stageData,
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
    const { sessionId, userMessage, messageType, timestamp, messageId, conversationContext }: SendMessageRequest = body;

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
            code: 'INVALID_SESSION',
            message: 'User session is required',
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

    // Validate required fields
    if (!sessionId || !userMessage || !messageId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: sessionId, userMessage, messageId',
          retryable: false,
        },
      } as MessageError, { status: 400 });
    }

    // Validate session
    const session = await getOnboardingSession(supabaseClient, sessionId, user.id);
    if (!session || session.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Session not found, expired, or inactive',
          retryable: false,
        },
      } as MessageError, { status: 404 });
    }

    // Check for duplicate message
    const isDuplicate = await checkDuplicateMessage(supabaseClient, sessionId, messageId);
    if (isDuplicate) {
      const cachedResponse = await getCachedResponse(sessionId, messageId);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Process message with AI agent
    const agentResponse = await processUserMessage({
      sessionId,
      userMessage,
      messageType: messageType || 'text',
      conversationHistory: session.conversation_history || [],
      currentStage: session.current_stage || 1,
      stageData: session.stage_data || {},
    });
    
    // Update conversation history
    const newConversationEntry = {
      messageId,
      userMessage,
      agentResponse: agentResponse.response,
      timestamp: timestamp || new Date().toISOString(),
      stage: session.current_stage,
      messageType: messageType || 'text',
    };

    const updatedHistory = [...(session.conversation_history || []), newConversationEntry];
    const updatedStageData = { ...(session.stage_data || {}), ...agentResponse.briefUpdate };
    
    // Update session state
    await updateOnboardingSession(supabaseClient, sessionId, {
      conversationHistory: updatedHistory,
      currentStage: agentResponse.newStage || session.current_stage,
      stageData: updatedStageData,
      lastActivity: new Date(),
    });
    
    // Prepare response
    const response: SendMessageResponse = {
      success: true,
      messageId: generateResponseId(),
      agentResponse: agentResponse.response,
      followUpQuestion: agentResponse.followUpQuestion,
      stageProgress: agentResponse.stageProgress,
      briefUpdate: agentResponse.briefUpdate,
      validationFeedback: agentResponse.validationFeedback,
      conversationState: agentResponse.conversationState,
      systemActions: agentResponse.systemActions,
    };
    
    // Cache response for deduplication
    await cacheResponse(sessionId, messageId, response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Message processing error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Unable to process message. Please try again.',
        retryable: true,
      },
    } as MessageError, { status: 500 });
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
