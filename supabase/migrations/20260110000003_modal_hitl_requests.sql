-- ============================================================================
-- Modal HITL Requests Table
-- ============================================================================
-- Purpose: Stores HITL checkpoint state for the checkpoint-and-resume pattern
-- Used by: startupai-crew persistence.py (Modal serverless)
-- Reference: startupai-crew/docs/master-architecture/reference/database-schemas.md
-- Created: 2026-01-10

-- HITL checkpoints for container resume
CREATE TABLE IF NOT EXISTS hitl_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES validation_runs(id) ON DELETE CASCADE,

    -- Checkpoint identification
    checkpoint_name TEXT NOT NULL,  -- e.g., 'approve_founders_brief', 'approve_vpc_completion'
    phase INTEGER NOT NULL CHECK (phase BETWEEN 0 AND 4),

    -- Human-readable context
    title TEXT NOT NULL,  -- e.g., "Approve Founder's Brief"
    description TEXT,  -- Explanation of what needs approval

    -- Decision context (for approval UI)
    context JSONB NOT NULL,  -- Full context for approval decision
    options JSONB,  -- Available options: [{"value": "approve", "label": "Approve"}, ...]
    recommended_option TEXT,  -- Recommended option value

    -- Decision state
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    decision TEXT,  -- The actual decision value (from options)
    decision_by UUID REFERENCES auth.users(id),
    decision_feedback TEXT,  -- Optional feedback from human

    -- Timestamps
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMPTZ  -- When decision was made
);

-- Index for run queries (get all HITL requests for a run)
CREATE INDEX IF NOT EXISTS idx_hitl_requests_run ON hitl_requests(run_id);

-- Partial index for pending HITL requests
CREATE INDEX IF NOT EXISTS idx_hitl_requests_pending ON hitl_requests(status)
    WHERE status = 'pending';

-- Index for checkpoint-specific queries
CREATE INDEX IF NOT EXISTS idx_hitl_requests_checkpoint ON hitl_requests(checkpoint_name, status);

-- Index for expiration queries (cleanup job)
CREATE INDEX IF NOT EXISTS idx_hitl_requests_expires ON hitl_requests(expires_at)
    WHERE status = 'pending';

-- Enable RLS
ALTER TABLE hitl_requests ENABLE ROW LEVEL SECURITY;

-- Users can view HITL requests for their own validation runs
DROP POLICY IF EXISTS "Users can view their HITL requests" ON hitl_requests;
CREATE POLICY "Users can view their HITL requests"
    ON hitl_requests FOR SELECT
    USING (
        run_id IN (
            SELECT id FROM validation_runs WHERE user_id = auth.uid()
        )
    );

-- Users can update (approve/reject) HITL requests for their own runs
DROP POLICY IF EXISTS "Users can resolve their HITL requests" ON hitl_requests;
CREATE POLICY "Users can resolve their HITL requests"
    ON hitl_requests FOR UPDATE
    USING (
        run_id IN (
            SELECT id FROM validation_runs WHERE user_id = auth.uid()
        )
    );

-- Service role can manage all HITL requests (for Modal backend)
DROP POLICY IF EXISTS "Service role can manage HITL requests" ON hitl_requests;
CREATE POLICY "Service role can manage HITL requests"
    ON hitl_requests FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Enable Supabase Realtime for approval notifications
ALTER PUBLICATION supabase_realtime ADD TABLE hitl_requests;

-- Function to expire old HITL requests
CREATE OR REPLACE FUNCTION expire_old_hitl_requests()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    UPDATE hitl_requests
    SET status = 'expired',
        resolved_at = NOW()
    WHERE status = 'pending'
      AND expires_at < NOW();

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION expire_old_hitl_requests TO service_role;

-- Comments
COMMENT ON TABLE hitl_requests IS 'Human-in-the-Loop checkpoint requests for Modal serverless validation';
COMMENT ON COLUMN hitl_requests.checkpoint_name IS 'Unique checkpoint identifier (e.g., approve_founders_brief)';
COMMENT ON COLUMN hitl_requests.context IS 'Full context JSONB for approval decision (varies by checkpoint)';
COMMENT ON COLUMN hitl_requests.options IS 'Available decision options for the UI';
COMMENT ON FUNCTION expire_old_hitl_requests IS 'Cleanup function to expire stale HITL requests (run via cron)';
