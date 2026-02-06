-- ============================================================================
-- Schema Cleanup Phase 4b: ROLLBACK
-- ============================================================================
-- Use this script to rollback Phase 4b changes if issues occur

BEGIN;

-- Rollback hypotheses columns
ALTER TABLE hypotheses RENAME COLUMN hypothesis_type TO type;
ALTER TABLE hypotheses RENAME COLUMN hypothesis_source TO source;

-- Rollback index
DROP INDEX IF EXISTS idx_hypotheses_hypothesis_type;
CREATE INDEX idx_hypotheses_type ON hypotheses(type);

-- Rollback founder_directory view
DROP VIEW IF EXISTS public.founder_directory;

CREATE VIEW public.founder_directory AS
SELECT
  u.id,
  SUBSTRING(u.display_name FROM 1 FOR 1) || '. ' ||
    COALESCE(SUBSTRING(SPLIT_PART(u.display_name, ' ', 2) FROM 1 FOR 1), '') || '.' as display_name,
  u.avatar_url,
  cvs.desirability_signal,
  cvs.feasibility_signal,
  cvs.viability_signal,
  cvs.problem_fit,
  p.hints->>'industry' as industry,
  p.name as project_name,
  p.created_at as project_created_at,
  (
    SELECT COUNT(*) FROM hypotheses h
    WHERE h.project_id = p.id AND h.type = 'customer'
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
LEFT JOIN crewai_validation_states cvs ON cvs.project_id = p.id
WHERE u.founder_directory_opt_in = TRUE
  AND cvs.problem_fit IN ('partial_fit', 'strong_fit')
  AND public.is_verified_consultant();

GRANT SELECT ON public.founder_directory TO authenticated;

COMMIT;
