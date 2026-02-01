# Product Vision: Portfolio Holder Ecosystem

**Status**: Approved v2.0 | **Created**: 2026-01-31 | **Owner**: product-strategist
**Approved By**: Founder (2026-01-31) | **Leadership Review**: Complete

---

## Executive Summary

StartupAI's "Consultant" persona is too narrow. The platform serves anyone who maintains an ongoing relationship with Founders and needs visibility into their validation progress.

**Key insight**: Whether someone is a consultant, investor, lender, or accelerator operator, they all share a common job-to-be-done:

> "Show me evidence this founder/venture is worth my [money/time/resources]."

This document proposes a unified **Portfolio Holder** persona with configurable relationship types, enabling StartupAI to serve the entire founder relationship ecosystem without platform dilution.

---

## Current State

### Existing Personas

| Persona | Description | Status |
|---------|-------------|--------|
| **Founder** | Person validating a business idea | Implemented |
| **Consultant** | Advisor managing multiple founder clients | Implemented |
| **Admin** | Platform administrator | Implemented |

### Limitation

"Consultant" assumes an advisory relationship. This excludes:
- Investors who want to monitor portfolio companies
- Lenders who want to de-risk loans
- Accelerators who want to track cohort progress
- Service providers who want to assess client viability

---

## Vision

### The Founder Relationship Ecosystem

Founders don't operate in isolation. They maintain relationships with multiple stakeholders who have legitimate needs for validation visibility:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FOUNDER                                    │
│                     (Validating a business idea)                        │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
    ┌───────────┬───────────┬───┴───┬───────────┬───────────┐
    │           │           │       │           │           │
    ▼           ▼           ▼       ▼           ▼           │
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│Capital │ │Advisory│ │Program │ │Service │ │Ecosystem│     │
│Provider│ │Provider│ │Operator│ │Provider│ │Enabler │      │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘      │
    │           │           │       │           │           │
    └───────────┴───────────┴───┬───┴───────────┴───────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │        PORTFOLIO HOLDER          │
              │    "Show me the evidence"        │
              │                                  │
              │  Relationship Type:              │
              │  • Capital (money)               │
              │  • Advisory (guidance)           │
              │  • Program (cohort)              │
              │  • Service (professional)        │
              │  • Ecosystem (community)         │
              └─────────────────────────────────┘
```

### Unified Persona: Portfolio Holder

**Definition**: Any entity that maintains relationships with multiple Founders and needs visibility into their validation progress.

**Core job-to-be-done**: Track, support, and evaluate Founders using evidence-based validation data.

---

## The Five Cohorts

### Cohort 1: Capital Providers

*"Will I get my money back (+ return)?"*

```
┌───────────────────────────────────────┬───────────────────────┬───────────────────────────────────────┐
│                Entity                 │  Typical Check Size   │            Validation Need            │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Friends & Family                      │ $5K-$50K              │ "Is my loved one's dream viable?"     │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Angel Investors                       │ $25K-$250K            │ "Will I see a return?"                │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Credit Unions                         │ $10K-$100K            │ "Can they repay?"                     │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Small Business Associations (SBA)     │ $50K-$5M (guaranteed) │ "Does this meet program criteria?"    │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Micro Lending (Kiva, Grameen)         │ $500-$50K             │ "Will this create impact?"            │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Fund Managers (VC/PE)                 │ $500K-$50M+           │ "Is this fundable at the next stage?" │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Banks                                 │ $50K-$500K            │ "What's the default risk?"            │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Crowdfunding Backers                  │ $50-$500              │ "Will this product exist?"            │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Revenue-Based Finance (Clearco, Pipe) │ $10K-$500K            │ "Are the unit economics real?"        │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Grants (Gov't, Foundation)            │ $10K-$500K            │ "Does this meet our mandate?"         │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Corporate Venture                     │ $250K-$5M             │ "Strategic fit + return?"             │
├───────────────────────────────────────┼───────────────────────┼───────────────────────────────────────┤
│ Family Offices                        │ $100K-$2M             │ "Diversification + thesis fit?"       │
└───────────────────────────────────────┴───────────────────────┴───────────────────────────────────────┘
```

**Common denominator**: "Show me evidence this isn't going to zero."

---

### Cohort 2: Advisory Providers

*"Is my guidance being applied?"*

```
┌───────────────────────────────────────┬──────────────────────┐
│                Entity                 │     Relationship     │
├───────────────────────────────────────┼──────────────────────┤
│ Business Coaches                      │ Ongoing development  │
├───────────────────────────────────────┼──────────────────────┤
│ Mentors                               │ Informal guidance    │
├───────────────────────────────────────┼──────────────────────┤
│ Fractional Executives (CFO, CTO, CMO) │ Part-time leadership │
├───────────────────────────────────────┼──────────────────────┤
│ Advisory Board Members                │ Strategic input      │
├───────────────────────────────────────┼──────────────────────┤
│ Industry Experts                      │ Domain knowledge     │
├───────────────────────────────────────┼──────────────────────┤
│ Management Consultants                │ Project-based        │
└───────────────────────────────────────┴──────────────────────┘
```

**Common denominator**: "Is the founder making progress based on my advice?"

---

### Cohort 3: Program Operators

*"Is our program delivering outcomes?"*

```
┌──────────────────────────────┬───────────────────────────────┐
│            Entity            │            Context            │
├──────────────────────────────┼───────────────────────────────┤
│ Accelerators (YC, Techstars) │ Cohort-based, equity          │
├──────────────────────────────┼───────────────────────────────┤
│ Incubators                   │ Longer-term, often non-profit │
├──────────────────────────────┼───────────────────────────────┤
│ University Programs          │ Student founders              │
├──────────────────────────────┼───────────────────────────────┤
│ Government Programs          │ Economic development          │
├──────────────────────────────┼───────────────────────────────┤
│ Corporate Innovation Labs    │ Strategic ventures            │
├──────────────────────────────┼───────────────────────────────┤
│ Startup Studios              │ Venture builders              │
└──────────────────────────────┴───────────────────────────────┘
```

**Common denominator**: "How do we demonstrate program ROI?"

---

### Cohort 4: Professional Service Providers

*"Is this client worth the credit risk?"*

```
┌─────────────────────────┬──────────────────────────┐
│         Entity          │         Service          │
├─────────────────────────┼──────────────────────────┤
│ Startup Lawyers         │ Legal, IP, incorporation │
├─────────────────────────┼──────────────────────────┤
│ Accountants/Bookkeepers │ Financial management     │
├─────────────────────────┼──────────────────────────┤
│ Insurance Brokers       │ Risk coverage            │
├─────────────────────────┼──────────────────────────┤
│ Payroll Providers       │ HR infrastructure        │
├─────────────────────────┼──────────────────────────┤
│ Marketing Agencies      │ Growth services          │
└─────────────────────────┴──────────────────────────┘
```

**Common denominator**: "Should I extend credit terms to this client?"

---

### Cohort 5: Ecosystem Enablers

*"How do we prove value to our community?"*

```
┌───────────────────────────────┬─────────────────────────┐
│            Entity             │          Role           │
├───────────────────────────────┼─────────────────────────┤
│ Coworking Spaces              │ Physical infrastructure │
├───────────────────────────────┼─────────────────────────┤
│ Startup Communities           │ Network/events          │
├───────────────────────────────┼─────────────────────────┤
│ Chambers of Commerce          │ Business advocacy       │
├───────────────────────────────┼─────────────────────────┤
│ Industry Associations         │ Sector support          │
├───────────────────────────────┼─────────────────────────┤
│ Economic Development Agencies │ Regional growth         │
└───────────────────────────────┴─────────────────────────┘
```

**Common denominator**: "Are we creating measurable value for our members?"

---

### Summary: Each Cohort's Core Question

```
┌───────────────────┬────────────────────────────────────────────┐
│      Cohort       │               Core Question                │
├───────────────────┼────────────────────────────────────────────┤
│ Capital Provider  │ "Will I get my money back (+ return)?"     │
├───────────────────┼────────────────────────────────────────────┤
│ Advisory Provider │ "Is my guidance creating progress?"        │
├───────────────────┼────────────────────────────────────────────┤
│ Program Operator  │ "Is our program delivering outcomes?"      │
├───────────────────┼────────────────────────────────────────────┤
│ Service Provider  │ "Is this client a credit/churn risk?"      │
├───────────────────┼────────────────────────────────────────────┤
│ Ecosystem Enabler │ "Are we creating value for our community?" │
└───────────────────┴────────────────────────────────────────────┘
```

All five collapse into one Portfolio Holder persona with different relationship types. The platform stays unified.

---

## Platform Architecture

### Core Principle: No Dilution

The platform remains unified. Relationship types are a **configuration**, not separate products.

### Current vs. Proposed Model

| Aspect | Current | Proposed |
|--------|---------|----------|
| Persona name | `consultant` | `portfolio_holder` |
| Relationship model | Implicit (advisory) | Explicit (`relationship_type` field) |
| Feature set | One-size-fits-all | Shared core + type-specific views |
| Messaging | "Manage your clients" | Configurable per relationship type |

### Shared Features (All Relationship Types)

- Portfolio dashboard (multi-founder view)
- Founder progress visibility
- Validation evidence access (VPC, Brief, Gates)
- HITL approval visibility
- Founder invite/onboarding
- Reporting and exports

### Configurable by Relationship Type

| Aspect | Capital | Advisory | Program | Service | Ecosystem |
|--------|---------|----------|---------|---------|-----------|
| **Invite language** | "Validate your venture" | "Join my practice" | "Join the cohort" | "Connect your account" | "Join our community" |
| **Dashboard focus** | Risk metrics, milestones | Coaching notes, progress | Cohort comparison | Client health | Member activity |
| **Reporting** | Investment thesis fit | Session summaries | Program outcomes | Churn prediction | Community metrics |
| **Founder permission** | May be required | Opt-in | Program enrollment | Opt-in | Opt-in |
| **Billing model** | Per-portfolio or AUM | Per-client | Per-cohort | Per-client | Per-member |

---

## Strategic Implications

### Market Positioning

**Current**: "AI-powered validation for startup founders"

**Expanded**: "The validation layer for the founder ecosystem"

Or more boldly:

> "StartupAI: The credit bureau for startup validation"

### Distribution Channels

Portfolio Holders become distribution channels:

| Channel | Mechanism |
|---------|-----------|
| Lenders | Require founders to validate before funding |
| Accelerators | Built into program curriculum |
| Investors | Due diligence requirement |
| Service Providers | Client health monitoring |

### Revenue Model Implications

| Segment | Model | Rationale |
|---------|-------|-----------|
| Individual Consultants | Per-client subscription | Current model |
| Institutional Capital | Per-portfolio or AUM-based | Higher value, longer contracts |
| Program Operators | Per-cohort licensing | Bulk pricing |
| Service Providers | Freemium → per-client | Lead qualification value |
| Ecosystem Enablers | Platform partnership | Community value |

---

## Leadership Team Review (2026-01-31)

### Reviewers

| Agent | Role | Verdict |
|-------|------|---------|
| **system-architect** | Technical Architecture | Feasible as overlay; 11-18 days if built |
| **domain-expert-vpd** | VPD Methodology | Aligned; Test Cards need strengthening |
| **project-manager** | Execution Planning | Approve; queue A9-A11 behind A6 |

### Key Decisions

| Decision | Resolution | Rationale |
|----------|------------|-----------|
| **Implementation approach** | Overlay (not rename) | Add `relationship_type` without renaming `consultant`; lower risk, faster |
| **Cohort priority** | A11 determines | Test which cohort has most urgent pain first |
| **Validation sequencing** | A11 → A9 → A10 | One assumption at a time per VPD principles |
| **Evidence bar for build** | ≥5 LOIs + ≥1 paying pilot | Behavioral evidence required, not just interviews |
| **Timing** | Can start when founder has bandwidth | Discovery doesn't require engineering resources |

### Architecture Decision

**Approved approach: Overlay, not refactor**

```
Phase 2a: Add relationship_type to existing schema
          └── consultant_clients gains relationship_type column
          └── Default: 'advisory' for existing relationships

Phase 2b: UI supports relationship types
          └── Configurable invite flows
          └── Cohort-specific dashboard views

Phase 2c: Rename (deferred, optional)
          └── consultant → portfolio_holder
          └── Only if model proves out with evidence
```

**Rationale**: Lower migration risk, faster to implement, backwards compatible.

---

## Validation Requirements

Before building, validate these assumptions. **Sequenced per VPD principles.**

### Sequence

```
┌─────────────────────────────────────────────────────────────┐
│  A11 (Which cohort?) ──► A9 (Will they pay?) ──► A10 (Will │
│       2 weeks                  3 weeks            they      │
│                                                   mandate?) │
│                                                   2 weeks   │
└─────────────────────────────────────────────────────────────┘
```

### A11: Cohort Priority (First)

**Hypothesis**: One cohort has significantly more urgent pain than others.

**Test**: Comparative interviews across 3 cohorts (Capital, Advisory, Program)
- 2-3 interviews per cohort
- Rank by: pain severity, willingness to pay, sales cycle, distribution potential

**Criteria**:
- Clear winner emerges with ≥2x pain signal vs. others
- Time bound: 2 weeks

**Pivot trigger**: If no clear winner, default to Capital (highest strategic value).

---

### A9: Capital Provider Demand (Second - focused on winning cohort)

**Hypothesis**: [Winning cohort] will pay for founder validation visibility.

**Test Card**:
```
┌─────────────────────────────────────────────────────────────┐
│ ASSUMPTION: A9 - Portfolio Holder Willingness to Pay        │
├─────────────────────────────────────────────────────────────┤
│ We believe: [Winning cohort] will pay ≥$200/mo per         │
│             portfolio for validation visibility             │
│                                                             │
│ To verify: 8 discovery interviews + landing page test       │
│                                                             │
│ Measuring:                                                  │
│   • SAY: WTP expressed as specific price point              │
│   • DO-indirect: Landing page email signups (≥50)           │
│   • DO-indirect: LOI signatures (≥5)                        │
│                                                             │
│ We are right if:                                            │
│   • ≥5 of 8 indicate WTP of ≥$200/mo                       │
│   • ≥50 landing page signups in 2 weeks                    │
│   • ≥5 signed LOIs                                          │
│                                                             │
│ Time bound: 3 weeks                                         │
└─────────────────────────────────────────────────────────────┘
```

**Pivot trigger**: If <4 of 8 express WTP, re-evaluate cohort selection or pause expansion.

---

### A10: Distribution Channel Viability (Third - only if A9 validates)

**Hypothesis**: Portfolio holders would require founders to use the platform.

**Test Card**:
```
┌─────────────────────────────────────────────────────────────┐
│ ASSUMPTION: A10 - Mandatory Adoption Potential              │
├─────────────────────────────────────────────────────────────┤
│ We believe: Portfolio holders will make validation a        │
│             prerequisite for funding/engagement             │
│                                                             │
│ To verify: Direct questions in A9 interviews + follow-up    │
│                                                             │
│ Measuring:                                                  │
│   • "Would you require portfolio companies to use this?"    │
│   • "What would make this a due diligence requirement?"     │
│   • Commitment to pilot with ≥3 founders                    │
│                                                             │
│ We are right if:                                            │
│   • ≥3 of 8 indicate they would mandate usage              │
│   • ≥1 commits to paid pilot with their founders           │
│                                                             │
│ Time bound: 2 weeks (concurrent with late A9)               │
└─────────────────────────────────────────────────────────────┘
```

**Pivot trigger**: If 0 indicate mandate potential, position as "optional visibility" not "credit bureau."

---

### Phase 3 Entry Gate

**Required evidence before ANY implementation:**

| Evidence Type | Requirement | Weight |
|---------------|-------------|--------|
| Discovery interviews | 8 completed | SAY (0.3) |
| Landing page signups | ≥50 emails | DO-indirect (0.8) |
| Letters of Intent | ≥5 signed | DO-indirect (0.8) |
| Paying pilot commitment | ≥1 customer | DO-direct (1.0) |

**Gate review**: Leadership Team convenes to evaluate evidence before Phase 3 begins.

---

## Implementation Roadmap

### Phase 0: Documentation (Complete)
- [x] Document vision (this spec)
- [x] Leadership Team review
- [x] Founder approval of strategic direction
- [ ] Add A9-A11 to backlog as P2

### Phase 1: Validation (7 weeks total)
- [ ] **A11**: Cohort priority interviews (2 weeks)
- [ ] **A9**: WTP validation for winning cohort (3 weeks)
  - [ ] 8 discovery interviews
  - [ ] Landing page test (≥50 signups)
  - [ ] LOI collection (≥5 signed)
- [ ] **A10**: Distribution channel validation (2 weeks)
  - [ ] Mandate potential assessment
  - [ ] Pilot commitment (≥1 paying customer)

### Phase 2: Architecture Preparation (Gate: A9-A10 evidence)
- [ ] ADR for Portfolio Holder overlay approach
- [ ] Schema design: add `relationship_type` to `consultant_clients`
- [ ] Backwards compatibility plan (existing consultants = advisory)

### Phase 3: MVP for Priority Cohort
- [ ] Add `relationship_type` column (default: 'advisory')
- [ ] Configurable invite flows per type
- [ ] Cohort-specific dashboard view
- [ ] Pilot with ≥3 portfolio holders from winning cohort

### Phase 4: Expansion (Based on Demand)
- [ ] Additional relationship types based on evidence
- [ ] B2B sales motion for institutional accounts
- [ ] API for programmatic access (accelerators, lenders)
- [ ] Optional: Rename `consultant` → `portfolio_holder` if model proves out

---

## Open Questions

1. **Naming**: Is "Portfolio Holder" the right term? Alternatives:
   - Relationship Manager
   - Stakeholder
   - Partner
   - Sponsor

2. **Permission Model**: Should founders be able to reject portfolio holder requests? Or can some relationship types (lender) require participation?

3. **Data Access Levels**: Should all relationship types see the same data? Or should Capital Providers see more financial detail while Advisory sees more coaching notes?

4. **Multi-Relationship**: Can a founder have multiple portfolio holders of different types? (Yes, almost certainly)

5. **Competitive Moat**: If we become the "validation credit bureau," what prevents incumbents (credit bureaus, investor platforms) from copying?

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-31 | **Founder approved** strategic direction | Leadership Team review complete; path forward endorsed |
| 2026-01-31 | **Overlay approach** for implementation | Add `relationship_type` without renaming; lower risk, faster |
| 2026-01-31 | **Sequence A11 → A9 → A10** | One assumption at a time per VPD principles |
| 2026-01-31 | **Evidence gate**: ≥5 LOIs + ≥1 paying pilot | Behavioral evidence required before build |
| 2026-01-31 | **Strengthened Test Cards** for A9, A10 | Added measurable thresholds, time bounds, pivot triggers |
| 2026-01-31 | Treat relationship types as features, not separate products | Avoid platform dilution; maintain unified codebase |
| 2026-01-31 | Identify 5 cohorts (Capital, Advisory, Program, Service, Ecosystem) | Comprehensive mapping of founder relationship ecosystem |
| 2026-01-31 | Require validation before building | VPD methodology - evidence before investment |

---

## References

- [Project Governance](../project-governance.md) - Decision #6 (User Story Ownership)
- [Consultant Journey Map](../user-experience/journeys/consultant/consultant-journey-map.md)
- [Consultant Persona](../user-experience/personas/consultant.md)
- [VPD Methodology](../../startupai-crew/docs/master-architecture/03-methodology.md)

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-01-31 | 2.0 | **Approved**: Leadership Team review; strengthened Test Cards; overlay approach; evidence gates |
| 2026-01-31 | 1.1 | Added ASCII table diagrams for improved readability |
| 2026-01-31 | 1.0 | Initial draft from product-strategist / founder discussion |
