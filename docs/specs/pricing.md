---
purpose: "Canonical pricing and trial configuration - single source of truth"
status: "active"
last_reviewed: "2026-02-03"
decision_date: "2026-02-03"
decision_owner: "Founder + product-strategist"
---

# Pricing Specification

**Single Source of Truth for all pricing-related documentation.**

---

## Executive Summary

StartupAI operates a **two-sided marketplace**:
- **Supply side**: Founders validating business ideas ($49/month)
- **Demand side**: Portfolio Holders seeking pre-validated deal flow ($199-$1,499/month)

The marketplace is seeded with Founders first. Portfolio Holders (especially Capital providers) become the draw that attracts more Founders - creating a quality flywheel.

---

## Pricing Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STARTUPAI PRICING TIERS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FOUNDER SIDE (Supply)                                                       │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  FOUNDER TRIAL                                                FREE │    │
│  │  • 30 days, no credit card                                          │    │
│  │  • 1 project, Phase 0 only                                          │    │
│  │  • Ad integration available (founder pays ad costs)                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  FOUNDER PLAN                                            $49/month │    │
│  │  • Full validation platform (all 5 phases)                          │    │
│  │  • 5 concurrent projects                                            │    │
│  │  • All HITL checkpoints                                             │    │
│  │  • Ad integration + evidence collection                             │    │
│  │  • PDF/JSON exports                                                 │    │
│  │                                                                     │    │
│  │  Annual: $470/year (2 months free)                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PORTFOLIO HOLDER SIDE (Demand)                                              │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ADVISOR TIER                                           $199/month │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  • Portfolio dashboard (unlimited clients)                          │    │
│  │  • Validation visibility (all phases)                               │    │
│  │  • Client invite flows (all relationship types)                     │    │
│  │  • Progress tracking & alerts                                       │    │
│  │  • White-label PDF/JSON exports                                     │    │
│  │  • Verified status (directory listing opt-in)                       │    │
│  │                                                                     │    │
│  │  Annual: $1,990/year (2 months free)                                │    │
│  │  Target: Consultants, coaches, fractional executives, advisors     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  CAPITAL TIER                                           $499/month │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Everything in Advisor, plus:                                       │    │
│  │  • Founder Directory access (validated startups only)               │    │
│  │  • RFQ/RFP Board (respond to capital-seeking founders)              │    │
│  │  • Evidence packages (full VPD validation reports)                  │    │
│  │  • Founder contact requests (with consent)                          │    │
│  │  • Advanced filtering (stage, sector, geography, fit score)         │    │
│  │  • Investment thesis matching                                       │    │
│  │                                                                     │    │
│  │  Annual: $4,990/year (2 months free)                                │    │
│  │  Target: Angels, family offices, micro VCs, revenue-based lenders  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  INSTITUTIONAL TIER                                   $1,499/month │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Everything in Capital, plus:                                       │    │
│  │  • Multi-seat licensing (5 seats included)                          │    │
│  │  • API access (programmatic deal flow integration)                  │    │
│  │  • Bulk evidence exports                                            │    │
│  │  • Custom cohort views (accelerators)                               │    │
│  │  • SSO/SAML integration                                             │    │
│  │  • Dedicated success manager                                        │    │
│  │  • SLA guarantees                                                   │    │
│  │                                                                     │    │
│  │  Annual: $14,990/year (2 months free)                               │    │
│  │  Target: VCs, accelerators, corporate innovation, grant programs   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Founder Pricing

### Decision Summary

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Founder Plan Price** | $49/month | Strategyzer-level positioning; accessible to bootstrapped founders |
| **Trial Duration** | 30 days | Allows completion of full Phase 1 VPC Discovery |
| **Ad Budget** | Separate (pass-through) | Founder-approved, not included in SaaS fee |

### Free Trial

| Attribute | Value |
|-----------|-------|
| Duration | 30 days |
| Projects | 1 |
| Phases | Phase 0 only (Founder's Brief) |
| HITL Checkpoints | 1 (`approve_founders_brief`) |
| Ad Integration | Available (founder pays ad costs directly) |
| Credit Card Required | No |

### Founder Plan

| Attribute | Value |
|-----------|-------|
| Price | $49/month |
| Annual Option | $470/year (2 months free) |
| Projects | 5 concurrent |
| Phases | All (0-4) |
| HITL Checkpoints | All |
| Ad Integration | Full access |
| Export | PDF, JSON |
| History | Unlimited |

### Why $49/month

| Factor | Analysis |
|--------|----------|
| **Market positioning** | Strategyzer-level ($50/mo); professional, not commodity |
| **Persona fit** | Bootstrapped founders expect ~$50/mo tools |
| **Psychology** | Below $50 threshold; "cost of a nice lunch" |
| **Optionality** | Easy to raise later; hard to lower |
| **A4 Testing** | Validates willingness to pay at this price point |

### Why 30-Day Trial

| Factor | Analysis |
|--------|----------|
| **Phase 1 completion** | Real validation takes 2-4 weeks |
| **Evidence quality** | Customer interviews cannot be rushed |
| **Value realization** | Founders experience full VPC Discovery before paying |
| **WTP signal quality** | Informed decision > rushed decision |
| **Procrastination risk** | Mitigated with Day 7/14/21 email nudges |

---

## Portfolio Holder Pricing

### Strategic Context

StartupAI is not selling portfolio management software. StartupAI is selling **access to pre-validated deal flow** - a service that capital providers currently pay $5,000-$50,000/year to obtain from platforms like PitchBook, Crunchbase Enterprise, and deal sourcing services.

**Key differentiator**: No other platform provides "VPD-validated" startups with structured evidence of problem-solution fit, customer interviews, and behavioral data. This is not just deal flow - it is **de-risked deal flow**.

### Competitive Landscape

| Platform | Annual Cost | What They Get |
|----------|-------------|---------------|
| PitchBook | $12,000-70,000 | Company data, funding history, contacts |
| Crunchbase Enterprise | $2,000-5,000 | Company profiles, funding rounds, alerts |
| AngelList Syndicates | $8,000 + 20% carry | Access to curated deals |
| Angel Group Membership | $750-1,000 | Access to group deal flow + events |
| Deal Sourcing Services | $60,000-120,000 | Introductions + curated matches |

### What StartupAI Provides That Others Cannot

| Differentiator | Why It Matters |
|----------------|----------------|
| **VPD Validation Evidence** | Not available anywhere else |
| **Customer Interview Data** | Primary research, not secondary |
| **Behavioral Evidence (DO data)** | Real traction signals, not vanity metrics |
| **Hypothesis Testing History** | Shows founder rigor |
| **HITL Checkpoint Record** | Shows coachability |
| **Fit Score Algorithm** | Quantified problem-solution fit |

### Tier Comparison

| Feature | Advisor ($199) | Capital ($499) | Institutional ($1,499) |
|---------|---------------|----------------|------------------------|
| Portfolio Dashboard | ✓ | ✓ | ✓ |
| Unlimited Clients | ✓ | ✓ | ✓ |
| Validation Visibility | ✓ | ✓ | ✓ |
| White-label Exports | ✓ | ✓ | ✓ |
| Verified Status | ✓ | ✓ | ✓ |
| **Founder Directory** | ✗ | ✓ | ✓ |
| **RFQ/RFP Board** | ✗ | ✓ | ✓ |
| **Evidence Packages** | ✗ | ✓ | ✓ |
| **Contact Requests** | ✗ | ✓ | ✓ |
| API Access | ✗ | ✗ | ✓ |
| Multi-seat (5 included) | ✗ | ✗ | ✓ |
| SSO/SAML | ✗ | ✗ | ✓ |
| Dedicated Success Manager | ✗ | ✗ | ✓ |

### Pricing Rationale

| Tier | Annual Cost | Competitive Benchmark | Position |
|------|-------------|----------------------|----------|
| **Advisor** | $2,388 | Business SaaS ($600-1,200/yr) | 2-3x premium for AI assistance |
| **Capital** | $5,988 | Angel group + data ($1,750-3,000/yr) | Below alternatives, unique validation value |
| **Institutional** | $17,988 | PitchBook ($12K-25K/yr) | Positioned as complement, not replacement |

### Target Segments

| Tier | Primary Target | Secondary Target |
|------|----------------|------------------|
| **Advisor** | Consultants, coaches, fractional executives | Service providers (lawyers, accountants) |
| **Capital** | Angels, family offices, micro VCs | Revenue-based lenders, grant programs |
| **Institutional** | VCs, accelerators | Corporate innovation, government programs |

---

## Marketplace Dynamics

### Verification System

| Status | Meaning | Directory Access | RFQ Board |
|--------|---------|------------------|-----------|
| **Unverified** | Trial or lapsed | Cannot view | Cannot view |
| **Verified** (Advisor) | Paid Advisor tier | Visible in directory | Cannot respond |
| **Verified** (Capital+) | Paid Capital or Institutional | Visible in directory | Full access |

### The Quality Flywheel

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKETPLACE FLYWHEEL                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    Validated Founders ──────────────► Capital Providers         │
│         (Supply)                           (Demand)             │
│            │                                   │                │
│            │    "X verified investors          │                │
│            │     on StartupAI"                 │                │
│            │                                   │                │
│            ▼                                   ▼                │
│    More founders ◄──────────────────── More deal flow           │
│    seeking capital                     attracts VCs             │
│                                                                 │
│    THE BAIT FOR FOUNDERS = ACCESS TO CAPITAL                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Three Connection Flows

| Flow | Initiator | Description |
|------|-----------|-------------|
| **Invite-New** | Portfolio Holder | PH invites a founder who isn't on platform yet |
| **Link-Existing** | Portfolio Holder | PH requests connection to existing founder |
| **Founder RFQ** | Founder | Founder posts request seeking capital/advice |

All flows require **founder acceptance** - participation is recommended, never mandatory.

---

## Revenue Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    REVENUE STREAMS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Founder Subscriptions                                       │
│     └── $49/month (validation platform)                         │
│                                                                 │
│  2. Portfolio Holder Subscriptions                              │
│     └── $199/month (Advisor)                                    │
│     └── $499/month (Capital)                                    │
│     └── $1,499/month (Institutional)                            │
│                                                                 │
│  3. Ad Budget (Pass-through)                                    │
│     └── Founder-approved amount                                 │
│     └── StartupAI does NOT profit from ad spend                 │
│                                                                 │
│  4. Future: Transaction Fees (Phase 4+)                         │
│     └── Consider success fees on funded deals                   │
│     └── Only after marketplace has critical mass                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Ad Budget Model

The ad platform integration automates the DO evidence loop (real behavioral data).

| Aspect | Details |
|--------|---------|
| **Included in subscription?** | No - ad costs are separate |
| **Who pays?** | Founder approves budget, charges to their payment method |
| **Recommendation** | AI suggests budget based on validation goals |
| **HITL Checkpoint** | `approve_spend_increase` gates ad activation |
| **Minimum Budget** | $50 recommended for statistically meaningful results |
| **During Trial** | Optional - platform is free, ads cost money if founder wants real DO evidence |

---

## Implementation Phasing

| Phase | Scope | Pricing | Timeline |
|-------|-------|---------|----------|
| **Launch** | Founder tier only | $49/month | Now |
| **Post-A4** | Add Advisor tier | $199/month | Week 6+ |
| **Post-A9** | Add Capital tier with marketplace | $499/month | Week 10+ |
| **Post-Pilot** | Add Institutional tier | $1,499/month | Week 14+ |

### Validation Gates

| Assumption | Must Validate Before |
|------------|----------------------|
| A4: Founder WTP ($49) | Launching Advisor tier |
| A6: Advisor WTP ($199) | Launching Capital tier |
| A9: Capital WTP ($499) | Launching Institutional tier |
| A10: Mandate potential | Launching API/programmatic access |

---

## Stripe Configuration

### Products

| Product ID | Name | Price | Status |
|------------|------|-------|--------|
| `prod_founder` | Founder Plan | $49/month | Active |
| `prod_founder_annual` | Founder Plan (Annual) | $470/year | Active |
| `prod_advisor` | Advisor Tier | $199/month | Pending A4 |
| `prod_advisor_annual` | Advisor Tier (Annual) | $1,990/year | Pending A4 |
| `prod_capital` | Capital Tier | $499/month | Pending A9 |
| `prod_capital_annual` | Capital Tier (Annual) | $4,990/year | Pending A9 |
| `prod_institutional` | Institutional Tier | $1,499/month | Pending pilot |
| `prod_institutional_annual` | Institutional Tier (Annual) | $14,990/year | Pending pilot |

### Trial Settings

```typescript
const STRIPE_CONFIG = {
  founder: {
    trial_period_days: 30,
    allow_promotion_codes: true,
  },
  portfolio_holder: {
    trial_period_days: 30,
    allow_promotion_codes: true,
    // Unverified during trial - cannot access marketplace
  },
};
```

### Checkout Metadata

```typescript
interface CheckoutMetadata {
  plan: 'founder' | 'advisor' | 'capital' | 'institutional';
  source: 'upgrade_modal' | 'pricing_page' | 'limit_hit' | 'trial_expiring' | 'marketplace_upgrade';
  trial_days_remaining?: number;
  relationship_type?: 'advisory' | 'capital' | 'program' | 'service' | 'ecosystem';
}
```

---

## Document Cross-References

These documents reference pricing and must stay in sync:

| Document | Key Values |
|----------|------------|
| `docs/features/trial-limits-and-upgrade.md` | Founder: $49, Trial: 30 days |
| `docs/user-experience/journeys/trials/founder-trial-journey-map.md` | Trial: 30 days |
| `docs/specs/portfolio-holder-vision.md` | Marketplace pricing framework |
| `docs/user-experience/journeys/trials/consultant-trial-journey-map.md` | Trial: 30 days |
| `docs/features/consultant-client-system.md` | Connection flows, verification |

---

## Changelog

| Date | Change | Owner |
|------|--------|-------|
| 2026-02-03 | Added tiered Portfolio Holder pricing (Advisor/Capital/Institutional) | Founder + product-strategist |
| 2026-02-03 | Added marketplace dynamics and quality flywheel | Founder + product-strategist |
| 2026-02-03 | Updated revenue model for two-sided marketplace | Founder + product-strategist |
| 2026-02-03 | Initial creation - canonicalized founder pricing decision | Founder + product-strategist |
