---
purpose: "HITL Approval UI Specification - defines what users see at each checkpoint"
status: "active"
last_reviewed: "2026-01-19"
derived_from: "startupai-crew/docs/master-architecture/reference/approval-workflows.md"
---

# HITL Approval UI Specification

This document resolves Category A ambiguities from the master-architecture translation plan by specifying exactly what users see and do at each Human-in-the-Loop checkpoint.

## Overview

StartupAI has **10+ HITL checkpoints** across 5 validation phases. Each checkpoint:

1. Pauses AI execution
2. Presents evidence and options to the user
3. Accepts approve/reject/revise decisions
4. Resumes AI execution based on user decision

## UI Component Architecture

All HITL checkpoints use the same modal architecture with phase-specific content:

```
┌─────────────────────────────────────────────────────┐
│ [ApprovalTypeIndicator]           [TimeRemaining]   │
├─────────────────────────────────────────────────────┤
│ Title: {checkpoint_title}                           │
│ Project: {project_name}                             │
│                                                     │
│ [FounderAvatar] - {AI Founder name and role}        │
├─────────────────────────────────────────────────────┤
│ Description: {what this checkpoint is about}        │
├─────────────────────────────────────────────────────┤
│ [EvidenceSummary]                                   │
│ - D-F-V signals (where applicable)                  │
│ - Key metrics                                       │
│ - Key learnings                                     │
├─────────────────────────────────────────────────────┤
│ [PhaseSpecificContent]                              │
│ - Varies by checkpoint type (see below)             │
├─────────────────────────────────────────────────────┤
│ [DecisionOptions] (when multiple paths exist)       │
│ ○ Option A (Recommended)                            │
│ ○ Option B                                          │
│ ○ Option C                                          │
├─────────────────────────────────────────────────────┤
│ [FeedbackTextarea]                                  │
│ "Add any notes or reasoning..."                     │
├─────────────────────────────────────────────────────┤
│ [Cancel]        [Reject]          [Approve]         │
└─────────────────────────────────────────────────────┘
```

---

## Phase 0: Onboarding Checkpoints

### Checkpoint: `approve_founders_brief`

**When triggered**: After 7-stage onboarding interview completes

**Approver**: Founder + Guardian (dual approval)

**Owner Role**: `guardian`

| Field | Content |
|-------|---------|
| **Title** | "Review Your Founder's Brief" |
| **Description** | "The AI has extracted these hypotheses from your interview. Confirm they accurately capture your business idea before analysis begins." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ THE IDEA                                            │
├─────────────────────────────────────────────────────┤
│ One-liner: {the_idea.one_liner}                     │
│                                                     │
│ Description:                                        │
│ {the_idea.description}                              │
│                                                     │
│ Unique Insight:                                     │
│ {the_idea.unique_insight}                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ PROBLEM HYPOTHESIS (NOT VALIDATED)                  │
├─────────────────────────────────────────────────────┤
│ Problem: {problem_hypothesis.problem_statement}     │
│ Who: {problem_hypothesis.who_has_this_problem}      │
│ Frequency: {problem_hypothesis.frequency}           │
│ Current alternatives: {current_alternatives}        │
│ Why alternatives fail: {why_alternatives_fail}      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ CUSTOMER HYPOTHESIS (NOT VALIDATED)                 │
├─────────────────────────────────────────────────────┤
│ Primary Segment: {customer_hypothesis.primary_segment}
│ Characteristics: {characteristics}                  │
│ Where to find them: {where_to_find_them}           │
│ Estimated size: {estimated_size}                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ SOLUTION HYPOTHESIS (NOT VALIDATED)                 │
├─────────────────────────────────────────────────────┤
│ Proposed Solution: {solution_hypothesis.proposed_solution}
│ Key Features:                                       │
│ • {feature_1}                                       │
│ • {feature_2}                                       │
│ Differentiation: {differentiation}                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ KEY ASSUMPTIONS (ranked by risk)                    │
├─────────────────────────────────────────────────────┤
│ 🔴 HIGH RISK:                                       │
│    • {assumption_1}                                 │
│    • {assumption_2}                                 │
│ 🟠 MEDIUM RISK:                                     │
│    • {assumption_3}                                 │
│ 🟢 LOW RISK:                                        │
│    • {assumption_4}                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ SUCCESS CRITERIA                                    │
├─────────────────────────────────────────────────────┤
│ Problem Resonance Target: {target}%                 │
│ Max Zombie Ratio: {max}%                            │
│ Fit Score Target: {score}                           │
│ Deal Breakers: {deal_breakers}                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ QA REPORT                                           │
├─────────────────────────────────────────────────────┤
│ Concept Legitimacy: ✅ Pass / ❌ Fail / ⚠️ Review   │
│ Intent Verification: ✅ Pass / ❌ Fail / ⚠️ Review  │
│ Notes: {qa_notes}                                   │
└─────────────────────────────────────────────────────┘
```

**Decision Options:**

| Option | Label | Description | Outcome |
|--------|-------|-------------|---------|
| `approve` | "Approve & Start Analysis" | Brief accurately captures my idea | → Phase 1 VPC Discovery |
| `revise` | "Request Revisions" | Some sections need clarification | → Return to interview |
| `reject` | "Reject Brief" | This doesn't represent my idea at all | → Close project |

**User Actions:**
- **Inline Edit**: NO (Brief is AI-generated; revisions go through interview)
- **Comment**: YES (feedback textarea)
- **Approve**: YES (starts Phase 1)
- **Reject**: YES (closes project with reason)

---

## Phase 1: VPC Discovery Checkpoints

### Checkpoint: `approve_experiment_plan`

**When triggered**: After Experiment Agent designs test cards

**Approver**: Founder + Guardian

**Owner Role**: `guardian`

| Field | Content |
|-------|---------|
| **Title** | "Review Experiment Plan" |
| **Description** | "Before we test your assumptions, review the proposed experiments and approve the approach." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ PROPOSED EXPERIMENTS                                │
├─────────────────────────────────────────────────────┤
│ Experiment 1: {name}                                │
│ ├─ Type: {landing_page | ad_test | interview}       │
│ ├─ Hypothesis: {hypothesis}                         │
│ ├─ Metric: {metric}                                 │
│ ├─ Pass Criteria: {success_criteria}                │
│ ├─ Evidence Type: {SAY | DO}                        │
│ ├─ Estimated Cost: ${cost}                          │
│ └─ Duration: {days} days                            │
│                                                     │
│ Experiment 2: {name}                                │
│ └─ ... (same structure)                             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ASSUMPTIONS BEING TESTED                            │
├─────────────────────────────────────────────────────┤
│ ✓ Experiment 1 tests: {assumption_1}               │
│ ✓ Experiment 2 tests: {assumption_2}               │
│ ⚠️ NOT tested yet: {assumption_3}                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ RESOURCE REQUIREMENTS                               │
├─────────────────────────────────────────────────────┤
│ Total Budget: ${total_budget}                       │
│ Timeline: {total_days} days                         │
│ Tools: {tool_list}                                  │
└─────────────────────────────────────────────────────┘
```

**Decision Options:**

| Option | Label | Description | Outcome |
|--------|-------|-------------|---------|
| `approve` | "Approve Plan" | Run these experiments | → Execute experiments |
| `modify` | "Modify Budget" | Adjust spending limits | → Confirm new limits |
| `reject` | "Reject Plan" | Design different experiments | → Re-plan experiments |

---

### Checkpoint: `approve_pricing_test`

**When triggered**: Before running Willingness-To-Pay experiments

**Approver**: Founder + Ledger

**Owner Role**: `ledger`

| Field | Content |
|-------|---------|
| **Title** | "Approve Pricing Test" |
| **Description** | "We're ready to test pricing with real customers. This involves showing price points to gauge willingness to pay." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ PRICING TEST DESIGN                                 │
├─────────────────────────────────────────────────────┤
│ Test Type: {Van Westendorp | Gabor-Granger}         │
│                                                     │
│ Price Points to Test:                               │
│ • ${price_1}/month                                  │
│ • ${price_2}/month                                  │
│ • ${price_3}/month                                  │
│                                                     │
│ Sample Size Target: {n} responses                   │
│ Channels: {landing_page | survey | interview}       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ CURRENT PRICING ASSUMPTIONS                         │
├─────────────────────────────────────────────────────┤
│ Hypothesized Price: ${price}/month                  │
│ Target Gross Margin: {margin}%                      │
│ Competitor Range: ${low} - ${high}                  │
└─────────────────────────────────────────────────────┘
```

**Decision Options:**

| Option | Label | Description | Outcome |
|--------|-------|-------------|---------|
| `approve` | "Run Pricing Test" | Proceed with these price points | → Execute WTP test |
| `adjust` | "Adjust Prices" | Change the price points | → Update and re-confirm |
| `skip` | "Skip for Now" | Don't test pricing yet | → Defer to Phase 4 |

---

### Checkpoint: `approve_vpc_completion`

**When triggered**: When Fit Assessment score ≥ 70

**Approver**: Founder + Guardian

**Owner Role**: `guardian`

| Field | Content |
|-------|---------|
| **Title** | "VPC Discovery Complete - Gate Decision" |
| **Description** | "Your Value Proposition Canvas has reached the minimum fit threshold. Review the evidence and decide whether to proceed to Desirability testing." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ FIT ASSESSMENT                                      │
├─────────────────────────────────────────────────────┤
│ Fit Score: {score}/100 ✅ (≥70 required)            │
│ Fit Status: {strong | moderate | weak}              │
│                                                     │
│ Profile Completeness: {pct}%                        │
│ Value Map Coverage: {pct}%                          │
│ Evidence Strength: {strong | weak}                  │
│ Experiments Run: {run}/{planned}                    │
│ Experiments Passed: {passed}/{run}                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ CUSTOMER PROFILE (Validated)                        │
├─────────────────────────────────────────────────────┤
│ Segment: {segment_name}                             │
│                                                     │
│ Jobs (Validated):                                   │
│ ✅ {job_1} - {validation_evidence}                  │
│ ✅ {job_2} - {validation_evidence}                  │
│                                                     │
│ Pains (Validated):                                  │
│ ✅ {pain_1} (Severe) - {validation_evidence}        │
│ ⚠️ {pain_2} (Moderate) - Not yet validated          │
│                                                     │
│ Gains (Validated):                                  │
│ ✅ {gain_1} (Essential) - {validation_evidence}     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ VALUE MAP (Coverage)                                │
├─────────────────────────────────────────────────────┤
│ Pain Relievers:                                     │
│ ✅ {pain_1} → {reliever} (Eliminates)               │
│ ⚠️ {pain_2} → {reliever} (Reduces)                  │
│                                                     │
│ Gain Creators:                                      │
│ ✅ {gain_1} → {creator} (Exceeds expectations)      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ RECOMMENDATION                                      │
├─────────────────────────────────────────────────────┤
│ Guardian says: "Proceed to Phase 2. Strong fit      │
│ evidence with 3 validated pain points."             │
│                                                     │
│ Blockers (if any):                                  │
│ • {blocker_1}                                       │
└─────────────────────────────────────────────────────┘
```

**Decision Options:**

| Option | Label | Description | Risk | Outcome |
|--------|-------|-------------|------|---------|
| `proceed` | "Proceed to Desirability" (Recommended) | Fit is strong enough | Low | → Phase 2 |
| `iterate` | "Run More Experiments" | Need more evidence | Low | → More Phase 1 experiments |
| `pivot_segment` | "Pivot to New Segment" | Wrong customer | Medium | → Segment pivot flow |

---

## Phase 2: Desirability Checkpoints

### Checkpoint: `campaign_launch`

**When triggered**: Before launching ad campaigns

**Approver**: Founder + Pulse

**Owner Role**: `pulse`

| Field | Content |
|-------|---------|
| **Title** | "Approve Campaign Launch" |
| **Description** | "Review the ad creatives and landing pages before we go live. This will spend real money." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ AD VARIANTS                                         │
├─────────────────────────────────────────────────────┤
│ [Preview] Ad 1: {headline}                          │
│ Platform: {Meta | TikTok | LinkedIn}                │
│ Hook: {problem-agitate-solve}                       │
│ CTA: {cta_text}                                     │
│ Status: ✅ Guardian Approved                        │
│                                                     │
│ [Preview] Ad 2: {headline}                          │
│ Platform: {platform}                                │
│ Status: ⚠️ Needs Review (tone concern)              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ LANDING PAGE VARIANTS                               │
├─────────────────────────────────────────────────────┤
│ [Preview] LP A: {variant_tag}                       │
│ URL: {preview_url}                                  │
│ Status: ✅ Guardian Approved                        │
│                                                     │
│ [Preview] LP B: {variant_tag}                       │
│ URL: {preview_url}                                  │
│ Status: ✅ Guardian Approved                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ BUDGET & TIMELINE                                   │
├─────────────────────────────────────────────────────┤
│ Total Budget: ${budget}                             │
│ Duration: {days} days                               │
│ Daily Cap: ${daily_cap}                             │
│ Target Impressions: {impressions}                   │
│ Expected CPC: ${cpc}                                │
└─────────────────────────────────────────────────────┘
```

**Decision Options:**

| Option | Label | Description | Outcome |
|--------|-------|-------------|---------|
| `approve` | "Launch Campaign" | Go live with these creatives | → Start campaigns |
| `edit_creatives` | "Edit Creatives" | Modify before launch | → Update creatives |
| `reject` | "Don't Launch" | Not ready for market | → Halt campaign |

---

### Checkpoint: `spend_increase`

**When triggered**: When budget threshold reached or increase requested

**Approver**: Founder + Ledger

**Owner Role**: `ledger`

| Field | Content |
|-------|---------|
| **Title** | "Budget Increase Request" |
| **Description** | "Ledger recommends increasing the experiment budget based on initial results." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ CURRENT SPEND                                       │
├─────────────────────────────────────────────────────┤
│ Spent to Date: ${spent} / ${budget}                 │
│ Days Remaining: {days}                              │
│ Daily Average: ${daily_avg}                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ RESULTS SO FAR                                      │
├─────────────────────────────────────────────────────┤
│ Impressions: {impressions}                          │
│ Clicks: {clicks} (CTR: {ctr}%)                      │
│ Signups: {signups} (Conv: {conv}%)                  │
│ CPA: ${cpa}                                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ RECOMMENDATION                                      │
├─────────────────────────────────────────────────────┤
│ Ledger says: "Results are promising. Recommend      │
│ increasing budget to gather statistically           │
│ significant data."                                  │
│                                                     │
│ Requested Increase: ${increase}                     │
│ New Total: ${new_total}                             │
│ Expected Additional Signups: {signups}              │
└─────────────────────────────────────────────────────┘
```

**Decision Options:**

| Option | Label | Description | Outcome |
|--------|-------|-------------|---------|
| `approve_full` | "Approve Full Increase" | Accept recommended budget | → Resume with new budget |
| `approve_partial` | "Approve Partial" | Increase by smaller amount | → Specify amount |
| `reject` | "Keep Current Budget" | Don't increase spending | → Continue with cap |

---

### Checkpoint: `gate_progression` (Desirability Gate)

**When triggered**: When Desirability evidence is collected

**Approver**: Founder + Guardian

**Owner Role**: `guardian`

| Field | Content |
|-------|---------|
| **Title** | "Desirability Gate - Phase Decision" |
| **Description** | "Review the market evidence and decide the next step." |

**Evidence Summary shows:**
- Desirability Signal (strong_commitment / weak_interest / no_interest)
- Problem Resonance score
- Zombie Ratio
- Conversion Rate
- Total impressions, clicks, signups

**Decision Options:**

| Option | Label | Description | Risk | Outcome |
|--------|-------|-------------|------|---------|
| `proceed` | "Proceed to Feasibility" | Strong commitment evident | Low | → Phase 3 |
| `iterate` | "Run More Tests" | Need more evidence | Low | → More experiments |
| `segment_pivot` | "Pivot Segment" | Wrong audience | Medium | → Segment pivot flow |
| `value_pivot` | "Pivot Value Prop" | Wrong promise | Medium | → Value pivot flow |
| `kill` | "Kill Project" | No viable path | High | → Close project |

---

## Phase 3: Feasibility Checkpoints

### Checkpoint: `gate_progression` (Feasibility Gate)

**When triggered**: After technical feasibility assessment

**Approver**: Founder + Forge

**Owner Role**: `forge`

| Field | Content |
|-------|---------|
| **Title** | "Feasibility Gate - Technical Assessment" |
| **Description** | "Forge has assessed whether we can build this solution with available resources." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ FEASIBILITY SIGNAL: {GREEN | ORANGE | RED}          │
├─────────────────────────────────────────────────────┤
│ ✅ GREEN: Feasible with current resources           │
│ ⚠️ ORANGE: Feasible with scope reduction            │
│ ❌ RED: Not feasible with any available resources   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ FEATURE ASSESSMENT                                  │
├─────────────────────────────────────────────────────┤
│ ✅ Core Feature 1: POSSIBLE                         │
│    - Complexity: 3/10                               │
│    - Monthly Cost: $50                              │
│                                                     │
│ ⚠️ Core Feature 2: CONSTRAINED                      │
│    - Complexity: 7/10                               │
│    - Monthly Cost: $200                             │
│    - Constraint: Requires third-party API           │
│                                                     │
│ ❌ Feature 3: IMPOSSIBLE                            │
│    - Reason: No available API for {capability}      │
│    - Alternative: {suggested_alternative}           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ COST ESTIMATE                                       │
├─────────────────────────────────────────────────────┤
│ API Costs: ${api_costs}/month                       │
│ Infra Costs: ${infra_costs}/month                   │
│ Total: ${total}/month                               │
│                                                     │
│ MVP Timeline: {weeks} weeks                         │
└─────────────────────────────────────────────────────┘
```

**Decision Options (when ORANGE/Constrained):**

| Option | Label | Description | Outcome |
|--------|-------|-------------|---------|
| `proceed_full` | "Build Full Scope" | Accept constraints | → Phase 4 |
| `proceed_downgrade` | "Accept Downgrade" (Recommended) | Remove {feature} | → Phase 4 with reduced scope |
| `explore_alternatives` | "Explore Alternatives" | Research other approaches | → Alternative analysis |
| `kill` | "Kill Project" | Not technically viable | → Close project |

---

## Phase 4: Viability Checkpoints

### Checkpoint: `gate_progression` (Viability Gate)

**When triggered**: After unit economics analysis

**Approver**: Founder + Ledger

**Owner Role**: `ledger`

| Field | Content |
|-------|---------|
| **Title** | "Viability Gate - Unit Economics" |
| **Description** | "Ledger has analyzed whether this business can be profitable." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ VIABILITY SIGNAL: {PROFITABLE | MARGINAL | UNDERWATER}
├─────────────────────────────────────────────────────┤
│ ✅ PROFITABLE: LTV/CAC ≥ 3                          │
│ ⚠️ MARGINAL: 1 < LTV/CAC < 3                        │
│ ❌ UNDERWATER: LTV/CAC < 1                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ UNIT ECONOMICS                                      │
├─────────────────────────────────────────────────────┤
│ Customer Acquisition Cost (CAC): ${cac}             │
│ Lifetime Value (LTV): ${ltv}                        │
│ LTV/CAC Ratio: {ratio}                              │
│ Gross Margin: {margin}%                             │
│ Payback Period: {months} months                     │
│                                                     │
│ Benchmark: B2B SaaS SMB typically needs 3.0+ ratio  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ MARKET SIZING                                       │
├─────────────────────────────────────────────────────┤
│ TAM: ${tam}                                         │
│ SAM: ${sam}                                         │
│ SOM: ${som} (Year 1 target)                         │
│                                                     │
│ Break-even Customers: {n}                           │
│ Market Share for Break-even: {pct}%                 │
└─────────────────────────────────────────────────────┘
```

**Decision Options:**

| Option | Label | Description | Outcome |
|--------|-------|-------------|---------|
| `proceed` | "Proceed to Launch" | Unit economics work | → Validated |
| `price_pivot` | "Increase Pricing" | Improve LTV | → Pricing adjustment |
| `cost_pivot` | "Reduce CAC" | Optimize acquisition | → Channel optimization |
| `strategic_pivot` | "Strategic Pivot" | Fundamental model change | → New direction |
| `kill` | "Kill Project" | No viable path | → Close project |

---

### Checkpoint: `final_decision`

**When triggered**: After all phases complete

**Approver**: Founder + Guardian (final sign-off)

**Owner Role**: `guardian`

| Field | Content |
|-------|---------|
| **Title** | "Final Validation Decision" |
| **Description** | "All validation phases are complete. Review the full evidence and make your final decision." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ VALIDATION SUMMARY                                  │
├─────────────────────────────────────────────────────┤
│ Desirability: ✅ Strong Commitment                  │
│ Feasibility:  ✅ Green (Feasible)                   │
│ Viability:    ✅ Profitable (LTV/CAC: 3.2)          │
│                                                     │
│ Overall: VALIDATED                                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ JOURNEY METRICS                                     │
├─────────────────────────────────────────────────────┤
│ Total Duration: {days} days                         │
│ Total Spend: ${spend}                               │
│ Experiments Run: {count}                            │
│ Pivots: {count}                                     │
│ HITL Decisions: {count}                             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ RECOMMENDATION                                      │
├─────────────────────────────────────────────────────┤
│ {AI recommendation text}                            │
│                                                     │
│ Confidence: {HIGH | MEDIUM | LOW}                   │
│ Next Steps:                                         │
│ 1. {next_step_1}                                    │
│ 2. {next_step_2}                                    │
│ 3. {next_step_3}                                    │
└─────────────────────────────────────────────────────┘
```

**Decision Options:**

| Option | Label | Description | Outcome |
|--------|-------|-------------|---------|
| `validate` | "Mark as Validated" | Ready to build | → Project status: Validated |
| `iterate` | "Continue Testing" | Need more evidence | → Choose phase to revisit |
| `archive` | "Archive Project" | Park for later | → Project status: Archived |

---

## Pivot Flow Checkpoints

### Checkpoint: `segment_pivot`

**When triggered**: When evidence shows wrong customer segment

**Approver**: Founder + Compass

**Owner Role**: `compass`

| Field | Content |
|-------|---------|
| **Title** | "Segment Pivot Required" |
| **Description** | "Evidence suggests we're targeting the wrong customer segment. Review the data and choose a new direction." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ CURRENT SEGMENT EVIDENCE                            │
├─────────────────────────────────────────────────────┤
│ Segment: {current_segment}                          │
│ Problem Resonance: {pct}% ❌ (target: 50%+)         │
│ Conversion Rate: {pct}%                             │
│                                                     │
│ Why it's failing:                                   │
│ • {reason_1}                                        │
│ • {reason_2}                                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ALTERNATIVE SEGMENTS (AI-recommended)               │
├─────────────────────────────────────────────────────┤
│ Option A: {segment_a} (Recommended)                 │
│ ├─ Rationale: {why_this_segment}                    │
│ ├─ Estimated TAM: ${tam}                            │
│ └─ Risk: Low                                        │
│                                                     │
│ Option B: {segment_b}                               │
│ ├─ Rationale: {why_this_segment}                    │
│ ├─ Estimated TAM: ${tam}                            │
│ └─ Risk: Medium                                     │
│                                                     │
│ Option C: Custom Segment                            │
│ └─ Define your own target segment                   │
└─────────────────────────────────────────────────────┘
```

**Decision Options:**

| Option | Label | Description | Outcome |
|--------|-------|-------------|---------|
| `pivot_a` | "Pivot to {segment_a}" (Recommended) | Best evidence fit | → Restart Phase 1 with new segment |
| `pivot_b` | "Pivot to {segment_b}" | Alternative option | → Restart Phase 1 |
| `custom` | "Define Custom Segment" | Manual entry | → Specify segment, restart Phase 1 |
| `continue` | "Continue with Current" | Override AI | → Resume current path |
| `kill` | "Kill Project" | No viable segment | → Close project |

---

### Checkpoint: `value_pivot`

**When triggered**: High interest but low commitment (zombie ratio ≥70%)

**Approver**: Founder + Compass

**Owner Role**: `compass`

| Field | Content |
|-------|---------|
| **Title** | "Value Proposition Pivot Required" |
| **Description** | "People are interested but not committing. This usually means the value proposition isn't compelling enough." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ ZOMBIE RATIO ALERT                                  │
├─────────────────────────────────────────────────────┤
│ Problem Resonance: {pct}% ✅ (good interest)        │
│ Zombie Ratio: {pct}% ❌ (too many not committing)   │
│ Conversion Rate: {pct}%                             │
│                                                     │
│ "Zombies" = people who say they're interested but   │
│ won't put skin in the game (sign up, pay, commit)   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ CURRENT VALUE PROPOSITION                           │
├─────────────────────────────────────────────────────┤
│ {current_value_prop}                                │
│                                                     │
│ Why it's not converting:                            │
│ • {reason_1}                                        │
│ • {reason_2}                                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ALTERNATIVE VALUE PROPOSITIONS                      │
├─────────────────────────────────────────────────────┤
│ Option A: {value_prop_a} (Recommended)              │
│ ├─ Focus on: {pain_addressed}                       │
│ └─ Risk: Low                                        │
│                                                     │
│ Option B: {value_prop_b}                            │
│ ├─ Focus on: {pain_addressed}                       │
│ └─ Risk: Medium                                     │
└─────────────────────────────────────────────────────┘
```

**Decision Options:**

| Option | Label | Description | Outcome |
|--------|-------|-------------|---------|
| `pivot_a` | "Adopt Value Prop A" (Recommended) | Strongest pain focus | → Restart Desirability with new VP |
| `pivot_b` | "Adopt Value Prop B" | Alternative focus | → Restart Desirability |
| `iterate` | "Refine Current VP" | Keep direction, tweak | → Adjust messaging |
| `kill` | "Kill Project" | Value prop not viable | → Close project |

---

### Checkpoint: `feature_downgrade`

**When triggered**: When core features are technically impossible

**Approver**: Founder + Forge

**Owner Role**: `forge`

| Field | Content |
|-------|---------|
| **Title** | "Feature Downgrade Required" |
| **Description** | "Some requested features cannot be built. We need to scope down and retest desirability." |

**Phase-Specific Content:**

```
┌─────────────────────────────────────────────────────┐
│ IMPOSSIBLE FEATURES                                 │
├─────────────────────────────────────────────────────┤
│ ❌ {feature_1}                                      │
│    Reason: {technical_reason}                       │
│    Alternative: {suggested_alternative}             │
│                                                     │
│ ❌ {feature_2}                                      │
│    Reason: {technical_reason}                       │
│    Alternative: None available                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ DOWNGRADE OPTIONS                                   │
├─────────────────────────────────────────────────────┤
│ Option A: Remove {feature_1}, keep {feature_2} alternative
│ ├─ Impact on value prop: {assessment}              │
│ └─ Recommendation: Retest with users               │
│                                                     │
│ Option B: Remove both, simplify to MVP              │
│ ├─ Impact on value prop: Significant               │
│ └─ Recommendation: Major messaging update needed    │
└─────────────────────────────────────────────────────┘
```

**Decision Options:**

| Option | Label | Description | Outcome |
|--------|-------|-------------|---------|
| `downgrade_a` | "Downgrade Option A" | Remove {feature} | → Mark removed, return to Desirability |
| `downgrade_b` | "Downgrade Option B" | Simplify further | → Mark removed, return to Desirability |
| `explore` | "Explore Technical Alternatives" | Research more | → Technical deep dive |
| `kill` | "Kill Project" | Core value requires feature | → Close project |

---

## Common UI Behaviors

### Timeout Handling (Ambiguity A5)

| Elapsed Time | Action |
|--------------|--------|
| 15 minutes | In-app notification badge |
| 24 hours | Email reminder |
| 72 hours | Email escalation + SMS (if enabled) |
| 7 days | Warning banner in UI |
| 30 days | Auto-archive project with "approval_timeout" reason |

The `expires_at` field in `ApprovalRequest` tracks the deadline. Projects can be restored from archive within 90 days.

### Rejection Flow (Ambiguity A3)

When user clicks **Reject**:

1. Feedback textarea becomes required
2. User must explain why they're rejecting
3. Based on checkpoint type:
   - `approve_founders_brief` → Return to interview for clarification
   - `campaign_launch` → Halt campaign, return to creative review
   - `gate_progression` → Choose alternative path or kill
   - `segment_pivot` / `value_pivot` → Choose different direction or kill
4. AI receives feedback and adjusts its approach
5. New HITL checkpoint may be triggered with revised content

### Approval Authority (Ambiguity A4)

**Guardian veto power**: Guardian can flag but NOT veto Founder decisions.

| Scenario | Guardian Role | Founder Role |
|----------|---------------|--------------|
| Guardian flags quality issue | Warning displayed | Can override with acknowledgment |
| Guardian flags compliance issue | Warning displayed | Can override with acknowledgment |
| Guardian flags critical risk | Block recommended | Can override but decision logged |

Founder is ultimately accountable for their business decisions. Guardian provides guardrails, not gatekeeping.

### Inline Editing (Ambiguity A2)

| Checkpoint Type | Inline Edit? | Rationale |
|-----------------|--------------|-----------|
| `approve_founders_brief` | NO | Revisions via interview |
| `approve_experiment_plan` | YES (budget only) | Quick adjustments |
| `campaign_launch` | NO | Edit creatives separately |
| `spend_increase` | YES (amount field) | Quick adjustments |
| `gate_progression` | NO | Decision only |
| Pivot checkpoints | NO | Select from options |
| `feature_downgrade` | NO | Select from options |

---

## Related Documentation

- [approval-workflows.md](../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) - Backend HITL patterns
- [crewai.ts](../../../frontend/src/types/crewai.ts) - TypeScript types
- [ApprovalDetailModal.tsx](../../../frontend/src/components/approvals/ApprovalDetailModal.tsx) - UI component
- [EvidenceSummary.tsx](../../../frontend/src/components/approvals/EvidenceSummary.tsx) - Evidence display

---

**Last Updated**: 2026-01-19
**Status**: Active specification for TDD test derivation
