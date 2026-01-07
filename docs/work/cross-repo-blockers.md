---
purpose: "Cross-repository dependency tracking for coordinated delivery"
status: "active"
last_reviewed: "2026-01-07"
last_synced: "2026-01-07 - Full ecosystem status sync from startupai-crew"
---

# Cross-Repository Blockers

This document tracks dependencies between StartupAI repositories to ensure coordinated delivery.

## Ecosystem Status (2026-01-07)

**All services deployed and functional.** Primary work is E2E verification.

| Service | Status | Completion |
|---------|--------|------------|
| CrewAI Backend | ✅ 3 Crews deployed to AMP | ~85% |
| Product App | ✅ Phase Alpha complete | ~85% |
| Marketing Site | ✅ Production, static export | ~90% |

**Source of Truth**: `startupai-crew/docs/master-architecture/09-status.md`

---

## This Repo Blocked By

### CrewAI Backend (`startupai-crew`)

| Blocker | Status | Description | Impact |
|---------|--------|-------------|--------|
| 3-Crew Architecture | ✅ DEPLOYED | 19 agents, 32 tasks, 7 HITL | Full pipeline operational |
| Crew 1 Deployment | ✅ DEPLOYED | UUID: `6b1e5c4d-e708-4921-be55-08fcb0d1e94b` | Can trigger validation |
| Crews 2 & 3 Repos | ✅ DEPLOYED | Separate GitHub repos created | Full pipeline works |
| Crew Chaining | ✅ CONFIGURED | `InvokeCrewAIAutomationTool` wired | Inter-crew communication |
| Crew 1 Best Practices | ✅ COMPLETE | 100% CrewAI alignment (2026-01-06) | Structured outputs |

**All CrewAI blockers resolved.** E2E verification is the remaining work.

### Remaining Work (Not Blockers)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| E2E flow verification | ⚠️ Ready to test | All repos | All components exist |
| PostHog coverage gaps | ⚠️ 13+ events defined | Product | Need implementation |
| Dashboard mock replacement | ⚠️ Some remaining | Product | Wire to CrewAI data |

---

## This Repo Provides

### CrewAI Backend (`startupai-crew`)

| Item | Status | Description | Unblocks |
|------|--------|-------------|----------|
| Webhook endpoint | ✅ Done | `POST /api/crewai/webhook` accepts results | CrewAI can persist outputs |
| Learning tables migration | ✅ Done | pgvector tables for flywheel learning | CrewAI learning tools can persist/query |
| HITL approval tables | ✅ Done | `approval_requests` table + API | CrewAI can request human approvals |
| Consultant webhook | ✅ Done | Handles `consultant_onboarding` flow | Consultant analysis can persist |

### Marketing Site (`startupai.site`)

| Item | Status | Description | Unblocks |
|------|--------|-------------|----------|
| Activity Feed API | ✅ Done | `GET /api/v1/public/activity` | Marketing can show live agent activity |
| Metrics API | ✅ Done | `GET /api/v1/public/metrics` | Marketing can display trust metrics |
| Results Display UI | ✅ Done | Dashboard + Report Viewer + Evidence Explorer | Full UI ready |
| VPC Canvas | ✅ Done | Strategyzer-style SVG with fit lines | Professional visualization |

**Marketing site is fully unblocked.** APIs are shipped and ready for connection.

---

## This Repo Blocks

### Marketing Site (`startupai.site`)

| Blocked Item | Status | Description |
|--------------|--------|-------------|
| Activity Feed connection | ⚠️ API Ready | Marketing needs to connect to `/api/v1/public/activity` |
| Metrics connection | ⚠️ API Ready | Marketing needs to connect to `/api/v1/public/metrics` |

**Note:** APIs are shipped. Marketing site has components built with mock data. Just needs to wire to real APIs.

---

## E2E Verification Checklist

The following flow needs live verification:

```
User lands on startupai.site
    ↓
Signs up (Supabase Auth)
    ↓
Redirects to app.startupai.site with plan
    ↓
Completes onboarding chat (7 stages)
    ↓
Triggers CrewAI analysis (POST /kickoff)
    ↓
CrewAI processes through 3 crews
    ↓
Webhook persists results to Supabase
    ↓
Dashboard displays validation results
    ↓
Marketing activity feed shows real activity
```

**Status**: All components exist. Needs live end-to-end test.

---

## Coordination Notes

- **CrewAI backend is UNBLOCKED** - All 3 crews deployed to AMP
- **Product App P0 COMPLETE** - No remaining P0 blockers
- **Marketing site UNBLOCKED** - Activity Feed + Metrics APIs shipped
- **Test Suite Healthy** - 463+ tests passing
- **Primary blocker**: E2E verification with live data

---

## Cross-Repo Links

- CrewAI blockers: `startupai-crew/docs/work/cross-repo-blockers.md`
- Marketing blockers: `startupai.site/docs/work/cross-repo-blockers.md`
- Master architecture: `startupai-crew/docs/master-architecture/09-status.md`

---

**Last Updated**: 2026-01-07

**Changes (2026-01-07 - Full Ecosystem Sync)**:
- Synced with `startupai-crew/docs/master-architecture/09-status.md` cross-repo rewrite
- Updated all CrewAI blockers from "Pending" to "DEPLOYED"
- All 3 crews now deployed and online on AMP
- Updated status tables to reflect current reality
- Added E2E Verification Checklist
- Primary blocker is now E2E verification, not deployment
