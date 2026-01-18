-- ============================================================================
-- Consultant Clients Migration
-- ============================================================================
-- Created: January 18, 2026
-- Purpose: Add consultant_clients table for invite-based client onboarding
-- Dependencies: user_profiles table
-- Related: Consultant-Client relationship management feature

-- ============================================================================
-- 1. Consultant Clients Table
-- ============================================================================
-- Tracks the relationship between consultants and their clients,
-- including invite status, tokens, and archival state.

CREATE TABLE consultant_clients (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Invite details
  invite_email TEXT NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  invite_expires_at TIMESTAMPTZ NOT NULL,

  -- Optional: Client name for personalization before they sign up
  client_name TEXT,

  -- Status tracking
  -- 'invited': Invite sent, waiting for signup
  -- 'active': Client has signed up and is linked
  -- 'archived': Relationship ended (soft delete)
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'active', 'archived')),

  -- Timestamps
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archived_by TEXT CHECK (archived_by IN ('consultant', 'client')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. Constraints
-- ============================================================================

-- Ensure 1:1 relationship (a client can only be linked to one consultant)
-- This constraint can be dropped later to support multiple consultants
CREATE UNIQUE INDEX idx_consultant_clients_unique_active_client
  ON consultant_clients(client_id)
  WHERE client_id IS NOT NULL AND status != 'archived';

-- Prevent duplicate pending invites to same email from same consultant
CREATE UNIQUE INDEX idx_consultant_clients_unique_pending_invite
  ON consultant_clients(consultant_id, invite_email)
  WHERE status = 'invited';

-- ============================================================================
-- 3. Indexes for Performance
-- ============================================================================

CREATE INDEX idx_consultant_clients_consultant ON consultant_clients(consultant_id);
CREATE INDEX idx_consultant_clients_client ON consultant_clients(client_id);
CREATE INDEX idx_consultant_clients_token ON consultant_clients(invite_token);
CREATE INDEX idx_consultant_clients_status ON consultant_clients(status);
CREATE INDEX idx_consultant_clients_invite_email ON consultant_clients(invite_email);

-- Composite indexes for common queries
CREATE INDEX idx_consultant_clients_consultant_status
  ON consultant_clients(consultant_id, status);
CREATE INDEX idx_consultant_clients_pending_expiry
  ON consultant_clients(invite_expires_at)
  WHERE status = 'invited';

-- ============================================================================
-- 4. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE consultant_clients ENABLE ROW LEVEL SECURITY;

-- Consultants can view and manage their own invites/clients
CREATE POLICY "Consultants can manage their own client relationships"
  ON consultant_clients
  FOR ALL
  USING (consultant_id = auth.uid());

-- Clients can view their own relationship
CREATE POLICY "Clients can view their consultant relationship"
  ON consultant_clients
  FOR SELECT
  USING (client_id = auth.uid());

-- Clients can archive (unlink) themselves
CREATE POLICY "Clients can unlink from consultant"
  ON consultant_clients
  FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (
    status = 'archived'
    AND archived_by = 'client'
    AND archived_at IS NOT NULL
  );

-- Service role has full access
CREATE POLICY "Service role has full access to consultant_clients"
  ON consultant_clients
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 5. Updated_at Trigger
-- ============================================================================

CREATE TRIGGER update_consultant_clients_updated_at
  BEFORE UPDATE ON consultant_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. Helper Functions
-- ============================================================================

-- Function to link a client account to a consultant via invite token
CREATE OR REPLACE FUNCTION link_client_via_invite(
  p_invite_token TEXT,
  p_client_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_consultant_name TEXT;
BEGIN
  -- Find the invite
  SELECT * INTO v_invite
  FROM consultant_clients
  WHERE invite_token = p_invite_token
    AND status = 'invited'
  FOR UPDATE;

  -- Validate invite exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invite token'
    );
  END IF;

  -- Check if expired
  IF v_invite.invite_expires_at < NOW() THEN
    -- Mark as expired
    UPDATE consultant_clients
    SET status = 'archived',
        archived_at = NOW(),
        archived_by = 'system'
    WHERE id = v_invite.id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invite has expired'
    );
  END IF;

  -- Link the client
  UPDATE consultant_clients
  SET client_id = p_client_id,
      status = 'active',
      linked_at = NOW()
  WHERE id = v_invite.id;

  -- Also update user_profiles.consultant_id for backwards compatibility
  UPDATE user_profiles
  SET consultant_id = v_invite.consultant_id
  WHERE id = p_client_id;

  -- Get consultant name for response
  SELECT full_name INTO v_consultant_name
  FROM user_profiles
  WHERE id = v_invite.consultant_id;

  RETURN jsonb_build_object(
    'success', true,
    'consultant_id', v_invite.consultant_id,
    'consultant_name', v_consultant_name
  );
END;
$$;

-- Function to validate an invite token (public, for signup page)
CREATE OR REPLACE FUNCTION validate_invite_token(
  p_invite_token TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_consultant RECORD;
BEGIN
  -- Find the invite
  SELECT * INTO v_invite
  FROM consultant_clients
  WHERE invite_token = p_invite_token
    AND status = 'invited';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invite not found or already used'
    );
  END IF;

  -- Check if expired
  IF v_invite.invite_expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invite has expired'
    );
  END IF;

  -- Get consultant details
  SELECT id, full_name, company INTO v_consultant
  FROM user_profiles
  WHERE id = v_invite.consultant_id;

  RETURN jsonb_build_object(
    'valid', true,
    'email', v_invite.invite_email,
    'client_name', v_invite.client_name,
    'consultant_id', v_consultant.id,
    'consultant_name', v_consultant.full_name,
    'consultant_company', v_consultant.company,
    'expires_at', v_invite.invite_expires_at
  );
END;
$$;

-- Function to expire old invites (for cron job)
CREATE OR REPLACE FUNCTION expire_old_consultant_invites()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE consultant_clients
  SET status = 'archived',
      archived_at = NOW(),
      archived_by = 'system'
  WHERE status = 'invited'
    AND invite_expires_at < NOW();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$;

-- ============================================================================
-- 7. Grant Permissions
-- ============================================================================

-- Grant execute to authenticated users (for linking via invite)
GRANT EXECUTE ON FUNCTION link_client_via_invite TO authenticated;

-- Grant execute to anon for invite validation (signup page)
GRANT EXECUTE ON FUNCTION validate_invite_token TO anon;
GRANT EXECUTE ON FUNCTION validate_invite_token TO authenticated;

-- Grant to service role for admin operations
GRANT EXECUTE ON FUNCTION expire_old_consultant_invites TO service_role;

-- ============================================================================
-- 8. Documentation Comments
-- ============================================================================

COMMENT ON TABLE consultant_clients IS
  'Tracks consultant-client relationships including invite status and archival';

COMMENT ON COLUMN consultant_clients.invite_token IS
  'Unique token sent to client email for signup linking (32 chars, secure random)';

COMMENT ON COLUMN consultant_clients.status IS
  'Relationship status: invited (pending), active (linked), archived (ended)';

COMMENT ON COLUMN consultant_clients.archived_by IS
  'Who initiated the archive: consultant, client, or system (expired)';

COMMENT ON FUNCTION link_client_via_invite IS
  'Links a newly signed up client to their consultant via invite token';

COMMENT ON FUNCTION validate_invite_token IS
  'Validates an invite token and returns consultant details for signup page';

COMMENT ON FUNCTION expire_old_consultant_invites IS
  'Marks expired invites as archived (run via cron daily)';
