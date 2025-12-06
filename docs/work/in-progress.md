---
purpose: "Private technical source of truth for active work"
status: "active"
last_reviewed: "2025-12-05"
last_synced: "2025-12-05 - CrewAI migrated to 3-Crew architecture"
---

# In Progress

## Upstream Architecture Change (2025-12-05)

**CrewAI has migrated from Flow to 3-Crew architecture.**

- Code complete: 19 agents, 32 tasks, 7 HITL checkpoints
- Deployment pending: `crewai login` needed
- **E2E testing blocked until deployment completes**

See `cross-repo-blockers.md` for details.

---

## Priority Order

Work these items in order. Items marked "Ready" can start immediately.

### P0: Launch Blockers (Work First)

| Priority | Item | Status | Owner | Effort | Notes |
|----------|------|--------|-------|--------|-------|
| - | *No P0 blockers remaining* | ✅ | - | - | PostHog instrumentation completed 2025-11-30 |

### P1: High Priority (Should Fix Before Launch)

| Priority | Item | Status | Owner | Effort | Notes |
|----------|------|--------|-------|--------|-------|
| 2 | Dashboard insights from CrewAI | ✅ Done | @frontend | ~4 hours | Consultant dashboard mock data replaced with usePortfolioActivity hook |
| 3 | Specification-driven test refresh | ✅ Done | @qa-lead | ~4 hours | TypeScript errors fixed, accessibility roles added, test pollution resolved |
| 4 | PostHog coverage gaps | **Ready** | @frontend | 2-3 days | 13+ events defined but not implemented (see backlog.md) |

### P2: Ready for E2E Testing

| Priority | Item | Status | Notes |
|----------|------|--------|-------|
| 4 | E2E validation flow | **Blocked** | Waiting for CrewAI 3-Crew deployment |
| 5 | Real analysis data quality | **Blocked** | Depends on deployed crews |

**CrewAI Status (2025-12-05):** Migrated to 3-Crew architecture. Code complete, deployment pending.

---

## Cross-Repo Dependencies - UPDATED 2025-12-05

```
⚠️ startupai-crew (3-Crew Architecture - Deployment Pending)
    ↓ Code complete, needs crewai login + deploy
    ↓ 19 agents, 32 tasks, 7 HITL checkpoints
✅ app.startupai.site (This repo) ← P0 BLOCKERS CLEARED
    ↓ PostHog done, E2E tests fixed, accessibility done, reports + evidence explorer done
    ↓ Activity Feed API + Metrics API shipped
✅ startupai.site (Marketing) ← UNBLOCKED
    ↓ All APIs available, ready for Phase 4 Validation
```

**Current Focus**:
1. Wait for CrewAI 3-Crew deployment (blocking E2E testing)
2. PostHog coverage gaps (P1 - can proceed independently)

---

## Immediate Actions (Updated 2025-11-30)

1. **Dashboard CrewAI integration** - Replace mock data with real AI insights (P1)
2. **Specification-driven test refresh** - Update fixtures, Playwright journeys (P1)

---

## What's Ready

**CrewAI Infrastructure Complete:**
- Webhook endpoint: `POST /api/crewai/webhook`
- All 80+ fields persisting to Supabase
- Hooks: `useCrewAIState`, `useInnovationSignals`, `useVPCData`, `usePortfolioActivity`
- CrewAI Report Viewer component (comprehensive report display)
- Evidence Explorer with D-F-V metrics
- VPC Strategyzer-style canvas with animated fit lines
- E2E test infrastructure (timeouts fixed, API mocks)
- Accessibility foundation (WCAG 2.1 AA + semantic landmarks)
- Consultant dashboard using real portfolio activity data

**Alex Onboarding UX Complete (Nov 30):**
- Project creation routes to Alex (`/onboarding/founder`) not quick wizard
- Session management: "Start New Conversation" button + resume indicator
- Team awareness: Alex knows about Sage (CSO) and 6 AI founders
- Abandon session API: `POST /api/onboarding/abandon`
- 108 unit tests + 4 E2E tests for full coverage

**Test Suite Health (Updated 2025-11-30):**
- 463+ tests passing (355 existing + 108 Alex UX tests), 17 skipped (intentional)
- Specification tests: 12/12 passing (accessibility, contracts, keyboard nav)
- Alex UX tests: 108 passing (abandon API, sidebar, dashboard, prompt, wizard)
- E2E onboarding: 4 new session management tests added
- Deployment tests: Skip by default (require running server)
- Timing tests: Using synthetic values per PERFORMANCE_TARGETS
- Test pollution: Resolved with global afterEach cleanup

**What's Missing:**
- PostHog coverage gaps (13+ events not implemented - P1 remaining item)

See [Integration QA Report](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) for details.

---

## How to Use This Document

1. **Pick highest priority "Ready" item** from P1 table (no P0 blockers remaining)
2. **Update status** when you start work
3. **Move to done.md** when complete
4. **Check cross-repo-blockers.md** for upstream status

---

**Last Updated**: 2025-12-05

**Changes (2025-12-05):**
- Added Upstream Architecture Change notice
- Updated CrewAI status: Flow → 3-Crew migration
- E2E testing now blocked until deployment completes
