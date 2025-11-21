---
purpose: "Cross-repository dependency tracking for coordinated delivery"
status: "active"
last_reviewed: "2025-11-21"
---

# Cross-Repository Blockers

This document tracks dependencies between StartupAI repositories to ensure coordinated delivery.

## This Repo Blocked By

### CrewAI Backend (`startupai-crew`)

| Blocker | Status | Description | Impact |
|---------|--------|-------------|--------|
| Phase 1 Completion | In Progress | Service, Analysis, Governance crews + Flow | Cannot complete Phase Alpha without functional crews |
| Results → Supabase | Not Started | Persist CrewAI outputs to database | Cannot display analysis results in dashboard |
| Resume/Webhook API | Not Started | Human-in-the-loop approval workflow | Cannot implement approval UI |

**Phase 1 Complete Criteria**: See `startupai-crew/docs/work/phases.md`

## This Repo Blocks

### Marketing Site (`startupai.site`)

| Blocked Item | Status | Description | Impact |
|--------------|--------|-------------|--------|
| Results Display UI | Not Started | Dashboard showing analysis results | Marketing Phase 4 validation cycles require E2E flow |

## Phase Alpha Dependencies

Phase Alpha (CrewAI Delivery & Onboarding Hardening) requires:
1. **CrewAI Phase 1 complete** → Functional crews and Flow
2. **Results persistence** → CrewAI outputs stored in Supabase
3. **Results display** → Dashboard UI to show analysis outputs

### Dependency Chain
```
CrewAI Phase 1 Complete
         ↓
Results → Supabase persistence
         ↓
Product App Results Display UI
         ↓
Marketing Phase 4 Validation Cycles
```

## Coordination Notes

- Phase Alpha blocked primarily by CrewAI Phase 1 completion
- Can proceed with onboarding hardening, PostHog, accessibility work in parallel
- Results display is the critical path item

## Cross-Repo Links

- CrewAI blockers: `startupai-crew/docs/work/cross-repo-blockers.md`
- Marketing blockers: `startupai.site/docs/work/cross-repo-blockers.md`
- Master architecture: `startupai-crew/docs/master-architecture/ecosystem.md`
