---
purpose: "API specification for HITL approval routes"
status: "active"
last_reviewed: "2026-01-19"
---

# Approvals API (HITL)

Implementation lives in `frontend/src/app/api/approvals/*/route.ts`. These routes handle Human-in-the-Loop (HITL) approval workflows.

## Overview

The approvals system allows users to:
- Review AI-generated validation outputs
- Approve or reject decisions
- Resume paused CrewAI workflows on Modal

## Endpoint Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/approvals` | GET | List pending approvals |
| `/api/approvals/[id]` | GET | Get approval details |
| `/api/approvals/[id]` | PATCH | Submit approval decision |
| `/api/approvals/webhook` | POST | Receive checkpoint from Modal |
| `/api/settings/approvals` | GET | Get user's approval preferences |
| `/api/settings/approvals` | PUT | Update approval preferences |

---

## List Approvals

### `/api/approvals`

**GET** - List all approvals for the current user (and client approvals for consultants).

#### Query Parameters

- `status` (optional): Filter by `pending`, `approved`, `rejected`, `all` (default: `pending`)
- `limit` (optional): Max results (default 20)
- `offset` (optional): Pagination offset (default 0)

#### Response

```jsonc
{
  "approvals": [
    {
      "id": "uuid",
      "execution_id": "run_abc123",
      "task_id": "task_xyz",
      "user_id": "uuid",
      "project_id": "uuid",
      "approval_type": "segment_pivot",
      "owner_role": "compass",
      "title": "Customer Segment Pivot",
      "description": "Evidence suggests pivoting to enterprise segment...",
      "task_output": { /* structured output data */ },
      "evidence_summary": { /* D-F-V signals */ },
      "options": [
        { "id": "proceed", "label": "Proceed with pivot", "description": "..." },
        { "id": "iterate", "label": "Gather more data", "description": "..." }
      ],
      "status": "pending",
      "auto_approvable": false,
      "created_at": "2026-01-18T10:00:00Z",
      "projects": {
        "id": "uuid",
        "name": "My Startup",
        "stage": "discovery"
      }
    }
  ],
  "client_approvals": [ /* same structure, only for consultants */ ],
  "pagination": {
    "total": 15,
    "own_count": 10,
    "client_count": 5,
    "limit": 20,
    "offset": 0
  }
}
```

#### Notes

- Consultants automatically receive their clients' approvals in `client_approvals`
- Supports both cookie-based auth and Authorization Bearer token

---

## Get Approval Details

### `/api/approvals/[id]`

**GET** - Get full details for a specific approval.

Access control: User must own the approval OR be the consultant of the owner.

#### Response

Returns the approval object directly (not wrapped):

```jsonc
{
  "id": "uuid",
  "execution_id": "run_abc123",
  "task_id": "task_xyz",
  "user_id": "uuid",
  "project_id": "uuid",
  "approval_type": "segment_pivot",
  "owner_role": "compass",
  "title": "Customer Segment Pivot",
  "description": "Evidence suggests pivoting to enterprise segment...",
  "task_output": {
    "analysis": "Detailed analysis output...",
    "confidence": 0.85,
    "recommendations": ["..."]
  },
  "evidence_summary": {
    "desirability": { "score": 0.72, "label": "high" },
    "feasibility": { "score": 0.68, "label": "medium" },
    "viability": { "score": 0.65, "label": "medium" }
  },
  "options": [
    { "id": "proceed", "label": "Proceed with pivot", "description": "Accept the recommendation" },
    { "id": "iterate", "label": "Gather more data", "description": "Request additional research" }
  ],
  "auto_approvable": false,
  "status": "pending",
  "decision": null,
  "human_feedback": null,
  "decided_by": null,
  "decided_at": null,
  "created_at": "2026-01-18T10:00:00Z",
  "updated_at": "2026-01-18T10:00:00Z",
  "projects": {
    "id": "uuid",
    "name": "My Startup",
    "stage": "discovery"
  }
}
```

#### Side Effect

Viewing an approval creates a record in `approval_history` with `action: 'viewed'`.

---

## Submit Approval Decision

### `/api/approvals/[id]`

**PATCH** - Submit a decision on an approval.

Access control: User must own the approval OR be the consultant of the owner.

#### Request

```jsonc
{
  "action": "approve" | "reject",
  "decision": "proceed",      // optional: the chosen option ID from options array
  "feedback": "Looks good"    // optional: user's reasoning
}
```

#### Response

```jsonc
{
  "success": true,
  "approval": {
    "id": "uuid",
    "status": "approved",
    "decision": "proceed",
    "human_feedback": "Looks good",
    "decided_by": "user-uuid",
    "decided_at": "2026-01-18T10:30:00Z",
    // ... full approval object
  },
  "message": "Approval approved successfully"
}
```

#### Behaviour

1. Validates ownership or consultant access
2. Checks approval is still `pending` (returns 400 if already decided)
3. Updates `approval_requests` with decision
4. Creates `approval_history` entry
5. If `action: 'approve'`, calls Modal HITL resume endpoint

#### Errors

| Code | HTTP | Description |
|------|------|-------------|
| `Unauthorized` | 401 | Not authenticated |
| `Approval request not found` | 404 | Invalid ID |
| `Access denied` | 403 | Not owner or consultant |
| `Approval already {status}` | 400 | Already decided |
```

---

## Approval Webhook

### `/api/approvals/webhook`

**POST** - Receive HITL checkpoint from Modal/CrewAI.

#### Authentication

Requires Bearer token:
```
Authorization: Bearer <MODAL_AUTH_TOKEN>
```

#### Request

```jsonc
{
  // CrewAI execution context
  "execution_id": "run_abc123",
  "task_id": "task_xyz",

  // User context
  "user_id": "uuid",
  "project_id": "uuid",  // optional

  // Approval details
  "approval_type": "segment_pivot",  // see Approval Types below
  "owner_role": "compass",           // C-suite agent name

  // Content for display
  "title": "Customer Segment Pivot",
  "description": "Evidence suggests pivoting to enterprise segment...",
  "task_output": { /* structured analysis output */ },
  "evidence_summary": { /* D-F-V signals, optional */ },
  "options": [
    { "id": "proceed", "label": "Proceed with pivot", "description": "..." },
    { "id": "iterate", "label": "Gather more data", "description": "..." }
  ],

  // Auto-approve flag
  "auto_approvable": false
}
```

#### Response (created)

```jsonc
{
  "success": true,
  "approval_id": "uuid",
  "status": "pending",
  "auto_approved": false,
  "message": "Approval request created, awaiting user decision"
}
```

#### Response (auto-approved)

```jsonc
{
  "success": true,
  "approval_id": "uuid",
  "status": "approved",
  "auto_approved": true,
  "message": "Approval auto-approved and flow resumed"
}
```

#### Response (already exists)

```jsonc
{
  "success": true,
  "approval_id": "uuid",
  "status": "pending",
  "message": "Approval request already exists"
}
```

---

## Auto-Approve Logic

Some checkpoints can be auto-approved based on user preferences stored in `approval_preferences` table.

### Conditions for Auto-Approve

Auto-approve triggers if EITHER:
1. **Type in auto-approve list**: `approval_type` is in user's `auto_approve_types` array
2. **Low-risk + flag enabled**: Checkpoint has `auto_approvable: true` AND user has `auto_approve_low_risk: true`

### Auto-Approve Flow

```
Webhook received
    → Fetch user's approval_preferences
    → Check if type in auto_approve_types
    → OR check if auto_approvable AND auto_approve_low_risk
    → If either true:
        → Create approval with status: 'approved'
        → Call Modal HITL resume endpoint
        → Create history entry with action: 'auto_approved'
    → Else:
        → Create approval with status: 'pending'
        → Create history entry with action: 'created'
```

### User Preferences (via `/api/settings/approvals`)

```jsonc
{
  "user_id": "uuid",
  "auto_approve_types": ["gate_progression", "data_sharing"],
  "max_auto_approve_spend": 1000,
  "auto_approve_low_risk": true,
  "notify_email": true,
  "notify_sms": false,
  "escalation_email": "manager@company.com"  // optional
}
```

---

## Approval Types

| Type | Description |
|------|-------------|
| `segment_pivot` | Pivot to a different customer segment |
| `value_pivot` | Change value proposition |
| `feature_downgrade` | Remove or simplify features |
| `strategic_pivot` | Major strategic direction change |
| `spend_increase` | Increase budget/spending |
| `campaign_launch` | Launch marketing campaign |
| `customer_contact` | Contact customers directly |
| `gate_progression` | Progress to next validation gate |
| `data_sharing` | Share data with external parties |

---

## Owner Roles (C-Suite Agents)

| Role | Agent Name | Responsibility |
|------|------------|----------------|
| `compass` | Compass (CPO) | Product decisions |
| `ledger` | Ledger (CFO) | Financial decisions |
| `pulse` | Pulse (CMO) | Marketing decisions |
| `guardian` | Guardian (CGO) | Growth decisions |
| `forge` | Forge (CTO) | Technical decisions |

---

## Database Schema

### `approval_requests` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `execution_id` | TEXT | CrewAI execution/run ID |
| `task_id` | TEXT | Task checkpoint ID |
| `user_id` | UUID | FK to user_profiles (owner) |
| `project_id` | UUID | FK to projects (optional) |
| `approval_type` | TEXT | Type category (see Approval Types) |
| `owner_role` | TEXT | C-suite agent name |
| `title` | TEXT | Display title |
| `description` | TEXT | Full description |
| `task_output` | JSONB | Structured analysis output |
| `evidence_summary` | JSONB | D-F-V signals (optional) |
| `options` | JSONB | Array of decision options |
| `auto_approvable` | BOOLEAN | Can be auto-approved |
| `auto_approve_reason` | TEXT | Why it was auto-approved |
| `status` | TEXT | `pending`, `approved`, `rejected` |
| `decision` | TEXT | Chosen option ID |
| `human_feedback` | TEXT | User's reasoning |
| `decided_by` | UUID | FK to user who decided |
| `decided_at` | TIMESTAMP | When decision was made |
| `created_at` | TIMESTAMP | Checkpoint received |
| `updated_at` | TIMESTAMP | Last update |

### `approval_history` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `approval_request_id` | UUID | FK to approval_requests |
| `action` | TEXT | `created`, `viewed`, `approved`, `rejected`, `auto_approved` |
| `actor_id` | UUID | FK to users (null for system) |
| `actor_type` | TEXT | `user` or `system` |
| `details` | JSONB | Action metadata |
| `created_at` | TIMESTAMP | Action time |

### `approval_preferences` Table

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | FK to user_profiles (primary key) |
| `auto_approve_types` | TEXT[] | Approval types to auto-approve |
| `max_auto_approve_spend` | NUMERIC | Spend threshold for auto-approve |
| `auto_approve_low_risk` | BOOLEAN | Auto-approve low-risk decisions |
| `notify_email` | BOOLEAN | Send email notifications |
| `notify_sms` | BOOLEAN | Send SMS notifications |
| `escalation_email` | TEXT | Escalation contact |
| `created_at` | TIMESTAMP | Created |
| `updated_at` | TIMESTAMP | Updated |

---

## Settings Approvals

### `/api/settings/approvals`

**GET** - Get user's approval preferences.

#### Response

```jsonc
{
  "user_id": "uuid",
  "auto_approve_types": ["gate_progression"],
  "max_auto_approve_spend": 0,
  "auto_approve_low_risk": false,
  "notify_email": true,
  "notify_sms": false,
  "escalation_email": null
}
```

**PUT** - Update approval preferences.

#### Request

```jsonc
{
  "auto_approve_types": ["gate_progression", "data_sharing"],
  "max_auto_approve_spend": 1000,
  "auto_approve_low_risk": true,
  "notify_email": true,
  "notify_sms": false,
  "escalation_email": "manager@company.com"
}
```

#### Response

```jsonc
{
  "success": true,
  "preferences": { /* updated preferences object */ }
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `Unauthorized` | 401 | Not authenticated or invalid token |
| `Approval request not found` | 404 | Invalid approval ID |
| `Access denied` | 403 | User doesn't own this approval |
| `Approval already {status}` | 400 | Already decided |
| `Invalid request` | 400 | Validation failed |
| `User not found` | 404 | Webhook user_id invalid |

---

## UI Components

The approvals system uses these frontend components:

| Component | File |
|-----------|------|
| `ApprovalCard` | `components/approvals/ApprovalCard.tsx` |
| `ApprovalDetailModal` | `components/approvals/ApprovalDetailModal.tsx` |
| `EvidenceSummary` | `components/approvals/EvidenceSummary.tsx` |

## Modal Integration

### Resume Endpoint

When an approval is approved, the backend calls the Modal HITL resume endpoint:

```
POST ${MODAL_HITL_APPROVE_URL}
Authorization: Bearer ${MODAL_AUTH_TOKEN}

{
  "run_id": "execution_id",
  "checkpoint": "task_id",
  "decision": "proceed",
  "feedback": "User feedback",
  "decided_by": "user-uuid"
}
```

Environment variables:
- `MODAL_HITL_APPROVE_URL`: Modal resume endpoint
- `MODAL_AUTH_TOKEN`: Bearer token for webhook auth

## Related Documentation

- **CrewAI API**: [api-crewai.md](api-crewai.md)
- **Architecture**: [architecture.md](architecture.md)
- **HITL Checkpoints**: `startupai-crew/docs/master-architecture/05-hitl-checkpoints.md`
