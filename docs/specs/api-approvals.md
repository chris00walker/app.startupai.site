---
purpose: "API specification for HITL approval routes"
status: "active"
last_reviewed: "2026-01-18"
---

# Approvals API (HITL)

Implementation lives in `frontend/src/app/api/approvals/*/route.ts`. These routes handle Human-in-the-Loop (HITL) approval workflows.

## Overview

The approvals system allows users to:
- Review AI-generated validation outputs
- Approve, reject, or request revisions
- Resume paused CrewAI workflows

## Endpoint Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/approvals` | GET | List pending approvals |
| `/api/approvals/[id]` | GET | Get approval details |
| `/api/approvals/[id]` | POST | Submit approval decision |
| `/api/approvals/[id]` | PUT | Update approval (add notes) |
| `/api/approvals/webhook` | POST | Receive checkpoint from Modal |

---

## List Approvals

### `/api/approvals`

**GET** - List all pending approvals for the current user.

#### Query Parameters

- `status` (optional): Filter by `pending`, `approved`, `rejected`, `revised`
- `type` (optional): Filter by approval type
- `limit` (optional): Max results (default 20)

#### Response

```jsonc
{
  "success": true,
  "approvals": [
    {
      "id": "appr_abc123",
      "type": "evidence_review",
      "status": "pending",
      "project_id": "proj_xyz789",
      "run_id": "run_123456",
      "checkpoint_name": "market_validation_review",
      "summary": "Review market research findings",
      "created_at": "2026-01-18T10:00:00Z",
      "expires_at": "2026-01-25T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

## Get Approval Details

### `/api/approvals/[id]`

**GET** - Get full details for a specific approval.

#### Response

```jsonc
{
  "success": true,
  "approval": {
    "id": "appr_abc123",
    "type": "evidence_review",
    "status": "pending",
    "project_id": "proj_xyz789",
    "run_id": "run_123456",
    "checkpoint_name": "market_validation_review",
    "owner_role": "founder",
    "data": {
      "evidence": [
        {
          "type": "market_research",
          "title": "Competitor Analysis",
          "summary": "Found 5 direct competitors...",
          "confidence": 0.85,
          "source": "web_research"
        }
      ],
      "dfv_signals": {
        "desirability": 0.72,
        "feasibility": 0.68,
        "viability": 0.65
      },
      "agent": "Sage",
      "recommendations": [
        "Consider targeting underserved segment",
        "Validate pricing with customer interviews"
      ]
    },
    "resume_url": "https://modal.run/resume/xyz789",
    "low_risk": false,
    "created_at": "2026-01-18T10:00:00Z"
  }
}
```

---

## Submit Approval Decision

### `/api/approvals/[id]`

**POST** - Submit a decision on an approval.

#### Request

```jsonc
{
  "decision": "approve" | "reject" | "revise",
  "feedback": "Looks good, proceed with next phase", // optional
  "revision_notes": "Please re-analyze with focus on enterprise segment" // required if revise
}
```

#### Response

```jsonc
{
  "success": true,
  "decision": "approve",
  "workflow_resumed": true,
  "next_phase": "phase_3"
}
```

#### Decision Types

| Decision | Effect |
|----------|--------|
| `approve` | Resume workflow, proceed to next phase |
| `reject` | Stop workflow, mark run as failed |
| `revise` | Resume workflow with feedback, re-run analysis |

---

## Update Approval

### `/api/approvals/[id]`

**PUT** - Update approval metadata (add notes, extend deadline).

#### Request

```jsonc
{
  "notes": "Discussed with team, need more time",
  "expires_at": "2026-02-01T10:00:00Z" // optional, extend deadline
}
```

#### Response

```jsonc
{
  "success": true,
  "updated": true
}
```

---

## Approval Webhook

### `/api/approvals/webhook`

**POST** - Receive HITL checkpoint from Modal (alias for `/api/crewai/webhook` with `flow_type: hitl_checkpoint`).

#### Authentication

Requires Bearer token:
```
Authorization: Bearer <MODAL_AUTH_TOKEN>
```

#### Request

```jsonc
{
  "run_id": "run_xyz789",
  "checkpoint_name": "market_validation_review",
  "approval_type": "evidence_review",
  "owner_role": "founder",
  "project_id": "proj_abc123",
  "data": { /* checkpoint data for review */ },
  "resume_url": "https://modal.run/resume/xyz789",
  "low_risk": false
}
```

#### Response

```jsonc
{
  "success": true,
  "approval_id": "appr_abc123",
  "auto_approved": false
}
```

---

## Auto-Approve Logic

Some checkpoints can be auto-approved based on user preferences:

### Conditions for Auto-Approve

1. **User preference enabled**: `user_settings.approval_preferences.auto_approve = true`
2. **Low-risk flag**: Checkpoint marked as `low_risk: true` by Modal
3. **Approval type allowed**: Type is in user's `auto_approve_types` list

### Auto-Approve Flow

```
Webhook received
    → Check user preferences
    → If auto-approve enabled AND low_risk:
        → Create approval with status: 'auto_approved'
        → Immediately call resume_url
        → Log to approval_history
    → Else:
        → Create approval with status: 'pending'
        → Notify user (email/push)
```

### User Preferences Schema

```jsonc
{
  "auto_approve": true,
  "auto_approve_types": ["progress_checkpoint", "minor_revision"],
  "notification_preferences": {
    "email": true,
    "push": false
  }
}
```

---

## Approval Types

| Type | Description | Typical Review Time |
|------|-------------|---------------------|
| `evidence_review` | Review validation evidence | 10-30 min |
| `strategy_approval` | Approve strategic recommendations | 30-60 min |
| `experiment_design` | Review proposed experiments | 15-30 min |
| `cost_analysis` | Review unit economics | 20-45 min |
| `progress_checkpoint` | Quick progress check | 5-10 min |
| `final_report` | Approve final validation report | 30-60 min |

---

## Checkpoint → Approval Mapping

| Checkpoint Name | Approval Type | Owner Role |
|-----------------|---------------|------------|
| `market_validation_review` | `evidence_review` | founder |
| `competitor_analysis_review` | `evidence_review` | founder |
| `strategy_recommendation` | `strategy_approval` | founder |
| `experiment_proposal` | `experiment_design` | founder |
| `unit_economics_review` | `cost_analysis` | founder |
| `final_validation_report` | `final_report` | founder |
| `client_intake_review` | `evidence_review` | consultant |

---

## Database Schema

### `approval_requests` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users (owner) |
| `project_id` | UUID | FK to projects |
| `run_id` | TEXT | Modal run ID |
| `checkpoint_name` | TEXT | Checkpoint identifier |
| `approval_type` | TEXT | Type category |
| `status` | TEXT | pending/approved/rejected/revised/auto_approved |
| `data` | JSONB | Checkpoint data for review |
| `resume_url` | TEXT | Modal callback URL |
| `low_risk` | BOOLEAN | Auto-approve eligible |
| `decision` | TEXT | User's decision |
| `feedback` | TEXT | User's feedback |
| `created_at` | TIMESTAMP | Checkpoint received |
| `decided_at` | TIMESTAMP | Decision submitted |
| `expires_at` | TIMESTAMP | Review deadline |

### `approval_history` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `approval_id` | UUID | FK to approval_requests |
| `action` | TEXT | created/viewed/decided/auto_approved |
| `actor_id` | UUID | FK to users |
| `metadata` | JSONB | Action details |
| `created_at` | TIMESTAMP | Action time |

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `APPROVAL_NOT_FOUND` | 404 | Approval ID doesn't exist |
| `APPROVAL_EXPIRED` | 410 | Review deadline passed |
| `ALREADY_DECIDED` | 409 | Decision already submitted |
| `INVALID_DECISION` | 400 | Unknown decision type |
| `RESUME_FAILED` | 502 | Modal resume callback failed |
| `NOT_OWNER` | 403 | User doesn't own this approval |

---

## UI Components

The approvals system uses these frontend components:

| Component | Purpose |
|-----------|---------|
| `ApprovalCard` | List item in approvals list |
| `ApprovalDetailModal` | Full approval review modal |
| `EvidenceSummary` | Display evidence with D-F-V badges |
| `ApprovalActions` | Approve/Reject/Revise buttons |

## Related Documentation

- **CrewAI API**: [api-crewai.md](api-crewai.md)
- **Architecture**: [overview/architecture.md](../overview/architecture.md)
- **HITL Checkpoints**: `startupai-crew/docs/master-architecture/05-hitl-checkpoints.md`
