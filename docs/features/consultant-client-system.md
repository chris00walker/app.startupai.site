---
purpose: "Documentation for consultant-client relationship system"
status: "active"
last_reviewed: "2026-02-03"
---

# Consultant-Client Relationship System

## Overview

The consultant-client system allows consultants (advisors) to:
- Invite clients via email tokens
- Manage client portfolios
- Track client validation progress
- Facilitate client onboarding

> **Portfolio Holder Marketplace (2026-02-03)**: The system now supports three connection flows and five relationship types as part of the Portfolio Holder marketplace. See [portfolio-holder-vision.md](../specs/portfolio-holder-vision.md) for the complete vision.

## User Roles

| Role | Description |
|------|-------------|
| **Consultant** | Advisor who manages multiple clients |
| **Client** | Founder invited by a consultant |
| **Founder** | Self-service user (not linked to consultant) |

## Connection Flows

### Three Connection Flows

The system supports three ways to establish consultant-client relationships:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       CONNECTION FLOWS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FLOW 1: INVITE-NEW (Traditional)                                        │
│  ─────────────────────────────────                                       │
│  Consultant invites a founder who isn't on platform yet                  │
│                                                                          │
│  Consultant → sends invite → Founder receives email → signs up →         │
│  Founder accepts connection → Relationship active                        │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FLOW 2: LINK-EXISTING (Marketplace - Consultant Initiates)              │
│  ─────────────────────────────────                                       │
│  Verified consultant requests connection to existing founder             │
│                                                                          │
│  Consultant browses Founder Directory → sends request with message →     │
│  Founder reviews → Founder accepts/declines → Relationship active/none   │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FLOW 3: FOUNDER RFQ (Marketplace - Founder Initiates)                   │
│  ─────────────────────────────────                                       │
│  Founder posts request seeking capital/advice                            │
│                                                                          │
│  Founder creates RFQ → Posted to RFQ Board → Verified consultant views → │
│  Consultant responds → Founder reviews → Founder accepts/declines        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Flow 1: Invite-New (Traditional)

```
1. Consultant creates invite
   POST /api/consultant/invites
   → Creates row in consultant_clients (status: 'invited')
   → Generates unique token (30-day expiry)
   → Sends email with signup link
   → relationship_type required (no default)

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

### Flow 2: Link-Existing (Marketplace)

```
1. Verified consultant browses Founder Directory
   GET /api/consultant/founders
   → Returns founders with founder_directory_opt_in=TRUE
   → Filtered by problem_fit IN ('partial_fit', 'strong_fit')

2. Consultant sends connection request
   POST /api/consultant/connections
   → Creates consultant_clients (status: 'requested', initiated_by: 'consultant')
   → relationship_type required
   → Optional request_message

3. Founder reviews request
   → Sees pending request on dashboard
   → Views consultant details and message

4. Founder accepts or declines
   POST /api/founder/connections/[id]/accept
   POST /api/founder/connections/[id]/decline
   → accept: status → 'active', consultant gains evidence access
   → decline: status → 'declined', 30-day cooldown starts
```

### Flow 3: Founder RFQ (Marketplace)

```
1. Founder creates RFQ
   POST /api/founder/rfq
   → Creates consultant_requests record
   → Specifies relationship_type, industries, timeline, budget

2. Verified consultants browse RFQ Board
   GET /api/consultant/rfq
   → Returns open RFQs

3. Consultant responds to RFQ
   POST /api/consultant/rfq/[id]/respond
   → Creates consultant_request_responses (status: 'pending')
   → message required

4. Founder reviews responses
   GET /api/founder/rfq/[id]/responses
   → Views all responses with consultant details

5. Founder accepts or declines
   POST /api/founder/rfq/[id]/responses/[responseId]/accept
   POST /api/founder/rfq/[id]/responses/[responseId]/decline
   → accept: creates connection, consultant gains evidence access
   → decline: response marked declined
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

### `consultant_clients` Table (Extended)

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

  -- Connection details (added 2026-02-03 for marketplace)
  relationship_type TEXT NOT NULL,  -- advisory, capital, program, service, ecosystem (NO DEFAULT)
  connection_status TEXT NOT NULL DEFAULT 'invited',  -- invited, requested, active, declined, archived
  initiated_by TEXT NOT NULL DEFAULT 'consultant',  -- consultant, founder
  request_message TEXT,  -- optional message with connection request
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,

  -- Legacy fields (kept for backwards compatibility)
  status TEXT NOT NULL DEFAULT 'invited',  -- deprecated, use connection_status
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  linked_at TIMESTAMP WITH TIME ZONE,  -- when client accepts
  archived_at TIMESTAMP WITH TIME ZONE,
  archived_by TEXT,  -- 'consultant', 'client', or 'system'

  -- Mock client flag for trial users (US-CT01)
  is_mock BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_relationship_type CHECK (relationship_type IN ('advisory', 'capital', 'program', 'service', 'ecosystem')),
  CONSTRAINT valid_connection_status CHECK (connection_status IN ('invited', 'requested', 'active', 'declined', 'archived')),
  CONSTRAINT valid_initiated_by CHECK (initiated_by IN ('consultant', 'founder'))
);

-- Indexes
CREATE INDEX idx_consultant_clients_consultant ON consultant_clients(consultant_id);
CREATE INDEX idx_consultant_clients_client ON consultant_clients(client_id);
CREATE INDEX idx_consultant_clients_token ON consultant_clients(invite_token);
CREATE INDEX idx_consultant_clients_status ON consultant_clients(connection_status);
CREATE INDEX idx_consultant_clients_invite_email ON consultant_clients(invite_email);
CREATE INDEX idx_consultant_clients_consultant_status ON consultant_clients(consultant_id, connection_status);
-- New indexes for marketplace queries
CREATE INDEX idx_consultant_clients_pending_requests ON consultant_clients(client_id, connection_status) WHERE connection_status = 'requested';
```

### `consultant_profiles` Table (Extended)

**Drizzle ORM Schema**: `frontend/src/db/schema/consultant-profiles.ts`

```sql
-- New fields added 2026-02-03 for marketplace
ALTER TABLE consultant_profiles ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE consultant_profiles ADD COLUMN directory_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE consultant_profiles ADD COLUMN default_relationship_type TEXT;
ALTER TABLE consultant_profiles ADD COLUMN grace_started_at TIMESTAMP WITH TIME ZONE;

-- Constraints
ALTER TABLE consultant_profiles ADD CONSTRAINT valid_verification_status
  CHECK (verification_status IN ('unverified', 'verified', 'grace', 'revoked'));
ALTER TABLE consultant_profiles ADD CONSTRAINT valid_default_relationship_type
  CHECK (default_relationship_type IS NULL OR default_relationship_type IN ('advisory', 'capital', 'program', 'service', 'ecosystem'));

-- Index for directory browsing
CREATE INDEX idx_consultant_profiles_directory ON consultant_profiles(verification_status, directory_opt_in);
```

### `user_profiles` Table (Extended)

**Drizzle ORM Schema**: `frontend/src/db/schema/users.ts`

```sql
-- New field for Founder Directory opt-in
ALTER TABLE user_profiles ADD COLUMN founder_directory_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for Founder Directory browsing
CREATE INDEX idx_user_profiles_founder_opt_in ON user_profiles(founder_directory_opt_in) WHERE founder_directory_opt_in = TRUE;
```

### `consultant_requests` Table (NEW - RFQ)

**Drizzle ORM Schema**: `frontend/src/db/schema/consultant-requests.ts`

```sql
CREATE TABLE consultant_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  relationship_type TEXT NOT NULL,  -- advisory, capital, program, service, ecosystem
  industries TEXT[],
  stage_preference TEXT,
  timeline TEXT,
  budget_range TEXT,
  status TEXT NOT NULL DEFAULT 'open',  -- open, filled, cancelled
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT valid_rfq_relationship_type CHECK (relationship_type IN ('advisory', 'capital', 'program', 'service', 'ecosystem')),
  CONSTRAINT valid_rfq_status CHECK (status IN ('open', 'filled', 'cancelled'))
);

-- Indexes for RFQ browsing
CREATE INDEX idx_consultant_requests_status_type ON consultant_requests(status, relationship_type);
CREATE INDEX idx_consultant_requests_founder ON consultant_requests(founder_id);
```

### `consultant_request_responses` Table (NEW)

**Drizzle ORM Schema**: `frontend/src/db/schema/consultant-request-responses.ts`

```sql
CREATE TABLE consultant_request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES consultant_requests(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, accepted, declined
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- One response per consultant per request
  CONSTRAINT unique_consultant_request UNIQUE (request_id, consultant_id),
  CONSTRAINT valid_response_status CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- Indexes for response lookup
CREATE INDEX idx_request_responses_request ON consultant_request_responses(request_id);
CREATE INDEX idx_request_responses_consultant ON consultant_request_responses(consultant_id);
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
