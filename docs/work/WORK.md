# Product App Work Tracker

**Last updated**: 2026-01-20
**Current Status**: ~85% complete (Phase Alpha)

## Validation-Driven Workflow

> **Every feature tests an assumption. Use `/validation-status` to see current state.**

See [docs/validation/](../validation/) for full validation methodology:
- [startupai-brief.md](../validation/startupai-brief.md) - StartupAI's own Founder's Brief
- [assumptions.md](../validation/assumptions.md) - 8 key assumptions with test cards
- [evidence-tracker.md](../validation/evidence-tracker.md) - Current evidence state
- [roadmap.md](../validation/roadmap.md) - Validation-driven feature roadmap

## Current Focus

**Dogfooding StartupAI using StartupAI**
- Founder: chris00walker@proton.me
- Consultant: chris00walker@gmail.com

| Phase | Status |
|-------|--------|
| Phase 0 (Onboarding) | Founder's Brief approved |
| Phase 1 (VPC Discovery) | VPC fit score 73/100, approved |
| Phase 2 (Desirability) | **NEXT** - Landing pages, experiments |
| Phase 3-4 | Pending |

## In Progress

### P0: Critical (Launch Blockers)

| Item | Assumption | Status | Notes |
|------|------------|--------|-------|
| Delete deploy zip with secrets | - | **CRITICAL** | 423MB zip contains SERVICE_ROLE_KEY |
| Apply Realtime migration | - | Ready | `20260115000001_enable_onboarding_realtime.sql` |
| Apply founders_briefs migration | - | Ready | `20260115000002_founders_briefs.sql` |
| PostHog Quick Start events | A2 | **NEW** | Track completion rate, time |
| PostHog HITL approval events | A1 | **NEW** | Track approval rate |

### P1: High Priority

| Item | Assumption | Status | Notes |
|------|------------|--------|-------|
| WTP pricing survey | A4 | **NEW** | No pricing data yet |
| Field-level edit tracking | A3 | **NEW** | Track brief accuracy |
| Documentation Refresh | - | Ready | |
| Journey-Driven Testing | - | Ready | |
| Phase 0 Webhook Data Model Fix | - | Ready | |
| Transcript Handoff to Modal | - | Ready | |
| Onboarding UX Overhaul verification | - | Pending | |
| PostHog coverage gaps | A1, A2, A3 | Ready | Core evidence collection |

## Recently Completed

### January 2026
- Two-Pass Architecture (ADR-004) - Deterministic backend assessment
- Project Archive/Delete Feature
- Client Archive Feature
- Groq Integration via OpenRouter
- Onboarding UX bug fixes

### November 2025
- Alex UX Improvements
- Public APIs (Activity Feed + Metrics)
- PostHog instrumentation (~12 events)
- E2E test infrastructure fixes
- Accessibility WCAG 2.1 AA foundation
- CrewAI Report Viewer + Evidence Explorer
- VPC Strategyzer-style canvas

## Backlog

### P2: Medium Priority

| Item | Assumption | Evidence Gap |
|------|------------|--------------|
| IH launch prep | A8 | No channel data |
| Landing page A/B test | A5 | VPD resonance unknown |
| HITL Approval UI Data Source update | A1 | Improves trust signal |
| Consultant marketing | A6 | No segment data |
| VPC geometric shapes | - | UX polish |
| HITL comment display | - | UX polish |

### P3: Future Enhancements

| Item | Assumption | Notes |
|------|------------|-------|
| AI Founders A/B test | A7 | Messaging optimization |
| PDF/PowerPoint export | - | Feature request |
| Canvas versioning | - | Feature request |
| Multi-segment VPC comparison | - | Feature request |
| Drag-and-drop VPC fit mapping | - | Feature request |

## Implementation Status

| Area | Status | Notes |
|------|--------|-------|
| Infrastructure | 95% | Deployment, CI/CD complete |
| Database | 100% | Schema, migrations, RLS deployed |
| Authentication | Working | GitHub OAuth + PKCE |
| Frontend UI | 85% | Report viewer, evidence, VPC done |
| AI Backend | 80% | Report + evidence + VPC complete |
| Accessibility | 70% | WCAG 2.1 AA foundation |
| E2E Testing | 90% | Infrastructure fixed |

## Detailed Documentation

| Document | Purpose |
|----------|---------|
| [in-progress.md](in-progress.md) | Full details on active work |
| [done.md](done.md) | Complete delivery history |
| [backlog.md](backlog.md) | Full backlog with context |
| [roadmap.md](roadmap.md) | Strategic timeline |
| [cross-repo-blockers.md](cross-repo-blockers.md) | Ecosystem dependencies |

## Cross-Repo Status

```
startupai-crew (Modal) - Production deployed
    |
app.startupai.site (This repo) - P0 blockers cleared
    |
startupai.site (Marketing) - Unblocked, ready for Phase 4
```

See [cross-repo-blockers.md](cross-repo-blockers.md) for details.

---

**Workflow** (Validation-Driven):
1. Run `/validation-status` to see current evidence state
2. Apply decision tree:
   - HIGH-risk UNTESTED? → Build minimum test
   - INVALIDATED? → Address pivot
   - Evidence quality gap? → Build tracking
   - Otherwise → Highest evidence-weight feature
3. Update assumption reference when starting work
4. Update evidence-tracker.md when learning
5. Move to done.md when complete

See [roadmap.md](../validation/roadmap.md) for full decision tree.
