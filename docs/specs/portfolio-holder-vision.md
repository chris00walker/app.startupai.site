# Product Vision: Portfolio Holder Ecosystem

**Status**: Draft v1.0 | **Created**: 2026-01-31 | **Owner**: product-strategist
**Approved By**: Pending founder sign-off

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

| Entity | Typical Check Size | Validation Need |
|--------|-------------------|-----------------|
| Friends & Family | $5K-$50K | "Is my loved one's dream viable?" |
| Angel Investors | $25K-$250K | "Will I see a return?" |
| Credit Unions | $10K-$100K | "Can they repay?" |
| Small Business Associations (SBA) | $50K-$5M (guaranteed) | "Does this meet program criteria?" |
| Micro Lending (Kiva, Grameen) | $500-$50K | "Will this create impact?" |
| Fund Managers (VC/PE) | $500K-$50M+ | "Is this fundable at the next stage?" |
| Banks | $50K-$500K | "What's the default risk?" |
| Crowdfunding Backers | $50-$500 | "Will this product exist?" |
| Revenue-Based Finance (Clearco, Pipe) | $10K-$500K | "Are the unit economics real?" |
| Grants (Gov't, Foundation) | $10K-$500K | "Does this meet our mandate?" |
| Corporate Venture | $250K-$5M | "Strategic fit + return?" |
| Family Offices | $100K-$2M | "Diversification + thesis fit?" |

**Common denominator**: "Show me evidence this isn't going to zero."

---

### Cohort 2: Advisory Providers

*"Is my guidance being applied?"*

| Entity | Relationship |
|--------|--------------|
| Business Coaches | Ongoing development |
| Mentors | Informal guidance |
| Fractional Executives (CFO, CTO, CMO) | Part-time leadership |
| Advisory Board Members | Strategic input |
| Industry Experts | Domain knowledge |
| Management Consultants | Project-based |

**Common denominator**: "Is the founder making progress based on my advice?"

---

### Cohort 3: Program Operators

*"Is our program delivering outcomes?"*

| Entity | Context |
|--------|---------|
| Accelerators (YC, Techstars) | Cohort-based, equity |
| Incubators | Longer-term, often non-profit |
| University Programs | Student founders |
| Government Programs | Economic development |
| Corporate Innovation Labs | Strategic ventures |
| Startup Studios | Venture builders |

**Common denominator**: "How do we demonstrate program ROI?"

---

### Cohort 4: Professional Service Providers

*"Is this client worth the credit risk?"*

| Entity | Service |
|--------|---------|
| Startup Lawyers | Legal, IP, incorporation |
| Accountants/Bookkeepers | Financial management |
| Insurance Brokers | Risk coverage |
| Payroll Providers | HR infrastructure |
| Marketing Agencies | Growth services |

**Common denominator**: "Should I extend credit terms to this client?"

---

### Cohort 5: Ecosystem Enablers

*"How do we prove value to our community?"*

| Entity | Role |
|--------|------|
| Coworking Spaces | Physical infrastructure |
| Startup Communities | Network/events |
| Chambers of Commerce | Business advocacy |
| Industry Associations | Sector support |
| Economic Development Agencies | Regional growth |

**Common denominator**: "Are we creating measurable value for our members?"

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

## Validation Requirements

Before building, validate these assumptions:

### A9: Capital Provider Demand

**Hypothesis**: Lenders/investors would pay for founder validation visibility.

**Test**: 5-8 discovery interviews with:
- 2 angel investors
- 2 credit union loan officers
- 2 accelerator program managers
- 2 SBA-affiliated lenders

**Evidence required**:
- Willingness to pay signal
- Current workflow pain points
- Integration requirements

### A10: Distribution Channel Viability

**Hypothesis**: Capital providers would require founders to use the platform.

**Test**: Ask in discovery interviews:
- "Would you require portfolio companies to use this?"
- "What would make this a due diligence requirement?"

### A11: Cohort Priority

**Hypothesis**: One cohort has significantly more urgent pain than others.

**Test**: Rank cohorts by:
- Willingness to pay (1-5)
- Sales cycle length (shorter = better)
- Distribution potential (can they bring founders?)

---

## Implementation Roadmap

### Phase 0: Documentation (Current)
- [x] Document vision (this spec)
- [ ] Founder approval of strategic direction
- [ ] Add to product roadmap

### Phase 1: Validation (Before Building)
- [ ] Discovery interviews with 2-3 cohorts
- [ ] Test Card for A9 (Capital Provider Demand)
- [ ] Determine priority cohort

### Phase 2: Architecture Preparation
- [ ] ADR for Portfolio Holder refactor
- [ ] Schema design for `relationship_type`
- [ ] Migration strategy from `consultant` → `portfolio_holder`

### Phase 3: MVP for Priority Cohort
- [ ] Implement `relationship_type` field
- [ ] Configurable invite flows
- [ ] Cohort-specific dashboard view
- [ ] Pilot with 3-5 portfolio holders

### Phase 4: Expansion
- [ ] Additional cohort support based on demand
- [ ] B2B sales motion for institutional accounts
- [ ] API for programmatic access (accelerators, lenders)

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
| 2026-01-31 | 1.0 | Initial draft from product-strategist / founder discussion |
