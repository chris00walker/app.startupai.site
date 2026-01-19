---
purpose: "API specification for consultant-specific routes"
status: "active"
last_reviewed: "2026-01-19"
---

# Consultant API Specification

Implementation lives in `frontend/src/app/api/consultant/*/route.ts`. All routes are authenticated and require the `consultant` role.

## Overview

Consultants use these APIs to:
- Complete their own onboarding profile
- Invite and manage client relationships
- Track client validation progress

## Endpoint Summary

### Consultant Onboarding (5 routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/consultant/onboarding/start` | POST | Start/resume consultant onboarding session |
| `/api/consultant/chat` | POST | Chat message during onboarding (streaming) |
| `/api/consultant/onboarding/status` | GET | Get onboarding progress |
| `/api/consultant/onboarding/complete` | POST | Finalize profile and trigger Modal workflow |
| `/api/consultant/onboarding` | POST | Legacy: Direct profile save (V1 component) |

### Client Management (4 routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/consultant/invites` | GET, POST | List/create client invites |
| `/api/consultant/invites/[id]` | DELETE | Revoke pending invite |
| `/api/consultant/invites/[id]/resend` | POST | Resend invite with new token |
| `/api/consultant/clients/[id]/archive` | POST | Archive a client relationship |

---

## Consultant Onboarding

### `/api/consultant/onboarding/start`

**POST** - Start or resume consultant onboarding session.

#### Request

```jsonc
{
  "userId": "uuid-of-user",
  "userEmail": "consultant@example.com"
}
```

#### Response (New Session)

```jsonc
{
  "success": true,
  "sessionId": "consultant-{userId}-{timestamp}",
  "stageInfo": {
    "currentStage": 1,
    "totalStages": 7,
    "stageName": "Welcome & Practice Overview"
  },
  "conversationContext": {
    "agentPersonality": {
      "name": "Maya",
      "role": "Consulting Practice Specialist",
      "tone": "Professional and collaborative",
      "expertise": "consulting practice management and client workflow optimization"
    },
    "userRole": "consultant",
    "planType": "consultant"
  },
  "agentIntroduction": "Hi! I'm Maya, your Consulting Practice Specialist...",
  "firstQuestion": "To get started, could you tell me about your consulting practice?",
  "resuming": false
}
```

#### Response (Resumed Session)

```jsonc
{
  "success": true,
  "sessionId": "consultant-{userId}-{timestamp}",
  "stageInfo": {
    "currentStage": 3,
    "totalStages": 7,
    "stageName": "Industries & Services"
  },
  "conversationContext": { /* same as above */ },
  "resuming": true,
  "conversationHistory": [ /* previous messages */ ],
  "overallProgress": 35,
  "stageProgress": 60
}
```

---

### `/api/consultant/chat`

**POST** - Send message during consultant onboarding (streaming response).

Uses Two-Pass Architecture matching founder onboarding.

#### Request

```jsonc
{
  "messages": [
    { "role": "user", "content": "I specialize in startup strategy" }
  ],
  "sessionId": "consultant-{userId}-{timestamp}",
  "userId": "uuid-of-user"
}
```

#### Response

Streaming response (text/event-stream). After streaming completes, the backend:
1. Assesses conversation quality
2. Extracts structured data
3. Updates session progress in database

---

### `/api/consultant/onboarding` (Legacy)

**POST** - Direct profile save. Used by V1 component only.

#### Request

```jsonc
{
  "userId": "uuid-of-user",
  "profile": {
    "companyName": "Strategy Partners",
    "practiceSize": "2-10",
    "currentClients": 5,
    "industries": ["Tech", "SaaS"],
    "services": ["Strategy", "Go-to-market"],
    "toolsUsed": ["Notion", "Miro"],
    "painPoints": "Client communication",
    "whiteLabelInterest": true
  }
}
```

#### Response

```jsonc
{
  "success": true,
  "profile": { /* saved profile object */ },
  "message": "Consultant profile created successfully"
}
```

---

### `/api/consultant/onboarding/status`

**GET** - Get current onboarding status.

#### Query Parameters

- `sessionId` (required): The consultant session ID

#### Response

```jsonc
{
  "success": true,
  "currentStage": 3,
  "overallProgress": 45,
  "stageProgress": 60,
  "status": "active",  // 'active', 'paused', 'completed'
  "completed": false,
  "briefData": {
    "company_name": "Strategy Partners",
    "industries": ["Tech", "SaaS"]
  }
}
```

---

### `/api/consultant/onboarding/complete`

**POST** - Complete consultant onboarding, save profile, and trigger Modal workflow.

#### Request

```jsonc
{
  "sessionId": "consultant-{userId}-{timestamp}",
  "userId": "uuid-of-user",
  "messages": [ /* optional: final conversation messages */ ]
}
```

#### Response

```jsonc
{
  "success": true,
  "profile": {
    "id": "uuid-of-user",
    "company_name": "Strategy Partners",
    "practice_size": "2-10",
    "current_clients": 5,
    "industries": ["Tech", "SaaS"],
    "services": ["Strategy", "Go-to-market"],
    "tools_used": ["Notion", "Miro"],
    "pain_points": "Client communication",
    "white_label_enabled": true,
    "onboarding_completed": true
  },
  "workflowId": "run_abc123",  // Modal run ID (null if kickoff failed)
  "workflowTriggered": true,
  "message": "Onboarding completed. Validation analysis started."
}
```

#### Response (Modal kickoff failed)

```jsonc
{
  "success": true,
  "profile": { /* saved profile */ },
  "workflowId": null,
  "workflowTriggered": false,
  "message": "Onboarding completed successfully",
  "modalError": "Modal kickoff failed"
}
```

---

## Client Invite System

### `/api/consultant/invites`

**GET** - List all invites for the current consultant.

#### Query Parameters

- `status` (optional): Filter by `pending`, `accepted`, `expired`

#### Response

```jsonc
{
  "success": true,
  "invites": [
    {
      "id": "inv_abc123",
      "email": "founder@startup.com",
      "status": "pending",
      "createdAt": "2026-01-18T10:00:00Z",
      "expiresAt": "2026-02-17T10:00:00Z"
    }
  ]
}
```

**POST** - Create a new client invite.

#### Request

```jsonc
{
  "email": "founder@startup.com",
  "name": "John Doe", // optional
  "message": "I'd like to help validate your startup idea" // optional
}
```

#### Response

```jsonc
{
  "success": true,
  "invite": {
    "id": "inv_abc123",
    "email": "founder@startup.com",
    "token": "tok_xyz789", // for signup link
    "expiresAt": "2026-02-17T10:00:00Z"
  }
}
```

---

### `/api/consultant/invites/[id]`

**DELETE** - Revoke a pending invite.

Only pending invites (status: 'invited') can be revoked. Active or archived relationships cannot be deleted via this endpoint.

#### Response

```jsonc
{
  "success": true,
  "message": "Invite revoked successfully"
}
```

#### Errors

| Code | HTTP | Description |
|------|------|-------------|
| `Invite not found` | 404 | Invalid invite ID |
| `You do not have permission...` | 403 | Not the invite owner |
| `Only pending invites can be revoked` | 400 | Already active/archived |

---

### `/api/consultant/invites/[id]/resend`

**POST** - Resend invite with new token and extended expiry.

Generates a new invite token and extends expiry by 30 days.

#### Request

No body required.

#### Response

```jsonc
{
  "success": true,
  "invite": {
    "id": "uuid",
    "email": "founder@startup.com",
    "name": "John Doe",
    "inviteToken": "new_base64url_token",
    "inviteUrl": "https://app.startupai.site/signup?invite=new_base64url_token",
    "expiresAt": "2026-02-18T12:00:00Z",
    "status": "invited"
  },
  "message": "Invite resent successfully"
}
```

> **Note**: Email sending is not yet implemented. Currently returns the new invite URL for manual sharing.

---

### `/api/consultant/clients/[id]/archive`

**POST** - Archive a client relationship.

#### Request

```jsonc
{
  "reason": "project_complete" // optional
}
```

#### Response

```jsonc
{
  "success": true,
  "status": "archived"
}
```

---

## Invite Token Flow

```
1. Consultant calls POST /api/consultant/invites
   → Creates row in consultant_clients (status: 'invited')
   → Generates base64url token (30-day expiry)
   → Returns invite URL (email sending not yet implemented)

2. Client clicks link: /signup?invite={base64url_token}
   → Signup page calls GET /api/auth/validate-invite?token=XXX
   → Returns consultant name, email pre-fill, expiry info
   → Client completes signup form

3. After signup completes:
   → Signup handler calls POST /api/auth/validate-invite
   → Calls database function link_client_via_invite()
   → consultant_clients.status → 'active'
   → consultant_clients.client_id → user's ID
   → consultant_clients.linked_at → current timestamp
   → Consultant sees client in portfolio
```

### Auth Integration Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/validate-invite` | GET | Validate token (public, for signup page) |
| `/api/auth/validate-invite` | POST | Link account after signup (authenticated) |

## Database Schema

### `consultant_clients` Table

**Drizzle ORM Schema**: `frontend/src/db/schema/consultant-clients.ts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `consultant_id` | UUID | FK to user_profiles (cascade delete) |
| `client_id` | UUID | FK to user_profiles (nullable, set null on delete) |
| `invite_email` | TEXT | Client's email address |
| `invite_token` | TEXT | Unique base64url signup token |
| `invite_expires_at` | TIMESTAMP | Token expiry (30 days from creation) |
| `client_name` | TEXT | Optional name for personalization |
| `status` | TEXT | 'invited', 'active', 'archived' |
| `invited_at` | TIMESTAMP | When invite was created |
| `linked_at` | TIMESTAMP | When client accepted (signed up) |
| `archived_at` | TIMESTAMP | When relationship was archived |
| `archived_by` | TEXT | 'consultant', 'client', or 'system' |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### RLS Policies

- Consultants can only see their own clients
- Clients can see their own relationship
- Insert requires consultant role
- Update/delete requires ownership

See [features/consultant-client-system.md](../features/consultant-client-system.md) for full schema documentation.

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVITE_EXISTS` | 409 | Email already invited |
| `INVITE_EXPIRED` | 410 | Token has expired |
| `INVITE_NOT_FOUND` | 404 | Invalid invite ID |
| `CLIENT_NOT_FOUND` | 404 | Client doesn't exist |
| `NOT_CONSULTANT` | 403 | User is not a consultant |
| `RATE_LIMITED` | 429 | Too many invites sent |

## Related Documentation

- **Onboarding API**: [api-onboarding.md](api-onboarding.md)
- **Auth API**: [auth.md](auth.md)
- **Consultant Feature**: [features/consultant-client-system.md](../features/consultant-client-system.md)
