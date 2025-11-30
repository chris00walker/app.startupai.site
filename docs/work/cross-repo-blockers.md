---
purpose: "Cross-repository dependency tracking for coordinated delivery"
status: "active"
last_reviewed: "2025-11-30"
last_synced: "2025-11-30 - PostHog instrumentation complete, P0 blockers cleared"
---

# Cross-Repository Blockers

This document tracks dependencies between StartupAI repositories to ensure coordinated delivery.

## This Repo Blocked By

### CrewAI Backend (`startupai-crew`) - **UPDATED 2025-11-26**

| Blocker | Status | Description | Impact |
|---------|--------|-------------|--------|
| Phase 2D Completion | ✅ Complete | 8 crews, 18 agents, 18 tools, HITL, Flywheel | Can display results with real web research |
| Flow → Webhook Call | ✅ Implemented | `_persist_to_supabase()` POSTs to our webhook | Results will persist when flow completes |
| Real Analysis Tools | ✅ Implemented | TavilySearchTool + 4 research tools | Real web research available |
| Flywheel Learning Tables | ✅ Done | Tables created in Supabase | CrewAI can persist/query learnings |

**Status Update (2025-11-26):** CrewAI backend is ~85% complete. Core engine fully functional with:
- 18 tools implemented (research, financial, build, HITL, flywheel, privacy)
- `_persist_to_supabase()` webhook implemented in flow
- Resume handler for HITL approvals (`webhooks/resume_handler.py`)
- 192 integration tests passing

**Remaining Gaps (not blocking this repo):**
- Activity Feed API for marketing site (❌ Not Started)
- Metrics API for marketing site (❌ Not Started)
- Ad platform integration (Meta/Google) - explicitly deferred

**Phase Status**: See `startupai-crew/docs/work/phases.md`

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
| E2E Validation Flow | ✅ Ready to Test | Full flow: onboarding → analysis → results | Webhook + E2E infra fixed |
| Accessibility Foundation | ✅ Done | WCAG 2.1 AA foundation | Legal compliance path cleared |
| VPC Canvas | ✅ Done | Strategyzer-style SVG with fit lines | Professional canvas visualization |

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
✅ PostHog instrumentation (17 events wired - COMPLETED 2025-11-30)
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
- **Marketing site waiting on**: Activity Feed API and Metrics API (not yet built)
- Major completions Nov 28-30: E2E infra, Accessibility, Report Viewer, Evidence Explorer, VPC Canvas, PostHog

## Cross-Repo Links

- CrewAI blockers: `startupai-crew/docs/work/cross-repo-blockers.md`
- Marketing blockers: `startupai.site/docs/work/cross-repo-blockers.md`
- Master architecture: `startupai-crew/docs/master-architecture/01-ecosystem.md`
