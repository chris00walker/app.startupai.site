---
purpose: "Complete consultant journey map and UX specification"
status: "active"
last_reviewed: "2026-01-19"
---

# Complete Consultant Journey Map

**End-to-End User Experience Specification**

**Status:** Active
**Last Updated:** 2026-01-19
**Cross-Reference:** [`consultant-client-system.md`](../features/consultant-client-system.md) - Technical implementation

---

## Document Purpose

This document maps the complete user journey for Consultants from marketing site signup to managing a portfolio of clients. Use this as a UX reference for the intended user experience and validation checklist.

**Marketing Promise:** "Scale your consulting practice with AI-powered analysis"
**Persona Reference:** [`user-personas.md`](./user-personas.md#consultant-persona)

---

## 1. Step-by-Step Consultant Journey

### Phase 1: Discovery & Signup

**Step 1: Landing Page Discovery (0-2 minutes)**
```yaml
touchpoint: startupai.site homepage
user_state: curious_consultant
user_goal: understand_value_for_consultants
user_actions:
  - reads hero section with consultant value proposition
  - views case studies showing client portfolio management
  - clicks "For Consultants" or navigates to pricing
user_emotions: interested, evaluating_roi
pain_points:
  - unclear how AI assists consulting workflow
  - uncertain about client data privacy
  - worried about complexity for clients
success_metrics:
  - time_on_page: >90 seconds
  - scroll_depth: >70%
  - consultant_cta_click_rate: >10%
```

**Step 2: Pricing Page Evaluation (2-5 minutes)**
```yaml
touchpoint: startupai.site/pricing
user_state: evaluating_consultant_plan
user_goal: understand_consultant_plan_value
user_actions:
  - compares Founder vs Consultant plans
  - reviews client management features
  - evaluates cost vs value per client
user_emotions: calculating_roi, price_conscious
pain_points:
  - unclear how many clients they can manage
  - uncertain about white-label options
  - worried about client onboarding friction
success_metrics:
  - conversion_rate: >15% (consultant plan selection)
  - time_on_pricing: >3 minutes
  - feature_comparison_engagement: >60%
```

**Step 3: Signup Process (1-3 minutes)**
```yaml
touchpoint: startupai.site/signup
user_state: committed_to_trying
user_goal: create_consultant_account
user_actions:
  - selects Consultant plan
  - fills practice information (name, specialty, firm)
  - clicks "Continue with GitHub" OAuth
user_emotions: committed, professional
pain_points:
  - form friction
  - uncertainty about what happens next
  - concerned about data security
success_metrics:
  - signup_completion_rate: >85%
  - oauth_success_rate: >95%
  - time_to_complete: <3 minutes
```

**Step 4: OAuth Authentication (30-60 seconds)**
```yaml
touchpoint: GitHub OAuth + app.startupai.site/auth/callback
user_state: authenticating
user_goal: complete_authentication
user_actions:
  - authorizes GitHub OAuth permissions
  - gets redirected to app.startupai.site
  - waits for authentication processing
user_emotions: expectant, trusting
pain_points:
  - OAuth permission concerns
  - redirect confusion
success_metrics:
  - oauth_completion_rate: >95%
  - redirect_success_rate: >98%
  - authentication_time: <30 seconds
```

---

### Phase 2: Practice Setup (Maya Introduction)

**Step 5: Welcome & Practice Setup Introduction (1-2 minutes)**
```yaml
touchpoint: app.startupai.site/onboarding/consultant
user_state: newly_authenticated_consultant
user_goal: understand_setup_process
user_actions:
  - reads Maya (Consultant AI) introduction
  - reviews estimated time commitment (10-15 minutes)
  - confirms readiness to begin setup conversation
user_emotions: professional, ready_to_configure
pain_points:
  - unclear what information is needed
  - concerned about time investment
  - wants to skip to client management
success_metrics:
  - setup_start_rate: >90%
  - time_to_start: <2 minutes
```

**Step 6: Practice Configuration Conversation (10-15 minutes)**
```yaml
touchpoint: Maya conversation interface
user_state: configuring_practice
user_goal: set_up_consulting_profile
maya_questions:
  - "What's your consulting specialty or focus area?"
  - "What industries do you primarily serve?"
  - "How do you typically work with startup clients?"
  - "What validation frameworks do you use?"
user_actions:
  - describes consulting practice
  - specifies target industries
  - explains typical engagement model
  - sets preferences for client interactions
user_emotions: reflective, professional
pain_points:
  - questions feel too generic
  - unclear how this affects client experience
  - wants to customize more
success_metrics:
  - completion_rate: >85%
  - time_to_complete: 10-15 minutes
  - profile_completeness: >80%
```

**Step 7: Practice Setup Completion (1 minute)**
```yaml
touchpoint: setup completion screen
user_state: profile_configured
user_goal: proceed_to_dashboard
system_actions:
  - saves consultant profile
  - generates practice summary
  - redirects to consultant dashboard
user_emotions: accomplished, ready_to_work
success_metrics:
  - setup_completion_rate: >90%
  - redirect_success_rate: >98%
```

---

### Phase 3: Client Acquisition

**Step 8: Dashboard Introduction (2-3 minutes)**
```yaml
touchpoint: app.startupai.site/consultant-dashboard
user_state: first_time_on_dashboard
user_goal: understand_dashboard_layout
user_actions:
  - reviews empty portfolio state
  - locates "Add Client" button
  - explores navigation options
user_emotions: oriented, eager_to_start
pain_points:
  - empty state feels unhelpful
  - unclear next steps
  - wants guided tutorial
success_metrics:
  - add_client_cta_visibility: 100%
  - time_to_add_first_client: <5 minutes
```

**Step 9: Create Client Invite (2-3 minutes)**
```yaml
touchpoint: invite modal / add client flow
user_state: inviting_first_client
user_goal: send_invite_to_client
user_actions:
  - clicks "Add Client" button
  - fills client email and name
  - writes optional custom message
  - clicks "Send Invite"
system_actions:
  - creates consultant_clients record (status: invited)
  - generates unique invite token (30-day expiry)
  - sends email with signup link
user_emotions: proactive, hopeful
pain_points:
  - uncertain if client will receive email
  - wants to preview email template
  - worried about invite expiry
success_metrics:
  - invite_send_rate: >95%
  - email_delivery_rate: >98%
  - time_to_create_invite: <3 minutes
```

**Step 10: Client Signup via Invite (Client-side, 3-5 minutes)**
```yaml
touchpoint: client receives email → signup page
user_state: client_receiving_invite
client_goal: sign_up_and_link_to_consultant
client_actions:
  - opens email from consultant
  - clicks invite link
  - signs up with pre-populated fields
  - completes authentication
system_actions:
  - validates invite token
  - creates client account
  - links client to consultant
  - updates consultant_clients status to 'active'
consultant_emotions: waiting, checking_dashboard
success_metrics:
  - invite_acceptance_rate: >60%
  - time_to_accept: <48 hours average
  - token_validation_success: >99%
```

**Step 11: Alternative - Onboard Client in Person (20-25 minutes)**
```yaml
touchpoint: add client → "Onboard Now" option
user_state: facilitating_client_onboarding
user_goal: guide_client_through_alex_conversation
user_actions:
  - selects "Onboard Now" instead of sending invite
  - sits with client (in person or screen share)
  - facilitates 7-stage conversation with Alex
system_behavior:
  - Alex uses "client mode" language
  - references "your client" not "you"
  - data stored to client project, not consultant
user_emotions: collaborative, guiding
pain_points:
  - client may not be available immediately
  - time investment is significant
  - wants to prep client beforehand
success_metrics:
  - in_person_onboarding_completion: >90%
  - time_to_complete: 20-25 minutes
  - data_quality_score: >4.0/5
```

---

### Phase 4: Client Management (Portfolio Dashboard)

**Step 12: View Client Portfolio (ongoing)**
```yaml
touchpoint: app.startupai.site/consultant-dashboard
user_state: managing_portfolio
user_goal: monitor_all_clients_at_glance
user_actions:
  - views portfolio grid with client cards
  - scans D-F-V signals across clients
  - identifies clients needing attention
  - filters/searches for specific clients
displayed_information:
  - client name and company
  - validation stage (1-7)
  - D-F-V signal indicators
  - last activity timestamp
  - risk budget / evidence quality
user_emotions: informed, in_control
pain_points:
  - too many clients to scan
  - unclear priority ranking
  - wants notification of changes
success_metrics:
  - portfolio_load_time: <2 seconds
  - client_identification_time: <10 seconds
  - filter_usage_rate: >30%
```

**Step 13: Portfolio Metrics Review (2-3 minutes)**
```yaml
touchpoint: portfolio metrics panel
user_state: reviewing_aggregate_metrics
user_goal: understand_portfolio_health
displayed_metrics:
  - total active clients
  - clients by validation stage
  - average D-F-V scores
  - clients requiring attention
user_actions:
  - reviews aggregate statistics
  - identifies patterns across portfolio
  - plans client outreach priorities
user_emotions: analytical, strategic
success_metrics:
  - metrics_engagement_rate: >50%
  - time_reviewing_metrics: >1 minute
```

---

### Phase 5: Client Support (Progress Monitoring)

**Step 14: View Client Detail (5-10 minutes per client)**
```yaml
touchpoint: client detail page
user_state: reviewing_specific_client
user_goal: understand_client_validation_status
user_actions:
  - clicks client card from portfolio
  - reviews Overview tab with summary
  - explores Canvases tab (VPC, BMC)
  - checks Experiments tab for validation tests
  - reviews Evidence tab for collected data
displayed_information:
  - full validation progress
  - AI analysis results
  - hypothesis testing status
  - evidence quality indicators
user_emotions: focused, consulting
pain_points:
  - information overload
  - unclear what to advise client
  - wants executive summary
success_metrics:
  - detail_page_engagement: >70%
  - tab_navigation_rate: >50%
  - time_per_client: 5-10 minutes
```

**Step 15: Monitor HITL Checkpoints (as needed)**
```yaml
touchpoint: client approvals view
user_state: monitoring_client_checkpoints
user_goal: track_client_approval_decisions
user_actions:
  - views pending approvals for all clients
  - identifies stalled client workflows
  - follows up with clients on pending items
displayed_information:
  - pending approval count per client
  - approval age (days waiting)
  - approval type and content preview
user_emotions: attentive, proactive
pain_points:
  - can't approve on client's behalf
  - wants notification of stalled approvals
  - unclear why client hasn't approved
success_metrics:
  - pending_approval_visibility: 100%
  - follow_up_rate: >60%
```

---

### Phase 6: Lifecycle Management

**Step 16: Archive Inactive Client (2-3 minutes)**
```yaml
touchpoint: settings → clients tab
user_state: managing_client_lifecycle
user_goal: hide_inactive_client_from_portfolio
user_actions:
  - navigates to Settings → Clients tab
  - selects client to archive
  - clicks "Archive Client"
  - confirms action
system_behavior:
  - adds entry to archived_clients table
  - hides client from portfolio view
  - client's data is UNCHANGED
user_emotions: organized, tidying
pain_points:
  - worried about losing access to data
  - unclear how to restore later
  - wants bulk archive option
success_metrics:
  - archive_completion_rate: >95%
  - data_integrity: 100% (client data unchanged)
```

**Step 17: Restore Archived Client (1-2 minutes)**
```yaml
touchpoint: settings → clients tab (show archived)
user_state: restoring_client_relationship
user_goal: bring_archived_client_back_to_portfolio
user_actions:
  - toggles "Show archived clients"
  - selects archived client
  - clicks "Restore Client"
system_behavior:
  - removes entry from archived_clients
  - client appears in portfolio again
user_emotions: reconnecting, organized
success_metrics:
  - restore_completion_rate: >95%
  - time_to_restore: <2 minutes
```

**Step 18: Handle Client Unlink (client-initiated)**
```yaml
touchpoint: notification / dashboard update
user_state: client_has_unlinked
user_goal: acknowledge_relationship_end
system_behavior:
  - client removes link via their Settings
  - consultant_clients record updated
  - client removed from consultant's portfolio
consultant_actions:
  - notices client no longer in portfolio
  - may reach out to client externally
user_emotions: surprised, accepting
pain_points:
  - no notification of unlink
  - unclear why client unlinked
  - wants feedback option
success_metrics:
  - unlink_notification_rate: (future feature)
```

---

## 2. Expected AI Interactions (Maya)

### 2.1 Maya Personality & Communication Style

```yaml
ai_personality:
  role: "Practice Setup Assistant"
  name: "Maya"
  tone: "Professional, efficient, consultant-friendly"
  communication_style:
    - respects consultant's expertise
    - asks focused configuration questions
    - explains how settings affect client experience
    - acknowledges business context

expertise_demonstration:
  - references consulting industry practices
  - understands client management workflows
  - connects profile settings to platform features
```

### 2.2 Sample Maya Conversation Flow

**Opening Introduction:**
```
Maya: "Welcome to StartupAI! I'm Maya, and I'll help you set up your consulting practice profile.

This will take about 10-15 minutes. The information you provide helps us customize the platform for your clients and ensures you get the most relevant insights.

Ready to begin?"
```

**Practice Configuration:**
```
Maya: "What's your primary consulting specialty or focus area?"

[Consultant responds: "Early-stage B2B SaaS startups"]

Maya: "Great! B2B SaaS is a strong niche. The AI analysis will prioritize market validation and product-market fit metrics for your clients.

What industries do you typically serve? This helps us tailor competitive analysis."
```

---

## 3. Success Metrics and Completion Criteria

### 3.1 Consultant Acquisition Metrics

```yaml
acquisition_success_metrics:
  signup_conversion:
    target: ">15% from pricing page"
    measurement: "consultant plan selections / pricing visits"

  practice_setup_completion:
    target: ">85%"
    measurement: "consultants completing Maya conversation"

  time_to_first_client:
    target: "<24 hours"
    measurement: "time from signup to first invite sent"
```

### 3.2 Portfolio Management Metrics

```yaml
portfolio_success_metrics:
  client_invite_acceptance:
    target: ">60%"
    measurement: "accepted invites / sent invites"

  portfolio_engagement:
    target: ">3 logins per week"
    measurement: "consultant dashboard visits"

  client_detail_depth:
    target: ">50% tab navigation"
    measurement: "consultants viewing multiple tabs per client"
```

### 3.3 Client Success Metrics

```yaml
client_success_metrics:
  client_onboarding_completion:
    target: ">80%"
    measurement: "invited clients completing 7-stage onboarding"

  validation_progression:
    target: ">70% reach Stage 4+"
    measurement: "clients progressing beyond initial stages"

  hitl_approval_rate:
    target: ">90%"
    measurement: "approvals completed within 7 days"
```

---

## 4. Fallback Scenarios and Error Recovery

### 4.1 Invite Delivery Issues

```yaml
scenario: invite_email_not_received
detection: "client reports not receiving email"
consultant_actions:
  - check spam folder guidance
  - use "Resend Invite" feature (max 3 times)
  - verify email address spelling
fallback: "share direct signup link with invite token"
```

### 4.2 Client Stuck in Onboarding

```yaml
scenario: client_abandons_onboarding
detection: "client in portfolio with 0% completion for >7 days"
consultant_actions:
  - reach out to client externally
  - offer to facilitate in-person session
  - provide guidance on expected time commitment
system_support: "session resume capability preserves progress"
```

### 4.3 Invite Token Expiry

```yaml
scenario: invite_token_expired
detection: "client clicks link after 30 days"
system_behavior: "shows expiry message with consultant contact"
resolution: "consultant creates new invite for client"
```

---

## 5. Cross-References

| Document | Relationship |
|----------|-------------|
| [`user-personas.md`](./user-personas.md#consultant-persona) | Consultant persona definition |
| [`user-stories.md`](./user-stories.md#consultant-stories-us-c) | Consultant user stories |
| [`consultant-client-system.md`](../features/consultant-client-system.md) | Technical implementation |
| [`api-consultant.md`](../specs/api-consultant.md) | API specification |
| [`founder-journey-map.md`](./founder-journey-map.md) | Founder journey (client experience) |

---

## 6. Implementation Status

| Phase | Status | E2E Test Coverage |
|-------|--------|-------------------|
| Discovery & Signup | Implemented | `01-login.spec.ts` |
| Practice Setup | Implemented | `09-consultant-practice-setup.spec.ts` |
| Client Acquisition | Implemented | `10-consultant-client-onboarding.spec.ts` |
| Portfolio Dashboard | Implemented | `06-consultant-portfolio.spec.ts` |
| Client Support | Implemented | `06-consultant-portfolio.spec.ts` |
| Lifecycle Management | Implemented | Gap - needs test |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-19 | Initial creation - 6-phase consultant journey specification |
