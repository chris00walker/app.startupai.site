-- ============================================================================
-- Schema Cleanup Phase 2: ROLLBACK
-- ============================================================================
-- Use this script to rollback Phase 2 changes if issues occur
-- Run manually: psql -f 20260205000002_schema_cleanup_phase2_rollback.sql

BEGIN;

-- Rollback admin_audit_log
ALTER TABLE admin_audit_log RENAME COLUMN audit_reason TO reason;

-- Rollback admin_sessions
ALTER TABLE admin_sessions RENAME COLUMN impersonation_reason TO reason;

-- Rollback approval_history
ALTER TABLE approval_history RENAME COLUMN approval_action TO action;

-- Rollback trial_usage_counters
ALTER TABLE trial_usage_counters RENAME COLUMN tracked_action TO action;
ALTER TABLE trial_usage_counters RENAME COLUMN usage_count TO count;

-- Rollback feature_flags
ALTER TABLE feature_flags DROP CONSTRAINT IF EXISTS feature_flags_flag_key_unique;
ALTER TABLE feature_flags RENAME COLUMN flag_key TO key;
DROP INDEX IF EXISTS idx_feature_flags_flag_key;
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags (key);
ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_key_unique UNIQUE (key);

COMMIT;
