-- ============================================================================
-- Make Invite Fields Nullable (TASK-001)
-- ============================================================================
-- Created: February 3, 2026
-- Purpose: Allow marketplace connection requests without invite fields
-- Related: Portfolio Holder marketplace flows (US-PH03, US-FM03)
--
-- The consultant_clients table now supports two flows:
-- 1. Legacy invite flow: requires invite_email, invite_token, invite_expires_at
-- 2. Marketplace flow: connection requests without invite details
--
-- This migration makes invite fields nullable to support both flows.
-- ============================================================================

-- Make invite fields nullable
ALTER TABLE consultant_clients
  ALTER COLUMN invite_email DROP NOT NULL;

ALTER TABLE consultant_clients
  ALTER COLUMN invite_token DROP NOT NULL;

ALTER TABLE consultant_clients
  ALTER COLUMN invite_expires_at DROP NOT NULL;

-- The unique index on invite_token already allows NULLs in PostgreSQL
-- (NULLs are considered distinct, so multiple NULL tokens are allowed)

-- Add a partial unique index to ensure marketplace connections are unique
-- (one pending/active connection per consultant-client pair)
CREATE UNIQUE INDEX IF NOT EXISTS idx_consultant_clients_unique_marketplace_connection
  ON consultant_clients(consultant_id, client_id)
  WHERE client_id IS NOT NULL
    AND connection_status IN ('requested', 'active')
    AND invite_token IS NULL;

-- Add a comment explaining the two flows
COMMENT ON TABLE consultant_clients IS
  'Tracks consultant-client relationships via two flows: (1) Legacy invite flow with email/token, (2) Marketplace connection requests without invite details. Invite fields are nullable to support both.';

COMMENT ON COLUMN consultant_clients.invite_email IS
  'Email for legacy invite flow. NULL for marketplace connection requests.';

COMMENT ON COLUMN consultant_clients.invite_token IS
  'Token for legacy invite flow. NULL for marketplace connection requests.';

COMMENT ON COLUMN consultant_clients.invite_expires_at IS
  'Expiry for legacy invite flow. NULL for marketplace connection requests.';
