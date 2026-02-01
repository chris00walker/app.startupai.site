# StartupAI Master Project Plan

**Status**: Active | **Owner**: project-manager | **Updated**: 2026-02-01

---

## Purpose

This is the **single source of truth** for how StartupAI gets to market. It connects all planning documents, assumptions, and work items into one critical path.

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

**Implication**: We run TWO sequential tracks, not parallel workstreams.

```
┌──────────────────────┬────────────────────────────┬─────────────────────────────────┐
│        Track         │          Purpose           │            Constraint           │
├──────────────────────┼────────────────────────────┼─────────────────────────────────┤
│ TRACK 1: Engineering │ Build the validation tool  │ Must complete BEFORE dogfooding │
├──────────────────────┼────────────────────────────┼─────────────────────────────────┤
│ TRACK 2: Dogfooding  │ Use the tool on ourselves  │ Requires engineering to be done │
└──────────────────────┴────────────────────────────┴─────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CRITICAL PATH (SEQUENTIAL TRACKS)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Build Phase 0 ──► Dogfood Phase 0 ──► ✅ Done                          │
│         │                                                                │
│         ▼                                                                │
│  Build Phase 1 ──► Dogfood Phase 1 ──► ✅ Done                          │
│         │                                                                │
│         ▼                                                                │
│  Build Phase 2 ──► Dogfood Phase 2 ──► 🔄 ACTIVE ◄── YOU ARE HERE       │
│         │                                                                │
│         ▼                                                                │
│  Build Phase 3 ──► Dogfood Phase 3 ──► ⏳ Pending                        │
│         │                                                                │
│         ▼                                                                │
│  Build Phase 4 ──► Dogfood Phase 4 ──► ⏳ Pending                        │
│         │                                                                │
│         ▼                                                                │
│      PROVEN ──► LAUNCH                                                   │
│                                                                          │
│  TOTAL: 11-17 weeks from today                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Document Map

| Document | Purpose | Link |
|----------|---------|------|
| **This file** | Critical path, assumptions, test cards, evidence | You're reading it |
| `WORK.md` | Current sprint, WIP, backlog | [WORK.md](WORK.md) |
| `project-governance.md` | Team structure, RACI | [project-governance.md](project-governance.md) |
| `09-status.md` | Ecosystem technical status | [startupai-crew/docs/master-architecture/09-status.md](../../startupai-crew/docs/master-architecture/09-status.md) |
| `portfolio-holder-vision.md` | Future expansion (A9-A11) | [portfolio-holder-vision.md](../specs/portfolio-holder-vision.md) |

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
| A9 | Portfolio Holders will pay | Future | ⏳ Gated | [portfolio-holder-vision.md](../specs/portfolio-holder-vision.md) |
| A10 | Portfolio Holders will mandate usage | Future | ⏳ Gated | [portfolio-holder-vision.md](../specs/portfolio-holder-vision.md) |
| A11 | One cohort has most urgent pain | Future | ⏳ Gated | [portfolio-holder-vision.md](../specs/portfolio-holder-vision.md) |

**Legend**: 🔄 Testing | ⏳ Queued | ✅ Validated | ❌ Invalidated

### Test Cards

Each assumption has a structured test card defining what we believe, how we test it, and what success/failure looks like.

#### A1: Founders Trust AI Strategic Analysis

| Field | Value |
|-------|-------|
| **We believe** | Founders will trust AI-generated strategic analysis |
| **To verify, we will** | Measure approval rates at HITL checkpoints |
| **And measure** | % of briefs approved without major edits |
| **We are right if** | >70% approval rate, <50% significant edit rate |
| **We are wrong if** | <40% approval rate OR >80% edit rate |

#### A2: 30-Second Quick Start Reduces Friction

| Field | Value |
|-------|-------|
| **We believe** | 30-sec Quick Start has higher completion than 20-min chat |
| **To verify, we will** | Compare completion rates (historical vs new) |
| **And measure** | % of users who start -> complete onboarding |
| **We are right if** | Quick Start completion >80% (vs ~40% chat) |
| **We are wrong if** | Quick Start completion <50% |

#### A3: AI Briefs Are Accurate Enough

| Field | Value |
|-------|-------|
| **We believe** | AI briefs are accurate and actionable |
| **To verify, we will** | Track edit rate and error reports |
| **And measure** | % of brief fields edited, % flagged as incorrect |
| **We are right if** | <30% fields edited, <10% flagged errors |
| **We are wrong if** | >50% fields edited OR >30% flagged errors |

#### A4: $49/month Is Viable Price Point

| Field | Value |
|-------|-------|
| **We believe** | $49/month is the right price for founders |
| **To verify, we will** | Run WTP (willingness to pay) surveys and track conversions |
| **And measure** | Conversion rate from free -> paid, survey responses |
| **We are right if** | >5% conversion, WTP median around $49 |
| **We are wrong if** | <1% conversion OR WTP median <$20 |

#### A5: VPD Methodology Resonates

| Field | Value |
|-------|-------|
| **We believe** | VPD methodology resonates with technical founders |
| **To verify, we will** | Test landing page messaging and track engagement |
| **And measure** | Click-through on VPD-focused messaging, time on VPC |
| **We are right if** | VPD messaging CTR >3%, VPC engagement >5 min |
| **We are wrong if** | VPD messaging CTR <1% OR users skip VPC |

#### A6: Consultants Pay 3x for Portfolio Management

| Field | Value |
|-------|-------|
| **We believe** | Consultants will pay 3x for portfolio features |
| **To verify, we will** | Launch consultant tier and track conversion |
| **And measure** | Consultant sign-ups, conversion rate, retention |
| **We are right if** | >10 consultant sign-ups in Month 1, >50% activate |
| **We are wrong if** | <3 consultant sign-ups OR >70% churn in Month 1 |

#### A7: "AI Founders" Metaphor Appeals

| Field | Value |
|-------|-------|
| **We believe** | "AI Founders" metaphor is more compelling |
| **To verify, we will** | A/B test landing page messaging |
| **And measure** | CTR, sign-up rate, qualitative feedback |
| **We are right if** | "AI Founders" variant has >20% higher conversion |
| **We are wrong if** | No significant difference OR negative sentiment |

#### A8: Indie Hackers Is Acquisition Channel

| Field | Value |
|-------|-------|
| **We believe** | Indie Hackers is a viable acquisition channel |
| **To verify, we will** | Post on IH and track sign-ups with attribution |
| **And measure** | Sign-ups, CAC, activation rate, quality score |
| **We are right if** | >50 sign-ups from IH, >30% complete Phase 1 |
| **We are wrong if** | <10 sign-ups OR <10% activation |

### Evidence Log

Current evidence state for all assumptions. Updated as we learn.

| Assumption | Status | Evidence | Confidence | Last Updated |
|------------|--------|----------|------------|--------------|
| A1: Trust AI | TESTING | 2/2 HITL approvals | LOW (n=2) | 2026-01-15 |
| A2: Quick Start friction | UNTESTED | - | - | - |
| A3: AI accuracy | TESTING | 1 minor edit in 2 briefs | LOW (n=2) | 2026-01-15 |
| A4: $49 pricing | UNTESTED | - | - | - |
| A5: VPD resonates | UNTESTED | - | - | - |
| A6: Consultant 3x | UNTESTED | - | - | - |
| A7: AI Founders metaphor | UNTESTED | - | - | - |
| A8: Indie Hackers channel | UNTESTED | - | - | - |

**Confidence Levels**: NONE (0) | LOW (1-5) | MEDIUM (6-20) | HIGH (20+)

**A1 Evidence Details**:
- 2026-01-15: Dogfood approve_brief (Founder) - APPROVED, brief approved without changes
- 2026-01-15: Dogfood approve_discovery_output (Founder) - APPROVED, VPC fit 73/100

**A3 Evidence Details**:
- 2026-01-15: Dogfood Brief generation - 1 minor edit (problem statement tweaked)
- 2026-01-15: Dogfood VPC alignment - Aligned with brief assumptions

**Evidence Collection Gaps**:
| Gap | Feature Needed | Assumption |
|-----|----------------|------------|
| No HITL approval tracking | PostHog events for approve_* | A1 |
| No completion funnel | Quick Start funnel events | A2 |
| No edit tracking | Field-level change tracking | A3 |
| No payment flow | Stripe integration | A4 |
| No A/B testing | Landing page variants | A5, A7 |
| No attribution | UTM + cohort tracking | A8 |

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

## TRACK 2: Dogfooding (Prove)

**Purpose**: Use StartupAI to validate StartupAI.

**Constraint**: Requires Track 1 engineering to be complete for that phase.

### Phase 0-1 Dogfooding ✅ COMPLETE

| Validation | Result | Evidence |
|------------|--------|----------|
| Platform boots and runs | ✅ Validated | Production on Netlify |
| Users can sign up | ✅ Validated | Auth flow works |
| Projects can be created | ✅ Validated | Quick Start deployed |
| Basic journey works | ✅ Validated | Founder flow complete |

### Phase 2 Dogfooding 🔄 ACTIVE (YOU ARE HERE)

**Requires**: Phase 2 Engineering (PostHog instrumentation, templates)

| Assumption | Test | Status | Gate Criteria |
|------------|------|--------|---------------|
| **A1**: Founders trust AI | HITL approval rate | 🔄 Testing | >60% approval without edits |
| **A2**: Quick Start converts | Completion funnel | 🔄 Testing | >40% reach VPC canvas |
| **A3**: AI extracts context | Brief accuracy | 🔄 Testing | <20% major corrections |
| **A4**: WTP for validation | Pricing survey | 🔄 Testing | >30% at $X price point |
| A5: VPD resonates | Landing page A/B | ⏳ Queued | >20% email capture |
| A6: Consultant value | Marketing test | ⏳ Queued | >5% trial signup |
| A7: Messaging attracts | A/B test | ⏳ Queued | Winning variant |
| A8: IH is right channel | Community launch | ⏳ Queued | >100 signups |

**Gate Decision**: Leadership Team reviews A1-A4 evidence → Continue to Phase 3 or pivot

### Phase 3 Dogfooding ⏳ PENDING

**Requires**: Phase 3 Engineering (E2E journey, Modal SLOs)

| Assumption | Test | Status | Gate Criteria |
|------------|------|--------|---------------|
| Technical feasibility | Complete journey dogfood | ⏳ Pending | Works end-to-end |
| Performance | Founder journey timing | ⏳ Pending | <10min completion |
| Reliability | Modal uptime | ⏳ Pending | >99% availability |

**Gate Decision**: Continue to Phase 4 or simplify

### Phase 4 Dogfooding ⏳ PENDING

**Requires**: Phase 4 Engineering (Stripe, pricing tiers)

| Assumption | Test | Status | Gate Criteria |
|------------|------|--------|---------------|
| Market exists | First customer acquisition | ⏳ Pending | ≥1 paying customer |
| A4 confirmed | Real payment | ⏳ Pending | Actual transaction |

**Gate Decision**: LAUNCH or re-evaluate pricing

### Post-Launch: Portfolio Holder ⏳ GATED

**Requires**: A6 validated (Consultant value proven)

| Assumption | Test | Status | Gate Criteria |
|------------|------|--------|---------------|
| A11: Cohort priority | Interviews | ⏳ Gated | One cohort identified |
| A9: WTP validation | Cohort survey | ⏳ Gated | >30% at $X |
| A10: Distribution | Pilot test | ⏳ Gated | ≥1 mandates usage |

**Spec**: [portfolio-holder-vision.md](../specs/portfolio-holder-vision.md)

---

## Track Dependencies Visualization

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TRACK DEPENDENCIES BY PHASE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PHASE    TRACK 1 (BUILD)              TRACK 2 (PROVE)                  │
│  ─────    ───────────────              ────────────────                  │
│                                                                          │
│   0-1     Platform foundation ──────► Basic journey works               │
│           ✅ COMPLETE                  ✅ COMPLETE                       │
│                │                            │                            │
│                ▼                            ▼                            │
│    2      PostHog + Templates ─────► A1-A8 Testing                      │
│           🔄 IN PROGRESS               🔄 ACTIVE                         │
│                │                            │                            │
│                ▼                            ▼                            │
│    3      E2E + SLOs ──────────────► Feasibility proof                  │
│           ⏳ PENDING                   ⏳ PENDING                         │
│                │                            │                            │
│                ▼                            ▼                            │
│    4      Stripe + Pricing ────────► First customer                     │
│           ⏳ PENDING                   ⏳ PENDING                         │
│                │                            │                            │
│                ▼                            ▼                            │
│                └──────────── PROVEN ────────┘                           │
│                               │                                          │
│                               ▼                                          │
│                            LAUNCH                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Non-Critical (Parallel Work)

These can run alongside without blocking either track:

| Work | Owner | Dependency |
|------|-------|------------|
| Portfolio Holder discovery (A9-A11) | product-strategist | A6 gates BUILD, not research |
| Documentation refresh | technical-writer | None |
| E2E test expansion | qa-engineer | None |
| Figma design system | ui-designer | None |

---

## Current Sprint → Track Connection

From [WORK.md](WORK.md):

| Sprint Item | Track | Impact |
|-------------|-------|--------|
| Apply pending migrations | Track 1 (Build) | Enables schema stability |
| PostHog Quick Start events | Track 1 (Build) | Enables A2 measurement |
| PostHog HITL approval events | Track 1 (Build) | Enables A1 measurement |
| WTP pricing survey | Track 2 (Prove) | Tests A4 directly |

**Sprint health**: 3 Build + 1 Prove = Phase 2 focus ✅

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

1. **Check your track**: Am I building capability (Track 1) or proving assumptions (Track 2)?
2. **Check dependencies**: Has the prerequisite track completed for this phase?
3. **Check the gate**: What evidence is needed before the next phase?
4. **At gates**: Leadership Team reviews evidence, makes go/no-go decisions

---

## References

- [WORK.md](WORK.md) - Sprint details
- [09-status.md](../../startupai-crew/docs/master-architecture/09-status.md) - Technical status
- [portfolio-holder-vision.md](../specs/portfolio-holder-vision.md) - Expansion vision
- [project-governance.md](project-governance.md) - Team structure, RACI

---

**Last Updated**: 2026-02-01 | **Next Review**: Weekly Friday
