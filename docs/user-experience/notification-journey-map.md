---
purpose: "Complete notification journey map for all communication touchpoints"
status: "active"
last_reviewed: "2026-01-22"
---

# Complete Notification Journey Map

**End-to-End User Experience Specification**

**Status:** Active
**Last Updated:** 2026-01-22
**Persona Reference:** All user types (Founder, Consultant, Trial, Admin)

---

## Document Purpose

This document maps the complete notification system including in-app notifications, email notifications, preferences management, and escalation flows. This is a **cross-cutting journey** that affects all other user journeys.

**Notification Promise:** "Know what matters, when it matters"
**Design Principle:** "Inform without overwhelming"

---

## Journey Overview

The Notification journey consists of 5 phases covering all communication touchpoints:

| Phase | Focus | Key Workflows | Stories |
|-------|-------|---------------|---------|
| Phase 1 | In-App Notifications | Real-time alerts and badges | US-N01 |
| Phase 2 | Email Notifications | Transactional and lifecycle emails | US-N02 |
| Phase 3 | Preferences | User control over notifications | US-N03 |
| Phase 4 | Escalation | Time-sensitive alerts for aging items | US-N04 |
| Phase 5 | Unsubscribe | Email opt-out management | US-N05 |

---

## Notification Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION CATEGORIES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRANSACTIONAL (Cannot unsubscribe)                            │
│  ├─ Account security (password reset, 2FA)                     │
│  ├─ Payment confirmations                                       │
│  ├─ Subscription changes                                        │
│  └─ Legal notices (ToS updates)                                │
│                                                                 │
│  PRODUCT (Configurable)                                         │
│  ├─ HITL approvals ready                                        │
│  ├─ Phase completion                                            │
│  ├─ Analysis results                                            │
│  └─ Client activity (Consultant)                               │
│                                                                 │
│  MARKETING (Opt-out available)                                  │
│  ├─ Product updates                                             │
│  ├─ Tips and best practices                                     │
│  └─ Case studies                                                │
│                                                                 │
│  SYSTEM (Admin only)                                            │
│  ├─ Platform health alerts                                      │
│  ├─ User escalations                                            │
│  └─ Error notifications                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: In-App Notifications

### Step 1: Receive In-App Notification (US-N01)

```yaml
touchpoint: dashboard (header notification bell)
user_state: using_platform
user_goal: stay_informed_without_interruption
user_actions:
  - sees notification badge
  - clicks notification bell
  - views notification list
  - clicks notification to navigate
user_emotions: curious, attentive
pain_points:
  - too many notifications
  - notifications not relevant
success_metrics:
  - notification_read_rate: >60%
  - notification_click_rate: >30%
  - notification_relevance_rating: >4/5

notification_bell_ui:
  location: "Header, right side, near user menu"
  badge:
    unread_count: "Number displayed (max '9+')"
    color: "Red when unread, gray when all read"
    animation: "Pulse on new notification"

  dropdown:
    width: "320px"
    max_height: "400px"
    header: "Notifications"
    mark_all_read: "Mark all as read"

  notification_item:
    structure:
      icon: "Category icon (checkmark, alert, bell)"
      title: "Brief description"
      timestamp: "Relative time (2h ago)"
      read_indicator: "Blue dot for unread"
    click_action: "Navigate to relevant page"

  empty_state:
    message: "No notifications"
    subtext: "You're all caught up!"

notification_types:
  hitl_ready:
    title: "Approval needed"
    message: "Your Founder's Brief is ready for review"
    icon: "CheckCircle (amber)"
    action: "→ /approvals/{id}"
    priority: "high"

  phase_complete:
    title: "Phase 1 complete"
    message: "Discovery analysis is ready"
    icon: "Flag (green)"
    action: "→ /founder-dashboard"
    priority: "medium"

  client_activity:
    title: "Client submitted Quick Start"
    message: "Acme Corp started their validation"
    icon: "User (blue)"
    action: "→ /consultant/client/{id}"
    priority: "medium"
    role: "consultant"

  payment_success:
    title: "Payment received"
    message: "Your subscription has been renewed"
    icon: "CreditCard (green)"
    action: "→ /settings/billing"
    priority: "low"

  system_alert:
    title: "Analysis delayed"
    message: "Your analysis is taking longer than expected"
    icon: "AlertTriangle (amber)"
    action: "→ /founder-dashboard"
    priority: "high"
```

### Step 2: Real-Time Updates

```yaml
touchpoint: active session
user_state: working_in_app
user_goal: see_updates_without_refresh
implementation:
  technology: "Supabase Realtime subscriptions"
  channel: "user:{user_id}:notifications"

realtime_behavior:
  new_notification:
    - "Badge count increments"
    - "Subtle animation on bell"
    - "Optional browser notification (if permitted)"

  browser_notification:
    permission: "Requested on first HITL event"
    format:
      title: "StartupAI"
      body: "{notification title}"
      icon: "StartupAI logo"
      click_action: "Focus tab and navigate"

  preference_controlled:
    setting: "Enable browser notifications"
    default: false
    prompt_timing: "After first Quick Start submission"
```

---

## Phase 2: Email Notifications

### Step 3: Receive Email Notification (US-N02)

```yaml
touchpoint: user's email inbox
user_state: outside_platform
user_goal: stay_informed_when_away
user_actions:
  - receives email
  - reads subject and preview
  - decides to open or ignore
  - clicks CTA to return to platform
user_emotions: varies_by_urgency
pain_points:
  - email goes to spam
  - too many emails
  - unclear what's urgent
success_metrics:
  - email_delivery_rate: >98%
  - email_open_rate: >40%
  - email_click_rate: >15%

email_templates:
  hitl_ready:
    subject: "Action needed: Your {checkpoint_name} is ready for review"
    timing: "15 minutes after in-app notification (if not viewed)"
    content:
      greeting: "Hi {first_name},"
      body: "Your {project_name} has reached a checkpoint that needs your review."
      preview: "Quick summary of what's ready"
      cta: "Review Now"
      urgency: "high"

  phase_complete:
    subject: "Phase {N} complete for {project_name}"
    timing: "Immediate"
    content:
      greeting: "Hi {first_name},"
      body: "Great news! Phase {N} analysis is complete for {project_name}."
      summary: "Key findings bullet points"
      cta: "View Results"
      urgency: "medium"

  welcome:
    subject: "Welcome to StartupAI - Let's validate your idea"
    timing: "Immediately after signup"
    content:
      greeting: "Welcome, {first_name}!"
      body: "You're one step closer to validating your business idea."
      next_steps:
        - "Complete your first Quick Start"
        - "Explore the dashboard"
        - "Check out our methodology"
      cta: "Get Started"
      urgency: "low"

  client_joined:
    subject: "Your client {client_name} has joined StartupAI"
    timing: "When client completes signup via invite"
    role: "consultant"
    content:
      greeting: "Hi {first_name},"
      body: "{client_name} has accepted your invitation and is now in your portfolio."
      cta: "View Client"
      urgency: "medium"

  weekly_digest:
    subject: "Your StartupAI weekly summary"
    timing: "Monday 9am user timezone"
    opt_in: true
    content:
      greeting: "Hi {first_name},"
      sections:
        - "Projects updated this week"
        - "Pending approvals (if any)"
        - "Experiments completed"
        - "Evidence collected"
      cta: "View Dashboard"

email_design:
  template: "Clean, professional, branded"
  width: "600px max"
  header: "StartupAI logo"
  footer:
    - "Unsubscribe link (for non-transactional)"
    - "Manage preferences link"
    - "Physical address (CAN-SPAM compliance)"
  mobile_responsive: true
```

---

## Phase 3: Notification Preferences

### Step 4: Manage Notification Preferences (US-N03)

```yaml
touchpoint: /settings/notifications
user_state: customizing_notifications
user_goal: control_what_notifications_received
user_actions:
  - navigates to Settings → Notifications
  - reviews current preferences
  - toggles settings
  - saves changes
user_emotions: in_control, customizing
pain_points:
  - unclear what each setting controls
  - changes don't take effect
success_metrics:
  - preference_change_success: 100%
  - preference_page_visits: >20% of users
  - reduced_unsubscribe_rate: 50%

preferences_ui:
  layout: "grouped by category"

  sections:
    product_notifications:
      header: "Product Notifications"
      description: "Updates about your projects and analysis"

      settings:
        hitl_ready:
          label: "Approval notifications"
          description: "When a checkpoint needs your review"
          channels:
            in_app: { default: true, locked: true }
            email: { default: true, locked: false }
            browser: { default: false, locked: false }

        phase_complete:
          label: "Phase completion"
          description: "When a phase finishes processing"
          channels:
            in_app: { default: true, locked: false }
            email: { default: true, locked: false }
            browser: { default: false, locked: false }

        analysis_results:
          label: "Analysis results"
          description: "When new insights are available"
          channels:
            in_app: { default: true, locked: false }
            email: { default: false, locked: false }
            browser: { default: false, locked: false }

    consultant_notifications:
      header: "Client Notifications"
      role: "consultant"
      description: "Updates about your clients"

      settings:
        client_activity:
          label: "Client activity"
          description: "When clients submit or reach checkpoints"
          channels:
            in_app: { default: true, locked: false }
            email: { default: true, locked: false }
            browser: { default: false, locked: false }

        client_hitl:
          label: "Client approvals"
          description: "When clients have pending approvals (aging)"
          channels:
            in_app: { default: true, locked: false }
            email: { default: true, locked: false }

    marketing_notifications:
      header: "Marketing & Updates"
      description: "Product news and tips"

      settings:
        product_updates:
          label: "Product updates"
          description: "New features and improvements"
          channels:
            email: { default: true, locked: false }

        tips_practices:
          label: "Tips and best practices"
          description: "Validation methodology insights"
          channels:
            email: { default: true, locked: false }

        weekly_digest:
          label: "Weekly summary"
          description: "Recap of your activity each week"
          channels:
            email: { default: false, locked: false }

    transactional:
      header: "Account & Security"
      description: "These cannot be disabled"
      note: "Required for account security and legal compliance"

      settings:
        security_alerts:
          label: "Security alerts"
          description: "Password changes, new logins, 2FA"
          channels:
            email: { default: true, locked: true }

        billing_notifications:
          label: "Billing notifications"
          description: "Receipts, payment failures, subscription changes"
          channels:
            email: { default: true, locked: true }

        legal_notices:
          label: "Legal notices"
          description: "Terms of service updates, policy changes"
          channels:
            email: { default: true, locked: true }

  escalation_settings:
    header: "Escalation Timing"
    description: "How long before escalating urgent notifications"

    settings:
      email_escalation:
        label: "Email after in-app"
        description: "Send email if in-app notification not viewed"
        options: ["15 minutes", "1 hour", "4 hours", "Never"]
        default: "15 minutes"

      reminder_frequency:
        label: "Reminder frequency"
        description: "For pending HITL approvals"
        options: ["Daily", "Every 3 days", "Weekly", "Never"]
        default: "Daily"

  save_button:
    text: "Save Preferences"
    loading: "Saving..."
    confirmation: "Preferences saved"
```

---

## Phase 4: Escalation

### Step 5: Escalation Alert (US-N04)

```yaml
touchpoint: email + in-app
user_state: has_aging_action_item
user_goal: (system goal: prompt user to act)
user_actions:
  - receives escalation notification
  - sees urgency indicator
  - takes action or ignores
user_emotions: pressure, urgency
pain_points:
  - notification fatigue
  - unclear consequences of inaction
success_metrics:
  - escalation_to_action_rate: >50%
  - average_response_time: <24 hours
  - checkpoint_completion_rate: >95%

escalation_flow:
  trigger: "HITL checkpoint not acted on"

  escalation_timeline:
    immediate:
      channel: "in_app"
      message: "Approval needed: {checkpoint_name}"
      badge: "normal"

    after_15_min:
      channel: "email"
      subject: "Action needed: Your {checkpoint_name} is ready for review"
      condition: "User hasn't viewed in-app notification"

    after_24_hours:
      channel: "in_app + email"
      message: "Reminder: {checkpoint_name} waiting for your review"
      badge: "amber (warning)"
      email_subject: "Reminder: Your {checkpoint_name} needs attention"

    after_3_days:
      channel: "in_app + email"
      message: "Overdue: {checkpoint_name} - {X} days waiting"
      badge: "red (urgent)"
      email_subject: "Overdue: Your validation is paused"
      consequence: "Explain that workflow is paused"

    after_7_days:
      channel: "in_app + email"
      message: "Critical: Action required to continue validation"
      badge: "red (critical) + pulse animation"
      email_subject: "Critical: Your project needs attention"
      consequence: "Workflow has been paused for 7 days"

    after_30_days:
      action: "Project auto-paused"
      channel: "email"
      subject: "Your project {project_name} has been paused"
      consequence: "Can resume anytime by completing the approval"

escalation_ui:
  approval_card_aging:
    fresh: "Just now"
    aging: "Waiting for 3 days" (amber text)
    overdue: "Overdue - 7 days" (red text)
    critical: "Critical - 14 days" (red text + pulse)

  dashboard_indicator:
    fresh: "1 pending approval"
    aging: "1 approval needs attention"
    overdue: "1 overdue approval"
    critical: "URGENT: 1 approval blocking progress"

consultant_escalation:
  trigger: "Client has aging HITL checkpoint"
  timing: "Notify consultant when client's approval is 3+ days old"
  message: "Your client {client_name} has a pending approval for 3 days"
  purpose: "Enable consultant to follow up proactively"
```

---

## Phase 5: Unsubscribe

### Step 6: Unsubscribe from Emails (US-N05)

```yaml
touchpoint: email footer link or /settings/notifications
user_state: wants_fewer_emails
user_goal: stop_receiving_specific_emails
user_actions:
  - clicks unsubscribe in email
  - sees preference page
  - adjusts email preferences
  - confirms changes
user_emotions: annoyed, relieved
pain_points:
  - unsubscribe doesn't work
  - have to login to unsubscribe
success_metrics:
  - unsubscribe_success_rate: 100%
  - unsubscribe_time: <30 seconds
  - can_spam_compliance: 100%

unsubscribe_flow:
  email_link:
    text: "Unsubscribe"
    location: "Email footer, clearly visible"
    behavior: "One-click for marketing emails"

  landing_page:
    url: "/unsubscribe?token={token}&email={email}"
    no_login_required: true

    options:
      one_click:
        action: "Unsubscribe from this email type"
        confirmation: "You've been unsubscribed from {email_type}"

      preferences:
        action: "Manage all email preferences"
        link: "→ /settings/notifications"

      unsubscribe_all:
        action: "Unsubscribe from all marketing emails"
        warning: "You'll still receive account and security emails"
        confirmation: "You've been unsubscribed from all marketing emails"

  confirmation:
    page:
      message: "You've been unsubscribed"
      detail: "You won't receive {email_type} emails anymore"
      resubscribe: "Changed your mind? Update preferences"

    email:
      subject: "Unsubscribe confirmation"
      content: "You've been unsubscribed from {email_type}"
      note: "You'll continue to receive account and security emails"

compliance:
  can_spam:
    - "Unsubscribe link in every marketing email"
    - "Process unsubscribe within 10 business days (we do instantly)"
    - "Physical address in footer"

  gdpr:
    - "Easy to withdraw consent"
    - "No dark patterns"
    - "Confirmation of action"

  ccpa:
    - "Respect opt-out preferences"
    - "Do not sell personal information (N/A - we don't sell)"
```

---

## Notification Delivery Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   NOTIFICATION SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Event Trigger                                                  │
│  (HITL ready, phase complete, payment, etc.)                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐                                               │
│  │ Notification│                                               │
│  │   Service   │                                               │
│  └──────┬──────┘                                               │
│         │                                                       │
│         ├─── Check user preferences                            │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────┐               │
│  │                                             │               │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐    │               │
│  │  │ In-App  │  │  Email  │  │ Browser │    │               │
│  │  │ (Supabase│  │ (Resend)│  │(Web Push)│   │               │
│  │  │ Realtime)│  │         │  │         │    │               │
│  │  └────┬────┘  └────┬────┘  └────┬────┘    │               │
│  │       │            │            │          │               │
│  └───────┼────────────┼────────────┼──────────┘               │
│          │            │            │                           │
│          ▼            ▼            ▼                           │
│      User sees    User inbox   Browser                         │
│      in app                    notification                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Reference

```sql
-- approval_preferences table (existing)
approval_preferences (
  user_id uuid,
  notify_email boolean DEFAULT true,
  notify_sms boolean DEFAULT false,
  escalation_email text,
  escalation_delay_hours integer DEFAULT 24
);

-- notification_preferences table (new)
notification_preferences (
  user_id uuid PRIMARY KEY,
  hitl_ready_email boolean DEFAULT true,
  hitl_ready_browser boolean DEFAULT false,
  phase_complete_email boolean DEFAULT true,
  phase_complete_browser boolean DEFAULT false,
  client_activity_email boolean DEFAULT true,
  product_updates_email boolean DEFAULT true,
  weekly_digest_email boolean DEFAULT false,
  email_escalation_minutes integer DEFAULT 15,
  reminder_frequency_days integer DEFAULT 1,
  created_at timestamp,
  updated_at timestamp
);

-- notifications table (for in-app)
notifications (
  id uuid PRIMARY KEY,
  user_id uuid,
  type text, -- hitl_ready, phase_complete, etc.
  title text,
  message text,
  action_url text,
  read boolean DEFAULT false,
  created_at timestamp
);
```

---

## Success Metrics Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Email delivery rate | >98% | Delivered / sent |
| Email open rate | >40% | Opens / delivered |
| Email click rate | >15% | Clicks / opens |
| In-app notification read rate | >60% | Read / displayed |
| Unsubscribe rate | <2% | Unsubscribes / emails sent |
| Escalation-to-action rate | >50% | Actions taken after escalation |
| Notification preference customization | >20% | Users who customize |

---

## Cross-References

| Document | What It Covers |
|----------|---------------|
| [`user-personas.md`](./user-personas.md) | Role definitions |
| [`user-stories.md`](./user-stories.md#notification-stories-us-n) | Notification user stories (US-N01-N05) |
| [`founder-journey-map.md`](./founder-journey-map.md) | HITL approval flow |
| [`consultant-journey-map.md`](./consultant-journey-map.md) | Client notification flow |
| [`journey-test-matrix.md`](../testing/journey-test-matrix.md) | E2E test coverage |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Initial creation - 5-phase notification journey with preference management |
