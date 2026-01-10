---
purpose: "Cross-repository dependency tracking for coordinated delivery"
status: "active"
last_reviewed: "2026-01-09"
last_synced: "2026-01-09 - MCP architecture designed in CrewAI"
---

# Cross-Repository Blockers

This document tracks dependencies between StartupAI repositories to ensure coordinated delivery.

> **MCP ARCHITECTURE READY (2026-01-09)**: CrewAI adopting Model Context Protocol for unified tool interface. 33 tools mapped to 45 agents. 60-hour, 4-week implementation. See `startupai-crew/docs/work/phases.md` for roadmap.

## Ecosystem Status (2026-01-09)

**MCP architecture designed. CrewAI implementing tools over next 4 weeks.**

| Service | Status | Completion | Notes |
|---------|--------|------------|-------|
| CrewAI Backend | **MCP IMPLEMENTATION** | ~80% | 60h roadmap, starting Phase A |
| Product App | Modal integration complete | ~95% | Pointing to Modal endpoints |
| Marketing Site | Live API integration | ~95% | Activity Feed + Metrics connected |

**Production URLs**:
- Modal: `https://chris00walker--startupai-validation-fastapi-app.modal.run`
- Product App: `https://app-startupai-site.netlify.app`
- Marketing: `https://startupai.site`

**Canonical Architecture**: 5 Flows, 14 Crews, 45 Agents, 10 HITL checkpoints
**AMP (ARCHIVED)**: Legacy 3-repo workaround deprecated

**Source of Truth**: `startupai-crew/docs/master-architecture/09-status.md`

---

## This Repo Blocked By

### CrewAI Backend (`startupai-crew`)

| Blocker | Status | Description | Impact |
|---------|--------|-------------|--------|
| Modal Infrastructure | ✅ DEPLOYED | Production endpoints live | Can trigger validation |
| API Endpoints | ✅ WORKING | `/kickoff`, `/status`, `/hitl/approve`, `/health` | Full API operational |
| Supabase Tables | ✅ READY | `validation_runs`, `validation_progress`, `hitl_requests` | State persistence works |
| Supabase Realtime | ✅ ENABLED | Progress tables publishing | Real-time UI updates |
| 14 Crews Implementation | ✅ COMPLETE | 45 agents across 14 crews | Structure complete |
| **MCP Tool Implementation** | 🔄 **IN PROGRESS** | 60h roadmap, 4 weeks | Evidence-based outputs |

**Modal infrastructure deployed. Crew structure complete. MCP implementation in progress.**

#### MCP Architecture (Unified Tool Interface)

CrewAI adopting Model Context Protocol for all agent tools:

| Category | Count | Implementation |
|----------|-------|----------------|
| EXISTS | 13 | Ready to wire (direct Python import) |
| MCP Custom | 10 | FastMCP on Modal (forum_search, analyze_reviews, etc.) |
| MCP External | 4 | Community servers (Meta Ads, Google Ads, Calendar, Fetch) |
| LLM-Based | 6 | Pydantic structured output |
| **TOTAL** | 33 | 45 agents mapped |

**Implementation Phases** (in progress in `startupai-crew`):
- Phase A (Week 1): Core MCP Server - 15h
- Phase B (Week 2): Advanced Tools - 14h
- Phase C (Week 3): External MCP + Analytics - 13h
- Phase D (Week 4): CrewAI Integration - 18h

**Cost**: ~$5-10/month (Modal compute only)

### Legacy AMP (ARCHIVED)

| Item | Status | Notes |
|------|--------|-------|
| 3-Crew Architecture | ⚠️ DEPRECATED | Being archived |
| `startupai-crew-validation` | ⚠️ TO ARCHIVE | Repo will be archived (read-only) |
| `startupai-crew-decision` | ⚠️ TO ARCHIVE | Repo will be archived (read-only) |

### Remaining Work (Not Blockers)

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Crew implementation (14 crews) | ⏳ In progress | CrewAI | Building fresh from specs |
| First production validation | ⏳ Pending | All repos | After crews complete |
| PostHog coverage gaps | ⚠️ 13+ events defined | Product | Need implementation |

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
- **Product App UPDATED** - Pointing to Modal endpoints (not AMP)
- **Marketing site CONNECTED** - Live Activity Feed + Metrics components created
- **AMP DEPRECATED** - Legacy repos being archived
- **Primary work**: Complete 14 crews implementation, then run first production validation

---

## Cross-Repo Links

- CrewAI blockers: `startupai-crew/docs/work/cross-repo-blockers.md`
- Marketing blockers: `startupai.site/docs/work/cross-repo-blockers.md`
- Master architecture: `startupai-crew/docs/master-architecture/09-status.md`
- Migration plan: `~/.claude/plans/federated-prancing-lollipop.md`

---

**Last Updated**: 2026-01-09

**Changes (2026-01-09 - MCP Architecture Designed)**:
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
- AMP marked as deprecated
