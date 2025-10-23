# 🤖 AI Conversation Interface Specification

**Critical Component for Onboarding Agent Integration**

**Status:** 🔴 **MISSING** - Required for launch  
**Priority:** **P0 - LAUNCH BLOCKER**  
**Estimated Implementation:** 4-6 hours  
**Cross-Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md) - Section 2.5 Backend & AI  

---

## 📋 Document Purpose

This specification defines the chat-like interface that enables real-time conversation between users and the CrewAI onboarding_agent. This interface is the primary user touchpoint for the AI-guided onboarding experience that marketing promises but currently doesn't exist.

**Marketing Promise:** "AI-powered strategic analysis" with conversational guidance  
**Current Reality:** No conversation interface exists  
**Required Solution:** Real-time chat interface with CrewAI integration  

---

## 1. Chat-Like Interface Design

### 1.1 Visual Layout Structure

```typescript
interface ConversationInterface {
  layout: {
    messageArea: MessageDisplayArea;
    inputArea: MessageInputArea;
    statusArea: ConversationStatusArea;
  };
  
  styling: {
    theme: 'professional' | 'friendly' | 'minimal';
    colorScheme: 'light' | 'dark' | 'auto';
    accessibility: AccessibilityOptions;
  };
}
```

### 1.2 Message Display Components

**Message Types:**
```typescript
interface MessageTypes {
  aiMessage: {
    avatar: AIAgentAvatar;
    content: FormattedContent;
    timestamp: string;
    actions?: MessageAction[];
  };
  
  userMessage: {
    content: string;
    timestamp: string;
    status: 'sending' | 'sent' | 'received';
  };
  
  systemMessage: {
    type: 'progress' | 'error' | 'milestone';
    content: string;
    priority: 'low' | 'medium' | 'high';
  };
}
```

**Visual Design:**
- AI messages: Left-aligned with agent avatar and branded styling
- User messages: Right-aligned with user avatar/initials
- System messages: Center-aligned with distinct styling
- Typing indicators: Animated dots showing AI processing
- Message timestamps: Subtle, accessible format

### 1.3 Input Interface Components

```typescript
interface MessageInputArea {
  textInput: {
    multiline: boolean; // Support for longer responses
    placeholder: string; // Context-aware prompts
    maxLength: number; // 2000 characters
    validation: InputValidation;
  };
  
  voiceInput: {
    enabled: boolean;
    speechToText: SpeechRecognitionConfig;
    visualFeedback: VoiceInputIndicator;
  };
  
  controls: {
    sendButton: SendButtonConfig;
    voiceButton: VoiceButtonConfig;
    helpButton: HelpButtonConfig;
  };
}
```

---

## 2. Question Sequencing Logic

### 2.1 Conversation Flow Management

```typescript
interface ConversationFlow {
  currentStage: ConversationStage;
  questionQueue: Question[];
  responseHistory: UserResponse[];
  
  // Dynamic question selection
  nextQuestion: () => Question;
  validateResponse: (response: string) => ValidationResult;
  adaptToResponse: (response: UserResponse) => ConversationAdjustment;
}

interface Question {
  id: string;
  stage: ConversationStage;
  text: string;
  type: 'open_ended' | 'multiple_choice' | 'numeric' | 'confirmation';
  required: boolean;
  followUpLogic: FollowUpRule[];
  examples?: string[];
  helpText?: string;
}
```

### 2.2 Adaptive Questioning System

**Response Analysis:**
```typescript
interface ResponseAnalysis {
  clarity: 'high' | 'medium' | 'low';
  completeness: 'complete' | 'partial' | 'insufficient';
  confidence: number; // 0-100
  
  // Triggers for follow-up questions
  needsClarification: boolean;
  needsExpansion: boolean;
  needsValidation: boolean;
}
```

**Follow-Up Logic:**
- Unclear responses → Clarifying questions with examples
- Incomplete responses → Gentle prompts for more detail
- Contradictory responses → Validation and conflict resolution
- Excellent responses → Acknowledgment and progression

---

## 3. Input Validation and Sanitization

### 3.1 Real-Time Validation

```typescript
interface InputValidation {
  // Content validation
  contentRules: {
    minLength: number; // 10 characters minimum
    maxLength: number; // 2000 characters maximum
    requiredElements: string[]; // Stage-specific requirements
    forbiddenContent: string[]; // Spam, inappropriate content
  };
  
  // Format validation
  formatRules: {
    allowedCharacters: RegExp;
    htmlSanitization: boolean;
    linkDetection: boolean;
    emailDetection: boolean;
  };
  
  // Business logic validation
  businessRules: {
    customerSegmentValidation: CustomerSegmentRules;
    budgetValidation: BudgetRules;
    timelineValidation: TimelineRules;
  };
}
```

### 3.2 Sanitization Pipeline

```typescript
interface SanitizationPipeline {
  steps: [
    'html_strip',           // Remove HTML tags
    'script_removal',       // Remove script content
    'link_validation',      // Validate and sanitize URLs
    'profanity_filter',     // Content appropriateness
    'business_validation'   // Business logic checks
  ];
  
  output: {
    sanitizedContent: string;
    validationWarnings: ValidationWarning[];
    securityFlags: SecurityFlag[];
  };
}
```

---

## 4. Real-Time AI Response Handling

### 4.1 Streaming Response System

```typescript
interface StreamingResponse {
  // Server-Sent Events configuration
  sseEndpoint: '/api/onboarding/stream';
  
  // Response streaming
  responseStream: {
    chunkSize: number; // 50-100 characters per chunk
    delay: number; // 50ms between chunks for natural typing
    bufferManagement: BufferConfig;
  };
  
  // UI updates
  typingIndicator: {
    show: () => void;
    hide: () => void;
    duration: number; // Max 5 seconds
  };
  
  // Error handling
  streamError: {
    timeout: number; // 30 seconds
    retryLogic: RetryConfig;
    fallbackResponse: string;
  };
}
```

### 4.2 Response Processing

```typescript
interface ResponseProcessor {
  // AI response parsing
  parseResponse: (rawResponse: string) => ParsedResponse;
  
  // Content formatting
  formatContent: (content: string) => FormattedContent;
  
  // Action extraction
  extractActions: (response: ParsedResponse) => MessageAction[];
  
  // Progress updates
  updateProgress: (response: ParsedResponse) => ProgressUpdate;
}

interface ParsedResponse {
  mainContent: string;
  followUpQuestion?: string;
  progressUpdate?: ProgressInfo;
  validationFeedback?: ValidationFeedback;
  nextStageTransition?: StageTransition;
}
```

---

## 5. Conversation State Management

### 5.1 State Architecture

```typescript
interface ConversationState {
  // Session management
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  
  // Conversation data
  messages: ConversationMessage[];
  currentStage: ConversationStage;
  entrepreneurBrief: Partial<EntrepreneurBrief>;
  
  // UI state
  isTyping: boolean;
  isProcessing: boolean;
  hasErrors: boolean;
  
  // Persistence
  autoSave: boolean;
  lastSaved: Date;
  isDirty: boolean;
}
```

### 5.2 State Persistence Strategy

```typescript
interface StatePersistence {
  // Local storage (immediate)
  localStorage: {
    key: `onboarding_${sessionId}`;
    saveInterval: 30000; // 30 seconds
    maxAge: 86400000; // 24 hours
  };
  
  // Database persistence (periodic)
  database: {
    table: 'onboarding_sessions';
    saveInterval: 120000; // 2 minutes
    fields: DatabaseFields;
  };
  
  // Recovery mechanisms
  recovery: {
    autoRestore: boolean;
    conflictResolution: 'local_wins' | 'server_wins' | 'user_choice';
    backupStrategy: BackupConfig;
  };
}
```

---

## 6. Handoff to Full CrewAI Workflow

### 6.1 Completion Detection

```typescript
interface CompletionCriteria {
  // Required data completeness
  requiredFields: {
    customerSegments: boolean;
    problemDefinition: boolean;
    solutionConcept: boolean;
    competitorAnalysis: boolean;
    resourceAssessment: boolean;
    businessStage: boolean;
  };
  
  // Quality thresholds
  qualityMetrics: {
    responseClarity: number; // Minimum 70%
    dataCompleteness: number; // Minimum 80%
    consistencyScore: number; // Minimum 75%
  };
  
  // User confirmation
  userConfirmation: {
    briefReview: boolean;
    workflowConsent: boolean;
    timeCommitment: boolean; // 15-20 minutes for full analysis
  };
}
```

### 6.2 Workflow Trigger Process

```typescript
interface WorkflowHandoff {
  // Pre-flight validation
  validation: {
    dataIntegrity: () => ValidationResult;
    userAuthentication: () => AuthResult;
    systemReadiness: () => SystemStatus;
  };
  
  // Workflow initiation
  trigger: {
    endpoint: '/api/crewai/analyze';
    payload: EntrepreneurBrief;
    priority: 'high' | 'normal';
    estimatedDuration: string;
  };
  
  // User transition
  transition: {
    loadingScreen: WorkflowLoadingScreen;
    progressTracking: WorkflowProgressTracker;
    redirectTarget: '/dashboard?workflow=active';
  };
}
```

---

## 7. Implementation Components

### 7.1 Core React Components

```typescript
// Main conversation interface
export const ConversationInterface: React.FC<ConversationProps> = ({
  sessionId,
  onComplete,
  onError
}) => {
  // Component implementation
};

// Message display components
export const MessageList: React.FC<MessageListProps>;
export const MessageBubble: React.FC<MessageBubbleProps>;
export const TypingIndicator: React.FC<TypingIndicatorProps>;

// Input components
export const MessageInput: React.FC<MessageInputProps>;
export const VoiceInput: React.FC<VoiceInputProps>;
export const SendButton: React.FC<SendButtonProps>;

// Status components
export const ConversationStatus: React.FC<StatusProps>;
export const ProgressIndicator: React.FC<ProgressProps>;
```

### 7.2 State Management Hooks

```typescript
// Conversation state management
export const useConversationState = (sessionId: string) => {
  // State management logic
};

// Message handling
export const useMessageHandler = (sessionId: string) => {
  // Message send/receive logic
};

// AI response streaming
export const useAIStreaming = (endpoint: string) => {
  // Streaming response handling
};

// Persistence management
export const usePersistence = (state: ConversationState) => {
  // Auto-save and recovery logic
};
```

---

## 8. Accessibility Implementation

### 8.1 Screen Reader Support

```typescript
interface ScreenReaderSupport {
  // Message announcements
  messageAnnouncement: {
    aiMessages: 'aria-live="polite"';
    userMessages: 'aria-live="off"'; // Don't announce user's own messages
    systemMessages: 'aria-live="assertive"';
  };
  
  // Navigation support
  keyboardNavigation: {
    messageHistory: 'arrow keys + page up/down';
    inputFocus: 'tab navigation';
    actionButtons: 'enter/space activation';
  };
  
  // Content structure
  semanticMarkup: {
    conversationRole: 'role="log"';
    messageRole: 'role="article"';
    inputRole: 'role="textbox"';
  };
}
```

### 8.2 Motor Accessibility

```typescript
interface MotorAccessibility {
  // Large click targets
  buttonSizing: {
    minSize: '44px × 44px';
    touchTargets: 'adequate spacing';
    hoverStates: 'clear visual feedback';
  };
  
  // Alternative inputs
  inputMethods: {
    voiceInput: VoiceInputConfig;
    keyboardOnly: KeyboardConfig;
    switchControl: SwitchConfig;
  };
  
  // Timing considerations
  timing: {
    noTimeouts: boolean;
    pauseCapability: boolean;
    extendedSessions: boolean;
  };
}
```

---

## 9. Performance Optimization

### 9.1 Message Rendering Optimization

```typescript
interface PerformanceOptimization {
  // Virtual scrolling for long conversations
  virtualScrolling: {
    enabled: boolean;
    itemHeight: number;
    bufferSize: number;
  };
  
  // Message caching
  messageCaching: {
    maxCachedMessages: 100;
    cacheStrategy: 'LRU';
    persistentCache: boolean;
  };
  
  // Lazy loading
  lazyLoading: {
    images: boolean;
    attachments: boolean;
    historicalMessages: boolean;
  };
}
```

### 9.2 Network Optimization

```typescript
interface NetworkOptimization {
  // Request batching
  requestBatching: {
    enabled: boolean;
    batchSize: number;
    maxWaitTime: number;
  };
  
  // Caching strategy
  caching: {
    responseCache: CacheConfig;
    staticAssets: AssetCacheConfig;
    apiResponses: APIResponseCache;
  };
  
  // Offline support
  offlineSupport: {
    serviceWorker: boolean;
    offlineQueue: boolean;
    syncOnReconnect: boolean;
  };
}
```

---

## 10. Cross-References

**Primary Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md)
- Section 2.5: Backend & AI (CrewAI integration requirements)
- Lines 296-299: AI visibility and processing states
- Section 1.2.5: Launch readiness assessment

**Related Documentation:**
- [`onboarding-agent-integration.md`](./onboarding-agent-integration.md) - Parent specification
- [`crewai-frontend-integration.md`](../engineering/crewai-frontend-integration.md) - API integration details
- [`onboarding-journey-map.md`](../user-experience/onboarding-journey-map.md) - User experience flow

**Implementation Dependencies:**
- CrewAI backend (currently 15% complete)
- Real-time messaging infrastructure
- Voice input capabilities (optional Phase 2)
- Accessibility testing framework

---

**Status:** 🔴 **CRITICAL IMPLEMENTATION REQUIRED**  
**Next Action:** Begin component development after onboarding page structure  
**Owner:** Frontend development team  
**Deadline:** Before launch (launch blocker)  
