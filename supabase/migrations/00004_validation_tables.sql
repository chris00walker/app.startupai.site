-- Validation Tables and Portfolio Enhancements
-- Adds portfolio management columns, hypotheses and experiments tables,
-- and enriches evidence records to support the product UI

-- ============================================================================
-- PROJECTS TABLE ENHANCEMENTS
-- ============================================================================
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'DESIRABILITY' CHECK (stage IN ('DESIRABILITY', 'FEASIBILITY', 'VIABILITY', 'SCALE')),
  ADD COLUMN IF NOT EXISTS gate_status TEXT DEFAULT 'Pending' CHECK (gate_status IN ('Pending', 'Passed', 'Failed')),
  ADD COLUMN IF NOT EXISTS risk_budget_planned DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_budget_actual DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_budget_delta DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_consultant TEXT,
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS next_gate_date DATE,
  ADD COLUMN IF NOT EXISTS evidence_quality DECIMAL(3,2) DEFAULT 0 CHECK (evidence_quality >= 0 AND evidence_quality <= 1),
  ADD COLUMN IF NOT EXISTS hypotheses_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS experiments_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS evidence_count INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(stage);
CREATE INDEX IF NOT EXISTS idx_projects_gate_status ON projects(gate_status);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity ON projects(last_activity DESC);
UPDATE projects
SET last_activity = COALESCE(last_activity, created_at, NOW()),
    stage = COALESCE(stage, 'DESIRABILITY'),
    gate_status = COALESCE(gate_status, 'Pending')
WHERE TRUE;
-- ============================================================================
-- HYPOTHESES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('desirable', 'feasible', 'viable')),
  importance TEXT NOT NULL CHECK (importance IN ('high', 'medium', 'low')),
  evidence_strength TEXT NOT NULL CHECK (evidence_strength IN ('none', 'weak', 'medium', 'strong')),
  status TEXT NOT NULL CHECK (status IN ('untested', 'testing', 'validated', 'invalidated')),
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hypotheses_project_id ON hypotheses(project_id);
CREATE INDEX IF NOT EXISTS idx_hypotheses_status ON hypotheses(status);
CREATE INDEX IF NOT EXISTS idx_hypotheses_type ON hypotheses(type);
ALTER TABLE hypotheses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own hypotheses" ON hypotheses;
CREATE POLICY "Users can manage own hypotheses"
ON hypotheses FOR ALL
USING (auth.uid() = (SELECT user_id FROM projects WHERE projects.id = hypotheses.project_id));
-- ============================================================================
-- EXPERIMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  hypothesis_id UUID REFERENCES hypotheses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  fit_type TEXT CHECK (fit_type IN ('Desirability', 'Feasibility', 'Viability')),
  evidence_strength TEXT CHECK (evidence_strength IN ('weak', 'medium', 'strong')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'running', 'completed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_time TEXT,
  potential_impact TEXT,
  steps TEXT[],
  results_quantitative TEXT,
  results_qualitative TEXT,
  results_submitted_at TIMESTAMPTZ,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_experiments_project_id ON experiments(project_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_hypothesis_id ON experiments(hypothesis_id);
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own experiments" ON experiments;
CREATE POLICY "Users can manage own experiments"
ON experiments FOR ALL
USING (auth.uid() = (SELECT user_id FROM projects WHERE projects.id = experiments.project_id));
-- ============================================================================
-- EVIDENCE TABLE ENRICHMENT
-- ============================================================================
ALTER TABLE evidence
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('Survey', 'Interview', 'Experiment', 'Analytics', 'Research')),
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS full_text TEXT,
  ADD COLUMN IF NOT EXISTS strength TEXT CHECK (strength IN ('weak', 'medium', 'strong')),
  ADD COLUMN IF NOT EXISTS is_contradiction BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fit_type TEXT CHECK (fit_type IN ('Desirability', 'Feasibility', 'Viability')),
  ADD COLUMN IF NOT EXISTS author TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS occurred_on DATE,
  ADD COLUMN IF NOT EXISTS linked_assumptions TEXT[];
CREATE INDEX IF NOT EXISTS idx_evidence_project_fit ON evidence(project_id, fit_type);
CREATE INDEX IF NOT EXISTS idx_evidence_strength ON evidence(strength);
CREATE INDEX IF NOT EXISTS idx_evidence_contradiction ON evidence(is_contradiction);
UPDATE evidence
SET title = COALESCE(title, LEFT(content, 80)),
    summary = COALESCE(summary, content),
    full_text = COALESCE(full_text, content)
WHERE TRUE;
-- Ensure existing rows comply
UPDATE evidence SET strength = 'medium' WHERE strength IS NULL;
UPDATE evidence SET fit_type = 'Desirability' WHERE fit_type IS NULL;
UPDATE evidence SET category = 'Research' WHERE category IS NULL;
-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_hypotheses_updated_at ON hypotheses;
CREATE TRIGGER update_hypotheses_updated_at
BEFORE UPDATE ON hypotheses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_experiments_updated_at ON experiments;
CREATE TRIGGER update_experiments_updated_at
BEFORE UPDATE ON experiments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_evidence_updated_at ON evidence;
CREATE TRIGGER update_evidence_updated_at
BEFORE UPDATE ON evidence
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
