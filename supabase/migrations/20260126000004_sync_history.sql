-- ============================================================================
-- Sync History Table
-- ============================================================================
-- Created: 2026-01-26
-- Purpose: Track synchronization of StartupAI data to external platforms
-- Reference: US-BI02 - Sync Project to External Platform
-- ============================================================================

-- ============================================================================
-- SYNC HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User context
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Project being synced
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Target integration
    integration_type integration_type NOT NULL,

    -- External target reference
    target_id TEXT,
    target_url TEXT,

    -- Data that was synced
    synced_data JSONB NOT NULL DEFAULT '{}',

    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    error_message TEXT,

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sync_history_user_id ON sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_project_id ON sync_history(project_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_type ON sync_history(integration_type);
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON sync_history(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own sync history
DROP POLICY IF EXISTS "Users can view own sync history" ON sync_history;
CREATE POLICY "Users can view own sync history"
ON sync_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own sync records
DROP POLICY IF EXISTS "Users can create own sync records" ON sync_history;
CREATE POLICY "Users can create own sync records"
ON sync_history FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own sync records
DROP POLICY IF EXISTS "Users can update own sync records" ON sync_history;
CREATE POLICY "Users can update own sync records"
ON sync_history FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own sync records
DROP POLICY IF EXISTS "Users can delete own sync records" ON sync_history;
CREATE POLICY "Users can delete own sync records"
ON sync_history FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Service role has full access
DROP POLICY IF EXISTS "Service role can manage sync history" ON sync_history;
CREATE POLICY "Service role can manage sync history"
ON sync_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- SYNC PREFERENCES IN USER_INTEGRATIONS
-- ============================================================================
-- Add sync_preferences column to user_integrations if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_integrations' AND column_name = 'sync_preferences'
    ) THEN
        ALTER TABLE user_integrations
        ADD COLUMN sync_preferences JSONB DEFAULT '{"autoSync": false, "syncInterval": "manual"}';
    END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE sync_history IS 'Tracks synchronization of project data to external platforms (US-BI02)';
COMMENT ON COLUMN sync_history.synced_data IS 'Snapshot of data that was synced to external platform';
COMMENT ON COLUMN sync_history.target_id IS 'ID of the created/updated resource in external platform';
COMMENT ON COLUMN sync_history.target_url IS 'URL to view the synced resource in external platform';
