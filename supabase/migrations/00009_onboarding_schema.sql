-- ============================================================================
-- Onboarding Schema Migration
-- ============================================================================
-- Created: October 23, 2025
-- Purpose: Add onboarding sessions and entrepreneur briefs tables
-- Dependencies: Existing user_profiles, projects tables
-- Cross-Reference: docs/engineering/database-schema-updates.md

-- ============================================================================
-- 1. Onboarding Sessions Table
-- ============================================================================

-- Create onboarding_sessions table for conversation state management
CREATE TABLE onboarding_sessions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plan and context (updated for current pricing tiers)
  plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('trial', 'sprint', 'founder', 'enterprise')),
  user_context JSONB DEFAULT '{}',
  
  -- Session state
  status VARCHAR(50) NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'paused', 'completed', 'abandoned', 'expired', 'error')),
  current_stage INTEGER NOT NULL DEFAULT 1 
    CHECK (current_stage BETWEEN 1 AND 7),
  stage_progress INTEGER NOT NULL DEFAULT 0 
    CHECK (stage_progress BETWEEN 0 AND 100),
  overall_progress INTEGER NOT NULL DEFAULT 0 
    CHECK (overall_progress BETWEEN 0 AND 100),
  
  -- Conversation data (JSONB for flexibility)
  conversation_history JSONB NOT NULL DEFAULT '[]',
  stage_data JSONB NOT NULL DEFAULT '{}', -- Data collected per stage
  ai_context JSONB DEFAULT '{}', -- AI agent state and context
  
  -- Quality metrics
  response_quality_scores JSONB DEFAULT '{}',
  conversation_quality_score INTEGER CHECK (conversation_quality_score BETWEEN 0 AND 100),
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- User feedback
  user_feedback JSONB,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  referral_source VARCHAR(255),
  
  -- Constraints
  CONSTRAINT valid_session_id CHECK (LENGTH(session_id) >= 10),
  CONSTRAINT valid_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR 
    (status != 'completed' AND completed_at IS NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_sessions_session_id ON onboarding_sessions(session_id);
CREATE INDEX idx_onboarding_sessions_status ON onboarding_sessions(status);
CREATE INDEX idx_onboarding_sessions_expires_at ON onboarding_sessions(expires_at);
CREATE INDEX idx_onboarding_sessions_last_activity ON onboarding_sessions(last_activity);
CREATE INDEX idx_onboarding_sessions_plan_type ON onboarding_sessions(plan_type);

-- Composite indexes for common queries
CREATE INDEX idx_onboarding_sessions_user_status ON onboarding_sessions(user_id, status);
CREATE INDEX idx_onboarding_sessions_active_sessions ON onboarding_sessions(status, last_activity) 
  WHERE status = 'active';

-- Row Level Security
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "Users can access their own onboarding sessions" ON onboarding_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Service role can access all sessions (for admin/support)
CREATE POLICY "Service role can access all onboarding sessions" ON onboarding_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. Entrepreneur Briefs Table
-- ============================================================================

-- Create entrepreneur_briefs table for structured business data
CREATE TABLE entrepreneur_briefs (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL REFERENCES onboarding_sessions(session_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Customer segments (Stage 2)
  customer_segments JSONB DEFAULT '[]',
  primary_customer_segment JSONB,
  customer_segment_confidence INTEGER CHECK (customer_segment_confidence BETWEEN 1 AND 10),
  
  -- Problem definition (Stage 3)
  problem_description TEXT,
  problem_pain_level INTEGER CHECK (problem_pain_level BETWEEN 1 AND 10),
  problem_frequency VARCHAR(50) CHECK (problem_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'rarely')),
  problem_impact JSONB DEFAULT '{}',
  problem_evidence JSONB DEFAULT '[]',
  
  -- Solution concept (Stage 4)
  solution_description TEXT,
  solution_mechanism TEXT,
  unique_value_proposition TEXT,
  differentiation_factors JSONB DEFAULT '[]',
  solution_confidence INTEGER CHECK (solution_confidence BETWEEN 1 AND 10),
  
  -- Competitive landscape (Stage 5)
  competitors JSONB DEFAULT '[]',
  competitive_alternatives JSONB DEFAULT '[]',
  switching_barriers JSONB DEFAULT '[]',
  competitive_advantages JSONB DEFAULT '[]',
  
  -- Resources and constraints (Stage 6)
  budget_range VARCHAR(100),
  budget_constraints JSONB DEFAULT '{}',
  available_channels JSONB DEFAULT '[]',
  existing_assets JSONB DEFAULT '[]',
  team_capabilities JSONB DEFAULT '[]',
  time_constraints JSONB DEFAULT '{}',
  
  -- Business stage and goals (Stage 7)
  business_stage VARCHAR(50) CHECK (business_stage IN ('idea', 'validation', 'early_traction', 'scaling', 'growth')),
  three_month_goals JSONB DEFAULT '[]',
  six_month_goals JSONB DEFAULT '[]',
  success_criteria JSONB DEFAULT '[]',
  key_metrics JSONB DEFAULT '[]',
  
  -- Quality and completeness metrics
  completeness_score INTEGER CHECK (completeness_score BETWEEN 0 AND 100),
  clarity_score INTEGER CHECK (clarity_score BETWEEN 0 AND 100),
  consistency_score INTEGER CHECK (consistency_score BETWEEN 0 AND 100),
  overall_quality_score INTEGER CHECK (overall_quality_score BETWEEN 0 AND 100),
  
  -- AI analysis metadata
  ai_confidence_scores JSONB DEFAULT '{}',
  validation_flags JSONB DEFAULT '[]',
  recommended_next_steps JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Version control for iterative updates
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES entrepreneur_briefs(id)
);

-- Indexes for performance
CREATE INDEX idx_entrepreneur_briefs_user_id ON entrepreneur_briefs(user_id);
CREATE INDEX idx_entrepreneur_briefs_session_id ON entrepreneur_briefs(session_id);
CREATE INDEX idx_entrepreneur_briefs_business_stage ON entrepreneur_briefs(business_stage);
CREATE INDEX idx_entrepreneur_briefs_completeness ON entrepreneur_briefs(completeness_score);
CREATE INDEX idx_entrepreneur_briefs_quality ON entrepreneur_briefs(overall_quality_score);

-- Full-text search on key text fields
CREATE INDEX idx_entrepreneur_briefs_search ON entrepreneur_briefs 
  USING gin(to_tsvector('english', 
    COALESCE(problem_description, '') || ' ' || 
    COALESCE(solution_description, '') || ' ' || 
    COALESCE(unique_value_proposition, '')
  ));

-- Row Level Security
ALTER TABLE entrepreneur_briefs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own briefs
CREATE POLICY "Users can access their own entrepreneur briefs" ON entrepreneur_briefs
  FOR ALL USING (auth.uid() = user_id);

-- Service role can access all briefs
CREATE POLICY "Service role can access all entrepreneur briefs" ON entrepreneur_briefs
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_entrepreneur_brief_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entrepreneur_briefs_updated_at
  BEFORE UPDATE ON entrepreneur_briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_entrepreneur_brief_timestamp();

-- ============================================================================
-- 3. Integration with Existing Projects Table
-- ============================================================================

-- Add onboarding integration columns to existing projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS onboarding_session_id VARCHAR(255) 
  REFERENCES onboarding_sessions(session_id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS entrepreneur_brief_id UUID 
  REFERENCES entrepreneur_briefs(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS initial_analysis_workflow_id VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS onboarding_quality_score INTEGER 
  CHECK (onboarding_quality_score BETWEEN 0 AND 100);

-- Create indexes for onboarding integration
CREATE INDEX IF NOT EXISTS idx_projects_onboarding_session ON projects(onboarding_session_id);
CREATE INDEX IF NOT EXISTS idx_projects_entrepreneur_brief ON projects(entrepreneur_brief_id);
CREATE INDEX IF NOT EXISTS idx_projects_onboarding_completed ON projects(onboarding_completed_at);

-- ============================================================================
-- 4. Session Management Functions
-- ============================================================================

-- Function to create a new onboarding session
CREATE OR REPLACE FUNCTION create_onboarding_session(
  p_user_id UUID,
  p_plan_type VARCHAR(50),
  p_user_context JSONB DEFAULT '{}'
) RETURNS VARCHAR(255) AS $$
DECLARE
  v_session_id VARCHAR(255);
BEGIN
  -- Generate unique session ID
  v_session_id := 'onb_' || encode(gen_random_bytes(16), 'hex');
  
  -- Insert new session
  INSERT INTO onboarding_sessions (
    session_id,
    user_id,
    plan_type,
    user_context,
    started_at,
    last_activity,
    expires_at
  ) VALUES (
    v_session_id,
    p_user_id,
    p_plan_type,
    p_user_context,
    NOW(),
    NOW(),
    NOW() + INTERVAL '24 hours'
  );
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(
  p_session_id VARCHAR(255)
) RETURNS VOID AS $$
BEGIN
  UPDATE onboarding_sessions 
  SET last_activity = NOW(),
      expires_at = NOW() + INTERVAL '24 hours'
  WHERE session_id = p_session_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old sessions
CREATE OR REPLACE FUNCTION expire_old_sessions() RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE onboarding_sessions 
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Brief Management Functions
-- ============================================================================

-- Function to calculate brief completeness
CREATE OR REPLACE FUNCTION calculate_brief_completeness(
  p_brief_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_brief entrepreneur_briefs%ROWTYPE;
  v_completeness INTEGER := 0;
  v_total_sections INTEGER := 6;
  v_completed_sections INTEGER := 0;
BEGIN
  SELECT * INTO v_brief FROM entrepreneur_briefs WHERE id = p_brief_id;
  
  -- Check each section for completeness
  IF jsonb_array_length(v_brief.customer_segments) > 0 THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;
  
  IF v_brief.problem_description IS NOT NULL AND LENGTH(v_brief.problem_description) > 50 THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;
  
  IF v_brief.solution_description IS NOT NULL AND LENGTH(v_brief.solution_description) > 50 THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;
  
  IF jsonb_array_length(v_brief.competitors) > 0 THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;
  
  IF v_brief.budget_range IS NOT NULL THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;
  
  IF v_brief.business_stage IS NOT NULL THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;
  
  v_completeness := (v_completed_sections * 100) / v_total_sections;
  
  -- Update the completeness score
  UPDATE entrepreneur_briefs 
  SET completeness_score = v_completeness 
  WHERE id = p_brief_id;
  
  RETURN v_completeness;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update entrepreneur brief
CREATE OR REPLACE FUNCTION upsert_entrepreneur_brief(
  p_session_id VARCHAR(255),
  p_user_id UUID,
  p_brief_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_brief_id UUID;
  v_existing_brief entrepreneur_briefs%ROWTYPE;
BEGIN
  -- Check if brief already exists for this session
  SELECT * INTO v_existing_brief 
  FROM entrepreneur_briefs 
  WHERE session_id = p_session_id;
  
  IF FOUND THEN
    -- Update existing brief
    UPDATE entrepreneur_briefs SET
      customer_segments = COALESCE((p_brief_data->>'customer_segments')::jsonb, customer_segments),
      problem_description = COALESCE(p_brief_data->>'problem_description', problem_description),
      solution_description = COALESCE(p_brief_data->>'solution_description', solution_description),
      competitors = COALESCE((p_brief_data->>'competitors')::jsonb, competitors),
      budget_range = COALESCE(p_brief_data->>'budget_range', budget_range),
      business_stage = COALESCE(p_brief_data->>'business_stage', business_stage),
      updated_at = NOW()
    WHERE id = v_existing_brief.id;
    
    v_brief_id := v_existing_brief.id;
  ELSE
    -- Create new brief
    INSERT INTO entrepreneur_briefs (
      session_id,
      user_id,
      customer_segments,
      problem_description,
      solution_description,
      competitors,
      budget_range,
      business_stage
    ) VALUES (
      p_session_id,
      p_user_id,
      (p_brief_data->>'customer_segments')::jsonb,
      p_brief_data->>'problem_description',
      p_brief_data->>'solution_description',
      (p_brief_data->>'competitors')::jsonb,
      p_brief_data->>'budget_range',
      p_brief_data->>'business_stage'
    ) RETURNING id INTO v_brief_id;
  END IF;
  
  -- Calculate and update completeness
  PERFORM calculate_brief_completeness(v_brief_id);
  
  RETURN v_brief_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create project from onboarding session
CREATE OR REPLACE FUNCTION create_project_from_onboarding(
  p_session_id VARCHAR(255),
  p_project_name VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_session onboarding_sessions%ROWTYPE;
  v_brief entrepreneur_briefs%ROWTYPE;
  v_project_id UUID;
  v_project_name VARCHAR(255);
BEGIN
  -- Get session and brief data
  SELECT * INTO v_session FROM onboarding_sessions WHERE session_id = p_session_id;
  SELECT * INTO v_brief FROM entrepreneur_briefs WHERE session_id = p_session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Onboarding session not found: %', p_session_id;
  END IF;
  
  -- Generate project name if not provided
  IF p_project_name IS NULL THEN
    v_project_name := COALESCE(
      v_brief.unique_value_proposition,
      'Project from ' || TO_CHAR(v_session.started_at, 'YYYY-MM-DD')
    );
  ELSE
    v_project_name := p_project_name;
  END IF;
  
  -- Create project
  INSERT INTO projects (
    user_id,
    name,
    description,
    stage,
    onboarding_session_id,
    entrepreneur_brief_id,
    onboarding_completed_at,
    onboarding_quality_score,
    created_at,
    updated_at
  ) VALUES (
    v_session.user_id,
    v_project_name,
    v_brief.problem_description,
    CASE v_brief.business_stage
      WHEN 'idea' THEN 'idea'
      WHEN 'validation' THEN 'validation'
      ELSE 'scaling'
    END,
    p_session_id,
    v_brief.id,
    NOW(),
    v_brief.overall_quality_score,
    NOW(),
    NOW()
  ) RETURNING id INTO v_project_id;
  
  -- Update session status
  UPDATE onboarding_sessions 
  SET status = 'completed', completed_at = NOW()
  WHERE session_id = p_session_id;
  
  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Grant Permissions
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_onboarding_session TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_activity TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_brief_completeness TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_entrepreneur_brief TO authenticated;
GRANT EXECUTE ON FUNCTION create_project_from_onboarding TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION create_onboarding_session TO service_role;
GRANT EXECUTE ON FUNCTION update_session_activity TO service_role;
GRANT EXECUTE ON FUNCTION expire_old_sessions TO service_role;
GRANT EXECUTE ON FUNCTION calculate_brief_completeness TO service_role;
GRANT EXECUTE ON FUNCTION upsert_entrepreneur_brief TO service_role;
GRANT EXECUTE ON FUNCTION create_project_from_onboarding TO service_role;

-- ============================================================================
-- 7. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE onboarding_sessions IS 'Stores AI-guided onboarding conversation state and progress for all user tiers';
COMMENT ON TABLE entrepreneur_briefs IS 'Structured business data collected during onboarding conversations';

COMMENT ON FUNCTION create_onboarding_session IS 'Creates a new onboarding session with unique session ID';
COMMENT ON FUNCTION update_session_activity IS 'Updates last activity timestamp and extends expiration';
COMMENT ON FUNCTION expire_old_sessions IS 'Marks inactive sessions as expired (run via cron)';
COMMENT ON FUNCTION calculate_brief_completeness IS 'Calculates completeness score based on filled sections';
COMMENT ON FUNCTION upsert_entrepreneur_brief IS 'Creates or updates entrepreneur brief data';
COMMENT ON FUNCTION create_project_from_onboarding IS 'Creates project from completed onboarding session';
