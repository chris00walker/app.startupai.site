---
purpose: "Private technical source of truth for active work"
status: "active"
last_reviewed: "2025-11-28"
---

# In Progress

## Priority Order

Work these items in order. Items marked "Ready" can start immediately.

### P0: Launch Blockers (Work First)

| Priority | Item | Status | Owner | Effort | Notes |
|----------|------|--------|-------|--------|-------|
| 1 | E2E test infrastructure fix | **Ready** | @qa-lead | 4-6h | Login timeout + network issues blocking CI/CD. See [QA Report](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) |
| 2 | Accessibility (WCAG 2.1 AA) | **Ready** | @design-systems | 8-10h | Voice controls, skip links, ARIA labels. Legal compliance blocker. |
| 3 | PostHog instrumentation | **Ready** | @ops | 4-6h | Event schemas, onboarding funnel, alert thresholds. GH Issue #175 |

### P1: High Priority (Should Fix Before Launch)

| Priority | Item | Status | Owner | Effort | Notes |
|----------|------|--------|-------|--------|-------|
| 4 | CrewAI Report Viewer component | **Ready** | @frontend | 5-7 days | CrewAI generates reports but users can't see them. Critical gap. See [UI Wiring Audit](../reports/ui-crewai-wiring-audit.md) |
| 5 | Dashboard insights from CrewAI | **Ready** | @frontend | 3-4 days | Replace mock data with real AI insights. 81% of fields unused. |
| 6 | Evidence Explorer component | Blocked by #4 | @frontend | 3-5 days | Surface 65+ unused CrewAI fields to users. |
| 7 | Specification-driven test refresh | In Progress | @qa-lead | - | Update fixtures, Playwright journeys. GH Issue #189 |

### P2: Unblocked - Ready for E2E Testing

| Priority | Item | Status | Notes |
|----------|------|--------|-------|
| 8 | E2E validation flow | **Ready to Test** | CrewAI webhook implemented, product app ready. Blocked by P0 #1. |
| 9 | Real analysis data quality | **Available** | TavilySearchTool + 4 research tools provide real web data |

**CrewAI Status (2025-11-28):** Phase 2D complete (~85%). 18 tools implemented.

---

## Cross-Repo Dependencies - UPDATED 2025-11-28

```
✅ startupai-crew (CrewAI Phase 2D Complete - 85%)
    ↓ Webhook implemented, real web research, 18 tools
⚠️ app.startupai.site (This repo) ← CURRENT FOCUS: P0 blockers + Report UI
    ↓ E2E tests broken, accessibility pending, reports not displayed
startupai.site (Marketing)
    ↓ Waiting on Activity Feed + Metrics APIs
```

**Current Focus**:
1. Fix E2E test infrastructure (blocking CI/CD)
2. Build CrewAI Report Viewer (critical UX gap)

---

## Immediate Actions (Updated 2025-11-28)

1. **Fix E2E test infrastructure** - P0 blocker, 4-6 hours, enables CI/CD
2. **Start accessibility work** - P0 launch blocker, 8-10 hours
3. **Build CrewAI Report Viewer** - P1, users can't see analysis results

---

## What's Ready

**CrewAI Infrastructure Complete:**
- Webhook endpoint: `POST /api/crewai/webhook`
- All 80+ fields persisting to Supabase
- Hooks: `useCrewAIState`, `useInnovationSignals`, `useVPCData`

**What's Missing:**
- UI component to display full CrewAI analysis reports
- Evidence Explorer for unused fields
- Dashboard integration with real data

See [Integration QA Report](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) for details.

---

## How to Use This Document

1. **Pick highest priority "Ready" item** from P0 table first
2. **Update status** when you start work
3. **Move to done.md** when complete
4. **Check cross-repo-blockers.md** for upstream status

---

**Last Updated**: 2025-11-28
