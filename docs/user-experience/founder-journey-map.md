---
purpose: "Complete founder journey map and UX specification"
status: "active"
last_reviewed: "2026-01-21"
---

# Complete Founder Journey Map

**End-to-End User Experience Specification**

**Status:** IMPLEMENTED - Quick Start Architecture (Jan 2026)
**Last Updated:** 2026-01-21
**Cross-Reference:** [ADR-006: Quick Start Architecture](../../startupai-crew/docs/adr/006-quick-start-architecture.md)

> **Architectural Pivot (2026-01-19)**: The 7-stage AI conversation with Alex was replaced by Quick Start - a simple form that takes ~30 seconds. The Founder's Brief is now AI-generated in Phase 1. See [ADR-006](../../startupai-crew/docs/adr/006-quick-start-architecture.md).

---

## Document Purpose

This document maps the complete user journey from marketing site signup to receiving AI-generated strategic insights. Use this as a UX reference for the intended user experience and validation checklist.

**Marketing Promise:** "AI-guided strategy session" leading to "comprehensive strategic analysis"
**Implementation:** See `features/stage-progression.md` for current stage system

---

## Architecture Reference (Jan 2026)

> **SUPERSEDED**: The Two-Pass Architecture below was replaced by Quick Start (2026-01-19). See [ADR-006](../../startupai-crew/docs/adr/006-quick-start-architecture.md).

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

**Step 4: Login Page (returning users) or OAuth Authentication (30-60 seconds)**
```yaml
touchpoint: app.startupai.site/login or GitHub OAuth
user_state: authenticating
user_goal: complete_authentication_seamlessly

# Login Page Design (Updated 2026-01-21)
ui_design:
  layout: "Single-column centered (no marketing panel)"
  background: "Subtle branded gradient with grid pattern"
  logo: "Rocket icon in gradient container with shadow"
  title: "Welcome back"
  subtitle: "Sign in to continue to StartupAI"

ui_components:
  github_button:
    type: "primary"
    height: "48px (touch-friendly)"
    text: "Continue with GitHub"
    icon: "GitHub logo"
    loading_state: "Connecting to GitHub..."

  divider:
    text: "or"
    style: "horizontal line with centered text"

  email_field:
    height: "44px"
    placeholder: "you@example.com"
    autocomplete: "email"

  password_field:
    height: "44px"
    visibility_toggle: true  # Eye/EyeOff icons
    forgot_link: "Forgot password?"

  submit_button:
    type: "secondary"
    height: "44px"
    text: "Sign in"
    loading_state: "Signing in..."

  signup_link: "Don't have an account? Sign up"

user_actions:
  - clicks "Continue with GitHub" (primary) OR
  - enters email and password with visibility toggle
  - gets redirected to app.startupai.site
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
touchpoint: app.startupai.site/onboarding/founder
user_state: newly_authenticated
user_goal: submit_business_idea_quickly

# Quick Start Form Design (Updated 2026-01-21)
ui_design:
  layout: "Centered card with max-width 672px"
  card_style: "Atmospheric with gradient orbs and grid pattern"
  shadow: "shadow-xl shadow-black/[0.08]"
  border: "border border-border/60"
  animations: "Staggered reveal (reveal-1 through reveal-4)"

ui_components:
  header:
    logo: "Rocket icon in gradient container (64x64)"
    title: "Start Validating Your Idea"
    subtitle: "Describe your business idea and our AI will research the market, analyze competitors, and generate a structured brief."
    trust_indicators:
      - icon: "Sparkles"
        text: "AI-Powered"
      - icon: "Pulse dot"
        text: "30 seconds"

  business_idea_textarea:
    label: "Your Business Idea"
    required: true
    height: "140px"
    border: "2px solid, darkened for visibility"
    placeholder: "Describe your business idea here..."
    helper_text: "What problem are you solving? Who is it for? What makes your solution unique?"
    validation:
      min_length: 10
      max_length: 5000
      feedback_when_typing: "X more characters needed"
      feedback_when_valid: "Looking good!"
    character_counter:
      position: "bottom-right"
      color_at_80_percent: "amber"
      color_at_95_percent: "red"
    example_feature:
      trigger_when_empty: "Not sure where to start? See an example idea"
      trigger_after_typing: "Need inspiration? See an example"
      example_text: "A mobile app that helps busy professionals meal plan..."
      use_example_button: true

  optional_hints_section:
    type: "collapsible"
    trigger_style: "Dashed border, lightbulb icon"
    label: "Add optional hints to improve analysis (optional)"
    section_header: "Quick Hints"
    fields:
      industry:
        type: "select"
        height: "44px (touch-friendly)"
        placeholder_color: "muted-foreground/60"
        selected_color: "foreground"
        options: [SaaS, E-commerce, Fintech, Healthcare, EdTech, Marketplace, etc.]
      target_user:
        type: "select"
        height: "44px"
        options: [Enterprise, Mid-Market, SMB, Consumers, Developers, etc.]
      geography:
        type: "select"
        height: "44px"
        options: [Global, North America, Europe, APAC, etc.]
    separator: "Subtle border line before Additional Context"
    additional_context:
      type: "textarea"
      height: "80px"
      helper: "Market research, competitor names, existing traction..."

  submit_button:
    height: "56px"
    font: "font-display font-semibold"
    states:
      disabled:
        text: "Describe your idea to get started"
        style: "bg-muted text-muted-foreground opacity-60"
      enabled:
        text: "Validate My Idea"
        icon: "Rocket + ArrowRight"
        style: "gradient bg, shadow-lg, hover lift effect"
      loading:
        text: "Starting Validation..."
        subtext: "(~30 seconds)"
        icon: "Spinner"

  accessibility:
    aria_required: true
    aria_disabled_on_button: true
    sr_only_required_text: "(required)"
    focus_rings: "2px primary with offset"

user_actions:
  - enters business idea (1-3 sentences)
  - optionally expands hints section
  - optionally adds context (pitch deck notes, market info)
  - clicks "Validate My Idea"
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

> **SUPERSEDED**: The 7-stage AI conversation below was replaced by Quick Start (2026-01-19). Users now submit a Quick Start form, and the AI generates the Founder's Brief automatically in Phase 1.

<details>
<summary>Historical Reference (7-Stage Conversation - Superseded)</summary>

**Old Steps 6-11: Customer Segment Discovery through Business Stage & Goals Definition**

These steps involved a 20-25 minute AI conversation covering:
- Customer Segment Discovery (5-7 min)
- Problem/Opportunity Analysis (5-7 min)
- Solution Concept Development (5-7 min)
- Competitive Landscape Mapping (3-5 min)
- Resource Assessment (3-5 min)
- Business Stage & Goals Definition (2-3 min)

This conversation has been replaced by the Quick Start form + AI-generated Founder's Brief.

</details>

### 1.4 AI Processing & Analysis (15-20 minutes)

**Step 6: Quick Start Submission & Workflow Trigger (instant)**
```yaml
touchpoint: Quick Start form submission
user_state: idea_submitted
user_goal: start_validation_immediately
user_actions:
  - clicks "Validate My Idea" on Quick Start form
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

submission_confirmation_ui:
  transition:
    type: "inline (no page navigation)"
    animation: "form fades out, confirmation fades in"
    duration: "300ms ease-out"

  layout:
    max_width: "672px (same as form)"
    alignment: "centered"
    background: "same atmospheric card as form"

  components:
    success_icon:
      icon: "CheckCircle2"
      size: "64px"
      color: "text-green-500"
      animation: "scale-in with slight bounce"

    header:
      title: "Validation Started!"
      typography: "font-display text-2xl font-bold"
      subtitle: "Our AI team is now researching your business idea"
      subtitle_style: "text-muted-foreground"

    progress_indicator:
      type: "segmented bar"
      segments: 3
      labels: ["Researching", "Analyzing", "Generating Brief"]
      current_segment: 1
      animation: "pulse on current segment"

    time_estimate:
      text: "~15-20 minutes"
      icon: "Clock"
      style: "text-sm text-muted-foreground"

    next_steps_card:
      header: "What happens next?"
      style: "bg-muted/30 rounded-lg p-4"
      items:
        - icon: "Search"
          text: "Market research and competitor analysis"
        - icon: "FileText"
          text: "AI-generated Founder's Brief"
        - icon: "Bell"
          text: "Notification when ready for your review"

    cta_buttons:
      primary:
        text: "View Progress"
        action: "navigate to /founder-dashboard"
        icon: "ArrowRight"
      secondary:
        text: "Start Another Project"
        action: "reset form for new submission"
        variant: "outline"

  accessibility:
    aria_live: "polite"
    focus_management: "move focus to success header"
    screen_reader: "announces 'Validation started successfully'"
```

**Step 7: AI Multi-Agent Processing (15-20 minutes)**
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

progress_dashboard_ui:
  location: "/founder-dashboard (during Phase 1)"

  layout:
    type: "dashboard with hero card"
    hero_position: "top of page, full width"

  components:
    progress_hero:
      style: "gradient border, elevated shadow"
      header:
        phase_badge:
          text: "PHASE 1"
          style: "bg-primary/10 text-primary text-xs font-semibold"
        title: "Validating Your Idea"
        subtitle: "Our AI team is researching and analyzing your business"

      progress_bar:
        type: "segmented"
        segments:
          - label: "Market Research"
            status: "complete | in_progress | pending"
          - label: "Competitor Analysis"
            status: "complete | in_progress | pending"
          - label: "Brief Generation"
            status: "complete | in_progress | pending"
          - label: "Quality Check"
            status: "complete | in_progress | pending"
        animation: "shimmer on in_progress segment"

      current_activity:
        label: "Current Activity"
        text: "{agent_name} is {current_task}"
        example: "Customer Researcher is analyzing target market demographics"
        style: "text-sm text-muted-foreground"
        icon: "Sparkles (animated pulse)"

      time_remaining:
        label: "Estimated time remaining"
        format: "~X minutes"
        style: "text-sm"
        note: "(updates based on crew progress)"

    agent_activity_feed:
      header: "AI Team Activity"
      layout: "vertical timeline"
      max_visible: 5
      show_more_button: true

      activity_item:
        timestamp: "HH:MM"
        agent_name: "Customer Researcher | Competitor Analyst | Brief Generator | QA Agent"
        agent_icon: "avatar with role color"
        activity_text: "Completed market size analysis"
        status_indicator: "checkmark for complete, spinner for in_progress"

    notification_preferences:
      header: "Notify me when complete"
      options:
        - type: "browser"
          label: "Browser notification"
          default: true
        - type: "email"
          label: "Email notification"
          default: false
      style: "collapsible section"

  polling_behavior:
    interval: "10 seconds"
    endpoint: "/api/projects/{id}/status"
    updates: ["progress percentage", "current crew", "activity feed"]
    stops_when: "HITL checkpoint reached"

  accessibility:
    aria_live: "polite for progress updates"
    aria_busy: "true during active processing"
    progress_announcements: "every 25% completion"
```

### 1.5 Results Delivery & First Value (5-10 minutes)

**Step 8: Results Presentation (5-10 minutes)**
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

**Step 9: Next Steps & Action Planning (2-3 minutes)**
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

## 2. UI Component Specifications

### 2.1 Login Page Specification

> **Updated (2026-01-21)**: Redesigned following competitor best practices (Linear, Notion, Vercel, Figma).

```yaml
login_page_specification:
  location: /login

  design_principles:
    - "Single purpose: get users authenticated"
    - "No marketing content (users already decided to sign in)"
    - "Centered, distraction-free layout"
    - "Multiple auth options with clear hierarchy"

  layout:
    type: "single-column centered"
    max_width: "448px"
    background: "subtle gradient from-primary/[0.02] via-background to-accent/[0.02]"
    grid_pattern: "opacity-[0.02]"

  components:
    back_link:
      position: "top-left"
      text: "Back to home"
      icon: "ArrowLeft"
      variant: "ghost"

    logo:
      icon: "Rocket"
      size: "56px"
      style: "gradient container with shadow"

    header:
      title: "Welcome back"
      subtitle: "Sign in to continue to StartupAI"
      typography: "font-display for title"

    github_button:
      variant: "default (primary)"
      size: "lg (48px height)"
      text: "Continue with GitHub"
      icon: "GitHub"
      loading_text: "Connecting to GitHub..."

    divider:
      text: "or"
      style: "border-t with centered text"

    email_input:
      height: "44px"
      placeholder: "you@example.com"
      autocomplete: "email"

    password_input:
      height: "44px"
      visibility_toggle: true
      autocomplete: "current-password"
      forgot_link: "Forgot password?"

    submit_button:
      variant: "secondary"
      size: "lg (44px height)"
      text: "Sign in"
      loading_text: "Signing in..."

    signup_link:
      position: "below card"
      text: "Don't have an account? Sign up"

  accessibility:
    focus_indicators: "2px primary ring with offset"
    aria_labels: "on all buttons"
    error_announcements: "aria-live assertive"

  success_metrics:
    login_completion_rate: ">90%"
    time_to_login: "<30 seconds"
    error_recovery_rate: ">80%"
```

### 2.2 Quick Start Form Specification

> **Updated (2026-01-21)**: Redesigned with atmospheric styling and improved UX.

```yaml
quick_start_form_specification:
  location: /onboarding/founder

  design_principles:
    - "Distinctive, atmospheric design (not generic)"
    - "Progressive disclosure (optional hints collapsed)"
    - "Clear visual feedback on all interactions"
    - "Mobile-first touch targets (44px minimum)"

  layout:
    max_width: "672px"
    card_style:
      background: "gradient from-card via-card to-primary/[0.02]"
      border: "border-border/60"
      shadow: "shadow-xl shadow-black/[0.08]"
      overflow: "hidden (for orb effects)"

    atmospheric_elements:
      grid_pattern: "opacity-[0.03]"
      gradient_orbs:
        - position: "-top-24 -right-24"
          color: "bg-primary/10"
          size: "w-48 h-48"
          blur: "blur-3xl"
        - position: "-bottom-24 -left-24"
          color: "bg-accent/10"
          size: "w-48 h-48"
          blur: "blur-3xl"

    animations:
      type: "staggered reveal"
      classes: ["reveal-1", "reveal-2", "reveal-3", "reveal-4"]
      timing: "0.1s increments"

  components:
    header:
      logo:
        icon: "Rocket"
        size: "64px"
        style: "gradient bg, rounded-2xl, shadow-lg, subtle rotation on hover"
      title:
        text: "Start Validating Your Idea"
        typography: "font-display text-3xl md:text-4xl font-bold"
      subtitle:
        text: "Describe your business idea and our AI will research the market, analyze competitors, and generate a structured brief."
        typography: "text-base md:text-lg text-muted-foreground"
      trust_indicators:
        - icon: "Sparkles"
          text: "AI-Powered"
        - icon: "pulse dot"
          text: "30 seconds"

    business_idea_field:
      label: "Your Business Idea"
      required_indicator: "asterisk + sr-only (required)"
      helper_text: "What problem are you solving? Who is it for? What makes your solution unique?"
      textarea:
        min_height: "140px"
        border: "2px border-input/80"
        focus_border: "border-primary"
        error_border: "border-destructive + bg-destructive/5"
      validation:
        min_length: 10
        max_length: 5000
        feedback:
          empty: null
          typing: "X more characters needed (amber)"
          valid: "Looking good! (accent)"
          over_limit: "red text"
      character_counter:
        position: "bottom-right"
        colors:
          normal: "text-muted-foreground"
          at_80_percent: "text-amber-600"
          at_95_percent: "text-destructive"
          over_limit: "text-destructive font-medium"
      example_feature:
        when_empty:
          style: "full-width dashed border card"
          text: "Not sure where to start? See an example idea"
          icon: "Lightbulb"
        when_typing:
          style: "small inline link"
          text: "Need inspiration? See an example"
        expanded:
          style: "gradient background card"
          buttons: ["Use this example", "Dismiss"]

    optional_hints_section:
      trigger:
        style: "dashed border, rounded-xl"
        icon: "Lightbulb in accent bg"
        text: "Add optional hints to improve analysis"
        badge: "(optional)"
        chevron: "rotates on expand"

      content:
        section_header: "Quick Hints (uppercase, muted)"

        dropdowns:
          layout: "grid-cols-1 md:grid-cols-3"
          height: "44px (h-11)"
          border: "2px border-input/80"
          placeholder_color: "text-muted-foreground/60"
          selected_color: "text-foreground"
          focus_ring: "ring-2 ring-primary ring-offset-1"

          industry:
            label: "Industry (optional)"
            options: ["SaaS / Software", "E-commerce / Retail", "Fintech / Finance", "Healthcare / Health Tech", "Education / EdTech", "Marketplace", "Media / Content", "B2B Services", "Consumer App", "Hardware / IoT", "Other"]

          target_user:
            label: "Target User (optional)"
            options: ["Enterprise (1000+)", "Mid-Market (100-999)", "Small Business (10-99)", "Micro Business (1-9)", "Consumers (B2C)", "Prosumers / Power Users", "Developers / Technical", "Creators / Freelancers"]

          geography:
            label: "Geography (optional)"
            options: ["Global", "North America", "Europe", "Asia Pacific", "Latin America", "Middle East & North Africa", "Local / Single City"]

        separator: "border-t border-border/50"

        additional_context:
          label: "Additional Context (optional)"
          helper: "Market research, competitor names, existing traction, or any other helpful details."
          height: "80px"
          max_length: 10000

    submit_button:
      height: "56px (h-14)"
      typography: "font-display font-semibold text-base tracking-wide"
      states:
        disabled:
          text: "Describe your idea to get started"
          style: "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
          aria_disabled: true
        enabled:
          text: "Validate My Idea"
          icons: ["Rocket", "ArrowRight"]
          style: "gradient bg-primary, shadow-lg shadow-primary/25, hover:-translate-y-0.5"
        loading:
          text: "Starting Validation..."
          subtext: "(~30 seconds)"
          icon: "Loader2 animate-spin"

    help_text:
      text: "Our AI will analyze your idea and present a structured brief for your review. You'll be able to edit before proceeding."
      position: "below submit button"
      style: "text-center text-sm text-muted-foreground"

  accessibility:
    required_field: "aria-required + sr-only text"
    button_disabled: "aria-disabled + sr-only explanation"
    focus_visible: "ring-2 ring-primary ring-offset-2"
    error_messages: "role=alert, aria-live=assertive"

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

### 3.1 Authentication Success Metrics

```yaml
login_metrics:
  login_completion_rate:
    target: ">90%"
    measurement: "users who successfully authenticate"

  oauth_success_rate:
    target: ">95%"
    measurement: "GitHub OAuth completions"

  time_to_login:
    target: "<30 seconds"
    measurement: "time from page load to successful auth"

  error_recovery_rate:
    target: ">80%"
    measurement: "users who recover from login errors"
```

### 3.2 Quick Start Success Metrics

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

### 3.3 Phase 1 Analysis Quality

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

### 3.4 Workflow Trigger Success

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

### 4.1.1 Error State UI Specifications

```yaml
error_states_ui:

  ai_service_unavailable:
    trigger: "API timeout (>30s) or 5xx response"
    display_location: "inline where content would appear"

    error_card:
      style: "border-destructive/50 bg-destructive/5 rounded-lg p-6"
      icon: "AlertTriangle"
      icon_color: "text-destructive"
      title: "AI Analysis Temporarily Unavailable"
      message: "Our AI team is experiencing high demand. Your request has been queued."

      actions:
        primary:
          text: "Retry Now"
          icon: "RefreshCw"
          behavior: "attempt immediate retry"
          loading_state: "Retrying..."
        secondary:
          text: "Check Status"
          icon: "ExternalLink"
          behavior: "open status.startupai.site in new tab"

      auto_retry:
        enabled: true
        interval: "30 seconds"
        max_attempts: 3
        countdown_display: "Retrying in X seconds..."

    accessibility:
      role: "alert"
      aria_live: "assertive"

  network_connectivity:
    trigger: "navigator.onLine === false or fetch timeout"
    display_location: "toast notification + inline indicator"

    toast:
      position: "bottom-right"
      style: "bg-amber-500/10 border-amber-500/50"
      icon: "WifiOff"
      title: "Connection Lost"
      message: "Your changes are saved locally"
      duration: "persistent until reconnected"

    inline_indicator:
      location: "header bar, next to user menu"
      icon: "WifiOff"
      tooltip: "Offline - changes will sync when reconnected"
      color: "text-amber-500"

    reconnection:
      detection: "online event + successful ping"
      toast_message: "Back online! Syncing your changes..."
      sync_indicator: "spinner in header"

    accessibility:
      aria_live: "polite"
      screen_reader: "announces connection status changes"

  session_timeout:
    trigger: "25 minutes inactivity (5 min warning before 30 min expiry)"

    warning_modal:
      style: "modal with backdrop blur"
      icon: "Clock"
      title: "Session Expiring Soon"
      message: "Your session will expire in {countdown} due to inactivity."

      countdown_display:
        format: "M:SS"
        style: "text-2xl font-mono text-destructive"
        final_30_seconds: "flash animation"

      actions:
        primary:
          text: "Stay Signed In"
          behavior: "refresh session token"
        secondary:
          text: "Save & Sign Out"
          behavior: "save draft to localStorage, redirect to login"

      auto_save:
        enabled: true
        message: "Your work has been automatically saved"
        icon: "CheckCircle"

    expired_state:
      redirect: "/login?expired=true"
      login_message: "Your session expired. Please sign in to continue."
      draft_recovery: "Draft found - click to restore"

    accessibility:
      aria_modal: true
      focus_trap: true
      aria_live: "assertive for countdown"
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

---

*Last updated: 2026-01-21*
