---
purpose: "Complete onboarding journey map and UX specification"
status: "active"
last_reviewed: "2026-01-18"
---

# 🗺️ Complete Onboarding Journey Map

**End-to-End User Experience Specification**

**Status:** 🟢 **IMPLEMENTED** - Two-Pass Architecture (Jan 2026)
**Last Updated:** 2026-01-18
**Cross-Reference:** [`features/stage-progression.md`](../features/stage-progression.md) - Implementation details

---

## 📋 Document Purpose

This document maps the complete user journey from marketing site signup to receiving AI-generated strategic insights. Use this as a UX reference for the intended user experience and validation checklist.

**Marketing Promise:** "AI-guided strategy session" leading to "comprehensive strategic analysis"
**Implementation:** See `features/stage-progression.md` for current stage system

---

## Architecture Reference (Jan 2026)

> **Source of Truth**: See [ADR-004: Two-Pass Onboarding Architecture](../../startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md)

### Two-Pass Flow

The onboarding uses a Two-Pass Architecture for deterministic progression:

| Pass | Endpoint | Purpose |
|------|----------|---------|
| **Pass 1** | `/api/chat/stream` | LLM streams conversation (no tools) |
| **Pass 2** | `/api/chat/save` | Backend assesses quality, advances stage |

### Key Change from Previous Implementation

| Old Approach (Pre-Jan 2026) | New Approach (Jan 2026) |
|-----------------------------|-------------------------|
| LLM called tools (`advanceStage`, `completeOnboarding`) | Backend assesses after each message |
| Tool schemas caused hallucination errors | Deterministic topic coverage assessment |
| Unpredictable progression | Consistent 7-stage progression |

### Timing Impact

- **User Experience**: Unchanged (still feels like natural conversation)
- **Processing**: 2 LLM calls per message (stream + assessment)
- **Latency**: Minimal increase (~200ms for assessment)  

---

## 1. Step-by-Step User Journey from Signup to First Insights

### 1.1 Pre-Onboarding (Marketing Site)

**Step 1: Landing Page Discovery (0-2 minutes)**
```yaml
touchpoint: startupai.site homepage
user_state: curious_prospect
user_goal: understand_value_proposition
user_actions:
  - reads hero section: "AI-Powered Strategic Analysis"
  - views social proof and case studies
  - clicks "See How It Works" or navigates to pricing
user_emotions: curious, cautiously_optimistic
pain_points: 
  - skeptical about AI capabilities
  - unclear about time commitment
  - uncertain about value vs cost
success_metrics:
  - time_on_page: >90 seconds
  - scroll_depth: >70%
  - click_through_rate: >15%
```

**Step 2: Pricing Page Evaluation (2-5 minutes)**
```yaml
touchpoint: startupai.site/pricing
user_state: evaluating_options
user_goal: understand_pricing_and_value
user_actions:
  - compares Free Trial vs Founder vs Consultant plans
  - reads feature descriptions for all tiers
  - selects preferred plan (Free Trial, Founder, or Consultant)
user_emotions: interested, price_conscious
pain_points:
  - unclear what "AI-guided session" includes across tiers
  - uncertain about time commitment
  - worried about payment requirements (paid plans)
success_metrics:
  - conversion_rate: >25% (any plan selection)
  - time_on_pricing: >2 minutes
  - feature_comparison_engagement: >60%
```

**Step 3: Signup Process (1-3 minutes)**
```yaml
touchpoint: startupai.site/signup
user_state: committed_to_trying
user_goal: create_account_quickly
user_actions:
  - fills basic information (name, email, company)
  - confirms selected plan (Free Trial, Founder, or Consultant)
  - clicks "Continue with GitHub" OAuth
user_emotions: committed, slightly_anxious
pain_points:
  - form friction
  - OAuth trust concerns
  - unclear next steps
success_metrics:
  - signup_completion_rate: >85%
  - oauth_success_rate: >95%
  - time_to_complete: <3 minutes
```

### 1.2 Authentication & Handoff (Cross-Site)

**Step 4: OAuth Authentication (30-60 seconds)**
```yaml
touchpoint: GitHub OAuth + app.startupai.site/auth/callback
user_state: authenticating
user_goal: complete_authentication_seamlessly
user_actions:
  - authorizes GitHub OAuth permissions
  - gets redirected to app.startupai.site
  - waits for authentication processing
user_emotions: trusting, expectant
pain_points:
  - OAuth permission concerns
  - redirect confusion
  - loading time anxiety
success_metrics:
  - oauth_completion_rate: >95%
  - redirect_success_rate: >98%
  - authentication_time: <30 seconds
```

**Step 5: Welcome & Onboarding Introduction (1-2 minutes)**
```yaml
touchpoint: app.startupai.site/onboarding (CURRENTLY 404!)
user_state: newly_authenticated
user_goal: understand_what_happens_next
user_actions:
  - reads AI agent introduction
  - reviews estimated time commitment (20-25 minutes)
  - confirms readiness to begin conversation
user_emotions: excited, slightly_nervous
pain_points:
  - unclear expectations
  - time commitment concerns
  - AI interaction unfamiliarity
success_metrics:
  - onboarding_start_rate: >90%
  - time_to_start: <2 minutes
  - user_confidence_score: >4.0/5
```

### 1.3 AI-Guided Conversation (20-25 minutes)

**Step 6: Customer Segment Discovery (5-7 minutes)**
```yaml
touchpoint: AI conversation interface
user_state: engaged_in_conversation
user_goal: clearly_articulate_target_customers
ai_questions:
  - "Who do you believe would be most excited about your solution?"
  - "What specific group of people face the problem you're solving?"
  - "How do these customers currently handle this problem?"
user_actions:
  - types detailed responses about target customers
  - clarifies when AI asks follow-up questions
  - reviews AI's understanding summary
user_emotions: thoughtful, engaged
pain_points:
  - difficulty articulating customer segments
  - uncertainty about market size
  - AI questions too generic or too specific
success_metrics:
  - response_quality_score: >3.5/5
  - stage_completion_rate: >85%
  - user_satisfaction: >4.0/5
```

**Step 7: Problem/Opportunity Analysis (5-7 minutes)**
```yaml
touchpoint: AI conversation interface
user_state: problem_focused
user_goal: clearly_define_problem_being_solved
ai_questions:
  - "What specific problem or opportunity are you addressing?"
  - "How painful is this problem for your customers?"
  - "What happens if this problem isn't solved?"
user_actions:
  - describes problem in detail
  - quantifies pain level and impact
  - provides examples and evidence
user_emotions: passionate, analytical
pain_points:
  - difficulty quantifying problem severity
  - lack of concrete evidence
  - problem too broad or too narrow
success_metrics:
  - problem_clarity_score: >3.5/5
  - evidence_quality: >3.0/5
  - stage_completion_rate: >85%
```

**Step 8: Solution Concept Development (5-7 minutes)**
```yaml
touchpoint: AI conversation interface
user_state: solution_focused
user_goal: articulate_unique_solution_approach
ai_questions:
  - "How does your solution address this problem?"
  - "What makes your approach unique or better?"
  - "What's the core value you're creating?"
user_actions:
  - explains solution mechanics
  - identifies unique differentiators
  - connects solution to customer value
user_emotions: creative, confident
pain_points:
  - solution too complex to explain
  - unclear differentiation
  - value proposition not compelling
success_metrics:
  - solution_clarity_score: >3.5/5
  - differentiation_strength: >3.0/5
  - value_connection: >3.5/5
```

**Step 9: Competitive Landscape Mapping (3-5 minutes)**
```yaml
touchpoint: AI conversation interface
user_state: competitive_analysis
user_goal: understand_competitive_positioning
ai_questions:
  - "Who else is solving this problem?"
  - "How do customers currently solve this without you?"
  - "What would make customers switch to your solution?"
user_actions:
  - identifies direct and indirect competitors
  - analyzes current customer alternatives
  - defines switching barriers and incentives
user_emotions: strategic, competitive
pain_points:
  - limited competitive knowledge
  - unclear positioning
  - overestimating uniqueness
success_metrics:
  - competitor_identification: >2 competitors
  - positioning_clarity: >3.0/5
  - switching_analysis: >3.0/5
```

**Step 10: Resource Assessment (3-5 minutes)**
```yaml
touchpoint: AI conversation interface
user_state: resource_planning
user_goal: define_available_resources_and_constraints
ai_questions:
  - "What's your budget for validation and testing?"
  - "What channels do you have access to reach customers?"
  - "What assets or advantages do you already have?"
user_actions:
  - specifies budget ranges and constraints
  - lists available marketing channels
  - identifies existing assets and advantages
user_emotions: realistic, planning-focused
pain_points:
  - limited budget concerns
  - unclear channel effectiveness
  - underestimating required resources
success_metrics:
  - budget_clarity: realistic_ranges_provided
  - channel_identification: >2 channels
  - asset_inventory: comprehensive_list
```

**Step 11: Business Stage & Goals Definition (2-3 minutes)**
```yaml
touchpoint: AI conversation interface
user_state: goal_setting
user_goal: define_current_stage_and_success_metrics
ai_questions:
  - "What stage is your business currently in?"
  - "What do you want to achieve in the next 3 months?"
  - "What would success look like for you?"
user_actions:
  - selects appropriate business stage
  - defines 3-month objectives
  - establishes success criteria
user_emotions: forward-looking, motivated
pain_points:
  - unclear about business stage
  - unrealistic timeline expectations
  - vague success definitions
success_metrics:
  - stage_accuracy: appropriate_selection
  - goal_specificity: >3.0/5 (SMART criteria)
  - timeline_realism: >3.0/5
```

### 1.4 AI Processing & Analysis (15-20 minutes)

**Step 12: Conversation Completion & Workflow Trigger (1-2 minutes)**
```yaml
touchpoint: onboarding completion interface
user_state: conversation_complete
user_goal: understand_next_steps_and_timeline
user_actions:
  - reviews collected information summary
  - confirms accuracy and completeness
  - authorizes full AI analysis workflow
user_emotions: accomplished, anticipatory
pain_points:
  - information accuracy concerns
  - unclear about analysis process
  - impatience for results
success_metrics:
  - completion_rate: >90%
  - data_accuracy_confirmation: >95%
  - workflow_authorization: >95%
```

**Step 13: AI Multi-Agent Processing (15-20 minutes)**
```yaml
touchpoint: workflow progress dashboard
user_state: waiting_for_analysis
user_goal: understand_progress_and_stay_engaged
system_actions:
  - Customer Researcher analyzes market data
  - Competitor Analyst maps competitive landscape
  - Value Designer creates value proposition
  - Validation Agent designs test roadmap
  - QA Agent ensures quality and consistency
user_actions:
  - monitors progress indicators
  - reads agent activity updates
  - explores dashboard features (optional)
user_emotions: curious, excited, slightly_impatient
pain_points:
  - long wait time
  - unclear progress
  - concern about analysis quality
success_metrics:
  - user_retention_during_processing: >80%
  - progress_engagement: >60%
  - abandonment_rate: <15%
```

### 1.5 Results Delivery & First Value (5-10 minutes)

**Step 14: Results Presentation (5-10 minutes)**
```yaml
touchpoint: results dashboard
user_state: receiving_insights
user_goal: understand_strategic_recommendations
system_deliverables:
  - Executive Summary (2-3 pages)
  - Customer Profile with Jobs/Pains/Gains
  - Competitive Positioning Map
  - Value Proposition Canvas
  - 3-Tier Validation Roadmap
  - Business Model Canvas
user_actions:
  - reads executive summary
  - explores detailed analysis sections
  - reviews validation recommendations
  - downloads PDF reports (optional)
user_emotions: impressed, validated, energized
pain_points:
  - information overload
  - unclear prioritization
  - implementation uncertainty
success_metrics:
  - content_engagement: >70% sections viewed
  - time_spent_reviewing: >5 minutes
  - download_rate: >40%
  - satisfaction_score: >4.2/5
```

**Step 15: Next Steps & Action Planning (2-3 minutes)**
```yaml
touchpoint: action planning interface
user_state: planning_implementation
user_goal: understand_immediate_next_steps
system_recommendations:
  - Top 3 validation experiments to start
  - Recommended timeline and budget
  - Success metrics and tracking methods
  - Resources and tools needed
user_actions:
  - reviews recommended next steps
  - selects experiments to prioritize
  - sets implementation timeline
  - bookmarks key resources
user_emotions: motivated, confident, ready_to_act
pain_points:
  - overwhelming number of recommendations
  - unclear implementation details
  - resource constraint concerns
success_metrics:
  - next_steps_engagement: >80%
  - experiment_selection: >60%
  - timeline_commitment: >70%
```

---

## 2. Expected AI Interactions and Responses

### 2.1 AI Agent Personality & Communication Style

```yaml
ai_personality:
  role: "Experienced Strategy Consultant"
  tone: "Professional yet approachable"
  communication_style:
    - patient and encouraging
    - asks clarifying questions
    - provides examples when needed
    - acknowledges good responses
    - gently guides when responses are unclear
  
expertise_demonstration:
  - references business frameworks (BMC, VPC, Jobs-to-be-Done)
  - asks follow-up questions that show deep understanding
  - connects user responses to strategic implications
  - provides relevant examples from similar businesses
```

### 2.2 Sample AI Conversation Flow

**Opening Introduction:**
```
AI: "Hi! I'm your AI Strategy Consultant. I'm here to guide you through a structured conversation that will help us understand your startup idea and create a comprehensive validation plan.

Over the next 20-25 minutes, I'll ask you questions about your customers, the problem you're solving, your solution approach, and your resources. This will give us everything we need to generate a detailed strategic analysis with specific recommendations.

Are you ready to begin? This works best when you can focus without distractions."
```

**Customer Segment Discovery:**
```
AI: "Let's start with your customers. Who do you believe would be most excited about your solution?"

[User responds: "Small restaurant owners who struggle with inventory management"]

AI: "Great! Restaurant owners face many operational challenges. When you say 'small restaurant owners,' can you be more specific? Are we talking about independent restaurants, small chains, specific cuisine types, or restaurants in particular locations?"

[User provides more detail]

AI: "Perfect. Now, what specific inventory management problems do these restaurant owners face? Is it overstocking, understocking, waste management, or something else?"
```

**Problem Validation:**
```
AI: "You mentioned inventory management challenges. Help me understand - how painful is this problem for restaurant owners? What happens when they get inventory wrong?"

[User explains impact]

AI: "That's a significant problem. On a scale of 1-10, how would you rate the pain level of this problem for restaurant owners? And how frequently does this problem occur?"
```

### 2.3 AI Response Patterns

**Acknowledgment Patterns:**
- "That's a great insight about..."
- "I can see you've thought deeply about..."
- "That's exactly the kind of detail that will help us..."

**Clarification Patterns:**
- "Help me understand what you mean by..."
- "Can you give me a specific example of..."
- "When you say X, are you referring to..."

**Transition Patterns:**
- "Now that we understand your customers, let's explore..."
- "Building on what you've shared about the problem..."
- "This connects well to what we discussed earlier about..."

---

## 3. Success Metrics and Completion Criteria

### 3.1 Conversation Quality Metrics

```yaml
conversation_success_metrics:
  completion_rate:
    target: ">85%"
    measurement: "users who complete all 7 conversation stages"
    
  response_quality:
    target: ">3.5/5 average"
    measurement: "AI assessment of response clarity and completeness"
    
  time_to_complete:
    target: "20-25 minutes average"
    measurement: "time from start to conversation completion"
    
  user_satisfaction:
    target: ">4.0/5"
    measurement: "post-conversation satisfaction survey"
```

### 3.2 Data Collection Quality

```yaml
data_quality_metrics:
  customer_segment_clarity:
    target: ">80% clear identification"
    measurement: "AI assessment of segment specificity"
    
  problem_definition_strength:
    target: ">75% well-defined problems"
    measurement: "problem specificity and impact clarity"
    
  solution_differentiation:
    target: ">70% clear differentiation"
    measurement: "unique value proposition articulation"
    
  resource_assessment_realism:
    target: ">80% realistic assessments"
    measurement: "budget and timeline feasibility"
```

### 3.3 Workflow Trigger Success

```yaml
workflow_success_metrics:
  trigger_rate:
    target: ">90%"
    measurement: "conversations that successfully trigger full analysis"
    
  analysis_completion:
    target: ">95%"
    measurement: "triggered workflows that complete successfully"
    
  results_quality:
    target: ">4.0/5 average"
    measurement: "user rating of analysis quality and usefulness"
    
  time_to_results:
    target: "<20 minutes"
    measurement: "time from workflow trigger to results delivery"
```

---

## 4. Fallback Scenarios and Error Recovery

### 4.1 Technical Failure Scenarios

**AI Service Unavailable:**
```yaml
scenario: ai_service_down
detection: "API timeout or error response"
user_communication: "Our AI consultant is temporarily unavailable. You can continue with a structured questionnaire, and we'll process your responses as soon as service is restored."
fallback_action: "redirect to structured form with same questions"
recovery_process: "auto-retry AI processing when service restored"
user_experience: "seamless transition with progress preservation"
```

**Network Connectivity Issues:**
```yaml
scenario: network_interruption
detection: "connection timeout or offline status"
user_communication: "Connection lost. Your progress has been saved automatically."
fallback_action: "local storage backup with offline mode"
recovery_process: "auto-sync when connection restored"
user_experience: "offline indicator with sync status"
```

**Session Timeout:**
```yaml
scenario: session_expiry
detection: "30 minutes of inactivity"
user_communication: "Your session is about to expire. Would you like to extend it?"
fallback_action: "save state and offer session extension"
recovery_process: "restore from saved state or restart option"
user_experience: "warning with extension option"
```

### 4.2 User Experience Failures

**User Confusion or Frustration:**
```yaml
scenario: user_stuck_or_confused
detection: "repeated unclear responses or help requests"
user_communication: "I notice you might need some help. Would you like me to provide an example or connect you with a human consultant?"
fallback_action: "provide examples, simplify questions, or human handoff"
recovery_process: "adaptive questioning with more guidance"
user_experience: "supportive intervention without judgment"
```

**Incomplete or Invalid Responses:**
```yaml
scenario: insufficient_data_quality
detection: "responses too short, vague, or contradictory"
user_communication: "I want to make sure I understand correctly. Could you help me with a bit more detail about..."
fallback_action: "gentle prompting with examples and clarification"
recovery_process: "iterative refinement until sufficient quality"
user_experience: "patient guidance without pressure"
```

**User Wants to Restart or Modify:**
```yaml
scenario: user_wants_changes
detection: "explicit request to restart or modify previous answers"
user_communication: "Of course! Would you like to restart completely or go back to a specific question?"
fallback_action: "offer restart or selective editing options"
recovery_process: "maintain data integrity while allowing changes"
user_experience: "flexible control over conversation flow"
```

---

## 4.3 Session Management (Implemented Nov 30, 2025)

### Start New Conversation
Users can start fresh at any time via the sidebar button:

```yaml
feature: start_new_conversation
location: OnboardingSidebar footer
trigger: "Start New Conversation" button click
flow:
  1. User clicks button
  2. Confirmation dialog appears: "Start New Conversation?"
  3. Options: "Continue Current" (cancel) or "Start Fresh" (confirm)
  4. If confirmed:
     - Current session marked as "abandoned" via API
     - Local state reset
     - New session initialized
     - Toast: "Starting fresh conversation with Alex..."
api_endpoint: POST /api/onboarding/abandon
preserves_data: true (abandoned sessions retained for analytics)
```

### Resume Indicator
When resuming an existing session:

```yaml
feature: resume_indicator
trigger: Page load with existing active session
display:
  - Sidebar shows "Resuming previous conversation" banner
  - Toast notification on resume
  - Conversation history restored
  - Progress bar reflects saved state
user_benefit: Clear indication that work is preserved
```

### Session States
```yaml
session_states:
  active: "User currently engaged in conversation"
  paused: "User exited but can resume"
  abandoned: "User explicitly started fresh"
  completed: "All 7 stages finished, CrewAI triggered"
```

---

## 4.4 Team Awareness (Implemented Nov 30, 2025)

Alex is aware of the AI leadership team and mentions the handoff naturally:

### Alex's Team Context
```yaml
ai_personality:
  name: "Alex"
  role: "Strategic Business Consultant"
  supervisor: "Sage (Chief Strategy Officer)"
  team_members:
    - "Sage (CSO) - Strategic analysis lead"
    - "Forge (CTO) - Technical feasibility"
    - "Pulse (CGO) - Growth and desirability"
    - "Compass (CPO) - Synthesis and recommendations"
    - "Guardian (CCO) - Governance and quality"
    - "Ledger (CFO) - Financial viability"
```

### Natural Handoff Mentions
Alex mentions the team when contextually appropriate (Stage 7, completion):
- "I'll pass this to Sage and our AI leadership team for Fortune 500-quality analysis"
- "Sage and the team will generate detailed validation experiments"
- "You'll receive strategic analysis from our AI founders within minutes"

### Initial Greeting (Updated)
```
"Once we finish our conversation, I'll hand everything off to Sage, our Chief
Strategy Officer, and our AI leadership team. They'll generate Fortune 500-quality
strategic analysis, including a detailed validation roadmap and experiments
tailored to your business."
```

---

## 5. Accessibility Considerations

### 5.1 Screen Reader Compatibility

```yaml
screen_reader_support:
  conversation_flow:
    - proper heading structure (h1 → h2 → h3)
    - landmark regions (main, navigation, complementary)
    - skip links for conversation navigation
    
  message_announcements:
    - AI messages: aria-live="polite"
    - System messages: aria-live="assertive"
    - Progress updates: aria-live="polite"
    
  form_accessibility:
    - proper label associations
    - error message announcements
    - input validation feedback
    - clear instructions and help text
```

### 5.2 Motor Impairment Support

```yaml
motor_accessibility:
  input_alternatives:
    - voice input with speech-to-text
    - large click targets (minimum 44px)
    - keyboard-only navigation
    - switch control compatibility
    
  timing_considerations:
    - no time limits on responses
    - pause/resume conversation capability
    - auto-save conversation state
    - extended session timeouts
```

### 5.3 Cognitive Accessibility

```yaml
cognitive_support:
  language_simplification:
    - grade 8 reading level maximum
    - short sentences and common vocabulary
    - business terms explained in context
    - clear, direct questions
    
  memory_aids:
    - conversation summary always visible
    - previous answers easily reviewable
    - progress indicators and milestones
    - clear expectations for next steps
    
  attention_support:
    - minimal distractions in UI
    - single question focus
    - break options available
    - progress celebration
```

---

## 6. Cross-References

**Primary Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md)
- Section 1.2.5: Launch Readiness Assessment (onboarding as launch blocker)
- Lines 332-333: AI onboarding tutorial requirement
- Section 2.5: Backend & AI integration status

**Related Documentation:**
- [`onboarding-agent-integration.md`](../features/onboarding-agent-integration.md) - Technical implementation
- [`ai-conversation-interface.md`](../features/ai-conversation-interface.md) - Chat interface specification
- [`crewai-frontend-integration.md`](../engineering/crewai-frontend-integration.md) - API integration
- [`onboarding-agent-personality.md`](../features/onboarding-agent-personality.md) - AI personality design

**Implementation Status (Updated Jan 18, 2026):**
- ✅ `/onboarding/founder` page live with Two-Pass Architecture
- ✅ CrewAI backend Phase 2D complete (~85%), 18 tools implemented
- ✅ Two-Pass Architecture: `/api/chat/stream` + `/api/chat/save`
- ✅ Deterministic quality assessment (topic-based, not tool-based)
- ✅ Real-time streaming conversation interface (Vercel AI SDK)
- ✅ Multi-agent workflow integration (webhook + polling)
- ✅ Session management (start new, resume indicator)
- ✅ Team awareness (Alex → Sage handoff)
- ✅ Project creation routes to Alex (not quick wizard)
- ✅ StageReviewModal for stage transitions
- ✅ SummaryModal with Approve/Revise flow

---

**Status:** 🟢 **IMPLEMENTED** (Two-Pass Architecture)
**Business Impact:** Marketing promise of "AI-guided strategy session" now delivered
**User Impact:** Full 7-stage onboarding with session management and team handoff
**Test Coverage:** 824+ unit tests + 101 E2E specs for Alex UX features  
