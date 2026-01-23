---
purpose: "Phase 4 agent stories - Viability Assessment"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
phase: "4"
crews: ["FinanceCrew", "SynthesisCrew", "GovernanceCrew"]
agents: ["L1", "L2", "L3", "C1", "C2", "C3", "G1", "G2", "G3"]
hitl_checkpoints: ["approve_viability_gate", "request_human_decision"]
---

# Phase 4: Viability Assessment (US-AVB)

Stories for Phase 4 crews that assess unit economics, synthesize evidence, and request final human decision.

**Crews**: FinanceCrew, SynthesisCrew, GovernanceCrew
**Agents**: L1, L2, L3 (Finance), C1, C2, C3 (Synthesis), G1, G2, G3 (Governance)
**HITL Checkpoints**: `approve_viability_gate`, `request_human_decision`
**Spec Reference**: `reference/agent-specifications.md#phase-4-viability`

---

### US-AVB01: Calculate Unit Economics

**As the** L1 Financial Controller agent,
**I want to** calculate CAC, LTV, and unit economics from validation evidence,
**So that** financial viability is quantified.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- L1 role: "Financial Controller" - unit economics specialist

**Goal Quality:**
- Goal: "Calculate CAC, LTV, and LTV/CAC ratio with confidence intervals"
- Success criteria: LTV/CAC >= 3.0 is healthy, < 1.0 is underwater

**Backstory Coherence:**
- "CFO of three startups. Obsessive about unit economics. Known for catching 'growth at all costs' traps before they become fatal."

**Tool-Agent Alignment:**
- UnitEconomicsModelsTool (EXISTS) - Calculate CAC, LTV, margins
- BusinessModelClassifierTool (EXISTS) - Classify business model type
- FinancialDataTool (STUB) - Fetch financial benchmarks

---

### Task Design Validation (80/20 Rule)

**Task: `calculate_unit_economics`**
- Single purpose: Unit economics calculation only
- Input: DesirabilityEvidence (CAC data), FeasibilityEvidence (cost data)
- Output: `UnitEconomics`
- Quality criteria: Explicit assumptions, benchmark comparison

---

### Business Acceptance Criteria

**Given** DesirabilityEvidence with ad_spend and ad_signups
**When** `calculate_unit_economics` task completes
**Then**:
- `UnitEconomics.cac` = ad_spend / ad_signups
- `UnitEconomics.ltv` calculated from pricing and retention assumptions
- `UnitEconomics.ltv_cac_ratio` computed
- `UnitEconomics.payback_period_months` estimated
- `UnitEconomics.benchmark_comparison` shows industry context

**LTV/CAC Interpretation:**
- >= 3.0: Healthy - proceed to final decision
- 1.0-3.0: Marginal - consider pricing/cost optimization
- < 1.0: Underwater - strategic pivot required

---

### Schemas & State

**Output Schema:** `UnitEconomics`
```python
class UnitEconomics(BaseModel):
    cac: float  # Customer Acquisition Cost
    ltv: float  # Lifetime Value
    ltv_cac_ratio: float  # Target: >= 3.0
    payback_period_months: int
    gross_margin: float
    contribution_margin: float
    business_model_type: str
    benchmark_comparison: BenchmarkComparison
    assumptions: list[FinancialAssumption]
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/34-agent-viability.spec.ts` |
| Unit Test | `startupai-crew/src/crews/viability/crew.test.py` |
| Code | `@story US-AVB01` in `startupai-crew/src/crews/viability/crew.py` |
| Config | `startupai-crew/src/crews/viability/config/agents.yaml#L1` |

---

### US-AVB02: Assess Compliance

**As the** L2 Legal & Compliance agent,
**I want to** identify regulatory requirements and compliance costs,
**So that** hidden viability risks are surfaced.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- L2 role: "Legal & Compliance Analyst" - regulatory expert

**Goal Quality:**
- Goal: "Identify all regulatory requirements and estimate compliance costs"
- Success criteria: No surprise regulatory blockers post-launch

**Tool-Agent Alignment:**
- TavilySearchTool (EXISTS) - Research regulatory requirements

---

### Task Design Validation (80/20 Rule)

**Task: `assess_compliance`**
- Single purpose: Compliance assessment only
- Input: Business model, target markets, data handling
- Output: `ComplianceReport`
- Quality criteria: Comprehensive, jurisdiction-aware

---

### Business Acceptance Criteria

**Given** a business model and target markets
**When** `assess_compliance` task completes
**Then**:
- `ComplianceReport.regulatory_requirements` lists all applicable regulations
- `ComplianceReport.compliance_gaps` identifies what's missing
- `ComplianceReport.licensing_needed` lists required licenses
- `ComplianceReport.estimated_compliance_cost` is quantified

---

### Schemas & State

**Output Schema:** `ComplianceReport`
```python
class ComplianceReport(BaseModel):
    regulatory_requirements: list[Requirement]
    compliance_gaps: list[Gap]
    licensing_needed: list[License]
    data_privacy_requirements: list[Requirement]  # GDPR, CCPA, etc.
    estimated_compliance_cost: float
    compliance_timeline: str
    risk_level: str  # "low", "medium", "high"
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/34-agent-viability.spec.ts` |
| Code | `@story US-AVB02` in `startupai-crew/src/crews/viability/crew.py` |
| Config | `startupai-crew/src/crews/viability/config/agents.yaml#L2` |

---

### US-AVB03: Compile Viability Signal

**As the** L3 Economics Reviewer agent,
**I want to** compile unit economics and compliance into a viability signal,
**So that** the viability gate decision is clear.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- L3 role: "Economics Reviewer" - final viability assessment

**Goal Quality:**
- Goal: "Synthesize financial and compliance data into actionable viability signal"
- Success criteria: Clear PROFITABLE/MARGINAL/UNDERWATER classification

**Tool-Agent Alignment:**
- BudgetGuardrailsTool (EXISTS) - Validate budget constraints

---

### Task Design Validation (80/20 Rule)

**Task: `compile_viability_signal`**
- Single purpose: Signal compilation only
- Input: UnitEconomics, ComplianceReport
- Output: `ViabilitySignal`
- Quality criteria: Clear signal with supporting evidence

---

### Business Acceptance Criteria

**Given** UnitEconomics and ComplianceReport
**When** `compile_viability_signal` task completes
**Then**:
- `ViabilitySignal.signal` is "PROFITABLE", "MARGINAL", or "UNDERWATER"
- `ViabilitySignal.unit_economics` included for transparency
- `ViabilitySignal.runway_projection` shows months until break-even
- `ViabilitySignal.investment_required` quantified

**Given** viability signal is compiled
**When** gate checkpoint is reached
**Then**:
- `hitl_requests` INSERT with `checkpoint_type='approve_viability_gate'`
- User reviews full financial picture

---

### Signal Definitions

| Signal | LTV/CAC | Action |
|--------|---------|--------|
| PROFITABLE | >= 3.0 | Proceed to final decision |
| MARGINAL | 1.0-3.0 | Optimize pricing/costs, then proceed |
| UNDERWATER | < 1.0 | Strategic pivot required |

---

### Schemas & State

**Output Schema:** `ViabilitySignal`
```python
class ViabilitySignal(BaseModel):
    signal: str  # "PROFITABLE", "MARGINAL", "UNDERWATER"
    unit_economics: UnitEconomics
    compliance_report: ComplianceReport
    runway_projection: RunwayProjection
    break_even_analysis: BreakEvenAnalysis
    investment_required: float
    risk_assessment: RiskAssessment
    confidence: float  # 0-1
```

**ViabilityEvidence Schema:**
```python
class ViabilityEvidence(BaseModel):
    cac: float
    ltv: float
    ltv_cac_ratio: float
    payback_months: Optional[int]
    target_price: float
    willingness_to_pay: float
    tam_usd: float
    sam_usd: float
    som_usd: float
    signal: Optional[ValidationSignal]
    unit_economics_status: str  # "healthy", "marginal", "underwater"
```

**State Transition:**
```
status='running' → status='paused', hitl_state='approve_viability_gate'
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/34-agent-viability.spec.ts` |
| Code | `@story US-AVB03` in `startupai-crew/src/crews/viability/crew.py` |
| Config | `startupai-crew/src/crews/viability/config/agents.yaml#L3` |

---

### US-AVB04: Synthesize Evidence

**As the** C1 Product PM agent,
**I want to** synthesize all phase evidence into a comprehensive recommendation,
**So that** the human decision is well-informed.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- C1 role: "Evidence Synthesis PM" - cross-phase analysis expert

**Goal Quality:**
- Goal: "Synthesize D-F-V signals into coherent recommendation with learning context"
- Success criteria: Clear pivot/proceed/stop recommendation with rationale

**Backstory Coherence:**
- "Product manager who has seen 100 validation cycles. Values pattern recognition and honest assessment over optimism."

**Tool-Agent Alignment:**
- LearningRetrievalTool (EXISTS) - Query past learnings from flywheel

---

### Task Design Validation (80/20 Rule)

**Task: `synthesize_evidence`**
- Single purpose: Evidence synthesis only
- Input: All phase signals (Desirability, Feasibility, Viability)
- Output: `EvidenceSynthesis`
- Quality criteria: All evidence weighted, recommendation justified

---

### Business Acceptance Criteria

**Given** DesirabilitySignal, FeasibilitySignal, and ViabilitySignal
**When** `synthesize_evidence` task completes
**Then**:
- `EvidenceSynthesis.overall_confidence` aggregates signal strengths
- `EvidenceSynthesis.key_learnings` captures insights for flywheel
- `EvidenceSynthesis.pivot_options` lists alternatives if not proceed
- `EvidenceSynthesis.recommendation` is "pivot", "proceed", or "stop"

**Recommendation Logic:**
- All signals strong → "proceed"
- Any signal weak with fix → "pivot" (to address weakness)
- Multiple weak signals, no clear fix → "stop"

---

### Schemas & State

**Output Schema:** `EvidenceSynthesis`
```python
class EvidenceSynthesis(BaseModel):
    desirability_summary: DesirabilitySignal
    feasibility_summary: FeasibilitySignal
    viability_summary: ViabilitySignal
    overall_confidence: float  # 0-1
    key_learnings: list[Learning]
    pivot_options: list[PivotOption]
    proceed_rationale: str
    recommendation: str  # "pivot", "proceed", "stop"
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/34-agent-viability.spec.ts` |
| Code | `@story US-AVB04` in `startupai-crew/src/crews/viability/crew.py` |
| Config | `startupai-crew/src/crews/viability/config/agents.yaml#C1` |

---

### US-AVB05: Request Final Human Decision

**As the** C2 Human Approval agent,
**I want to** frame the final decision for human review,
**So that** the founder makes an informed proceed/pivot/stop choice.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- C2 role: "Decision Framing Specialist" - HITL orchestration

**Goal Quality:**
- Goal: "Present evidence synthesis in decision-ready format with clear options"
- Success criteria: Founder can make informed decision within 15 minutes

**Tool-Agent Alignment:**
- ViabilityApprovalTool (STUB) - Orchestrate final decision

---

### Task Design Validation (80/20 Rule)

**Task: `request_human_decision`**
- Single purpose: Decision framing only
- Input: EvidenceSynthesis
- Output: `HumanDecisionRequest`
- Quality criteria: Clear options, risks, timeline implications

---

### Business Acceptance Criteria

**Given** EvidenceSynthesis with recommendation
**When** `request_human_decision` task completes
**Then**:
- `HumanDecisionRequest.decision_options` lists all available choices
- Each option includes pros, cons, and next steps
- `HumanDecisionRequest.evidence_summary` is human-readable
- `HumanDecisionRequest.risk_summary` highlights key risks
- `hitl_requests` INSERT with `checkpoint_type='request_human_decision'`

**Decision Options:**
1. **Proceed** - Move to MVP development with current validation
2. **Pivot** - Address identified weakness (specify type)
3. **Stop** - Archive project, capture learnings

**Given** human makes a decision
**When** decision is submitted
**Then**:
- C3 (Roadmap Writer) captures decision and next steps
- `validation_runs.final_decision` = chosen option
- `validation_runs.decision_rationale` = user's reasoning
- Learnings captured to flywheel

---

### Schemas & State

**Output Schema:** `HumanDecisionRequest`
```python
class HumanDecisionRequest(BaseModel):
    synthesis: EvidenceSynthesis
    decision_options: list[DecisionOption]
    evidence_summary: str  # Human-readable summary
    risk_summary: str  # Key risks highlighted
    timeline_implications: dict[str, str]  # Option → timeline
    decision_required_by: datetime  # Suggested deadline

class DecisionOption(BaseModel):
    option: str  # "proceed", "pivot_segment", "pivot_value", "stop"
    description: str
    pros: list[str]
    cons: list[str]
    next_steps: list[str]
    estimated_timeline: str
```

**State Transition:**
```
status='running' → status='paused', hitl_state='request_human_decision'

On decision:
- validation_runs.final_decision = "proceed" | "pivot" | "kill"
- validation_runs.decision_rationale = user input
- validation_runs.status = "completed"
- validation_runs.completed_at = now()
```

**Final State:**
```python
class ValidationRunState(BaseModel):
    # ... existing fields ...
    final_decision: Optional[str]  # "proceed", "pivot", "kill"
    decision_rationale: Optional[str]
    pivot_recommendation: Optional[PivotRecommendation]
    completed_at: Optional[datetime]
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/34-agent-viability.spec.ts` |
| Code | `@story US-AVB05` in `startupai-crew/src/crews/viability/crew.py` |
| Config | `startupai-crew/src/crews/viability/config/agents.yaml#C2` |
| Component | `frontend/src/components/approvals/FinalDecisionModal.tsx` |

---

## Summary

| ID | Title | Checkpoint | Output |
|----|-------|------------|--------|
| US-AVB01 | Calculate Unit Economics | (internal) | UnitEconomics |
| US-AVB02 | Assess Compliance | (internal) | ComplianceReport |
| US-AVB03 | Compile Viability Signal | approve_viability_gate | ViabilitySignal |
| US-AVB04 | Synthesize Evidence | (internal) | EvidenceSynthesis |
| US-AVB05 | Request Final Decision | request_human_decision | ValidationRoadmap |

---

**Innovation Physics Routing:**

| Viability Signal | Route | HITL |
|------------------|-------|------|
| PROFITABLE | Final decision | request_human_decision |
| MARGINAL | Optimize then decide | approve_viability_gate + optimization |
| UNDERWATER | Strategic pivot | approve_strategic_pivot |

---

**Related Documents:**
- [state-schemas.md](../../../../../startupai-crew/docs/master-architecture/reference/state-schemas.md) - ViabilityEvidence
- [approval-workflows.md](../../../../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) - Phase 4 checkpoints
- [agent-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/agent-specifications.md) - Phase 4 agents

---

**Last Updated**: 2026-01-23
