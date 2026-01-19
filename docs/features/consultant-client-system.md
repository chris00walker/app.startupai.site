---
purpose: "Documentation for consultant-client relationship system"
status: "active"
last_reviewed: "2026-01-19"
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
| `/api/consultant/invites` | GET | List all invites, clients, and archived |
| `/api/consultant/invites` | POST | Create new invite |
| `/api/consultant/invites/[id]` | DELETE | Revoke pending invite |
| `/api/consultant/invites/[id]/resend` | POST | Resend email with new token |

### Client Management

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/consultant/clients/[id]/archive` | POST | Archive client relationship |
| `/api/client/consultant/unlink` | POST | Client removes consultant link |

### Auth Integration

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/validate-invite` | POST | Validate invite token during signup |

## Database Schema

### `consultant_clients` Table

**Drizzle ORM Schema**: `frontend/src/db/schema/consultant-clients.ts`

```sql
CREATE TABLE consultant_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,  -- nullable until signup
  invite_email TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  invite_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  client_name TEXT,  -- optional personalization before signup
  status TEXT NOT NULL DEFAULT 'invited',  -- invited, active, archived
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  linked_at TIMESTAMP WITH TIME ZONE,  -- when client accepts
  archived_at TIMESTAMP WITH TIME ZONE,
  archived_by TEXT,  -- 'consultant', 'client', or 'system'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_consultant_clients_consultant ON consultant_clients(consultant_id);
CREATE INDEX idx_consultant_clients_client ON consultant_clients(client_id);
CREATE INDEX idx_consultant_clients_token ON consultant_clients(invite_token);
CREATE INDEX idx_consultant_clients_status ON consultant_clients(status);
CREATE INDEX idx_consultant_clients_invite_email ON consultant_clients(invite_email);
CREATE INDEX idx_consultant_clients_consultant_status ON consultant_clients(consultant_id, status);
```

### Status Flow

```
invited → active → archived
   │         │         │
   │         │         └── archived_by: 'consultant', 'client', or 'system'
   │         │
   └─expired─┘ (auto-expire after 30 days, archived_by: 'system')
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

| Component | File |
|-----------|------|
| Consultant Dashboard | `pages/consultant-dashboard.tsx` (Pages Router) |
| `InviteClientModal` | `components/consultant/InviteClientModal.tsx` |
| `ClientValidationCard` | `components/consultant/ClientValidationCard.tsx` |

### Hooks

| Hook | File |
|------|------|
| `useConsultantClients` | `hooks/useConsultantClients.ts` |
| `useClients` | `hooks/useClients.ts` (portfolio projects) |

**Note**: Invites and clients are rendered inline in the dashboard using the `useConsultantClients` hook. There are no separate `ClientList` or `InviteList` components.

### Client Features

Client unlinking is handled via:
- API: `POST /api/client/consultant/unlink`
- UI: Settings page or in-app prompt (implementation varies)

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

| Test | File |
|------|------|
| Hook tests | `src/__tests__/hooks/useConsultantClients.test.ts` |
| InviteClientModal | `components/consultant/__tests__/InviteClientModal.test.tsx` |
| ClientValidationCard | `components/consultant/__tests__/ClientValidationCard.test.tsx` |

### E2E Tests

| Test | File |
|------|------|
| Consultant portfolio flow | `tests/e2e/06-consultant-portfolio.spec.ts` |
| Consultant practice setup | `tests/e2e/09-consultant-practice-setup.spec.ts` |
| Consultant client onboarding | `tests/e2e/10-consultant-client-onboarding.spec.ts` |

> **Note**: Dedicated invite flow E2E tests (`e2e/consultant-invite.spec.ts`, `e2e/client-signup-invite.spec.ts`) are not yet implemented. Invite flows are partially covered in the existing consultant E2E tests.

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
