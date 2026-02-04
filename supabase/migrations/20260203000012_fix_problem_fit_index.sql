-- ============================================================================
-- Fix problem_fit Index (TASK-026/TASK-027)
-- ============================================================================
-- problem_fit lives in crewai_validation_states, NOT in projects table.
-- The index created in 000001 references a non-existent column.
-- This migration drops the invalid index and creates the correct one.
-- ============================================================================

-- Drop the invalid index (if it was somehow created, though it would have failed)
DROP INDEX IF EXISTS idx_projects_problem_fit;

-- Create the correct index on crewai_validation_states
-- This index supports the founder directory view's filter on problem_fit
CREATE INDEX IF NOT EXISTS idx_validation_states_problem_fit
ON crewai_validation_states(project_id, problem_fit)
WHERE problem_fit IN ('partial_fit', 'strong_fit');

COMMENT ON INDEX idx_validation_states_problem_fit IS
  'Index for founder directory filtering by problem_fit. Supports the founder_directory view JOIN.';
