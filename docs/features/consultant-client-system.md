---
purpose: "Documentation for consultant-client relationship system"
status: "active"
last_reviewed: "2026-01-18"
---

# Consultant-Client Relationship System

## Overview

The consultant-client system allows consultants (advisors) to:
- Invite clients via email tokens
- Manage client portfolios
- Track client validation progress
- Facilitate client onboarding

## User Roles

| Role | Description |
|------|-------------|
| **Consultant** | Advisor who manages multiple clients |
| **Client** | Founder invited by a consultant |
| **Founder** | Self-service user (not linked to consultant) |

## Invite Flow

```
1. Consultant creates invite
   POST /api/consultant/invites
   → Creates row in consultant_clients (status: 'invited')
   → Generates unique token (30-day expiry)
   → Sends email with signup link

2. Client receives email
   Link: /signup?invite=tok_xyz789

3. Client signs up
   → Validates token via GET /api/auth/validate-invite
   → Client completes normal signup
   → Token redeemed, status → 'active'

4. Relationship established
   → consultant_clients.client_id set
   → Client appears in consultant's dashboard
   → Client can see they're linked to consultant
```

## Features

### For Consultants

| Feature | Description |
|---------|-------------|
| **Invite Clients** | Send email invites with custom messages |
| **Resend Invites** | Resend to pending invites |
| **View Portfolio** | See all active and invited clients |
| **Track Progress** | Monitor client validation progress |
| **Archive Clients** | Remove completed/inactive clients |

### For Clients

| Feature | Description |
|---------|-------------|
| **Seamless Signup** | Pre-populated from invite |
| **Linked Dashboard** | Consultant can view their progress |
| **Unlink Option** | Client can remove consultant link |

## API Routes

### Invite Management

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/consultant/invites` | GET | List all invites |
| `/api/consultant/invites` | POST | Create new invite |
| `/api/consultant/invites/[id]` | GET | Get invite details |
| `/api/consultant/invites/[id]` | PUT | Update invite |
| `/api/consultant/invites/[id]` | DELETE | Revoke invite |
| `/api/consultant/invites/[id]/resend` | POST | Resend email |

### Client Management

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/consultant/clients/[id]/archive` | POST | Archive client |
| `/api/client/consultant/unlink` | POST | Client removes link |

### Auth Integration

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/validate-invite` | GET | Validate invite token |

## Database Schema

### `consultant_clients` Table

```sql
CREATE TABLE consultant_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES auth.users(id),
  client_id UUID REFERENCES auth.users(id),  -- nullable until signup
  email TEXT NOT NULL,
  name TEXT,
  invite_token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'invited',  -- invited, active, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  accepted_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(consultant_id, email)
);
```

### Status Flow

```
invited → active → archived
   │         │
   └─expired─┘ (auto-expire after 30 days)
```

### RLS Policies

```sql
-- Consultants see only their clients
CREATE POLICY "Consultants see own clients"
  ON consultant_clients FOR SELECT
  USING (auth.uid() = consultant_id);

-- Clients see their own relationship
CREATE POLICY "Clients see own relationship"
  ON consultant_clients FOR SELECT
  USING (auth.uid() = client_id);

-- Only consultants can insert
CREATE POLICY "Consultants can invite"
  ON consultant_clients FOR INSERT
  WITH CHECK (auth.uid() = consultant_id);

-- Consultants can update their invites
CREATE POLICY "Consultants can update"
  ON consultant_clients FOR UPDATE
  USING (auth.uid() = consultant_id);
```

## Email Templates

### Invite Email

**Subject**: `{Consultant Name} invites you to StartupAI`

**Body**:
```
Hi {Client Name},

{Consultant Name} has invited you to validate your startup idea with StartupAI.

StartupAI helps founders validate business ideas through AI-powered strategic analysis.

Click here to get started:
{signup_url}?invite={token}

This invite expires in 30 days.

{Custom Message from Consultant}
```

### Reminder Email (Resend)

**Subject**: `Reminder: Your StartupAI invite from {Consultant Name}`

## Frontend Components

### Consultant Dashboard

| Component | Location |
|-----------|----------|
| `ConsultantDashboard` | `/consultant/dashboard` |
| `ClientList` | Shows active clients |
| `InviteList` | Shows pending invites |
| `InviteModal` | Create new invite form |
| `ClientCard` | Individual client info |

### Client Features

| Component | Location |
|-----------|----------|
| `LinkedConsultant` | Shows consultant info in sidebar |
| `UnlinkButton` | Remove consultant link |

## Security Considerations

### Token Security
- Tokens are UUIDs (128-bit random)
- 30-day expiry default
- Single-use (deleted after signup)
- Validated before signup completes

### Privacy
- Consultants can only see clients they invited
- Clients can unlink at any time
- Email addresses not exposed to other clients

### Rate Limiting
- Max 50 invites per consultant per day
- Max 3 resends per invite

## Testing

### Unit Tests

- `src/__tests__/api/consultant/invites/route.test.ts`
- `src/__tests__/api/consultant/clients/archive/route.test.ts`

### E2E Tests

- `e2e/consultant-invite.spec.ts`
- `e2e/client-signup-invite.spec.ts`

## Metrics

Track in PostHog:

| Event | When |
|-------|------|
| `invite_created` | Consultant sends invite |
| `invite_resent` | Consultant resends invite |
| `invite_accepted` | Client signs up |
| `invite_expired` | Token expires unused |
| `client_unlinked` | Client removes link |

## Related Documentation

- **API Spec**: [specs/api-consultant.md](../specs/api-consultant.md)
- **Auth Spec**: [specs/auth.md](../specs/auth.md)
- **Data Schema**: [specs/data-schema.md](../specs/data-schema.md)
