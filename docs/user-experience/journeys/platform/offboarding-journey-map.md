---
purpose: "Complete offboarding journey map for user lifecycle exit"
status: "active"
last_reviewed: "2026-01-22"
---

# Complete Offboarding Journey Map

**End-to-End User Experience Specification**

**Status:** Active
**Last Updated:** 2026-01-22
**Persona Reference:** Founder, Consultant (paid users only)

---

## Document Purpose

This document maps the complete user journey for users leaving the platform, including subscription cancellation, data retention, account reactivation, and win-back flows. This is a **critical lifecycle journey** that affects retention metrics and user trust.

**Offboarding Promise:** "Leave easily, return anytime"
**Retention Target:** <5% monthly churn

---

## Journey Overview

The Offboarding journey consists of 5 phases covering the complete exit lifecycle:

| Phase | Focus | Key Workflows | Stories |
|-------|-------|---------------|---------|
| Phase 1 | Cancellation | Subscription cancellation with save attempt | US-O01 |
| Phase 2 | Exit Survey | Capture feedback and reasons | US-O02 |
| Phase 3 | Data Retention | Explain what happens to data | US-O03 |
| Phase 4 | Reactivation | Allow users to return | US-O04 |
| Phase 5 | Win-Back | Re-engage churned users | US-O05 |

---

## Offboarding Triggers

Users can enter the offboarding journey from multiple scenarios:

```
Voluntary Churn (User-Initiated)
    │
    ├─ Settings → Billing → "Cancel Subscription"
    │
    ├─ Trial expiration without upgrade
    │
    └─ Account deletion (see ../platform/support-journey-map.md)

Involuntary Churn (Payment-Related)
    │
    ├─ Payment failure (see ../platform/billing-journey-map.md)
    │
    └─ Credit card expiration

Natural Completion
    │
    └─ Validation journey complete, no further need
```

---

## Phase 1: Cancellation

### Step 1: Access Cancellation (US-O01)

```yaml
touchpoint: /settings/billing
user_state: considering_cancellation
user_goal: find_cancellation_option
user_actions:
  - navigates to Settings → Billing
  - scrolls past subscription details
  - finds "Cancel Subscription" link
user_emotions: dissatisfied, determined
pain_points:
  - cancellation hidden or hard to find (dark pattern fear)
  - unclear what cancellation means
success_metrics:
  - cancellation_findability: <30 seconds
  - no_dark_patterns: 100% compliance

cancellation_access_ui:
  location: "/settings/billing (bottom section)"
  visibility: "Always visible, not hidden"

  current_plan_display:
    plan_name: "Founder" or "Consultant"
    price: "$49/mo" or "$149/mo"
    next_billing: "January 15, 2026"
    status: "Active"

  cancel_link:
    text: "Cancel subscription"
    style: "text-muted-foreground, underline on hover"
    location: "Below plan details, clearly visible"
    note: "Not buried in menus or requiring support contact"
```

### Step 2: Cancellation Confirmation (US-O01)

```yaml
touchpoint: /settings/billing/cancel
user_state: confirming_cancellation
user_goal: understand_impact_before_confirming
user_actions:
  - clicks "Cancel Subscription"
  - views cancellation impact modal
  - considers retention offer (if any)
  - decides to proceed or stay
user_emotions: resolved_or_wavering
pain_points:
  - feeling manipulated by retention tricks
  - unclear what happens to data
success_metrics:
  - save_rate: 15-25% (users who change mind)
  - user_satisfaction_with_process: >4/5
  - no_forced_friction: true

cancellation_modal_ui:
  step_1_retention_attempt:
    title: "Before you go..."
    tone: "Respectful, not guilt-tripping"

    value_reminder:
      header: "Here's what you'll lose access to:"
      items:
        - "AI-powered validation analysis"
        - "X projects with analysis results"
        - "Canvas tools (VPC, BMC)"
        - "Evidence collection and tracking"

    alternative_offers:
      pause_option:
        label: "Pause instead of cancel"
        description: "Keep your data, skip next 2 billing cycles"
        cta: "Pause for 2 months"

      downgrade_option:
        condition: "If Consultant user"
        label: "Downgrade to Founder"
        description: "Keep access at lower price ($49/mo)"
        cta: "Downgrade to Founder"

      discount_option:
        condition: "If user hasn't received before"
        label: "Stay at 30% off"
        description: "Get 3 months at $34.30/mo"
        cta: "Apply Discount"

    proceed_buttons:
      keep: "Keep My Subscription"
      continue_cancel: "Continue with cancellation"

  step_2_final_confirmation:
    title: "Confirm Cancellation"

    timeline:
      immediate: "You can continue using StartupAI until {end_date}"
      at_end_date: "Your access will be downgraded to read-only (30-day grace period)"
      after_day_30: "Data retained in cold storage (days 31-90)"
      after_day_90: "Data permanently deleted (irreversible)"

    data_retention:
      summary: "Your data will be kept for 90 days total"
      detail: "Days 0-30: Read-only access. Days 31-90: No access, data retained. After day 90: Data purged."

    confirm_button:
      text: "Cancel My Subscription"
      style: "destructive"

    cancel_button:
      text: "Keep My Subscription"
      style: "primary"
```

### Step 3: Cancellation Processed (US-O01)

```yaml
touchpoint: /settings/billing (post-cancellation)
user_state: cancelled
user_goal: confirm_cancellation_successful
user_actions:
  - sees confirmation message
  - receives confirmation email
  - notes end date for access
user_emotions: relieved, possibly_regretful
pain_points:
  - unclear if cancellation worked
  - confusion about remaining access
success_metrics:
  - cancellation_success_rate: 100%
  - confirmation_email_delivery: <60 seconds
  - user_understands_timeline: >95%

post_cancellation_ui:
  banner:
    style: "amber warning banner"
    message: "Your subscription has been cancelled"
    detail: "You have access until {end_date}"
    cta: "Resubscribe" (always available)

  billing_section:
    status: "Cancelled"
    access_until: "{end_date}"
    auto_renew: "Off"

confirmation_email:
  subject: "Your StartupAI subscription has been cancelled"
  content:
    - "We're sorry to see you go"
    - "Access continues until {end_date} (30-day grace period with read-only access)"
    - "Your data is retained for 90 days total, then permanently deleted"
    - "Reactivate anytime at startupai.site/reactivate"
    - exit_survey_link: "Help us improve (optional)"
```

---

## Phase 2: Exit Survey

### Step 4: Complete Exit Survey (US-O02)

```yaml
touchpoint: /feedback/exit or email link
user_state: providing_feedback
user_goal: share_reason_for_leaving
user_actions:
  - sees exit survey prompt (modal or email)
  - selects primary reason
  - optionally provides details
  - submits feedback
user_emotions: helpful, venting, or indifferent
pain_points:
  - survey too long
  - reasons don't match their situation
success_metrics:
  - survey_completion_rate: >30%
  - actionable_feedback_rate: >50%
  - avg_completion_time: <2 minutes

exit_survey_ui:
  presentation:
    inline: "After cancellation confirmation"
    email: "Sent 1 hour after cancellation"

  questions:
    primary_reason:
      type: "single_select"
      required: true
      question: "What's the main reason you're cancelling?"
      options:
        - value: "too_expensive"
          label: "Too expensive"
          follow_up: "What price would work for you?"

        - value: "not_useful"
          label: "Didn't find it useful"
          follow_up: "What did you expect that we didn't deliver?"

        - value: "competitor"
          label: "Switching to another tool"
          follow_up: "Which tool? (optional)"

        - value: "project_ended"
          label: "My project/validation ended"
          follow_up: null

        - value: "no_time"
          label: "Don't have time to use it"
          follow_up: null

        - value: "technical_issues"
          label: "Too many technical issues"
          follow_up: "What issues did you experience?"

        - value: "other"
          label: "Other"
          follow_up: "Please explain (optional)"

    nps:
      type: "scale_0_10"
      optional: true
      question: "How likely are you to recommend StartupAI?"

    open_feedback:
      type: "textarea"
      optional: true
      question: "Anything else you'd like to share?"
      max_length: 1000

  submit:
    button: "Submit Feedback"
    skip: "Skip survey"

  thank_you:
    message: "Thank you for your feedback"
    action_taken: "Your feedback will help us improve"
```

---

## Phase 3: Data Retention

### Step 5: Understand Data Retention (US-O03)

```yaml
touchpoint: /help/articles/data-retention or cancellation modal
user_state: concerned_about_data
user_goal: understand_what_happens_to_data
user_actions:
  - reads data retention notice
  - understands timeline
  - knows reactivation options
user_emotions: cautious, rights_aware
pain_points:
  - unclear retention period
  - worried about data loss
success_metrics:
  - retention_notice_visibility: 100%
  - user_understanding: >90%

data_retention_policy:
  timeline:
    day_0_to_30:
      status: "Grace period"
      access: "Read-only (can view but not run new analysis)"
      data: "All data intact"
      reactivation: "Instant - just resubscribe"

    day_31_to_90:
      status: "Retention period"
      access: "No access"
      data: "All data retained in cold storage"
      reactivation: "Restore within 24 hours of resubscription"

    after_day_90:
      status: "Purge period"
      access: "No access"
      data: "Data queued for permanent deletion"
      reactivation: "Start fresh (no data restored)"

  what_is_retained:
    - "Profile information"
    - "All projects and canvases"
    - "Experiments and evidence"
    - "Analysis results"
    - "Activity history"

  what_is_deleted_immediately:
    - "Active sessions"
    - "Cached data"

  legal_retention:
    - "Billing records: 7 years (tax compliance)"
    - "Audit logs: 3 years (compliance)"

retention_notice_ui:
  displayed_at:
    - "Cancellation confirmation modal"
    - "Post-cancellation dashboard banner"
    - "Cancellation confirmation email"
    - "/help/articles/data-retention"

  content:
    title: "What happens to your data"
    sections:
      - header: "First 30 days"
        body: "Read-only access. Resubscribe anytime to restore full access instantly."
      - header: "30-90 days"
        body: "No access, but data is retained. Resubscribe to restore within 24 hours."
      - header: "After 90 days"
        body: "Data is permanently deleted. You can start fresh with a new account."
```

---

## Phase 4: Reactivation

### Step 6: Reactivate Account (US-O04)

```yaml
touchpoint: /reactivate or /settings/billing
user_state: returning_user
user_goal: restore_access_and_data
user_actions:
  - receives win-back email or decides to return
  - navigates to reactivation page
  - selects plan
  - completes payment
  - regains access
user_emotions: hopeful, motivated
pain_points:
  - worried data is lost
  - payment friction
success_metrics:
  - reactivation_success_rate: >95%
  - time_to_reactivation: <5 minutes
  - data_restoration_rate: 100% (within 90 days)

reactivation_flow:
  entry_points:
    - "Email link from win-back campaign"
    - "Direct URL: /reactivate"
    - "Login → sees 'Reactivate' CTA on dashboard"

  reactivation_page_ui:
    header:
      title: "Welcome Back!"
      subtitle: "Your data is waiting for you"

    data_status:
      within_30_days:
        message: "Your {X} projects are ready and waiting"
        restoration: "Instant access upon resubscription"

      30_to_90_days:
        message: "Your data is in cold storage"
        restoration: "Restored within 24 hours of resubscription"

      after_90_days:
        message: "Your previous data has been deleted"
        restoration: "Start fresh with a new project"

    plan_selection:
      previous_plan:
        highlighted: true
        label: "Your previous plan"
        badge: "Recommended"

      alternative_plans:
        listed: true
        note: "You can change plans anytime"

    special_offer:
      condition: "If eligible for win-back discount"
      display: "Discount automatically applied"
      message: "Welcome back! 30% off your first month"

    payment_form:
      saved_method: "Use saved card ending in {last4}"
      new_method: "Add new payment method"
      submit: "Reactivate My Account"

post_reactivation:
  immediate:
    - "Access restored"
    - "Dashboard shows all projects"
    - "Subscription active"

  confirmation_email:
    subject: "Welcome back to StartupAI!"
    content:
      - "Your account is reactivated"
      - "All your data has been restored"
      - "Pick up where you left off"
```

---

## Phase 5: Win-Back

### Step 7: Win-Back Campaign (US-O05)

```yaml
touchpoint: email
user_state: churned
user_goal: (platform goal: re-engage user)
user_actions:
  - receives win-back email
  - considers returning
  - clicks reactivation link (or ignores)
user_emotions: varied (busy, moved_on, or reconsidering)
pain_points:
  - email might feel spammy
  - offer might not be compelling
success_metrics:
  - email_open_rate: >25%
  - click_through_rate: >5%
  - reactivation_from_winback: >3%

winback_email_sequence:
  email_1:
    timing: "Day 7 after cancellation"
    subject: "We miss you at StartupAI"
    tone: "Friendly, no pressure"
    content:
      - "Just checking in"
      - "Your projects are waiting"
      - "Any feedback on how we can improve?"
    cta: "View Your Projects"
    offer: null

  email_2:
    timing: "Day 30 after cancellation"
    subject: "Your data is safe (for now)"
    tone: "Informative, slight urgency"
    content:
      - "Your data will be retained for 60 more days"
      - "After that, it will be permanently deleted"
      - "Reactivate to keep your work"
    cta: "Reactivate Now"
    offer: "10% off first month back"

  email_3:
    timing: "Day 60 after cancellation"
    subject: "Last chance: Your data will be deleted in 30 days"
    tone: "Urgent but respectful"
    content:
      - "Final reminder about data deletion"
      - "Your {X} projects will be permanently deleted"
      - "This is not recoverable"
    cta: "Save My Data"
    offer: "30% off first 3 months"

  email_4:
    timing: "Day 90 after cancellation"
    subject: "Your StartupAI data has been deleted"
    tone: "Final, door open"
    content:
      - "Your data has been deleted as scheduled"
      - "If you ever want to start fresh, we're here"
      - "No hard feelings - good luck with your venture"
    cta: "Start Fresh"
    offer: "20% off new subscription"

unsubscribe:
  option: "Unsubscribe from these emails"
  scope: "Stops win-back emails only"
  respected: "Immediately honored"
```

---

## Lifecycle State Diagram

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  Active  │───>│Cancelled │───>│Grace     │───>│Retention │ │
│  Paid    │    │(Day 0)   │    │(Day 1-30)│    │(Day31-90)│ │
└──────────┘    └──────────┘    └──────────┘    └──────────┘ │
     ▲               │               │               │        │
     │               ▼               ▼               ▼        │
     │          ┌──────────┐    ┌──────────┐    ┌──────────┐ │
     └──────────│Reactivate│<───│Reactivate│<───│Reactivate│ │
                │(Instant) │    │(Instant) │    │(24hr)    │ │
                └──────────┘    └──────────┘    └──────────┘ │
                                                     │        │
                                                     ▼        │
                                                ┌──────────┐  │
                                                │ Purged   │  │
                                                │(Day 90+) │  │
                                                └────┬─────┘  │
                                                     │        │
                                                     └────────┘
                                                  (Start Fresh)
```

---

## Success Metrics Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monthly churn rate | <5% | Cancellations / active subscribers |
| Cancellation save rate | 15-25% | Users who stay after seeing retention offer |
| Exit survey completion | >30% | Surveys completed / cancellations |
| Reactivation rate (30 days) | >10% | Users who reactivate within first month |
| Win-back campaign success | >3% | Churned users who reactivate from email |
| Data retention compliance | 100% | Data handled per stated policy |

---

## Cross-References

| Document | What It Covers |
|----------|---------------|
| [`roles/role-definitions.md`](../../roles/role-definitions.md) | Role definitions |
| [`stories/platform.md`](../../stories/platform.md) | Offboarding user stories (US-O01-O05) |
| [`billing-journey-map.md`](../platform/billing-journey-map.md) | Payment failure flows |
| [`support-journey-map.md`](../platform/support-journey-map.md) | Account deletion (GDPR) |
| [`journey-test-matrix.md`](../../../testing/journey-test-matrix.md) | E2E test coverage |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Initial creation - 5-phase offboarding journey with win-back sequence |
