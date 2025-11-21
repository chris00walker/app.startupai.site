---
purpose: "Private technical source of truth for active work"
status: "active"
last_reviewed: "2025-11-21"
---

# In Progress

## Priority Order

Work these items in order. Items marked "Ready" can start immediately.

### P0: Launch Blockers (Work First)

| Priority | Item | Status | Owner | Notes |
|----------|------|--------|-------|-------|
| 1 | Accessibility (WCAG 2.1 AA) | **Ready** | @design-systems | 8-10 hours. Voice controls, skip links, ARIA labels. Launch blocker. |
| 2 | Onboarding data modelling | **Ready** | @platform-eng | Drizzle models, repositories, API tests. GH Issue #189 |
| 3 | PostHog instrumentation | **Ready** | @ops | Event schemas, onboarding funnel, alert thresholds. GH Issue #175 |

### P1: In Progress

| Priority | Item | Status | Owner | Notes |
|----------|------|--------|-------|-------|
| 4 | CrewAI Netlify integration | In Progress | @ai-platform | PR #412. Note: Limited value until CrewAI Phase 1 complete upstream. |
| 5 | Specification-driven test refresh | In Progress | @qa-lead | Update fixtures, Playwright journeys. GH Issue #189 |

### P2: Blocked by CrewAI

| Priority | Item | Status | Blocked By | Notes |
|----------|------|--------|------------|-------|
| 6 | Results display UI | **Blocked** | CrewAI Phase 1 | Dashboard for analysis results. Requires Supabase persistence. |
| 7 | AI visibility in UI | **Blocked** | CrewAI Phase 1 | Progress indicators, insights display. |

---

## Cross-Repo Dependencies

```
startupai-crew (CrewAI Phase 1)
    ↓ Creates validation results
app.startupai.site (This repo)
    ↓ Displays results, captures leads
startupai.site (Marketing)
    ↓ Shows activity, validates cycles
```

**Blocking Chain**: CrewAI Phase 1 → Results Display UI → Marketing Validation Cycles

---

## Immediate Actions

1. **Start accessibility work** - This is the #1 launch blocker and has no dependencies
2. **Continue onboarding data modelling** - Sets up for CrewAI integration
3. **Monitor CrewAI Phase 1 progress** - Unblocks P2 items when complete

---

## How to Use This Document

1. **Pick highest priority "Ready" item** from the table
2. **Update status** when you start work
3. **Move to done.md** when complete
4. **Check cross-repo-blockers.md** for upstream status

---

**Last Updated**: 2025-11-21
