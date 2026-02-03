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
- **Supply side**: Founders validating business ideas ($49/month or $1,499 Sprint)
- **Demand side**: Portfolio Holders seeking pre-validated deal flow ($199-$499/month)

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
│  │  • Ad budget: pass-through (founder-approved)                       │    │
│  │  • PDF/JSON exports                                                 │    │
│  │                                                                     │    │
│  │  Annual: $470/year (2 months free)                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  FOUNDER SPRINT                                      $1,499 one-time│    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  For founders who need to sprint to a go/no-go decision             │    │
│  │                                                                     │    │
│  │  • Everything in Founder Plan                                       │    │
│  │  • $500 ad budget INCLUDED (no separate charges)                    │    │
│  │  • Up to 3 pivots included                                          │    │
│  │  • Target: 7-10 days to decision (max 30 days)                      │    │
│  │  • Priority AI processing                                           │    │
│  │  • After Sprint: auto-enrolled at $49/month                         │    │
│  │                                                                     │    │
│  │  Target: Funded founders, corporate innovation, tight deadlines    │    │
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
│  │  • API access (programmatic deal flow integration)                  │    │
│  │  • Multi-seat licensing (5 seats included)                          │    │
│  │  • SSO/SAML integration                                             │    │
│  │                                                                     │    │
│  │  Annual: $4,990/year (2 months free)                                │    │
│  │  Target: Angels, VCs, accelerators, family offices, institutions   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Founder Pricing

### Tier Summary

| Tier | Price | Ad Budget | Pivots | Timeline | After |
|------|-------|-----------|--------|----------|-------|
| **Trial** | FREE | Pass-through | N/A | 30 days | Upgrade required |
| **Founder** | $49/month | Pass-through | Unlimited | Ongoing | Continues |
| **Sprint** | $1,499 one-time | $500 included | 3 included | 7-10 days (max 30) | $49/month |

### Free Trial

| Attribute | Value |
|-----------|-------|
| Duration | 30 days |
| Projects | 1 |
| Phases | Phase 0 only (Founder's Brief) |
| HITL Checkpoints | 1 (`approve_founders_brief`) |
| Ad Integration | Available (founder pays ad costs directly) |
| Credit Card Required | No |

### Founder Plan ($49/month)

| Attribute | Value |
|-----------|-------|
| Price | $49/month |
| Annual Option | $470/year (2 months free) |
| Projects | 5 concurrent |
| Phases | All (0-4) |
| HITL Checkpoints | All |
| Ad Budget | Pass-through (founder-approved, separate) |
| Pivots | Unlimited (standard pace) |
| Export | PDF, JSON |
| History | Unlimited |

### Founder Sprint ($1,499 one-time)

| Attribute | Value |
|-----------|-------|
| Price | $1,499 one-time |
| Ad Budget | **$500 INCLUDED** (no separate charges) |
| Pivots | Up to 3 included |
| Target Timeline | 7-10 days to go/no-go decision |
| Maximum Duration | 30 days |
| Processing | Priority AI queue |
| After Sprint | Auto-enrolled at $49/month |
| Projects | 1 (the sprint project) |

#### Who Sprint Is For

| Persona | Why They Pay $1,499 |
|---------|---------------------|
| **Accelerator founders** | Demo day deadline, need validated pitch fast |
| **Corporate innovation** | Budget exists, time is scarce |
| **Funded founders** | Runway pressure, need quick go/no-go |
| **Serial entrepreneurs** | Know the value of speed, want certainty |
| **Competition threat** | Need to move before market window closes |

#### What "3 Pivots" Means

Per the VPD methodology documented at `startupai.site`:
- A **pivot** is a structured restart when evidence indicates the current hypothesis is wrong
- Types: SEGMENT_PIVOT, VALUE_PIVOT, CHANNEL_PIVOT, FEATURE_PIVOT, etc.
- Sprint includes up to 3 pivots within the 30-day window
- Each pivot restarts the validation loop with a new direction
- If all 3 pivots are exhausted and no fit is found, the recommendation is KILL

#### Sprint Economics

| Component | Value |
|-----------|-------|
| Sprint price | $1,499 |
| Less: Ad budget included | -$500 |
| Platform premium | $999 |
| Equivalent months at $49 | ~20 months |
| Value proposition | Speed + certainty + all-inclusive |

### Why Two Founder Tiers

| Factor | Founder ($49) | Sprint ($1,499) |
|--------|---------------|-----------------|
| **Budget** | Bootstrapped | Funded/corporate |
| **Timeline** | Flexible | Urgent |
| **Ad budget** | Pay as you go | All-inclusive |
| **Pivots** | Self-paced | Structured (3 max) |
| **Support** | Standard | Priority |

---

## Portfolio Holder Pricing

### Tier Summary

| Tier | Monthly | Annual | Marketplace Access |
|------|---------|--------|-------------------|
| **Advisor** | $199 | $1,990 | Directory visible, no RFQ |
| **Capital** | $499 | $4,990 | Full marketplace + API |

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
| **StartupAI Capital** | **$5,988** | **Validated deal flow + evidence** |

### What StartupAI Provides That Others Cannot

| Differentiator | Why It Matters |
|----------------|----------------|
| **VPD Validation Evidence** | Not available anywhere else |
| **Customer Interview Data** | Primary research, not secondary |
| **Behavioral Evidence (DO data)** | Real traction signals, not vanity metrics |
| **Hypothesis Testing History** | Shows founder rigor |
| **HITL Checkpoint Record** | Shows coachability |
| **Fit Score Algorithm** | Quantified problem-solution fit |

### Advisor Tier ($199/month)

| Attribute | Value |
|-----------|-------|
| Price | $199/month |
| Annual | $1,990/year (2 months free) |
| Clients | Unlimited |
| Portfolio Dashboard | Full access |
| Validation Visibility | All phases |
| Connection Flows | All (invite-new, link-existing) |
| Exports | White-label PDF/JSON |
| Verified Status | Yes (directory opt-in) |
| Marketplace (Directory) | Listed, cannot browse |
| Marketplace (RFQ Board) | Cannot view or respond |
| API Access | No |

**Target**: Consultants, coaches, fractional executives, service providers

### Capital Tier ($499/month)

| Attribute | Value |
|-----------|-------|
| Price | $499/month |
| Annual | $4,990/year (2 months free) |
| Everything in Advisor | Yes |
| Founder Directory | Full access (browse validated startups) |
| RFQ/RFP Board | Full access (respond to capital-seeking founders) |
| Evidence Packages | Full VPD reports for any founder |
| Contact Requests | With founder consent |
| Advanced Filtering | Stage, sector, geography, fit score |
| Investment Thesis Matching | AI-powered matching |
| API Access | Yes (programmatic integration) |
| Multi-seat | 5 seats included |
| SSO/SAML | Yes |

**Target**: Angels, VCs, accelerators, family offices, corporate innovation, grant programs

### Tier Comparison

| Feature | Advisor ($199) | Capital ($499) |
|---------|---------------|----------------|
| Portfolio Dashboard | ✓ | ✓ |
| Unlimited Clients | ✓ | ✓ |
| Validation Visibility | ✓ | ✓ |
| White-label Exports | ✓ | ✓ |
| Verified Status | ✓ | ✓ |
| Connection Flows | ✓ | ✓ |
| **Founder Directory** | ✗ | ✓ |
| **RFQ/RFP Board** | ✗ | ✓ |
| **Evidence Packages** | ✗ | ✓ |
| **Contact Requests** | ✗ | ✓ |
| **API Access** | ✗ | ✓ |
| **Multi-seat (5)** | ✗ | ✓ |
| **SSO/SAML** | ✗ | ✓ |

### Why Two Portfolio Holder Tiers (Not Three)

| Factor | Decision |
|--------|----------|
| **Simplicity** | Easier to sell, easier to understand |
| **Price gap** | $199 → $499 is reasonable; $499 → $1,499 was too large |
| **Feature bundling** | API/multi-seat fit naturally with marketplace access |
| **Enterprise needs** | Capital tier at $499 covers VCs and accelerators |
| **Custom contracts** | True enterprise (100+ seats, SLA) handled separately |

---

## Marketplace Dynamics

### Verification System

| Status | Meaning | Directory | RFQ Board | Grace Period |
|--------|---------|-----------|-----------|--------------|
| **Unverified** | Trial or lapsed | Hidden | No access | N/A |
| **Verified** (Advisor) | Paid Advisor | Listed (opt-in) | Cannot respond | 7 days |
| **Verified** (Capital) | Paid Capital | Listed (opt-in) | Full access | 7 days |

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
│     └── $49/month (ongoing validation)                          │
│     └── $1,499 one-time (Sprint to decision)                    │
│                                                                 │
│  2. Portfolio Holder Subscriptions                              │
│     └── $199/month (Advisor)                                    │
│     └── $499/month (Capital)                                    │
│                                                                 │
│  3. Ad Budget (Pass-through) - Founder Plan only                │
│     └── Founder-approved amount                                 │
│     └── StartupAI does NOT profit from ad spend                 │
│     └── Sprint tier: $500 included, no pass-through             │
│                                                                 │
│  4. Future: Transaction Fees (Phase 4+)                         │
│     └── Consider success fees on funded deals                   │
│     └── Only after marketplace has critical mass                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phasing

| Phase | Scope | Pricing | Timeline |
|-------|-------|---------|----------|
| **Launch** | Founder + Sprint tiers | $49/month, $1,499 one-time | Now |
| **Post-A4** | Add Advisor tier | $199/month | Week 6+ |
| **Post-A6** | Add Capital tier with marketplace | $499/month | Week 10+ |

### Validation Gates

| Assumption | Must Validate Before |
|------------|----------------------|
| A4: Founder WTP ($49) | Launching Advisor tier |
| A4b: Sprint WTP ($1,499) | Can test concurrently with A4 |
| A6: Advisor WTP ($199) | Launching Capital tier |
| A9: Capital WTP ($499) | Full marketplace launch |

---

## Stripe Configuration

### Products

| Product ID | Name | Price | Type | Status |
|------------|------|-------|------|--------|
| `prod_founder` | Founder Plan | $49/month | Subscription | Active |
| `prod_founder_annual` | Founder Plan (Annual) | $470/year | Subscription | Active |
| `prod_sprint` | Founder Sprint | $1,499 | One-time | Active |
| `prod_advisor` | Advisor Tier | $199/month | Subscription | Pending A4 |
| `prod_advisor_annual` | Advisor Tier (Annual) | $1,990/year | Subscription | Pending A4 |
| `prod_capital` | Capital Tier | $499/month | Subscription | Pending A6 |
| `prod_capital_annual` | Capital Tier (Annual) | $4,990/year | Subscription | Pending A6 |

### Sprint Flow

```typescript
// Sprint purchase creates:
// 1. One-time charge: $1,499
// 2. Scheduled subscription: $49/month starting after Sprint completion (max 30 days)

const SPRINT_CONFIG = {
  price: 1499_00, // cents
  ad_budget_included: 500_00, // cents
  max_pivots: 3,
  target_days: 10,
  max_days: 30,
  post_sprint_plan: 'prod_founder', // $49/month auto-enrollment
};
```

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
  plan: 'founder' | 'sprint' | 'advisor' | 'capital';
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
| `docs/features/trial-limits-and-upgrade.md` | Founder: $49, Sprint: $1,499, Trial: 30 days |
| `docs/user-experience/journeys/trials/founder-trial-journey-map.md` | Trial: 30 days |
| `docs/specs/portfolio-holder-vision.md` | Advisor: $199, Capital: $499 |
| `docs/user-experience/journeys/trials/consultant-trial-journey-map.md` | Trial: 30 days |
| `docs/features/consultant-client-system.md` | Connection flows, verification |
| `startupai.site` (marketing) | Pivot methodology, Sprint details |

---

## Changelog

| Date | Change | Owner |
|------|--------|-------|
| 2026-02-03 | Added Founder Sprint tier ($1,499 one-time, $500 ad budget, 3 pivots) | Founder + product-strategist |
| 2026-02-03 | Simplified Portfolio Holder to 2 tiers (removed Institutional $1,499) | Founder + product-strategist |
| 2026-02-03 | Moved API/multi-seat to Capital tier ($499) | Founder + product-strategist |
| 2026-02-03 | Added tiered Portfolio Holder pricing (Advisor/Capital) | Founder + product-strategist |
| 2026-02-03 | Added marketplace dynamics and quality flywheel | Founder + product-strategist |
| 2026-02-03 | Initial creation - canonicalized founder pricing decision | Founder + product-strategist |
