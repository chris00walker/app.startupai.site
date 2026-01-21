---
purpose: "Complete founder journey map and UX specification"
status: "active"
last_reviewed: "2026-01-19"
---

# Complete Founder Journey Map

**End-to-End User Experience Specification**

**Status:** IMPLEMENTED - Quick Start Architecture (Jan 2026)
**Last Updated:** 2026-01-20
**Cross-Reference:** [ADR-006: Quick Start Architecture](../../startupai-crew/docs/adr/006-quick-start-architecture.md)

> **Architectural Pivot (2026-01-19)**: The 7-stage AI conversation with Alex was replaced by Quick Start - a simple form that takes ~30 seconds. The Founder's Brief is now AI-generated in Phase 1. See [ADR-006](../../startupai-crew/docs/adr/006-quick-start-architecture.md).

---

## 📋 Document Purpose

This document maps the complete user journey from marketing site signup to receiving AI-generated strategic insights. Use this as a UX reference for the intended user experience and validation checklist.

**Marketing Promise:** "AI-guided strategy session" leading to "comprehensive strategic analysis"
**Implementation:** See `features/stage-progression.md` for current stage system

---

## Architecture Reference (Jan 2026)

> **⚠️ SUPERSEDED**: The Two-Pass Architecture below was replaced by Quick Start (2026-01-19). See [ADR-006](../../startupai-crew/docs/adr/006-quick-start-architecture.md).

### Quick Start Architecture (Current)

| Component | Description |
|-----------|-------------|
| **Quick Start Form** | User enters business idea + optional context (~30 seconds) |
| **Phase 1 Auto-Start** | AI generates Founder's Brief via BriefGenerationCrew |
| **HITL Checkpoint** | `approve_discovery_output` (combined Brief + VPC approval) |

### ~~Two-Pass Flow~~ (Superseded)

<details>
<summary>Historical Reference (Two-Pass Architecture - Superseded Jan 19, 2026)</summary>

The onboarding previously used a Two-Pass Architecture for deterministic progression:

| Pass | Endpoint | Purpose |
|------|----------|---------|
| **Pass 1** | `/api/chat/stream` | LLM streams conversation (no tools) |
| **Pass 2** | `/api/chat/save` | Backend assesses quality, advances stage |

| Old Approach (Pre-Jan 2026) | New Approach (Jan 2026) |
|-----------------------------|-------------------------|
| LLM called tools (`advanceStage`, `completeOnboarding`) | Backend assesses after each message |
| Tool schemas caused hallucination errors | Deterministic topic coverage assessment |
| Unpredictable progression | Consistent 7-stage progression |

**Timing Impact:**
- **User Experience**: Unchanged (still feels like natural conversation)
- **Processing**: 2 LLM calls per message (stream + assessment)
- **Latency**: Minimal increase (~200ms for assessment)

</details>  

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

**Step 5: Quick Start Form (~30 seconds)**
```yaml
touchpoint: app.startupai.site/onboarding/quick-start
user_state: newly_authenticated
user_goal: submit_business_idea_quickly
user_actions:
  - enters business idea (1-3 sentences)
  - optionally adds context (pitch deck notes, market info)
  - clicks "Start Validation"
user_emotions: eager, focused
pain_points:
  - uncertainty about what to include
  - desire to provide more context
success_metrics:
  - form_completion_rate: >95%
  - time_to_submit: <30 seconds
  - abandonment_rate: <5%
```

> **Architectural Note**: The 7-stage AI conversation with Alex has been replaced by this Quick Start form. The Founder's Brief is now AI-generated in Phase 1 by BriefGenerationCrew.

### 1.3 ~~AI-Guided Conversation~~ → AI Analysis (15-20 minutes)

> **⚠️ SUPERSEDED**: The 7-stage AI conversation below was replaced by Quick Start (2026-01-19). Users now submit a Quick Start form, and the AI generates the Founder's Brief automatically in Phase 1.

<details>
<summary>Historical Reference (7-Stage Conversation - Superseded)</summary>

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

</details>

### 1.4 AI Processing & Analysis (15-20 minutes)

**Step 12: Quick Start Submission & Workflow Trigger (instant)**
```yaml
touchpoint: Quick Start form submission
user_state: idea_submitted
user_goal: start_validation_immediately
user_actions:
  - clicks "Start Validation" on Quick Start form
  - receives confirmation of submission
  - sees Phase 1 begin automatically
user_emotions: accomplished, anticipatory
pain_points:
  - wondering if they provided enough context
  - impatience for results
success_metrics:
  - submission_success_rate: >99%
  - phase_1_trigger_rate: >99%
  - time_to_phase_1: <5 seconds
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

## 2. Quick Start Form Specification

> **Updated (2026-01-20)**: This replaces the old "Expected AI Interactions" section. With Quick Start, there is no AI conversation - just a simple form.

### 2.1 Quick Start Form UI

```yaml
form_specification:
  location: /onboarding/founder
  components:
    business_idea:
      type: textarea
      required: true
      min_length: 10
      max_length: 5000
      placeholder: "Describe your business idea in a few sentences..."
      validation: "Please provide at least 10 characters"

    optional_hints:
      type: collapsible_section
      label: "Add optional hints to improve analysis"
      fields:
        industry:
          type: select
          options: [SaaS, E-commerce, Fintech, Healthcare, EdTech, Marketplace, etc.]
        target_user:
          type: select
          options: [Enterprise, Mid-Market, SMB, Consumers, Developers, etc.]
        geography:
          type: select
          options: [Global, North America, Europe, APAC, etc.]

    additional_context:
      type: textarea
      required: false
      max_length: 10000
      placeholder: "Any additional context..."

    submit_button:
      label: "Start Validation"
      loading_label: "Starting Validation..."
      disabled_until: business_idea.length >= 10

success_metrics:
  form_completion_rate: ">95%"
  time_to_submit: "<30 seconds"
  abandonment_rate: "<5%"
```

<details>
<summary>Historical Reference (AI Conversation - Superseded Jan 19, 2026)</summary>

### Old 2.1 AI Agent Personality & Communication Style

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

### Old 2.2 Sample AI Conversation Flow

**Opening Introduction:**
```
AI: "Hi! I'm your AI Strategy Consultant. I'm here to guide you through a structured conversation..."
```

(Truncated - see archived conversation examples)

### Old 2.3 AI Response Patterns

- Acknowledgment, clarification, and transition patterns for AI conversation
- (No longer applicable with Quick Start form)

</details>

---

## 3. Success Metrics and Completion Criteria

### 3.1 Quick Start Success Metrics

> **Updated (2026-01-20)**: Metrics now focus on Quick Start form completion, not AI conversation.

```yaml
quick_start_metrics:
  form_completion_rate:
    target: ">95%"
    measurement: "users who submit Quick Start form"

  time_to_submit:
    target: "<30 seconds"
    measurement: "time from page load to form submission"

  phase_1_trigger_rate:
    target: ">99%"
    measurement: "successful API call to /api/projects/quick-start"

  abandonment_rate:
    target: "<5%"
    measurement: "users who leave without submitting"
```

### 3.2 Phase 1 Analysis Quality

```yaml
phase_1_quality_metrics:
  brief_generation_success:
    target: ">95%"
    measurement: "BriefGenerationCrew successful completions"

  hitl_approval_rate:
    target: ">80%"
    measurement: "users who approve at approve_discovery_output checkpoint"

  time_to_checkpoint:
    target: "<15 minutes"
    measurement: "time from Quick Start submit to first HITL checkpoint"

  user_edit_rate:
    target: "30-50%"
    measurement: "users who edit brief at Stage A (healthy refinement)"
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

## 4.3 Quick Start State Management

> **Updated (2026-01-20)**: Session management simplified with Quick Start. No conversation to pause/resume.

### Project States
```yaml
project_states:
  created: "Quick Start submitted, Phase 1 starting"
  phase_1_running: "BriefGenerationCrew active"
  phase_1_hitl: "Waiting for approve_brief or approve_discovery_output"
  phase_2_running: "Desirability testing active"
  completed: "Validation journey complete"
  archived: "User archived the project"
```

### Start New Project
With Quick Start, users simply navigate to `/onboarding/founder` to start a new project:

```yaml
feature: start_new_project
location: Dashboard or direct navigation
flow:
  1. User navigates to /onboarding/founder
  2. Quick Start form loads
  3. User enters new business idea
  4. New project created on submit
note: "No conversation to abandon - each Quick Start creates a new project"
```

---

## 4.4 AI Founder Team (Unchanged)

The AI leadership team processes validation (unchanged from before Quick Start):

### AI Team Structure
```yaml
ai_founders:
  sage: "Chief Strategy Officer - leads strategic analysis"
  forge: "CTO - technical feasibility assessment"
  pulse: "CGO - growth and desirability testing"
  compass: "CPO - synthesis and recommendations"
  guardian: "CCO - governance and quality"
  ledger: "CFO - financial viability"
```

### Phase 1 Crews
```yaml
phase_1_crews:
  BriefGenerationCrew:
    agents: [GV1, S1]
    output: "Entrepreneur's Brief (AI-generated)"
  DiscoveryCrew:
    agents: [GV1, S1]
    output: "VPC data, competitor analysis"
```

### Messaging (Quick Start UI)
```yaml
quick_start_messaging:
  form_description: "Our AI will research the market, analyze competitors, and generate a structured brief."
  post_submit: "Phase 1 started - BriefGenerationCrew is analyzing your idea."
  hitl_notification: "Your Entrepreneur's Brief is ready for review."
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

**Implementation Status (Updated Jan 20, 2026):**
- ✅ Quick Start form for simple business idea input
- ✅ Phase 1 BriefGenerationCrew generates Founder's Brief from research
- ✅ Combined HITL checkpoint: `approve_discovery_output` (Brief + VPC)
- ✅ CrewAI backend: 4 Flows, 14 Crews, 43 Agents
- ✅ Multi-agent workflow integration (webhook + polling)
- ⏳ Quick Start UI implementation (pending)
- ⏳ Delete legacy 7-stage conversation code (pending)

---

**Status:** 🟢 **DOCUMENTED** (Quick Start Architecture)
**Business Impact:** ~30 second onboarding instead of 20-25 minute conversation
**User Impact:** Faster time-to-value with AI-generated Founder's Brief
**Test Coverage:** Tests need updating for Quick Start flow  
