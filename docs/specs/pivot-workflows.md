---
purpose: "User-facing pivot decision workflows with UI specifications"
status: "active"
last_reviewed: "2026-01-19"
derived_from: "phase-transitions.md, hitl-approval-ui.md"
---

# Pivot Workflow Specifications

This document specifies the user-facing experience for all pivot decisions in the StartupAI validation flow. Pivots occur when evidence signals indicate the current direction needs adjustment.

## Overview

### What is a Pivot?

A pivot is a strategic direction change triggered by validation evidence. Unlike rejection (which terminates), pivots redirect the validation to explore alternative hypotheses.

### Pivot Types

| Type | Trigger Phase | Signal | Purpose |
|------|---------------|--------|---------|
| Segment Pivot | Phase 2 (Desirability) | Low problem resonance (<30%) | Target different customer segment |
| Value Pivot | Phase 2 (Desirability) | High zombie ratio (>=70%) | Adjust value proposition messaging |
| Feature Downgrade | Phase 3 (Feasibility) | ORANGE signal | Reduce scope to achievable MVP |
| Strategic Pivot | Phase 4 (Viability) | MARGINAL economics | Adjust pricing or cost structure |

---

## Segment Pivot Flow (US-P01)

### Trigger Condition

```
problem_resonance < 0.30 at Desirability gate
```

**Meaning**: Less than 30% of the target audience resonates with the stated problem. The problem may be real, but this isn't the right audience.

### User Experience

#### 1. Pivot Notification

When segment pivot is triggered, user sees:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Segment Pivot Recommended                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your current target segment isn't responding to the problem    │
│  statement. Only 23% showed problem resonance.                  │
│                                                                 │
│  The AI has identified 3 alternative segments that may be       │
│  better fits based on your value proposition.                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Current Segment: "Early-stage founders, 25-35, US"     │   │
│  │  Problem Resonance: 23%                                  │   │
│  │  Sample Size: 500 impressions                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ View Alternatives ]                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Alternative Segments Display

```
┌─────────────────────────────────────────────────────────────────┐
│  Alternative Customer Segments                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ○ Segment A: Scale-up founders (Series A+)                     │
│    Rationale: Higher pain intensity, budget for solutions       │
│    Estimated resonance: 45-55%                                  │
│    Trade-off: Smaller addressable market                        │
│                                                                 │
│  ○ Segment B: Corporate innovation teams                        │
│    Rationale: Systematic validation needs, enterprise budget    │
│    Estimated resonance: 50-60%                                  │
│    Trade-off: Longer sales cycle                                │
│                                                                 │
│  ○ Segment C: Startup accelerator programs                      │
│    Rationale: Batch validation needs, recurring revenue         │
│    Estimated resonance: 60-70%                                  │
│    Trade-off: B2B2C complexity                                  │
│                                                                 │
│  ○ Custom Segment                                               │
│    Define your own alternative segment                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. Decision Options

| Option | Action | Next State |
|--------|--------|------------|
| Select Segment A/B/C | Restart Phase 1 with new segment | Phase 1 (auto-start) |
| Custom Segment | Define new segment, restart Phase 1 | Phase 1 (auto-start) |
| Override & Proceed | Ignore pivot, continue to Phase 3 | Phase 3 (auto-start) |
| Kill Project | Terminate validation | Project Killed |

### UI Components

```typescript
interface SegmentPivotProps {
  currentSegment: {
    description: string;
    problemResonance: number;
    sampleSize: number;
  };
  alternatives: Array<{
    id: string;
    name: string;
    description: string;
    rationale: string;
    estimatedResonance: { min: number; max: number };
    tradeOff: string;
  }>;
  pivotCount: number; // Current pivot iteration
  maxPivots: number;  // Limit (3)
}
```

### Loop Limit

**Maximum**: 3 segment pivots per project

After 3 segment pivots, the UI shows:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Pivot Limit Reached                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You've attempted 3 segment pivots without finding strong       │
│  problem-market fit.                                            │
│                                                                 │
│  Options:                                                       │
│  • Override & Proceed: Continue with current segment            │
│  • Kill Project: End validation and preserve learnings          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Value Pivot Flow (US-P02)

### Trigger Condition

```
zombie_ratio >= 0.70 at Desirability gate
```

**Meaning**: 70%+ of engaged users show superficial interest but no commitment signals. The audience is right, but the value proposition messaging isn't compelling action.

### User Experience

#### 1. Pivot Notification

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Value Pivot Recommended                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  High "zombie" engagement detected - users are interested       │
│  but not converting. 72% showed interest without commitment.    │
│                                                                 │
│  This typically indicates messaging/positioning issues rather   │
│  than product-market fit problems.                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Zombie Ratio: 72%                                       │   │
│  │  Commitment Signals: 8% (target: 25%+)                   │   │
│  │  Top Drop-off Point: Pricing page                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ View Value Prop Alternatives ]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Alternative Value Propositions

```
┌─────────────────────────────────────────────────────────────────┐
│  Alternative Value Propositions                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Current: "AI-powered validation in days, not months"           │
│                                                                 │
│  ○ Value Prop A: Speed-focused                                  │
│    "Get market validation in 48 hours"                          │
│    Emphasis: Time savings                                       │
│    Risk: May attract rushed, low-quality users                  │
│                                                                 │
│  ○ Value Prop B: Confidence-focused                             │
│    "Make your next pivot decision with 95% confidence"          │
│    Emphasis: Risk reduction                                     │
│    Risk: May seem too cautious for action-oriented founders     │
│                                                                 │
│  ○ Iterate Current                                              │
│    Refine current messaging with A/B tests                      │
│    Lower risk, slower learning                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. Decision Options

| Option | Action | Next State |
|--------|--------|------------|
| Adopt Value Prop A/B | Update VPC, restart Phase 2 campaigns | Phase 2 (auto-start) |
| Iterate Current | Run A/B tests on current messaging | Phase 2 (auto-start) |
| Override & Proceed | Accept zombie ratio, move to Phase 3 | Phase 3 (auto-start) |
| Kill Project | Terminate validation | Project Killed |

### Loop Limit

**Maximum**: 2 value pivots per project

---

## Feature Downgrade Flow (US-P03)

### Trigger Condition

```
feasibility_signal == "ORANGE" at Feasibility gate
```

**Meaning**: The full feature set isn't achievable with available resources/timeline, but a reduced scope MVP is feasible.

### User Experience

#### 1. Downgrade Notification

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Feature Downgrade Recommended                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Full feature set requires resources beyond current scope.      │
│  A reduced MVP is feasible and can still validate core value.   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Feasibility Signal: ORANGE (Constrained)                │   │
│  │  Blocker: Real-time collaboration requires 3x timeline   │   │
│  │  Core Value Preserved: 85%                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ View Downgrade Options ]                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Feature Downgrade Options

```
┌─────────────────────────────────────────────────────────────────┐
│  Feature Downgrade Options                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Current Scope: Full platform with real-time collaboration      │
│                                                                 │
│  ○ Downgrade A: Remove real-time collaboration                  │
│    Features removed: Live editing, presence indicators          │
│    Value preserved: 85%                                         │
│    Timeline reduction: 60%                                      │
│    Requires: Re-test desirability with reduced feature set      │
│                                                                 │
│  ○ Downgrade B: Single-user MVP                                 │
│    Features removed: Teams, sharing, collaboration              │
│    Value preserved: 70%                                         │
│    Timeline reduction: 75%                                      │
│    Requires: Re-test desirability with reduced feature set      │
│                                                                 │
│  ○ Explore Alternatives                                         │
│    Research alternative technical approaches                    │
│                                                                 │
│  ○ Proceed with Constraints                                     │
│    Accept longer timeline, continue to Phase 4                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. Decision Options

| Option | Action | Next State |
|--------|--------|------------|
| Downgrade A/B | Update VPC, return to Phase 2 to retest | Phase 2 (HITL) |
| Explore | Research alternatives (extends Phase 3) | Phase 3 (continues) |
| Proceed with Constraints | Accept constraints, move to Phase 4 | Phase 4 (auto-start) |
| Kill Project | Terminate validation | Project Killed |

### Retest Requirement

If downgrade selected, user must approve returning to Phase 2:

```
┌─────────────────────────────────────────────────────────────────┐
│  Confirm Desirability Retest                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Feature downgrade requires retesting desirability with the     │
│  reduced feature set to ensure customers still want the MVP.    │
│                                                                 │
│  This will:                                                     │
│  • Update your Value Proposition Canvas                         │
│  • Run new ad campaigns with updated messaging                  │
│  • Require ~$500 additional ad spend                            │
│                                                                 │
│  [ Confirm Retest ]  [ Cancel ]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Loop Limit

**Maximum**: 1 downgrade-and-retest cycle

After 1 retest, only options are "Proceed with Constraints" or "Kill".

---

## Strategic Pivot Flow (US-P04)

### Trigger Condition

```
1.0 <= ltv_cac_ratio < 3.0 at Viability gate
```

**Meaning**: Unit economics are positive but not strong enough for sustainable growth. Adjustments to pricing or CAC are needed.

### User Experience

#### 1. Pivot Notification

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Strategic Pivot Recommended                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Unit economics are marginally positive but below sustainable   │
│  threshold. LTV:CAC of 1.8x (target: 3.0x+).                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LTV: $1,200                                             │   │
│  │  CAC: $667                                               │   │
│  │  LTV:CAC Ratio: 1.8x                                     │   │
│  │  Payback Period: 8 months (target: 3-6 months)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ View Strategic Options ]                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Strategic Options

```
┌─────────────────────────────────────────────────────────────────┐
│  Strategic Pivot Options                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ○ Price Pivot: Increase pricing                                │
│    Current: $99/mo → Proposed: $149/mo                          │
│    Impact: LTV increases to $1,800 (3.0x ratio)                 │
│    Risk: May reduce conversion rate by 15-25%                   │
│    Action: Retest with new pricing in Phase 2                   │
│                                                                 │
│  ○ Cost Pivot: Reduce CAC                                       │
│    Strategy: Shift from paid to organic acquisition             │
│    Impact: CAC reduces to $400 (3.0x ratio)                     │
│    Risk: Slower growth, 6-12 month ramp                         │
│    Action: Update growth strategy, continue Phase 4             │
│                                                                 │
│  ○ Combined Pivot: Both levers                                  │
│    Moderate price increase + CAC optimization                   │
│    Impact: LTV $1,500, CAC $500 (3.0x ratio)                    │
│    Action: Retest with changes                                  │
│                                                                 │
│  ○ Iterate: Run more viability tests                            │
│    Collect more data before deciding                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. Decision Options

| Option | Action | Next State |
|--------|--------|------------|
| Price Pivot | Update pricing, return to Phase 2 | Phase 2 (HITL) |
| Cost Pivot | Update growth strategy, continue | Phase 4 (continues) |
| Combined | Both changes, return to Phase 2 | Phase 2 (HITL) |
| Iterate | Run additional viability tests | Phase 4 (continues) |
| Override & Proceed | Accept marginal economics | Final Decision |
| Kill Project | Terminate validation | Project Killed |

### Loop Limit

**Maximum**: 2 strategic pivots per project

---

## Common UI Patterns

### Pivot Decision Modal

All pivot decisions use a consistent modal pattern:

```typescript
interface PivotDecisionModalProps {
  pivotType: 'segment' | 'value' | 'feature' | 'strategic';
  trigger: {
    metric: string;
    value: number;
    threshold: number;
    direction: 'above' | 'below';
  };
  alternatives: PivotAlternative[];
  pivotCount: number;
  maxPivots: number;
  onDecision: (decision: PivotDecision) => void;
}

interface PivotAlternative {
  id: string;
  name: string;
  description: string;
  rationale: string;
  impact: string;
  risk: string;
  nextState: string;
}

type PivotDecision =
  | { type: 'select_alternative'; alternativeId: string }
  | { type: 'custom'; customData: Record<string, unknown> }
  | { type: 'override_proceed' }
  | { type: 'iterate' }
  | { type: 'kill' };
```

### Progress Indicator

Shows pivot history and remaining attempts:

```
Segment Pivots: ●●○ (2 of 3 used)
Value Pivots:   ○○ (0 of 2 used)
Feature Retest: ○ (0 of 1 used)
Strategic:      ●○ (1 of 2 used)
```

### Evidence Panel

All pivot decisions include an evidence summary:

```typescript
interface PivotEvidencePanel {
  signals: Array<{
    name: string;
    value: number | string;
    status: 'green' | 'orange' | 'red';
    explanation: string;
  }>;
  sampleSize: number;
  confidence: number;
  collectionPeriod: { start: Date; end: Date };
}
```

---

## API Endpoints

### Get Pivot Options

```
GET /api/hitl/pivot-options?request_id={hitl_request_id}

Response:
{
  "pivot_type": "segment",
  "trigger": { ... },
  "alternatives": [ ... ],
  "pivot_count": 1,
  "max_pivots": 3
}
```

### Submit Pivot Decision

```
POST /api/hitl/pivot-decision

Body:
{
  "request_id": "...",
  "decision": {
    "type": "select_alternative",
    "alternative_id": "segment_a"
  },
  "comment": "Scale-up founders seem more aligned..."
}

Response:
{
  "success": true,
  "next_phase": 1,
  "auto_start": true
}
```

---

## State Machine Integration

Pivot flows integrate with the phase transition state machine:

```
[Phase 2] ─(low resonance)─► [HITL: Segment Pivot]
                                    │
                                    ├─► [Phase 1] (restart with new segment)
                                    ├─► [Phase 3] (override proceed)
                                    └─► [Killed]

[Phase 2] ─(high zombies)─► [HITL: Value Pivot]
                                   │
                                   ├─► [Phase 2] (restart with new value prop)
                                   ├─► [Phase 3] (override proceed)
                                   └─► [Killed]

[Phase 3] ─(orange signal)─► [HITL: Feature Downgrade]
                                    │
                                    ├─► [Phase 2] (retest with reduced scope)
                                    ├─► [Phase 4] (proceed with constraints)
                                    └─► [Killed]

[Phase 4] ─(marginal economics)─► [HITL: Strategic Pivot]
                                         │
                                         ├─► [Phase 2] (retest with new pricing)
                                         ├─► [Phase 4] (continue with cost pivot)
                                         ├─► [Final Decision] (override)
                                         └─► [Killed]
```

---

## Related Documentation

- [phase-transitions.md](./phase-transitions.md) - Phase state machine
- [hitl-approval-ui.md](./hitl-approval-ui.md) - HITL checkpoint UI specs
- [stories/README.md](../user-experience/stories/README.md) - US-P01 through US-P04

---

**Last Updated**: 2026-01-19
**Status**: Active specification
