# StartupAI Evidence Tracker

> **Evidence state for all key assumptions. Updated as we learn.**

**Created**: 2026-01-20
**Last Updated**: 2026-01-20

---

## Evidence Summary

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

---

## Confidence Levels

| Level | Definition | n Required |
|-------|------------|------------|
| NONE | No data | 0 |
| LOW | Preliminary signal | 1-5 |
| MEDIUM | Directional confidence | 6-20 |
| HIGH | Statistical significance | 20+ |

---

## Detailed Evidence Log

### A1: Founders Trust AI Strategic Analysis

**Status**: TESTING
**Confidence**: LOW (n=2)

| Date | Source | Event | Result | Notes |
|------|--------|-------|--------|-------|
| 2026-01-15 | Dogfood | approve_brief (Founder) | APPROVED | StartupAI brief approved without changes |
| 2026-01-15 | Dogfood | approve_discovery_output (Founder) | APPROVED | VPC fit 73/100, approved |

**Learning**: Early signal is positive, but n=2 is too small. Need external users.

**Next**: Deploy PostHog tracking for HITL approval events across all users.

---

### A2: 30-Second Quick Start Reduces Friction

**Status**: UNTESTED
**Confidence**: NONE

| Date | Source | Event | Result | Notes |
|------|--------|-------|--------|-------|
| - | - | - | - | Quick Start just deployed |

**Baseline**: Historical chat completion rate unknown (no tracking existed).

**Next**:
1. Add PostHog events: `quick_start_started`, `quick_start_completed`
2. Track time-to-completion
3. Compare to any historical data if available

---

### A3: AI Briefs Are Accurate Enough

**Status**: TESTING
**Confidence**: LOW (n=2)

| Date | Source | Event | Result | Notes |
|------|--------|-------|--------|-------|
| 2026-01-15 | Dogfood | Brief generation | 1 minor edit | Problem statement tweaked |
| 2026-01-15 | Dogfood | VPC alignment | Aligned | VPC matched brief assumptions |

**Learning**: AI understood the business well. One minor edit suggests good but not perfect accuracy.

**Next**:
1. Add field-level edit tracking
2. Track which sections get edited most
3. Add "This is wrong" feedback button

---

### A4: $49/month Is Viable Price Point

**Status**: UNTESTED
**Confidence**: NONE

| Date | Source | Event | Result | Notes |
|------|--------|-------|--------|-------|
| - | - | - | - | No payment flow yet |

**Next**:
1. Implement Stripe integration
2. Design WTP survey (Van Westendorp)
3. Launch to 50 users before pricing test

---

### A5: VPD Methodology Resonates

**Status**: UNTESTED
**Confidence**: NONE

| Date | Source | Event | Result | Notes |
|------|--------|-------|--------|-------|
| - | - | - | - | No landing page tests yet |

**Next**:
1. Create VPD-focused landing page variant
2. Set up A/B test infrastructure
3. Track CTR on "Learn VPD" vs generic messaging

---

### A6: Consultants Pay 3x for Portfolio Management

**Status**: UNTESTED
**Confidence**: NONE

| Date | Source | Event | Result | Notes |
|------|--------|-------|--------|-------|
| - | - | - | - | Consultant features built, not marketed |

**Next**:
1. Create consultant-specific landing page
2. Define consultant onboarding flow
3. Launch to consultant communities

---

### A7: "AI Founders" Metaphor Appeals

**Status**: UNTESTED
**Confidence**: NONE

| Date | Source | Event | Result | Notes |
|------|--------|-------|--------|-------|
| - | - | - | - | No A/B test yet |

**Next**:
1. Create A/B test variants
2. Test "Meet your AI Founders" vs "AI-powered validation"
3. Track qualitative feedback

---

### A8: Indie Hackers Is Acquisition Channel

**Status**: UNTESTED
**Confidence**: NONE

| Date | Source | Event | Result | Notes |
|------|--------|-------|--------|-------|
| - | - | - | - | IH launch pending |

**Next**:
1. Prepare IH launch post
2. Set up UTM tracking
3. Define IH cohort in PostHog

---

## Evidence Collection Gaps

Features needed to improve evidence quality:

| Gap | Feature Needed | Assumption |
|-----|----------------|------------|
| No HITL approval tracking | PostHog events for approve_* | A1 |
| No completion funnel | Quick Start funnel events | A2 |
| No edit tracking | Field-level change tracking | A3 |
| No payment flow | Stripe integration | A4 |
| No A/B testing | Landing page variants | A5, A7 |
| No attribution | UTM + cohort tracking | A8 |

---

## Weekly Evidence Review

Every Monday, review:
1. New evidence collected
2. Confidence level changes
3. Assumptions requiring pivot
4. Next evidence to collect

---

## Cross-References

- [Founder's Brief](startupai-brief.md) - Full context
- [Assumptions Catalog](assumptions.md) - Test cards
- [Validation Roadmap](roadmap.md) - Feature priorities

---

**Last Updated**: 2026-01-20
