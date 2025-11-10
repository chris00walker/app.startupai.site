-- ============================================================================
-- Consultant Onboarding Sessions Migration
-- ============================================================================
-- Created: November 10, 2025
-- Purpose: Add consultant_onboarding_sessions table for session persistence
-- Dependencies: Existing consultant_profiles table
-- Cross-Reference: Related to Phase 3: Consultant Features

-- ============================================================================
-- 1. Consultant Onboarding Sessions Table
-- ============================================================================

-- Create consultant_onboarding_sessions table for conversation state management
CREATE TABLE consultant_onboarding_sessions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User context
  user_email VARCHAR(255),
  user_context JSONB DEFAULT '{}',

  -- Session state
  status VARCHAR(50) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'abandoned', 'expired')),
  current_stage INTEGER NOT NULL DEFAULT 1
    CHECK (current_stage BETWEEN 1 AND 7),
  stage_progress INTEGER NOT NULL DEFAULT 0
    CHECK (stage_progress BETWEEN 0 AND 100),
  overall_progress INTEGER NOT NULL DEFAULT 0
    CHECK (overall_progress BETWEEN 0 AND 100),

  -- Conversation data (JSONB for flexibility)
  conversation_history JSONB NOT NULL DEFAULT '[]',
  stage_data JSONB NOT NULL DEFAULT '{}', -- Data collected per stage

  -- Consultant-specific data collected during stages
  practice_info JSONB DEFAULT '{}', -- Company name, size, structure
  industries JSONB DEFAULT '[]', -- Industries served
  services JSONB DEFAULT '[]', -- Services offered
  tools_used JSONB DEFAULT '[]', -- Current tools and workflow
  client_management JSONB DEFAULT '{}', -- Client management approach
  pain_points JSONB DEFAULT '[]', -- Challenges and pain points
  goals JSONB DEFAULT '{}', -- Goals and white-label interest

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  -- Constraints
  CONSTRAINT valid_consultant_session_id CHECK (LENGTH(session_id) >= 10),
  CONSTRAINT valid_consultant_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed' AND completed_at IS NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_consultant_onboarding_sessions_user_id ON consultant_onboarding_sessions(user_id);
CREATE INDEX idx_consultant_onboarding_sessions_session_id ON consultant_onboarding_sessions(session_id);
CREATE INDEX idx_consultant_onboarding_sessions_status ON consultant_onboarding_sessions(status);
CREATE INDEX idx_consultant_onboarding_sessions_expires_at ON consultant_onboarding_sessions(expires_at);
CREATE INDEX idx_consultant_onboarding_sessions_last_activity ON consultant_onboarding_sessions(last_activity);

-- Composite indexes for common queries
CREATE INDEX idx_consultant_onboarding_sessions_user_status ON consultant_onboarding_sessions(user_id, status);
CREATE INDEX idx_consultant_onboarding_sessions_active ON consultant_onboarding_sessions(status, last_activity)
  WHERE status = 'active';

-- Row Level Security
ALTER TABLE consultant_onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "Users can access their own consultant onboarding sessions" ON consultant_onboarding_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Service role can access all sessions (for admin/support)
CREATE POLICY "Service role can access all consultant onboarding sessions" ON consultant_onboarding_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. Link consultant_profiles to sessions
-- ============================================================================

-- Add last_session_id column to consultant_profiles for easy reference
ALTER TABLE consultant_profiles ADD COLUMN IF NOT EXISTS last_session_id VARCHAR(255);
ALTER TABLE consultant_profiles ADD COLUMN IF NOT EXISTS last_onboarding_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_consultant_profiles_last_session ON consultant_profiles(last_session_id);

-- ============================================================================
-- 3. Session Management Functions
-- ============================================================================

-- Function to update consultant session activity
CREATE OR REPLACE FUNCTION update_consultant_session_activity(
  p_session_id VARCHAR(255)
) RETURNS VOID AS $$
BEGIN
  UPDATE consultant_onboarding_sessions
  SET last_activity = NOW(),
      expires_at = NOW() + INTERVAL '7 days'
  WHERE session_id = p_session_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old consultant sessions
CREATE OR REPLACE FUNCTION expire_old_consultant_sessions() RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE consultant_onboarding_sessions
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Grant Permissions
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_consultant_session_activity TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION update_consultant_session_activity TO service_role;
GRANT EXECUTE ON FUNCTION expire_old_consultant_sessions TO service_role;

-- ============================================================================
-- 5. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE consultant_onboarding_sessions IS 'Stores AI-guided consultant onboarding conversation state and progress';
COMMENT ON FUNCTION update_consultant_session_activity IS 'Updates last activity timestamp and extends expiration for consultant sessions';
COMMENT ON FUNCTION expire_old_consultant_sessions IS 'Marks inactive consultant sessions as expired (run via cron)';
