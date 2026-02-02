# Business Validation Reference (Archived)

**Status**: Archived | **Date**: 2026-02-01

**Purpose**: This content was extracted from PROJECT-PLAN.md when we realized business model validation should happen IN the StartupAI product, not in markdown documents.

**Use this as reference** when entering hypotheses into StartupAI as CW Consulting's first client project.

---

## Assumptions Registry

All business assumptions in one place.

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

### Assumption Status (as of archive date)

| ID | Assumption | Phase | Status |
|----|------------|-------|--------|
| **A1** | Founders trust AI recommendations | 0-1 | 🔄 Testing |
| **A2** | Quick Start converts to engagement | 0 | 🔄 Testing |
| **A3** | AI extracts accurate business context | 0-1 | 🔄 Testing |
| **A4** | Willingness to pay for validation | 2-4 | 🔄 Testing |
| A5 | VPD methodology resonates | 2 | ⏳ Queued |
| A6 | Consultants see portfolio value | 2-3 | ⏳ Queued |
| A7 | "AI Founders" messaging attracts | 2 | ⏳ Queued |
| A8 | IH community is right channel | 2 | ⏳ Queued |
| A9 | Portfolio Holders will pay | Future | ⏳ Gated |
| A10 | Portfolio Holders will mandate usage | Future | ⏳ Gated |
| A11 | One cohort has most urgent pain | Future | ⏳ Gated |

---

## Test Cards

Each assumption has a structured test card defining what we believe, how we test it, and what success/failure looks like.

### A1: Founders Trust AI Strategic Analysis

| Field | Value |
|-------|-------|
| **We believe** | Founders will trust AI-generated strategic analysis |
| **To verify, we will** | Measure approval rates at HITL checkpoints |
| **And measure** | % of briefs approved without major edits |
| **We are right if** | >70% approval rate, <50% significant edit rate |
| **We are wrong if** | <40% approval rate OR >80% edit rate |

### A2: 30-Second Quick Start Reduces Friction

| Field | Value |
|-------|-------|
| **We believe** | 30-sec Quick Start has higher completion than 20-min chat |
| **To verify, we will** | Compare completion rates (historical vs new) |
| **And measure** | % of users who start -> complete onboarding |
| **We are right if** | Quick Start completion >80% (vs ~40% chat) |
| **We are wrong if** | Quick Start completion <50% |

### A3: AI Briefs Are Accurate Enough

| Field | Value |
|-------|-------|
| **We believe** | AI briefs are accurate and actionable |
| **To verify, we will** | Track edit rate and error reports |
| **And measure** | % of brief fields edited, % flagged as incorrect |
| **We are right if** | <30% fields edited, <10% flagged errors |
| **We are wrong if** | >50% fields edited OR >30% flagged errors |

### A4: $49/month Is Viable Price Point

| Field | Value |
|-------|-------|
| **We believe** | $49/month is the right price for founders |
| **To verify, we will** | Run WTP (willingness to pay) surveys and track conversions |
| **And measure** | Conversion rate from free -> paid, survey responses |
| **We are right if** | >5% conversion, WTP median around $49 |
| **We are wrong if** | <1% conversion OR WTP median <$20 |

### A5: VPD Methodology Resonates

| Field | Value |
|-------|-------|
| **We believe** | VPD methodology resonates with technical founders |
| **To verify, we will** | Test landing page messaging and track engagement |
| **And measure** | Click-through on VPD-focused messaging, time on VPC |
| **We are right if** | VPD messaging CTR >3%, VPC engagement >5 min |
| **We are wrong if** | VPD messaging CTR <1% OR users skip VPC |

### A6: Consultants Pay 3x for Portfolio Management

| Field | Value |
|-------|-------|
| **We believe** | Consultants will pay 3x for portfolio features |
| **To verify, we will** | Launch consultant tier and track conversion |
| **And measure** | Consultant sign-ups, conversion rate, retention |
| **We are right if** | >10 consultant sign-ups in Month 1, >50% activate |
| **We are wrong if** | <3 consultant sign-ups OR >70% churn in Month 1 |

### A7: "AI Founders" Metaphor Appeals

| Field | Value |
|-------|-------|
| **We believe** | "AI Founders" metaphor is more compelling |
| **To verify, we will** | A/B test landing page messaging |
| **And measure** | CTR, sign-up rate, qualitative feedback |
| **We are right if** | "AI Founders" variant has >20% higher conversion |
| **We are wrong if** | No significant difference OR negative sentiment |

### A8: Indie Hackers Is Acquisition Channel

| Field | Value |
|-------|-------|
| **We believe** | Indie Hackers is a viable acquisition channel |
| **To verify, we will** | Post on IH and track sign-ups with attribution |
| **And measure** | Sign-ups, CAC, activation rate, quality score |
| **We are right if** | >50 sign-ups from IH, >30% complete Phase 1 |
| **We are wrong if** | <10 sign-ups OR <10% activation |

---

## Evidence Log (as of archive date)

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

### A1 Evidence Details
- 2026-01-15: Dogfood approve_brief (Founder) - APPROVED, brief approved without changes
- 2026-01-15: Dogfood approve_discovery_output (Founder) - APPROVED, VPC fit 73/100

### A3 Evidence Details
- 2026-01-15: Dogfood Brief generation - 1 minor edit (problem statement tweaked)
- 2026-01-15: Dogfood VPC alignment - Aligned with brief assumptions

---

## Next Steps

When onboarding StartupAI as CW Consulting's first client:

1. Create hypotheses in the product matching A1-A8 above
2. Enter the test card criteria as validation criteria
3. Log existing evidence from the Evidence Log section
4. Progress through VPD phases using the product UI

---

**Archived from**: docs/work/PROJECT-PLAN.md
**Archived by**: technical-writer
**Reason**: Business validation should happen in StartupAI product, not markdown
