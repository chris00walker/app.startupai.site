-- ============================================================================
-- Modal Validation Runs Table
-- ============================================================================
-- Purpose: Tracks the state of each validation run for checkpoint/resume pattern
-- Used by: startupai-crew persistence.py (Modal serverless)
-- Reference: startupai-crew/docs/master-architecture/reference/database-schemas.md
-- Created: 2026-01-10

-- Validation run state persistence
CREATE TABLE IF NOT EXISTS validation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Execution state
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed')),
    current_phase INTEGER DEFAULT 0 CHECK (current_phase BETWEEN 0 AND 4),
    phase_state JSONB DEFAULT '{}',  -- Serialized ValidationRunState Pydantic model

    -- HITL checkpoint state
    hitl_state TEXT,  -- NULL or checkpoint name when paused (e.g., 'approve_founders_brief')
    hitl_checkpoint_at TIMESTAMPTZ,  -- When HITL checkpoint was created

    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for project queries (find all runs for a project)
CREATE INDEX IF NOT EXISTS idx_validation_runs_project ON validation_runs(project_id);

-- Index for user queries (find all runs for a user)
CREATE INDEX IF NOT EXISTS idx_validation_runs_user ON validation_runs(user_id);

-- Partial index for active runs (running or paused only)
CREATE INDEX IF NOT EXISTS idx_validation_runs_status_active ON validation_runs(status)
    WHERE status IN ('running', 'paused');

-- Index for HITL state queries (find runs waiting for approval)
CREATE INDEX IF NOT EXISTS idx_validation_runs_hitl ON validation_runs(hitl_state)
    WHERE hitl_state IS NOT NULL;

-- Enable RLS
ALTER TABLE validation_runs ENABLE ROW LEVEL SECURITY;

-- Users can view their own validation runs
DROP POLICY IF EXISTS "Users can view their own validation runs" ON validation_runs;
CREATE POLICY "Users can view their own validation runs"
    ON validation_runs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own validation runs
DROP POLICY IF EXISTS "Users can insert their own validation runs" ON validation_runs;
CREATE POLICY "Users can insert their own validation runs"
    ON validation_runs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role can manage all validation runs (for Modal backend)
DROP POLICY IF EXISTS "Service role can manage validation runs" ON validation_runs;
CREATE POLICY "Service role can manage validation runs"
    ON validation_runs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_validation_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_validation_runs_updated_at ON validation_runs;
CREATE TRIGGER update_validation_runs_updated_at
    BEFORE UPDATE ON validation_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_validation_runs_updated_at();

-- Comments
COMMENT ON TABLE validation_runs IS 'Modal serverless validation run state persistence for checkpoint/resume pattern';
COMMENT ON COLUMN validation_runs.phase_state IS 'Serialized ValidationRunState Pydantic model as JSONB';
COMMENT ON COLUMN validation_runs.hitl_state IS 'Current HITL checkpoint name when status=paused, NULL otherwise';
