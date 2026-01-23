---
purpose: "Phase 1 Stage A agent stories - Brief Generation"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
phase: "1A"
crew: "BriefGenerationCrew"
agents: ["GV1", "S1"]
hitl_checkpoints: ["approve_brief"]
---

# Phase 1 Stage A: Brief Generation (US-AB)

Stories for the BriefGenerationCrew that transforms Quick Start input into a structured Founder's Brief.

**Crew**: BriefGenerationCrew
**Agents**: GV1 (Concept Validator), S1 (Brief Compiler)
**HITL Checkpoint**: `approve_brief`
**Spec Reference**: `reference/agent-specifications.md#phase-1-vpc-discovery`

---

### US-AB01: Generate Founder's Brief from Quick Start Input

**As the** BriefGenerationCrew,
**I want to** generate a structured Founder's Brief from Quick Start input,
**So that** Phase 1 Stage B has a validated foundation for VPC discovery.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- GV1 role: "Concept Legitimacy Validator" (not generic "Validator")
- S1 role: "Founder's Brief Compiler" (not generic "Writer")

**Goal Quality:**
- GV1 goal includes success criteria: "identify legal/ethical red flags with zero false negatives"
- S1 goal is outcome-focused: "compile a comprehensive, testable Founder's Brief"

**Backstory Coherence:**
- GV1 backstory: "10 years due diligence experience, values founder safety"
- S1 backstory: "Technical writer who transforms fuzzy ideas into structured documents"

**Tool-Agent Alignment:**
- GV1 uses no tools (pure reasoning for legitimacy checks)
- S1 uses no tools (synthesis from upstream context)

---

### Task Design Validation (80/20 Rule)

**Task: `validate_concept_legitimacy` (GV1)**
- Single purpose: Legitimacy screening only
- Input: `entrepreneur_input`, research context
- Output: `LegitimacyReport` (is_legitimate, concerns[], recommendations[])
- Quality criteria: Zero false negatives on illegal/unethical concepts

**Task: `compile_founders_brief` (S1)**
- Single purpose: Brief compilation only
- Input: `entrepreneur_input`, `LegitimacyReport`, research context
- Output: `FoundersBrief` (all fields populated)
- Quality criteria: All hypothesis fields populated, >= 3 key assumptions

---

### Business Acceptance Criteria

**Given** Quick Start input with `raw_idea` (min 10 characters)
**When** `compile_founders_brief` task completes
**Then**:
- `validation_runs.phase_state.founders_brief` contains `FoundersBrief`
- `founders_brief.the_idea.one_liner` is non-empty
- `founders_brief.problem_hypothesis.problem_statement` is populated
- `founders_brief.customer_hypothesis.primary_segment` is populated
- `founders_brief.solution_hypothesis.proposed_solution` is populated
- `founders_brief.key_assumptions` has >= 3 items
- `founders_brief.qa_status.validation_passed` is true

**Given** the brief is generated
**When** Stage A reaches checkpoint
**Then**:
- `hitl_requests` INSERT with `checkpoint_type='approve_brief'`
- `validation_runs.hitl_state` = `'approve_brief'`
- `validation_runs.status` = `'paused'`

---

### Schemas & State

**Input Schema:**
```python
entrepreneur_input: str  # Min 10 characters from Quick Start
```

**Output Schema:** `FoundersBrief`
```python
class FoundersBrief(BaseModel):
    brief_id: Optional[str]
    founder_id: Optional[str]
    session_id: Optional[str]
    version: int = 1
    the_idea: TheIdea  # one_liner, description, inspiration, unique_insight
    problem_hypothesis: ProblemHypothesis  # problem_statement, who_has_this_problem
    customer_hypothesis: CustomerHypothesis  # primary_segment, characteristics
    solution_hypothesis: SolutionHypothesis  # proposed_solution, key_features
    key_assumptions: list[Assumption]  # >= 3 items
    success_criteria: SuccessCriteria
    founder_context: FounderContext
    qa_status: QAStatus  # validation_passed: bool
    metadata: InterviewMetadata
```

**State Transition:**
```
status='running' → status='paused', hitl_state='approve_brief'
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/30-agent-brief-generation.spec.ts` |
| Unit Test | `startupai-crew/src/crews/onboarding/crew.test.py` |
| Code | `@story US-AB01` in `startupai-crew/src/crews/onboarding/crew.py` |
| Config | `startupai-crew/src/crews/onboarding/config/agents.yaml` |
| Tasks | `startupai-crew/src/crews/onboarding/config/tasks.yaml` |

---

### US-AB02: Validate Brief Legitimacy

**As the** GV1 Concept Validator agent,
**I want to** screen business concepts for legal and ethical concerns,
**So that** obviously problematic ideas are flagged before investment in discovery.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- GV1 role: "Concept Legitimacy Validator" - not "Validator" or "Reviewer"

**Goal Quality:**
- Goal: "Identify legal, ethical, and regulatory red flags in business concepts with zero false negatives on clearly illegal activities"
- Success criteria: No illegal concepts pass through; legitimate edge cases are flagged for review

**Backstory Coherence:**
- "Former compliance officer with 10 years experience in startup due diligence. Values founder safety and public protection. Known for thorough but founder-friendly reviews."

**Tool-Agent Alignment:**
- No tools - pure LLM reasoning
- Reasoning mode enabled for complex analysis
- Temperature: 0.1 (strict compliance)

---

### Task Design Validation (80/20 Rule)

**Task: `validate_concept_legitimacy`**
- Single purpose: Legitimacy check only (not market analysis, not feasibility)
- Input: `entrepreneur_input` (raw idea string)
- Output: `LegitimacyReport`
- Quality criteria: Binary pass/fail with detailed reasoning

---

### Business Acceptance Criteria

**Given** an entrepreneur_input describing an illegal activity
**When** GV1 evaluates the concept
**Then**:
- `LegitimacyReport.is_legitimate` = false
- `LegitimacyReport.legal_concerns` contains specific violation
- `LegitimacyReport.recommendations` suggests legal alternatives if applicable

**Given** an entrepreneur_input describing a legitimate but regulated industry
**When** GV1 evaluates the concept
**Then**:
- `LegitimacyReport.is_legitimate` = true
- `LegitimacyReport.legal_concerns` lists regulatory requirements
- `LegitimacyReport.recommendations` notes compliance considerations

**Given** an entrepreneur_input describing a standard legitimate business
**When** GV1 evaluates the concept
**Then**:
- `LegitimacyReport.is_legitimate` = true
- `LegitimacyReport.legal_concerns` is empty
- `LegitimacyReport.sanity_check` contains positive assessment

---

### Schemas & State

**Input Schema:**
```python
entrepreneur_input: str
```

**Output Schema:** `LegitimacyReport`
```python
class LegitimacyReport(BaseModel):
    is_legitimate: bool  # Pass/fail on legitimacy
    legal_concerns: list[str]  # Regulatory/legal issues
    ethical_concerns: list[str]  # Ethical red flags
    feasibility_concerns: list[str]  # Obvious technical blockers
    sanity_check: str  # Overall assessment
    recommendations: list[str]  # Suggestions if concerns exist
    validation_timestamp: datetime
```

**State Transition:** Internal to crew (no external state change)

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/30-agent-brief-generation.spec.ts` |
| Unit Test | `startupai-crew/src/crews/onboarding/crew.test.py::test_legitimacy_validation` |
| Code | `@story US-AB02` in `startupai-crew/src/crews/onboarding/crew.py` |
| Config | `startupai-crew/src/crews/onboarding/config/agents.yaml#GV1` |

---

### US-AB03: Handle Brief Rejection and Edits

**As the** validation system,
**I want to** handle brief rejections and user edits at the `approve_brief` checkpoint,
**So that** founders can refine AI-generated content before VPC discovery begins.

---

### Agent Design Validation (CrewAI Principles)

This story validates the **HITL checkpoint behavior**, not specific agent design.

**Checkpoint Design:**
- Type: `approve_brief` (Stage A checkpoint)
- Blocking: Yes - VPC crews cannot start until approved
- Editable: Yes - user can modify any brief field
- Retry: Yes - can request re-generation with feedback

---

### Task Design Validation (80/20 Rule)

**Checkpoint Tasks:**
1. **Present Brief** - Show generated brief with provenance markers
2. **Capture Edits** - Track user modifications with `edited_by` and `original_value`
3. **Handle Rejection** - Route feedback to crew for re-generation
4. **Resume Flow** - Continue to Stage B with finalized brief

---

### Business Acceptance Criteria

**Given** brief is presented at `approve_brief` checkpoint
**When** user edits a field (e.g., `problem_hypothesis.problem_statement`)
**Then**:
- Original value stored: `problem_hypothesis.original_value = "..."`
- Edit tracked: `problem_hypothesis.edited_by = "user"`
- Updated value persisted to `validation_runs.phase_state.founders_brief`

**Given** user approves the brief (with or without edits)
**When** approval is submitted
**Then**:
- `hitl_requests` record status = 'approved'
- `validation_runs.status` = 'running'
- `validation_runs.hitl_state` = null
- Stage B (VPC Discovery) begins with edited brief

**Given** user rejects with feedback "Need more focus on B2B segment"
**When** rejection is submitted
**Then**:
- `hitl_requests` record status = 'rejected'
- `hitl_requests.feedback` contains user message
- BriefGenerationCrew re-runs with feedback context
- New brief generated with feedback incorporated

**Given** user requests complete re-generation
**When** "Request Research" action is selected
**Then**:
- BriefGenerationCrew re-runs from scratch
- Previous brief version archived
- `founders_brief.version` incremented

---

### Schemas & State

**HITL Request Schema:**
```python
class HITLRequest(BaseModel):
    id: UUID
    run_id: UUID
    checkpoint_type: str  # 'approve_brief'
    status: str  # 'pending', 'approved', 'rejected'
    payload: dict  # Brief content
    feedback: Optional[str]  # User feedback on rejection
    created_at: datetime
    resolved_at: Optional[datetime]
```

**Edit Tracking:**
```python
# Each editable field supports:
{
    "value": "Current value",
    "original_value": "AI-generated value",
    "edited_by": "user" | "ai",
    "edit_timestamp": "2026-01-23T..."
}
```

**State Transitions:**
```
On Approve: paused → running, hitl_state → null
On Reject: paused → running (re-generation), version++
On Re-generate: paused → running (fresh generation), version++
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/30-agent-brief-generation.spec.ts` |
| Unit Test | `startupai-crew/src/crews/onboarding/crew.test.py::test_brief_rejection` |
| API | `frontend/src/app/api/hitl/approve/route.ts` |
| Component | `frontend/src/components/approvals/BriefApprovalModal.tsx` |
| Hook | `frontend/src/hooks/useHITLApproval.ts` |

---

## Summary

| ID | Title | Checkpoint | State Change |
|----|-------|------------|--------------|
| US-AB01 | Generate Founder's Brief | approve_brief | running → paused |
| US-AB02 | Validate Brief Legitimacy | (internal) | none |
| US-AB03 | Handle Brief Rejection/Edits | approve_brief | paused → running |

---

**Related Documents:**
- [state-schemas.md](../../../../../startupai-crew/docs/master-architecture/reference/state-schemas.md) - FoundersBrief schema
- [approval-workflows.md](../../../../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) - approve_brief checkpoint
- [agent-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/agent-specifications.md) - GV1, S1 specs

---

**Last Updated**: 2026-01-23
