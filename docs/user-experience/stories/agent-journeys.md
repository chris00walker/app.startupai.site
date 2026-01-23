---
purpose: "AI agent journey stories with acceptance criteria and traceability"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
---

# Agent Journey Stories (US-AJ)

These stories describe AI agent/flow journeys derived from the master architecture.
They focus on artifacts, checkpoints, and persistence rather than UI behavior.

### US-AJ01: Kickoff Validation Run

**As the** validation orchestrator,
**I want to** create a new validation run when Quick Start is submitted,
**So that** downstream phases can run with a traceable run ID.

**Acceptance Criteria:**

**Given** Quick Start input is submitted
**When** the kickoff request is accepted
**Then** a `validation_runs` record should be created with `run_id`, `project_id`, `user_id`, and `current_phase=0`

**Given** kickoff is accepted
**When** the run begins
**Then** a `validation_progress` event should be recorded for Phase 0 start

**Given** the request includes session context
**When** the run state is persisted
**Then** `phase_state` should include the entrepreneur input and session identifiers

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/04-phase-0-onboarding.md`

---

### US-AJ02: Generate Founder's Brief (Phase 1 Stage A)

**As the** Phase 1 agents,
**I want to** generate a structured Founder's Brief from the submitted idea,
**So that** the foundation for VPC discovery is clear and reviewable.

**Acceptance Criteria:**

**Given** a validation run is active
**When** Stage A completes
**Then** `FoundersBrief` fields should be stored in the run state

**Given** the brief is generated
**When** the checkpoint is reached
**Then** a `hitl_requests` entry should be created for `approve_brief`

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/reference/approval-workflows.md`

---

### US-AJ03: Produce VPC + Fit Assessment (Phase 1 Stage B)

**As the** Phase 1 discovery agents,
**I want to** produce the Customer Profile, Value Map, and Fit Assessment,
**So that** Problem-Solution Fit can be evaluated and approved.

**Acceptance Criteria:**

**Given** `approve_brief` is approved
**When** discovery completes
**Then** `CustomerProfile`, `ValueMap`, and `FitAssessment` should be stored in the run state

**Given** the discovery output is ready
**When** the checkpoint is reached
**Then** a `hitl_requests` entry should be created for `approve_discovery_output`

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/05-phase-1-vpc-discovery.md`

---

### US-AJ04: Run Desirability Evidence + Gate (Phase 2)

**As the** Phase 2 agents,
**I want to** run desirability experiments and compute signals,
**So that** the Desirability gate can be evaluated.

**Acceptance Criteria:**

**Given** discovery output is approved
**When** Phase 2 completes
**Then** `desirability_evidence` and desirability signals should be stored in the run state

**Given** the gate is evaluated
**When** the decision is required
**Then** a `hitl_requests` entry should be created for the Desirability gate

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/06-phase-2-desirability.md`

---

### US-AJ05: Run Feasibility Assessment + Gate (Phase 3)

**As the** Phase 3 agents,
**I want to** assess feasibility and compute constraints,
**So that** the Feasibility gate can be evaluated.

**Acceptance Criteria:**

**Given** Desirability is approved
**When** Phase 3 completes
**Then** `feasibility_evidence` and feasibility signals should be stored in the run state

**Given** the gate is evaluated
**When** the decision is required
**Then** a `hitl_requests` entry should be created for the Feasibility gate

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/07-phase-3-feasibility.md`

---

### US-AJ06: Run Viability Assessment + Final Decision (Phase 4)

**As the** Phase 4 agents,
**I want to** assess viability and recommend a final decision,
**So that** the validation run can conclude with evidence.

**Acceptance Criteria:**

**Given** Feasibility is approved
**When** Phase 4 completes
**Then** `viability_evidence` and viability signals should be stored in the run state

**Given** the final decision is required
**When** the checkpoint is reached
**Then** a `hitl_requests` entry should be created for the Viability gate or final decision

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/08-phase-4-viability.md`

---

### US-AJ07: Route Pivot Decisions

**As the** validation router,
**I want to** trigger pivots when evidence crosses thresholds,
**So that** humans can decide on major direction changes.

**Acceptance Criteria:**

**Given** desirability signals show low problem resonance
**When** the router evaluates the gate
**Then** `pivot_recommendation` should be set to `SEGMENT_PIVOT` and require HITL

**Given** desirability signals show high zombie ratio
**When** the router evaluates the gate
**Then** `pivot_recommendation` should be set to `VALUE_PIVOT` and require HITL

**Given** feasibility signals indicate impossible features
**When** the router evaluates feasibility
**Then** `pivot_recommendation` should be set to `FEATURE_PIVOT` and require HITL

**Given** viability signals indicate underwater economics
**When** the router evaluates viability
**Then** `pivot_recommendation` should be set to `STRATEGIC_PIVOT` and require HITL

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/reference/approval-workflows.md`

---
