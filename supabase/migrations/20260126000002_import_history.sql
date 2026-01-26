-- ============================================================================
-- Import History Table
-- ============================================================================
-- Created: 2026-01-26
-- Purpose: Track data imports from external integrations
-- Reference: US-BI01 - Import Existing Business Data
-- ============================================================================

-- ============================================================================
-- IMPORT HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS import_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User and project context
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Integration source
    integration_type integration_type NOT NULL,

    -- Source item details
    source_id TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_type TEXT NOT NULL, -- e.g., 'page', 'database', 'file', 'table'
    source_url TEXT,

    -- Imported data (the raw extracted fields)
    imported_data JSONB NOT NULL DEFAULT '{}',

    -- Mapping applied (reference to field_mappings, added in future migration)
    mapping_id UUID,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'mapped', 'applied', 'error')),

    -- Error info if status is 'error'
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_import_history_user_id ON import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_import_history_project_id ON import_history(project_id);
CREATE INDEX IF NOT EXISTS idx_import_history_type ON import_history(integration_type);
CREATE INDEX IF NOT EXISTS idx_import_history_created ON import_history(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own imports
DROP POLICY IF EXISTS "Users can view own imports" ON import_history;
CREATE POLICY "Users can view own imports"
ON import_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create imports for their own data
DROP POLICY IF EXISTS "Users can create own imports" ON import_history;
CREATE POLICY "Users can create own imports"
ON import_history FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own imports
DROP POLICY IF EXISTS "Users can update own imports" ON import_history;
CREATE POLICY "Users can update own imports"
ON import_history FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own imports
DROP POLICY IF EXISTS "Users can delete own imports" ON import_history;
CREATE POLICY "Users can delete own imports"
ON import_history FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Service role has full access
DROP POLICY IF EXISTS "Service role can manage imports" ON import_history;
CREATE POLICY "Service role can manage imports"
ON import_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- TRIGGER
-- ============================================================================
DROP TRIGGER IF EXISTS update_import_history_updated_at ON import_history;
CREATE TRIGGER update_import_history_updated_at
BEFORE UPDATE ON import_history
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE import_history IS 'Tracks data imports from external integrations (US-BI01)';
COMMENT ON COLUMN import_history.integration_type IS 'Source integration (notion, google_drive, airtable, etc.)';
COMMENT ON COLUMN import_history.imported_data IS 'Raw extracted fields from the source, before mapping';
COMMENT ON COLUMN import_history.mapping_id IS 'Optional reference to field_mappings table for applied mapping';
