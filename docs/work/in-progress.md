---
purpose: "Private technical source of truth for active work"
status: "active"
last_reviewed: "2026-01-14"
last_synced: "2026-01-14 - Onboarding UX bugs fixed from dogfooding feedback"
---

# In Progress

## Current Focus (2026-01-12)

**Dogfooding: Testing StartupAI using StartupAI**

Test Accounts:
- **Founder**: chris00walker@proton.me (validates StartupAI as business idea)
- **Consultant**: chris00walker@gmail.com (advises StartupAI as client)

Status:
- ✅ Phase 0 (Onboarding) - Founder's Brief approved
- ✅ Phase 1 (VPC Discovery) - VPC fit score 73/100, approved
- ⏳ Phase 2 (Desirability) - Landing pages, experiments (NEXT)
- ⏳ Phase 3-4 - Feasibility + Viability (pending)

Recent Session Work (2026-01-12):
- ✅ Approval API routes enhanced (list + detail endpoints)
- ✅ Webhook route hardened (better error handling, logging)
- ✅ Onboarding complete route improved
- ✅ Evidence summary display working in approval modals
- ✅ RLS policy for consultant client project access deployed
- ✅ Build verification passed (pnpm build succeeds)

See `cross-repo-blockers.md` for ecosystem status.

---

## Priority Order

Work these items in order. Items marked "Ready" can start immediately.

### P0: Launch Blockers (Work First)

| Priority | Item | Status | Owner | Effort | Notes |
|----------|------|--------|-------|--------|-------|
| - | *No P0 blockers remaining* | ✅ | - | - | Dogfooding setup complete 2026-01-12 |

### P1: High Priority (Should Fix Before Launch)

| Priority | Item | Status | Owner | Effort | Notes |
|----------|------|--------|-------|--------|-------|
| 1 | Onboarding UX Bug Fixes (Dogfooding) | ✅ **DONE** | @frontend | ~8 hours | See details below |
| 2 | Phase 2 Desirability Testing | **IN PROGRESS** | @dogfooding | ~2 hours | Landing pages, experiments |
| 3 | Dashboard insights from CrewAI | ✅ Done | @frontend | ~4 hours | Consultant dashboard showing real client data |
| 4 | PostHog coverage gaps | **Ready** | @frontend | 2-3 days | 13+ events defined but not implemented |

#### Onboarding UX Bug Fixes (Completed 2026-01-14)

Issues found during dogfooding testing of Founder onboarding flow:

| Fix | Status | Notes |
|-----|--------|-------|
| Progress tracking race condition | ✅ | Added 800ms delay before refetchSessionStatus |
| Empty AI response validation | ✅ | Skip saving empty messages in onFinish callback |
| Optimistic progress removed | ✅ | Now uses backend-calculated progress only |
| Dashboard shows active sessions | ✅ | ContinueSessionCard instead of empty state |
| Save & Exit pauses session | ✅ | New /api/onboarding/pause endpoint |
| AI tool execution forced | ✅ | toolChoice: 'required' + strengthened prompt |
| Progress display fixed | ✅ | Shows "Stage X of 7" instead of "0/7 stages" |
| Stage completion toast | ✅ | Toast notification on stage advancement |
| Redundant X button removed | ✅ | Single "Save & Exit" button in footer |
| Start New wired up | ✅ | Already implemented - calls abandon API |
| forceNew URL param honored | ✅ | useSearchParams reads ?forceNew=true, passed to initializeSession |
| Start New dialog progress context | ✅ | Shows % complete and message count before confirming |
| Elapsed-time estimate | ✅ | Dynamic calculation based on actual time spent per stage |
| Locked-stage visuals | ✅ | Lock icon, cursor-not-allowed, tooltip for pending stages |
| 500ms minimum loading | ✅ | Prevents jarring flash on fast initialization |

### P2: Ready for E2E Testing

| Priority | Item | Status | Notes |
|----------|------|--------|-------|
| 1 | Phase 0-1 HITL flow | ✅ **VERIFIED** | Founder's Brief + VPC approval working |
| 2 | Founder dashboard | ✅ **VERIFIED** | Projects, approvals, evidence display |
| 3 | Consultant dashboard | ✅ **VERIFIED** | Clients, client projects (RLS policy deployed) |
| 4 | Phase 2 Desirability | **NEXT** | Landing page generation, experiments |
| 5 | Phase 3-4 Feasibility/Viability | **Pending** | After Phase 2 complete |

**Modal Status (2026-01-12):** Production deployed, Phase 0-2 validated, HITL working.

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

**Last Updated**: 2026-01-14

**Changes (2026-01-14):**
- Fixed Founder onboarding UX bugs found during dogfooding
- Progress tracking race condition resolved (800ms delay before status refetch)
- Empty AI response validation added
- Dashboard now shows "Continue Session" card for active onboarding sessions
- Save & Exit now properly pauses session (new /api/onboarding/pause endpoint)
- AI tool execution forced with toolChoice: 'required'
- Progress display fixed ("Stage X of 7" instead of "0/7 stages")
- Stage completion toast notifications added
- Redundant X exit button removed from sidebar

**Previous (2026-01-12):**
- Dogfooding methodology enshrined in CLAUDE.md files
- Founder journey verified (login, dashboard, projects, approvals)
- Consultant journey verified (login, clients, client projects)
- RLS policy deployed for consultant client project access
- Phase 0-1 HITL approvals tested and working
- Test data created (StartupAI + Elias Food Imports projects)

**Previous (2025-12-05):**
- Added Upstream Architecture Change notice
- Updated CrewAI status: Flow → 3-Crew migration
