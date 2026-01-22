---
purpose: "Complete admin journey map and UX specification"
status: "active"
last_reviewed: "2026-01-22"
---

# Complete Admin Journey Map

**End-to-End User Experience Specification**

**Status:** Active
**Last Updated:** 2026-01-22
**Persona Reference:** [`user-personas.md`](./user-personas.md#admin-persona)

---

## Document Purpose

This document maps the complete user journey for Admins performing platform support and operations tasks. Use this as a UX reference for the intended admin experience and validation checklist.

**Admin Promise:** "Resolve user issues quickly without engineering escalation"
**Sub-Segments:** Support Admin, Operations Admin, Data Admin

---

## Journey Overview

The Admin journey consists of 6 phases covering different operational responsibilities:

| Phase | Focus | Key Workflows | Stories |
|-------|-------|---------------|---------|
| Phase 1 | User Support | Search, profile view, role changes | US-A01, US-A02, US-A08 |
| Phase 2 | Debugging | User impersonation | US-A03 |
| Phase 3 | Operations | Workflow retry, health monitoring | US-A04, US-A05 |
| Phase 4 | Feature Management | Feature flags | US-A06 |
| Phase 5 | Compliance | Audit log review | US-A07 |
| Phase 6 | Data Operations | Export, integrity checks | US-A09, US-A10 |

---

## Phase 1: User Support

### Step 1: Admin Login (30 seconds)

```yaml
touchpoint: app.startupai.site/login
user_state: starting_support_shift
user_goal: access_admin_dashboard
user_actions:
  - logs in with admin credentials
  - redirected to /admin-dashboard
user_emotions: focused, ready_to_help
success_metrics:
  - login_time: <30 seconds
  - successful_auth_rate: >99%
```

### Step 2: User Search (US-A01)

```yaml
touchpoint: /admin/users
user_state: looking_for_user
user_goal: find_user_to_help
user_actions:
  - enters partial email, name, or project ID
  - clicks Search
  - scans results list
user_emotions: efficient, investigative
pain_points:
  - search might not find user on first try
  - unclear if user exists in system
success_metrics:
  - search_time: <5 seconds
  - first_search_success_rate: >80%
```

### Step 3: View User Profile (US-A02)

```yaml
touchpoint: /admin/users/:id
user_state: understanding_user_situation
user_goal: understand_user_context
user_actions:
  - views account info (email, role, plan)
  - checks project list and status
  - reviews recent activity
  - looks at current state (phase, HITL pending)
user_emotions: analytical, empathetic
pain_points:
  - too much information to parse
  - unclear what's relevant to issue
success_metrics:
  - time_to_understand_context: <60 seconds
  - relevant_info_found_rate: >90%
```

### Step 4: Change User Role (US-A08)

```yaml
touchpoint: /admin/users/:id (role change modal)
user_state: resolving_access_issue
user_goal: correct_user_role
user_actions:
  - clicks "Change Role"
  - selects new role from dropdown
  - confirms change with reason
  - verifies change applied
user_emotions: careful, authoritative
pain_points:
  - worried about making wrong change
  - unclear valid role transitions
success_metrics:
  - role_change_success_rate: >99%
  - audit_log_capture_rate: 100%
```

---

## Phase 2: Debugging

### Step 5: Impersonate User (US-A03)

```yaml
touchpoint: /admin/users/:id → "View as User"
user_state: debugging_user_issue
user_goal: see_what_user_sees
user_actions:
  - clicks "View as User" button
  - sees admin banner indicating impersonation mode
  - navigates through user's dashboard
  - attempts actions (sees read-only toast)
  - clicks "Exit Impersonation"
user_emotions: investigative, careful
pain_points:
  - might forget which user being impersonated
  - unclear which features work in read-only mode
success_metrics:
  - impersonation_start_time: <3 seconds
  - issue_identification_rate: >70%
  - audit_log_capture_rate: 100%
```

---

## Phase 3: Operations

### Step 6: View System Health (US-A05)

```yaml
touchpoint: /admin/health
user_state: monitoring_platform
user_goal: ensure_platform_healthy
user_actions:
  - views overall status indicators
  - checks Modal API status
  - checks Supabase status
  - reviews active workflow count
  - checks error rate (last hour)
user_emotions: vigilant, proactive
pain_points:
  - unclear what "healthy" means
  - no alerting (must manually check)
success_metrics:
  - time_to_assess_health: <10 seconds
  - issue_detection_rate: >95%
```

### Step 7: Retry Failed Workflow (US-A04)

```yaml
touchpoint: /admin/users/:id/projects/:projectId
user_state: fixing_stuck_project
user_goal: unstick_user_workflow
user_actions:
  - finds failed job in "Failed Jobs" section
  - reviews error message and timestamp
  - clicks "Retry"
  - confirms in dialog
  - verifies job status changes to "pending"
user_emotions: helpful, decisive
pain_points:
  - unclear if retry will work
  - uncertain about impact on user
success_metrics:
  - retry_success_rate: >80%
  - time_to_retry: <30 seconds
  - audit_log_capture_rate: 100%
```

---

## Phase 4: Feature Management

### Step 8: Manage Feature Flags (US-A06)

```yaml
touchpoint: /admin/features
user_state: controlling_rollout
user_goal: enable_disable_feature
user_actions:
  - finds feature flag in list
  - clicks "Edit"
  - selects scope (global, user, percentage)
  - if user-specific, enters email
  - saves change
user_emotions: strategic, careful
pain_points:
  - unclear feature flag effects
  - worried about breaking things
success_metrics:
  - flag_change_success_rate: >99%
  - rollback_time_if_issue: <60 seconds
  - audit_log_capture_rate: 100%
```

---

## Phase 5: Compliance

### Step 9: View Audit Logs (US-A07)

```yaml
touchpoint: /admin/audit
user_state: reviewing_actions
user_goal: understand_what_happened
user_actions:
  - sets date range filter
  - filters by action type (optional)
  - filters by admin (optional)
  - scrolls through results
  - clicks entry for details
user_emotions: investigative, thorough
pain_points:
  - too many logs to parse
  - unclear which entries are relevant
success_metrics:
  - log_load_time: <3 seconds
  - filter_accuracy: 100%
  - relevant_entry_found_rate: >90%
```

---

## Phase 6: Data Operations

### Step 10: Export User Data (US-A09)

```yaml
touchpoint: /admin/users/:id → "Export Data"
user_state: fulfilling_data_request
user_goal: generate_user_data_export
user_actions:
  - clicks "Export Data"
  - selects export type (full, projects, activity)
  - clicks "Generate Export"
  - waits for completion
  - downloads file
user_emotions: procedural, compliant
pain_points:
  - export might take too long
  - unclear what's included
success_metrics:
  - export_generation_time: <60 seconds
  - export_completeness: 100%
  - audit_log_capture_rate: 100%
```

### Step 11: Run Data Integrity Check (US-A10)

```yaml
touchpoint: /admin/users/:id → "Run Integrity Check"
user_state: investigating_data_issue
user_goal: identify_data_problems
user_actions:
  - clicks "Run Integrity Check"
  - waits for check to complete
  - reviews results
  - if issues found, clicks "Create Ticket"
user_emotions: analytical, thorough
pain_points:
  - unclear what checks are run
  - uncertain about severity of issues
success_metrics:
  - check_completion_time: <30 seconds
  - issue_detection_accuracy: >95%
  - ticket_creation_rate: 100% (when issues found)
```

---

## Success Metrics Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average issue resolution time | <10 minutes | Time from user search to resolution |
| Engineering escalation rate | <20% | Issues requiring dev intervention |
| User satisfaction (post-support) | >4.5/5 | Survey after support interaction |
| Audit log completeness | 100% | All admin actions logged |
| Platform health check frequency | Every 15 minutes | Automated + manual checks |

---

## Cross-References

| Document | What It Covers |
|----------|---------------|
| [`user-personas.md`](./user-personas.md#admin-persona) | Admin persona definition |
| [`user-stories.md`](./user-stories.md#admin-stories-us-a) | Admin user stories (US-A01-A10) |
| [`journey-test-matrix.md`](../testing/journey-test-matrix.md) | E2E test coverage |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Initial creation - 6-phase admin journey with 11 steps |
