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

---

## Phase 2: Desirability Agent Specifications

### US-AG07: Specify Desirability BuildCrew Agents and Tasks

**As the** desirability system owner,
**I want to** define BuildCrew agents and tasks with clear contracts,
**So that** Phase 2 reliably builds landing pages and deployments.

**Acceptance Criteria:**

**Given** the BuildCrew loads agent configs
**When** the crew is initialized
**Then** F1 (UX/UI), F2 (Frontend), F3 (Backend) include `role`, `goal`, and `backstory`

**Given** `build_landing_page` completes
**When** the page is deployed
**Then** output conforms to `LandingPageBuild` and `DeploymentResult` schemas

**Given** the landing page is deployed
**When** Phase 2 continues to GrowthCrew
**Then** `validation_progress` records the build milestone

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/06-phase-2-desirability.md`

---

### US-AG08: Specify Desirability GrowthCrew Agents and Tasks

**As the** desirability system owner,
**I want to** define GrowthCrew agents and tasks with explicit outputs,
**So that** ad campaigns run with proper HITL approvals.

**Acceptance Criteria:**

**Given** the GrowthCrew loads agent configs
**When** the crew is initialized
**Then** P1 (Ad Creative), P2 (Communications), P3 (Analytics) include `role`, `goal`, and `backstory`

**Given** `generate_ad_creatives` completes
**When** ad variants are ready
**Then** a `hitl_requests` entry exists for `approve_campaign_launch`

**Given** `analyze_desirability_signal` completes
**When** the signal is computed
**Then** output conforms to `DesirabilitySignal` with confidence interval

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/06-phase-2-desirability.md`

---

### US-AG09: Specify Desirability GovernanceCrew Agents and Tasks

**As the** governance system owner,
**I want to** define Phase 2 GovernanceCrew agents with QA and security contracts,
**So that** desirability artifacts pass governance before gate.

**Acceptance Criteria:**

**Given** the GovernanceCrew loads agent configs
**When** the crew is initialized
**Then** G1 (QA), G2 (Security), G3 (Audit) include `role`, `goal`, and `backstory`

**Given** `validate_desirability_output` completes
**When** governance review is done
**Then** output conforms to `QAReport`, `SecurityReport`, and `AuditReport` schemas

**Given** the gate is reached
**When** governance passes
**Then** a `hitl_requests` entry exists for `approve_desirability_gate`

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/reference/approval-workflows.md`

---

## Phase 3: Feasibility Agent Specifications

### US-AG10: Specify Feasibility BuildCrew Agents and Tasks

**As the** feasibility system owner,
**I want to** define BuildCrew agents reused with feasibility context,
**So that** Phase 3 reliably assesses technical feasibility.

**Acceptance Criteria:**

**Given** the BuildCrew loads agent configs in feasibility context
**When** the crew is initialized
**Then** F1, F2, F3 run with feasibility-specific prompts and outputs

**Given** `assess_feasibility` completes
**When** the assessment is compiled
**Then** output conforms to `FeasibilitySignal` with RED/YELLOW/GREEN status

**Given** the feasibility assessment is ready
**When** the gate is reached
**Then** a `hitl_requests` entry exists for `approve_feasibility_gate`

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/07-phase-3-feasibility.md`

---

### US-AG11: Specify Feasibility GovernanceCrew Agents and Tasks

**As the** governance system owner,
**I want to** define Phase 3 GovernanceCrew agents with feasibility QA contracts,
**So that** feasibility artifacts are validated before gate.

**Acceptance Criteria:**

**Given** the GovernanceCrew loads agent configs in feasibility context
**When** the crew is initialized
**Then** G1 (QA) and G2 (Security) include feasibility-specific validation rules

**Given** `validate_feasibility_output` completes
**When** governance review is done
**Then** output conforms to `QAReport` with feasibility-specific checks

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/reference/approval-workflows.md`

---

## Phase 4: Viability Agent Specifications

### US-AG12: Specify Viability FinanceCrew Agents and Tasks

**As the** viability system owner,
**I want to** define FinanceCrew agents and tasks with financial modeling contracts,
**So that** Phase 4 reliably produces unit economics and compliance analysis.

**Acceptance Criteria:**

**Given** the FinanceCrew loads agent configs
**When** the crew is initialized
**Then** L1 (Financial Controller), L2 (Legal & Compliance), L3 (Economics Reviewer) include `role`, `goal`, and `backstory`

**Given** `calculate_unit_economics` completes
**When** the model is compiled
**Then** output conforms to `UnitEconomics` with CAC, LTV, and LTV/CAC ratio

**Given** `compile_viability_signal` completes
**When** the signal is ready
**Then** output conforms to `ViabilitySignal` with UNPROFITABLE/MARGINAL/PROFITABLE status

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/08-phase-4-viability.md`

---

### US-AG13: Specify Viability SynthesisCrew Agents and Tasks

**As the** synthesis system owner,
**I want to** define SynthesisCrew agents with evidence synthesis contracts,
**So that** Phase 4 produces a final validation recommendation.

**Acceptance Criteria:**

**Given** the SynthesisCrew loads agent configs
**When** the crew is initialized
**Then** C1 (Product PM), C2 (Human Approval), C3 (Final Report) include `role`, `goal`, and `backstory`

**Given** `synthesize_evidence` completes
**When** all phase signals are combined
**Then** output conforms to `EvidenceSynthesis` with recommendation (pivot/proceed/stop)

**Given** the final decision is ready
**When** the gate is reached
**Then** a `hitl_requests` entry exists for `approve_final_decision`

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/08-phase-4-viability.md`

---

### US-AG14: Specify Viability GovernanceCrew Agents and Tasks

**As the** governance system owner,
**I want to** define Phase 4 GovernanceCrew agents with final audit contracts,
**So that** viability artifacts are fully audited before final decision.

**Acceptance Criteria:**

**Given** the GovernanceCrew loads agent configs in viability context
**When** the crew is initialized
**Then** G1 (QA), G2 (Security), G3 (Audit) include viability-specific validation rules

**Given** `audit_final_decision` completes
**When** the audit is recorded
**Then** output conforms to `AuditReport` with flywheel capture and compliance attestation

**Given** the validation journey is complete
**When** the project is marked validated or pivoted
**Then** `validation_progress` records the final milestone with audit trail

**E2E Test:** Gap - needs test
**Journey Reference:** `startupai-crew/docs/master-architecture/reference/approval-workflows.md`

