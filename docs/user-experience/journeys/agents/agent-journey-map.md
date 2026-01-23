---
purpose: "AI agent journey map across validation phases"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
---

# Agent Journey Map

This map describes the AI validation system journey from kickoff to final decision.
It is derived from the master architecture and used to drive JDTD for agent flows.

## Phase 0: Kickoff

- **Input:** Quick Start data (raw idea, optional hints, session context)
- **Output:** `validation_runs` record + Phase 0 progress event
- **Handoff:** Phase 1 starts automatically

## Phase 1 Stage A: Founder's Brief

- **Agents:** Brief generation crew
- **Output:** `FoundersBrief` stored in run state
- **Checkpoint:** `approve_brief` HITL request

## Phase 1 Stage B: VPC Discovery

- **Agents:** VPC discovery crew
- **Output:** `CustomerProfile`, `ValueMap`, `FitAssessment`
- **Checkpoint:** `approve_discovery_output` HITL request

## Phase 2: Desirability

- **Agents:** Desirability experimentation crew
- **Output:** `desirability_evidence`, desirability signals
- **Checkpoint:** Desirability gate decision or pivot recommendation

## Phase 3: Feasibility

- **Agents:** Feasibility assessment crew
- **Output:** `feasibility_evidence`, feasibility signals
- **Checkpoint:** Feasibility gate decision or downgrade pivot

## Phase 4: Viability

- **Agents:** Viability synthesis crew
- **Output:** `viability_evidence`, unit economics, final decision
- **Checkpoint:** Viability gate and final decision HITL

## Pivot Routes (Cross-Phase)

- **Segment Pivot:** low problem resonance
- **Value Pivot:** high zombie ratio
- **Feature Pivot:** technical impossibility
- **Strategic Pivot:** underwater unit economics

## Persistence Surfaces

- `validation_runs` (phase_state, current_phase, status)
- `validation_progress` (progress timeline)
- `hitl_requests` (checkpoint queue)

