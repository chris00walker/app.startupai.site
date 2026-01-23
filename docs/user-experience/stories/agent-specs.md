---
purpose: "Agent specification stories for JDTD and traceability"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
---

# Agent Specification Stories (US-AG)

These stories define JDTD coverage for AI agent specifications and task contracts.
They focus on structured outputs, persistence invariants, and HITL checkpoints.

### US-AG01: Specify Brief Generation Agents and Tasks

**As the** validation system owner,
**I want to** define the brief generation agents and tasks with clear contracts,
**So that** Phase 1 Stage A reliably produces a structured Founders Brief.

**Acceptance Criteria:**

**Given** the brief generation crew loads agent configs
**When** the crew is initialized
**Then** each agent includes `role`, `goal`, and `backstory` with explicit delegation settings

**Given** `compile_founders_brief` completes
**When** the brief is assembled
**Then** output conforms to `FoundersBrief` and is stored in `validation_runs.phase_state.founders_brief`

**Given** the brief is generated
**When** Stage A completes
**Then** a `hitl_requests` entry exists for `approve_brief` and `validation_progress` records the stage

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/reference/agent-specifications.md`

---

### US-AG02: Specify Discovery Evidence Agents and Tasks

**As the** discovery system owner,
**I want to** define evidence-collection agents and tasks with explicit outputs,
**So that** discovery evidence can be trusted and reused by downstream crews.

**Acceptance Criteria:**

**Given** Phase 1 Stage A is approved
**When** DiscoveryCrew tasks execute
**Then** each task includes a clear `expected_output` and uses the defined context chain

**Given** `triangulate_evidence` completes
**When** evidence is synthesized
**Then** the result includes SAY vs DO alignment plus a confidence score for downstream use

**Given** an experiment plan is assembled
**When** execution would start
**Then** a `hitl_requests` entry exists for `approve_experiment_plan`

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/05-phase-1-vpc-discovery.md`

---

### US-AG03: Specify Customer Profile Agents and Tasks

**As the** VPC discovery owner,
**I want to** define Customer Profile agents and tasks with schema-aligned outputs,
**So that** the right-side VPC artifact is structured and persisted.

**Acceptance Criteria:**

**Given** the CustomerProfile crew loads agent configs
**When** the crew is initialized
**Then** each agent includes `role`, `goal`, and `backstory` with explicit delegation settings

**Given** `compile_customer_profile` completes
**When** the Customer Profile is assembled
**Then** output conforms to `CustomerProfile` and is stored in `validation_runs.phase_state.customer_profile`

**Given** the profile is persisted
**When** Phase 1 Stage B continues
**Then** `validation_progress` records the Customer Profile milestone

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/reference/state-schemas.md`

---

### US-AG04: Specify Value Map Agents and Tasks

**As the** VPC discovery owner,
**I want to** define Value Map agents and tasks with schema-aligned outputs,
**So that** the left-side VPC artifact stays consistent with the Customer Profile.

**Acceptance Criteria:**

**Given** Customer Profile data is available
**When** `compile_value_map` completes
**Then** output conforms to `ValueMap` and is stored in `validation_runs.phase_state.value_map`

**Given** the Value Map is compiled
**When** pain relievers and gain creators are referenced
**Then** each mapping uses valid IDs from the Customer Profile

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/reference/output-schemas.md`

---

### US-AG05: Specify WTP Agents and Tasks

**As the** pricing validation owner,
**I want to** define WTP agents and tasks with explicit outputs,
**So that** willingness-to-pay evidence is usable in fit scoring.

**Acceptance Criteria:**

**Given** `synthesize_wtp_evidence` completes
**When** WTP results are finalized
**Then** output includes a validation verdict and price range for fit scoring

**Given** a WTP experiment includes real payment
**When** execution is proposed
**Then** a `hitl_requests` entry exists for `approve_pricing_test`

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/reference/approval-workflows.md`

---

### US-AG06: Specify Fit Assessment Agents and Routing

**As the** Phase 1 gate owner,
**I want to** define fit assessment agents and routing rules with explicit outputs,
**So that** the discovery gate decision is consistent and auditable.

**Acceptance Criteria:**

**Given** Customer Profile, Value Map, and WTP results are available
**When** `calculate_fit_score` completes
**Then** output includes fit thresholds and a numeric `fit_score`

**Given** `compile_fit_assessment` completes
**When** the assessment is stored
**Then** output conforms to `FitAssessment` and is stored in `validation_runs.phase_state.fit_assessment`

**Given** the routing decision is `VPC_COMPLETE`
**When** the gate is reached
**Then** a `hitl_requests` entry exists for `approve_discovery_output`

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/05-phase-1-vpc-discovery.md`

