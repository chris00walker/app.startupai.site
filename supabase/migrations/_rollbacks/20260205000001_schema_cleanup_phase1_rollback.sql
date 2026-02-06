-- ============================================================================
-- Schema Cleanup Phase 1: ROLLBACK
-- ============================================================================
-- Use this script to rollback Phase 1 changes if issues occur
-- Run manually: psql -f 20260205000001_schema_cleanup_phase1_rollback.sql

BEGIN;

-- Rollback design_assets
ALTER TABLE design_assets RENAME COLUMN asset_type TO type;
ALTER TABLE design_assets RENAME COLUMN asset_category TO category;

-- Rollback entrepreneur_briefs
ALTER TABLE entrepreneur_briefs RENAME COLUMN brief_version TO version;

-- Rollback founders_briefs
ALTER TABLE founders_briefs RENAME COLUMN brief_version TO version;

COMMIT;
