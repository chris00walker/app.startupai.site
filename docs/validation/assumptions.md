# StartupAI Assumptions Catalog

> **Every feature exists to test an assumption. This is our assumption registry.**

**Created**: 2026-01-20
**Total Assumptions**: 8
**High Risk**: 3 | Medium Risk: 4 | Low Risk: 1

---

## Assumption Summary

| ID | Assumption | Risk | Status | Confidence |
|----|------------|------|--------|------------|
| A1 | Founders trust AI strategic analysis | HIGH | TESTING | LOW (n=2) |
| A2 | 30-sec Quick Start reduces friction | HIGH | UNTESTED | - |
| A3 | AI briefs are accurate enough | HIGH | TESTING | LOW (n=2) |
| A4 | $49/month is right price point | MEDIUM | UNTESTED | - |
| A5 | VPD methodology resonates | MEDIUM | UNTESTED | - |
| A6 | Consultants pay 3x for portfolio | MEDIUM | UNTESTED | - |
| A7 | "AI Founders" concept appeals | LOW | UNTESTED | - |
| A8 | Indie Hackers is acquisition channel | MEDIUM | UNTESTED | - |

---

## A1: Founders Trust AI Strategic Analysis

**Risk Level**: HIGH
**Category**: Customer
**Status**: TESTING

### Hypothesis
Founders will accept AI-generated strategic recommendations and act on them, rather than dismissing them as "just AI" or demanding human validation.

### Why It Matters
If founders don't trust AI output, the entire product value proposition collapses. Trust is the foundation of everything.

### Test Card

| Field | Value |
|-------|-------|
| **We believe** | Founders will trust AI-generated strategic analysis |
| **To verify, we will** | Measure approval rates at HITL checkpoints |
| **And measure** | % of briefs approved without major edits |
| **We are right if** | >70% approval rate, <50% significant edit rate |
| **We are wrong if** | <40% approval rate OR >80% edit rate |

### Evidence Collection
- HITL `approve_brief` checkpoint: approval vs rejection
- HITL `approve_discovery_output` checkpoint: approval vs rejection
- Edit tracking: how much do users modify AI outputs?
- Qualitative: user comments on AI quality

### Current Evidence
| Source | Sample | Result | Date |
|--------|--------|--------|------|
| Dogfood | n=2 | 2/2 approved | 2026-01-15 |

---

## A2: 30-Second Quick Start Reduces Friction

**Risk Level**: HIGH
**Category**: Solution
**Status**: UNTESTED

### Hypothesis
A 30-second form-based Quick Start will have higher completion rates than the original 20-minute conversational onboarding.

### Why It Matters
If onboarding friction prevents users from completing Phase 0, they never experience value. The pivot to Quick Start was a major architectural decision (ADR-006).

### Test Card

| Field | Value |
|-------|-------|
| **We believe** | 30-sec Quick Start has higher completion than 20-min chat |
| **To verify, we will** | Compare completion rates (historical vs new) |
| **And measure** | % of users who start → complete onboarding |
| **We are right if** | Quick Start completion >80% (vs ~40% chat) |
| **We are wrong if** | Quick Start completion <50% |

### Evidence Collection
- PostHog funnel: `quick_start_started` → `quick_start_completed`
- Time to completion
- Drop-off points in the form
- Comparison to historical chat completion (if available)

### Current Evidence
None yet. Quick Start just deployed.

---

## A3: AI Briefs Are Accurate Enough

**Risk Level**: HIGH
**Category**: Solution
**Status**: TESTING

### Hypothesis
AI-generated Founder's Briefs will be accurate enough that users can act on them with minimal editing, and the information will be correct.

### Why It Matters
Garbage in, garbage out. If briefs contain hallucinations, wrong assumptions, or misunderstood problems, all downstream validation is worthless.

### Test Card

| Field | Value |
|-------|-------|
| **We believe** | AI briefs are accurate and actionable |
| **To verify, we will** | Track edit rate and error reports |
| **And measure** | % of brief fields edited, % flagged as incorrect |
| **We are right if** | <30% fields edited, <10% flagged errors |
| **We are wrong if** | >50% fields edited OR >30% flagged errors |

### Evidence Collection
- Field-level edit tracking at `approve_brief`
- User feedback: "This is wrong" signals
- Qualitative: which sections get edited most?
- Downstream: does VPC align with brief?

### Current Evidence
| Source | Sample | Result | Date |
|--------|--------|--------|------|
| Dogfood | n=2 | 1 edit (minor) | 2026-01-15 |

---

## A4: $49/month Is Viable Price Point

**Risk Level**: MEDIUM
**Category**: Revenue
**Status**: UNTESTED

### Hypothesis
Technical founders will pay $49/month for structured validation, and this price supports a sustainable business.

### Why It Matters
Pricing determines whether we can build a business, not just a product. Too low = unsustainable. Too high = no adoption.

### Test Card

| Field | Value |
|-------|-------|
| **We believe** | $49/month is the right price for founders |
| **To verify, we will** | Run WTP (willingness to pay) surveys and track conversions |
| **And measure** | Conversion rate from free → paid, survey responses |
| **We are right if** | >5% conversion, WTP median around $49 |
| **We are wrong if** | <1% conversion OR WTP median <$20 |

### Evidence Collection
- Stripe conversion funnel
- WTP survey (Van Westendorp or Gabor-Granger)
- Competitor pricing comparison
- User interviews on value perception

### Current Evidence
None yet. No payment flow implemented.

---

## A5: VPD Methodology Resonates

**Risk Level**: MEDIUM
**Category**: Problem
**Status**: UNTESTED

### Hypothesis
Technical founders will recognize Value Proposition Design (VPD) as a valuable methodology and want to use it, rather than seeing it as "consultant fluff."

### Why It Matters
If the methodology feels foreign or academic, users won't engage. VPD is our core framework - if it doesn't resonate, we need a different approach.

### Test Card

| Field | Value |
|-------|-------|
| **We believe** | VPD methodology resonates with technical founders |
| **To verify, we will** | Test landing page messaging and track engagement |
| **And measure** | Click-through on VPD-focused messaging, time on VPC |
| **We are right if** | VPD messaging CTR >3%, VPC engagement >5 min |
| **We are wrong if** | VPD messaging CTR <1% OR users skip VPC |

### Evidence Collection
- Landing page A/B tests (VPD messaging vs generic)
- Time spent on VPC canvas
- Qualitative: do users reference VPD concepts?
- NPS correlation with VPD understanding

### Current Evidence
None yet. Landing page experiments pending.

---

## A6: Consultants Pay 3x for Portfolio Management

**Risk Level**: MEDIUM
**Category**: Revenue
**Status**: UNTESTED

### Hypothesis
Startup consultants will pay $149/month (3x founder price) for portfolio management features that let them manage multiple client validations.

### Why It Matters
Consultants are a higher-LTV segment that could accelerate revenue. If this segment converts, we have a B2B2C motion.

### Test Card

| Field | Value |
|-------|-------|
| **We believe** | Consultants will pay 3x for portfolio features |
| **To verify, we will** | Launch consultant tier and track conversion |
| **And measure** | Consultant sign-ups, conversion rate, retention |
| **We are right if** | >10 consultant sign-ups in Month 1, >50% activate |
| **We are wrong if** | <3 consultant sign-ups OR >70% churn in Month 1 |

### Evidence Collection
- Consultant-specific sign-up flow
- Feature usage: client management, portfolio view
- Retention: do consultants stay after first client?
- Referral: do consultants bring clients?

### Current Evidence
None yet. Consultant features built but not marketed.

---

## A7: "AI Founders" Metaphor Appeals

**Risk Level**: LOW
**Category**: Solution
**Status**: UNTESTED

### Hypothesis
The "6 AI Founders" metaphor (Sage, Forge, Pulse, Compass, Guardian, Ledger) is more compelling than generic "AI-powered" messaging.

### Why It Matters
Differentiation in a crowded AI space. If the metaphor doesn't land, we're just another AI tool.

### Test Card

| Field | Value |
|-------|-------|
| **We believe** | "AI Founders" metaphor is more compelling |
| **To verify, we will** | A/B test landing page messaging |
| **And measure** | CTR, sign-up rate, qualitative feedback |
| **We are right if** | "AI Founders" variant has >20% higher conversion |
| **We are wrong if** | No significant difference OR negative sentiment |

### Evidence Collection
- A/B test: "AI Founders" vs "AI-powered"
- Qualitative: do users mention the agents by name?
- Social: does the metaphor get shared/discussed?

### Current Evidence
None yet. A/B test pending.

---

## A8: Indie Hackers Is Acquisition Channel

**Risk Level**: MEDIUM
**Category**: Channel
**Status**: UNTESTED

### Hypothesis
Indie Hackers community will be a viable acquisition channel with acceptable CAC and quality users.

### Why It Matters
We need to find scalable acquisition channels. If our hypothesis about where founders hang out is wrong, we waste marketing effort.

### Test Card

| Field | Value |
|-------|-------|
| **We believe** | Indie Hackers is a viable acquisition channel |
| **To verify, we will** | Post on IH and track sign-ups with attribution |
| **And measure** | Sign-ups, CAC, activation rate, quality score |
| **We are right if** | >50 sign-ups from IH, >30% complete Phase 1 |
| **We are wrong if** | <10 sign-ups OR <10% activation |

### Evidence Collection
- UTM tracking: `?ref=indiehackers`
- PostHog cohort: IH users
- Quality: do IH users complete validation?
- CAC: time/money spent vs sign-ups

### Current Evidence
None yet. IH launch pending.

---

## Validation Priority

Based on risk level and current evidence state:

### Priority 1: HIGH Risk, UNTESTED
1. **A2** - Quick Start friction (just deployed, needs tracking)

### Priority 2: HIGH Risk, LOW Evidence
2. **A1** - Trust AI (need more n, PostHog tracking)
3. **A3** - Accuracy (need more n, edit tracking)

### Priority 3: MEDIUM Risk, UNTESTED
4. **A4** - Pricing (need WTP test)
5. **A5** - VPD resonance (need landing page test)
6. **A8** - Channel (need IH launch)
7. **A6** - Consultant segment (need marketing)

### Priority 4: LOW Risk
8. **A7** - Metaphor (nice to have A/B test)

---

## Cross-References

- [Founder's Brief](startupai-brief.md) - Full brief with context
- [Evidence Tracker](evidence-tracker.md) - Current evidence state
- [Validation Roadmap](roadmap.md) - Feature-to-assumption mapping

---

**Last Updated**: 2026-01-20
