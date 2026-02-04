-- ============================================================================
-- Schema Cleanup Phase 4d: ROLLBACK
-- ============================================================================
-- Use this script to rollback Phase 4d changes if issues occur

BEGIN;

-- Rollback projects column
ALTER TABLE projects RENAME COLUMN validation_stage TO stage;

-- Rollback crewai_validation_states column
ALTER TABLE crewai_validation_states RENAME COLUMN validation_phase TO phase;

-- Rollback validation_progress column
ALTER TABLE validation_progress RENAME COLUMN validation_phase TO phase;

-- Rollback hitl_requests column
ALTER TABLE hitl_requests RENAME COLUMN validation_phase TO phase;

COMMIT;
