# 🔌 CrewAI Frontend Integration Specification

**Critical Backend-Frontend Bridge**

**Status:** 🔴 **MISSING** - Required for launch  
**Priority:** **P0 - LAUNCH BLOCKER**  
**Estimated Implementation:** 6-8 hours  
**Cross-Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md) - Section 2.5 Backend & AI  

---

## 📋 Document Purpose

This specification defines the API layer and integration patterns that connect the React frontend with the CrewAI backend system. Currently, all AI functionality is mocked with `setTimeout()` calls, creating a complete disconnect between marketing promises and actual AI capabilities.

**Current Reality:** Frontend shows mock AI responses with no backend integration  
**Required Solution:** Real-time API integration with CrewAI multi-agent system  
**Business Impact:** Resolves vaporware accusations and delivers promised AI functionality  

---

## 1. API Endpoints for Onboarding Agent

### 1.1 Conversation Management Endpoints

```typescript
// Initialize onboarding conversation
POST /api/onboarding/start
interface StartOnboardingRequest {
  userId: string;
  planType: 'trial' | 'founder' | 'consultant';
  resumeSessionId?: string;
}

interface StartOnboardingResponse {
  sessionId: string;
  agentIntroduction: string;
  firstQuestion: string;
  estimatedDuration: string; // "20-25 minutes"
  stageInfo: {
    currentStage: 1;
    totalStages: 7;
    stageName: "Welcome & Introduction";
  };
}
```

```typescript
// Send message and get AI response
POST /api/onboarding/message
interface SendMessageRequest {
  sessionId: string;
  userMessage: string;
  messageType: 'text' | 'voice_transcript';
  timestamp: string;
}

interface SendMessageResponse {
  agentResponse: string;
  followUpQuestion?: string;
  stageProgress: {
    currentStage: number;
    stageProgress: number; // 0-100
    overallProgress: number; // 0-100
  };
  briefUpdate: Partial<EntrepreneurBrief>;
  validationFeedback?: {
    clarity: 'high' | 'medium' | 'low';
    completeness: 'complete' | 'partial' | 'insufficient';
    suggestions: string[];
  };
  isStageComplete: boolean;
  nextStage?: StageInfo;
}
```

```typescript
// Complete onboarding and trigger full workflow
POST /api/onboarding/complete
interface CompleteOnboardingRequest {
  sessionId: string;
  finalConfirmation: boolean;
  entrepreneurBrief: EntrepreneurBrief;
}

interface CompleteOnboardingResponse {
  workflowId: string;
  workflowTriggered: boolean;
  estimatedCompletionTime: string; // "15-20 minutes"
  nextSteps: {
    step: string;
    description: string;
    estimatedTime: string;
  }[];
  dashboardRedirect: string;
}
```

### 1.2 Session Management Endpoints

```typescript
// Save conversation state
PUT /api/onboarding/session/{sessionId}
interface SaveSessionRequest {
  conversationState: ConversationState;
  entrepreneurBrief: Partial<EntrepreneurBrief>;
  lastActivity: string;
}

// Resume conversation
GET /api/onboarding/session/{sessionId}
interface ResumeSessionResponse {
  sessionExists: boolean;
  conversationState?: ConversationState;
  entrepreneurBrief?: Partial<EntrepreneurBrief>;
  canResume: boolean;
  resumeFromStage?: number;
}

// Delete/abandon session
DELETE /api/onboarding/session/{sessionId}
```

---

## 2. Streaming Conversation Responses

### 2.1 Server-Sent Events Implementation

```typescript
// Streaming endpoint for real-time AI responses
GET /api/onboarding/stream/{sessionId}

interface StreamingResponse {
  event: 'message_chunk' | 'typing_start' | 'typing_end' | 'stage_complete' | 'error';
  data: StreamingData;
  id: string;
  retry?: number;
}

interface StreamingData {
  // For message_chunk events
  chunk?: string;
  isComplete?: boolean;
  
  // For typing events
  typingDuration?: number;
  
  // For stage_complete events
  stageInfo?: StageInfo;
  
  // For error events
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}
```

### 2.2 Frontend Streaming Handler

```typescript
export const useAIStreaming = (sessionId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const eventSource = useRef<EventSource | null>(null);
  
  const connect = useCallback(() => {
    eventSource.current = new EventSource(`/api/onboarding/stream/${sessionId}`);
    
    eventSource.current.onmessage = (event) => {
      const data: StreamingResponse = JSON.parse(event.data);
      
      switch (data.event) {
        case 'typing_start':
          setIsTyping(true);
          break;
          
        case 'message_chunk':
          setCurrentMessage(prev => prev + data.data.chunk);
          break;
          
        case 'typing_end':
          setIsTyping(false);
          // Finalize message
          break;
          
        case 'error':
          handleStreamingError(data.data.error);
          break;
      }
    };
    
    eventSource.current.onerror = (error) => {
      console.error('SSE connection error:', error);
      handleConnectionError();
    };
    
    setIsConnected(true);
  }, [sessionId]);
  
  return { connect, disconnect, isConnected, currentMessage, isTyping };
};
```

---

## 3. Progress Tracking for 6-Agent Workflow

### 3.1 Workflow Progress API

```typescript
// Get current workflow status
GET /api/crewai/workflow/{workflowId}/status

interface WorkflowStatusResponse {
  workflowId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  currentAgent: {
    name: string;
    role: string;
    progress: number; // 0-100
    estimatedTimeRemaining: string;
  };
  overallProgress: {
    completedAgents: number;
    totalAgents: 6;
    overallProgress: number; // 0-100
    estimatedTimeRemaining: string;
  };
  agentResults: AgentResult[];
}

interface AgentResult {
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  completionTime?: string;
  output?: {
    structured: any; // JSON output
    narrative: string; // Markdown summary
    quality: QualityMetrics;
  };
}
```

### 3.2 Real-Time Progress Updates

```typescript
// WebSocket connection for live progress updates
const useWorkflowProgress = (workflowId: string) => {
  const [progress, setProgress] = useState<WorkflowProgress | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket(`/api/crewai/workflow/${workflowId}/progress`);
    
    ws.onmessage = (event) => {
      const update: WorkflowProgressUpdate = JSON.parse(event.data);
      setProgress(update.progress);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Fallback to polling
      startPolling();
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [workflowId]);
  
  return { progress, isConnected: socket?.readyState === WebSocket.OPEN };
};
```

---

## 4. Result Display and Storage

### 4.1 Results Retrieval API

```typescript
// Get completed workflow results
GET /api/crewai/workflow/{workflowId}/results

interface WorkflowResults {
  workflowId: string;
  completionTime: string;
  executionDuration: string;
  
  // Individual agent outputs
  agentOutputs: {
    onboardingAgent: EntrepreneurBrief;
    customerResearcher: CustomerProfile;
    competitorAnalyst: CompetitorAnalysis;
    valueDesigner: ValuePropositionCanvas;
    validationAgent: ValidationRoadmap;
    qaAgent: QualityAuditReport;
  };
  
  // Consolidated deliverables
  deliverables: {
    executiveSummary: string;
    strategicRecommendations: string[];
    validationPlan: ValidationPlan;
    businessModelCanvas: BusinessModelCanvas;
    nextSteps: ActionItem[];
  };
  
  // Quality metrics
  qualityMetrics: {
    overallScore: number; // 0-100
    completeness: number;
    consistency: number;
    actionability: number;
  };
}
```

### 4.2 Results Storage Integration

```typescript
// Save results to user's project
POST /api/projects/{projectId}/analysis-results

interface SaveResultsRequest {
  workflowId: string;
  results: WorkflowResults;
  projectMetadata: {
    name: string;
    description: string;
    stage: 'idea' | 'validation' | 'scaling';
  };
}

// Database schema updates needed
interface ProjectAnalysisResults {
  id: string;
  project_id: string;
  workflow_id: string;
  analysis_type: 'onboarding' | 'deep_dive' | 'validation_update';
  results_data: WorkflowResults;
  created_at: string;
  updated_at: string;
}
```

---

## 5. Error Handling and Retry Logic

### 5.1 Error Classification System

```typescript
interface ErrorClassification {
  // Network errors
  networkErrors: {
    timeout: 'retry_with_backoff';
    connectionLost: 'queue_and_retry';
    serverUnavailable: 'fallback_mode';
  };
  
  // AI service errors
  aiServiceErrors: {
    rateLimited: 'exponential_backoff';
    modelUnavailable: 'fallback_model';
    contextTooLong: 'truncate_and_retry';
    invalidResponse: 'regenerate_response';
  };
  
  // Business logic errors
  businessErrors: {
    invalidInput: 'user_correction_required';
    incompleteData: 'request_additional_info';
    conflictingData: 'clarification_needed';
  };
  
  // System errors
  systemErrors: {
    databaseError: 'retry_with_fallback';
    authenticationError: 'reauthenticate';
    quotaExceeded: 'upgrade_prompt';
  };
}
```

### 5.2 Retry Logic Implementation

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxRetries) {
        throw lastError;
      }
      
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );
      
      const jitteredDelay = config.jitter 
        ? delay + Math.random() * 1000 
        : delay;
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError!;
};
```

### 5.3 Graceful Degradation

```typescript
interface FallbackStrategies {
  // AI service unavailable
  aiServiceDown: {
    strategy: 'structured_form_mode';
    implementation: 'show_traditional_form';
    dataCollection: 'manual_input_with_guidance';
    userCommunication: 'explain_temporary_limitation';
  };
  
  // Partial service availability
  partialService: {
    strategy: 'hybrid_mode';
    implementation: 'ai_where_available_forms_elsewhere';
    gracefulTransition: 'seamless_mode_switching';
  };
  
  // Network connectivity issues
  offlineMode: {
    strategy: 'local_storage_queue';
    implementation: 'queue_requests_sync_later';
    userExperience: 'offline_indicator_with_sync_status';
  };
}
```

---

## 6. Frontend Integration Patterns

### 6.1 React Query Integration

```typescript
// API client setup
export const apiClient = {
  onboarding: {
    start: (request: StartOnboardingRequest) => 
      withRetry(() => fetch('/api/onboarding/start', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
      })),
    
    sendMessage: (request: SendMessageRequest) =>
      withRetry(() => fetch('/api/onboarding/message', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
      })),
    
    complete: (request: CompleteOnboardingRequest) =>
      withRetry(() => fetch('/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
      }))
  }
};

// React Query hooks
export const useStartOnboarding = () => {
  return useMutation({
    mutationFn: apiClient.onboarding.start,
    onError: (error) => {
      console.error('Failed to start onboarding:', error);
      // Handle error appropriately
    }
  });
};

export const useSendMessage = () => {
  return useMutation({
    mutationFn: apiClient.onboarding.sendMessage,
    onError: (error) => {
      console.error('Failed to send message:', error);
      // Handle error appropriately
    }
  });
};
```

### 6.2 State Management Integration

```typescript
// Zustand store for onboarding state
interface OnboardingStore {
  // Session state
  sessionId: string | null;
  isActive: boolean;
  
  // Conversation state
  messages: ConversationMessage[];
  currentStage: number;
  overallProgress: number;
  
  // Data collection
  entrepreneurBrief: Partial<EntrepreneurBrief>;
  
  // UI state
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  
  // Actions
  startSession: (userId: string, planType: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetSession: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // Initial state
  sessionId: null,
  isActive: false,
  messages: [],
  currentStage: 0,
  overallProgress: 0,
  entrepreneurBrief: {},
  isLoading: false,
  isTyping: false,
  error: null,
  
  // Actions implementation
  startSession: async (userId, planType) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiClient.onboarding.start({ userId, planType });
      const data = await response.json();
      
      set({
        sessionId: data.sessionId,
        isActive: true,
        messages: [{
          id: generateId(),
          type: 'ai',
          content: data.agentIntroduction,
          timestamp: new Date().toISOString()
        }],
        currentStage: 1,
        isLoading: false
      });
    } catch (error) {
      set({ error: 'Failed to start onboarding session', isLoading: false });
    }
  },
  
  // Additional actions...
}));
```

---

## 7. Performance Optimization

### 7.1 Caching Strategy

```typescript
interface CachingStrategy {
  // API response caching
  apiCache: {
    sessionData: 'memory_cache_5_minutes';
    agentResponses: 'no_cache'; // Always fresh AI responses
    workflowResults: 'persistent_cache_24_hours';
  };
  
  // Static asset caching
  staticAssets: {
    agentAvatars: 'browser_cache_1_week';
    uiComponents: 'service_worker_cache';
    conversationTemplates: 'memory_cache_1_hour';
  };
  
  // Database query optimization
  databaseCache: {
    userProfiles: 'redis_cache_15_minutes';
    projectData: 'application_cache_5_minutes';
    workflowTemplates: 'persistent_cache_1_hour';
  };
}
```

### 7.2 Bundle Optimization

```typescript
// Code splitting for onboarding components
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const ConversationInterface = lazy(() => import('./components/ConversationInterface'));
const WorkflowProgress = lazy(() => import('./components/WorkflowProgress'));

// Preload critical components
export const preloadOnboardingComponents = () => {
  import('./pages/OnboardingPage');
  import('./components/ConversationInterface');
};
```

---

## 8. Security Considerations

### 8.1 Authentication & Authorization

```typescript
interface SecurityMeasures {
  // API authentication
  apiAuth: {
    bearerTokens: 'jwt_with_short_expiry';
    sessionValidation: 'server_side_validation';
    rateLimiting: '100_requests_per_minute_per_user';
  };
  
  // Data protection
  dataProtection: {
    inputSanitization: 'comprehensive_html_and_script_removal';
    outputValidation: 'ai_response_content_filtering';
    piiDetection: 'automatic_sensitive_data_masking';
  };
  
  // Session security
  sessionSecurity: {
    sessionTimeout: '30_minutes_inactivity';
    sessionRotation: 'new_session_per_workflow';
    crossSiteProtection: 'csrf_tokens_and_same_site_cookies';
  };
}
```

---

## 9. Cross-References

**Primary Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md)
- Section 2.5: Backend & AI (CrewAI implementation status)
- Lines 580-623: CrewAI backend status and remaining work
- Section 1.2.5: Launch readiness assessment

**Related Documentation:**
- [`onboarding-agent-integration.md`](../features/onboarding-agent-integration.md) - UI/UX requirements
- [`ai-conversation-interface.md`](../features/ai-conversation-interface.md) - Chat interface specification
- [`CREW_AI.md`](../../backend/CREW_AI.md) - Backend agent configuration

**Implementation Dependencies:**
- CrewAI backend completion (currently 15% complete)
- Netlify Functions deployment for Python backend
- WebSocket/SSE infrastructure for real-time updates
- Database schema updates for session management

---

**Status:** 🔴 **CRITICAL IMPLEMENTATION REQUIRED**  
**Next Action:** Begin API endpoint development after CrewAI backend completion  
**Owner:** Full-stack development team  
**Deadline:** Before launch (launch blocker)  
