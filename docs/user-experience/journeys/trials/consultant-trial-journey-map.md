---
purpose: "Complete consultant trial journey map and UX specification"
status: "active"
last_reviewed: "2026-01-22"
last_updated: "2026-01-22"
---

# Complete Consultant Trial Journey Map

**End-to-End User Experience Specification**

**Status:** Active
**Last Updated:** 2026-01-22
**Persona Reference:** [`personas/trials.md`](../../personas/trials.md#consultant-trial-consultant_trial)

---

## Document Purpose

This document maps the complete user journey for Consultant Trial users from signup through conversion to paid plan. The key differentiator from Founder Trial is the **mock client system** that lets consultants evaluate portfolio management features without involving real clients.

**Trial Promise:** "Experience the full consultant workflow with realistic mock clients"
**Conversion Target:** Consultant plan ($149/month)
**Trial Duration:** 14 days

---

## Journey Overview

The Consultant Trial journey consists of 4 phases leading to conversion:

| Phase | Focus | Key Experience | Stories |
|-------|-------|----------------|---------|
| Phase 1 | Onboarding | Practice setup, receive mock clients | US-CT01 |
| Phase 2 | Exploration | Portfolio dashboard, mock client detail | US-CT02, US-CT04 |
| Phase 3 | Conversion Trigger | Attempt real invite, see upgrade prompt | US-CT03 |
| Phase 4 | Upgrade | Complete payment, unlock full features | US-CT05 |

---

## Phase 1: Onboarding

### Step 1: Consultant Trial Signup (2-3 minutes)

```yaml
touchpoint: startupai.site/signup?plan=consultant
user_state: evaluating_platform
user_goal: start_consultant_trial
user_actions:
  - selects "Consultant" option during signup
  - fills basic info (email, name)
  - completes OAuth authentication
  - gets redirected to app.startupai.site
system_actions:
  - store trial_intent: consultant_trial
  - assign user role: consultant_trial
  - default redirect: /trial/consultant/
user_emotions: curious, evaluating_roi
pain_points:
  - unclear what trial includes
  - worried about commitment
success_metrics:
  - signup_completion_rate: >80%
  - time_to_complete: <3 minutes
```

### Step 2: Practice Setup (US-CT01) (3-5 minutes)

```yaml
touchpoint: /trial/consultant/
user_state: configuring_practice
user_goal: set_up_consulting_profile
user_actions:
  - fills practice name
  - selects specializations (strategy, ops, growth, etc.)
  - selects industries served
  - indicates years of experience
  - clicks "Start Trial"
user_emotions: professional, engaged
pain_points:
  - too many fields to fill
  - unclear why this info is needed
success_metrics:
  - setup_completion_rate: >90%
  - time_to_complete: <5 minutes
```

### Step 3: Receive Mock Clients (automatic)

```yaml
touchpoint: /consultant-dashboard (first load)
user_state: discovering_mock_clients
user_goal: understand_trial_setup
user_actions:
  - sees welcome message explaining mock clients
  - views portfolio with 2 pre-populated mock clients
  - notices trial badge with days remaining
user_emotions: curious, relieved (don't need real clients yet)
pain_points:
  - confusion about what mock clients are
  - unclear mock vs real distinction
success_metrics:
  - mock_client_visibility: 100%
  - trial_badge_visibility: 100%
```

---

## Phase 2: Exploration

### Step 4: Explore Portfolio Dashboard (US-CT02) (5-10 minutes)

```yaml
touchpoint: /consultant-dashboard
user_state: exploring_features
user_goal: understand_portfolio_management
user_actions:
  - views mock client cards with D-F-V signals
  - notices different validation stages on each client
  - explores portfolio metrics summary
  - checks trial status card
user_emotions: evaluating, impressed_or_skeptical
pain_points:
  - unclear what D-F-V signals mean
  - uncertain if mock data is realistic
success_metrics:
  - portfolio_interaction_rate: >80%
  - time_on_dashboard: >3 minutes
```

### Step 5: View Mock Client Detail (US-CT02) (5-10 minutes)

```yaml
touchpoint: /consultant/client/:mockClientId
user_state: deep_exploration
user_goal: understand_client_detail_view
user_actions:
  - clicks on mock client card
  - views client overview (business idea, stage, metrics)
  - explores Canvases tab (VPC, BMC)
  - checks Experiments tab
  - reviews Evidence tab
user_emotions: evaluating_quality, imagining_real_clients
pain_points:
  - data might look fake or unrealistic
  - unclear how this would work with real clients
success_metrics:
  - client_detail_view_rate: >70%
  - tab_exploration_rate: >50% (visit 3+ tabs)
```

### Step 6: View Trial Status (US-CT04)

```yaml
touchpoint: /consultant-dashboard (trial status card)
user_state: tracking_trial
user_goal: understand_trial_limits
user_actions:
  - views trial status card
  - sees days remaining
  - sees mock clients used (2/2)
  - sees locked features list
user_emotions: aware, mild_urgency
pain_points:
  - unclear what happens when trial ends
  - uncertain about locked features
success_metrics:
  - trial_status_view_rate: >90%
  - upgrade_cta_visibility: 100%
```

---

## Phase 3: Conversion Trigger

### Step 7: Attempt Real Client Invite (US-CT03) (1-2 minutes)

```yaml
touchpoint: /consultant-dashboard → "Add Client"
user_state: ready_for_real_clients
user_goal: invite_actual_client
user_actions:
  - clicks "Add Client" button
  - sees invite form appear
  - enters real email address
  - clicks "Send Invite"
  - sees upgrade modal (instead of invite sending)
user_emotions: ready_to_commit, slightly_frustrated
pain_points:
  - expected invite to work
  - feels blocked
success_metrics:
  - real_invite_attempt_rate: >40%
  - upgrade_modal_view_rate: 100% (of attempts)
```

### Step 8: View Upgrade Modal

```yaml
touchpoint: upgrade modal (overlay)
user_state: evaluating_upgrade
user_goal: understand_paid_value
user_actions:
  - reads feature comparison (trial vs paid)
  - sees pricing ($149/mo)
  - sees "Upgrade Now" CTA
  - either upgrades or dismisses
user_emotions: calculating_roi, decision_point
pain_points:
  - price shock
  - uncertain about ROI
success_metrics:
  - modal_read_time: >30 seconds
  - upgrade_click_rate: >20%
  - dismissal_rate: acceptable at <80%
```

---

## Phase 4: Upgrade

### Step 9: Complete Upgrade (US-CT05) (2-3 minutes)

```yaml
touchpoint: Stripe checkout → /consultant-dashboard
user_state: purchasing
user_goal: unlock_full_features
user_actions:
  - clicks "Upgrade Now"
  - completes Stripe checkout
  - waits for webhook processing
  - sees success confirmation
  - returns to dashboard
user_emotions: committed, expectant
pain_points:
  - payment friction
  - uncertain about what changes
success_metrics:
  - checkout_completion_rate: >90% (of starters)
  - webhook_processing_time: <10 seconds
```

### Step 10: Post-Upgrade Experience (US-CT06)

```yaml
touchpoint: /consultant-dashboard (paid)
user_state: paid_consultant
user_goal: start_with_real_clients
user_actions:
  - sees welcome modal
  - sees trial badge removed
  - sees mock clients converted to "sample" (archivable)
  - clicks "Add Client"
  - successfully sends real invite
user_emotions: satisfied, empowered
pain_points:
  - mock clients still visible (might want to archive)
  - need to learn real client flow
success_metrics:
  - first_real_invite_time: <24 hours
  - feature_unlock_verification: 100%

post_upgrade_ui:
  confirmation:
    toast: "Welcome to Consultant! Your upgrade is complete."
    celebration: "Confetti animation"

  welcome_modal:
    title: "Welcome to Consultant!"
    content:
      - "You can now invite real clients"
      - "Mock clients have been converted to samples"
      - "White-label settings are now available"
    cta_primary: "Invite First Client"
    cta_secondary: "Archive Sample Clients"
    cta_tertiary: "Explore Features"

  trial_badge: "Removed"
  mock_clients:
    status: "Converted to 'Sample' with archive option"
    badge: "SAMPLE"
```

### Cross-Cutting: Get Help (Any Time)

**Get Help Step (available throughout trial)**
```yaml
touchpoint: help icon / Settings > Support
user_state: needs_assistance
user_goal: get_help_with_trial_or_mock_clients
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
  - mock client behavior unclear
  - trial limitations confusing
  - need help evaluating platform
success_metrics:
  - help_access_rate: >10% of trial users
  - self_service_resolution: >50%
  - trial_to_paid_after_support: >40%

journey_reference: ../platform/support-journey-map.md

gdpr_note: "GDPR rights (data export, account deletion) apply to ALL users including trial users."

trial_specific_help:
  - "What are mock clients?"
  - "How do I invite real clients?"
  - "What's included in the Consultant plan?"
  - "How do I upgrade?"
  - "How do I export my data?"
  - "How do I delete my account?"
```

---

## Mock Client System Design

### Mock Client Properties

| Property | Mock Client 1 | Mock Client 2 |
|----------|---------------|---------------|
| Business Idea | "AI-powered meal planning app" | "B2B SaaS for construction scheduling" |
| Validation Stage | Phase 2 (Desirability Testing) | Phase 1 (Discovery Complete) |
| D-F-V Signals | D: Strong, F: Unknown, V: Unknown | D: Moderate, F: Unknown, V: Unknown |
| Canvases | VPC + BMC populated | VPC populated |
| Evidence | 3 test cards with results | 1 test card pending |

### Mock Client Behavior

| Action | Behavior |
|--------|----------|
| View client detail | Full read access |
| Start Quick Start | Allowed (creates mock project) |
| Archive client | Allowed |
| Edit client data | Not allowed (read-only) |
| Export report | Allowed (watermarked "SAMPLE") |

---

## Conversion Triggers Summary

| Trigger | Timing | Action |
|---------|--------|--------|
| Real client invite attempt | Any time | Upgrade modal |
| 3rd mock client creation | Any time | Upgrade modal |
| Trial day 7 | Automated | Email: "How's your trial going?" |
| Trial day 10 | Automated | Email: "4 days left - ready to upgrade?" |
| Trial day 13 | Automated | Email: "Trial ends tomorrow" |
| Trial expiration | Day 14 | Full-page upgrade prompt |

---

## Success Metrics Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Trial signup to onboarding complete | >90% | Conversion funnel |
| Mock client exploration rate | >70% | Users who view both mock clients |
| Real invite attempt rate | >40% | Users who try to invite during trial |
| Trial to paid conversion rate | >25% | Paying consultants / trial signups |
| Time to first real client | <48 hours post-upgrade | Analytics |

---

## Cross-References

| Document | What It Covers |
|----------|---------------|
| [`personas/trials.md`](../../personas/trials.md#consultant-trial-consultant_trial) | Consultant Trial persona definition |
| [`stories/trials.md`](../../stories/trials.md) | Consultant Trial stories (US-CT01-CT05) |
| [`consultant-journey-map.md`](../consultant/consultant-journey-map.md) | Full consultant journey (post-conversion) |
| [`journey-test-matrix.md`](../../../testing/journey-test-matrix.md) | E2E test coverage |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Initial creation - 4-phase trial journey with mock client system |
