-- ============================================================================
-- Schema Cleanup Phase 4d: Validation Tables
-- ============================================================================
-- Created: 2026-02-05
-- Purpose: Rename ambiguous columns in validation-related tables
-- Plan Reference: Schema Cleanup Migration Plan
--
-- Changes:
-- 1. projects.stage → validation_stage
-- 2. crewai_validation_states.phase → validation_phase
-- 3. validation_progress.phase → validation_phase
-- 4. hitl_requests.phase → validation_phase

BEGIN;

-- ============================================================================
-- 1. Rename column in projects table
-- ============================================================================

ALTER TABLE projects RENAME COLUMN stage TO validation_stage;

-- ============================================================================
-- 2. Rename column in crewai_validation_states table
-- ============================================================================

ALTER TABLE crewai_validation_states RENAME COLUMN phase TO validation_phase;

-- ============================================================================
-- 3. Rename column in validation_progress table
-- ============================================================================

ALTER TABLE validation_progress RENAME COLUMN phase TO validation_phase;

-- ============================================================================
-- 4. Rename column in hitl_requests table
-- ============================================================================

ALTER TABLE hitl_requests RENAME COLUMN phase TO validation_phase;

-- ============================================================================
-- Verify changes
-- ============================================================================

DO $$
BEGIN
  -- Verify projects.validation_stage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'validation_stage'
  ) THEN
    RAISE EXCEPTION 'Migration failed: projects.validation_stage not found';
  END IF;

  -- Verify crewai_validation_states.validation_phase
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'crewai_validation_states'
    AND column_name = 'validation_phase'
  ) THEN
    RAISE EXCEPTION 'Migration failed: crewai_validation_states.validation_phase not found';
  END IF;

  -- Verify validation_progress.validation_phase
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'validation_progress'
    AND column_name = 'validation_phase'
  ) THEN
    RAISE EXCEPTION 'Migration failed: validation_progress.validation_phase not found';
  END IF;

  -- Verify hitl_requests.validation_phase
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'hitl_requests'
    AND column_name = 'validation_phase'
  ) THEN
    RAISE EXCEPTION 'Migration failed: hitl_requests.validation_phase not found';
  END IF;

  -- Verify old columns are gone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'stage'
  ) THEN
    RAISE EXCEPTION 'Migration failed: old column projects.stage still exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'crewai_validation_states'
    AND column_name = 'phase'
  ) THEN
    RAISE EXCEPTION 'Migration failed: old column crewai_validation_states.phase still exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'validation_progress'
    AND column_name = 'phase'
  ) THEN
    RAISE EXCEPTION 'Migration failed: old column validation_progress.phase still exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'hitl_requests'
    AND column_name = 'phase'
  ) THEN
    RAISE EXCEPTION 'Migration failed: old column hitl_requests.phase still exists';
  END IF;

  RAISE NOTICE 'Phase 4d migration completed successfully';
END $$;

COMMIT;
