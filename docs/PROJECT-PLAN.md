# StartupAI Master Project Plan

**Status**: Active | **Owner**: project-manager | **Updated**: 2026-01-31

---

## Purpose

This is the **single source of truth** for how StartupAI gets to market. It connects all planning documents, assumptions, and work items into one critical path.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STARTUPAI CRITICAL PATH TO MARKET                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► LAUNCH    │
│  (Done)      (Done)      (Active)    (Pending)   (Pending)              │
│                             │                                            │
│                             ▼                                            │
│                    ┌─────────────────┐                                  │
│                    │   YOU ARE HERE   │                                  │
│                    │   A1-A4 Testing  │                                  │
│                    └─────────────────┘                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Document Map

| Document | Purpose | Link |
|----------|---------|------|
| **This file** | Critical path, dependencies, milestones | You're reading it |
| `WORK.md` | Current sprint, WIP, backlog | [docs/work/WORK.md](work/WORK.md) |
| `roadmap.md` | Phase progress, dogfooding status | [docs/work/roadmap.md](work/roadmap.md) |
| `09-status.md` | Ecosystem technical status | [startupai-crew/docs/master-architecture/09-status.md](../../startupai-crew/docs/master-architecture/09-status.md) |
| `portfolio-holder-vision.md` | Future expansion (A9-A11) | [docs/specs/portfolio-holder-vision.md](specs/portfolio-holder-vision.md) |

---

## Assumptions Registry

All business assumptions in one place. **Critical path runs through bold items.**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ASSUMPTION DEPENDENCY MAP                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  FOUNDATION (Must validate first)                                         │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                                 │
│  │   A1    │   │   A2    │   │   A3    │                                 │
│  │ Trust   │   │ Quick   │   │ Context │                                 │
│  │         │   │ Start   │   │ Extract │                                 │
│  └────┬────┘   └────┬────┘   └────┬────┘                                 │
│       │             │             │                                       │
│       └──────────┬──┴─────────────┘                                       │
│                  ▼                                                        │
│  MONETIZATION                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                                 │
│  │   A4    │   │   A5    │   │   A7    │                                 │
│  │  WTP    │◄──│  VPD    │   │ Message │                                 │
│  │         │   │ Resonate│   │         │                                 │
│  └────┬────┘   └────┬────┘   └────┬────┘                                 │
│       │             │             │                                       │
│       └──────────┬──┴─────────────┘                                       │
│                  ▼                                                        │
│  CHANNEL + EXPANSION                                                      │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐                   │
│  │   A6    │   │   A8    │   │  A9-11  │◄──│   A6    │                   │
│  │Consult- │   │   IH    │   │Portfolio│   │  Gate   │                   │
│  │ant Value│   │ Channel │   │ Holder  │   │         │                   │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘                   │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Assumption Status

| ID | Assumption | Phase | Status | Spec |
|----|------------|-------|--------|------|
| **A1** | Founders trust AI recommendations | 0-1 | 🔄 Testing | WORK.md |
| **A2** | Quick Start converts to engagement | 0 | 🔄 Testing | WORK.md |
| **A3** | AI extracts accurate business context | 0-1 | 🔄 Testing | WORK.md |
| **A4** | Willingness to pay for validation | 2-4 | 🔄 Testing | WORK.md |
| A5 | VPD methodology resonates | 2 | ⏳ Queued | roadmap.md |
| A6 | Consultants see portfolio value | 2-3 | ⏳ Queued | roadmap.md |
| A7 | "AI Founders" messaging attracts | 2 | ⏳ Queued | roadmap.md |
| A8 | IH community is right channel | 2 | ⏳ Queued | roadmap.md |
| A9 | Portfolio Holders will pay | Future | ⏳ Gated | [portfolio-holder-vision.md](specs/portfolio-holder-vision.md) |
| A10 | Portfolio Holders will mandate usage | Future | ⏳ Gated | [portfolio-holder-vision.md](specs/portfolio-holder-vision.md) |
| A11 | One cohort has most urgent pain | Future | ⏳ Gated | [portfolio-holder-vision.md](specs/portfolio-holder-vision.md) |

**Legend**: 🔄 Testing | ⏳ Queued | ✅ Validated | ❌ Invalidated

---

## Critical Path

### The Question We're Answering

> "What is the shortest path from today to first paying customer?"

### Critical Path Analysis

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CRITICAL PATH                                  │
│                     (Longest chain = project duration)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TODAY ─────────────────────────────────────────────────────► REVENUE   │
│    │                                                              │      │
│    ▼                                                              │      │
│  ┌──────────────┐                                                 │      │
│  │ A1-A4 Testing │ ◄─── YOU ARE HERE                              │      │
│  │   (4 items)   │      Current Sprint                            │      │
│  └──────┬───────┘                                                 │      │
│         │ 2-3 weeks                                               │      │
│         ▼                                                         │      │
│  ┌──────────────┐                                                 │      │
│  │ GATE: A1-A4  │ Evidence review                                 │      │
│  │   Results    │ Leadership decision                             │      │
│  └──────┬───────┘                                                 │      │
│         │                                                         │      │
│         ▼                                                         │      │
│  ┌──────────────┐                                                 │      │
│  │ Phase 2      │ A5-A8 validation                                │      │
│  │ Desirability │ Landing pages, WTP survey, IH launch            │      │
│  └──────┬───────┘                                                 │      │
│         │ 4-6 weeks                                               │      │
│         ▼                                                         │      │
│  ┌──────────────┐                                                 │      │
│  │ GATE: >20%   │ Landing page conversion                         │      │
│  │ Conversion   │ Pivot messaging if fail                         │      │
│  └──────┬───────┘                                                 │      │
│         │                                                         │      │
│         ▼                                                         │      │
│  ┌──────────────┐                                                 │      │
│  │ Phase 3      │ E2E journey, Modal reliability                  │      │
│  │ Feasibility  │ Performance benchmarks                          │      │
│  └──────┬───────┘                                                 │      │
│         │ 3-4 weeks                                               │      │
│         ▼                                                         │      │
│  ┌──────────────┐                                                 │      │
│  │ GATE: <10min │ E2E completion time                             │      │
│  │ E2E Journey  │ Simplify if fail                                │      │
│  └──────┬───────┘                                                 │      │
│         │                                                         │      │
│         ▼                                                         │      │
│  ┌──────────────┐                                                 │      │
│  │ Phase 4      │ Pricing implementation                          │      │
│  │ Viability    │ First customer acquisition                      │      │
│  └──────┬───────┘                                                 │      │
│         │ 2-4 weeks                                               │      │
│         ▼                                                         │      │
│  ┌──────────────┐                                                 │      │
│  │ GATE: First  │◄────────────────────────────────────────────────┘      │
│  │ Paying Cust. │ REVENUE = Market Launch                                │
│  └──────────────┘                                                        │
│                                                                          │
│  TOTAL CRITICAL PATH: 11-17 weeks from today                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Non-Critical (Parallel Tracks)

These can run alongside the critical path without blocking:

| Track | Owner | Can Start | Blocked Until |
|-------|-------|-----------|---------------|
| Portfolio Holder discovery (A9-A11) | product-strategist | Anytime | A6 evidence for build |
| Documentation refresh | technical-writer | Anytime | Nothing |
| E2E test expansion | qa-engineer | Anytime | Nothing |
| Figma design system | ui-designer | Anytime | Nothing |

---

## Milestones

### M1: Foundation Validated (Target: +3 weeks)

**Exit criteria**: A1-A4 show positive signal

| Item | Owner | Status |
|------|-------|--------|
| PostHog Quick Start events | frontend-dev | 🔄 In Sprint |
| PostHog HITL approval events | frontend-dev | 🔄 In Sprint |
| WTP pricing survey | product-strategist | 🔄 In Sprint |
| Apply pending migrations | data-engineer | 🔄 In Sprint |

**Gate decision**: Continue to Phase 2 or pivot

---

### M2: Desirability Proven (Target: +9 weeks)

**Exit criteria**: >20% landing page conversion, WTP confirmed

| Item | Owner | Status |
|------|-------|--------|
| Epic 5: Template Library | ui-designer, frontend-dev | ⏳ Backlog P1 |
| Epic 6: Agent Tools Integration | ai-engineer | ⏳ Backlog P1 |
| Landing page A/B test | frontend-dev, content-strat | ⏳ Backlog P1 |
| IH community launch | content-strat | ⏳ Backlog P1 |

**Gate decision**: Continue to Phase 3 or pivot messaging

---

### M3: Feasibility Confirmed (Target: +13 weeks)

**Exit criteria**: E2E journey <10min, Modal SLOs met

| Item | Owner | Status |
|------|-------|--------|
| E2E journey completion | qa-engineer | ⏳ Backlog P2 |
| Modal reliability SLOs | platform-eng | ⏳ Backlog P2 |
| Performance benchmarks | system-architect | ⏳ Backlog P2 |

**Gate decision**: Continue to Phase 4 or simplify

---

### M4: First Revenue (Target: +17 weeks)

**Exit criteria**: ≥1 paying customer

| Item | Owner | Status |
|------|-------|--------|
| Stripe integration | backend-dev | ⏳ Blocked (no account) |
| Pricing tiers implemented | frontend-dev | ⏳ Backlog P1 |
| First customer acquisition | product-strategist | ⏳ Pending |

**Gate decision**: LAUNCH or re-evaluate pricing

---

### M5: Portfolio Holder Expansion (Target: +24 weeks)

**Exit criteria**: ≥1 paying Portfolio Holder pilot

**Gate**: Only begins after A6 (Consultant value) validates

| Item | Owner | Status |
|------|-------|--------|
| A11: Cohort priority | product-strategist | ⏳ Gated behind A6 |
| A9: WTP validation | product-strategist | ⏳ Gated behind A11 |
| A10: Distribution validation | product-strategist | ⏳ Gated behind A9 |
| Schema: relationship_type | data-engineer | ⏳ Gated behind A9-A10 |

**Spec**: [portfolio-holder-vision.md](specs/portfolio-holder-vision.md)

---

## Current Sprint → Critical Path Connection

From [WORK.md](work/WORK.md):

| Sprint Item | Assumption | Critical Path Impact |
|-------------|------------|---------------------|
| PostHog Quick Start events | A2 | **ON CRITICAL PATH** - measures engagement |
| PostHog HITL approval events | A1 | **ON CRITICAL PATH** - measures trust |
| WTP pricing survey | A4 | **ON CRITICAL PATH** - monetization signal |
| Apply pending migrations | - | Enabling (unblocks other work) |

**Sprint health**: 4/4 items on or enabling critical path ✅

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| A1-A4 invalidated | Critical | Medium | Pivot triggers defined in each assumption |
| Stripe account delay | High | High | Escalate; can demo without payments |
| Modal reliability issues | High | Low | Fallback to mocked responses |
| Scope creep (Portfolio Holder) | Medium | Medium | Gated behind A6 evidence |
| Resource contention | Medium | Medium | Parallel tracks don't share owners |

---

## Weekly Cadence

| Day | Activity | Owner |
|-----|----------|-------|
| Monday | Sprint planning (if needed) | project-manager |
| Wednesday | Async status check | All |
| Friday | WORK.md review, WIP check | project-manager |

**Gate reviews**: Leadership Team convenes at each milestone.

---

## How to Use This Plan

1. **Daily**: Check if your work is on critical path (prioritize if yes)
2. **Weekly**: project-manager updates milestone progress
3. **At gates**: Leadership Team reviews evidence, makes go/no-go decisions
4. **When adding work**: Check if it's on critical path or parallel track

---

## References

- [WORK.md](work/WORK.md) - Sprint details
- [roadmap.md](work/roadmap.md) - Phase progress
- [09-status.md](../../startupai-crew/docs/master-architecture/09-status.md) - Technical status
- [portfolio-holder-vision.md](specs/portfolio-holder-vision.md) - Expansion vision
- [project-governance.md](project-governance.md) - Team structure, RACI

---

**Last Updated**: 2026-01-31 | **Next Review**: Weekly Friday
