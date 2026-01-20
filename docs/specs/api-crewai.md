---
purpose: "API specification for CrewAI/Modal integration routes (this repo's endpoints)"
status: "active"
last_reviewed: "2026-01-19"
architectural_pivot: "2026-01-19"
---

# CrewAI Integration API

> **Architectural Pivot (2026-01-19)**: Phase 0 was simplified to Quick Start. The `approve_founders_brief` checkpoint was replaced by `approve_discovery_output` in Phase 1. See [ADR-006](../../../startupai-crew/docs/adr/006-quick-start-architecture.md).

Implementation lives in `frontend/src/app/api/crewai/*/route.ts`. These routes handle communication between the product app and Modal serverless (CrewAI Flows).

## Source of Truth Split

| What | Where |
|------|-------|
| **Modal API endpoints** (`/kickoff`, `/status`, etc.) | `startupai-crew/docs/features/api-entrypoints.md` |
| **Webhook payload schemas** | `startupai-crew/docs/master-architecture/reference/api-contracts.md` |
| **This repo's webhook receiver** (`/api/crewai/webhook`) | This document |
| **This repo's status/resume routes** | This document |

> **Single Source of Truth**: Modal's API contract is authoritative in the crew repo. This document covers the *client-side integration* (how this app receives and processes Modal data).

## Overview

The CrewAI integration provides:
- Webhook receiver for Modal results
- Status polling for validation runs
- HITL checkpoint resumption
- Legacy webhook receivers (deprecated)

## Endpoint Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/crewai/webhook` | POST | Unified webhook for all Modal flow types |
| `/api/crewai/status` | GET | Poll validation run status |
| `/api/crewai/resume` | POST | Resume paused workflow after HITL |
| `/api/crewai/consultant` | POST | Legacy: Consultant onboarding webhook |
| `/api/crewai/results` | POST | Legacy: Founder validation webhook |

---

## Webhook Endpoint

### `/api/crewai/webhook`

**POST** - Unified webhook receiver for all Modal flow types.

#### Authentication

Requires Bearer token in Authorization header:
```
Authorization: Bearer <MODAL_AUTH_TOKEN>
```

The token is validated against `process.env.MODAL_AUTH_TOKEN`.

#### Request

All webhooks include a `flow_type` field that determines routing:

```jsonc
{
  "flow_type": "founder_validation" | "consultant_onboarding" | "progress_update" | "hitl_checkpoint",
  // ... flow-specific fields (NOT nested in "payload")
}
```

#### Flow Type: `founder_validation`

Persists validation results to multiple tables.

```jsonc
{
  "flow_type": "founder_validation",
  "project_id": "uuid",
  "user_id": "uuid",
  "run_id": "run_abc123",
  "session_id": "session_xyz",  // optional
  "validation_report": {
    "id": "report_id",
    "business_idea": "AI-powered validation platform",
    "validation_outcome": "Proceed with pivot to enterprise",
    "evidence_summary": "Strong problem resonance with target segment...",
    "pivot_recommendation": "Focus on B2B SaaS market",
    "next_steps": ["Conduct customer interviews", "Build MVP"]
  },
  "value_proposition_canvas": {
    "Enterprise Founders": {
      "customer_profile": {
        "jobs": [...],
        "pains": [...],
        "gains": [...]
      },
      "value_map": {
        "products_services": [...],
        "pain_relievers": [...],
        "gain_creators": [...]
      }
    }
  },
  "evidence": {
    "desirability": {
      "problem_resonance": 0.72,
      "conversion_rate": 0.15,
      "commitment_depth": "strong",
      "zombie_ratio": 0.1,
      "traffic_quality": "high",
      "key_learnings": ["..."],
      "tested_segments": ["..."],
      "impressions": 1000,
      "clicks": 150,
      "signups": 25,
      "spend_usd": 500,
      "experiments": [{ /* experiment data */ }]
    },
    "feasibility": {
      "core_features_feasible": { "feature1": "POSSIBLE", "feature2": "POSSIBLE" },
      "downgrade_required": false,
      "downgrade_impact": null,
      "api_costs": 50,
      "infra_costs": 100,
      "total_monthly_cost": 150
    },
    "viability": {
      "cac": 100,
      "ltv": 500,
      "ltv_cac_ratio": 5.0,
      "gross_margin": 0.7,
      "payback_months": 3,
      "break_even_customers": 50,
      "tam_usd": 10000000,
      "market_share_target": 0.01,
      "viability_assessment": "Profitable unit economics"
    }
  },
  "qa_report": {
    "status": "passed",
    "issues": [],
    "recommendations": [],
    "framework_compliance": 0.85,
    "logical_consistency": 0.9,
    "completeness": 0.8
  },
  "completed_at": "2026-01-18T12:00:00Z"
  // ... additional optional fields for full state persistence
}
```

**Tables Updated**:
- `reports` - Validation report with VPC data
- `evidence` - D-F-V evidence rows
- `crewai_validation_states` - Full validation state
- `public_activity_log` - Anonymized activity for marketing feed
- `projects` - Evidence count and status update

#### Flow Type: `consultant_onboarding`

Updates consultant profile with AI-generated analysis and recommendations.

```jsonc
{
  "flow_type": "consultant_onboarding",
  "consultant_id": "uuid",
  "session_id": "session_xyz",  // optional
  "practice_analysis": {
    "strengths": ["Strategic planning", "Go-to-market"],
    "gaps": ["Technical validation"],
    "positioning": "B2B SaaS specialist",
    "opportunities": ["Expand to fintech vertical"],
    "client_profile": "Series A startups"
  },
  "recommendations": ["Focus on 10-50 employee startups", "..."],
  "onboarding_tips": ["Complete your practice profile", "..."],
  "suggested_templates": ["startup-validation-checklist", "..."],
  "suggested_workflows": ["client-intake-flow", "..."],
  "white_label_suggestions": { /* branding recommendations */ },
  "completed_at": "2026-01-18T12:00:00Z"
}
```

**Tables Updated**:
- `consultant_profiles` - AI analysis fields:
  - `ai_practice_analysis`
  - `ai_recommendations`
  - `ai_onboarding_tips`
  - `ai_suggested_templates`
  - `ai_suggested_workflows`
  - `ai_white_label_suggestions`
  - `ai_analysis_completed`
  - `ai_analysis_completed_at`

#### Flow Type: `progress_update`

Updates validation run status and appends to progress table (Realtime enabled).

```jsonc
{
  "flow_type": "progress_update",
  "run_id": "run_xyz789",
  "project_id": "uuid",    // optional
  "user_id": "uuid",       // optional
  "status": "running",     // pending | running | paused | completed | failed
  "current_phase": 2,
  "phase_name": "Desirability Validation",
  "progress": {
    "crew": "Growth Crew",
    "task": "Run ad experiments",
    "agent": "Pulse",
    "progress_pct": 45
  },
  "error": null,           // error message if failed
  "timestamp": "2026-01-18T12:00:00Z"
}
```

**Tables Updated**:
- `validation_runs` - Status, phase, progress, error
- `validation_progress` - Append-only log (Realtime subscription triggers UI update)

#### Flow Type: `hitl_checkpoint`

Creates approval request for human review and pauses workflow.

```jsonc
{
  "flow_type": "hitl_checkpoint",
  "run_id": "run_xyz789",
  "project_id": "uuid",
  "user_id": "uuid",
  "checkpoint": "approve_discovery_output",  // checkpoint name
  "title": "Review Discovery Outputs",
  "description": "Review AI-generated Founder's Brief and VPC before proceeding.",
  "options": [
    { "id": "approved", "label": "Approve", "description": "Proceed with validation" },
    { "id": "rejected", "label": "Reject", "description": "Request revisions" },
    { "id": "iterate", "label": "Iterate", "description": "Gather more information" }
  ],
  "recommended": "approved",  // optional: suggested option
  "context": {
    // Checkpoint-specific data for UI display
    "founders_brief": { /* AI-generated from Phase 1 research */ },
    "value_proposition_canvas": { /* VPC data */ },
    "raw_idea": "Original user input from Quick Start"
  },
  "expires_at": "2026-01-25T12:00:00Z",  // optional
  "timestamp": "2026-01-18T12:00:00Z"
}
```

**Checkpoint Names**:
- `approve_discovery_output` - Phase 1: Combined Brief + VPC approval (replaces `approve_founders_brief` + `approve_vpc_completion`)
- `approve_experiment_plan` - Phase 1: Experiment plan
- `approve_pricing_test` - Phase 1: Pricing test
- `approve_campaign_launch` - Phase 2: Marketing campaign
- `approve_spend_increase` - Phase 2: Budget increase
- `approve_desirability_gate` - Phase 2: Desirability gate
- `approve_feasibility_gate` - Phase 3: Feasibility gate
- `approve_viability_gate` - Phase 4: Viability gate
- `approve_pivot` - Pivot recommendation
- `approve_proceed` - Final proceed decision
- `request_human_decision` - Generic human decision request

**Deprecated Checkpoints** (removed by Quick Start pivot):
- ~~`approve_founders_brief`~~ - Removed (Phase 0 has no HITL)
- ~~`approve_vpc_completion`~~ - Combined into `approve_discovery_output`

**Tables Updated**:
- `validation_runs` - Status set to `paused`, `hitl_checkpoint` stored
- `approval_requests` - New approval request created
- `validation_progress` - Progress entry with `status: paused`
- `entrepreneur_briefs` - Created for `approve_discovery_output` checkpoint (AI-generated in Phase 1)

#### Response

Responses vary by flow type:

**founder_validation**:
```jsonc
{
  "success": true,
  "flow_type": "founder_validation",
  "report_id": "uuid",
  "evidence_created": 4,
  "validation_state_id": "uuid",
  "activities_created": 5,
  "message": "Founder validation results persisted successfully"
}
```

**consultant_onboarding**:
```jsonc
{
  "success": true,
  "flow_type": "consultant_onboarding",
  "consultant_id": "uuid",
  "recommendations_stored": 5,
  "templates_suggested": 3,
  "message": "Consultant onboarding results stored successfully"
}
```

**progress_update**:
```jsonc
{
  "success": true,
  "flow_type": "progress_update",
  "run_id": "run_xyz789",
  "message": "Progress update recorded"
}
```

**hitl_checkpoint**:
```jsonc
{
  "success": true,
  "flow_type": "hitl_checkpoint",
  "run_id": "run_xyz789",
  "checkpoint": "approve_discovery_output",
  "approval_request_id": "uuid",
  "message": "HITL checkpoint recorded and approval request created"
}
```

#### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Missing or invalid bearer token |
| 400 | Missing flow_type or invalid payload |
| 404 | Project/consultant not found |
| 403 | User ID mismatch with project owner |
| 500 | Database write failed |

---

## Status Endpoint

### `/api/crewai/status`

**GET** - Poll status of a validation run.

#### Query Parameters

- `run_id` (required): The Modal run ID

#### Response

```jsonc
{
  "run_id": "run_xyz789",
  "provider": "modal",
  "status": "running",           // pending | running | paused | completed | failed
  "state": "RUNNING",            // Legacy uppercase format
  "current_phase": 2,
  "phase_name": "Desirability Validation",
  "progress": 45,                // Overall progress percentage
  "current_agent": "Pulse",      // Current crew/agent
  "hitl_checkpoint": null,       // HITL data if paused
  "outputs": null,               // Results if completed
  "error": null,                 // Error message if failed
  "approval_id": null            // Approval request ID if HITL paused
}
```

#### Notes

- Fetches live status from Modal, updates local `validation_runs` cache
- If HITL checkpoint exists, looks up associated `approval_id` for the UI
- Falls back to cached status if Modal unreachable

---

## Resume Endpoint

### `/api/crewai/resume`

**POST** - Resume a paused workflow after HITL checkpoint.

This is a fallback endpoint when no `approval_id` is available. The preferred path is through `/api/approvals/[id]` which provides a full audit trail.

#### Request

```jsonc
{
  "run_id": "run_xyz789",
  "checkpoint": "approve_discovery_output",
  "decision": "approved",   // any string: approved, rejected, iterate, segment_1, etc.
  "feedback": "Looks good"  // optional
}
```

#### Response

```jsonc
{
  "success": true,
  "message": "Workflow resumed successfully",
  "result": { /* Modal response */ }
}
```

#### Behaviour

1. Authenticates user via cookies
2. Validates request against schema
3. Updates any pending `approval_requests` for this run_id + checkpoint
4. Creates `approval_history` entry (marks `via: 'resume_endpoint'`)
5. Calls Modal HITL approve endpoint

#### Errors

| Status | Description |
|--------|-------------|
| 401 | Unauthorized |
| 400 | Invalid request body |
| 502 | Modal resume failed |
| 503 | MODAL_HITL_APPROVE_URL not configured |

---

## Legacy Endpoints

### `/api/crewai/consultant` (DEPRECATED)

**POST** - Legacy webhook for consultant onboarding results.

Use `/api/crewai/webhook` with `flow_type: "consultant_onboarding"` instead.

#### Request

Same schema as `consultant_onboarding` flow type, but without `flow_type` field:

```jsonc
{
  "consultant_id": "uuid",
  "session_id": "session_xyz",
  "practice_analysis": { /* ... */ },
  "recommendations": [...],
  "onboarding_tips": [...],
  "suggested_templates": [...],
  "suggested_workflows": [...],
  "white_label_suggestions": {},
  "completed_at": "2026-01-18T12:00:00Z"
}
```

#### Response

```jsonc
{
  "success": true,
  "consultant_id": "uuid",
  "recommendations_stored": 5,
  "templates_suggested": 3,
  "message": "Consultant onboarding results stored successfully"
}
```

---

### `/api/crewai/results` (DEPRECATED)

**POST** - Legacy webhook for founder validation results.

Use `/api/crewai/webhook` with `flow_type: "founder_validation"` instead.

#### Request

Similar to `founder_validation` flow type but with slightly different schema:

```jsonc
{
  "project_id": "uuid",
  "user_id": "uuid",
  "run_id": "run_xyz789",          // or "kickoff_id"
  "session_id": "session_xyz",
  "validation_report": { /* ... */ },
  "value_proposition_canvas": { /* ... */ },
  "evidence": {
    "desirability": { /* ... */ },
    "feasibility": { /* ... */ },
    "viability": { /* ... */ }
  },
  "qa_report": { /* ... */ },
  "completed_at": "2026-01-18T12:00:00Z"
}
```

#### Response

```jsonc
{
  "success": true,
  "report_id": "uuid",
  "evidence_created": 4,
  "message": "Results persisted successfully"
}
```

---

## Webhook Dispatcher Architecture

The webhook handler (`/api/crewai/webhook/route.ts`) uses a switch-case dispatcher:

```typescript
type FlowType = 'founder_validation' | 'consultant_onboarding' | 'progress_update' | 'hitl_checkpoint';

switch (flowType) {
  case 'founder_validation':
    return await handleFounderValidation(validation.data);
  case 'consultant_onboarding':
    return await handleConsultantOnboarding(validation.data);
  case 'progress_update':
    return await handleProgressUpdate(validation.data);
  case 'hitl_checkpoint':
    return await handleHITLCheckpoint(validation.data);
}
```

Each flow type has its own Zod schema for validation.

## D-F-V Signal Mapping

CrewAI outputs map to D-F-V (Desirability-Feasibility-Viability) signals:

| Signal | Source Agent | Data |
|--------|--------------|------|
| Desirability | Pulse (CMO), Compass (CPO) | Market demand, customer validation |
| Feasibility | Forge (CTO), Guardian (CGO) | Technical assessment, risk analysis |
| Viability | Ledger (CFO), Sage (CSO) | Unit economics, strategic fit |

## Error Handling

### Idempotency

Some webhooks implement idempotency checks:
- `founder_validation`: Checks `public_activity_log.kickoff_id` before inserting duplicate activities
- `hitl_checkpoint`: Checks existing `approval_requests` before creating duplicates

### Retry Logic

Modal retries failed webhooks with exponential backoff:
- Initial retry: 1 second
- Max retries: 5
- Max delay: 60 seconds

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `MODAL_AUTH_TOKEN` | Bearer token for webhook authentication |
| `MODAL_HITL_APPROVE_URL` | Modal endpoint for resuming HITL workflows |

## Related Documentation

- **Master API Contracts**: `startupai-crew/docs/master-architecture/reference/api-contracts.md`
- **Modal Configuration**: `startupai-crew/docs/master-architecture/reference/modal-configuration.md`
- **Approvals API**: [api-approvals.md](api-approvals.md)
- **Architecture**: [architecture.md](architecture.md)
