-- ============================================================================
-- Schema Cleanup Phase 4a: Canvas Source Fields
-- ============================================================================
-- Created: 2026-02-05
-- Purpose: Rename ambiguous 'source' columns in canvas tables
-- Plan Reference: Schema Cleanup Migration Plan
--
-- Changes:
-- 1. business_model_canvas.source → data_source
-- 2. value_proposition_canvas.source → data_source

BEGIN;

-- ============================================================================
-- 1. business_model_canvas table
-- ============================================================================

ALTER TABLE business_model_canvas RENAME COLUMN source TO data_source;

-- ============================================================================
-- 2. value_proposition_canvas table
-- ============================================================================

ALTER TABLE value_proposition_canvas RENAME COLUMN source TO data_source;

-- ============================================================================
-- Verify changes
-- ============================================================================

DO $$
BEGIN
  -- Verify business_model_canvas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_model_canvas'
    AND column_name = 'data_source'
  ) THEN
    RAISE EXCEPTION 'Migration failed: business_model_canvas.data_source not found';
  END IF;

  -- Verify value_proposition_canvas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'value_proposition_canvas'
    AND column_name = 'data_source'
  ) THEN
    RAISE EXCEPTION 'Migration failed: value_proposition_canvas.data_source not found';
  END IF;

  RAISE NOTICE 'Phase 4a migration completed successfully';
END $$;

COMMIT;
