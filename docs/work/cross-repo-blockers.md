---
purpose: "Cross-repository dependency tracking for coordinated delivery"
status: "active"
last_reviewed: "2026-01-16"
last_synced: "2026-01-16 - Two-Pass Architecture implemented for onboarding, ADR-004 created"
---

# Cross-Repository Blockers

This document tracks dependencies between StartupAI repositories to ensure coordinated delivery.

> **STATE-FIRST ARCHITECTURE (2026-01-16)**: ADR-005 approved - PostgreSQL RPC atomic commits for durability. See [ADR-005](../../startupai-crew/docs/adr/005-state-first-synchronized-loop.md).
>
> **TWO-PASS ARCHITECTURE (2026-01-16)**: Onboarding stage progression fix implemented. Backend-driven assessment replaces unreliable LLM tool-calling. See [ADR-004](../../startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md).

> **DOGFOODING VERIFIED (2026-01-12)**: Founder and Consultant browser journeys tested. Phase 0-1 HITL approvals working. RLS policies for consultant access deployed. API routes hardened with improved error handling.

## Ecosystem Status (2026-01-12)

**Dogfooding setup complete. Founder + Consultant journeys verified. API routes hardened. Phase 2 testing next.**

| Service | Status | Completion | Notes |
|---------|--------|------------|-------|
| CrewAI Backend | **PHASE 0-2 VALIDATED** | ~92% | Phase 3-4 live testing next |
| Product App | **API ROUTES HARDENED** | ~95% | Build passing, evidence display working |
| Marketing Site | Live API integration | ~95% | Activity Feed + Metrics connected |

**Production URLs**:
- Modal: `https://chris00walker--startupai-validation-fastapi-app.modal.run`
- Product App: `https://app-startupai-site.netlify.app`
- Marketing: `https://startupai.site`

**Canonical Architecture**: 5 Flows, 14 Crews, 45 Agents, 10 HITL checkpoints
**Legacy 3-repo workaround**: archived

**Source of Truth**: `startupai-crew/docs/master-architecture/09-status.md`

---

## This Repo Blocked By

### CrewAI Backend (`startupai-crew`)

| Blocker | Status | Description | Impact |
|---------|--------|-------------|--------|
| Modal Infrastructure | ✅ DEPLOYED | Production endpoints live | Can trigger validation |
| API Endpoints | ✅ WORKING | `/kickoff`, `/status`, `/hitl/approve`, `/health` | Full API operational |
| Supabase Tables | ✅ DEPLOYED | `validation_runs`, `validation_progress`, `hitl_requests` + security fixes | Live in production |
| Supabase Realtime | ✅ ENABLED | Progress tables publishing | Real-time UI updates |
| 14 Crews Implementation | ✅ COMPLETE | 45 agents across 14 crews | Structure complete |
| Tool Integration | ✅ COMPLETE | 15 tools, 35+ agents, 681 tests | Evidence-based outputs |
| Phase 0-2 Live Testing | ✅ COMPLETE | Pivot workflow verified | Desirability gate working |
| Asset Generation Specs | ✅ COMPLETE | Blueprint Pattern + Ad Platform Library | Ready for implementation |
| **Phase 3-4 Live Testing** | ⏳ **NEXT** | Feasibility + Viability gates | Final validation phases |

**Tool integration complete. Phase 0-2 validated. Phase 3-4 live testing next.**

#### Tool Architecture (Complete)

Tools implemented using BaseTool pattern (simpler than MCP server):

| Category | Count | Status |
|----------|-------|--------|
| Customer Research | 4 | ✅ Complete |
| Advanced Analysis | 4 | ✅ Complete |
| Analytics & Privacy | 4 | ✅ Complete |
| LLM-Based Tools | 3 | ✅ Complete |
| **TOTAL** | 15 | **✅ 35+ agents wired** |

#### Asset Generation Specs (New)

| Spec | Status | Description |
|------|--------|-------------|
| `LandingPageGeneratorTool` | ✅ Spec Complete | Blueprint Pattern, 9 components, Progressive Images |
| `AdCreativeGeneratorTool` | ✅ Spec Complete | Copy + Visuals, Progressive Resolution |
| Ad Platform Library | ✅ Created | Meta, Google, LinkedIn, TikTok specs |
| Observability Architecture | ✅ Created | Database schemas, callbacks, debugging |

**Reference**: `startupai-crew/docs/master-architecture/reference/`

### Remaining Work (Not Blockers)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Phase 3-4 Live Testing | ⏳ Next | CrewAI | Feasibility + Viability gates |
| Asset Generation Implementation | ⏳ Planned | CrewAI | Specs complete, waiting on F2/F3 fix |
| First production validation | ⏳ Pending | All repos | After Phase 3-4 complete |
| PostHog coverage gaps | ⚠️ 13+ events defined | Product | Need implementation |

---

## Schema Alignment (COMPLETE)

> **Deployed**: 2026-01-10 - Modal tables + security fixes applied
> **Owner**: This repo (Supabase migrations live here)

### Migrations Deployed

| Migration | Purpose | Status |
|-----------|---------|--------|
| `modal_validation_runs` | Checkpoint state | ✅ Deployed |
| `modal_validation_progress` | Realtime progress | ✅ Deployed |
| `modal_hitl_requests` | HITL checkpoint/resume | ✅ Deployed |
| `fix_security_definer_views` | 4 views fixed | ✅ Deployed |
| `fix_function_search_paths_v2` | 9 functions secured | ✅ Deployed |
| `fix_permissive_rls_policies` | Admin-only UPDATE | ✅ Deployed |
| `fix_rls_auth_initplan_part1-5` | 60+ RLS policies optimized | ✅ Deployed |
| `add_missing_fk_indexes` | 6 FK indexes added | ✅ Deployed |

### Alignment Status

| Pydantic Model | Supabase Table | Status |
|----------------|----------------|--------|
| `ValidationRunState` | `validation_runs` | ✅ Deployed |
| `ValidationRunState` | `crewai_validation_states` | ✅ Deployed (fallback) |
| `FoundersBrief` | `entrepreneur_briefs` | ⚠️ Structure mismatch |
| Evidence models | JSONB columns | ✅ Works (flexible) |

See `startupai-crew/docs/master-architecture/reference/data-flow.md` for complete analysis.

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

### Infrastructure Verification (2026-01-08) ✅

| Endpoint | Status | Result |
|----------|--------|--------|
| Modal `/health` | ✅ Verified | `{"status":"healthy","service":"startupai-validation"}` |
| Modal auth | ✅ Verified | Returns 401 for invalid tokens |
| Product App login | ✅ Verified | Returns 200 |
| Marketing site | ✅ Verified | Returns 200 |
| Marketing APIs | ✅ Verified | `/public-activity`, `/public-metrics` returning JSON |

### Full Flow (Pending crew completion)

```
User lands on startupai.site
    ↓
Signs up (Supabase Auth)
    ↓
Redirects to app.startupai.site with plan
    ↓
Completes onboarding chat (7 stages)
    ↓
Triggers Modal validation (POST /kickoff)
    ↓
Modal processes through 5 phases (14 crews)
    ↓
Results persist to Supabase
    ↓
Dashboard displays validation results
    ↓
Marketing activity feed shows real activity
```

**Status**: Infrastructure verified. Awaiting crew implementation completion.

---

## Coordination Notes

- **Modal infrastructure DEPLOYED** - Production endpoints verified (2026-01-08)
- **Product App UPDATED** - Pointing to Modal endpoints
- **Marketing site CONNECTED** - Live Activity Feed + Metrics components created
- **Legacy 3-repo workaround** - Archived
- **Primary work**: Complete 14 crews implementation, then run first production validation

---

## Cross-Repo Links

- CrewAI blockers: `startupai-crew/docs/work/cross-repo-blockers.md`
- Marketing blockers: `startupai.site/docs/work/cross-repo-blockers.md`
- Master architecture: `startupai-crew/docs/master-architecture/09-status.md`
- Migration plan: `~/.claude/plans/federated-prancing-lollipop.md`

---

**Last Updated**: 2026-01-16

**Changes (2026-01-16 - ADR-005 Approved)**:
- ✅ **ADR-005 APPROVED**: State-First Synchronized Loop architecture
- PostgreSQL RPC as atomic commit point with row-level locking
- Addresses durability risks: partial saves, race conditions, hydration gaps
- Implementation sequence: PR 1 (Schema), PR 2 (RPC), PR 3 (Modal), PR 4 (Frontend), PR 5 (Cleanup)
- ⏳ **NEXT**: PR 1 implementation

**Changes (2026-01-16 - Two-Pass Architecture)**:
- ✅ **ONBOARDING FIX**: Implemented Two-Pass Architecture (ADR-004) for reliable stage progression
- ✅ **ADR CREATED**: `startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md`
- ✅ **ERRATA FIXED**: E1-E4 (timestamp, schema min(3), legacy messages, test imports)
- ✅ **DOGFOODING FIXED**: P2 (progress regression), P3 (Invalid Date)
- Root cause: LLM tool calling was 18% reliable, causing stuck sessions
- Solution: Backend runs deterministic assessment after every response
- Impact: Phase 0 → Phase 1 pipeline should now reliably trigger CrewAI

**Changes (2026-01-12 - API Route Hardening)**:
- ✅ **APPROVAL ROUTES ENHANCED**: List + detail endpoints with better error handling
- ✅ **WEBHOOK ROUTE HARDENED**: Improved logging, validation, error responses
- ✅ **ONBOARDING COMPLETE**: Enhanced route with better session handling
- ✅ **EVIDENCE DISPLAY**: Working in approval detail modals
- ✅ **BUILD PASSING**: Production build verification successful
- ⏳ **NEXT**: Phase 2 Desirability testing (landing pages, experiments)

**Changes (2026-01-12 - Dogfooding Methodology & Browser Testing)**:
- ✅ **DOGFOODING ENSHRINED**: Test accounts documented in CLAUDE.md (both repos)
- ✅ **FOUNDER JOURNEY VERIFIED**: Login, dashboard, projects, approvals all working
- ✅ **CONSULTANT JOURNEY VERIFIED**: Login, clients, client projects all working
- ✅ **RLS POLICY DEPLOYED**: Consultants can now view client projects
- ✅ **TEST DATA CREATED**: StartupAI project (Founder), Elias Food Imports (Suzanne)
- ✅ **PHASE 0-1 HITL WORKING**: Founder's Brief + VPC approval both completed

**Changes (2026-01-10 - Upstream Tool Integration & Asset Specs Complete)**:
- ✅ **TOOLS COMPLETE**: 15 tools wired to 35+ agents, 681 tests passing
- ✅ **PHASE 0-2 VALIDATED**: Live testing with pivot workflow verified
- ✅ **ASSET GENERATION SPECS**: Blueprint Pattern, Progressive Images, Ad Platform Library
- ✅ **NEW REFERENCE DOCS**: `ad-platform-specifications.md`, `observability-architecture.md`
- ⏳ **NEXT**: Phase 3-4 live testing (Feasibility + Viability gates)

**Changes (2026-01-10 - Modal Tables & Security Fixes Deployed)**:
- ✅ **DEPLOYED**: Modal validation tables (`validation_runs`, `validation_progress`, `hitl_requests`)
- ✅ **SECURITY**: Fixed 4 SECURITY DEFINER views → SECURITY INVOKER
- ✅ **SECURITY**: Added `search_path = ''` to 9 functions
- ✅ **SECURITY**: Restricted beta/contact UPDATE policies to admin-only
- ✅ **PERFORMANCE**: Optimized 60+ RLS policies with `(select auth.uid())`
- ✅ **PERFORMANCE**: Added 6 missing FK indexes
- Schema alignment section updated to COMPLETE

**Previous (2026-01-09 - MCP Architecture Designed)**:
- 🚀 **MCP-FIRST**: CrewAI adopted Model Context Protocol as unified tool interface
- Architecture: 13 EXISTS + 10 MCP Custom + 4 MCP External + 6 LLM-Based = 33 tools
- Implementation roadmap: 60 hours over 4 weeks (~$5-10/month cost)
- Ready for Phase A: Core MCP Server setup
- Product App unblocked - infrastructure complete, awaiting tool implementation

**Previous (2026-01-09 - Agent Tool Wiring Gap Identified)**:
- Identified gap: crew structure complete but agents missing tools
- Now resolved with MCP architecture design

**Previous (2026-01-08 - Modal Production Deployment)**:
- Modal serverless deployed to production
- Infrastructure verification passed
- Product app updated to point to Modal
- Legacy 3-repo workaround marked as archived
