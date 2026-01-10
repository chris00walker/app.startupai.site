-- ============================================================================
-- Modal Validation Progress Table
-- ============================================================================
-- Purpose: Append-only progress log enabling Supabase Realtime updates to UI
-- Used by: startupai-crew persistence.py (Modal serverless)
-- Reference: startupai-crew/docs/master-architecture/reference/database-schemas.md
-- Created: 2026-01-10

-- Progress log (append-only, enables Realtime)
CREATE TABLE IF NOT EXISTS validation_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES validation_runs(id) ON DELETE CASCADE,

    -- Execution context
    phase INTEGER CHECK (phase BETWEEN 0 AND 4),
    crew TEXT,  -- e.g., 'OnboardingCrew', 'DiscoveryCrew'
    task TEXT,  -- e.g., 'founder_interview', 'compile_brief'
    agent TEXT,  -- e.g., 'O1', 'GV1', 'S1'

    -- Status tracking
    status TEXT CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'skipped')),
    progress_pct INTEGER CHECK (progress_pct BETWEEN 0 AND 100),

    -- Output data
    output JSONB,  -- Task output (optional)
    error_message TEXT,  -- Error message if status='failed'
    duration_ms INTEGER,  -- Execution duration in milliseconds

    -- Timestamp (append-only, no updated_at needed)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for run queries (get all progress for a run)
CREATE INDEX IF NOT EXISTS idx_validation_progress_run ON validation_progress(run_id);

-- Index for ordered progress queries (latest first)
CREATE INDEX IF NOT EXISTS idx_validation_progress_created ON validation_progress(run_id, created_at DESC);

-- Index for phase/crew queries
CREATE INDEX IF NOT EXISTS idx_validation_progress_phase_crew ON validation_progress(run_id, phase, crew);

-- Enable RLS
ALTER TABLE validation_progress ENABLE ROW LEVEL SECURITY;

-- Users can view progress for their own validation runs
DROP POLICY IF EXISTS "Users can view their validation progress" ON validation_progress;
CREATE POLICY "Users can view their validation progress"
    ON validation_progress FOR SELECT
    USING (
        run_id IN (
            SELECT id FROM validation_runs WHERE user_id = auth.uid()
        )
    );

-- Service role can manage all progress (for Modal backend)
DROP POLICY IF EXISTS "Service role can manage validation progress" ON validation_progress;
CREATE POLICY "Service role can manage validation progress"
    ON validation_progress FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Enable Supabase Realtime for instant UI updates
-- Note: This adds the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE validation_progress;

-- Comments
COMMENT ON TABLE validation_progress IS 'Append-only progress log for Supabase Realtime UI updates';
COMMENT ON COLUMN validation_progress.output IS 'Task output as JSONB (optional, for debugging)';
COMMENT ON COLUMN validation_progress.duration_ms IS 'Task execution duration in milliseconds';
