---
purpose: "Canonical pricing and trial configuration - single source of truth"
status: "active"
last_reviewed: "2026-02-03"
decision_date: "2026-02-03"
decision_owner: "Founder + product-strategist"
---

# Pricing Specification

**Single Source of Truth for all pricing-related documentation.**

## Decision Summary

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Founder Plan Price** | $49/month | Strategyzer-level positioning; accessible to bootstrapped founders |
| **Trial Duration** | 30 days | Allows completion of full Phase 1 VPC Discovery |
| **Ad Budget** | Separate (pass-through) | Founder-approved, not included in SaaS fee |

---

## Pricing Tiers

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

### Consultant Plan (Future)

| Attribute | Value |
|-----------|-------|
| Price | $149/month (3x Founder) |
| Annual Option | $1,490/year |
| Projects | Unlimited (client management) |
| Portfolio View | Yes |
| White-label Exports | Yes |
| Client Onboarding | Dedicated flow |

---

## Revenue Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    REVENUE STREAMS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Platform Subscription (SaaS)                                │
│     └── $49/month (Founder) or $149/month (Consultant)          │
│                                                                 │
│  2. Ad Budget (Pass-through)                                    │
│     └── Founder-approved amount                                 │
│     └── Billed directly to founder's payment method             │
│     └── StartupAI does NOT profit from ad spend                 │
│     └── Recommendations are unbiased                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Ad Budget Model

The ad platform integration automates the DO evidence loop (real behavioral data).

| Aspect | Details |
|--------|---------|
| **Included in $49?** | No - ad costs are separate |
| **Who pays?** | Founder approves budget, charges to their payment method |
| **Recommendation** | AI suggests budget based on validation goals |
| **HITL Checkpoint** | `approve_spend_increase` gates ad activation |
| **Minimum Budget** | $50 recommended for statistically meaningful results |
| **During Trial** | Optional - platform is free, ads cost money if founder wants real DO evidence |

### Why Separate Ad Budget?

1. **No hidden costs** - founders know exactly what they're paying for
2. **Aligned incentives** - StartupAI doesn't profit from ad spend, so recommendations are unbiased
3. **Accessible trial** - founders can experience the platform without committing to ad spend
4. **Natural upsell** - "Ready to get real behavioral data? Approve your ad budget."

---

## Strategic Positioning

### Why $49/month (Not $99)

| Factor | Analysis |
|--------|----------|
| **Market positioning** | Strategyzer-level ($50/mo); professional, not commodity |
| **Persona fit** | Bootstrapped founders expect ~$50/mo tools |
| **Psychology** | Below $50 threshold; "cost of a nice lunch" |
| **Optionality** | Easy to raise later; hard to lower |
| **A4 Testing** | Validates willingness to pay at this price point |

### Why 30-Day Trial (Not 14)

| Factor | Analysis |
|--------|----------|
| **Phase 1 completion** | Real validation takes 2-4 weeks |
| **Evidence quality** | Customer interviews cannot be rushed |
| **Value realization** | Founders experience full VPC Discovery before paying |
| **WTP signal quality** | Informed decision > rushed decision |
| **Procrastination risk** | Mitigated with Day 7/14/21 email nudges |

---

## Stripe Configuration

### Products

| Product ID | Name | Price |
|------------|------|-------|
| `prod_founder` | Founder Plan | $49/month |
| `prod_founder_annual` | Founder Plan (Annual) | $470/year |
| `prod_consultant` | Consultant Plan | $149/month |
| `prod_consultant_annual` | Consultant Plan (Annual) | $1,490/year |

### Trial Settings

```typescript
const STRIPE_CONFIG = {
  trial_period_days: 30,
  allow_promotion_codes: true,
  billing_scheme: 'per_unit',
  usage_type: 'licensed',
};
```

### Checkout Metadata

```typescript
interface CheckoutMetadata {
  plan: 'founder' | 'consultant';
  source: 'upgrade_modal' | 'pricing_page' | 'limit_hit' | 'trial_expiring';
  trial_days_remaining?: number;
}
```

---

## Document Cross-References

These documents reference pricing and must stay in sync:

| Document | Updates Required |
|----------|------------------|
| `docs/features/trial-limits-and-upgrade.md` | Price: $49, Trial: 30 days |
| `docs/user-experience/journeys/trials/founder-trial-journey-map.md` | Trial: 30 days |
| `docs/archive/business/validation-reference.md` | A4: $49 (already correct) |

---

## Changelog

| Date | Change | Owner |
|------|--------|-------|
| 2026-02-03 | Initial creation - canonicalized pricing decision | Founder + product-strategist |
