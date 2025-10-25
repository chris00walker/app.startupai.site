-- Expand Projects Table Migration
-- Adds portfolio management fields to existing projects table
-- Safe to run even if columns already exist

-- ============================================================================
-- ADD NEW COLUMNS TO PROJECTS TABLE
-- ============================================================================

-- Portfolio Management Fields
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'DESIRABILITY' CHECK (stage IN ('DESIRABILITY', 'FEASIBILITY', 'VIABILITY', 'SCALE'));
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS gate_status TEXT DEFAULT 'Pending' CHECK (gate_status IN ('Pending', 'Passed', 'Failed'));
-- Risk Budget Tracking
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS risk_budget_planned DECIMAL(10,2) DEFAULT 0;
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS risk_budget_actual DECIMAL(10,2) DEFAULT 0;
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS risk_budget_delta DECIMAL(10,2) DEFAULT 0;
-- Consultant & Activity Tracking
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS assigned_consultant TEXT;
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS next_gate_date DATE;
-- Evidence & Quality Metrics
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS evidence_quality DECIMAL(3,2) DEFAULT 0 CHECK (evidence_quality >= 0 AND evidence_quality <= 1);
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS hypotheses_count INTEGER DEFAULT 0;
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS experiments_count INTEGER DEFAULT 0;
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS evidence_count INTEGER DEFAULT 0;
-- ============================================================================
-- ADD INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(stage);
CREATE INDEX IF NOT EXISTS idx_projects_gate_status ON projects(gate_status);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity ON projects(last_activity DESC);
-- ============================================================================
-- UPDATE EXISTING ROWS WITH DEFAULT VALUES
-- ============================================================================

-- Update last_activity for existing projects (set to created_at or NOW())
UPDATE projects 
SET last_activity = COALESCE(created_at, NOW())
WHERE last_activity IS NULL;
-- Set default stage based on status if possible
-- (This is a smart default - adjust based on your business logic)
UPDATE projects 
SET stage = 'DESIRABILITY'
WHERE stage IS NULL;
UPDATE projects 
SET gate_status = 'Pending'
WHERE gate_status IS NULL;
-- ============================================================================
-- ADD TRIGGER FOR UPDATING UPDATED_AT
-- ============================================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
BEFORE UPDATE ON projects
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN projects.stage IS 'Current validation stage: DESIRABILITY, FEASIBILITY, VIABILITY, or SCALE';
COMMENT ON COLUMN projects.gate_status IS 'Status of current stage gate: Pending, Passed, or Failed';
COMMENT ON COLUMN projects.risk_budget_planned IS 'Planned risk budget allocation for the project';
COMMENT ON COLUMN projects.risk_budget_actual IS 'Actual risk budget spent';
COMMENT ON COLUMN projects.risk_budget_delta IS 'Percentage difference between actual and planned (positive = over budget)';
COMMENT ON COLUMN projects.assigned_consultant IS 'Name of the consultant assigned to this project';
COMMENT ON COLUMN projects.last_activity IS 'Timestamp of last activity on the project';
COMMENT ON COLUMN projects.next_gate_date IS 'Scheduled date for next gate assessment';
COMMENT ON COLUMN projects.evidence_quality IS 'Overall evidence quality score (0-1)';
COMMENT ON COLUMN projects.hypotheses_count IS 'Number of hypotheses defined for this project';
COMMENT ON COLUMN projects.experiments_count IS 'Number of experiments conducted';
COMMENT ON COLUMN projects.evidence_count IS 'Total number of evidence items collected';
