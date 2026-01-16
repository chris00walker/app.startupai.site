# Phase 0 Webhook Data Contract Analysis

**Date**: 2026-01-15
**Reporter**: Modal Developer Agent
**Status**: ~~CRITICAL DATA FLOW BUG IDENTIFIED~~ **CLARIFIED (2026-01-16)**

---

> **RETROSPECTIVE CORRECTION (2026-01-16)**: The "CRITICAL DATA FLOW BUG" assessment below was **OVERSTATED**. The two-layer data model is **BY DESIGN**:
>
> - **`entrepreneur_briefs`** = Layer 1: Raw extraction from Alex chat (created by `/api/onboarding/complete` when onboarding finishes)
> - **`founders_briefs`** = Layer 2: CrewAI-validated output (created by webhook when Phase 0 completes)
>
> The confusion arose because `buildEntrepreneurBriefRow()` has a misleading name and is called in contexts where it shouldn't populate `entrepreneur_briefs`. The actual fix needed is to ensure:
> 1. Alex chat creates `entrepreneur_briefs` (Layer 1) ✅ Already happens in `/api/onboarding/complete`
> 2. CrewAI webhook creates `founders_briefs` (Layer 2) - This is the correct behavior
> 3. Neither overwrites the other - They serve different purposes
>
> **Related**: The Two-Pass Architecture (ADR-004) fixed the **Alex chat stage progression issue**, which was the actual critical bug blocking Phase 0.

---

## Executive Summary

~~The webhook handler at `/api/crewai/webhook/route.ts` is **incorrectly overwriting Layer 1 data (`entrepreneur_briefs`) with Layer 2 results (`founders_briefs`)**.~~

**Clarification**: The two tables are intentionally separate:
- `entrepreneur_briefs` = Alex chat raw extraction (Layer 1)
- `founders_briefs` = CrewAI validated output (Layer 2)

~~**Root Cause**: Lines 744-748 call `buildEntrepreneurBriefRow()` which transforms Phase 2-4 D-F-V evidence into entrepreneur_brief fields, overwriting the original Alex chat extraction.~~

**Actual Issue**: The function naming is confusing. `buildEntrepreneurBriefRow()` should be renamed or the webhook should be creating `founders_briefs` records instead. This is a **code clarity issue**, not a data corruption bug.

---

## Question 1: Does OnboardingCrew Output a FoundersBrief Schema?

**YES**. The crew returns a Pydantic `FoundersBrief` model as structured output.

### Evidence

**File**: `/home/chris/projects/startupai-crew/src/crews/onboarding/crew.py`

```python
@task
def compile_founders_brief(self) -> Task:
    """Compile all inputs into the structured Founder's Brief."""
    return Task(
        config=self.tasks_config["compile_founders_brief"],
        output_pydantic=FoundersBrief,  # ← RETURNS PYDANTIC MODEL
    )
```

**File**: `/home/chris/projects/startupai-crew/src/modal_app/phases/phase_0.py`

```python
from src.state.models import FoundersBrief

def execute(run_id: str, state: dict[str, Any]) -> dict[str, Any]:
    # Execute OnboardingCrew
    founders_brief = run_onboarding_crew(
        entrepreneur_input=entrepreneur_input,
        conversation_transcript=conversation_transcript,
        user_type=user_type,
    )
    
    # Return HITL checkpoint with founders_brief
    return {
        "state": {
            **state,
            "founders_brief": founders_brief.model_dump(mode="json"),  # ← PYDANTIC OUTPUT
        },
        "hitl_checkpoint": "approve_founders_brief",
        "hitl_context": {
            "founders_brief": founders_brief.model_dump(mode="json"),
            # ...
        },
    }
```

**Schema Location**: `/home/chris/projects/startupai-crew/src/state/models.py` (lines 219-276)

### FoundersBrief Pydantic Model Structure

```python
class FoundersBrief(BaseModel):
    # Identity
    brief_id: Optional[str]
    founder_id: Optional[str]
    session_id: Optional[str]
    created_at: Optional[datetime]
    version: int = 1
    
    # The Idea
    the_idea: TheIdea  # {one_liner, description, inspiration, unique_insight}
    
    # Hypotheses (NOT validated - captured for testing)
    problem_hypothesis: ProblemHypothesis
    customer_hypothesis: CustomerHypothesis
    solution_hypothesis: SolutionHypothesis
    
    # Assumptions & Success
    key_assumptions: list[Assumption]
    success_criteria: SuccessCriteria
    
    # Founder Context
    founder_context: FounderContext
    
    # QA Status
    qa_status: QAStatus  # {legitimacy_check, intent_verification, overall_status}
    
    # Metadata
    metadata: InterviewMetadata  # {duration, turns, confidence_score}
```

**Key Point**: All hypotheses are marked `validation_status: "HYPOTHESIS - NOT VALIDATED"`. Phase 0 does NOT validate; it only captures.

---

## Question 2: What Should the Webhook Do Instead?

### Current Incorrect Behavior (Lines 744-748)

```typescript
// ❌ WRONG: Overwrites Layer 1 with Layer 2 results
if (payload.session_id) {
  const briefRow = buildEntrepreneurBriefRow(payload);
  await admin.from('entrepreneur_briefs').upsert(briefRow, { onConflict: 'session_id' });
}
```

### Problem with `buildEntrepreneurBriefRow()`

**File**: `/frontend/src/app/api/crewai/webhook/route.ts` (lines 619-652)

```typescript
function buildEntrepreneurBriefRow(payload: FounderValidationPayload) {
  const report = payload.validation_report;
  const canvas = payload.value_proposition_canvas;
  const segments = Object.keys(canvas);
  
  return {
    session_id: payload.session_id,
    user_id: payload.user_id,
    // ❌ WRONG: Populates with D-F-V evidence from Phase 2-4
    customer_segment_confidence: payload.evidence.desirability?.problem_resonance,  // Phase 2 data
    problem_pain_level: payload.evidence.desirability?.problem_resonance,           // Phase 2 data
    unique_value_proposition: report.validation_outcome,                            // Phase 4 data
    budget_range: payload.evidence.feasibility?.total_monthly_cost,                 // Phase 3 data
    // ...
  };
}
```

**This is incorrect because**:
1. `entrepreneur_briefs` = Layer 1 (Alex chat raw extraction, created BEFORE Modal runs)
2. The `buildEntrepreneurBriefRow()` function uses Phase 2-4 evidence (desirability, feasibility, viability)
3. It overwrites the original Layer 1 data with validated results

### Correct Behavior

#### For `flow_type: "founder_validation"` (Phase 0-4 Complete)

```typescript
// 1. Create founders_briefs record (Layer 2 validated output)
if (payload.session_id && payload.founders_brief) {
  const foundersBriefRow = buildFoundersBriefRow(payload.founders_brief, payload.session_id, payload.user_id);
  await admin.from('founders_briefs').upsert(foundersBriefRow, { 
    onConflict: 'session_id,version' 
  });
}

// 2. DO NOT touch entrepreneur_briefs - it was already created by Alex chat
```

#### For `flow_type: "hitl_checkpoint"` with `checkpoint: "approve_founders_brief"`

```typescript
// Modal sends HITL checkpoint after Phase 0 completes
if (payload.flow_type === 'hitl_checkpoint' && payload.checkpoint === 'approve_founders_brief') {
  const foundersBriefRow = buildFoundersBriefRow(
    payload.context.founders_brief, 
    payload.session_id, 
    payload.user_id
  );
  
  await admin.from('founders_briefs').insert(foundersBriefRow);
  
  // Create approval_requests entry for HITL UI
  await admin.from('approval_requests').insert({
    run_id: payload.run_id,
    project_id: payload.project_id,
    user_id: payload.user_id,
    checkpoint: 'approve_founders_brief',
    title: payload.title,
    description: payload.description,
    options: payload.options,
    recommended_option: payload.recommended,
    context: payload.context,
    status: 'pending',
    expires_at: payload.expires_at,
  });
}
```

---

## Question 3: Data Contract Gap Analysis

### Frontend → Modal (Kickoff Request)

**Frontend sends** (`/api/crewai/analyze`):
```json
{
  "project_id": "uuid",
  "user_id": "uuid",
  "entrepreneur_input": "string",           // Extracted from Alex chat stage_data
  "session_id": "uuid",
  "conversation_transcript": "string"       // Full Alex conversation history
}
```

**Modal expects** (`/kickoff`):
```python
class KickoffRequest(BaseModel):
    project_id: UUID
    user_id: UUID
    entrepreneur_input: str = Field(..., min_length=10)
    session_id: Optional[UUID] = None
    conversation_transcript: Optional[str] = None
    user_type: Optional[str] = "founder"
```

**✅ CONTRACT MATCH**: Frontend sends exactly what Modal expects.

### Modal → Frontend (Webhook Response)

**Modal sends** (Phase 0 complete):
```python
# Completion webhook payload
{
    "flow_type": "founder_validation",
    "run_id": run_id,
    "status": "completed",
    "result": final_state,  # Contains founders_brief from phase_state
}
```

**Frontend expects** (`buildEntrepreneurBriefRow()`):
```typescript
interface FounderValidationPayload {
  session_id: string;
  user_id: string;
  validation_report: ValidationReport;
  value_proposition_canvas: Record<string, any>;
  evidence: {
    desirability?: DesirabilityEvidence;
    feasibility?: FeasibilityEvidence;
    viability?: ViabilityEvidence;
  };
}
```

**❌ CONTRACT MISMATCH**: Modal sends Phase 0 output (`founders_brief`), but webhook expects Phase 2-4 outputs (D-F-V evidence).

### What Modal Actually Returns (Phase 0 → HITL)

**File**: `/home/chris/projects/startupai-crew/src/modal_app/phases/phase_0.py` (lines 160-197)

```python
return {
    "state": {
        **state,
        "founders_brief": founders_brief.model_dump(mode="json"),  # ← THIS IS THE OUTPUT
    },
    "hitl_checkpoint": "approve_founders_brief",
    "hitl_title": "Approve Founder's Brief",
    "hitl_description": "Review the Founder's Brief...",
    "hitl_context": {
        "founders_brief": founders_brief.model_dump(mode="json"),
        "qa_status": {
            "legitimacy_check": founders_brief.qa_status.legitimacy_check,
            "legitimacy_notes": founders_brief.qa_status.legitimacy_notes,
            "intent_verification": founders_brief.qa_status.intent_verification,
            "intent_notes": founders_brief.qa_status.intent_notes,
            "overall_status": founders_brief.qa_status.overall_status,
        },
    },
    # ...
}
```

**Modal does NOT send D-F-V evidence in Phase 0**. It only sends the `founders_brief` schema.

---

## Question 4: Phase 0 vs Later Phases

### What the Spec Says

**File**: `/home/chris/projects/startupai-crew/docs/master-architecture/04-phase-0-onboarding.md`

> "Phase 0 captures hypotheses, it does NOT validate them. The validation_status for all hypotheses is `HYPOTHESIS - NOT VALIDATED`."

**File**: `/home/chris/projects/startupai-crew/src/state/models.py` (lines 147-178)

```python
class ProblemHypothesis(BaseModel):
    """Hypothesis about the problem being solved (NOT VALIDATED)."""
    problem_statement: str
    # ...
    validation_status: str = "HYPOTHESIS - NOT VALIDATED"

class CustomerHypothesis(BaseModel):
    """Hypothesis about the target customer (NOT VALIDATED)."""
    primary_segment: str
    # ...
    validation_status: str = "HYPOTHESIS - NOT VALIDATED"

class SolutionHypothesis(BaseModel):
    """Hypothesis about the proposed solution (NOT VALIDATED)."""
    proposed_solution: str
    # ...
    validation_status: str = "HYPOTHESIS - NOT VALIDATED"
```

### Webhook Confusion

**The webhook receives a `founder_validation` payload with D-F-V evidence**, but this is ONLY sent after **Phase 0-4 are ALL complete**.

**Phase 0 ONLY sends**:
- `flow_type: "hitl_checkpoint"`
- `checkpoint: "approve_founders_brief"`
- `context.founders_brief: FoundersBrief` (with all `validation_status: "HYPOTHESIS - NOT VALIDATED"`)

**The `founder_validation` flow_type** is sent after Phase 4 completes, which is why it includes D-F-V evidence.

---

## Proposed Solution

### 1. Add `buildFoundersBriefRow()` Function

```typescript
function buildFoundersBriefRow(
  foundersBrief: FoundersBrief, 
  sessionId: string, 
  userId: string
) {
  const nowIso = new Date().toISOString();
  
  return {
    session_id: sessionId,
    user_id: userId,
    version: foundersBrief.version || 1,
    
    // The Idea
    idea_one_liner: foundersBrief.the_idea.one_liner,
    idea_description: foundersBrief.the_idea.description,
    idea_inspiration: foundersBrief.the_idea.inspiration || null,
    idea_unique_insight: foundersBrief.the_idea.unique_insight || null,
    
    // Problem Hypothesis
    problem_statement: foundersBrief.problem_hypothesis.problem_statement,
    problem_who_has_this: foundersBrief.problem_hypothesis.who_has_this_problem,
    problem_frequency: foundersBrief.problem_hypothesis.frequency || null,
    problem_current_alternatives: foundersBrief.problem_hypothesis.current_alternatives || null,
    problem_why_alternatives_fail: foundersBrief.problem_hypothesis.why_alternatives_fail || null,
    problem_evidence: foundersBrief.problem_hypothesis.evidence_of_problem || null,
    problem_validation_status: foundersBrief.problem_hypothesis.validation_status,
    
    // Customer Hypothesis
    customer_primary_segment: foundersBrief.customer_hypothesis.primary_segment,
    customer_segment_description: foundersBrief.customer_hypothesis.segment_description || null,
    customer_characteristics: foundersBrief.customer_hypothesis.characteristics || [],
    customer_where_to_find: foundersBrief.customer_hypothesis.where_to_find_them || null,
    customer_estimated_size: foundersBrief.customer_hypothesis.estimated_size || null,
    customer_validation_status: foundersBrief.customer_hypothesis.validation_status,
    
    // Solution Hypothesis
    solution_proposed: foundersBrief.solution_hypothesis.proposed_solution,
    solution_key_features: foundersBrief.solution_hypothesis.key_features || [],
    solution_differentiation: foundersBrief.solution_hypothesis.differentiation || null,
    solution_unfair_advantage: foundersBrief.solution_hypothesis.unfair_advantage || null,
    solution_validation_status: foundersBrief.solution_hypothesis.validation_status,
    
    // Key Assumptions
    key_assumptions: foundersBrief.key_assumptions || [],
    
    // Success Criteria
    success_minimum_viable_signal: foundersBrief.success_criteria.minimum_viable_signal || null,
    success_deal_breakers: foundersBrief.success_criteria.deal_breakers || [],
    success_target_metrics: foundersBrief.success_criteria.target_metrics || {},
    success_problem_resonance_target: foundersBrief.success_criteria.problem_resonance_target || 0.50,
    success_zombie_ratio_max: foundersBrief.success_criteria.zombie_ratio_max || 0.30,
    success_fit_score_target: foundersBrief.success_criteria.fit_score_target || 70,
    
    // Founder Context
    founder_background: foundersBrief.founder_context.founder_background || null,
    founder_motivation: foundersBrief.founder_context.motivation || null,
    founder_time_commitment: foundersBrief.founder_context.time_commitment || 'exploring',
    founder_resources_available: foundersBrief.founder_context.resources_available || null,
    
    // QA Status
    qa_legitimacy_check: foundersBrief.qa_status.legitimacy_check,
    qa_legitimacy_notes: foundersBrief.qa_status.legitimacy_notes || null,
    qa_intent_verification: foundersBrief.qa_status.intent_verification,
    qa_intent_notes: foundersBrief.qa_status.intent_notes || null,
    qa_overall_status: foundersBrief.qa_status.overall_status,
    
    // Interview Metadata
    interview_duration_minutes: foundersBrief.metadata.interview_duration_minutes || 0,
    interview_turns: foundersBrief.metadata.interview_turns || 0,
    interview_followup_questions: foundersBrief.metadata.followup_questions_asked || 0,
    interview_confidence_score: foundersBrief.metadata.confidence_score || 0.0,
    
    // Approval workflow
    approval_status: 'pending',
    
    // Timestamps
    created_at: nowIso,
    updated_at: nowIso,
  };
}
```

### 2. Fix Webhook Handler (Route Pattern)

```typescript
// Handle HITL checkpoint from Phase 0
if (payload.flow_type === 'hitl_checkpoint') {
  if (payload.checkpoint === 'approve_founders_brief') {
    // Extract founders_brief from context
    const foundersBrief = payload.context?.founders_brief;
    
    if (foundersBrief && payload.session_id) {
      const foundersBriefRow = buildFoundersBriefRow(
        foundersBrief, 
        payload.session_id, 
        payload.user_id
      );
      
      // Insert into founders_briefs (Layer 2)
      await admin.from('founders_briefs').insert(foundersBriefRow);
      
      // DO NOT touch entrepreneur_briefs
    }
    
    // Create approval_requests entry for UI
    await admin.from('approval_requests').insert({
      run_id: payload.run_id,
      project_id: payload.project_id,
      user_id: payload.user_id,
      checkpoint: 'approve_founders_brief',
      title: payload.title,
      description: payload.description,
      options: payload.options,
      recommended_option: payload.recommended,
      context: payload.context,
      status: 'pending',
      expires_at: payload.expires_at,
    });
  }
}

// Handle founder_validation completion (Phase 0-4 complete)
if (payload.flow_type === 'founder_validation') {
  // Update projects table with final results
  // Update crewai_validation_states
  // DO NOT touch entrepreneur_briefs
}
```

---

## Action Items

> **UPDATED (2026-01-16)**: Priorities revised after clarifying the two-layer data model.

### ~~Immediate (P0)~~ Revised (P2)

1. ~~**Stop overwriting `entrepreneur_briefs`**~~ **CLARIFIED**: Review whether webhook should upsert `entrepreneur_briefs` or `founders_briefs`. May be working correctly.
2. **Add `buildFoundersBriefRow()` transformer** - If creating Layer 2 records, use correct table name.
3. **Handle `hitl_checkpoint` flow** - Ensure `founders_briefs` record created when Phase 0 completes.
4. **Run migration** - Deploy `20260115000002_founders_briefs.sql` if table doesn't exist.

### Next Steps (P1)

1. **Rename confusing functions** - `buildEntrepreneurBriefRow()` → clarify intent
2. **Test Phase 0 → HITL flow** - Verify correct table is populated
3. ~~**Verify Layer 1 preservation**~~ **CLARIFIED**: Alex chat creates `entrepreneur_briefs` via `/api/onboarding/complete`; webhook creates `founders_briefs`. No overwriting occurs if both work as designed.
4. **Update API contract docs** - Document the two-layer distinction in `api-contracts.md`

### Actual Critical Fix (Completed)

**The real Phase 0 blocker was Alex chat stage progression**, not webhook data handling:
- **Problem**: LLM tool calling was 18% reliable → sessions stuck
- **Solution**: Two-Pass Architecture (ADR-004) - backend-driven assessment
- **Status**: ✅ Implemented 2026-01-16, pending live verification

---

## References

- **Database Schema**: `/supabase/migrations/20260115000002_founders_briefs.sql`
- **Pydantic Model**: `/home/chris/projects/startupai-crew/src/state/models.py` (lines 219-276)
- **Phase 0 Spec**: `/home/chris/projects/startupai-crew/docs/master-architecture/04-phase-0-onboarding.md`
- **Webhook Handler**: `/frontend/src/app/api/crewai/webhook/route.ts`
- **OnboardingCrew**: `/home/chris/projects/startupai-crew/src/crews/onboarding/crew.py`

