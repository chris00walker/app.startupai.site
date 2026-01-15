-- ============================================================================
-- Founders Briefs Table
-- ============================================================================
-- Created: 2026-01-15
-- Purpose: Layer 2 validated briefs from CrewAI OnboardingCrew S1 agent
-- Distinction: entrepreneur_briefs = Layer 1 (Alex chat extraction)
--              founders_briefs = Layer 2 (validated hypotheses)
-- Reference: startupai-crew/src/state/models.py FoundersBrief Pydantic model
-- Reference: startupai-crew/docs/master-architecture/reference/database-schemas.md

-- ============================================================================
-- 1. Create Founders Briefs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS founders_briefs (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) REFERENCES onboarding_sessions(session_id) ON DELETE CASCADE,
    entrepreneur_brief_id UUID REFERENCES entrepreneur_briefs(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Version control
    version INTEGER NOT NULL DEFAULT 1,
    
    -- The Idea (nested object from Pydantic TheIdea model)
    idea_one_liner TEXT NOT NULL,
    idea_description TEXT NOT NULL,
    idea_inspiration TEXT,
    idea_unique_insight TEXT,
    
    -- Problem Hypothesis (nested object from Pydantic ProblemHypothesis model)
    problem_statement TEXT NOT NULL,
    problem_who_has_this TEXT NOT NULL,
    problem_frequency TEXT,
    problem_current_alternatives TEXT,
    problem_why_alternatives_fail TEXT,
    problem_evidence TEXT,
    problem_validation_status TEXT DEFAULT 'HYPOTHESIS - NOT VALIDATED',
    
    -- Customer Hypothesis (nested object from Pydantic CustomerHypothesis model)
    customer_primary_segment TEXT NOT NULL,
    customer_segment_description TEXT,
    customer_characteristics JSONB DEFAULT '[]',  -- Array of strings
    customer_where_to_find TEXT,
    customer_estimated_size TEXT,
    customer_validation_status TEXT DEFAULT 'HYPOTHESIS - NOT VALIDATED',
    
    -- Solution Hypothesis (nested object from Pydantic SolutionHypothesis model)
    solution_proposed TEXT NOT NULL,
    solution_key_features JSONB DEFAULT '[]',  -- Array of strings
    solution_differentiation TEXT,
    solution_unfair_advantage TEXT,
    solution_validation_status TEXT DEFAULT 'HYPOTHESIS - NOT VALIDATED',
    
    -- Key Assumptions (array of Assumption objects)
    key_assumptions JSONB NOT NULL DEFAULT '[]',
    -- Schema: [{"assumption": "...", "category": "customer|problem|solution|business_model", 
    --           "risk_level": "high|medium|low", "how_to_test": "...", 
    --           "testable": true, "tested": false, "validated": null}]
    
    -- Success Criteria (nested object from Pydantic SuccessCriteria model)
    success_minimum_viable_signal TEXT,
    success_deal_breakers JSONB DEFAULT '[]',  -- Array of strings
    success_target_metrics JSONB DEFAULT '{}',  -- Dict of metric_name: target_value
    success_problem_resonance_target DECIMAL(3,2) DEFAULT 0.50,
    success_zombie_ratio_max DECIMAL(3,2) DEFAULT 0.30,
    success_fit_score_target INTEGER DEFAULT 70,
    
    -- Founder Context (nested object from Pydantic FounderContext model)
    founder_background TEXT,
    founder_motivation TEXT,
    founder_time_commitment TEXT DEFAULT 'exploring' 
        CHECK (founder_time_commitment IN ('full_time', 'part_time', 'exploring')),
    founder_resources_available TEXT,
    
    -- QA Status (nested object from Pydantic QAStatus model)
    qa_legitimacy_check TEXT DEFAULT 'pending' 
        CHECK (qa_legitimacy_check IN ('pass', 'fail', 'needs_review', 'pending')),
    qa_legitimacy_notes TEXT,
    qa_intent_verification TEXT DEFAULT 'pending' 
        CHECK (qa_intent_verification IN ('pass', 'fail', 'needs_followup', 'pending')),
    qa_intent_notes TEXT,
    qa_overall_status TEXT DEFAULT 'pending' 
        CHECK (qa_overall_status IN ('approved', 'rejected', 'pending')),
    
    -- Interview Metadata (nested object from Pydantic InterviewMetadata model)
    interview_duration_minutes INTEGER DEFAULT 0,
    interview_turns INTEGER DEFAULT 0,
    interview_followup_questions INTEGER DEFAULT 0,
    interview_confidence_score DECIMAL(3,2) DEFAULT 0.00 
        CHECK (interview_confidence_score BETWEEN 0.00 AND 1.00),
    
    -- Approval workflow (HITL integration)
    approval_status TEXT DEFAULT 'pending' 
        CHECK (approval_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_session_brief UNIQUE (session_id, version)
);

-- ============================================================================
-- 2. Add Indexes for Performance
-- ============================================================================

-- Core lookup indexes
CREATE INDEX IF NOT EXISTS idx_founders_briefs_user ON founders_briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_founders_briefs_session ON founders_briefs(session_id);
CREATE INDEX IF NOT EXISTS idx_founders_briefs_entrepreneur_brief ON founders_briefs(entrepreneur_brief_id);

-- Approval workflow indexes
CREATE INDEX IF NOT EXISTS idx_founders_briefs_approval_status ON founders_briefs(approval_status) 
    WHERE approval_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_founders_briefs_qa_status ON founders_briefs(qa_overall_status);

-- Full-text search on key text fields
CREATE INDEX IF NOT EXISTS idx_founders_briefs_search ON founders_briefs 
    USING gin(to_tsvector('english', 
        COALESCE(idea_one_liner, '') || ' ' || 
        COALESCE(idea_description, '') || ' ' || 
        COALESCE(problem_statement, '') || ' ' ||
        COALESCE(solution_proposed, '')
    ));

-- ============================================================================
-- 3. Row Level Security Policies
-- ============================================================================

ALTER TABLE founders_briefs ENABLE ROW LEVEL SECURITY;

-- Users can view their own founders briefs
DROP POLICY IF EXISTS "Users can view their own founders briefs" ON founders_briefs;
CREATE POLICY "Users can view their own founders briefs"
    ON founders_briefs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own founders briefs (typically done by webhook)
DROP POLICY IF EXISTS "Users can insert their own founders briefs" ON founders_briefs;
CREATE POLICY "Users can insert their own founders briefs"
    ON founders_briefs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update approval status on their own briefs
DROP POLICY IF EXISTS "Users can update approval on their briefs" ON founders_briefs;
CREATE POLICY "Users can update approval on their briefs"
    ON founders_briefs FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role can manage all founders briefs (for Modal webhook)
DROP POLICY IF EXISTS "Service role can manage founders briefs" ON founders_briefs;
CREATE POLICY "Service role can manage founders briefs"
    ON founders_briefs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 4. Trigger for updated_at Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_founders_briefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS founders_briefs_updated_at ON founders_briefs;
CREATE TRIGGER founders_briefs_updated_at
    BEFORE UPDATE ON founders_briefs
    FOR EACH ROW
    EXECUTE FUNCTION update_founders_briefs_updated_at();

-- ============================================================================
-- 5. Enable Realtime for HITL Approvals
-- ============================================================================

-- Add founders_briefs to Realtime publication for approval notifications
-- Exclude large JSONB columns to reduce WebSocket payload
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE founders_briefs;
    EXCEPTION
        WHEN undefined_table THEN NULL;
        WHEN object_not_in_prerequisite_state THEN NULL;
    END;
    
    ALTER PUBLICATION supabase_realtime ADD TABLE founders_briefs (
        id,
        session_id,
        user_id,
        version,
        idea_one_liner,
        approval_status,
        qa_overall_status,
        approved_at,
        created_at,
        updated_at
    );
END $$;

-- ============================================================================
-- 6. Foreign Key Enhancement: Add founders_brief_id to projects
-- ============================================================================

-- Add foreign key to projects table for linking validated briefs
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS founders_brief_id UUID REFERENCES founders_briefs(id);

-- Create index for project lookups
CREATE INDEX IF NOT EXISTS idx_projects_founders_brief ON projects(founders_brief_id);

-- ============================================================================
-- 7. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE founders_briefs IS 'Layer 2 validated Founder Briefs from CrewAI OnboardingCrew S1 agent (NOT entrepreneur_briefs)';
COMMENT ON COLUMN founders_briefs.entrepreneur_brief_id IS 'Links to Layer 1 extraction (entrepreneur_briefs) for audit trail';
COMMENT ON COLUMN founders_briefs.key_assumptions IS 'Array of Assumption objects with testable hypotheses';
COMMENT ON COLUMN founders_briefs.qa_overall_status IS 'Quality assurance status: approved = ready for Phase 1';
COMMENT ON COLUMN founders_briefs.approval_status IS 'HITL approval status: approved = founder confirmed brief';

-- ============================================================================
-- 8. Grant Permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON founders_briefs TO authenticated;
GRANT ALL ON founders_briefs TO service_role;
GRANT EXECUTE ON FUNCTION update_founders_briefs_updated_at TO authenticated;
GRANT EXECUTE ON FUNCTION update_founders_briefs_updated_at TO service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================
