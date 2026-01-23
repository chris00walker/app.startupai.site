---
purpose: "Phase 3 agent stories - Feasibility Assessment"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
phase: "3"
crews: ["BuildCrew", "GovernanceCrew"]
agents: ["F1", "F2", "F3", "G1", "G2"]
hitl_checkpoints: ["approve_feasibility_gate"]
---

# Phase 3: Feasibility Assessment (US-AFB)

Stories for Phase 3 crews that assess technical feasibility and resource requirements.

**Crews**: BuildCrew (reused with feasibility context), GovernanceCrew
**Agents**: F1, F2, F3 (Build), G1, G2 (Governance)
**HITL Checkpoint**: `approve_feasibility_gate`
**Spec Reference**: `reference/agent-specifications.md#phase-3-feasibility`

---

### US-AFB01: Assess Feature Requirements

**As the** F1 UX/UI Designer agent (feasibility context),
**I want to** analyze feature requirements from the validated Value Map,
**So that** technical complexity is understood before development estimation.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- F1 role in feasibility: "Requirements Analyst" - not "Designer"
- Context shift: Design → Requirements analysis

**Goal Quality:**
- Goal: "Decompose value proposition into technical feature requirements"
- Success criteria: Features mapped to complexity levels, gaps identified

**Backstory Coherence:**
- "Product analyst with experience scoping MVPs. Known for cutting scope ruthlessly while preserving core value."

**Tool-Agent Alignment:**
- ComponentLibraryScraperTool (STUB) - Assess component availability

---

### Task Design Validation (80/20 Rule)

**Task: `analyze_feature_requirements`**
- Single purpose: Requirements analysis only (not design)
- Input: ValueMap, DesirabilitySignal
- Output: `FeatureRequirements`
- Quality criteria: Clear complexity ratings, dependency mapping

---

### Business Acceptance Criteria

**Given** ValueMap with products_services
**When** `analyze_feature_requirements` task completes
**Then**:
- `FeatureRequirements.features` lists all required capabilities
- Each feature has complexity rating (low/medium/high)
- `FeatureRequirements.ui_complexity` aggregates overall UI effort
- `FeatureRequirements.design_system_gaps` identifies missing components

**Given** the feature analysis is complete
**When** passed to F2/F3
**Then**:
- Frontend and backend feasibility can be assessed independently
- Dependencies between features are mapped

---

### Schemas & State

**Output Schema:** `FeatureRequirements`
```python
class FeatureRequirements(BaseModel):
    features: list[Feature]  # Required capabilities
    ui_complexity: str  # "low", "medium", "high"
    component_requirements: list[ComponentRequirement]
    design_system_gaps: list[str]  # Missing shadcn/ui components
    dependencies: list[FeatureDependency]

class Feature(BaseModel):
    id: str
    name: str
    description: str
    complexity: str  # "low", "medium", "high"
    value_map_reference: str  # Links to ValueMap item
    mvp_required: bool
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/33-agent-feasibility.spec.ts` |
| Unit Test | `startupai-crew/src/crews/feasibility/crew.test.py` |
| Code | `@story US-AFB01` in `startupai-crew/src/crews/feasibility/crew.py` |
| Config | `startupai-crew/src/crews/feasibility/config/agents.yaml#F1` |

---

### US-AFB02: Evaluate Technical Feasibility

**As the** BuildCrew (F2, F3) in feasibility context,
**I want to** evaluate frontend and backend feasibility,
**So that** technical constraints and risks are identified.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- F2 role in feasibility: "Frontend Feasibility Analyst"
- F3 role in feasibility: "Backend Feasibility Analyst"

**Goal Quality:**
- F2 goal: "Assess frontend implementation feasibility and identify risks"
- F3 goal: "Evaluate backend architecture, API costs, and integration complexity"

**Tool-Agent Alignment:**
- F2: Uses component library knowledge, React patterns
- F3: Uses infrastructure cost estimation, API evaluation

---

### Task Design Validation (80/20 Rule)

**Task: `assess_frontend_feasibility` (F2)**
- Single purpose: Frontend assessment only
- Input: `FeatureRequirements`
- Output: `FrontendFeasibility`

**Task: `assess_backend_feasibility` (F3)**
- Single purpose: Backend assessment only
- Input: `FeatureRequirements`, API requirements
- Output: `FeasibilitySignal` (combined)

---

### Business Acceptance Criteria

**Given** FeatureRequirements with complexity ratings
**When** F2 assesses frontend feasibility
**Then**:
- `FrontendFeasibility.feasibility_score` is 0-1
- `FrontendFeasibility.complexity_assessment` explains the rating
- `FrontendFeasibility.risks` lists technical risks
- `FrontendFeasibility.tech_stack_compatibility` confirms fit

**Given** frontend and backend assessments complete
**When** `compile_feasibility_signal` task runs
**Then**:
- `FeasibilitySignal.signal` is "GREEN", "ORANGE_CONSTRAINED", or "RED_IMPOSSIBLE"
- `FeasibilitySignal.constraints` lists any limitations
- `FeasibilitySignal.resource_requirements` estimates team/time

---

### Signal Definitions

| Signal | Meaning | Action |
|--------|---------|--------|
| GREEN | Fully feasible with current resources | Proceed to Phase 4 |
| ORANGE_CONSTRAINED | Feasible with constraints/downgrades | HITL: approve_feature_pivot |
| RED_IMPOSSIBLE | Core features technically impossible | HITL: major scope change or kill |

---

### Schemas & State

**Output Schemas:**
```python
class FrontendFeasibility(BaseModel):
    feasibility_score: float  # 0-1
    complexity_assessment: str
    timeline_estimate: str
    tech_stack_compatibility: bool
    risks: list[TechRisk]

class FeasibilitySignal(BaseModel):
    signal: str  # "GREEN", "ORANGE_CONSTRAINED", "RED_IMPOSSIBLE"
    frontend_feasibility: FrontendFeasibility
    backend_feasibility: BackendFeasibility
    integration_risks: list[IntegrationRisk]
    resource_requirements: ResourceRequirements
    timeline_estimate: TimelineEstimate
    confidence: float  # 0-1
```

**FeasibilityEvidence Schema:**
```python
class FeasibilityEvidence(BaseModel):
    core_features_feasible: bool
    downgrade_required: bool
    downgrade_features: list[str]
    api_costs_monthly: float
    infra_costs_monthly: float
    total_monthly_cost: float
    mvp_weeks: Optional[int]
    full_product_weeks: Optional[int]
    signal: Optional[ValidationSignal]
    constraints: list[str]
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/33-agent-feasibility.spec.ts` |
| Code | `@story US-AFB02` in `startupai-crew/src/crews/feasibility/crew.py` |
| Config | `startupai-crew/src/crews/feasibility/config/agents.yaml#F2,F3` |

---

### US-AFB03: Evaluate Feasibility Gate

**As the** GovernanceCrew (feasibility context),
**I want to** validate feasibility artifacts and trigger the gate checkpoint,
**So that** Phase 4 only begins with confirmed technical feasibility.

---

### Agent Design Validation (CrewAI Principles)

**Crew Composition:**
- G1 (QA Agent) - Feasibility methodology compliance
- G2 (Security Agent) - Architecture security review

**Role Specificity:**
- G1 role: "Technical QA Specialist" (feasibility focus)
- G2 role: "Security Architecture Reviewer"

**Tool-Agent Alignment:**
- G1: MethodologyCheckTool (EXISTS), GuardianReviewTool (EXISTS)
- G2: PrivacyGuardTool (EXISTS)

---

### Task Design Validation (80/20 Rule)

**Task: `validate_feasibility_output` (G1)**
- Single purpose: Feasibility QA only
- Input: FeasibilitySignal, all feasibility artifacts
- Output: `QAReport` (feasibility-specific)

**Task: `security_architecture_review` (G2)**
- Single purpose: Security assessment only
- Input: Technical architecture, integration points
- Output: `SecurityReport`

---

### Business Acceptance Criteria

**Given** FeasibilitySignal is GREEN
**When** GovernanceCrew completes validation
**Then**:
- `QAReport.methodology_compliance` = true
- `QAReport.gate_ready` = true
- `hitl_requests` INSERT with `checkpoint_type='approve_feasibility_gate'`
- User reviews technical assessment before Phase 4

**Given** FeasibilitySignal is ORANGE_CONSTRAINED
**When** GovernanceCrew completes validation
**Then**:
- Innovation Physics recommends FEATURE_PIVOT
- `hitl_requests` includes constraint details
- User can approve downgrade or request alternatives

**Given** FeasibilitySignal is RED_IMPOSSIBLE
**When** GovernanceCrew completes validation
**Then**:
- Innovation Physics flags critical blocker
- `hitl_requests` requires major decision
- Options: scope reduction, technology pivot, or kill

---

### Schemas & State

**QA Report (Feasibility Context):**
```python
class QAReport(BaseModel):
    methodology_compliance: bool
    quality_score: float  # 0-1
    issues_found: list[Issue]
    recommendations: list[str]
    gate_ready: bool
    feasibility_specific: FeasibilityQADetails

class FeasibilityQADetails(BaseModel):
    cost_estimates_validated: bool
    timeline_reasonable: bool
    risk_mitigation_adequate: bool
    integration_points_reviewed: bool
```

**State Transition:**
```
On GREEN: status='running' → status='paused', hitl_state='approve_feasibility_gate'
On ORANGE: status='running' → status='paused', hitl_state='approve_feature_pivot'
On RED: status='running' → status='paused', hitl_state='major_scope_decision'
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/33-agent-feasibility.spec.ts` |
| Code | `@story US-AFB03` in `startupai-crew/src/crews/feasibility/crew.py` |
| Config | `startupai-crew/src/crews/feasibility/config/agents.yaml#G1,G2` |

---

## Summary

| ID | Title | Checkpoint | Signal Condition |
|----|-------|------------|------------------|
| US-AFB01 | Assess Feature Requirements | (internal) | - |
| US-AFB02 | Evaluate Technical Feasibility | (internal) | GREEN/ORANGE/RED |
| US-AFB03 | Evaluate Feasibility Gate | approve_feasibility_gate | GREEN → proceed |

---

**Innovation Physics Routing:**

| Signal | Route | HITL |
|--------|-------|------|
| GREEN | Phase 4 Viability | approve_feasibility_gate |
| ORANGE_CONSTRAINED | Downgrade + Retest Phase 2 | approve_feature_pivot |
| RED_IMPOSSIBLE | Stop or major pivot | major_scope_decision |

---

**Related Documents:**
- [state-schemas.md](../../../../../startupai-crew/docs/master-architecture/reference/state-schemas.md) - FeasibilityEvidence
- [approval-workflows.md](../../../../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) - Phase 3 checkpoints
- [agent-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/agent-specifications.md) - Phase 3 agents

---

**Last Updated**: 2026-01-23
