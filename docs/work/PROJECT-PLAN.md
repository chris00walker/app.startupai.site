# StartupAI Master Project Plan

**Status**: Active | **Owner**: project-manager | **Updated**: 2026-02-01

---

## Purpose

This is the **single source of truth** for engineering and development of the StartupAI platform. It tracks what we build, not what we prove about the business.

| Concern | Tracked In |
|---------|------------|
| Engineering milestones | **This document** |
| Technical backlog | **This document** + WORK.md |
| Platform capabilities | **This document** |
| Business model validation | **StartupAI product** (CW Consulting → StartupAI client) |

---

## The Bootstrap Paradox

StartupAI is a validation platform that must validate itself. This creates a unique constraint:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     NORMAL STARTUP vs STARTUPAI                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  NORMAL STARTUP:                                                         │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐                          │
│  │ Validate │ ──► │  Build   │ ──► │  Scale   │                          │
│  │  first   │      │ what's   │      │          │                          │
│  │          │      │ proven   │      │          │                          │
│  └─────────┘      └─────────┘      └─────────┘                          │
│                                                                          │
│  STARTUPAI (Bootstrap Paradox):                                          │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐                          │
│  │  Build   │ ──► │   Use    │ ──► │  Prove   │                          │
│  │   the    │      │   it to  │      │  itself  │                          │
│  │  tool    │      │ validate │      │          │                          │
│  └─────────┘      └─────────┘      └─────────┘                          │
│       │                │                 │                               │
│       ▼                ▼                 ▼                               │
│  "Platform must   "Dogfood our      "Platform is                        │
│   exist first"     own platform"     validated"                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Implication**: We run TWO sequential tracks for development, plus business validation happens in the product itself.

```
┌──────────────────────┬────────────────────────────┬─────────────────────────────────┐
│        Track         │          Purpose           │            Constraint           │
├──────────────────────┼────────────────────────────┼─────────────────────────────────┤
│ TRACK 1: Engineering │ Build platform capability  │ Must complete BEFORE verify     │
├──────────────────────┼────────────────────────────┼─────────────────────────────────┤
│ TRACK 2: Verify      │ Confirm software works     │ Requires engineering to be done │
├──────────────────────┼────────────────────────────┼─────────────────────────────────┤
│ Business Validation  │ Prove the business model   │ Runs IN the StartupAI product   │
└──────────────────────┴────────────────────────────┴─────────────────────────────────┘
```

**Where business validation lives:**
- CW Consulting = First Consultant account
- StartupAI = First Client project
- Hypotheses, evidence, phases = Managed in StartupAI UI
- See: [docs/archive/business/validation-reference.md](../archive/business/validation-reference.md) for reference data to enter

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CRITICAL PATH (SEQUENTIAL TRACKS)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Build Phase 0 ──► Verify Phase 0 ──► 🔄 ACTIVE ◄── YOU ARE HERE        │
│         │                                                                │
│         ▼                                                                │
│  Build Phase 1 ──► Verify Phase 1 ──► ⏳ Pending                         │
│         │                                                                │
│         ▼                                                                │
│  Build Phase 2 ──► Verify Phase 2 ──► ⏳ Pending                         │
│         │                                                                │
│         ▼                                                                │
│  Build Phase 3 ──► Verify Phase 3 ──► ⏳ Pending                         │
│         │                                                                │
│         ▼                                                                │
│  Build Phase 4 ──► Verify Phase 4 ──► ⏳ Pending                         │
│         │                                                                │
│         ▼                                                                │
│      WORKING ──► LAUNCH                                                  │
│                                                                          │
│  (Business validation runs in parallel IN the StartupAI product)        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Document Map

| Document | Purpose | Link |
|----------|---------|------|
| **This file** | Engineering milestones, platform capabilities | You're reading it |
| `WORK.md` | Current sprint, WIP, backlog | [WORK.md](WORK.md) |
| `project-governance.md` | Team structure, RACI | [project-governance.md](project-governance.md) |
| `09-status.md` | Ecosystem technical status | [startupai-crew/docs/master-architecture/09-status.md](../../startupai-crew/docs/master-architecture/09-status.md) |
| `validation-reference.md` | Archived business validation data | [validation-reference.md](../archive/business/validation-reference.md) |
| **StartupAI Product** | Business model validation | [app.startupai.site](https://app.startupai.site) |

---

## Two-Track Execution

### The Question We're Answering

> "What is the shortest path from today to first paying customer?"

Because of the bootstrap paradox, the answer is: **Build each phase's capability, then dogfood it, then proceed.**

---

## TRACK 1: Platform Engineering (Build)

**Purpose**: Create the capability to validate each VPD phase.

**Constraint**: Must complete BEFORE dogfooding can begin for that phase.

### Phase 0-1 Engineering ✅ COMPLETE

| Capability | Status | What It Enables |
|------------|--------|-----------------|
| Quick Start form (ADR-006) | ✅ Done | 30-second project creation |
| Two-Pass Architecture (ADR-004) | ✅ Done | Deterministic backend assessment |
| Project Archive/Delete | ✅ Done | Founder project management |
| Client Archive | ✅ Done | Consultant portfolio management |
| Admin Dashboard (Epic 11) | ✅ Done | Platform monitoring |
| Core Founder Journey (US-F01-F17) | ✅ Done | End-to-end founder flow |

### Phase 2 Engineering 🔄 IN PROGRESS

**Current Sprint** (from WORK.md):

| Item | Owner | Status | Enables |
|------|-------|--------|---------|
| Apply pending migrations | data-engineer | 🔄 Ready | Schema stability for Phase 2 |
| PostHog Quick Start events | frontend-dev | 🔄 Ready | A2 measurement capability |
| PostHog HITL approval events | frontend-dev | 🔄 Ready | A1 measurement capability |

**Backlog** (required before Phase 2 dogfooding):

| Item | Owner | Priority | Enables |
|------|-------|----------|---------|
| **Epic 5: Template Library** | ui-designer, frontend-dev | P1 | Landing page generation |
| **Epic 6: Agent Tools Integration** | ai-engineer | P1 | Ad creative generation |
| HITL Approval UI data source | backend-dev | P1 | Trust signal improvement |
| Consultant Trial mock client | frontend-dev | P1 | A6 testing capability |
| Schema: Trial split migration | data-engineer | P1 | US-FT03, US-FT04 |

### Phase 3 Engineering ⏳ PENDING

**Cannot start until Phase 2 dogfooding validates A5-A8**

| Item | Owner | Priority | Enables |
|------|-------|----------|---------|
| E2E journey completion | qa-engineer | P2 | Journey verification |
| Modal reliability SLOs | platform-eng | P2 | Production stability |
| Performance benchmarks | system-architect | P2 | Response time targets |
| E2E tests: Billing (US-B01-B10) | qa-engineer | P2 | Payment flow testing |

### Phase 4 Engineering ⏳ PENDING

**Cannot start until Phase 3 dogfooding confirms feasibility**

| Item | Owner | Priority | Enables |
|------|-------|----------|---------|
| Pricing tiers implemented | frontend-dev, backend-dev | P1 | Monetization |
| Stripe webhooks complete | backend-dev | P1 | Payment processing |
| US-FT03: Stripe upgrade webhook | backend-dev | Blocked | Revenue capture |
| US-FT04: Post-upgrade orientation | frontend-dev | Blocked | User activation |
| Upgrade/downgrade flows | frontend-dev | P1 | Plan changes |

### Blocked (External Dependencies)

| Item | Blocker | Phase Impact |
|------|---------|--------------|
| Stripe integration | No Stripe account | Blocks Phase 4 engineering |
| Ad Platform OAuth | No business accounts | Blocks Phase 2 ad experiments |

---

## TRACK 2: Technical Verification

**Purpose**: Confirm the software works as designed.

**Constraint**: Requires Track 1 engineering to be complete for that phase.

### Phase 0 Verification 🔄 ACTIVE (YOU ARE HERE)

**Requires**: Platform foundation complete

| Verification | Test | Status | Pass Criteria |
|--------------|------|--------|---------------|
| Platform boots | Deploy to Netlify | 🔄 Testing | No errors on load |
| Auth works | Sign up as Founder | 🔄 Testing | Account created |
| Quick Start works | Complete onboarding | 🔄 Testing | Reach first HITL |
| Consultant flow | Sign up as Consultant | ⏳ Pending | Can add client |
| Client linkage | Add StartupAI as client | ⏳ Pending | Relationship created |

**Gate**: Can CW Consulting onboard StartupAI as first client?

### Phase 1 Verification ⏳ PENDING

**Requires**: HITL checkpoints functional

| Verification | Test | Status | Pass Criteria |
|--------------|------|--------|---------------|
| HITL approval flow | Approve brief | ⏳ Pending | Status updates |
| VPC generation | View VPC canvas | ⏳ Pending | Canvas renders |
| Evidence capture | Log evidence | ⏳ Pending | Data persisted |

**Gate**: Does the core founder journey complete end-to-end?

### Phase 2 Verification ⏳ PENDING

**Requires**: Analytics instrumentation

| Verification | Test | Status | Pass Criteria |
|--------------|------|--------|---------------|
| PostHog events fire | Trigger Quick Start | ⏳ Pending | Events in PostHog |
| HITL events fire | Approve checkpoint | ⏳ Pending | Events in PostHog |
| Consultant dashboard | View portfolio | ⏳ Pending | Clients listed |

**Gate**: Can we measure user behavior?

### Phase 3 Verification ⏳ PENDING

**Requires**: E2E journey, Modal reliability

| Verification | Test | Status | Pass Criteria |
|--------------|------|--------|---------------|
| Full journey timing | Start to finish | ⏳ Pending | <10 minutes |
| Modal reliability | Run 10 validations | ⏳ Pending | >90% success |
| Error recovery | Trigger failures | ⏳ Pending | Graceful handling |

**Gate**: Is the platform production-ready?

### Phase 4 Verification ⏳ PENDING

**Requires**: Stripe integration

| Verification | Test | Status | Pass Criteria |
|--------------|------|--------|---------------|
| Payment flow | Test checkout | ⏳ Pending | Payment succeeds |
| Upgrade flow | Free → Paid | ⏳ Pending | Plan changes |
| Webhook handling | Simulate events | ⏳ Pending | Status updates |

**Gate**: Can we accept payments?

---

## Track Dependencies Visualization

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TRACK DEPENDENCIES BY PHASE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PHASE    TRACK 1 (BUILD)              TRACK 2 (VERIFY)                 │
│  ─────    ───────────────              ─────────────────                 │
│                                                                          │
│    0      Platform foundation ──────► Auth + Quick Start work           │
│           ✅ COMPLETE                  🔄 ACTIVE                         │
│                │                            │                            │
│                ▼                            ▼                            │
│    1      HITL checkpoints ────────► Core journey completes             │
│           ✅ COMPLETE                  ⏳ PENDING                         │
│                │                            │                            │
│                ▼                            ▼                            │
│    2      PostHog + Templates ─────► Events fire correctly              │
│           🔄 IN PROGRESS               ⏳ PENDING                         │
│                │                            │                            │
│                ▼                            ▼                            │
│    3      E2E + SLOs ──────────────► <10min journey, reliable           │
│           ⏳ PENDING                   ⏳ PENDING                         │
│                │                            │                            │
│                ▼                            ▼                            │
│    4      Stripe + Pricing ────────► Payment flow works                 │
│           ⏳ PENDING                   ⏳ PENDING                         │
│                │                            │                            │
│                ▼                            ▼                            │
│                └──────────── WORKING ───────┘                           │
│                               │                                          │
│                               ▼                                          │
│                            LAUNCH                                        │
│                                                                          │
│  Business validation runs IN the product (CW Consulting → StartupAI)   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Non-Critical (Parallel Work)

These can run alongside without blocking either track:

| Work | Owner | Dependency |
|------|-------|------------|
| Documentation refresh | technical-writer | None |
| E2E test expansion | qa-engineer | None |
| Figma design system | ui-designer | None |
| Performance optimization | platform-eng | None |

---

## Current Engineering Sprint

From [WORK.md](WORK.md):

| Sprint Item | Track | Impact |
|-------------|-------|--------|
| Apply pending migrations | Track 1 (Build) | Enables schema stability |
| PostHog Quick Start events | Track 1 (Build) | Enables behavior measurement |
| PostHog HITL approval events | Track 1 (Build) | Enables checkpoint tracking |

**Sprint health**: 3 Build items = Phase 2 engineering focus ✅

**Note**: Business validation work (WTP surveys, etc.) is tracked in the StartupAI product, not here.

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Stripe account delay | High | High | Escalate; can demo without payments |
| Modal reliability issues | High | Low | Fallback to mocked responses |
| Technical debt accumulation | Medium | Medium | Regular refactoring sprints |
| Integration failures | Medium | Low | E2E tests before deploy |
| Resource contention | Medium | Medium | Parallel tracks don't share owners |

**Note**: Business model risks are tracked in the StartupAI product as hypotheses.

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

1. **For engineering work**: Check Track 1 (Build) and Track 2 (Verify) in this document
2. **For sprint items**: See [WORK.md](WORK.md)
3. **For business validation**: Log into StartupAI as CW Consulting → StartupAI client
4. **At phase gates**: Verify software works before moving to next phase

---

## References

- [WORK.md](WORK.md) - Sprint details
- [09-status.md](../../startupai-crew/docs/master-architecture/09-status.md) - Technical status
- [project-governance.md](project-governance.md) - Team structure, RACI
- [validation-reference.md](../archive/business/validation-reference.md) - Archived business validation data
- [StartupAI Product](https://app.startupai.site) - Business model validation (CW Consulting → StartupAI)

---

**Last Updated**: 2026-02-01 | **Next Review**: Weekly Friday
