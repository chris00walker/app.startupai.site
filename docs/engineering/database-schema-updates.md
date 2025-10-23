# 🗄️ Database Schema Updates for Onboarding

**Supabase Schema Extensions for AI Onboarding**

**Status:** 🔴 **MISSING** - Required for launch  
**Priority:** **P0 - LAUNCH BLOCKER**  
**Estimated Implementation:** 2-3 hours  
**Cross-Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md) - Section 3.3 Database Architecture  

---

## 📋 Document Purpose

This specification defines the database schema updates required to support the AI-guided onboarding experience. These tables will store conversation state, entrepreneur briefs, and integrate with the existing projects system to deliver the promised AI functionality.

**Current Gap:** No database support for onboarding conversations  
**Required Solution:** Complete schema for session management and data collection  
**Business Impact:** Enables persistent AI conversations and data-driven strategic analysis  

---

## 1. Onboarding Sessions Table

### 1.1 Core Session Management

```sql
-- Create onboarding_sessions table for conversation state management
CREATE TABLE onboarding_sessions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plan and context
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
```

### 1.2 Session Management Functions

```sql
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
```

---

## 2. Entrepreneur Briefs Table

### 2.1 Structured Data Storage

```sql
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
```

### 2.2 Brief Management Functions

```sql
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
```

---

## 3. Integration with Existing Projects Table

### 3.1 Projects Table Extensions

```sql
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
```

---

## 4. Conversation Messages Table (Optional)

### 4.1 Detailed Message Storage

```sql
-- Optional: Separate table for detailed conversation messages
-- (Alternative to storing in JSONB in onboarding_sessions)
CREATE TABLE onboarding_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL REFERENCES onboarding_sessions(session_id) ON DELETE CASCADE,
  
  -- Message identification
  message_id VARCHAR(255) NOT NULL, -- Client-generated for deduplication
  sequence_number INTEGER NOT NULL,
  
  -- Message content
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('user', 'ai', 'system')),
  content TEXT NOT NULL,
  content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN ('text', 'voice_transcript', 'system_notification')),
  
  -- Conversation context
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 7),
  stage_progress INTEGER CHECK (stage_progress BETWEEN 0 AND 100),
  
  -- AI processing metadata
  ai_processing_time INTEGER, -- milliseconds
  ai_confidence_score INTEGER CHECK (ai_confidence_score BETWEEN 0 AND 100),
  ai_model_used VARCHAR(100),
  
  -- User interaction metadata
  user_response_time INTEGER, -- milliseconds from question to response
  user_confidence VARCHAR(20) CHECK (user_confidence IN ('high', 'medium', 'low')),
  
  -- Quality metrics
  clarity_score INTEGER CHECK (clarity_score BETWEEN 1 AND 5),
  helpfulness_score INTEGER CHECK (helpfulness_score BETWEEN 1 AND 5),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint on session + message_id for deduplication
  UNIQUE(session_id, message_id)
);

-- Indexes
CREATE INDEX idx_onboarding_messages_session_id ON onboarding_messages(session_id);
CREATE INDEX idx_onboarding_messages_sequence ON onboarding_messages(session_id, sequence_number);
CREATE INDEX idx_onboarding_messages_stage ON onboarding_messages(stage);
CREATE INDEX idx_onboarding_messages_type ON onboarding_messages(message_type);

-- Row Level Security
ALTER TABLE onboarding_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access messages from their own sessions" ON onboarding_messages
  FOR ALL USING (
    session_id IN (
      SELECT session_id FROM onboarding_sessions WHERE user_id = auth.uid()
    )
  );
```

---

## 5. Analytics and Reporting Views

### 5.1 Onboarding Analytics Views

```sql
-- View for onboarding session analytics
CREATE OR REPLACE VIEW onboarding_analytics AS
SELECT 
  os.plan_type,
  os.status,
  os.current_stage,
  os.overall_progress,
  os.conversation_quality_score,
  os.satisfaction_rating,
  eb.completeness_score,
  eb.overall_quality_score,
  eb.business_stage,
  
  -- Time metrics
  EXTRACT(EPOCH FROM (os.completed_at - os.started_at))/60 AS duration_minutes,
  EXTRACT(EPOCH FROM (os.last_activity - os.started_at))/60 AS active_duration_minutes,
  
  -- Completion metrics
  CASE WHEN os.status = 'completed' THEN 1 ELSE 0 END AS completed,
  CASE WHEN os.status = 'abandoned' THEN 1 ELSE 0 END AS abandoned,
  
  -- Quality metrics
  CASE WHEN eb.completeness_score >= 80 THEN 1 ELSE 0 END AS high_quality_brief,
  
  -- Timestamps for analysis
  DATE_TRUNC('day', os.started_at) AS session_date,
  DATE_TRUNC('hour', os.started_at) AS session_hour,
  
  os.created_at
FROM onboarding_sessions os
LEFT JOIN entrepreneur_briefs eb ON os.session_id = eb.session_id;

-- View for conversion funnel analysis
CREATE OR REPLACE VIEW onboarding_funnel AS
SELECT 
  plan_type,
  COUNT(*) AS total_sessions,
  COUNT(*) FILTER (WHERE current_stage >= 2) AS reached_stage_2,
  COUNT(*) FILTER (WHERE current_stage >= 3) AS reached_stage_3,
  COUNT(*) FILTER (WHERE current_stage >= 4) AS reached_stage_4,
  COUNT(*) FILTER (WHERE current_stage >= 5) AS reached_stage_5,
  COUNT(*) FILTER (WHERE current_stage >= 6) AS reached_stage_6,
  COUNT(*) FILTER (WHERE current_stage >= 7) AS reached_stage_7,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_sessions,
  
  -- Conversion rates
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*), 2) AS completion_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE current_stage >= 4) / COUNT(*), 2) AS mid_point_rate
FROM onboarding_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY plan_type;
```

---

## 6. Data Migration and Cleanup

### 6.1 Maintenance Functions

```sql
-- Function to clean up expired sessions and related data
CREATE OR REPLACE FUNCTION cleanup_expired_onboarding_data(
  p_retention_days INTEGER DEFAULT 90
) RETURNS TABLE(
  expired_sessions INTEGER,
  deleted_briefs INTEGER,
  deleted_messages INTEGER
) AS $$
DECLARE
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
  v_expired_sessions INTEGER;
  v_deleted_briefs INTEGER;
  v_deleted_messages INTEGER;
BEGIN
  v_cutoff_date := NOW() - (p_retention_days || ' days')::INTERVAL;
  
  -- Delete old messages (if using separate messages table)
  DELETE FROM onboarding_messages 
  WHERE session_id IN (
    SELECT session_id FROM onboarding_sessions 
    WHERE status IN ('expired', 'abandoned') 
    AND last_activity < v_cutoff_date
  );
  GET DIAGNOSTICS v_deleted_messages = ROW_COUNT;
  
  -- Delete old entrepreneur briefs
  DELETE FROM entrepreneur_briefs 
  WHERE session_id IN (
    SELECT session_id FROM onboarding_sessions 
    WHERE status IN ('expired', 'abandoned') 
    AND last_activity < v_cutoff_date
  );
  GET DIAGNOSTICS v_deleted_briefs = ROW_COUNT;
  
  -- Delete old sessions
  DELETE FROM onboarding_sessions 
  WHERE status IN ('expired', 'abandoned') 
  AND last_activity < v_cutoff_date;
  GET DIAGNOSTICS v_expired_sessions = ROW_COUNT;
  
  RETURN QUERY SELECT v_expired_sessions, v_deleted_briefs, v_deleted_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup to run daily
-- (This would be set up as a cron job or scheduled function)
```

---

## 7. Cross-References

**Primary Reference:** [`two-site-implementation-plan.md`](../../startupai.site/docs/technical/two-site-implementation-plan.md)
- Section 3.3: Database Architecture (existing schema)
- Lines 800-849: Core tables and extensions
- Section 2.2: Database status (100% complete base schema)

**Related Documentation:**
- [`onboarding-api-endpoints.md`](./onboarding-api-endpoints.md) - API integration requirements
- [`onboarding-agent-integration.md`](../features/onboarding-agent-integration.md) - Data collection requirements
- [`crewai-frontend-integration.md`](./crewai-frontend-integration.md) - Data flow patterns

**Implementation Dependencies:**
- Existing Supabase project with base schema
- Drizzle ORM integration for type-safe queries
- Row Level Security policies
- Database migration system

---

**Status:** 🔴 **CRITICAL IMPLEMENTATION REQUIRED**  
**Next Action:** Deploy schema updates to Supabase project  
**Owner:** Database/Backend team  
**Deadline:** Before API endpoint development  
