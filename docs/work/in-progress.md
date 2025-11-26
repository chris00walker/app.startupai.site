---
purpose: "Private technical source of truth for active work"
status: "active"
last_reviewed: "2025-11-26"
---

# In Progress

## Priority Order

Work these items in order. Items marked "Ready" can start immediately.

### P0: Launch Blockers (Work First)

| Priority | Item | Status | Owner | Notes |
|----------|------|--------|-------|-------|
| 1 | Accessibility (WCAG 2.1 AA) | **Ready** | @design-systems | 8-10 hours. Voice controls, skip links, ARIA labels. Launch blocker. |
| 2 | PostHog instrumentation | **Ready** | @ops | Event schemas, onboarding funnel, alert thresholds. GH Issue #175 |

### P1: In Progress

| Priority | Item | Status | Owner | Notes |
|----------|------|--------|-------|-------|
| 3 | Specification-driven test refresh | In Progress | @qa-lead | Update fixtures, Playwright journeys. GH Issue #189 |

### P2: Recently Completed (2025-11-26)

| Item | Status | Notes |
|------|--------|-------|
| CrewAI webhook infrastructure | ✅ Done | Unified `/api/crewai/webhook` endpoint |
| Results display UI | ✅ Done | `ValidationResultsSummary` wired to dashboard |
| Flywheel learning tables | ✅ Done | pgvector tables + search functions deployed |
| HITL approval system | ✅ Done | Approval requests table + API routes |
| Consultant onboarding integration | ✅ Done | Profile persistence + AI analysis webhook |

### P3: Blocked by CrewAI

| Priority | Item | Status | Blocked By | Notes |
|----------|------|--------|------------|-------|
| 4 | E2E validation flow | **Blocked** | CrewAI webhook call | Product app ready; waiting for CrewAI to POST |
| 5 | Real analysis data quality | **Blocked** | CrewAI real tools | Web search, financial data tools needed |

---

## Cross-Repo Dependencies

```
startupai-crew (CrewAI Phase 1)
    ↓ Needs to POST to /api/crewai/webhook  ← CURRENT BLOCKER
app.startupai.site (This repo)
    ↓ Displays results (ready), captures leads
startupai.site (Marketing)
    ↓ Shows activity, validates cycles
```

**Blocking Chain**: CrewAI webhook integration → E2E flow works → Marketing Validation Cycles

---

## Immediate Actions

1. **Start accessibility work** - #1 launch blocker, no dependencies
2. **Start PostHog instrumentation** - No dependencies
3. **Coordinate with CrewAI repo** - Wire Flow to call `/api/crewai/webhook`

---

## What's Ready for CrewAI

The following infrastructure is complete and awaiting CrewAI integration:

```
POST /api/crewai/webhook
Authorization: Bearer {CREW_CONTRACT_BEARER}
Content-Type: application/json

{
  "flow_type": "founder_validation" | "consultant_onboarding",
  // ... payload per flow type
}
```

See `frontend/src/app/api/crewai/webhook/route.ts` for full schema.

---

## How to Use This Document

1. **Pick highest priority "Ready" item** from the table
2. **Update status** when you start work
3. **Move to done.md** when complete
4. **Check cross-repo-blockers.md** for upstream status

---

**Last Updated**: 2025-11-26
