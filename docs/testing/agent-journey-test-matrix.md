---
purpose: "Agent journey test matrix for AI validation phases"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
---

# Agent Journey Test Matrix

This matrix tracks contract and integration tests for AI agent journeys.
It focuses on artifacts, signals, and persistence invariants rather than UI behavior.

## Test Types

- **Contract**: Schema conformance and required fields (Pydantic outputs, API payloads)
- **Integration**: Modal flow + Supabase persistence + HITL checkpoint routing
- **Routing**: Pivot or gate decisions based on signal thresholds

## Phase 1 Stage A: Brief Generation

| Story ID | Crew/Agent | Artifacts | Persistence Invariants | E2E Test File | Status |
|----------|------------|-----------|------------------------|---------------|--------|
| US-AB01 | BriefGenerationCrew | `FoundersBrief` | `validation_runs.phase_state.founders_brief` populated | `30-agent-brief-generation.spec.ts` | Gap |
| US-AB02 | GV1 Agent | `LegitimacyReport` | Internal crew state | `30-agent-brief-generation.spec.ts` | Gap |
| US-AB03 | HITL | Brief edits | `hitl_requests` for `approve_brief` | `30-agent-brief-generation.spec.ts` | Gap |

## Phase 1 Stage B: VPC Discovery

| Story ID | Crew/Agent | Artifacts | Persistence Invariants | E2E Test File | Status |
|----------|------------|-----------|------------------------|---------------|--------|
| US-AD01 | E1 Agent | `ExperimentPlan`, `TestCard[]` | `hitl_requests` for `approve_experiment_plan` | `31-agent-vpc-discovery.spec.ts` | Gap |
| US-AD02 | D1 Agent | `SAYEvidence` | Internal crew state | `31-agent-vpc-discovery.spec.ts` | Gap |
| US-AD03 | D2 Agent | `DOIndirectEvidence` | Internal crew state | `31-agent-vpc-discovery.spec.ts` | Gap |
| US-AD04 | D3 Agent | `DODirectEvidence` | Internal crew state | `31-agent-vpc-discovery.spec.ts` | Gap |
| US-AD05 | D4 Agent | `EvidenceSynthesis` | Internal crew state | `31-agent-vpc-discovery.spec.ts` | Gap |
| US-AD06 | CustomerProfileCrew | `CustomerProfile` | `validation_runs.phase_state.customer_profile` | `31-agent-vpc-discovery.spec.ts` | Gap |
| US-AD07 | ValueDesignCrew | `ValueMap` | `validation_runs.phase_state.value_map` | `31-agent-vpc-discovery.spec.ts` | Gap |
| US-AD08 | WTPCrew | `WTPEvidence` | `hitl_requests` for `approve_pricing_test` | `31-agent-vpc-discovery.spec.ts` | Gap |
| US-AD09 | FIT_SCORE Agent | `FitAssessment` | `validation_runs.phase_state.fit_assessment` | `31-agent-vpc-discovery.spec.ts` | Gap |
| US-AD10 | FIT_ROUTE Agent | `IterationRouting` | `hitl_requests` for `approve_discovery_output` | `31-agent-vpc-discovery.spec.ts` | Gap |

## Phase 2: Desirability

| Story ID | Crew/Agent | Artifacts | Persistence Invariants | E2E Test File | Status |
|----------|------------|-----------|------------------------|---------------|--------|
| US-ADB01 | BuildCrew | `LandingPageBuild` | `validation_runs.phase_state.landing_page_url` | `32-agent-desirability.spec.ts` | Gap |
| US-ADB02 | F3 Agent | `DeploymentResult` | Site deployed to Netlify | `32-agent-desirability.spec.ts` | Gap |
| US-ADB03 | GrowthCrew | `AdCreatives` | `hitl_requests` for `approve_campaign_launch` | `32-agent-desirability.spec.ts` | Gap |
| US-ADB04 | P3 Agent | `DesirabilitySignal` | `validation_runs.phase_state.desirability_evidence` | `32-agent-desirability.spec.ts` | Gap |
| US-ADB05 | GovernanceCrew | `QAReport`, gate decision | `hitl_requests` for `approve_desirability_gate` | `32-agent-desirability.spec.ts` | Gap |

## Phase 3: Feasibility

| Story ID | Crew/Agent | Artifacts | Persistence Invariants | E2E Test File | Status |
|----------|------------|-----------|------------------------|---------------|--------|
| US-AFB01 | F1 Agent | `FeatureRequirements` | Internal crew state | `33-agent-feasibility.spec.ts` | Gap |
| US-AFB02 | BuildCrew | `FeasibilitySignal` | `validation_runs.phase_state.feasibility_evidence` | `33-agent-feasibility.spec.ts` | Gap |
| US-AFB03 | GovernanceCrew | `QAReport`, gate decision | `hitl_requests` for `approve_feasibility_gate` | `33-agent-feasibility.spec.ts` | Gap |

## Phase 4: Viability

| Story ID | Crew/Agent | Artifacts | Persistence Invariants | E2E Test File | Status |
|----------|------------|-----------|------------------------|---------------|--------|
| US-AVB01 | L1 Agent | `UnitEconomics` | `validation_runs.phase_state.viability_evidence` | `34-agent-viability.spec.ts` | Gap |
| US-AVB02 | L2 Agent | `ComplianceReport` | Internal crew state | `34-agent-viability.spec.ts` | Gap |
| US-AVB03 | L3 Agent | `ViabilitySignal` | `hitl_requests` for `approve_viability_gate` | `34-agent-viability.spec.ts` | Gap |
| US-AVB04 | C1 Agent | `EvidenceSynthesis` | Internal crew state | `34-agent-viability.spec.ts` | Gap |
| US-AVB05 | C2 Agent | `HumanDecisionRequest` | `hitl_requests` for `request_human_decision` | `34-agent-viability.spec.ts` | Gap |

## HITL Checkpoints

| Story ID | Checkpoint | Phase | Trigger | E2E Test File | Status |
|----------|------------|-------|---------|---------------|--------|
| US-AH01 | approve_brief | 1A | Brief generated | `35-agent-hitl-checkpoints.spec.ts` | Gap |
| US-AH02 | approve_experiment_plan | 1B | Test cards ready | `35-agent-hitl-checkpoints.spec.ts` | Gap |
| US-AH03 | approve_pricing_test | 1B | WTP experiment planned | `35-agent-hitl-checkpoints.spec.ts` | Gap |
| US-AH04 | approve_discovery_output | 1B | VPC complete, fit >= 70 | `35-agent-hitl-checkpoints.spec.ts` | Gap |
| US-AH05 | approve_campaign_launch | 2 | Ads ready | `35-agent-hitl-checkpoints.spec.ts` | Gap |
| US-AH06 | approve_spend_increase | 2 | Budget threshold | `35-agent-hitl-checkpoints.spec.ts` | Gap |
| US-AH07 | approve_desirability_gate | 2 | D signal ready | `35-agent-hitl-checkpoints.spec.ts` | Gap |
| US-AH08 | approve_feasibility_gate | 3 | F signal ready | `35-agent-hitl-checkpoints.spec.ts` | Gap |
| US-AH09 | approve_viability_gate | 4 | V signal ready | `35-agent-hitl-checkpoints.spec.ts` | Gap |
| US-AH10 | request_human_decision | 4 | Final synthesis ready | `35-agent-hitl-checkpoints.spec.ts` | Gap |

## Summary

| Phase | Stories | Crew Tests | HITL Tests | Status |
|-------|---------|------------|------------|--------|
| Phase 1A (Brief) | US-AB01-03 | 3 | 1 | Gap |
| Phase 1B (VPC) | US-AD01-10 | 10 | 3 | Gap |
| Phase 2 (Desirability) | US-ADB01-05 | 5 | 3 | Gap |
| Phase 3 (Feasibility) | US-AFB01-03 | 3 | 1 | Gap |
| Phase 4 (Viability) | US-AVB01-05 | 5 | 2 | Gap |
| HITL | US-AH01-10 | - | 10 | Gap |
| **Total** | **36** | **26** | **10** | Gap |

## References

- `docs/user-experience/stories/agents/` - Story definitions with acceptance criteria
- `startupai-crew/docs/master-architecture/reference/state-schemas.md` - Pydantic schemas
- `startupai-crew/docs/master-architecture/reference/approval-workflows.md` - HITL patterns
