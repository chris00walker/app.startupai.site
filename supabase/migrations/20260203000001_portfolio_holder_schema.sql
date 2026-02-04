-- Portfolio Holder Marketplace Schema Migration
-- Implements the Portfolio Holder / Consultant Reconciliation plan
-- @story US-PH01-07, US-FM01-11

-- ============================================================================
-- 1. Extend consultant_clients table for marketplace flows
-- ============================================================================

-- Add relationship_type column (NO DEFAULT - must be explicitly selected)
ALTER TABLE consultant_clients
ADD COLUMN IF NOT EXISTS relationship_type TEXT;

-- Backfill existing records with 'advisory' as default
UPDATE consultant_clients
SET relationship_type = 'advisory'
WHERE relationship_type IS NULL;

-- Now make it NOT NULL after backfill
ALTER TABLE consultant_clients
ALTER COLUMN relationship_type SET NOT NULL;

-- Add connection_status column (replaces status for expanded states)
ALTER TABLE consultant_clients
ADD COLUMN IF NOT EXISTS connection_status TEXT NOT NULL DEFAULT 'invited';

-- Migrate existing status values to connection_status
UPDATE consultant_clients
SET connection_status = status
WHERE connection_status = 'invited' AND status != 'invited';

-- Add initiated_by column
ALTER TABLE consultant_clients
ADD COLUMN IF NOT EXISTS initiated_by TEXT NOT NULL DEFAULT 'consultant';

-- Add request_message column
ALTER TABLE consultant_clients
ADD COLUMN IF NOT EXISTS request_message TEXT;

-- Add accepted_at column
ALTER TABLE consultant_clients
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Add declined_at column
ALTER TABLE consultant_clients
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE;

-- Add constraints for new columns
ALTER TABLE consultant_clients
ADD CONSTRAINT IF NOT EXISTS valid_relationship_type
CHECK (relationship_type IN ('advisory', 'capital', 'program', 'service', 'ecosystem'));

ALTER TABLE consultant_clients
ADD CONSTRAINT IF NOT EXISTS valid_connection_status
CHECK (connection_status IN ('invited', 'requested', 'active', 'declined', 'archived'));

ALTER TABLE consultant_clients
ADD CONSTRAINT IF NOT EXISTS valid_initiated_by
CHECK (initiated_by IN ('consultant', 'founder'));

-- Add index for relationship_type queries
CREATE INDEX IF NOT EXISTS idx_consultant_clients_relationship_type
ON consultant_clients(relationship_type);

-- Update existing index to use connection_status
DROP INDEX IF EXISTS idx_consultant_clients_status;
CREATE INDEX IF NOT EXISTS idx_consultant_clients_connection_status
ON consultant_clients(connection_status);

DROP INDEX IF EXISTS idx_consultant_clients_consultant_status;
CREATE INDEX IF NOT EXISTS idx_consultant_clients_consultant_connection_status
ON consultant_clients(consultant_id, connection_status);

-- Add index for pending requests (for founder dashboard)
CREATE INDEX IF NOT EXISTS idx_consultant_clients_pending_requests
ON consultant_clients(client_id, connection_status)
WHERE connection_status = 'requested';

-- ============================================================================
-- 2. Extend consultant_profiles table for verification
-- ============================================================================

-- Add verification_status column
ALTER TABLE consultant_profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified';

-- Add directory_opt_in column
ALTER TABLE consultant_profiles
ADD COLUMN IF NOT EXISTS directory_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Add default_relationship_type column
ALTER TABLE consultant_profiles
ADD COLUMN IF NOT EXISTS default_relationship_type TEXT;

-- Add grace_started_at column
ALTER TABLE consultant_profiles
ADD COLUMN IF NOT EXISTS grace_started_at TIMESTAMP WITH TIME ZONE;

-- Add constraints
ALTER TABLE consultant_profiles
ADD CONSTRAINT IF NOT EXISTS valid_verification_status
CHECK (verification_status IN ('unverified', 'verified', 'grace', 'revoked'));

ALTER TABLE consultant_profiles
ADD CONSTRAINT IF NOT EXISTS valid_default_relationship_type
CHECK (default_relationship_type IS NULL OR default_relationship_type IN ('advisory', 'capital', 'program', 'service', 'ecosystem'));

-- Add index for directory browsing
CREATE INDEX IF NOT EXISTS idx_consultant_profiles_directory
ON consultant_profiles(verification_status, directory_opt_in);

-- ============================================================================
-- 3. Extend user_profiles table for founder directory opt-in
-- ============================================================================

-- Add founder_directory_opt_in column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS founder_directory_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for founder directory browsing
CREATE INDEX IF NOT EXISTS idx_user_profiles_founder_opt_in
ON user_profiles(founder_directory_opt_in)
WHERE founder_directory_opt_in = TRUE;

-- NOTE: problem_fit lives in crewai_validation_states (not projects)
-- Index for VPD gate is created in a later migration after that table exists

-- ============================================================================
-- 4. Create consultant_requests table (RFQ)
-- ============================================================================

CREATE TABLE IF NOT EXISTS consultant_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  industries TEXT[],
  stage_preference TEXT,
  timeline TEXT,
  budget_range TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT valid_rfq_relationship_type
    CHECK (relationship_type IN ('advisory', 'capital', 'program', 'service', 'ecosystem')),
  CONSTRAINT valid_rfq_status
    CHECK (status IN ('open', 'filled', 'cancelled'))
);

-- Add indexes for RFQ browsing
CREATE INDEX IF NOT EXISTS idx_consultant_requests_status_type
ON consultant_requests(status, relationship_type);

CREATE INDEX IF NOT EXISTS idx_consultant_requests_founder
ON consultant_requests(founder_id);

CREATE INDEX IF NOT EXISTS idx_consultant_requests_expires
ON consultant_requests(expires_at);

-- Enable RLS
ALTER TABLE consultant_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Create consultant_request_responses table
-- ============================================================================

CREATE TABLE IF NOT EXISTS consultant_request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES consultant_requests(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- One response per consultant per request
  CONSTRAINT unique_consultant_request UNIQUE (request_id, consultant_id),
  CONSTRAINT valid_response_status CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- Add indexes for response lookup
CREATE INDEX IF NOT EXISTS idx_request_responses_request
ON consultant_request_responses(request_id);

CREATE INDEX IF NOT EXISTS idx_request_responses_consultant
ON consultant_request_responses(consultant_id);

CREATE INDEX IF NOT EXISTS idx_request_responses_pending
ON consultant_request_responses(request_id, status);

-- Enable RLS
ALTER TABLE consultant_request_responses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. Add updated_at trigger for new tables
-- ============================================================================

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to consultant_requests
DROP TRIGGER IF EXISTS update_consultant_requests_updated_at ON consultant_requests;
CREATE TRIGGER update_consultant_requests_updated_at
    BEFORE UPDATE ON consultant_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. Comments for documentation
-- ============================================================================

COMMENT ON COLUMN consultant_clients.relationship_type IS 'Type of relationship: advisory, capital, program, service, ecosystem';
COMMENT ON COLUMN consultant_clients.connection_status IS 'Connection state: invited, requested, active, declined, archived';
COMMENT ON COLUMN consultant_clients.initiated_by IS 'Who initiated: consultant or founder';
COMMENT ON COLUMN consultant_clients.request_message IS 'Optional message with connection request';

COMMENT ON COLUMN consultant_profiles.verification_status IS 'Marketplace verification: unverified, verified, grace, revoked';
COMMENT ON COLUMN consultant_profiles.directory_opt_in IS 'Whether consultant appears in Consultant Directory';
COMMENT ON COLUMN consultant_profiles.grace_started_at IS 'When 7-day grace period began (after payment failure)';

COMMENT ON COLUMN user_profiles.founder_directory_opt_in IS 'Whether founder appears in Founder Directory for verified consultants';

COMMENT ON TABLE consultant_requests IS 'RFQ (Request for Quote) - founders seeking capital/advice';
COMMENT ON TABLE consultant_request_responses IS 'Responses from verified consultants to RFQs';
