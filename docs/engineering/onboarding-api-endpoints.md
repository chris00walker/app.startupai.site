# 🔌 Onboarding Agent API Integration Plan

**API Endpoint Implementation Specification**

**Status:** 🔴 **MISSING** - Required for launch  
**Priority:** **P0 - LAUNCH BLOCKER**  
**Estimated Implementation:** 4-6 hours  
**Cross-Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md) - Section 2.5 Backend & AI  

---

## 📋 Document Purpose

This document specifies the API endpoints required to integrate the CrewAI onboarding_agent with the frontend conversation interface. These endpoints bridge the gap between marketing promises and actual AI functionality by enabling real-time conversation with the AI consultant.

**Current Gap:** Frontend uses `setTimeout()` mocks instead of real AI  
**Required Solution:** Production-ready API endpoints with CrewAI integration  
**Business Impact:** Delivers promised AI-guided onboarding experience  

---

## 1. API Endpoint Specifications

### 1.1 Initialize Conversation Endpoint

```typescript
POST /api/onboarding/start

// Request payload
interface StartOnboardingRequest {
  userId: string;
  planType: 'trial' | 'sprint' | 'founder' | 'enterprise';
  resumeSessionId?: string; // Optional: resume existing session
  userContext?: {
    referralSource?: string;
    previousExperience?: 'first_time' | 'experienced' | 'serial_entrepreneur';
    timeAvailable?: number; // minutes available for conversation
  };
}

// Response payload
interface StartOnboardingResponse {
  success: boolean;
  sessionId: string;
  agentIntroduction: string;
  firstQuestion: string;
  estimatedDuration: string; // "20-25 minutes"
  stageInfo: {
    currentStage: 1;
    totalStages: 7;
    stageName: "Welcome & Introduction";
    stageDescription: string;
  };
  conversationContext: {
    agentPersonality: AgentPersonality;
    expectedOutcomes: string[];
    privacyNotice: string;
  };
}

// Error responses
interface StartOnboardingError {
  success: false;
  error: {
    code: 'USER_NOT_FOUND' | 'INVALID_PLAN' | 'SESSION_LIMIT_EXCEEDED' | 'AI_SERVICE_UNAVAILABLE';
    message: string;
    retryable: boolean;
    fallbackOptions?: FallbackOption[];
  };
}
```

**Implementation Details:**
```typescript
// /app/api/onboarding/start/route.ts
export async function POST(request: Request) {
  try {
    const { userId, planType, resumeSessionId, userContext } = await request.json();
    
    // Validate user authentication
    const user = await validateUser(userId);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'USER_NOT_FOUND', message: 'User not authenticated' } 
      }, { status: 401 });
    }
    
    // Check plan-specific limits (all tiers have onboarding access)
    const canStart = await checkPlanLimits(userId, planType);
    if (!canStart.allowed) {
      return NextResponse.json({
        success: false,
        error: { 
          code: canStart.reason || 'SESSION_LIMIT_EXCEEDED', 
          message: canStart.message || 'Plan limit reached',
          fallbackOptions: canStart.fallbackOptions || ['upgrade_plan', 'contact_support']
        }
      }, { status: 403 });
    }
    
    // Initialize CrewAI onboarding agent
    const sessionId = generateSessionId();
    const agentResponse = await initializeOnboardingAgent({
      sessionId,
      userId,
      planType,
      userContext
    });
    
    // Save session to database
    await saveOnboardingSession({
      sessionId,
      userId,
      planType,
      status: 'active',
      startedAt: new Date(),
      agentState: agentResponse.initialState
    });
    
    return NextResponse.json({
      success: true,
      sessionId,
      agentIntroduction: agentResponse.introduction,
      firstQuestion: agentResponse.firstQuestion,
      estimatedDuration: "20-25 minutes",
      stageInfo: {
        currentStage: 1,
        totalStages: 7,
        stageName: "Welcome & Introduction",
        stageDescription: "Getting to know you and your business idea"
      },
      conversationContext: agentResponse.context
    });
    
  } catch (error) {
    console.error('Onboarding start error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'Unable to start conversation. Please try again.',
        retryable: true
      }
    }, { status: 500 });
  }
}
```

### 1.2 Send Message Endpoint

```typescript
POST /api/onboarding/message

// Request payload
interface SendMessageRequest {
  sessionId: string;
  userMessage: string;
  messageType: 'text' | 'voice_transcript';
  timestamp: string;
  messageId: string; // Client-generated for deduplication
  conversationContext?: {
    previousMessageId?: string;
    userConfidence?: 'high' | 'medium' | 'low'; // User's confidence in their response
    needsHelp?: boolean;
  };
}

// Response payload
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
  briefUpdate: Partial<EntrepreneurBrief>;
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
    nextStage?: StageInfo;
  };
  systemActions?: {
    triggerWorkflow?: boolean;
    saveCheckpoint?: boolean;
    requestClarification?: boolean;
  };
}
```

**Implementation Details:**
```typescript
// /app/api/onboarding/message/route.ts
export async function POST(request: Request) {
  try {
    const { sessionId, userMessage, messageType, timestamp, messageId, conversationContext } = await request.json();
    
    // Validate session
    const session = await getOnboardingSession(sessionId);
    if (!session || session.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_SESSION', message: 'Session not found or expired' }
      }, { status: 404 });
    }
    
    // Check for duplicate message
    const isDuplicate = await checkDuplicateMessage(sessionId, messageId);
    if (isDuplicate) {
      return getCachedResponse(sessionId, messageId);
    }
    
    // Process message with CrewAI onboarding agent
    const agentResponse = await processUserMessage({
      sessionId,
      userMessage,
      messageType,
      conversationHistory: session.conversationHistory,
      currentStage: session.currentStage,
      entrepreneurBrief: session.entrepreneurBrief
    });
    
    // Update session state
    await updateOnboardingSession(sessionId, {
      conversationHistory: [...session.conversationHistory, {
        messageId,
        userMessage,
        agentResponse: agentResponse.response,
        timestamp,
        stage: session.currentStage
      }],
      currentStage: agentResponse.newStage || session.currentStage,
      entrepreneurBrief: { ...session.entrepreneurBrief, ...agentResponse.briefUpdate },
      lastActivity: new Date()
    });
    
    // Cache response for deduplication
    await cacheResponse(sessionId, messageId, agentResponse);
    
    return NextResponse.json({
      success: true,
      messageId: generateResponseId(),
      agentResponse: agentResponse.response,
      followUpQuestion: agentResponse.followUpQuestion,
      stageProgress: agentResponse.stageProgress,
      briefUpdate: agentResponse.briefUpdate,
      validationFeedback: agentResponse.validationFeedback,
      conversationState: agentResponse.conversationState,
      systemActions: agentResponse.systemActions
    });
    
  } catch (error) {
    console.error('Message processing error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Unable to process message. Please try again.',
        retryable: true
      }
    }, { status: 500 });
  }
}
```

### 1.3 Complete Onboarding Endpoint

```typescript
POST /api/onboarding/complete

// Request payload
interface CompleteOnboardingRequest {
  sessionId: string;
  finalConfirmation: boolean;
  entrepreneurBrief: EntrepreneurBrief;
  userFeedback?: {
    conversationRating: number; // 1-5
    clarityRating: number; // 1-5
    helpfulnessRating: number; // 1-5
    comments?: string;
  };
}

// Response payload
interface CompleteOnboardingResponse {
  success: boolean;
  workflowId: string;
  workflowTriggered: boolean;
  estimatedCompletionTime: string; // "15-20 minutes"
  nextSteps: {
    step: string;
    description: string;
    estimatedTime: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  deliverables: {
    executiveSummary: string;
    strategicRecommendations: string[];
    validationPlan: ValidationPlan;
    businessModelCanvas: BusinessModelCanvas;
  };
  dashboardRedirect: string;
  projectCreated: {
    projectId: string;
    projectName: string;
    projectUrl: string;
  };
}
```

---

## 2. Streaming Response Implementation

### 2.1 Server-Sent Events Endpoint

```typescript
GET /api/onboarding/stream/{sessionId}

// SSE Event Types
interface StreamingEvent {
  event: 'typing_start' | 'typing_progress' | 'message_chunk' | 'typing_end' | 'stage_complete' | 'error';
  data: StreamingEventData;
  id: string;
  retry?: number; // Milliseconds for client retry
}

interface StreamingEventData {
  // For typing events
  typingDuration?: number;
  typingProgress?: number; // 0-100
  
  // For message chunks
  chunk?: string;
  chunkIndex?: number;
  totalChunks?: number;
  isComplete?: boolean;
  
  // For stage completion
  stageInfo?: {
    completedStage: number;
    nextStage: number;
    stageName: string;
    celebrationMessage: string;
  };
  
  // For errors
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
    retryAfter?: number;
  };
}
```

**Implementation:**
```typescript
// /app/api/onboarding/stream/[sessionId]/route.ts
export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  
  // Validate session
  const session = await getOnboardingSession(sessionId);
  if (!session) {
    return new Response('Session not found', { status: 404 });
  }
  
  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Set up SSE headers
      const encoder = new TextEncoder();
      
      const sendEvent = (event: StreamingEvent) => {
        const data = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\nid: ${event.id}\n\n`;
        controller.enqueue(encoder.encode(data));
      };
      
      // Subscribe to AI processing events
      const unsubscribe = subscribeToAIProcessing(sessionId, {
        onTypingStart: (duration) => sendEvent({
          event: 'typing_start',
          data: { typingDuration: duration },
          id: generateEventId()
        }),
        
        onMessageChunk: (chunk, index, total) => sendEvent({
          event: 'message_chunk',
          data: { chunk, chunkIndex: index, totalChunks: total },
          id: generateEventId()
        }),
        
        onTypingEnd: () => sendEvent({
          event: 'typing_end',
          data: {},
          id: generateEventId()
        }),
        
        onError: (error) => sendEvent({
          event: 'error',
          data: { error },
          id: generateEventId()
        })
      });
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}
```

---

## 3. Database Schema Updates

### 3.1 Onboarding Sessions Table

```sql
-- Create onboarding_sessions table
CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('trial', 'founder', 'consultant')),
  
  -- Session state
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'expired')),
  current_stage INTEGER NOT NULL DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 7),
  overall_progress INTEGER NOT NULL DEFAULT 0 CHECK (overall_progress BETWEEN 0 AND 100),
  
  -- Conversation data
  conversation_history JSONB NOT NULL DEFAULT '[]',
  entrepreneur_brief JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- User feedback
  user_feedback JSONB,
  
  -- Indexes
  CONSTRAINT valid_session_id CHECK (LENGTH(session_id) > 10)
);

-- Create indexes
CREATE INDEX idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_sessions_status ON onboarding_sessions(status);
CREATE INDEX idx_onboarding_sessions_expires_at ON onboarding_sessions(expires_at);
CREATE INDEX idx_onboarding_sessions_last_activity ON onboarding_sessions(last_activity);

-- Row Level Security
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own onboarding sessions" ON onboarding_sessions
  FOR ALL USING (auth.uid() = user_id);
```

### 3.2 Entrepreneur Briefs Table

```sql
-- Create entrepreneur_briefs table for structured data storage
CREATE TABLE entrepreneur_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL REFERENCES onboarding_sessions(session_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Customer segments
  customer_segments JSONB NOT NULL DEFAULT '[]',
  primary_customer_segment JSONB,
  
  -- Problem definition
  problem_description TEXT,
  problem_pain_level INTEGER CHECK (problem_pain_level BETWEEN 1 AND 10),
  problem_frequency VARCHAR(50),
  problem_impact JSONB,
  
  -- Solution concept
  solution_description TEXT,
  solution_mechanism TEXT,
  unique_value_proposition TEXT,
  differentiation_factors JSONB DEFAULT '[]',
  
  -- Competitive landscape
  competitors JSONB DEFAULT '[]',
  competitive_alternatives JSONB DEFAULT '[]',
  switching_barriers JSONB DEFAULT '[]',
  
  -- Resources and constraints
  budget_range VARCHAR(100),
  available_channels JSONB DEFAULT '[]',
  existing_assets JSONB DEFAULT '[]',
  team_capabilities JSONB DEFAULT '[]',
  
  -- Business stage and goals
  business_stage VARCHAR(50) CHECK (business_stage IN ('idea', 'validation', 'early_traction', 'scaling')),
  three_month_goals JSONB DEFAULT '[]',
  success_criteria JSONB DEFAULT '[]',
  
  -- Quality metrics
  completeness_score INTEGER CHECK (completeness_score BETWEEN 0 AND 100),
  clarity_score INTEGER CHECK (clarity_score BETWEEN 0 AND 100),
  consistency_score INTEGER CHECK (consistency_score BETWEEN 0 AND 100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_entrepreneur_briefs_user_id ON entrepreneur_briefs(user_id);
CREATE INDEX idx_entrepreneur_briefs_session_id ON entrepreneur_briefs(session_id);
CREATE INDEX idx_entrepreneur_briefs_business_stage ON entrepreneur_briefs(business_stage);

-- Row Level Security
ALTER TABLE entrepreneur_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own entrepreneur briefs" ON entrepreneur_briefs
  FOR ALL USING (auth.uid() = user_id);
```

### 3.3 Integration with Existing Projects Table

```sql
-- Add onboarding reference to existing projects table
ALTER TABLE projects ADD COLUMN onboarding_session_id VARCHAR(255) REFERENCES onboarding_sessions(session_id);
ALTER TABLE projects ADD COLUMN entrepreneur_brief_id UUID REFERENCES entrepreneur_briefs(id);

-- Create index for onboarding integration
CREATE INDEX idx_projects_onboarding_session ON projects(onboarding_session_id);
CREATE INDEX idx_projects_entrepreneur_brief ON projects(entrepreneur_brief_id);

-- Update projects table to include onboarding-derived data
ALTER TABLE projects ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN initial_analysis_workflow_id VARCHAR(255);
```

---

## 4. Error Handling and Retry Logic

### 4.1 Error Classification and Responses

```typescript
interface APIErrorHandling {
  // Client errors (4xx)
  clientErrors: {
    400: 'INVALID_REQUEST';     // Malformed request data
    401: 'UNAUTHORIZED';        // Authentication required
    403: 'FORBIDDEN';          // Plan limits exceeded
    404: 'SESSION_NOT_FOUND';  // Invalid session ID
    409: 'DUPLICATE_MESSAGE';  // Message already processed
    429: 'RATE_LIMITED';       // Too many requests
  };
  
  // Server errors (5xx)
  serverErrors: {
    500: 'INTERNAL_ERROR';        // General server error
    502: 'AI_SERVICE_UNAVAILABLE'; // CrewAI backend down
    503: 'SERVICE_UNAVAILABLE';   // Temporary unavailability
    504: 'TIMEOUT';               // Request timeout
  };
  
  // Custom business logic errors
  businessErrors: {
    'SESSION_EXPIRED': 'Session has expired, please restart';
    'INVALID_STAGE': 'Cannot process message for current conversation stage';
    'DATA_VALIDATION_FAILED': 'User response failed validation checks';
    'WORKFLOW_TRIGGER_FAILED': 'Unable to start strategic analysis workflow';
  };
}
```

### 4.2 Retry Configuration

```typescript
interface RetryConfiguration {
  // Exponential backoff settings
  retrySettings: {
    maxRetries: 3;
    baseDelay: 1000; // 1 second
    maxDelay: 10000; // 10 seconds
    backoffMultiplier: 2;
    jitter: true;
  };
  
  // Retry conditions
  retryableErrors: [
    'AI_SERVICE_UNAVAILABLE',
    'TIMEOUT',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR'
  ];
  
  // Non-retryable errors
  nonRetryableErrors: [
    'UNAUTHORIZED',
    'FORBIDDEN',
    'SESSION_NOT_FOUND',
    'INVALID_REQUEST'
  ];
}
```

---

## 5. Performance Optimization

### 5.1 Caching Strategy

```typescript
interface CachingStrategy {
  // Response caching
  responseCache: {
    sessionData: 'redis_5_minutes';
    agentResponses: 'no_cache'; // Always fresh
    validationResults: 'memory_1_minute';
  };
  
  // Database query optimization
  queryOptimization: {
    sessionLookup: 'indexed_by_session_id';
    userValidation: 'cached_user_profiles';
    conversationHistory: 'paginated_loading';
  };
  
  // AI service optimization
  aiOptimization: {
    modelWarming: 'keep_alive_during_conversations';
    responseStreaming: 'chunk_based_delivery';
    contextCaching: 'conversation_context_reuse';
  };
}
```

### 5.2 Rate Limiting

```typescript
interface RateLimiting {
  // Per-user limits
  userLimits: {
    messagesPerMinute: 30;
    sessionsPerHour: 5;
    concurrentSessions: 2;
  };
  
  // Global limits
  globalLimits: {
    totalConcurrentSessions: 100;
    aiRequestsPerSecond: 50;
    databaseConnectionPool: 20;
  };
  
  // Plan-specific limits (all tiers have onboarding access)
  planLimits: {
    trial: {
      sessionsPerMonth: 3;
      messagesPerSession: 100;
      analysisWorkflowsPerMonth: 3;
    };
    sprint: {
      sessionsPerMonth: 5;
      messagesPerSession: 150;
      analysisWorkflowsPerMonth: 5;
    };
    founder: {
      sessionsPerMonth: 15;
      messagesPerSession: 300;
      analysisWorkflowsPerMonth: 25;
    };
    enterprise: {
      sessionsPerMonth: 100;
      messagesPerSession: 1000;
      analysisWorkflowsPerMonth: 200;
    };
  };
}
```

---

## 6. Cross-References

**Primary Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md)
- Section 2.5: Backend & AI (CrewAI integration requirements)
- Lines 580-623: CrewAI backend status and API integration needs
- Section 1.2.5: Launch readiness assessment

**Related Documentation:**
- [`crewai-frontend-integration.md`](./crewai-frontend-integration.md) - Frontend integration patterns
- [`onboarding-agent-integration.md`](../features/onboarding-agent-integration.md) - UI/UX requirements
- [`ai-conversation-interface.md`](../features/ai-conversation-interface.md) - Chat interface specification

**Implementation Dependencies:**
- CrewAI backend completion (currently 15% complete)
- Database schema deployment
- Authentication system integration
- Real-time streaming infrastructure

---

**Status:** 🔴 **CRITICAL IMPLEMENTATION REQUIRED**  
**Next Action:** Begin API endpoint development after CrewAI backend completion  
**Owner:** Backend development team  
**Deadline:** Before launch (launch blocker)  
