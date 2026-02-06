-- ============================================================================
-- Schema Cleanup Phase 4a: ROLLBACK
-- ============================================================================
-- Use this script to rollback Phase 4a changes if issues occur

BEGIN;

ALTER TABLE business_model_canvas RENAME COLUMN data_source TO source;
ALTER TABLE value_proposition_canvas RENAME COLUMN data_source TO source;

COMMIT;
