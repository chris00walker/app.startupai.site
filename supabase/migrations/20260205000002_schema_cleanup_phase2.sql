-- ============================================================================
-- Schema Cleanup Phase 2: Admin/Audit Tables
-- ============================================================================
-- Created: 2026-02-05
-- Purpose: Rename ambiguous columns in admin/audit tables
-- Plan Reference: Schema Cleanup Migration Plan
--
-- Changes:
-- 1. admin_audit_log.reason → audit_reason
-- 2. admin_sessions.reason → impersonation_reason
-- 3. approval_history.action → approval_action
-- 4. trial_usage_counters.action → tracked_action
-- 5. trial_usage_counters.count → usage_count
-- 6. feature_flags.key → flag_key

BEGIN;

-- ============================================================================
-- 1. admin_audit_log table
-- ============================================================================

-- Rename reason → audit_reason
ALTER TABLE admin_audit_log RENAME COLUMN reason TO audit_reason;

-- ============================================================================
-- 2. admin_sessions table
-- ============================================================================

-- Rename reason → impersonation_reason
ALTER TABLE admin_sessions RENAME COLUMN reason TO impersonation_reason;

-- ============================================================================
-- 3. approval_history table
-- ============================================================================

-- Rename action → approval_action
ALTER TABLE approval_history RENAME COLUMN action TO approval_action;

-- ============================================================================
-- 4. trial_usage_counters table
-- ============================================================================

-- Rename action → tracked_action
ALTER TABLE trial_usage_counters RENAME COLUMN action TO tracked_action;

-- Rename count → usage_count
ALTER TABLE trial_usage_counters RENAME COLUMN count TO usage_count;

-- Note: The unique index will automatically use the new column names

-- ============================================================================
-- 5. feature_flags table
-- ============================================================================

-- Rename key → flag_key
ALTER TABLE feature_flags RENAME COLUMN key TO flag_key;

-- Drop old index and create new one with correct name
DROP INDEX IF EXISTS idx_feature_flags_key;
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_key ON feature_flags (flag_key);

-- Update unique constraint (drop and recreate)
ALTER TABLE feature_flags DROP CONSTRAINT IF EXISTS feature_flags_key_unique;
ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_flag_key_unique UNIQUE (flag_key);

-- ============================================================================
-- Verify changes
-- ============================================================================

DO $$
BEGIN
  -- Verify admin_audit_log
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'admin_audit_log'
    AND column_name = 'audit_reason'
  ) THEN
    RAISE EXCEPTION 'Migration failed: admin_audit_log.audit_reason not found';
  END IF;

  -- Verify admin_sessions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'admin_sessions'
    AND column_name = 'impersonation_reason'
  ) THEN
    RAISE EXCEPTION 'Migration failed: admin_sessions.impersonation_reason not found';
  END IF;

  -- Verify approval_history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'approval_history'
    AND column_name = 'approval_action'
  ) THEN
    RAISE EXCEPTION 'Migration failed: approval_history.approval_action not found';
  END IF;

  -- Verify trial_usage_counters
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'trial_usage_counters'
    AND column_name = 'tracked_action'
  ) THEN
    RAISE EXCEPTION 'Migration failed: trial_usage_counters.tracked_action not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'trial_usage_counters'
    AND column_name = 'usage_count'
  ) THEN
    RAISE EXCEPTION 'Migration failed: trial_usage_counters.usage_count not found';
  END IF;

  -- Verify feature_flags
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'feature_flags'
    AND column_name = 'flag_key'
  ) THEN
    RAISE EXCEPTION 'Migration failed: feature_flags.flag_key not found';
  END IF;

  RAISE NOTICE 'Phase 2 migration completed successfully';
END $$;

COMMIT;
