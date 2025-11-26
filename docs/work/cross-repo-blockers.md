---
purpose: "Cross-repository dependency tracking for coordinated delivery"
status: "active"
last_reviewed: "2025-11-26"
---

# Cross-Repository Blockers

This document tracks dependencies between StartupAI repositories to ensure coordinated delivery.

## This Repo Blocked By

### CrewAI Backend (`startupai-crew`)

| Blocker | Status | Description | Impact |
|---------|--------|-------------|--------|
| Phase 1 Completion | ⚠️ Partial | Flow works, outputs synthetic | Can display results, but quality is fiction |
| Flow → Webhook Call | ⏳ Pending | CrewAI Flow needs to POST to our webhook | Results won't persist until this is wired |
| Real Analysis Tools | Not Started | Tools for web research, data retrieval | Outputs will remain synthetic without this |

**Important Note:** Even when CrewAI Phase 1 "completes", the outputs will be LLM-generated synthetic data, not real analysis. This affects all downstream features that depend on "real" validation results.

**Phase 1 Complete Criteria**: See `startupai-crew/docs/work/phases.md`

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
| Results Display UI | ✅ Done | Dashboard showing analysis results | Ready when CrewAI posts to webhook |
| E2E Validation Flow | ⏳ Pending | Full flow: onboarding → analysis → results | Blocked by CrewAI webhook integration |

## Phase Alpha Dependencies

Phase Alpha (CrewAI Delivery & Onboarding Hardening) requires:
1. **CrewAI Phase 1 complete** → ⚠️ Partial (Flow exists, outputs synthetic)
2. **Results persistence** → ✅ Webhook ready, awaiting CrewAI integration
3. **Results display** → ✅ `ValidationResultsSummary` wired to dashboard

### Dependency Chain
```
CrewAI Phase 1 Complete
         ↓
CrewAI Flow calls POST /api/crewai/webhook  ← CURRENT BLOCKER
         ↓
Product App displays real results (ready)
         ↓
Marketing Phase 4 Validation Cycles

✅ Learning Tables Migration (done)
         ↓
CrewAI Flywheel Tools (pending integration)
         ↓
AI Founders Get Smarter
```

## Coordination Notes

- **Primary blocker**: CrewAI Flow needs to POST to `/api/crewai/webhook`
- Product App is ready to receive and display results
- Can proceed with onboarding hardening, PostHog, accessibility work in parallel

## Cross-Repo Links

- CrewAI blockers: `startupai-crew/docs/work/cross-repo-blockers.md`
- Marketing blockers: `startupai.site/docs/work/cross-repo-blockers.md`
- Master architecture: `startupai-crew/docs/master-architecture/ecosystem.md`
