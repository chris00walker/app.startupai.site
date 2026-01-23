---
purpose: "HITL checkpoint stories for human-in-the-loop approval patterns"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
checkpoints: 10
pattern: "Modal checkpoint-and-resume"
---

# HITL Checkpoint Stories (US-AH)

Stories for all 10 human-in-the-loop checkpoints in the validation system.

**Pattern**: Modal serverless checkpoint-and-resume ($0 cost during human review)
**Spec Reference**: `reference/approval-workflows.md`

---

## Overview

| ID | Checkpoint | Phase | Trigger | Blocking |
|----|------------|-------|---------|----------|
| US-AH01 | approve_brief | 1A | Brief generated | Yes |
| US-AH02 | approve_experiment_plan | 1B | Test cards ready | Yes |
| US-AH03 | approve_pricing_test | 1B | WTP experiment planned | Yes |
| US-AH04 | approve_discovery_output | 1B | VPC complete, fit >= 70 | Yes |
| US-AH05 | approve_campaign_launch | 2 | Ads ready | Yes |
| US-AH06 | approve_spend_increase | 2 | Budget threshold | Yes |
| US-AH07 | approve_desirability_gate | 2 | D signal ready | Yes |
| US-AH08 | approve_feasibility_gate | 3 | F signal ready | Yes |
| US-AH09 | approve_viability_gate | 4 | V signal ready | Yes |
| US-AH10 | request_human_decision | 4 | Final synthesis ready | Yes |

---

### US-AH01: Approve Founder's Brief

**As a** founder reviewing AI-generated output,
**I want to** review and optionally edit the Founder's Brief before VPC discovery,
**So that** the discovery foundation accurately represents my idea.

---

### Checkpoint Specification

| Property | Value |
|----------|-------|
| Checkpoint Type | `approve_brief` |
| Phase | 1A (Brief Generation) |
| Triggering Agent | S1 (Brief Compiler) |
| Editable | Yes - all brief fields |
| Timeout | 30 days |

---

### Business Acceptance Criteria

**Given** BriefGenerationCrew completes
**When** `approve_brief` checkpoint triggers
**Then**:
- `hitl_requests` INSERT with `checkpoint_type='approve_brief'`
- `validation_runs.status` = 'paused'
- `validation_runs.hitl_state` = 'approve_brief'
- Modal container terminates ($0 cost)

**Given** brief is displayed in approval UI
**When** user reviews the content
**Then**:
- All brief fields are editable inline
- Provenance markers show AI vs user input
- Changes are tracked with `edited_by` and `original_value`

**Given** user approves (with or without edits)
**When** approval is submitted
**Then**:
- `hitl_requests.status` = 'approved'
- `validation_runs.status` = 'running'
- `validation_runs.hitl_state` = null
- New Modal container spawns and resumes

---

### State Schema

```python
# hitl_requests table
{
    "id": "uuid",
    "run_id": "uuid",
    "checkpoint_type": "approve_brief",
    "status": "pending",  # → approved | rejected
    "payload": {
        "founders_brief": { ... }
    },
    "user_edits": { ... },  # Tracked changes
    "feedback": null,  # Optional rejection feedback
    "created_at": "timestamp",
    "resolved_at": null
}
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/35-agent-hitl-checkpoints.spec.ts` |
| API | `frontend/src/app/api/hitl/approve/route.ts` |
| Component | `frontend/src/components/approvals/BriefApprovalModal.tsx` |
| Hook | `frontend/src/hooks/useHITLApproval.ts` |

---

### US-AH02: Approve Experiment Plan

**As a** founder reviewing discovery experiments,
**I want to** approve or modify the experiment plan before execution,
**So that** I control what tests are run on my behalf.

---

### Checkpoint Specification

| Property | Value |
|----------|-------|
| Checkpoint Type | `approve_experiment_plan` |
| Phase | 1B (VPC Discovery) |
| Triggering Agent | E1 (Experiment Designer) |
| Editable | Yes - can remove/modify tests |
| Timeout | 7 days |

---

### Business Acceptance Criteria

**Given** E1 generates Test Cards
**When** `approve_experiment_plan` checkpoint triggers
**Then**:
- `hitl_requests` INSERT with `checkpoint_type='approve_experiment_plan'`
- Payload includes all Test Card details
- User can approve all, approve subset, or reject

**Given** user reviews experiment plan
**When** modifying individual experiments
**Then**:
- Can remove specific experiments
- Can adjust success thresholds
- Can add comments/constraints
- Cannot add new experiments (requires re-generation)

---

### State Schema

```python
# Payload structure
{
    "experiment_plan": {
        "test_cards": [
            {
                "id": "tc_001",
                "hypothesis": "...",
                "method": "survey",
                "metric": "response_rate",
                "threshold": 0.3,
                "approved": true  # User decision
            }
        ],
        "total_budget": 500.00,
        "timeline_days": 14
    }
}
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/35-agent-hitl-checkpoints.spec.ts` |
| Component | `frontend/src/components/approvals/ExperimentPlanModal.tsx` |

---

### US-AH03: Approve Pricing Test

**As a** founder authorizing payment experiments,
**I want to** explicitly approve any test involving real money,
**So that** financial commitments are under my control.

---

### Checkpoint Specification

| Property | Value |
|----------|-------|
| Checkpoint Type | `approve_pricing_test` |
| Phase | 1B (VPC Discovery) |
| Triggering Agent | W1 (Pricing Experiment) |
| Editable | Yes - price points |
| Timeout | 7 days |

---

### Business Acceptance Criteria

**Given** W1 plans a pricing experiment with real payment
**When** `approve_pricing_test` checkpoint triggers
**Then**:
- Clear disclosure: "This test will collect real payments"
- Payment processor configuration shown
- Refund policy displayed
- Maximum collection amount stated

**Given** user reviews pricing test
**When** approving with modifications
**Then**:
- Can adjust price points
- Can cap total collection
- Can require refund window
- Cannot bypass payment authorization

---

### State Schema

```python
{
    "pricing_test": {
        "price_points": [9.99, 19.99, 29.99],
        "max_collection": 500.00,
        "refund_window_days": 30,
        "payment_processor": "stripe",
        "requires_real_payment": true
    }
}
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/35-agent-hitl-checkpoints.spec.ts` |
| Component | `frontend/src/components/approvals/PricingTestModal.tsx` |

---

### US-AH04: Approve Discovery Output

**As a** founder reviewing Phase 1 results,
**I want to** review the complete VPC and fit assessment before Phase 2,
**So that** I'm confident in the foundation before investing in ads.

---

### Checkpoint Specification

| Property | Value |
|----------|-------|
| Checkpoint Type | `approve_discovery_output` |
| Phase | 1B (VPC Discovery) |
| Triggering Agent | FIT_SCORE (Fit Analyst) |
| Editable | No - read-only review |
| Timeout | 30 days |

---

### Business Acceptance Criteria

**Given** fit_score >= 70 and VPC is complete
**When** `approve_discovery_output` checkpoint triggers
**Then**:
- Full VPC canvas displayed (Customer Profile + Value Map)
- Fit score with breakdown shown
- Evidence summary with SAY/DO alignment
- Brief (with any Stage A edits) displayed

**Given** user reviews discovery output
**When** making decision
**Then**:
- **Approve**: Proceed to Phase 2
- **Reject (Request Changes)**: Return to Stage A for brief edits
- **Reject (Request Research)**: Re-run discovery with feedback

---

### State Schema

```python
{
    "discovery_output": {
        "founders_brief": { ... },
        "customer_profile": { ... },
        "value_map": { ... },
        "fit_assessment": {
            "fit_score": 75,
            "fit_status": "moderate",
            "gate_ready": true
        }
    }
}
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/35-agent-hitl-checkpoints.spec.ts` |
| Component | `frontend/src/components/approvals/DiscoveryOutputModal.tsx` |

---

### US-AH05: Approve Campaign Launch

**As a** founder authorizing public marketing,
**I want to** review ad creatives before they go live,
**So that** my brand is protected and messaging is accurate.

---

### Checkpoint Specification

| Property | Value |
|----------|-------|
| Checkpoint Type | `approve_campaign_launch` |
| Phase | 2 (Desirability) |
| Triggering Agent | P1 (Ad Creative) |
| Editable | Yes - copy and targeting |
| Timeout | 7 days |

---

### Business Acceptance Criteria

**Given** P1 generates ad creatives
**When** `approve_campaign_launch` checkpoint triggers
**Then**:
- All ad variants displayed with previews
- Targeting configuration shown
- Initial budget clearly stated
- Platform (Meta/Google) indicated

**Given** user reviews ad campaign
**When** approving with modifications
**Then**:
- Can edit ad copy (within platform limits)
- Can adjust targeting parameters
- Can reduce initial budget
- Cannot increase budget without separate approval

---

### State Schema

```python
{
    "campaign": {
        "platform": "meta",
        "ad_variants": [
            {
                "headline": "...",
                "description": "...",
                "cta": "Learn More"
            }
        ],
        "targeting": { ... },
        "initial_budget": 100.00,
        "daily_cap": 20.00
    }
}
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/35-agent-hitl-checkpoints.spec.ts` |
| Component | `frontend/src/components/approvals/CampaignLaunchModal.tsx` |

---

### US-AH06: Approve Spend Increase

**As a** founder managing budget,
**I want to** approve any increase in ad spend beyond initial allocation,
**So that** costs remain under my control.

---

### Checkpoint Specification

| Property | Value |
|----------|-------|
| Checkpoint Type | `approve_spend_increase` |
| Phase | 2 (Desirability) |
| Triggering Agent | P2 (Communications) |
| Editable | Yes - amount |
| Timeout | 24 hours |

---

### Business Acceptance Criteria

**Given** campaign is performing well
**When** P2 recommends budget increase
**Then**:
- Current spend vs allocation shown
- Performance metrics displayed
- Recommended increase with rationale
- Comparison to original budget

**Given** user reviews spend increase
**When** making decision
**Then**:
- Can approve full amount
- Can approve partial amount
- Can reject (campaign continues at current level)
- Approval logged for audit

---

### State Schema

```python
{
    "spend_increase": {
        "current_spend": 80.00,
        "current_allocation": 100.00,
        "requested_increase": 150.00,
        "new_total": 250.00,
        "performance_summary": {
            "ctr": 0.025,
            "cpc": 0.80,
            "conversions": 12
        },
        "rationale": "CTR above benchmark, scaling opportunity"
    }
}
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/35-agent-hitl-checkpoints.spec.ts` |
| Component | `frontend/src/components/approvals/SpendIncreaseModal.tsx` |

---

### US-AH07: Approve Desirability Gate

**As a** founder evaluating Phase 2 results,
**I want to** review desirability signal before proceeding to feasibility,
**So that** I don't invest in building something people don't want.

---

### Checkpoint Specification

| Property | Value |
|----------|-------|
| Checkpoint Type | `approve_desirability_gate` |
| Phase | 2 (Desirability) |
| Triggering Agent | G1 (QA Agent) |
| Editable | No - decision only |
| Timeout | 30 days |

---

### Business Acceptance Criteria

**Given** desirability signal is calculated
**When** `approve_desirability_gate` checkpoint triggers
**Then**:
- Signal strength clearly displayed (WEAK/MODERATE/STRONG)
- Campaign metrics shown
- Landing page performance shown
- Conversion funnel visualized

**Decision Options by Signal:**
- STRONG_COMMITMENT → Proceed to Phase 3
- MILD_INTEREST → Value pivot recommended
- NO_INTEREST → Segment pivot recommended

---

### State Schema

```python
{
    "desirability_gate": {
        "signal": "STRONG_COMMITMENT",
        "metrics": {
            "impressions": 10000,
            "clicks": 350,
            "signups": 75,
            "conversion_rate": 0.021
        },
        "recommendation": "proceed"
    }
}
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/35-agent-hitl-checkpoints.spec.ts` |
| Component | `frontend/src/components/approvals/GateApprovalModal.tsx` |

---

### US-AH08: Approve Feasibility Gate

**As a** founder evaluating technical feasibility,
**I want to** review feasibility assessment before viability analysis,
**So that** I understand technical constraints and costs.

---

### Checkpoint Specification

| Property | Value |
|----------|-------|
| Checkpoint Type | `approve_feasibility_gate` |
| Phase | 3 (Feasibility) |
| Triggering Agent | G1 (QA Agent) |
| Editable | No - decision only |
| Timeout | 30 days |

---

### Business Acceptance Criteria

**Given** feasibility signal is calculated
**When** `approve_feasibility_gate` checkpoint triggers
**Then**:
- Signal displayed (GREEN/ORANGE/RED)
- Cost estimates shown
- Timeline estimates shown
- Technical risks listed

**Decision Options by Signal:**
- GREEN → Proceed to Phase 4
- ORANGE_CONSTRAINED → Feature downgrade required
- RED_IMPOSSIBLE → Major scope change or kill

---

### State Schema

```python
{
    "feasibility_gate": {
        "signal": "GREEN",
        "costs": {
            "monthly_api": 150.00,
            "monthly_infra": 50.00
        },
        "timeline": {
            "mvp_weeks": 8,
            "full_weeks": 16
        },
        "risks": []
    }
}
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/35-agent-hitl-checkpoints.spec.ts` |
| Component | `frontend/src/components/approvals/GateApprovalModal.tsx` |

---

### US-AH09: Approve Viability Gate

**As a** founder evaluating financial viability,
**I want to** review unit economics before final decision,
**So that** I understand the business case.

---

### Checkpoint Specification

| Property | Value |
|----------|-------|
| Checkpoint Type | `approve_viability_gate` |
| Phase | 4 (Viability) |
| Triggering Agent | L3 (Economics Reviewer) |
| Editable | No - decision only |
| Timeout | 30 days |

---

### Business Acceptance Criteria

**Given** viability signal is calculated
**When** `approve_viability_gate` checkpoint triggers
**Then**:
- Signal displayed (PROFITABLE/MARGINAL/UNDERWATER)
- LTV/CAC ratio shown with benchmark
- Payback period calculated
- Compliance requirements listed

**Decision Options by Signal:**
- PROFITABLE → Proceed to final decision
- MARGINAL → Optimization recommended
- UNDERWATER → Strategic pivot required

---

### State Schema

```python
{
    "viability_gate": {
        "signal": "PROFITABLE",
        "unit_economics": {
            "cac": 15.00,
            "ltv": 75.00,
            "ltv_cac_ratio": 5.0,
            "payback_months": 3
        },
        "compliance": {
            "requirements": [],
            "estimated_cost": 0
        }
    }
}
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/35-agent-hitl-checkpoints.spec.ts` |
| Component | `frontend/src/components/approvals/GateApprovalModal.tsx` |

---

### US-AH10: Request Human Decision

**As a** founder completing validation,
**I want to** make an informed final decision on my startup,
**So that** I can proceed, pivot, or stop with confidence.

---

### Checkpoint Specification

| Property | Value |
|----------|-------|
| Checkpoint Type | `request_human_decision` |
| Phase | 4 (Viability) |
| Triggering Agent | C2 (Human Approval) |
| Editable | No - decision only |
| Timeout | 90 days |

---

### Business Acceptance Criteria

**Given** evidence synthesis is complete
**When** `request_human_decision` checkpoint triggers
**Then**:
- Full validation journey summarized
- All three signals (D-F-V) displayed
- Key learnings highlighted
- Decision options with implications

**Decision Options:**
1. **Proceed** - Start MVP development
2. **Pivot** - Address specific weakness
3. **Stop** - Archive and capture learnings

**Given** user makes final decision
**When** decision is submitted
**Then**:
- `validation_runs.final_decision` recorded
- `validation_runs.decision_rationale` captured
- `validation_runs.status` = 'completed'
- Learnings persisted to flywheel

---

### State Schema

```python
{
    "final_decision_request": {
        "evidence_synthesis": { ... },
        "recommendation": "proceed",
        "decision_options": [
            {
                "option": "proceed",
                "description": "Move to MVP development",
                "next_steps": ["Define MVP scope", "Hire developer", "Set timeline"]
            },
            {
                "option": "pivot_value",
                "description": "Retest with different value proposition",
                "next_steps": ["Revisit Value Map", "Run new experiments"]
            },
            {
                "option": "stop",
                "description": "Archive project",
                "next_steps": ["Capture learnings", "Document insights"]
            }
        ]
    }
}
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/35-agent-hitl-checkpoints.spec.ts` |
| Component | `frontend/src/components/approvals/FinalDecisionModal.tsx` |

---

## Summary

| ID | Checkpoint | Phase | Editable | Timeout |
|----|------------|-------|----------|---------|
| US-AH01 | approve_brief | 1A | Yes | 30 days |
| US-AH02 | approve_experiment_plan | 1B | Yes | 7 days |
| US-AH03 | approve_pricing_test | 1B | Yes | 7 days |
| US-AH04 | approve_discovery_output | 1B | No | 30 days |
| US-AH05 | approve_campaign_launch | 2 | Yes | 7 days |
| US-AH06 | approve_spend_increase | 2 | Yes | 24 hours |
| US-AH07 | approve_desirability_gate | 2 | No | 30 days |
| US-AH08 | approve_feasibility_gate | 3 | No | 30 days |
| US-AH09 | approve_viability_gate | 4 | No | 30 days |
| US-AH10 | request_human_decision | 4 | No | 90 days |

---

**Related Documents:**
- [approval-workflows.md](../../../../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) - Complete HITL patterns
- [database-schemas.md](../../../../../startupai-crew/docs/master-architecture/reference/database-schemas.md) - hitl_requests table
- [ADR-002](../../../../../startupai-crew/docs/master-architecture/adr/002-modal-serverless-migration.md) - Checkpoint-and-resume pattern

---

**Last Updated**: 2026-01-23
