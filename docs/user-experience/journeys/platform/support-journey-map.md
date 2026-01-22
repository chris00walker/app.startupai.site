---
purpose: "Complete support journey map for all users seeking help"
status: "active"
last_reviewed: "2026-01-22"
last_updated: "2026-01-22"
---

# Complete Support Journey Map

**End-to-End User Experience Specification**

**Status:** Active
**Last Updated:** 2026-01-22
**Persona Reference:** All user types (Founder, Consultant, Trial, Admin)

---

## Document Purpose

This document maps the complete user journey for all users seeking help, submitting support requests, and exercising data rights (GDPR). This is a **cross-cutting journey** that intersects with all other user types.

**Support Promise:** "Get help quickly without frustration"
**GDPR Promise:** "Control your data with transparency"
**Trial Support:** Trial users have access to Help Center + Contact Support with best-effort response times (no priority SLA).

---

## Journey Overview

The Support journey consists of 5 phases covering different help-seeking scenarios:

| Phase | Focus | Key Workflows | Stories |
|-------|-------|---------------|---------|
| Phase 1 | Self-Service | Knowledge base, FAQ search | US-S02 |
| Phase 2 | Contact Support | Submit help request with context | US-S01 |
| Phase 3 | Ticket Tracking | View status of support request | US-S03 |
| Phase 4 | Data Rights | Request data export (GDPR) | US-S04 |
| Phase 5 | Account Deletion | Delete account (GDPR right to erasure) | US-S05 |

---

## Entry Points

Users can enter the support journey from multiple touchpoints:

```
Dashboard (any role)
    │
    ├─ "?" Help icon in header → Phase 1 (Self-Service)
    │
    ├─ Error state "Contact Support" → Phase 2 (Direct Request)
    │
    └─ Footer "Help & Support" → Phase 1 (Self-Service)

Settings Page
    │
    ├─ "Help & Support" section → Phase 1
    │
    ├─ "Request Data Export" → Phase 4
    │
    └─ "Delete Account" → Phase 5
```

---

## Phase 1: Self-Service

### Step 1: Access Help Center (US-S02)

```yaml
touchpoint: /help or Help modal
user_state: seeking_information
user_goal: find_answer_without_waiting
user_actions:
  - clicks "?" icon or "Help" link
  - sees help center with search bar
  - browses categories or searches keywords
user_emotions: mildly_frustrated, hopeful
pain_points:
  - search might not find relevant content
  - articles might be outdated
success_metrics:
  - self_service_resolution_rate: >60%
  - search_to_article_click: <3 searches
  - time_to_article: <30 seconds
```

### Step 2: Browse Knowledge Base (US-S02)

```yaml
touchpoint: /help/articles
user_state: reading_documentation
user_goal: understand_how_to_solve_problem
user_actions:
  - views article categories
  - clicks relevant category
  - reads article content
  - follows step-by-step instructions
user_emotions: focused, hopeful
pain_points:
  - article might not match exact situation
  - instructions might be unclear
success_metrics:
  - article_completion_rate: >70%
  - feedback_rating: >4/5
  - escalation_rate: <30%

knowledge_base_categories:
  getting_started:
    - "How Quick Start works"
    - "Understanding your first analysis"
    - "What are D-F-V signals?"

  account_billing:
    - "How to upgrade your plan"
    - "Changing your payment method"
    - "Canceling your subscription"

  founder_features:
    - "Using the Value Proposition Canvas"
    - "Understanding HITL approvals"
    - "Interpreting AI analysis results"

  consultant_features:
    - "Inviting clients"
    - "Managing your portfolio"
    - "White-label reports"

  troubleshooting:
    - "Analysis taking too long"
    - "Payment issues"
    - "Can't access my account"

  data_privacy:
    - "How we use your data"
    - "Requesting a data export"
    - "Deleting your account"
```

### Step 3: Search and Find (US-S02)

```yaml
touchpoint: /help (search interface)
user_state: searching_for_specific_answer
user_goal: find_exact_information_quickly
user_actions:
  - enters search query
  - views search results
  - clicks most relevant result
  - if not found, refines search
user_emotions: impatient, focused
pain_points:
  - no results for query
  - too many irrelevant results
success_metrics:
  - search_success_rate: >75%
  - zero_result_rate: <10%
  - avg_searches_before_click: <2

search_ui:
  search_bar:
    placeholder: "Search help articles..."
    autocomplete: true
    suggestions: "Based on common queries"

  results:
    max_displayed: 10
    show_snippet: true
    highlight_matches: true
    filter_by_category: true

  no_results:
    message: "No articles found"
    suggestion: "Try different keywords or contact support"
    cta: "Contact Support" → Phase 2
```

---

## Phase 2: Contact Support

### Step 4: Open Support Form (US-S01)

```yaml
touchpoint: /help/contact or Support modal
user_state: needs_human_help
user_goal: submit_help_request_with_context
user_actions:
  - clicks "Contact Support"
  - sees support form
  - selects issue category
  - describes problem
user_emotions: frustrated, hoping_for_resolution
pain_points:
  - form might require too much info
  - unsure which category to select
success_metrics:
  - form_completion_rate: >90%
  - time_to_submit: <3 minutes
  - required_field_errors: <5%

support_form_ui:
  layout: "centered card, max-width 640px"

  header:
    title: "Contact Support"
    subtitle: "We typically respond within 4 hours during business hours"

  fields:
    category:
      type: "select"
      required: true
      options:
        - "Account & Billing"
        - "Technical Issue"
        - "Feature Request"
        - "Analysis Questions"
        - "Data & Privacy"
        - "Other"

    subject:
      type: "text"
      required: true
      max_length: 100
      placeholder: "Brief summary of your issue"

    description:
      type: "textarea"
      required: true
      min_length: 20
      max_length: 5000
      placeholder: "Describe what happened, what you expected, and any error messages..."
      helper: "The more detail you provide, the faster we can help"

    attachments:
      type: "file_upload"
      optional: true
      max_files: 3
      max_size_each: "5MB"
      allowed_types: ["png", "jpg", "gif", "pdf"]
      helper: "Screenshots help us understand the issue"

  context_collection:
    auto_attached:
      - user_id: "Automatically included"
      - role: "Automatically included"
      - current_page: "Where you came from"
      - browser_info: "Technical details"
      - recent_errors: "Last 5 error logs (if any)"

    opt_in:
      - project_state: "Include project details?"
      - session_replay: "Include recent session recording?"

  submit_button:
    text: "Submit Request"
    loading_text: "Submitting..."
```

### Step 5: Submit Support Request (US-S01)

```yaml
touchpoint: /help/contact (submission)
user_state: submitting_request
user_goal: confirm_request_received
user_actions:
  - reviews entered information
  - clicks "Submit Request"
  - sees confirmation message
  - receives email confirmation
user_emotions: relieved, expectant
pain_points:
  - submission might fail
  - unclear if request was received
success_metrics:
  - submission_success_rate: >99%
  - email_confirmation_delivery: <60 seconds
  - support_response_time: <4 hours

confirmation_ui:
  success_state:
    icon: "CheckCircle (green)"
    title: "Request Submitted"
    message: "We've received your request and will respond within 4 hours."
    ticket_id: "Displayed for reference"
    email_notice: "Confirmation sent to {email}"

  next_steps:
    - "Check your email for confirmation"
    - "Track your request in the Support section"
    - "Add more details anytime by replying to the email"

  cta:
    primary: "View My Requests" → Phase 3
    secondary: "Back to Help" → Phase 1
```

---

## Phase 3: Ticket Tracking

### Step 6: View Support Requests (US-S03)

```yaml
touchpoint: /settings/support or /help/requests
user_state: checking_status
user_goal: see_if_issue_resolved
user_actions:
  - navigates to support requests
  - views list of open/closed tickets
  - clicks on specific ticket
  - reads latest update
user_emotions: anxious, hopeful
pain_points:
  - no update yet
  - unclear resolution timeline
success_metrics:
  - ticket_view_rate: >50% (of submitters)
  - response_notification_delivery: 100%
  - average_resolution_time: <24 hours

ticket_list_ui:
  layout: "table with sortable columns"

  columns:
    - ticket_id: "Reference number"
    - subject: "Issue summary"
    - status: "Open | In Progress | Resolved | Closed"
    - created: "Submission date"
    - updated: "Last activity"

  filters:
    - status: "All | Open | Resolved"
    - date_range: "Last 7 days | 30 days | All time"

  empty_state:
    message: "No support requests"
    cta: "Contact Support"
```

### Step 7: View Ticket Detail (US-S03)

```yaml
touchpoint: /help/requests/:ticketId
user_state: reviewing_ticket
user_goal: understand_status_and_respond
user_actions:
  - views ticket details
  - reads conversation thread
  - adds reply if needed
  - closes ticket if resolved
user_emotions: engaged, satisfied_or_frustrated
pain_points:
  - waiting for response
  - solution doesn't work
success_metrics:
  - first_response_time: <4 hours
  - resolution_rate: >90%
  - satisfaction_rating: >4.5/5

ticket_detail_ui:
  header:
    ticket_id: "Displayed prominently"
    subject: "Issue summary"
    status_badge: "Color-coded status"
    created: "Submission timestamp"

  conversation_thread:
    layout: "chronological messages"
    message_types:
      - user_message: "Your messages"
      - support_message: "Support team responses"
      - system_message: "Status changes, auto-updates"

  reply_form:
    textarea: "Add to this conversation..."
    attachments: "Add screenshots"
    submit: "Send Reply"

  actions:
    mark_resolved: "This solved my problem"
    escalate: "I still need help"
    close: "Close without resolution"

  satisfaction_survey:
    trigger: "After marked resolved"
    questions:
      - rating: "1-5 stars"
      - feedback: "Optional comment"
```

---

## Phase 4: Data Rights (GDPR Export)

### Step 8: Request Data Export (US-S04)

```yaml
touchpoint: /settings/privacy → "Export My Data"
user_state: exercising_data_rights
user_goal: receive_copy_of_personal_data
user_actions:
  - navigates to Settings → Privacy
  - clicks "Export My Data"
  - selects export scope
  - confirms request
user_emotions: cautious, rights_aware
pain_points:
  - unclear what's included
  - export takes too long
success_metrics:
  - export_request_success: 100%
  - export_delivery_time: <24 hours
  - export_completeness: 100%

export_request_ui:
  header:
    title: "Export Your Data"
    subtitle: "Download a copy of your personal data (GDPR Article 15)"

  scope_selection:
    full_export:
      label: "Complete Data Export"
      description: "All personal data, projects, activity, and preferences"
      estimated_time: "~24 hours"

    account_only:
      label: "Account Information"
      description: "Profile, settings, and preferences"
      estimated_time: "~1 hour"

    projects_only:
      label: "Projects & Analysis"
      description: "All projects with canvases, experiments, and evidence"
      estimated_time: "~12 hours"

  format_options:
    - json: "Machine-readable JSON"
    - csv: "Spreadsheet-compatible CSV"
    - pdf: "Human-readable PDF report"

  confirmation:
    title: "Confirm Export Request"
    message: "We'll email you at {email} when your export is ready."
    checkbox: "I understand this may take up to 24 hours"
    submit: "Request Export"

legal_requirements:
  gdpr_article_15: "Right of access"
  response_deadline: "Within 30 days (we aim for 24 hours)"
  format: "Commonly used, machine-readable format"
  free_of_charge: "First request is free"
```

### Step 9: Download Export (US-S04)

```yaml
touchpoint: /settings/privacy → "Your Exports"
user_state: retrieving_export
user_goal: download_data_file
user_actions:
  - receives email notification
  - clicks link or navigates to exports
  - downloads export file
  - verifies contents
user_emotions: satisfied, privacy_conscious
pain_points:
  - link might expire
  - file might be too large
success_metrics:
  - download_success_rate: >99%
  - link_expiry: 7 days
  - user_satisfaction: >4/5

export_download_ui:
  export_list:
    columns:
      - export_type: "Full | Account | Projects"
      - requested: "Request date"
      - status: "Processing | Ready | Expired"
      - expires: "Download expires in X days"
      - size: "File size"

    actions:
      download: "Download ZIP" (if ready)
      request_new: "Request New Export"

  expiry_warning:
    at_3_days: "Download expires in 3 days"
    at_1_day: "Download expires tomorrow"
    expired: "Export expired - request a new one"
```

---

## Phase 5: Account Deletion (GDPR Erasure)

### Step 10: Initiate Account Deletion (US-S05)

```yaml
touchpoint: /settings/account → Danger Zone
user_state: deciding_to_leave
user_goal: understand_deletion_impact
user_actions:
  - navigates to Settings → Account
  - scrolls to Danger Zone
  - clicks "Delete My Account"
  - reviews impact summary
user_emotions: determined, possibly_regretful
pain_points:
  - unclear what will be deleted
  - worried about losing data
success_metrics:
  - impact_summary_viewed: 100%
  - unintended_deletion_rate: <1%
  - exit_survey_completion: >30%

deletion_initiation_ui:
  danger_zone:
    style: "red border, warning icon"
    header: "Danger Zone"

    delete_button:
      text: "Delete My Account"
      style: "destructive, requires confirmation"

  impact_modal:
    title: "Delete Your Account?"
    warning: "This action cannot be undone"

    what_will_be_deleted:
      - "Your profile and settings"
      - "All projects (X projects)"
      - "All analysis results and canvases"
      - "All evidence and experiments"
      - "Subscription and billing history"

    what_will_be_retained:
      - "Anonymized analytics (no personal identifiers)"
      - "Legal records (invoices, 7 years per tax law)"

    consultant_warning:
      condition: "If user is consultant with clients"
      message: "Your clients will be unlinked. They keep their data."

    active_subscription_warning:
      condition: "If user has active subscription"
      message: "Your subscription will be cancelled. No refund for partial month."
      # Note: This differs from US-B05 refund policy (voluntary refund requests).
      # Account deletion = immediate cancellation, no partial month refund.
      # Refund requests (while active) = eligible per US-B05 refund tiers.
```

### Step 11: Confirm Deletion (US-S05)

```yaml
touchpoint: /settings/account → Deletion confirmation
user_state: confirming_deletion
user_goal: complete_account_deletion
user_actions:
  - reads final warning
  - types email to confirm
  - optionally completes exit survey
  - clicks "Delete Forever"
user_emotions: resolved, possibly_sad
pain_points:
  - second thoughts
  - difficult process
success_metrics:
  - confirmation_completion: >95% (of starters)
  - exit_survey_insights: actionable
  - deletion_success: 100%

confirmation_ui:
  final_confirmation:
    title: "Final Confirmation"
    message: "Type your email to confirm: {email}"

    email_input:
      placeholder: "your@email.com"
      validation: "Must match exactly"

    exit_survey:
      optional: true
      question: "Why are you leaving?"
      options:
        - "Too expensive"
        - "Not useful for my needs"
        - "Switching to competitor"
        - "Project ended"
        - "Other"
      comment: "Optional feedback"

    delete_button:
      text: "Delete My Account Forever"
      disabled_until: "Email matches"
      style: "destructive red"

    cancel_button:
      text: "Keep My Account"
      style: "primary green"

post_deletion:
  immediate_actions:
    - "Sign out from all devices"
    - "Cancel active subscription"
    - "Queue data for deletion"

  data_deletion_timeline:
    immediate: "Account access revoked"
    within_24_hours: "Personal data removed from production"
    within_30_days: "Removed from backups"
    retained: "Legal records (anonymized)"

  confirmation_email:
    subject: "Your StartupAI account has been deleted"
    content:
      - "Account deleted at {timestamp}"
      - "Data deletion timeline"
      - "Win-back offer (30% off if you return within 90 days)"
```

---

## Admin Integration

All support requests flow to the Admin dashboard (documented in `../platform/admin-journey-map.md`):

```
User Submits Request (US-S01)
           │
           ▼
    ┌──────────────┐
    │ Support Queue│
    │ (Admin View) │
    └──────┬───────┘
           │
           ├─ Simple Issue → Admin resolves directly (US-A01-A03)
           │
           ├─ Technical Issue → Admin retries workflow (US-A04)
           │
           ├─ Data Issue → Admin runs integrity check (US-A10)
           │
           └─ Complex Issue → Escalate to Engineering (<20% target)
```

---

## Success Metrics Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Self-service resolution rate | >60% | Issues resolved without ticket |
| Average first response time | <4 hours | Time from submission to first human reply |
| Ticket resolution rate | >90% | Tickets resolved vs. total |
| User satisfaction (CSAT) | >4.5/5 | Post-resolution survey |
| Data export delivery time | <24 hours | Request to download ready |
| Account deletion completion | 100% | All deletion requests processed |

---

## Cross-References

| Document | What It Covers |
|----------|---------------|
| [`roles/role-definitions.md`](../../roles/role-definitions.md) | All user type definitions |
| [`stories/platform.md`](../../stories/platform.md) | Support user stories (US-S01-S05) |
| [`admin-journey-map.md`](../platform/admin-journey-map.md) | Admin support workflows |
| [`journey-test-matrix.md`](../../../testing/journey-test-matrix.md) | E2E test coverage |
| [`offboarding-journey-map.md`](../platform/offboarding-journey-map.md) | Subscription cancellation |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Initial creation - 5-phase support journey with GDPR compliance |
