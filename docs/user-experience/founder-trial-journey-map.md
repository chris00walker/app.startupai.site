---
purpose: "Complete founder trial journey map and UX specification"
status: "active"
last_reviewed: "2026-01-22"
---

# Complete Founder Trial Journey Map

**End-to-End User Experience Specification**

**Status:** Active
**Last Updated:** 2026-01-22
**Persona Reference:** [`user-personas.md`](./user-personas.md#founder-trial-founder_trial)

---

## Document Purpose

This document maps the complete user journey for Founder Trial users from signup through conversion to paid plan. The key differentiator from Consultant Trial is that Founder Trial users work on their **own business idea** rather than managing clients.

**Trial Promise:** "Validate your idea before you commit"
**Conversion Target:** Founder plan ($49/month)
**Trial Duration:** 14 days

---

## Journey Overview

The Founder Trial journey consists of 4 phases leading to conversion:

| Phase | Focus | Key Experience | Stories |
|-------|-------|----------------|---------|
| Phase 1 | Onboarding | Quick Start submission, first analysis | US-FT01 |
| Phase 2 | Exploration | Dashboard, canvases, results | US-FT02 |
| Phase 3 | Value Realization | HITL approvals, experiments | US-FT02 |
| Phase 4 | Upgrade | Trial expiration, payment | US-FT03 |

---

## Phase 1: Onboarding

### Step 1: Founder Trial Signup (2-3 minutes)

```yaml
touchpoint: startupai.site/signup?plan=founder
user_state: curious_prospect
user_goal: start_free_trial
user_actions:
  - lands on signup page (from pricing or homepage)
  - enters email and name
  - completes OAuth authentication (GitHub)
  - gets redirected to app.startupai.site
user_emotions: curious, cautiously_optimistic
pain_points:
  - unclear what trial includes
  - worried about hidden costs
success_metrics:
  - signup_completion_rate: >85%
  - oauth_success_rate: >95%
  - time_to_complete: <3 minutes

signup_ui:
  form_fields:
    - email: "Required"
    - name: "Required (first and last)"
    - plan: "Pre-selected: Free Trial (14 days)"

  value_props_displayed:
    - "14-day free trial"
    - "No credit card required"
    - "Full access to AI analysis"

  oauth_button:
    text: "Continue with GitHub"
    loading: "Connecting to GitHub..."
```

### Step 2: Quick Start Form (US-FT01) (~30 seconds)

```yaml
touchpoint: /onboarding/founder
user_state: newly_authenticated
user_goal: submit_business_idea_for_analysis
user_actions:
  - sees Quick Start form
  - reads instructions and example
  - enters business idea (min 10 characters)
  - optionally adds hints (industry, target, geography)
  - clicks "Validate My Idea"
user_emotions: eager, focused
pain_points:
  - uncertainty about what to include
  - fear of submitting wrong info
success_metrics:
  - form_completion_rate: >95%
  - time_to_submit: <30 seconds
  - abandonment_rate: <5%

quick_start_form_ui:
  header:
    title: "Start Validating Your Idea"
    subtitle: "Describe your business idea and our AI will research the market, analyze competitors, and generate a structured brief."
    trust_indicators:
      - "AI-Powered"
      - "30 seconds"

  business_idea_field:
    label: "Your Business Idea"
    placeholder: "Describe your business idea here..."
    helper: "What problem are you solving? Who is it for? What makes your solution unique?"
    validation:
      min_length: 10
      max_length: 5000

  optional_hints:
    collapsed_by_default: true
    fields:
      - industry: "Select dropdown"
      - target_user: "Select dropdown"
      - geography: "Select dropdown"
      - additional_context: "Textarea"

  submit_button:
    enabled: "Validate My Idea"
    disabled: "Describe your idea to get started"
    loading: "Starting Validation... (~30 seconds)"
```

### Step 3: Phase 1 Begins (automatic)

```yaml
touchpoint: /founder-dashboard (redirected after submit)
user_state: waiting_for_analysis
user_goal: understand_what_happens_next
user_actions:
  - sees submission confirmation
  - views progress indicators
  - understands timeline (~15-20 minutes)
  - optionally enables browser notifications
user_emotions: anticipatory, curious
pain_points:
  - impatience during wait
  - uncertainty if it's working
success_metrics:
  - phase_1_trigger_rate: >99%
  - user_retention_during_wait: >80%
  - notification_opt_in_rate: >30%

progress_ui:
  confirmation_message:
    title: "Validation Started!"
    subtitle: "Our AI team is now researching your business idea"

  progress_bar:
    segments: ["Researching", "Analyzing", "Generating Brief", "QA"]
    current: "Highlighted with shimmer"

  time_estimate: "~15-20 minutes"

  next_steps:
    - "Market research and competitor analysis"
    - "AI-generated Founder's Brief"
    - "Notification when ready for your review"
```

---

## Phase 2: Exploration

### Step 4: View Trial Dashboard (US-FT02) (5-10 minutes)

```yaml
touchpoint: /founder-dashboard
user_state: exploring_platform
user_goal: understand_what_platform_offers
user_actions:
  - views dashboard layout
  - sees trial status card
  - explores tabs (Canvases, Experiments, Evidence)
  - notices D-F-V signals panel
user_emotions: evaluating, impressed_or_skeptical
pain_points:
  - unfamiliar terminology (D-F-V, VPC)
  - overwhelmed by features
success_metrics:
  - dashboard_interaction_rate: >80%
  - time_on_dashboard: >5 minutes
  - tab_exploration_rate: >50%

trial_dashboard_ui:
  trial_status_card:
    position: "Top of dashboard, right sidebar"
    content:
      badge: "FREE TRIAL"
      days_remaining: "12 days left"
      progress_bar: "Visual representation of trial period"
      limits_display:
        projects: "1/3 projects created"
        workflows: "2/5 workflows this month"
        reports: "0/3 reports today"
      cta: "Upgrade to Founder"

  project_card:
    status: "Phase 1 In Progress" or "HITL Ready"
    progress: "Visual phase indicator"
    last_activity: "Timestamp"

  feature_teasers:
    locked_features:
      - "Unlimited projects" (locked icon)
      - "Priority analysis" (locked icon)
    unlock_cta: "Upgrade to unlock"
```

### Step 5: View Trial Limits (US-FT02)

```yaml
touchpoint: /founder-dashboard (trial status card)
user_state: tracking_trial
user_goal: understand_what_free_includes
user_actions:
  - views trial status card
  - sees limits (projects, workflows, reports)
  - notes days remaining
  - understands what requires upgrade
user_emotions: aware, calculating_value
pain_points:
  - unclear what counts toward limits
  - uncertainty about what happens at expiry
success_metrics:
  - trial_status_view_rate: >90%
  - limit_understanding: >80%
  - upgrade_cta_visibility: 100%

trial_limits:
  projects:
    limit: 3
    period: "lifetime of trial"
    message_at_limit: "Upgrade to create more projects"

  workflows:
    limit: 5
    period: "per month"
    message_at_limit: "Upgrade for unlimited analysis"

  reports:
    limit: 3
    period: "per day"
    message_at_limit: "Upgrade for unlimited reports"

limit_enforcement_ui:
  at_limit:
    modal:
      title: "Trial Limit Reached"
      message: "You've reached your {limit_type} limit for this trial."
      current: "{X}/{Y} {limit_type} used"
      cta_primary: "Upgrade Now"
      cta_secondary: "Maybe Later"

  near_limit:
    banner:
      message: "You have {N} {limit_type} remaining in your trial"
      cta: "Upgrade for unlimited"
```

---

## Phase 3: Value Realization

### Step 6: Review HITL Checkpoint (5-10 minutes)

```yaml
touchpoint: /approvals/{id}
user_state: reviewing_ai_output
user_goal: see_quality_of_analysis
user_actions:
  - receives notification (HITL ready)
  - navigates to approval page
  - reviews Founder's Brief
  - reviews Value Proposition Canvas
  - approves, edits, or rejects
user_emotions: evaluating, critical
pain_points:
  - output might not match expectations
  - unclear how to provide feedback
success_metrics:
  - hitl_review_rate: >85%
  - approval_rate: >70%
  - edit_rate: 20-30%
  - rejection_rate: <10%

hitl_experience:
  trial_user_context:
    message: "This is the AI-generated analysis. Review it carefully - this is what you'll get with a paid subscription."
    highlight: "Quality of output for evaluation"

  approval_options:
    approve: "Looks good - continue to Phase 2"
    edit: "Make changes - then continue"
    reject: "Start over with different approach"

  post_approval:
    message: "Great! Your validation is continuing."
    next_steps: "Phase 2 (Desirability Testing) will begin"
```

### Step 7: Experience Core Features

```yaml
touchpoint: /founder-dashboard (various tabs)
user_state: deep_exploration
user_goal: evaluate_if_platform_is_worth_paying
user_actions:
  - explores Value Proposition Canvas
  - views competitive analysis
  - reviews recommended experiments
  - sees evidence collection system
user_emotions: evaluating_roi, impressed_or_disappointed
pain_points:
  - features might be complex
  - unclear how to use outputs
success_metrics:
  - canvas_view_rate: >70%
  - experiments_view_rate: >50%
  - evidence_view_rate: >40%
  - feature_engagement_score: >3/5

trial_feature_access:
  full_access:
    - "Quick Start form"
    - "AI-generated Founder's Brief"
    - "Value Proposition Canvas"
    - "Business Model Canvas"
    - "HITL approvals"
    - "Basic experiments"

  limited_access:
    - "Advanced experiments" (1 of 3 available)
    - "Report generation" (3/day)
    - "Workflow runs" (5/month)

  locked_preview:
    - "White-label exports" (show preview, require upgrade)
    - "Priority processing" (show speed comparison)
    - "API access" (show documentation, require upgrade)
```

---

## Phase 4: Upgrade

### Step 8: Conversion Triggers

```yaml
touchpoint: various
user_state: approaching_conversion_decision
user_goal: decide_whether_to_pay
triggers:
  usage_limit_hit:
    timing: "When user hits any limit"
    action: "Upgrade modal with specific limit context"

  trial_day_7:
    timing: "Day 7 of trial"
    action: "Email: 'Halfway there - how's your validation going?'"

  trial_day_10:
    timing: "Day 10 of trial"
    action: "In-app banner + email: '4 days left'"

  trial_day_13:
    timing: "Day 13 of trial"
    action: "Urgent email + dashboard modal: 'Trial ends tomorrow'"

  trial_expiration:
    timing: "Day 14"
    action: "Full-page upgrade prompt, read-only access"

conversion_emails:
  day_7:
    subject: "How's your validation journey going?"
    content:
      - "You're halfway through your trial"
      - "Here's what you've accomplished so far"
      - "What's coming in the next 7 days"
    cta: "Continue My Trial"

  day_10:
    subject: "4 days left in your StartupAI trial"
    content:
      - "Your trial ends in 4 days"
      - "Don't lose your analysis results"
      - "Upgrade now to continue validating"
    cta: "Upgrade to Founder"
    offer: "10% off first month"

  day_13:
    subject: "Your trial ends tomorrow"
    content:
      - "Last day to save your work"
      - "Your {project_name} analysis will become read-only"
      - "Upgrade now to keep your momentum"
    cta: "Upgrade Now"
    offer: "20% off first month"
```

### Step 9: Upgrade to Founder (US-FT03) (2-3 minutes)

```yaml
touchpoint: upgrade modal → Stripe checkout
user_state: ready_to_pay
user_goal: unlock_full_access
user_actions:
  - clicks upgrade button
  - reviews plan features
  - sees pricing ($49/month)
  - completes Stripe checkout
  - sees confirmation
user_emotions: committed, expectant
pain_points:
  - payment friction
  - uncertainty about value
success_metrics:
  - checkout_start_rate: >30% (of trial users)
  - checkout_completion_rate: >85% (of starters)
  - time_to_checkout: <3 minutes

upgrade_modal_ui:
  header:
    title: "Upgrade to Founder"
    subtitle: "Continue validating without limits"

  feature_comparison:
    trial:
      - "3 projects (lifetime)"
      - "5 workflows/month"
      - "3 reports/day"
      - "Standard processing"
    founder:
      - "Unlimited projects"
      - "Unlimited workflows"
      - "Unlimited reports"
      - "Priority processing"
      - "API access"
      - "White-label exports"

  pricing:
    amount: "$49"
    period: "/month"
    billing: "Billed monthly, cancel anytime"
    guarantee: "30-day money-back guarantee"

  promo_code:
    field: "Have a promo code?"
    apply_button: "Apply"

  cta:
    primary: "Upgrade Now"
    secondary: "Continue Trial"

stripe_checkout:
  mode: "subscription"
  product: "Founder Plan"
  price: "$49/month"
  success_url: "/founder-dashboard?upgraded=true"
  cancel_url: "/founder-dashboard"
```

### Step 10: Post-Upgrade Experience

```yaml
touchpoint: /founder-dashboard (after upgrade)
user_state: newly_paid_user
user_goal: start_using_full_features
user_actions:
  - sees upgrade confirmation
  - notices trial badge removed
  - sees all limits removed
  - explores newly unlocked features
user_emotions: satisfied, empowered
pain_points:
  - unclear what's new
  - need orientation for new features
success_metrics:
  - post_upgrade_engagement: >90%
  - first_unlocked_feature_use: <24 hours
  - satisfaction_score: >4.5/5

post_upgrade_ui:
  confirmation:
    toast: "Welcome to Founder! Your upgrade is complete."
    celebration: "Confetti animation"

  trial_badge: "Removed"
  limits: "All limits removed"

  welcome_modal:
    title: "Welcome to Founder!"
    content:
      - "All limits have been removed"
      - "You now have access to unlimited analysis"
      - "Priority processing is enabled"
    cta: "Start Exploring"
    secondary: "View New Features"

  new_features_tour:
    items:
      - "Unlimited projects - Create as many validations as you need"
      - "Priority processing - Faster AI analysis"
      - "API access - Integrate with your tools"
      - "White-label exports - Professional reports"
```

### Cross-Cutting: Get Help (Any Time)

**Get Help Step (available throughout trial)**
```yaml
touchpoint: help icon / Settings > Support
user_state: needs_assistance
user_goal: get_help_with_trial_or_platform
user_actions:
  - clicks help icon (?) in header or footer
  - browses knowledge base articles
  - submits support request if needed
available_options:
  - knowledge_base: "Search help articles (US-S02)"
  - contact_support: "Submit support request (US-S01)"
  - track_tickets: "View existing requests (US-S03)"
  - data_export: "Request data export (US-S04)"
  - account_deletion: "Delete account (US-S05)"
user_emotions: confused_or_stuck, seeking_clarity
pain_points:
  - unclear trial limitations
  - need help understanding outputs
  - questions about upgrading
success_metrics:
  - help_access_rate: >10% of trial users
  - self_service_resolution: >50%
  - trial_to_paid_after_support: >40%

journey_reference: support-journey-map.md

gdpr_note: "GDPR rights (data export, account deletion) apply to ALL users including trial users."

trial_specific_help:
  - "What's included in my trial?"
  - "How do I interpret my D-F-V scores?"
  - "What happens when my trial expires?"
  - "How do I upgrade?"
  - "How do I export my data?"
  - "How do I delete my account?"
```

---

## Trial Expiration Flow

```
Day 14 Reached (Trial Expires)
           │
           ▼
    ┌──────────────┐
    │ Access Mode  │
    │  Changes     │
    └──────┬───────┘
           │
           ├─── Dashboard: Read-only
           │
           ├─── Projects: Viewable, not editable
           │
           ├─── New actions: Blocked with upgrade prompt
           │
           └─── Data: Retained for 90 days
                      │
                      ▼
               ┌──────────────┐
               │ Upgrade or   │
               │ Data Expires │
               └──────────────┘
```

---

## Success Metrics Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Trial signup completion | >85% | Completed signups / started |
| Quick Start completion | >95% | Form submissions / authenticated users |
| Trial to paid conversion | >15% | Paid upgrades / trial signups |
| Time to first value | <30 minutes | Signup to first HITL checkpoint |
| Trial engagement score | >3/5 | Feature usage during trial |
| Upgrade from limit hit | >30% | Upgrades triggered by hitting limit |

---

## Cross-References

| Document | What It Covers |
|----------|---------------|
| [`user-personas.md`](./user-personas.md#founder-trial-founder_trial) | Founder Trial persona definition |
| [`user-stories.md`](./user-stories.md#founder-trial-stories-us-ft) | Founder Trial stories (US-FT01-FT03) |
| [`founder-journey-map.md`](./founder-journey-map.md) | Full founder journey (post-upgrade) |
| [`billing-journey-map.md`](./billing-journey-map.md) | Payment and upgrade flows |
| [`journey-test-matrix.md`](../testing/journey-test-matrix.md) | E2E test coverage |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Initial creation - 4-phase founder trial journey with conversion triggers |
