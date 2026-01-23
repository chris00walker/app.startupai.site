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

## Agent Journey Coverage

| Story ID | Phase | Artifacts / Signals | Persistence Invariants | Contract / Integration Tests | Status |
|----------|-------|---------------------|------------------------|------------------------------|--------|
| US-AJ01 | Phase 0 Kickoff | `validation_runs`, Phase 0 progress | `validation_runs` created with `run_id`, `project_id`, `current_phase=0`; `validation_progress` entry | `/kickoff` contract + Supabase insert verification | Gap |
| US-AJ02 | Phase 1 Stage A | `FoundersBrief` | `phase_state.founders_brief` present; `hitl_requests` for `approve_brief` | Phase 1 Stage A contract + HITL insert | Gap |
| US-AJ03 | Phase 1 Stage B | `CustomerProfile`, `ValueMap`, `FitAssessment` | Phase 1 outputs stored; `hitl_requests` for `approve_discovery_output` | Phase 1 Stage B contract + HITL insert | Gap |
| US-AJ04 | Phase 2 | `desirability_evidence`, signals | `desirability_evidence` stored; gate or pivot checkpoint created | Phase 2 contract + gate checkpoint routing | Gap |
| US-AJ05 | Phase 3 | `feasibility_evidence`, signals | `feasibility_evidence` stored; gate or downgrade checkpoint created | Phase 3 contract + gate routing | Gap |
| US-AJ06 | Phase 4 | `viability_evidence`, unit economics | Viability outputs stored; final decision checkpoint created | Phase 4 contract + final decision routing | Gap |
| US-AJ07 | Cross-Phase Router | pivot decisions | `pivot_recommendation` set; `hitl_requests` created for pivots | Router decision tests using synthetic signals | Gap |

## References

- `startupai-crew/docs/master-architecture/04-phase-0-onboarding.md`
- `startupai-crew/docs/master-architecture/05-phase-1-vpc-discovery.md`
- `startupai-crew/docs/master-architecture/06-phase-2-desirability.md`
- `startupai-crew/docs/master-architecture/07-phase-3-feasibility.md`
- `startupai-crew/docs/master-architecture/08-phase-4-viability.md`
- `startupai-crew/docs/master-architecture/reference/approval-workflows.md`
- `startupai-crew/docs/master-architecture/reference/state-schemas.md`
- `startupai-crew/docs/master-architecture/reference/output-schemas.md`
- `startupai-crew/docs/master-architecture/reference/data-flow.md`

