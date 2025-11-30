---
purpose: "Private technical source of truth for active work"
status: "active"
last_reviewed: "2025-11-30"
---

# In Progress

## Priority Order

Work these items in order. Items marked "Ready" can start immediately.

### P0: Launch Blockers (Work First)

| Priority | Item | Status | Owner | Effort | Notes |
|----------|------|--------|-------|--------|-------|
| - | *No P0 blockers remaining* | ✅ | - | - | PostHog instrumentation completed 2025-11-30 |

### P1: High Priority (Should Fix Before Launch)

| Priority | Item | Status | Owner | Effort | Notes |
|----------|------|--------|-------|--------|-------|
| 2 | Dashboard insights from CrewAI | **Ready** | @frontend | 3-4 days | Replace mock data with real AI insights. 81% of fields unused. |
| 3 | Specification-driven test refresh | In Progress | @qa-lead | - | Update fixtures, Playwright journeys. GH Issue #189 |

### P2: Ready for E2E Testing

| Priority | Item | Status | Notes |
|----------|------|--------|-------|
| 4 | E2E validation flow | **Ready to Test** | CrewAI webhook implemented, E2E infra fixed, ready for full validation |
| 5 | Real analysis data quality | **Available** | TavilySearchTool + 4 research tools provide real web data |

**CrewAI Status (2025-11-29):** Phase 2D complete (~85%). 18 tools implemented.

---

## Cross-Repo Dependencies - UPDATED 2025-11-30

```
✅ startupai-crew (CrewAI Phase 2D Complete - 85%)
    ↓ Webhook implemented, real web research, 18 tools
✅ app.startupai.site (This repo) ← P0 BLOCKERS CLEARED
    ↓ PostHog done, E2E tests fixed, accessibility done, reports + evidence explorer done
startupai.site (Marketing)
    ↓ Waiting on Activity Feed + Metrics APIs
```

**Current Focus**:
1. Dashboard integration with real CrewAI data (P1)
2. Specification-driven test refresh (P1)

---

## Immediate Actions (Updated 2025-11-30)

1. **Dashboard CrewAI integration** - Replace mock data with real AI insights (P1)
2. **Specification-driven test refresh** - Update fixtures, Playwright journeys (P1)

---

## What's Ready

**CrewAI Infrastructure Complete:**
- Webhook endpoint: `POST /api/crewai/webhook`
- All 80+ fields persisting to Supabase
- Hooks: `useCrewAIState`, `useInnovationSignals`, `useVPCData`
- CrewAI Report Viewer component (comprehensive report display)
- Evidence Explorer with D-F-V metrics
- VPC Strategyzer-style canvas with animated fit lines
- E2E test infrastructure (timeouts fixed, API mocks)
- Accessibility foundation (WCAG 2.1 AA)

**What's Missing:**
- Dashboard integration with real CrewAI data (some mock data remains)

See [Integration QA Report](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) for details.

---

## How to Use This Document

1. **Pick highest priority "Ready" item** from P1 table (no P0 blockers remaining)
2. **Update status** when you start work
3. **Move to done.md** when complete
4. **Check cross-repo-blockers.md** for upstream status

---

**Last Updated**: 2025-11-30
