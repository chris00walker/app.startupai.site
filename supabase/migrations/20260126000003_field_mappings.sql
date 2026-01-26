-- ============================================================================
-- Field Mappings Table
-- ============================================================================
-- Created: 2026-01-26
-- Purpose: Store reusable field mappings between external data and StartupAI schema
-- Reference: US-BI03 - Map External Data to StartupAI Schema
-- ============================================================================

-- ============================================================================
-- FIELD MAPPINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS field_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User context
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Mapping metadata
    name TEXT NOT NULL,
    description TEXT,

    -- Integration type this mapping applies to
    integration_type integration_type NOT NULL,

    -- Source schema detected from imported data
    -- Array of { field: string, type: string, sample?: any }
    source_schema JSONB NOT NULL DEFAULT '[]',

    -- The actual field mappings
    -- Array of { sourceField, targetSection, targetField, transform? }
    mappings JSONB NOT NULL DEFAULT '[]',

    -- Fields that weren't mapped
    unmapped_fields JSONB DEFAULT '[]',

    -- Whether this is a default mapping for the integration type
    is_default BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique name per user
    UNIQUE(user_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_field_mappings_user_id ON field_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_field_mappings_type ON field_mappings(integration_type);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;

-- Users can view their own mappings
DROP POLICY IF EXISTS "Users can view own mappings" ON field_mappings;
CREATE POLICY "Users can view own mappings"
ON field_mappings FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own mappings
DROP POLICY IF EXISTS "Users can create own mappings" ON field_mappings;
CREATE POLICY "Users can create own mappings"
ON field_mappings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own mappings
DROP POLICY IF EXISTS "Users can update own mappings" ON field_mappings;
CREATE POLICY "Users can update own mappings"
ON field_mappings FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own mappings
DROP POLICY IF EXISTS "Users can delete own mappings" ON field_mappings;
CREATE POLICY "Users can delete own mappings"
ON field_mappings FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Service role has full access
DROP POLICY IF EXISTS "Service role can manage mappings" ON field_mappings;
CREATE POLICY "Service role can manage mappings"
ON field_mappings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- TRIGGER
-- ============================================================================
DROP TRIGGER IF EXISTS update_field_mappings_updated_at ON field_mappings;
CREATE TRIGGER update_field_mappings_updated_at
BEFORE UPDATE ON field_mappings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- UPDATE import_history FK
-- ============================================================================
-- Add foreign key from import_history to field_mappings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_import_history_mapping'
    ) THEN
        ALTER TABLE import_history
        ADD CONSTRAINT fk_import_history_mapping
        FOREIGN KEY (mapping_id) REFERENCES field_mappings(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE field_mappings IS 'Reusable field mappings between external data and StartupAI schema (US-BI03)';
COMMENT ON COLUMN field_mappings.source_schema IS 'Schema detected from source data - array of field definitions';
COMMENT ON COLUMN field_mappings.mappings IS 'Field mapping rules - sourceField -> targetSection.targetField';
COMMENT ON COLUMN field_mappings.unmapped_fields IS 'Source fields that are not mapped to any target';
