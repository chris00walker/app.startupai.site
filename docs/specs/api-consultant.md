---
purpose: "API specification for consultant-specific routes"
status: "active"
last_reviewed: "2026-01-18"
---

# Consultant API Specification

Implementation lives in `frontend/src/app/api/consultant/*/route.ts`. All routes are authenticated and require the `consultant` role.

## Overview

Consultants use these APIs to:
- Complete their own onboarding profile
- Invite and manage client relationships
- Track client validation progress

## Endpoint Summary

### Consultant Onboarding (4 routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/consultant/onboarding` | POST | Chat message during consultant onboarding |
| `/api/consultant/onboarding/start` | POST | Start consultant profile creation |
| `/api/consultant/onboarding/status` | GET | Get onboarding progress |
| `/api/consultant/onboarding/complete` | POST | Finalize consultant profile |

### Client Management (4 routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/consultant/invites` | GET, POST | List/create client invites |
| `/api/consultant/invites/[id]` | GET, PUT, DELETE | Manage specific invite |
| `/api/consultant/invites/[id]/resend` | POST | Resend invite email |
| `/api/consultant/clients/[id]/archive` | POST | Archive a client |

---

## Consultant Onboarding

### `/api/consultant/onboarding/start`

**POST** - Start consultant onboarding session.

#### Request

```jsonc
{
  "resumeSessionId": null // optional, to resume previous session
}
```

#### Response

```jsonc
{
  "success": true,
  "sessionId": "cons_abc123",
  "agentIntroduction": "Hi, I'm Alex. I'll help set up your consultant profile...",
  "firstQuestion": "Tell me about your consulting practice...",
  "stageInfo": {
    "currentStage": 1,
    "totalStages": 7,
    "stageName": "Practice Overview"
  }
}
```

---

### `/api/consultant/onboarding`

**POST** - Send message during consultant onboarding.

#### Request

```jsonc
{
  "sessionId": "cons_abc123",
  "message": "I specialize in startup strategy and go-to-market planning"
}
```

#### Response

```jsonc
{
  "success": true,
  "response": "That's great! What industries do you typically work with?",
  "stageInfo": {
    "currentStage": 1,
    "stageProgress": 45,
    "overallProgress": 12
  }
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
  "status": "active",
  "completed": false,
  "briefData": {
    "company_name": "Strategy Partners",
    "industries": ["Tech", "SaaS"]
  }
}
```

---

### `/api/consultant/onboarding/complete`

**POST** - Complete consultant onboarding and create profile.

#### Request

```jsonc
{
  "sessionId": "cons_abc123",
  "finalConfirmation": true
}
```

#### Response

```jsonc
{
  "success": true,
  "profileId": "profile_xyz789",
  "nextSteps": {
    "dashboardUrl": "/consultant/dashboard",
    "inviteClientsUrl": "/consultant/clients"
  }
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

**GET** - Get specific invite details.

**PUT** - Update invite (e.g., extend expiry).

#### Request

```jsonc
{
  "expiresAt": "2026-03-17T10:00:00Z"
}
```

**DELETE** - Cancel/revoke an invite.

#### Response

```jsonc
{
  "success": true,
  "message": "Invite revoked"
}
```

---

### `/api/consultant/invites/[id]/resend`

**POST** - Resend invite email to client.

#### Request

```jsonc
{
  "message": "Just following up on my earlier invite..." // optional custom message
}
```

#### Response

```jsonc
{
  "success": true,
  "sentAt": "2026-01-18T12:00:00Z"
}
```

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
   → Generates unique token (30-day expiry)
   → Sends email with signup link

2. Client clicks link: /signup?invite=tok_xyz789
   → Validates token via GET /api/auth/validate-invite
   → Client signs up normally

3. On signup completion:
   → consultant_clients.status → 'active'
   → client.consultant_id → consultant's user ID
   → Consultant sees client in portfolio
```

## Database Schema

### `consultant_clients` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `consultant_id` | UUID | FK to users |
| `client_id` | UUID | FK to users (nullable until signup) |
| `email` | TEXT | Client's email |
| `invite_token` | UUID | Unique signup token |
| `status` | TEXT | 'invited', 'active', 'archived' |
| `created_at` | TIMESTAMP | Invite creation time |
| `expires_at` | TIMESTAMP | Token expiry (30 days) |
| `accepted_at` | TIMESTAMP | When client signed up |

### RLS Policies

- Consultants can only see their own clients
- Clients can see their own relationship
- Insert requires consultant role
- Update/delete requires ownership

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
