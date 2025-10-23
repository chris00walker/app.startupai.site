# 🚀 Onboarding Agent Integration Specification

**Critical Launch Blocker Resolution**

**Status:** 🔴 **MISSING** - Required for launch  
**Priority:** **P0 - LAUNCH BLOCKER**  
**Estimated Implementation:** 8-10 hours  
**Cross-Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md) - Section 2.5 Backend & AI  

---

## 📋 Document Purpose

This specification defines the `/onboarding` page implementation that resolves the critical gap between marketing promises and product delivery. Currently, all users (Free Trial, Founder, and Consultant tiers) are redirected to a non-existent `/onboarding` page after authentication, resulting in 404 errors and complete failure of the core AI-guided experience that defines StartupAI's value proposition.

**Marketing Promise:** "AI-powered strategic analysis" with "guided idea validation" for all users  
**Current Reality:** 404 error page for all user tiers  
**Required Solution:** Universal AI-guided conversation interface powered by CrewAI onboarding_agent  

---

## 1. UI/UX Design for Guided Conversation

### 1.1 Page Layout Structure

```typescript
// /app.startupai.site/frontend/src/app/onboarding/page.tsx
interface OnboardingPageLayout {
  header: {
    progress: ProgressIndicator;
    title: "AI-Guided Strategy Session";
    subtitle: "Let's build your startup strategy together";
  };
  main: {
    conversationArea: ConversationInterface;
    sidebar: {
      briefSummary: EntrepreneurBriefSummary;
      nextSteps: NextStepsPreview;
    };
  };
  footer: {
    controls: ConversationControls;
    support: HelpAndSupport;
  };
}
```

### 1.2 Visual Design Principles

**🔗 Cross-Reference:** All design principles must conform to [`accessibility-standards.md`](../../startupai.site/docs/design/accessibility-standards.md) - WCAG 2.0, 2.1, 2.2 AA compliance requirements.

**Conversational Design (WCAG Compliant):**
- Chat-like interface with AI avatar and user messages
- Typing indicators during AI processing with `aria-live="polite"` announcements
- Message timestamps and read receipts accessible to screen readers
- Clear visual distinction between AI and user messages with proper semantic markup
- **Accessibility:** `role="log"` for conversation area, `role="article"` for individual messages

**Trust Building (Inclusive Design):**
- AI agent introduction with credentials and purpose (screen reader accessible)
- Transparent explanation of data usage and privacy (plain language, Grade 8 reading level)
- Progress indicators showing conversation completion with text alternatives
- Preview of upcoming strategic analysis workflow with clear expectations
- **Accessibility:** All trust signals available in multiple formats (visual, auditory, text)

**Accessibility-First Implementation:**
- **WCAG 2.0 Foundation:** Semantic HTML landmarks (`<main>`, `<nav>`, `<aside>`)
- **WCAG 2.1 Enhancements:** Reflow support, consistent help, input purpose identification
- **WCAG 2.2 Standards:** Focus visibility (2px minimum outline), consistent help placement
- **Screen Reader Support:** Optimized conversation flow with proper ARIA labels
- **Motor Accessibility:** Keyboard navigation, large click targets (44×44px minimum)
- **Cognitive Support:** Voice input, simple language, progress saving
- **Visual Accessibility:** High contrast mode (4.5:1 minimum), scalable text to 200%

### 1.3 Component Architecture (WCAG Compliant)

```typescript
// Component hierarchy with accessibility attributes
OnboardingPage
├── OnboardingHeader (role="banner")
│   ├── ProgressTracker (aria-label="Conversation progress: 7 stages")
│   └── SessionInfo (aria-live="polite" for time updates)
├── OnboardingMain (role="main")
│   ├── ConversationInterface (role="log", aria-label="AI conversation")
│   │   ├── InteractionModeSelector (voice/text/hybrid selection)
│   │   ├── MessageList (aria-live="polite" for new messages)
│   │   ├── TypingIndicator (aria-live="polite", "AI is typing...")
│   │   ├── MessageInput (aria-label="Type your response", maxlength="2000")
│   │   ├── VoiceInput (speech-to-text with real-time transcription)
│   │   ├── AIHelpPanel (contextual help and examples)
│   │   └── ModeToggle (switch between voice/text during conversation)
│   └── OnboardingSidebar (role="complementary")
│       ├── EntrepreneurBriefSummary (aria-live="polite" for live updates)
│       └── NextStepsPreview (aria-describedby for workflow explanation)
└── OnboardingFooter (role="contentinfo")
    ├── ConversationControls (keyboard accessible, aria-labels)
    └── PrivacyNotice (aria-expanded for collapsible content)

// Accessibility Features Integration:
// - Skip links: "Skip to conversation" | "Skip to progress"
// - Focus management: Automatic focus on message input after AI response
// - Screen reader announcements: All state changes communicated
// - Keyboard navigation: Tab order optimized for conversation flow
// - High contrast: All components support forced-colors media query
// - Multi-modal interaction: Voice, text, and hybrid modes for different abilities
// - AI help system: Contextual assistance for users who need guidance
```

**🔗 Implementation References:** 
- **Accessibility Standards:** [`accessibility-standards.md`](../../startupai.site/docs/design/accessibility-standards.md) Section 4.2 for detailed ARIA patterns and component-level requirements
- **AI Conversation Interface:** [`ai-conversation-interface.md`](./ai-conversation-interface.md) Section 4 for real-time AI response handling and streaming
- **Frontend Components:** [`../engineering/frontend-components-specification.md`](../engineering/frontend-components-specification.md) Section 2 for ConversationInterface and MessageInput implementation
- **API Integration:** [`../engineering/crewai-frontend-integration.md`](../engineering/crewai-frontend-integration.md) Section 2 for streaming conversation responses

---

## 2. Step-by-Step Onboarding Flow

### 2.1 Conversation Stages (7 Phases)

Based on CrewAI `onboarding_agent` configuration, the conversation follows this structured flow:

**Stage 1: Welcome & Introduction (2-3 minutes)**
```yaml
ai_introduction:
  message: "Hi! I'm your AI Strategy Consultant. I'll guide you through a structured conversation to understand your startup idea and create a comprehensive validation plan."
  user_action: "Confirm readiness to begin"
  data_collected: "User consent and session initialization"
```

**Stage 2: Customer Segments (5-7 minutes)**
```yaml
customer_discovery:
  questions:
    - "Who do you believe would be most excited about your solution?"
    - "What specific group of people face the problem you're solving?"
    - "How do these customers currently handle this problem?"
  validation: "Minimum 1 customer segment, maximum 3 for focus"
  data_collected: "Primary and secondary customer segments"
```

**Stage 3: Problem/Opportunity Identification (5-7 minutes)**
```yaml
problem_analysis:
  questions:
    - "What specific problem or opportunity are you addressing?"
    - "How painful is this problem for your customers?"
    - "What happens if this problem isn't solved?"
  validation: "Clear problem statement with pain level assessment"
  data_collected: "Problem description, pain intensity, current alternatives"
```

**Stage 4: Solution Concept (5-7 minutes)**
```yaml
solution_design:
  questions:
    - "How does your solution address this problem?"
    - "What makes your approach unique or better?"
    - "What's the core value you're creating?"
  validation: "Solution-problem fit articulation"
  data_collected: "Solution description, unique value proposition, differentiation"
```

**Stage 5: Competitive Landscape (3-5 minutes)**
```yaml
competitor_mapping:
  questions:
    - "Who else is solving this problem?"
    - "How do customers currently solve this without you?"
    - "What would make customers switch to your solution?"
  validation: "At least 2 competitive alternatives identified"
  data_collected: "Direct competitors, indirect alternatives, switching barriers"
```

**Stage 6: Resources & Constraints (3-5 minutes)**
```yaml
resource_assessment:
  questions:
    - "What's your budget for validation and testing?"
    - "What channels do you have access to reach customers?"
    - "What assets or advantages do you already have?"
  validation: "Realistic resource constraints and available assets"
  data_collected: "Budget range, marketing channels, existing assets, team capabilities"
```

**Stage 7: Business Stage & Goals (2-3 minutes)**
```yaml
stage_definition:
  questions:
    - "What stage is your business currently in?"
    - "What do you want to achieve in the next 3 months?"
    - "What would success look like for you?"
  validation: "Clear stage identification and success metrics"
  data_collected: "Business stage, 3-month goals, success criteria"
```

### 2.2 Interaction Mode Selection

**🔗 Cross-References:**
- **Voice Input Implementation:** [`ai-conversation-interface.md`](./ai-conversation-interface.md) Section 1.3 for voice input interface components
- **Accessibility Requirements:** [`accessibility-standards.md`](../../startupai.site/docs/design/accessibility-standards.md) Section 6 for multi-modal accessibility patterns
- **Component Architecture:** [`../engineering/frontend-components-specification.md`](../engineering/frontend-components-specification.md) Section 2.3 for MessageInput and VoiceInput components

**Mode Selection Interface (Pre-Conversation Setup):**
```typescript
interface InteractionModeSelection {
  modes: {
    voice: {
      label: "Voice Conversation";
      description: "AI speaks questions, you respond verbally";
      features: ["Text-to-speech AI questions", "Voice-to-text responses", "Natural conversation flow"];
      accessibility: "Ideal for motor impairments, multitasking, or conversational preference";
      requirements: "Microphone access, quiet environment recommended";
    };
    text: {
      label: "Text Conversation";
      description: "AI types questions, you type responses";
      features: ["Written AI questions", "Typed responses", "Time to think and edit"];
      accessibility: "Ideal for hearing impairments, noisy environments, or detailed responses";
      requirements: "Keyboard or touch input";
    };
    hybrid: {
      label: "Flexible Mode";
      description: "Switch between voice and text as needed";
      features: ["Mode switching during conversation", "Best of both worlds"];
      accessibility: "Maximum flexibility for varying needs and environments";
    };
  };
  
  // User can change mode at any time during conversation
  modeSwitch: {
    available: true;
    trigger: "Mode switch button always visible";
    confirmation: "Seamless transition with context preservation";
  };
}
```

**AI Help System Integration:**

**🔗 Cross-References:**
- **AI Personality Design:** [`onboarding-agent-personality.md`](./onboarding-agent-personality.md) Section 3 for response validation and follow-up logic
- **Conversation Interface:** [`ai-conversation-interface.md`](./ai-conversation-interface.md) Section 3 for input validation and sanitization
- **User Experience Flow:** [`../user-experience/onboarding-journey-map.md`](../user-experience/onboarding-journey-map.md) Section 4 for fallback scenarios and error recovery
```typescript
interface AIHelpSystem {
  helpTriggers: {
    explicitRequest: "User clicks 'Help me answer this' button";
    detectedStruggle: "AI detects unclear or incomplete responses";
    timeBasedPrompt: "After 2+ minutes on same question";
  };
  
  helpTypes: {
    examples: {
      trigger: "Can you give me an example?";
      response: "AI provides 2-3 relevant examples for current question";
    };
    clarification: {
      trigger: "I don't understand the question";
      response: "AI rephrases question in simpler terms with context";
    };
    brainstorming: {
      trigger: "Help me think through this";
      response: "AI guides through structured thinking process";
    };
    validation: {
      trigger: "Is this a good answer?";
      response: "AI provides feedback on response quality and suggestions";
    };
  };
  
  // Help available in both voice and text modes
  multiModal: {
    voiceMode: "AI speaks help content, user can ask follow-up verbally";
    textMode: "AI displays help content, user can type follow-up questions";
    accessibility: "Help content available in user's preferred interaction mode";
  };
}
```

### 2.3 Voice Mode Implementation

**🔗 Cross-References:**
- **Streaming Responses:** [`../engineering/crewai-frontend-integration.md`](../engineering/crewai-frontend-integration.md) Section 2 for Server-Sent Events implementation
- **Accessibility Standards:** [`accessibility-standards.md`](../../startupai.site/docs/design/accessibility-standards.md) Section 5.2 for motor impairment support
- **Component Implementation:** [`../engineering/frontend-components-specification.md`](../engineering/frontend-components-specification.md) Section 2.3 for VoiceInput component

**Voice Interaction Flow:**
```typescript
interface VoiceMode {
  aiSpeech: {
    engine: "Text-to-speech with natural voice";
    personality: "Professional, warm, encouraging tone";
    pace: "Moderate speed with clear articulation";
    controls: ["Pause", "Replay", "Speed adjustment"];
  };
  
  userSpeech: {
    recognition: "Continuous voice-to-text with real-time feedback";
    languages: ["English (primary)", "Spanish", "French", "German"];
    accuracy: "AI confirms understanding before proceeding";
    editing: "User can review and edit transcribed text";
  };
  
  conversationFlow: {
    aiQuestion: "AI speaks question aloud";
    userThinking: "User can say 'give me a moment' for thinking time";
    userResponse: "User speaks response, AI transcribes in real-time";
    confirmation: "AI confirms understanding: 'I heard you say...'";
    clarification: "AI asks for clarification if response unclear";
    progression: "AI moves to next question or stage";
  };
  
  helpIntegration: {
    voiceHelp: "User says 'help me with this' or 'I need an example'";
    spokenExamples: "AI provides examples verbally";
    clarification: "AI rephrases questions when requested";
    encouragement: "AI provides verbal encouragement and guidance";
  };
}
```

### 2.4 Text Mode Implementation

**🔗 Cross-References:**
- **Message Input Design:** [`ai-conversation-interface.md`](./ai-conversation-interface.md) Section 1.3 for input interface components
- **State Management:** [`../engineering/frontend-components-specification.md`](../engineering/frontend-components-specification.md) Section 1.2 for conversation state management
- **Accessibility Standards:** [`accessibility-standards.md`](../../startupai.site/docs/design/accessibility-standards.md) Section 5.3 for cognitive accessibility support

**Text Interaction Flow:**
```typescript
interface TextMode {
  aiMessages: {
    formatting: "Clear, structured text with proper spacing";
    personality: "Professional yet conversational written tone";
    length: "Concise questions with optional detail expansion";
    controls: ["Message history", "Question replay", "Context expansion"];
  };
  
  userInput: {
    interface: "Rich text input with formatting options";
    features: ["Auto-save drafts", "Character count", "Spell check"];
    validation: "Real-time feedback on response completeness";
    editing: "Full editing capabilities before submission";
  };
  
  conversationFlow: {
    aiQuestion: "AI displays question with context and examples";
    userComposition: "User types response with thinking time";
    draftSaving: "Response auto-saved as user types";
    submission: "User submits when ready";
    aiProcessing: "AI analyzes response and provides feedback";
    progression: "AI presents next question or moves to next stage";
  };
  
  helpIntegration: {
    helpButtons: "Contextual help buttons for each question";
    inlineExamples: "Expandable example sections";
    guidedPrompts: "Step-by-step thinking prompts";
    responseReview: "AI feedback on draft responses before submission";
  };
}
```

### 2.5 Enhanced Conversation Flow Logic

```typescript
interface EnhancedConversationFlow {
  currentStage: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  stageProgress: number; // 0-100% within current stage
  interactionMode: 'voice' | 'text' | 'hybrid';
  
  // Enhanced flow with mode-specific features
  overallProgress: number; // 0-100% total conversation
  
  // Stage transition logic
  canAdvanceStage: boolean;
  requiredData: string[];
  optionalData: string[];
  
  // Conversation state
  messages: ConversationMessage[];
  entrepreneurBrief: Partial<EntrepreneurBrief>;
  validationErrors: ValidationError[];
}
```

---

## 3. Integration with CrewAI onboarding_agent

### 3.1 API Integration Points

**Conversation Initialization:**
```typescript
// POST /api/onboarding/start
interface OnboardingStartRequest {
  userId: string;
  planType: 'trial' | 'founder' | 'consultant';
  sessionId?: string; // Resume existing session
}

interface OnboardingStartResponse {
  sessionId: string;
  agentIntroduction: string;
  firstQuestion: string;
  expectedDuration: string; // "20-25 minutes"
  stageInfo: StageInfo;
}
```

**Message Exchange:**
```typescript
// POST /api/onboarding/message
interface OnboardingMessageRequest {
  sessionId: string;
  userMessage: string;
  messageType: 'text' | 'voice_transcript';
  timestamp: string;
}

interface OnboardingMessageResponse {
  agentResponse: string;
  followUpQuestion?: string;
  stageProgress: StageProgress;
  briefUpdate: Partial<EntrepreneurBrief>;
  validationFeedback?: ValidationFeedback;
  isStageComplete: boolean;
  nextStage?: StageInfo;
}
```

**Conversation Completion:**
```typescript
// POST /api/onboarding/complete
interface OnboardingCompleteRequest {
  sessionId: string;
  finalConfirmation: boolean;
}

interface OnboardingCompleteResponse {
  entrepreneurBrief: EntrepreneurBrief;
  workflowTriggered: boolean;
  estimatedCompletionTime: string; // "15-20 minutes"
  nextSteps: NextStep[];
  dashboardRedirect: string;
}
```

### 3.2 CrewAI Agent Configuration

The onboarding conversation directly maps to the CrewAI `onboarding_agent` specification:

```yaml
# From backend/config/agents.yaml
onboarding_agent:
  role: "Entrepreneur Onboarding Consultant"
  goal: "Guide founders through structured conversation to collect all inputs needed for startup validation and design"
  backstory: "Patient and inquisitive consultant who knows how to ask the right questions"
  
# Expected output format
entrepreneur_brief:
  customer_segments: string[]
  problems: ProblemDescription[]
  opportunities: OpportunityDescription[]
  solution_idea: SolutionConcept
  competitors: CompetitorProfile[]
  budget: BudgetConstraints
  channels: MarketingChannel[]
  assets: ExistingAsset[]
  business_stage: BusinessStage
```

---

## 4. Progress Indicators and AI Feedback

### 4.1 Visual Progress System

**Multi-Level Progress Tracking:**
```typescript
interface ProgressSystem {
  // Overall conversation progress
  overallProgress: {
    current: number; // 0-100
    label: string; // "Stage 3 of 7: Problem Analysis"
    timeElapsed: string; // "12 minutes"
    estimatedRemaining: string; // "8-10 minutes"
  };
  
  // Current stage progress
  stageProgress: {
    current: number; // 0-100
    stageName: string; // "Customer Segments"
    questionsAnswered: number; // 2
    questionsRemaining: number; // 1-2
    requiredData: DataRequirement[];
  };
  
  // Data collection progress
  briefCompleteness: {
    customerSegments: 'complete' | 'partial' | 'missing';
    problemDefinition: 'complete' | 'partial' | 'missing';
    solutionConcept: 'complete' | 'partial' | 'missing';
    competitorAnalysis: 'complete' | 'partial' | 'missing';
    resourceAssessment: 'complete' | 'partial' | 'missing';
    businessStage: 'complete' | 'partial' | 'missing';
  };
}
```

**Visual Components:**
- **Linear Progress Bar:** Overall conversation completion (0-100%)
- **Stage Indicators:** 7 circles showing completed/current/upcoming stages
- **Data Completeness Grid:** Visual grid showing collected information
- **Time Tracking:** Elapsed time and estimated remaining time

### 4.2 AI Feedback Mechanisms

**Real-Time Validation:**
```typescript
interface AIFeedback {
  // Immediate response validation
  responseQuality: {
    clarity: 'high' | 'medium' | 'low';
    completeness: 'complete' | 'needs_followup' | 'insufficient';
    actionRequired: 'continue' | 'clarify' | 'expand';
  };
  
  // Constructive guidance
  suggestions: {
    type: 'clarification' | 'expansion' | 'example';
    message: string;
    helpText?: string;
  }[];
  
  // Progress encouragement
  encouragement: {
    milestone: string; // "Great! You've clearly identified your customer segment"
    nextStep: string; // "Now let's dive into the specific problems they face"
    progressNote: string; // "You're 40% through the conversation"
  };
}
```

**Adaptive Questioning:**
- AI adjusts question complexity based on user responses
- Follow-up questions for unclear or incomplete answers
- Examples and prompts for users who need guidance
- Validation and confirmation of collected information

---

## 5. Error Handling and Recovery

### 5.1 Technical Error Scenarios

**API Connection Failures:**
```typescript
interface ErrorRecovery {
  // Network connectivity issues
  connectionLoss: {
    detection: 'automatic' | 'user_reported';
    recovery: 'auto_retry' | 'manual_retry' | 'offline_mode';
    dataPreservation: 'local_storage' | 'session_backup';
    userNotification: string;
  };
  
  // AI service unavailability
  aiServiceDown: {
    fallbackMode: 'human_handoff' | 'form_mode' | 'scheduled_callback';
    dataCollection: 'continue_structured' | 'pause_session';
    userCommunication: string;
    escalationPath: string;
  };
  
  // Session timeout
  sessionExpiry: {
    warningTime: number; // 5 minutes before expiry
    extensionOption: boolean;
    dataRecovery: 'full_restore' | 'partial_restore';
    restartOption: boolean;
  };
}
```

**User Experience Errors:**
```typescript
interface UXErrorHandling {
  // User confusion or frustration
  conversationStuck: {
    detection: 'repeated_unclear_responses' | 'user_request_help';
    intervention: 'clarifying_questions' | 'examples' | 'human_handoff';
    escalationTrigger: number; // 3 unclear responses
  };
  
  // Incomplete or invalid responses
  dataValidation: {
    missingRequired: 'prompt_completion' | 'suggest_examples';
    invalidFormat: 'format_guidance' | 'auto_correction';
    inconsistentData: 'clarification_request' | 'conflict_resolution';
  };
  
  // User wants to restart or modify
  conversationControl: {
    restartRequest: 'confirm_and_restart' | 'save_and_restart';
    modifyPrevious: 'edit_mode' | 'clarification_mode';
    pauseSession: 'save_state' | 'schedule_continuation';
  };
}
```

### 5.2 Recovery Mechanisms

**Automatic Recovery:**
- Local storage backup of conversation state every 30 seconds
- Automatic retry with exponential backoff for API failures
- Session restoration from last known good state
- Graceful degradation to structured form if AI unavailable

**User-Initiated Recovery:**
- "Start Over" button with confirmation dialog
- "Go Back" functionality to previous conversation stages
- "Get Help" button for human assistance
- "Save and Continue Later" option

---

## 6. Accessibility Requirements for AI Interactions

### 6.1 Screen Reader Compatibility

**Conversation Flow Accessibility:**
```typescript
interface ScreenReaderSupport {
  // Message announcement
  messageAnnouncement: {
    aiMessages: 'immediate_announce' | 'polite_announce';
    userMessages: 'confirm_sent' | 'echo_back';
    systemMessages: 'priority_announce';
    typingIndicators: 'announce_ai_thinking';
  };
  
  // Navigation support
  conversationNavigation: {
    messageHistory: 'landmark_navigation' | 'heading_structure';
    stageProgress: 'aria_live_updates' | 'status_announcements';
    formControls: 'proper_labeling' | 'instruction_text';
  };
  
  // Content structure
  semanticStructure: {
    conversationRoles: 'role_attributes' | 'visual_indicators';
    progressIndicators: 'aria_progressbar' | 'text_alternatives';
    dataCollection: 'fieldset_grouping' | 'description_text';
  };
}
```

**ARIA Implementation:**
```html
<!-- Conversation interface -->
<main role="main" aria-label="AI-guided onboarding conversation">
  <div role="log" aria-live="polite" aria-label="Conversation messages">
    <div role="article" aria-label="AI message">
      <span class="sr-only">AI Consultant says:</span>
      <!-- AI message content -->
    </div>
    <div role="article" aria-label="Your message">
      <span class="sr-only">You said:</span>
      <!-- User message content -->
    </div>
  </div>
  
  <form role="form" aria-label="Message input">
    <label for="message-input">Type your response</label>
    <textarea id="message-input" aria-describedby="input-help"></textarea>
    <div id="input-help">Press Enter to send, Shift+Enter for new line</div>
  </form>
</main>

<!-- Progress tracking -->
<aside role="complementary" aria-label="Conversation progress">
  <div role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100">
    Stage 3 of 7: 40% complete
  </div>
</aside>
```

### 6.2 Motor Impairment Support

**Input Alternatives:**
- Voice input with speech-to-text conversion
- Large click targets (minimum 44px × 44px)
- Keyboard-only navigation support
- Customizable input methods (voice, keyboard, switch control)

**Interaction Timing:**
- No time limits on responses
- Pause/resume conversation capability
- Auto-save conversation state
- Extended session timeouts with warnings

### 6.3 Cognitive Accessibility

**Conversation Simplification:**
```typescript
interface CognitiveSupport {
  // Language complexity
  languageLevel: {
    readingLevel: 'grade_8_maximum';
    sentenceLength: 'short_sentences_preferred';
    vocabulary: 'common_words_prioritized';
    jargon: 'business_terms_explained';
  };
  
  // Memory support
  memoryAids: {
    conversationSummary: 'always_visible';
    previousAnswers: 'easy_review_access';
    progressReminders: 'regular_updates';
    nextSteps: 'clear_expectations';
  };
  
  // Attention support
  focusManagement: {
    distractionReduction: 'minimal_ui_elements';
    singleTasking: 'one_question_at_time';
    breakOptions: 'pause_and_resume';
    progressCelebration: 'milestone_acknowledgment';
  };
}
```

**Visual Design for Cognitive Accessibility:**
- High contrast color schemes
- Clear visual hierarchy with consistent styling
- Minimal cognitive load with single-focus design
- Progress celebration and encouragement

---

## 7. Implementation Checklist

### 7.1 Phase 1: Core Infrastructure (3-4 hours)
- [ ] Create `/app/onboarding/page.tsx` with basic layout
- [ ] Implement `ConversationInterface` component
- [ ] Set up conversation state management (Zustand/Context)
- [ ] Create API routes: `/api/onboarding/{start,message,complete}`
- [ ] Integrate with CrewAI onboarding_agent backend

### 7.2 Phase 2: User Experience (2-3 hours)
- [ ] Implement `ProgressTracker` with 7-stage visualization
- [ ] Add `EntrepreneurBriefSummary` live updates
- [ ] Create typing indicators and message animations
- [ ] Add conversation controls (pause, restart, help)
- [ ] Implement error handling and recovery mechanisms

### 7.3 Phase 3: Accessibility (2-3 hours)
- [ ] Add comprehensive ARIA labels and roles
- [ ] Implement screen reader announcements
- [ ] Add keyboard navigation support
- [ ] Create voice input integration
- [ ] Test with assistive technologies

### 7.4 Phase 4: Integration Testing (1-2 hours)
- [ ] End-to-end conversation flow testing
- [ ] CrewAI workflow trigger verification
- [ ] Error scenario testing
- [ ] Performance optimization
- [ ] Cross-browser compatibility testing

---

## 8. Success Metrics

### 8.1 Technical Metrics
- **Conversation Completion Rate:** >85% of users complete full onboarding
- **API Response Time:** <2 seconds for AI responses
- **Error Rate:** <5% technical failures
- **Session Recovery:** >95% successful state restoration

### 8.2 User Experience Metrics
- **User Satisfaction:** >4.2/5 rating for onboarding experience
- **Time to Complete:** 20-25 minutes average
- **Clarity Score:** >4.0/5 for AI question clarity
- **Workflow Trigger Success:** >90% successful handoff to CrewAI analysis

### 8.3 Accessibility Metrics
- **Screen Reader Compatibility:** 100% navigation success
- **Keyboard Navigation:** 100% functionality without mouse
- **Voice Input Success:** >90% accurate transcription
- **Cognitive Load Score:** <3.0/5 (lower is better)

---

## 9. Cross-References

**Primary Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md)
- Section 2.5: Backend & AI (CrewAI integration status)
- Section 1.2.5: Launch Readiness Assessment (onboarding as launch blocker)
- Lines 296-299: Phase 3 AI visibility requirements

**Related Documentation:**
- [`CREW_AI.md`](../../backend/CREW_AI.md) - onboarding_agent specification
- [`ai-conversation-interface.md`](./ai-conversation-interface.md) - Chat interface details and voice input implementation
- [`crewai-frontend-integration.md`](../engineering/crewai-frontend-integration.md) - API integration and streaming responses
- [`onboarding-journey-map.md`](../user-experience/onboarding-journey-map.md) - Complete user flow with interaction modes
- [`onboarding-agent-personality.md`](./onboarding-agent-personality.md) - AI help system and response validation
- [`frontend-components-specification.md`](../engineering/frontend-components-specification.md) - VoiceInput and MessageInput components
- [`accessibility-standards.md`](../../startupai.site/docs/design/accessibility-standards.md) - Multi-modal accessibility requirements

**Implementation Dependencies:**
- CrewAI backend completion (currently 15% complete)
- Authentication system (✅ working with PKCE flow)
- Database schema updates for onboarding sessions
- Frontend component library (✅ shadcn/ui available)

---

**Status:** 🔴 **CRITICAL IMPLEMENTATION REQUIRED**  
**Next Action:** Begin Phase 1 implementation immediately  
**Owner:** Development team  
**Deadline:** Before launch (launch blocker)  
