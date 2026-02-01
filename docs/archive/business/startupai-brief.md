# StartupAI Founder's Brief

> **ARCHIVED**: This document has been archived. For current assumptions and evidence, see [PROJECT-PLAN.md](../../work/PROJECT-PLAN.md).

> **StartupAI validates itself using its own methodology. This is our Customer Zero brief.**

**Created**: 2026-01-20
**Status**: Phase 1 Complete, Phase 2 In Progress
**Owner**: Chris Walker (chris00walker@proton.me)

---

## 1. The Idea

### One-Liner
AI-powered startup validation platform that replaces $50K consulting with $49/month SaaS.

### Description
StartupAI is an AI-powered startup validation platform that helps founders and consultants test business ideas before investing significant resources. Our multi-agent AI team (Sage, Forge, Pulse, Compass, Guardian, Ledger) guides users through Value Proposition Design methodology, running automated experiments and collecting evidence across Desirability, Feasibility, and Viability dimensions.

### Inspiration
After watching countless founders spend 6-12 months building products nobody wanted, I realized the validation process itself was broken. Structured methodologies like VPD exist but require expensive consultants or deep expertise. What if AI could democratize access to Fortune 500-quality strategic analysis?

### Unique Insight
The "AI Founders" metaphor transforms validation from a daunting research project into a collaborative team experience. Founders aren't alone - they have 6 specialized AI partners each bringing distinct expertise to de-risk their idea.

---

## 2. Problem Hypothesis

### What Pain?
Founders waste months or years building products nobody wants because they skip or poorly execute validation. The cost of failed startups is measured in time, money, relationships, and opportunity cost.

### Who Has This Pain?
- **Primary**: Pre-seed and seed-stage founders (0-2 years experience)
- **Secondary**: Startup consultants and accelerator programs
- **Tertiary**: Corporate innovation teams testing new ventures

### Frequency
Constant during pre-product phase. Once a founder commits to building, they're less likely to validate (sunk cost fallacy). The window is narrow: between idea and first line of code.

### Current Alternatives
| Alternative | Why It Fails |
|-------------|--------------|
| No validation | 90% startup failure rate |
| Customer interviews alone | Bias, small sample, no structure |
| Surveys | Wrong questions, leading data |
| Lean Canvas alone | Static snapshot, no evidence |
| Consultants ($50K+) | Unaffordable for early-stage |
| Accelerator programs | Competitive, time-constrained |

### Why Alternatives Fail
They either lack structure (DIY approaches), lack affordability (consultants), or lack accessibility (accelerators). No solution combines structured methodology + affordability + AI-powered execution.

---

## 3. Customer Hypothesis

### Primary Segment
**Technical founders** with a business idea who want to validate before building.

### Characteristics
- 25-45 years old
- Has coding ability (will build their own MVP)
- First or second-time founder
- Working on B2B or B2B2C SaaS
- Values data over intuition
- Has experienced or witnessed startup failure
- Budget: <$500/month for tools

### Where to Find Them
| Channel | Quality | Volume |
|---------|---------|--------|
| Indie Hackers | High | Medium |
| Product Hunt | Medium | High |
| Twitter/X (#buildinpublic) | Medium | Medium |
| Y Combinator forums | High | Low |
| Reddit (r/startups, r/entrepreneur) | Medium | High |
| Dev.to, Hacker News | Medium | Medium |

### Market Size
- **TAM**: 5M+ new businesses started annually in US alone
- **SAM**: ~500K tech startups globally/year
- **SOM**: 50K founders who actively seek validation tools (Year 1 target: 1,000)

---

## 4. Solution Hypothesis

### Proposed Solution
A SaaS platform where founders complete a 30-second Quick Start, then 6 AI Founders collaborate to:
1. Generate a structured Founder's Brief (Phase 0)
2. Map customer-problem-solution fit with VPC (Phase 1)
3. Design and run desirability experiments (Phase 2)
4. Assess technical feasibility (Phase 3)
5. Model business viability (Phase 4)

### Key Features
| Feature | Purpose | Assumption Tested |
|---------|---------|-------------------|
| 30-sec Quick Start | Reduce friction vs 20-min conversation | A2 |
| AI Founder's Brief | Generate structured validation plan | A3 |
| VPC Discovery | Map jobs, pains, gains vs products | A1, A3 |
| HITL Approvals | Build trust through collaboration | A1 |
| Evidence Dashboard | Show validation progress | A1 |
| Landing Page Generator | Test desirability | A5 |

### Differentiation
| Us | Them |
|----|----|
| 6 specialized AI agents | Single chatbot |
| VPD methodology built-in | Generic frameworks |
| Evidence-based scoring | Opinion-based |
| $49/month | $50K+ consulting |
| 24/7 availability | Consultant schedules |
| Structured outputs | Freeform advice |

---

## 5. Key Assumptions

| ID | Assumption | Risk | Category | Test Method |
|----|------------|------|----------|-------------|
| **A1** | Founders will trust AI-generated strategic analysis | HIGH | Customer | HITL approval rate, edit rate |
| **A2** | 30-second Quick Start reduces friction vs 20-min conversation | HIGH | Solution | Completion rate comparison |
| **A3** | AI briefs are accurate enough to be actionable | HIGH | Solution | Edit rate at approve_brief |
| **A4** | $49/month is viable price point for target segment | MEDIUM | Revenue | WTP surveys, conversion rate |
| **A5** | VPD methodology resonates with technical founders | MEDIUM | Problem | Landing page resonance tests |
| **A6** | Consultants will pay 3x for portfolio management | MEDIUM | Revenue | Consultant conversion rate |
| **A7** | "AI Founders" metaphor is compelling vs generic "AI" | LOW | Solution | A/B test messaging |
| **A8** | Indie Hackers is viable acquisition channel | MEDIUM | Channel | CAC, sign-up quality |

See [PROJECT-PLAN.md](../../work/PROJECT-PLAN.md) for full test cards (consolidated).

---

## 6. Success Criteria

### MVP Signal (Go/No-Go)
| Metric | Target | Deal-Breaker |
|--------|--------|--------------|
| Brief approval rate | >70% | <40% |
| Brief edit rate | <50% | >80% |
| User completes Phase 1 | >50% | <20% |
| Qualitative feedback | "This is useful" | "This is wrong" |

### Early Traction (Month 1-3)
| Metric | Target |
|--------|--------|
| Sign-ups | 100 |
| Active users (≥Phase 1) | 30 |
| Paid conversions | 10 |
| NPS | >30 |

### Product-Market Fit Signal
- Users return unprompted
- Organic referrals occur
- Churn <10% monthly
- CAC < 3-month LTV

---

## Quick Start Input Reference

This is what we'd submit to our own Quick Start form:

**raw_idea**:
```
StartupAI is an AI-powered startup validation platform that helps founders and
consultants test business ideas before investing significant resources. Our
multi-agent AI team (Sage, Forge, Pulse, Compass, Guardian, Ledger) guides users
through Value Proposition Design methodology, running automated experiments and
collecting evidence across Desirability, Feasibility, and Viability dimensions.
We replace $50K+ consulting engagements with a $49/month SaaS subscription,
making Fortune 500-quality strategic analysis accessible to early-stage founders.
```

**hints**:
```json
{
  "industry": "saas",
  "target_user": "b2b_smb",
  "geography": "global"
}
```

---

## Cross-References

**Note**: This document is archived. See [PROJECT-PLAN.md](../../work/PROJECT-PLAN.md) for consolidated assumptions, test cards, and evidence.

- [PROJECT-PLAN.md](../../work/PROJECT-PLAN.md) - Master plan with test cards and evidence log
- [Dogfooding Methodology](../../../startupai-crew/docs/master-architecture/10-dogfooding.md)

---

**Last Updated**: 2026-01-20
