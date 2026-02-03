-- ============================================================================
-- Fix Founder Directory RLS (TASK-003)
-- ============================================================================
-- Created: February 3, 2026
-- Purpose: Add verification check to founder_directory view (DP-2: DB-level gating)
-- Related: S-008 - founder_directory exposed to all authenticated users
--
-- The view now checks is_verified_consultant() so only verified consultants
-- can query founders directly via PostgREST.
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
  -- Company info (use project company or user's company)
  COALESCE(p.company, u.company, 'Stealth startup') as company,
  -- Industry from user profile (projects may not have this column)
  u.industry,
  -- Stage from project (if exists) or default
  COALESCE(p.stage, 'pre_seed') as stage,
  p.problem_fit,
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
  CASE p.problem_fit
    WHEN 'strong_fit' THEN 85
    WHEN 'partial_fit' THEN 65
    ELSE 50
  END as fit_score,
  u.created_at as joined_at
FROM user_profiles u
JOIN projects p ON p.user_id = u.id
WHERE u.founder_directory_opt_in = TRUE
  AND p.problem_fit IN ('partial_fit', 'strong_fit')
  -- DP-2 DECISION: DB-level gating - only verified consultants can see
  AND public.is_verified_consultant();

COMMENT ON VIEW public.founder_directory IS
  'Anonymized founder directory for VERIFIED consultants only. Shows validation progress without PII. Requires is_verified_consultant() = TRUE.';

-- Grant access (view enforces verification)
GRANT SELECT ON public.founder_directory TO authenticated;
