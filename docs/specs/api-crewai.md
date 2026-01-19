---
purpose: "API specification for CrewAI/Modal integration routes"
status: "active"
last_reviewed: "2026-01-18"
---

# CrewAI Integration API

Implementation lives in `frontend/src/app/api/crewai/*/route.ts`. These routes handle communication between the product app and Modal serverless (CrewAI Flows).

> **Source of Truth**: See `startupai-crew/docs/master-architecture/reference/api-contracts.md` for full payload schemas.

## Overview

The CrewAI integration provides:
- Webhook receiver for Modal results
- Status polling for validation runs
- HITL checkpoint resumption
- Results retrieval

## Endpoint Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/crewai/webhook` | POST | Receive results from Modal |
| `/api/crewai/status` | GET | Check validation run status |
| `/api/crewai/resume` | POST | Resume paused workflow |
| `/api/crewai/consultant` | POST | Consultant-specific kickoff |
| `/api/crewai/results` | GET | Fetch validation results |

---

## Webhook Endpoint

### `/api/crewai/webhook`

**POST** - Receive webhook payloads from Modal serverless.

#### Authentication

Requires Bearer token in Authorization header:
```
Authorization: Bearer <MODAL_AUTH_TOKEN>
```

The token is validated against `process.env.MODAL_AUTH_TOKEN` (or `CREW_CONTRACT_BEARER`).

#### Request

All webhooks include a `flow_type` field that determines routing:

```jsonc
{
  "flow_type": "founder_validation" | "consultant_onboarding" | "progress_update" | "hitl_checkpoint",
  "project_id": "proj_abc123",
  "run_id": "run_xyz789",
  "timestamp": "2026-01-18T12:00:00Z",
  "payload": { /* varies by flow_type */ }
}
```

#### Flow Type: `founder_validation`

Persists validation results to 4 tables:

```jsonc
{
  "flow_type": "founder_validation",
  "project_id": "proj_abc123",
  "payload": {
    "founders_brief": { /* Layer 2 brief */ },
    "evidence": [{ /* validation evidence items */ }],
    "experiments": [{ /* proposed experiments */ }],
    "cost_analysis": { /* unit economics */ },
    "dfv_signals": {
      "desirability": 0.72,
      "feasibility": 0.68,
      "viability": 0.65
    }
  }
}
```

**Tables Updated**:
- `founders_briefs` - Layer 2 validated brief
- `evidence` - Validation evidence with embeddings
- `experiments` - Proposed experiments
- `cost_analysis` - Unit economics data

#### Flow Type: `consultant_onboarding`

Updates consultant profile from analysis:

```jsonc
{
  "flow_type": "consultant_onboarding",
  "user_id": "user_abc123",
  "payload": {
    "practice_analysis": { /* AI analysis of consultant practice */ },
    "specializations": ["startup-strategy", "go-to-market"],
    "industries": ["saas", "fintech"]
  }
}
```

**Tables Updated**:
- `consultant_profiles`

#### Flow Type: `progress_update`

Appends progress to validation_progress (Realtime enabled):

```jsonc
{
  "flow_type": "progress_update",
  "run_id": "run_xyz789",
  "payload": {
    "phase": "phase_1",
    "step": "market_research",
    "progress_pct": 45,
    "message": "Analyzing competitor landscape...",
    "agent": "Sage" // which AI Founder is working
  }
}
```

**Tables Updated**:
- `validation_progress` (Realtime subscription triggers UI update)

#### Flow Type: `hitl_checkpoint`

Creates approval request for human review:

```jsonc
{
  "flow_type": "hitl_checkpoint",
  "run_id": "run_xyz789",
  "payload": {
    "checkpoint_name": "market_validation_review",
    "approval_type": "evidence_review",
    "owner_role": "founder",
    "data": { /* data for review */ },
    "resume_url": "https://modal.run/resume/xyz789",
    "low_risk": false // if true, may auto-approve
  }
}
```

**Tables Updated**:
- `approval_requests`

#### Response

```jsonc
{
  "success": true,
  "processed": true,
  "tables_updated": ["founders_briefs", "evidence"]
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid bearer token |
| 400 | `INVALID_PAYLOAD` | Malformed webhook payload |
| 404 | `PROJECT_NOT_FOUND` | Project ID doesn't exist |
| 500 | `PERSISTENCE_ERROR` | Database write failed |

---

## Status Endpoint

### `/api/crewai/status`

**GET** - Check status of a validation run.

#### Query Parameters

- `runId` (required): The Modal run ID
- `projectId` (optional): Filter by project

#### Response

```jsonc
{
  "success": true,
  "status": "running" | "paused" | "completed" | "failed",
  "phase": "phase_2",
  "progress_pct": 65,
  "current_agent": "Forge",
  "checkpoints_pending": 1,
  "started_at": "2026-01-18T10:00:00Z",
  "estimated_completion": "2026-01-18T10:45:00Z"
}
```

---

## Resume Endpoint

### `/api/crewai/resume`

**POST** - Resume a paused workflow after HITL approval.

#### Request

```jsonc
{
  "runId": "run_xyz789",
  "approvalId": "appr_abc123",
  "decision": "approve" | "reject" | "revise",
  "feedback": "Looks good, proceed with experiments" // optional
}
```

#### Response

```jsonc
{
  "success": true,
  "resumed": true,
  "next_phase": "phase_3"
}
```

---

## Consultant Kickoff

### `/api/crewai/consultant`

**POST** - Trigger consultant-specific analysis workflow.

#### Request

```jsonc
{
  "sessionId": "cons_abc123",
  "analysisType": "practice_validation"
}
```

#### Response

```jsonc
{
  "success": true,
  "runId": "run_xyz789",
  "estimatedDuration": 15 // minutes
}
```

---

## Results Endpoint

### `/api/crewai/results`

**GET** - Fetch completed validation results.

#### Query Parameters

- `projectId` (required): The project ID
- `runId` (optional): Specific run
- `include` (optional): Comma-separated list: `brief,evidence,experiments,costs`

#### Response

```jsonc
{
  "success": true,
  "results": {
    "run_id": "run_xyz789",
    "completed_at": "2026-01-18T11:00:00Z",
    "founders_brief": { /* Layer 2 brief */ },
    "dfv_scores": {
      "desirability": 0.72,
      "feasibility": 0.68,
      "viability": 0.65,
      "overall": 0.68
    },
    "evidence_count": 12,
    "experiments_suggested": 3,
    "next_steps": ["Conduct customer interviews", "Build MVP prototype"]
  }
}
```

---

## Webhook Dispatcher Architecture

The webhook handler (`/api/crewai/webhook/route.ts`) uses a dispatcher pattern:

```typescript
const handlers: Record<FlowType, WebhookHandler> = {
  founder_validation: handleFounderValidation,
  consultant_onboarding: handleConsultantOnboarding,
  progress_update: handleProgressUpdate,
  hitl_checkpoint: handleHITLCheckpoint,
};

// Route to appropriate handler
const handler = handlers[payload.flow_type];
await handler(payload, supabase);
```

## D-F-V Signal Mapping

CrewAI outputs map to D-F-V (Desirability-Feasibility-Viability) signals:

| Signal | Source Agent | Data |
|--------|--------------|------|
| Desirability | Pulse (CMO), Compass (CPO) | Market demand, customer validation |
| Feasibility | Forge (CTO), Guardian (CGO) | Technical assessment, risk analysis |
| Viability | Ledger (CFO), Sage (CSO) | Unit economics, strategic fit |

## Error Handling

### Idempotency

Webhooks are idempotent - reprocessing the same payload won't duplicate data:
- Uses `run_id` + `flow_type` as idempotency key
- Checks for existing records before insert
- Returns success even if already processed

### Retry Logic

Modal retries failed webhooks with exponential backoff:
- Initial retry: 1 second
- Max retries: 5
- Max delay: 60 seconds

### Failure Logging

Failed webhooks are logged to `webhook_failures` table for debugging:

```jsonc
{
  "id": "fail_abc123",
  "run_id": "run_xyz789",
  "flow_type": "founder_validation",
  "error": "PERSISTENCE_ERROR",
  "payload": { /* original payload */ },
  "created_at": "2026-01-18T12:00:00Z"
}
```

## Related Documentation

- **Master API Contracts**: `startupai-crew/docs/master-architecture/reference/api-contracts.md`
- **Modal Configuration**: `startupai-crew/docs/master-architecture/reference/modal-configuration.md`
- **Approvals API**: [api-approvals.md](api-approvals.md)
- **Architecture**: [overview/architecture.md](../overview/architecture.md)
