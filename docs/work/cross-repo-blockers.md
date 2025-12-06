---
purpose: "Cross-repository dependency tracking for coordinated delivery"
status: "active"
last_reviewed: "2025-12-05"
last_synced: "2025-12-05 - CrewAI architecture migrated from Flow to 3-Crew"
---

# Cross-Repository Blockers

This document tracks dependencies between StartupAI repositories to ensure coordinated delivery.

## Architecture Change Notice (2025-12-05)

**MAJOR UPSTREAM CHANGE**: CrewAI has migrated from Flow-based to 3-Crew architecture.

| Item | Status | Notes |
|------|--------|-------|
| Architecture change | ✅ Complete | Flow → 3-Crew (see ADR-001 in startupai-crew) |
| Code complete | ✅ Complete | 19 agents, 32 tasks, 7 HITL checkpoints |
| AMP deployment | ⚠️ Pending | Requires `crewai login` and deploy |
| Crews 2 & 3 repos | ⚠️ Pending | Need separate GitHub repos |

**Impact on Product App:**
- API endpoint remains the same: `POST /kickoff` on Crew 1
- Internal structure changed (3 crews instead of 1 flow)
- **Wait for deployment before E2E testing**

**Why the change:**
- AMP platform has issues with `type = "flow"` projects
- Flows returned `source: memory` without executing
- 3-Crew architecture uses `type = "crew"` which works reliably

**ADR**: See `startupai-crew/docs/adr/001-flow-to-crew-migration.md`

---

## This Repo Blocked By

### CrewAI Backend (`startupai-crew`) - **UPDATED 2025-12-05**

| Blocker | Status | Description | Impact |
|---------|--------|-------------|--------|
| 3-Crew Architecture | ✅ Code Complete | 19 agents, 32 tasks, 7 HITL | New architecture ready |
| Crew 1 Deployment | ⚠️ Pending | Requires `crewai login` then deploy | Can't test E2E until deployed |
| Crews 2 & 3 Repos | ⚠️ Pending | Need separate GitHub repos | Full pipeline blocked |
| Crew Chaining | ⚠️ Pending | `InvokeCrewAIAutomationTool` config | Inter-crew communication |

**Status Update (2025-12-05):** CrewAI has migrated from Flow to 3-Crew architecture.

**New Architecture:**
- Crew 1 (Intake): 4 agents, 6 tasks, 1 HITL - parses input, creates VPC
- Crew 2 (Validation): 12 agents, 21 tasks, 5 HITL - runs D/F/V validation
- Crew 3 (Decision): 3 agents, 5 tasks, 1 HITL - synthesizes and decides

**What's Ready:**
- All crew code complete and tested
- Crew 1 at repo root with `type = "crew"`
- Old Flow code archived

**What's Pending:**
- CrewAI login (session expired)
- AMP deployment for all 3 crews
- Separate repos for Crews 2 & 3

**Phase Status**: See `startupai-crew/docs/work/phases.md` (Phase 0 - Deployment)

## This Repo Provides

### CrewAI Backend (`startupai-crew`)

| Item | Status | Description | Unblocks |
|------|--------|-------------|----------|
| Webhook endpoint | ✅ Done | `POST /api/crewai/webhook` accepts results | CrewAI Flow can persist outputs |
| Learning tables migration | ✅ Done | pgvector tables for flywheel learning | CrewAI learning tools can persist/query |
| HITL approval tables | ✅ Done | `approval_requests` table + API | CrewAI can request human approvals |
| Consultant webhook | ✅ Done | Handles `consultant_onboarding` flow | Consultant analysis can persist |

**Completed Infrastructure (2025-11-26):**
- ✅ Unified webhook at `/api/crewai/webhook` (handles `founder_validation` and `consultant_onboarding`)
- ✅ Flywheel tables: `learnings`, `patterns`, `outcomes`, `domain_expertise`
- ✅ Vector similarity search functions: `search_learnings`, `search_patterns`, `get_domain_expertise`
- ✅ Industry benchmark seed data pre-populated
- ✅ Approval workflow: `/api/approvals` with CRUD operations

## This Repo Blocks

### Marketing Site (`startupai.site`)

| Blocked Item | Status | Description | Impact |
|--------------|--------|-------------|--------|
| Results Display UI | ✅ Done | Dashboard + Report Viewer + Evidence Explorer | Full UI ready for CrewAI results |
| E2E Validation Flow | ✅ Ready to Test | Full flow: onboarding → analysis → results | Integration test added 2025-12-02 |
| Accessibility Foundation | ✅ Done | WCAG 2.1 AA foundation | Legal compliance path cleared |
| VPC Canvas | ✅ Done | Strategyzer-style SVG with fit lines | Professional canvas visualization |
| Activity Feed API | ✅ Done | `GET /api/v1/public/activity` | Marketing can show live agent activity |
| Metrics API | ✅ Done | `GET /api/v1/public/metrics` | Marketing can display trust metrics |

## Phase Alpha Dependencies

Phase Alpha (CrewAI Delivery & Onboarding Hardening) requires:
1. **CrewAI Phase 2D complete** → ✅ Complete (18 tools, real web research)
2. **Results persistence** → ✅ Webhook implemented (`_persist_to_supabase()`)
3. **Results display** → ✅ `ValidationResultsSummary` wired to dashboard

### Dependency Chain - UPDATED 2025-11-30
```
✅ CrewAI Phase 2D Complete (8 crews, 18 agents, 18 tools)
         ↓
✅ CrewAI Flow calls POST /api/crewai/webhook (implemented)
         ↓
✅ Product App displays real results (Report Viewer + Evidence Explorer)
         ↓
✅ E2E test infrastructure fixed
         ↓
✅ PostHog instrumentation (~12 events wired - COMPLETED 2025-11-30)
         ↓
Marketing Phase 4 Validation Cycles

✅ Learning Tables Migration (done)
         ↓
✅ CrewAI Flywheel Tools (implemented)
         ↓
AI Founders Get Smarter (operational)
```

## Coordination Notes

- **CrewAI backend is UNBLOCKED** - All dependencies on CrewAI are resolved
- **Product App P0 COMPLETE** - No remaining P0 blockers as of 2025-11-30
- **Marketing site UNBLOCKED** - Activity Feed API and Metrics API now available
- **Test Suite Healthy** - 355 passing, specification tests 12/12, timing tests synthetic
- Major completions Nov 28-30: E2E infra, Accessibility, Report Viewer, Evidence Explorer, VPC Canvas, PostHog, Public APIs, Test Suite fixes
- **Integration Test Added (2025-12-02)**: `webhook-to-dashboard.integration.test.ts` verifies full webhook → DB → dashboard flow

## Cross-Repo Links

- CrewAI blockers: `startupai-crew/docs/work/cross-repo-blockers.md`
- Marketing blockers: `startupai.site/docs/work/cross-repo-blockers.md`
- Master architecture: `startupai-crew/docs/master-architecture/01-ecosystem.md`
