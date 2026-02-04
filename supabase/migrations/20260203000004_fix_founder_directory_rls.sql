-- ============================================================================
-- Fix Founder Directory RLS (TASK-003 + TASK-019)
-- ============================================================================
-- Created: February 3, 2026
-- Updated: February 3, 2026 - Fix column references per schema audit
-- Purpose: Add verification check to founder_directory view (DP-2: DB-level gating)
-- Related: S-008 - founder_directory exposed to all authenticated users
--
-- The view now checks is_verified_consultant() so only verified consultants
-- can query founders directly via PostgREST.
--
-- TASK-019 Fixes:
-- - Join crewai_validation_states for problem_fit (not in projects table)
-- - Extract industry from projects.hints->>'industry' (JSONB field)
-- - Remove p.company reference (doesn't exist - use u.company only)
-- ============================================================================

-- Drop and recreate the view with verification check
DROP VIEW IF EXISTS public.founder_directory;

CREATE VIEW public.founder_directory AS
SELECT
  u.id,
  -- Anonymized display: "S. J." format
  CONCAT(
    UPPER(LEFT(SPLIT_PART(u.full_name, ' ', 1), 1)),
    '. ',
    UPPER(LEFT(SPLIT_PART(u.full_name, ' ', 2), 1)),
    '.'
  ) as display_name,
  -- Company info from user profile only (projects doesn't have company column)
  COALESCE(u.company, 'Stealth startup') as company,
  -- Industry from project hints JSONB field
  COALESCE(p.hints->>'industry', 'General') as industry,
  -- Stage from project (if exists) or default
  COALESCE(p.stage, 'pre_seed') as stage,
  -- problem_fit from crewai_validation_states (not projects)
  cvs.problem_fit,
  -- Evidence summary badges
  (
    SELECT COUNT(*) FROM hypotheses h
    WHERE h.project_id = p.id AND h.hypothesis_type = 'customer'
  ) as interviews_completed,
  (
    SELECT COUNT(*) FROM experiments e
    JOIN hypotheses h ON e.hypothesis_id = h.id
    WHERE h.project_id = p.id AND e.status = 'completed'
  ) as experiments_passed,
  -- Fit score derived from problem_fit enum
  CASE cvs.problem_fit
    WHEN 'strong_fit' THEN 85
    WHEN 'partial_fit' THEN 65
    ELSE 50
  END as fit_score,
  u.created_at as joined_at
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
