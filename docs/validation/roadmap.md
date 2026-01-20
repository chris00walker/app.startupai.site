# Validation-Driven Roadmap

> **Features exist to test assumptions. Work priority comes from evidence state.**

**Created**: 2026-01-20
**Last Updated**: 2026-01-20

---

## Core Principle

Every feature must answer: **"What assumption does this test?"**

Work priority is determined by:
1. HIGH-risk UNTESTED assumptions
2. INVALIDATED assumptions requiring pivot
3. Features improving evidence quality
4. Highest evidence-weight remaining features

---

## Daily Work Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Is there a HIGH-risk UNTESTED assumption?                   │
│     → YES: Build minimum feature to test it                     │
│     → NO: Continue                                              │
│                                                                 │
│  2. Is there an INVALIDATED assumption requiring pivot?         │
│     → YES: Address pivot first                                  │
│     → NO: Continue                                              │
│                                                                 │
│  3. Is there a feature improving evidence quality?              │
│     → YES: Build it                                             │
│     → NO: Continue                                              │
│                                                                 │
│  4. Work on highest-evidence-weight feature                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Current Priority (2026-01-20)

Applying decision tree to current state:

### P0: HIGH-risk UNTESTED (A2)
**Quick Start tracking** - We pivoted to 30-sec Quick Start but have no data on whether it reduces friction.

| Item | Assumption | Evidence Gap | Effort |
|------|------------|--------------|--------|
| PostHog Quick Start events | A2 | No completion data | Small |
| Time-to-completion tracking | A2 | No timing data | Small |

### P1: HIGH-risk LOW Evidence (A1, A3)
**Trust and accuracy tracking** - We have n=2, need more signal.

| Item | Assumption | Evidence Gap | Effort |
|------|------------|--------------|--------|
| HITL approval PostHog events | A1 | No approval tracking | Small |
| Field-level edit tracking | A3 | No edit data | Medium |
| "This is wrong" feedback | A3 | No error reports | Small |

### P2: MEDIUM-risk UNTESTED (A4, A5, A8)
**Revenue and channel validation** - Can we make money? Can we acquire users?

| Item | Assumption | Evidence Gap | Effort |
|------|------------|--------------|--------|
| WTP survey | A4 | No pricing data | Medium |
| Stripe integration | A4 | No conversion data | Large |
| IH launch prep | A8 | No channel data | Medium |
| Landing page A/B test | A5 | No resonance data | Medium |

### P3: Nice to Have (A6, A7)
**Segment and messaging optimization** - Lower risk, can wait.

| Item | Assumption | Evidence Gap | Effort |
|------|------------|--------------|--------|
| Consultant marketing | A6 | No segment data | Large |
| AI Founders A/B test | A7 | No messaging data | Medium |

---

## Feature-to-Assumption Map

Complete mapping of all features to assumptions they test:

| Feature | Assumption(s) | Evidence Collected | Status |
|---------|---------------|-------------------|--------|
| **Onboarding** | | | |
| Quick Start form | A2 | Completion rate, time | DEPLOYED |
| Chat onboarding (deprecated) | A2 | Historical comparison | ARCHIVED |
| **Phase 0** | | | |
| AI Brief generation | A3 | Accuracy, edit rate | DEPLOYED |
| HITL approve_brief | A1 | Approval rate | DEPLOYED |
| Brief summary display | A3 | User comprehension | DEPLOYED |
| **Phase 1** | | | |
| VPC Discovery | A1, A3 | Fit score, approval | DEPLOYED |
| HITL approve_discovery | A1 | Approval rate | DEPLOYED |
| Evidence dashboard | A1 | Engagement time | DEPLOYED |
| **Phase 2** | | | |
| Landing page generator | A5 | Resonance, CTR | PLANNED |
| Experiment runner | A5 | Conversion data | PLANNED |
| **Revenue** | | | |
| Stripe integration | A4 | Conversion rate | PLANNED |
| WTP survey | A4 | Price sensitivity | PLANNED |
| Consultant tier | A6 | Segment conversion | PLANNED |
| **Acquisition** | | | |
| IH launch | A8 | Sign-ups, quality | PLANNED |
| UTM tracking | A8 | Attribution | NEEDED |
| **Messaging** | | | |
| AI Founders branding | A7 | A/B test results | DEPLOYED |
| Generic AI variant | A7 | A/B comparison | PLANNED |

---

## Evidence-to-Feature Dependencies

What features are blocked waiting for evidence?

| Feature | Blocked By | Evidence Needed |
|---------|-----------|-----------------|
| Pricing page | A1, A3 | >70% approval, <50% edits |
| Public launch | A2 | >80% completion |
| Scale marketing | A4 | Positive WTP signal |
| Consultant outreach | A1 | Trust signal established |

---

## Pivot Triggers

If evidence invalidates an assumption:

| Assumption | Invalidation Signal | Pivot Action |
|------------|---------------------|--------------|
| A1 | <40% approval | Add human review layer |
| A2 | <50% completion | Redesign onboarding |
| A3 | >30% error rate | Improve prompts, add validation |
| A4 | WTP <$20 median | Freemium model or enterprise pivot |
| A5 | VPD CTR <1% | Use simpler framework |
| A8 | <10 IH sign-ups | Try different channels |

---

## Sprint Planning Template

When planning work:

```markdown
## Sprint Goal
[Which assumptions are we testing?]

## Evidence Target
[What do we need to learn?]

## Work Items
| Item | Assumption | Evidence Metric | Done When |
|------|------------|-----------------|-----------|
| ... | A# | metric | condition |
```

---

## Weekly Review Questions

1. **What did we learn?** - New evidence collected
2. **What changed?** - Confidence levels moved
3. **What's invalidated?** - Any pivots needed?
4. **What's next?** - Re-apply decision tree

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Instead |
|--------------|--------------|---------|
| Building without assumption | No way to know if feature matters | Link every feature to assumption |
| Ignoring negative evidence | Confirmation bias | Update tracker honestly |
| Skipping low-effort tests | Missing easy wins | Do small tests first |
| Over-building before validation | Wasted effort on wrong things | MVP the feature |
| Testing multiple assumptions at once | Can't attribute results | One test per assumption |

---

## Cross-References

- [Founder's Brief](startupai-brief.md) - Full context
- [Assumptions Catalog](assumptions.md) - Test cards
- [Evidence Tracker](evidence-tracker.md) - Current state
- [WORK.md](../work/WORK.md) - Execution tracker

---

**Last Updated**: 2026-01-20
