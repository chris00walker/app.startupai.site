-- ============================================================================
-- Schema Cleanup Phase 1: Low-Impact Tables
-- ============================================================================
-- Created: 2026-02-05
-- Purpose: Rename ambiguous columns in design_assets, entrepreneur_briefs, founders_briefs
-- Plan Reference: Schema Cleanup Migration Plan
--
-- Changes:
-- 1. design_assets.type → asset_type
-- 2. design_assets.category → asset_category
-- 3. entrepreneur_briefs.version → brief_version
-- 4. founders_briefs.version → brief_version

BEGIN;

-- ============================================================================
-- 1. design_assets table
-- ============================================================================

-- Rename type → asset_type
ALTER TABLE design_assets RENAME COLUMN type TO asset_type;

-- Rename category → asset_category
ALTER TABLE design_assets RENAME COLUMN category TO asset_category;

-- ============================================================================
-- 2. entrepreneur_briefs table
-- ============================================================================

-- Rename version → brief_version
ALTER TABLE entrepreneur_briefs RENAME COLUMN version TO brief_version;

-- ============================================================================
-- 3. founders_briefs table
-- ============================================================================

-- Rename version → brief_version
ALTER TABLE founders_briefs RENAME COLUMN version TO brief_version;

-- ============================================================================
-- Verify changes (these will error if columns don't exist)
-- ============================================================================

DO $$
BEGIN
  -- Verify design_assets columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'design_assets'
    AND column_name = 'asset_type'
  ) THEN
    RAISE EXCEPTION 'Migration failed: design_assets.asset_type not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'design_assets'
    AND column_name = 'asset_category'
  ) THEN
    RAISE EXCEPTION 'Migration failed: design_assets.asset_category not found';
  END IF;

  -- Verify entrepreneur_briefs columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'entrepreneur_briefs'
    AND column_name = 'brief_version'
  ) THEN
    RAISE EXCEPTION 'Migration failed: entrepreneur_briefs.brief_version not found';
  END IF;

  -- Verify founders_briefs columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'founders_briefs'
    AND column_name = 'brief_version'
  ) THEN
    RAISE EXCEPTION 'Migration failed: founders_briefs.brief_version not found';
  END IF;

  RAISE NOTICE 'Phase 1 migration completed successfully';
END $$;

COMMIT;
