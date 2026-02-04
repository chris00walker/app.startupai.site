-- ============================================================================
-- Schema Cleanup Phase 4b: Hypotheses Table
-- ============================================================================
-- Created: 2026-02-05
-- Purpose: Rename ambiguous columns in hypotheses table
-- Plan Reference: Schema Cleanup Migration Plan
--
-- Changes:
-- 1. hypotheses.type → hypothesis_type
-- 2. hypotheses.source → hypothesis_source
-- 3. Update founder_directory view to use new column name
-- 4. Update index to use new column name

BEGIN;

-- ============================================================================
-- 1. Rename columns in hypotheses table
-- ============================================================================

ALTER TABLE hypotheses RENAME COLUMN type TO hypothesis_type;
ALTER TABLE hypotheses RENAME COLUMN source TO hypothesis_source;

-- ============================================================================
-- 2. Recreate index with new column name
-- ============================================================================

DROP INDEX IF EXISTS idx_hypotheses_type;
CREATE INDEX idx_hypotheses_hypothesis_type ON hypotheses(hypothesis_type);

-- ============================================================================
-- 3. Update founder_directory view
-- ============================================================================
-- Note: The view queries h.type = 'customer' but the schema defines
-- 'desirable' | 'feasible' | 'viable'. This appears to be a pre-existing
-- logic issue that will always return 0 for interviews_completed.
-- We're only renaming the column reference to maintain consistency.

DROP VIEW IF EXISTS public.founder_directory;

CREATE VIEW public.founder_directory AS
SELECT
  u.id,
  -- Anonymized display: "S. J." format
  SUBSTRING(u.display_name FROM 1 FOR 1) || '. ' ||
    COALESCE(SUBSTRING(SPLIT_PART(u.display_name, ' ', 2) FROM 1 FOR 1), '') || '.' as display_name,
  u.avatar_url,
  -- Validation progress (D-F-V signals from crewai_validation_states)
  cvs.desirability_signal,
  cvs.feasibility_signal,
  cvs.viability_signal,
  cvs.problem_fit,
  -- Industry from project hints (JSONB)
  p.hints->>'industry' as industry,
  -- Project metadata
  p.name as project_name,
  p.created_at as project_created_at,
  -- Evidence summary badges
  (
    SELECT COUNT(*) FROM hypotheses h
    WHERE h.project_id = p.id AND h.hypothesis_type = 'customer'
  ) as interviews_completed,
  (
    SELECT COUNT(*) FROM experiments e
    WHERE e.project_id = p.id AND e.status = 'completed'
  ) as experiments_run,
  (
    SELECT COUNT(*) FROM evidence ev
    WHERE ev.project_id = p.id
  ) as evidence_collected
FROM user_profiles u
JOIN projects p ON p.user_id = u.id
-- Join validation states to get problem_fit (TASK-019)
LEFT JOIN crewai_validation_states cvs ON cvs.project_id = p.id
WHERE u.founder_directory_opt_in = TRUE
  -- Filter by problem_fit from validation states
  AND cvs.problem_fit IN ('partial_fit', 'strong_fit')
  -- DP-2 DECISION: DB-level gating - only verified consultants can see
  AND public.is_verified_consultant();

COMMENT ON VIEW public.founder_directory IS
  'Anonymized founder directory for VERIFIED consultants only. Shows validation progress without PII. Requires is_verified_consultant() = TRUE. Uses crewai_validation_states for problem_fit.';

-- Grant access (view enforces verification)
GRANT SELECT ON public.founder_directory TO authenticated;

-- ============================================================================
-- Verify changes
-- ============================================================================

DO $$
BEGIN
  -- Verify hypotheses columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'hypotheses'
    AND column_name = 'hypothesis_type'
  ) THEN
    RAISE EXCEPTION 'Migration failed: hypotheses.hypothesis_type not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'hypotheses'
    AND column_name = 'hypothesis_source'
  ) THEN
    RAISE EXCEPTION 'Migration failed: hypotheses.hypothesis_source not found';
  END IF;

  -- Verify old columns are gone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'hypotheses'
    AND column_name = 'type'
  ) THEN
    RAISE EXCEPTION 'Migration failed: old column hypotheses.type still exists';
  END IF;

  RAISE NOTICE 'Phase 4b migration completed successfully';
END $$;

COMMIT;
