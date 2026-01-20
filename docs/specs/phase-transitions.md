---
purpose: "Phase Transitions State Machine - defines when phases auto-start vs require HITL"
status: "active"
last_reviewed: "2026-01-19"
derived_from: "startupai-crew/src/modal_app/"
architectural_pivot: "2026-01-19"
---

# Phase Transitions State Machine

> **Architectural Pivot (2026-01-19)**: Phase 0 simplified to Quick Start. No HITL in Phase 0. First HITL is now `approve_discovery_output` in Phase 1. See [ADR-006](../../../startupai-crew/docs/adr/006-quick-start-architecture.md).

This document resolves Category B ambiguities by specifying exactly when phases auto-start and when they pause for HITL approval.

## Architecture Overview

StartupAI uses a **checkpoint-and-resume** pattern on Modal serverless:

1. Phase executes crews in sequence
2. At HITL checkpoint, container terminates ($0 cost during human review)
3. User decision triggers `/hitl/approve` endpoint
4. New container spawns and resumes from checkpoint

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PHASE STATE MACHINE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│   [QUICK START] ───► [Phase 1: VPC Discovery] ───(HITL)───► [Phase 2]           │
│        │                       │                                                  │
│        │ (no HITL)             │ approve_discovery_output                        │
│        │ immediate             │ ↓approve → Phase 2                              │
│        │                       │ ↓request_changes → Edit & regenerate            │
│        ▼                       │ ↓reject → Close project                         │
│   Phase 1 auto-starts          ▼                                                  │
│                                                                                   │
│   [Phase 2: Desirability] ◄────────────────────────────────────────────────────  │
│             │                                                                     │
│             │ gate_progression (Desirability gate)                               │
│             │ ↓strong_commitment → Phase 3                                       │
│             │ ↓weak_interest → Value pivot flow                                  │
│             │ ↓no_interest → Segment pivot flow                                  │
│             ▼                                                                     │
│   [Phase 3: Feasibility] ◄─────────────────────────────────────────────────────┐│
│             │                                                   (downgrade)     ││
│             │ gate_progression (Feasibility gate)                               ││
│             │ ↓green → Phase 4                                                  ││
│             │ ↓orange_constrained → Feature downgrade flow ─────────────────────┘│
│             │ ↓red_impossible → Kill project                                     │
│             ▼                                                                     │
│   [Phase 4: Viability]                                                           │
│             │                                                                     │
│             │ gate_progression (Viability gate)                                  │
│             │ ↓profitable → Final decision                                       │
│             │ ↓marginal → Price/cost pivot flow                                  │
│             │ ↓underwater → Kill recommendation                                  │
│             ▼                                                                     │
│   [final_decision] ───► [VALIDATED] or [KILLED] or [ARCHIVED]                    │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase Definitions

### Phase 0: Quick Start (No AI)

> **Architectural Pivot (2026-01-19)**: Phase 0 was simplified from 7-stage AI conversation to Quick Start form submission. No crews, no agents, no HITL checkpoint.

**Purpose**: Capture business idea and trigger Phase 1

**Entry**: POST `/api/projects/quick-start` with `raw_idea`

**Crews**: None (no AI in Phase 0)

**Auto-Start**: N/A - user submits form

**HITL Checkpoint**: None

**Exit Transitions**:

| Trigger | Next State | Auto-Start Next? |
|---------|------------|------------------|
| Form submitted | Phase 1 | YES (immediate) |

**Duration**: ~30 seconds

**AI Cost**: $0

---

### Phase 1: VPC Discovery + Brief Generation

**Purpose**: Research market, generate Founder's Brief, build Customer Profile + Value Map

**Entry**: Immediately after Quick Start form submission

**Crews**: 6 crews (BriefGenerationCrew, DiscoveryCrew, CustomerProfileCrew, ValueDesignCrew, WTPCrew, FitAssessmentCrew)

**Auto-Start**: YES - triggered by Quick Start submission

**HITL Checkpoints**:

| Checkpoint | Trigger | Blocking |
|------------|---------|----------|
| `approve_discovery_output` | After Brief + VPC generation | YES |
| `approve_experiment_plan` | After E1 designs test cards | YES |
| `approve_pricing_test` | Before WTP experiments | YES |

> **Note**: `approve_discovery_output` replaces the old `approve_founders_brief` (Phase 0) + `approve_vpc_completion` (Phase 1). User reviews Brief and VPC together.

**Exit Transitions (from `approve_discovery_output`)**:

| Decision | Next State | Auto-Start Next? |
|----------|------------|------------------|
| `approve` | Phase 2 | YES |
| `request_changes` | User edits, system regenerates | NO |
| `reject` | Project closed | N/A |

---

### Phase 2: Desirability

**Purpose**: Test market demand with ads and landing pages

**Entry**: After VPC completion approval

**Crews**: BuildCrew, GrowthCrew, GovernanceCrew

**Auto-Start**: YES - immediately after Phase 1 completion

**HITL Checkpoints**:

| Checkpoint | Trigger | Blocking |
|------------|---------|----------|
| `campaign_launch` | Before launching ads | YES |
| `spend_increase` | When budget threshold reached | YES |
| `gate_progression` (D gate) | When desirability evidence collected | YES |

**Signal Routing at Desirability Gate**:

```python
def desirability_gate(evidence):
    if evidence.commitment_type == "skin_in_game":
        return "Phase 3"  # Strong commitment → auto-proceed
    elif evidence.problem_resonance >= 0.5 and evidence.zombie_ratio < 0.7:
        return "Phase 3"  # Acceptable metrics → proceed
    elif evidence.problem_resonance >= 0.3 and evidence.zombie_ratio >= 0.7:
        return "value_pivot"  # Zombies detected → HITL
    elif evidence.problem_resonance < 0.3:
        return "segment_pivot"  # Wrong audience → HITL
    else:
        return "kill"  # No interest → recommend kill
```

**Exit Transitions (from `gate_progression`)**:

| Decision | Signal | Next State | Auto-Start Next? |
|----------|--------|------------|------------------|
| `proceed` | strong_commitment | Phase 3 | YES |
| `proceed` | weak_interest (override) | Phase 3 | YES |
| `value_pivot` | zombie detected | Value pivot flow | NO (HITL) |
| `segment_pivot` | no_interest | Segment pivot flow → Phase 1 | NO (HITL) |
| `kill` | - | Project killed | N/A |

---

### Phase 3: Feasibility

**Purpose**: Assess technical buildability and cost

**Entry**: After Desirability gate passed

**Crews**: BuildCrew (technical assessment), GovernanceCrew

**Auto-Start**: YES - immediately after Phase 2 completion

**HITL Checkpoints**:

| Checkpoint | Trigger | Blocking |
|------------|---------|----------|
| `gate_progression` (F gate) | After feasibility assessment | YES |

**Signal Routing at Feasibility Gate**:

```python
def feasibility_gate(evidence):
    if evidence.signal == "green":
        return "Phase 4"  # Fully feasible
    elif evidence.signal == "orange_constrained":
        return "feature_downgrade"  # Scope reduction needed → HITL
    elif evidence.signal == "red_impossible":
        return "kill"  # Cannot build
```

**Exit Transitions**:

| Decision | Signal | Next State | Auto-Start Next? |
|----------|--------|------------|------------------|
| `proceed` | green | Phase 4 | YES |
| `proceed_downgrade` | orange | Phase 4 (with reduced scope) | YES |
| `downgrade_and_retest` | orange | Feature downgrade flow → Phase 2 | NO (HITL) |
| `kill` | red | Project killed | N/A |

---

### Phase 4: Viability

**Purpose**: Analyze unit economics and market sizing

**Entry**: After Feasibility gate passed

**Crews**: FinanceCrew, SynthesisCrew, GovernanceCrew

**Auto-Start**: YES - immediately after Phase 3 completion

**HITL Checkpoints**:

| Checkpoint | Trigger | Blocking |
|------------|---------|----------|
| `gate_progression` (V gate) | After viability analysis | YES |
| `final_decision` | After all phases complete | YES |

**Signal Routing at Viability Gate**:

```python
def viability_gate(evidence):
    if evidence.ltv_cac_ratio >= 3.0:
        return "validated"  # Profitable
    elif evidence.ltv_cac_ratio >= 1.0:
        return "strategic_pivot"  # Marginal → HITL for price/cost pivot
    else:
        return "kill"  # Underwater
```

**Exit Transitions**:

| Decision | Signal | Next State | Auto-Start Next? |
|----------|--------|------------|------------------|
| `proceed` | profitable | Final decision | YES |
| `price_pivot` | marginal | Pricing adjustment flow | NO (HITL) |
| `cost_pivot` | marginal | CAC optimization flow | NO (HITL) |
| `strategic_pivot` | marginal | Major pivot flow | NO (HITL) |
| `kill` | underwater | Kill recommendation | YES (with HITL) |

---

## Pivot Flow State Machines

### Segment Pivot Flow

**Trigger**: Low problem resonance (<30%) at Desirability gate

```
[Desirability Gate] ─(no_interest)─► [approve_segment_pivot]
                                            │
                                            ├─► segment_1: Restart Phase 1 with alternative 1
                                            ├─► segment_2: Restart Phase 1 with alternative 2
                                            ├─► segment_3: Restart Phase 1 with alternative 3
                                            ├─► custom_segment: User-defined segment
                                            ├─► override_proceed: Ignore pivot, force Phase 3
                                            └─► kill: End project
```

**Loop Limit**: 3 segment pivots per project (B4 ambiguity resolution)

After 3 pivots, only options are `override_proceed` or `kill`.

---

### Value Pivot Flow

**Trigger**: High zombie ratio (≥70%) at Desirability gate

```
[Desirability Gate] ─(zombies)─► [approve_value_pivot]
                                        │
                                        ├─► pivot_a: Adopt alternative value prop A
                                        ├─► pivot_b: Adopt alternative value prop B
                                        ├─► iterate: Refine current messaging
                                        ├─► override_proceed: Ignore, force Phase 3
                                        └─► kill: End project
```

**Loop Limit**: 2 value pivots per project

After 2 pivots, only options are `iterate`, `override_proceed`, or `kill`.

---

### Feature Downgrade Flow

**Trigger**: ORANGE signal at Feasibility gate

```
[Feasibility Gate] ─(constrained)─► [approve_feature_downgrade]
                                           │
                                           ├─► downgrade_a: Remove feature set A
                                           ├─► downgrade_b: Remove feature set B
                                           ├─► explore: Research alternatives
                                           ├─► proceed_full: Accept constraints
                                           └─► kill: End project
```

If `downgrade_a` or `downgrade_b`: Returns to Phase 2 to retest desirability with reduced scope.

**Loop Limit**: 1 downgrade-and-retest cycle

---

### Strategic Pivot Flow

**Trigger**: MARGINAL viability signal at Viability gate

```
[Viability Gate] ─(marginal)─► [approve_strategic_pivot]
                                      │
                                      ├─► price_pivot: Increase pricing
                                      ├─► cost_pivot: Reduce CAC
                                      ├─► both: Adjust both levers
                                      ├─► iterate: Run more viability tests
                                      └─► kill: End project
```

**Loop Limit**: 2 strategic pivots

---

## Auto-Start vs HITL Summary

### Auto-Start (No Human Pause)

| Transition | Condition |
|------------|-----------|
| Quick Start → Phase 1 | Form submitted (immediate) |
| Phase 1 → Phase 2 | `approve` decision on discovery output |
| Phase 2 → Phase 3 | `proceed` decision (strong commitment) |
| Phase 3 → Phase 4 | `proceed` decision (green signal) |
| Phase 4 → Complete | `validate` decision (profitable) |

### Requires HITL (Human Pause)

| Checkpoint | Why |
|------------|-----|
| `approve_discovery_output` | Review AI-generated Brief + VPC before experiments |
| `approve_experiment_plan` | Budget approval before spending |
| `approve_pricing_test` | Founder consent for pricing tests |
| `campaign_launch` | Brand protection before going public |
| `spend_increase` | Budget accountability |
| All gate progressions | Phase advancement requires confirmation |
| All pivot flows | Strategic direction requires human judgment |

> **Note**: `approve_founders_brief` and `approve_vpc_completion` were merged into `approve_discovery_output` in the Quick Start pivot.

---

## Artifact Handoff Between Phases (B3 Ambiguity Resolution)

### Quick Start → Phase 1

| Field | From | To | Required |
|-------|------|-----|----------|
| `raw_idea` | Quick Start form | BriefGenerationCrew | YES |
| `additional_context` | Quick Start form (optional) | BriefGenerationCrew | NO |

> **Note**: Phase 1 now generates the Founder's Brief internally via BriefGenerationCrew (GV1, S1). The brief is no longer collected from user input.

### Phase 1 Internal (BriefGenerationCrew → Other Crews)

| Field | From | To | Required |
|-------|------|-----|----------|
| `founders_brief.the_idea` | BriefGenerationCrew | DiscoveryCrew context | YES |
| `founders_brief.problem_hypothesis` | BriefGenerationCrew | CustomerProfileCrew | YES |
| `founders_brief.customer_hypothesis` | BriefGenerationCrew | CustomerProfileCrew | YES |
| `founders_brief.solution_hypothesis` | BriefGenerationCrew | ValueDesignCrew | YES |
| `founders_brief.key_assumptions` | BriefGenerationCrew | DiscoveryCrew | YES |
| `founders_brief.success_criteria` | BriefGenerationCrew | FitAssessmentCrew | YES |

### Phase 1 → Phase 2

| Field | From | To | Required |
|-------|------|-----|----------|
| `customer_profile` | CustomerProfileCrew | GrowthCrew (targeting) | YES |
| `value_map` | ValueDesignCrew | BuildCrew (features) | YES |
| `fit_assessment` | FitAssessmentCrew | GovernanceCrew | YES |
| `experiments[].learnings` | WTPCrew | GrowthCrew (pricing) | NO |

### Phase 2 → Phase 3

| Field | From | To | Required |
|-------|------|-----|----------|
| `desirability_evidence` | GrowthCrew | FinanceCrew (CAC) | YES |
| `value_map.products_services` | (passthrough) | BuildCrew | YES |
| `creative_assets` | BuildCrew | (archive) | NO |

### Phase 3 → Phase 4

| Field | From | To | Required |
|-------|------|-----|----------|
| `feasibility_evidence` | BuildCrew | FinanceCrew (costs) | YES |
| `desirability_evidence` | (passthrough) | FinanceCrew (LTV) | YES |
| `feature_toggles` | BuildCrew | FinanceCrew (pricing) | NO |

### Phase 4 → Final Decision

| Field | From | To | Required |
|-------|------|-----|----------|
| `viability_evidence` | FinanceCrew | SynthesisCrew | YES |
| `desirability_signal` | (passthrough) | SynthesisCrew | YES |
| `feasibility_signal` | (passthrough) | SynthesisCrew | YES |
| `viability_signal` | FinanceCrew | SynthesisCrew | YES |

---

## Loop Limits (B4 Ambiguity Resolution)

To prevent infinite loops, the following limits are enforced:

| Loop Type | Limit | After Limit |
|-----------|-------|-------------|
| Segment pivots | 3 | Force kill or override |
| Value pivots | 2 | Force kill or override |
| Feature downgrades | 1 retest | Force kill or proceed |
| Strategic pivots | 2 | Force kill or proceed |
| Total iterations | 10 | Force kill |

**Implementation**: `state.iteration` counter increments on each loop. Router checks limit before offering pivot option.

---

## Status Values

### Run Status

| Status | Meaning |
|--------|---------|
| `pending` | Created, not yet started |
| `running` | Active execution in progress |
| `paused` | Waiting for HITL decision |
| `completed` | All phases finished successfully |
| `failed` | Error during execution |
| `killed` | User chose to terminate |
| `archived` | User archived for later |

### HITL Request Status

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting human decision |
| `approved` | Human approved/proceeded |
| `rejected` | Human rejected/stopped |
| `expired` | Timed out (30 days) |

---

## Supabase Tables for State

| Table | Purpose |
|-------|---------|
| `validation_runs` | Checkpoint state (`phase_state` JSONB) |
| `validation_progress` | Append-only progress log (Realtime) |
| `hitl_requests` | HITL checkpoint queue (Realtime) |

---

## Related Documentation

- [hitl-approval-ui.md](./hitl-approval-ui.md) - UI specifications for each checkpoint
- [approval-workflows.md](../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) - Backend patterns
- [data-flow.md](../../startupai-crew/docs/master-architecture/reference/data-flow.md) - Data flow architecture

---

**Last Updated**: 2026-01-19
**Status**: Active specification for TDD test derivation
