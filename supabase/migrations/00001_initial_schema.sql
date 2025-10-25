-- Initial Schema Migration
-- Creates comprehensive database schema for StartupAI evidence-led validation platform
-- Based on PortfolioProject type and business requirements

-- ============================================================================
-- ENABLE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Note: pgvector must be enabled via Supabase Dashboard → Database → Extensions
-- CREATE EXTENSION IF NOT EXISTS "pgvector";
-- CREATE EXTENSION IF NOT EXISTS "pg_net";
-- CREATE EXTENSION IF NOT EXISTS "hstore";

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  company TEXT,
  role TEXT DEFAULT 'user',
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'cancelled', 'expired')),
  trial_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- PROJECTS TABLE (Enhanced Portfolio Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  
  -- Portfolio Management Fields
  stage TEXT NOT NULL DEFAULT 'DESIRABILITY' CHECK (stage IN ('DESIRABILITY', 'FEASIBILITY', 'VIABILITY', 'SCALE')),
  gate_status TEXT DEFAULT 'Pending' CHECK (gate_status IN ('Pending', 'Passed', 'Failed')),
  
  -- Risk Budget Tracking
  risk_budget_planned DECIMAL(10,2) DEFAULT 0,
  risk_budget_actual DECIMAL(10,2) DEFAULT 0,
  risk_budget_delta DECIMAL(10,2) DEFAULT 0,
  
  -- Consultant & Activity Tracking
  assigned_consultant TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  next_gate_date DATE,
  
  -- Evidence & Quality Metrics
  evidence_quality DECIMAL(3,2) DEFAULT 0 CHECK (evidence_quality >= 0 AND evidence_quality <= 1),
  hypotheses_count INTEGER DEFAULT 0,
  experiments_count INTEGER DEFAULT 0,
  evidence_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
-- Note: idx_projects_stage will be created in migration 00002 after adding the column

-- ============================================================================
-- HYPOTHESES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Hypothesis Content
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('problem', 'solution', 'business_model', 'market')),
  
  -- Testing Status
  status TEXT DEFAULT 'untested' CHECK (status IN ('untested', 'testing', 'validated', 'invalidated')),
  confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
  
  -- Evidence Strength
  evidence_strength TEXT CHECK (evidence_strength IN ('weak', 'medium', 'strong')),
  evidence_ids UUID[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hypotheses_project_id ON hypotheses(project_id);
CREATE INDEX IF NOT EXISTS idx_hypotheses_status ON hypotheses(status);
-- ============================================================================
-- EVIDENCE TABLE (with Vector Search)
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Evidence metadata
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  
  -- Quality & Strength
  strength TEXT CHECK (strength IN ('weak', 'medium', 'strong')),
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  -- Semantic Search (Vector Embeddings) - requires pgvector extension
  -- embedding VECTOR(1536), -- OpenAI embeddings dimension (uncomment when pgvector enabled)
  
  -- Metadata
  tags TEXT[],
  citation TEXT,
  collected_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evidence_project_id ON evidence(project_id);
-- Create vector similarity search index (requires pgvector extension)
-- CREATE INDEX IF NOT EXISTS idx_evidence_embedding ON evidence 
-- USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- EXPERIMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  hypothesis_id UUID REFERENCES hypotheses(id) ON DELETE SET NULL,
  
  -- Experiment Details
  name TEXT NOT NULL,
  description TEXT,
  experiment_type TEXT CHECK (experiment_type IN ('landing_page', 'prototype', 'interview', 'survey', 'mvp', 'a_b_test')),
  
  -- Status & Results
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'running', 'completed', 'cancelled')),
  success_criteria JSONB,
  actual_results JSONB,
  outcome TEXT CHECK (outcome IN ('success', 'failure', 'inconclusive')),
  
  -- Metrics
  sample_size INTEGER,
  conversion_rate DECIMAL(5,4),
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_experiments_project_id ON experiments(project_id);
CREATE INDEX IF NOT EXISTS idx_experiments_hypothesis_id ON experiments(hypothesis_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
-- ============================================================================
-- REPORTS TABLE (AI-Generated)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Report Details
  title TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('gate_assessment', 'evidence_summary', 'hypothesis_analysis', 'recommendation')),
  content TEXT NOT NULL,
  
  -- AI Generation Metadata
  ai_model TEXT,
  generation_metadata JSONB,
  
  -- File Storage
  file_url TEXT,
  file_format TEXT CHECK (file_format IN ('pdf', 'markdown', 'json', 'docx')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
-- ============================================================================
-- GATE POLICIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS gate_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Policy Configuration
  gate TEXT NOT NULL CHECK (gate IN ('DESIRABILITY', 'FEASIBILITY', 'VIABILITY')),
  min_experiments INTEGER NOT NULL DEFAULT 3,
  required_fit_types TEXT[] NOT NULL DEFAULT ARRAY['Desirability', 'Feasibility'],
  
  -- Strength Mix Requirements
  min_weak_evidence INTEGER DEFAULT 0,
  min_medium_evidence INTEGER DEFAULT 1,
  min_strong_evidence INTEGER DEFAULT 1,
  
  -- Thresholds (stored as JSONB for flexibility)
  thresholds JSONB, -- e.g., {"ctr": 0.02, "signup_rate": 0.1}
  
  -- Override Settings
  override_roles TEXT[] DEFAULT ARRAY['admin', 'senior_consultant'],
  requires_approval BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, gate)
);
CREATE INDEX IF NOT EXISTS idx_gate_policies_user_id ON gate_policies(user_id);
-- ============================================================================
-- OVERRIDE REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS override_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Request Details
  gate TEXT NOT NULL,
  rationale TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Approval Chain
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_override_requests_project_id ON override_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_override_requests_status ON override_requests(status);
-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Event Details
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL, -- SHA-256 hash for tamper detection
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_project_id ON audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);
  END IF;
END$$;
-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Users can view own projects'
  ) THEN
    CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Users can create own projects'
  ) THEN
    CREATE POLICY "Users can create own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Users can update own projects'
  ) THEN
    CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Users can delete own projects'
  ) THEN
    CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END$$;
-- Hypotheses
ALTER TABLE hypotheses ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'hypotheses' AND policyname = 'Users can manage own hypotheses'
  ) THEN
    CREATE POLICY "Users can manage own hypotheses"
    ON hypotheses FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = hypotheses.project_id
          AND projects.user_id = auth.uid()
      )
    );
  END IF;
END$$;
-- Evidence
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evidence' AND policyname = 'Users can manage own evidence'
  ) THEN
    CREATE POLICY "Users can manage own evidence"
    ON evidence FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = evidence.project_id
          AND projects.user_id = auth.uid()
      )
    );
  END IF;
END$$;
-- Experiments
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'experiments' AND policyname = 'Users can manage own experiments'
  ) THEN
    CREATE POLICY "Users can manage own experiments"
    ON experiments FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = experiments.project_id
          AND projects.user_id = auth.uid()
      )
    );
  END IF;
END$$;
-- Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reports' AND policyname = 'Users can manage own reports'
  ) THEN
    CREATE POLICY "Users can manage own reports"
    ON reports FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = reports.project_id
          AND projects.user_id = auth.uid()
      )
    );
  END IF;
END$$;
-- Gate Policies
ALTER TABLE gate_policies ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gate_policies' AND policyname = 'Users can manage own gate policies'
  ) THEN
    CREATE POLICY "Users can manage own gate policies"
    ON gate_policies FOR ALL
    USING (auth.uid() = user_id);
  END IF;
END$$;
-- Override Requests
ALTER TABLE override_requests ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'override_requests' AND policyname = 'Users can view own override requests'
  ) THEN
    CREATE POLICY "Users can view own override requests"
    ON override_requests FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'override_requests' AND policyname = 'Users can create override requests'
  ) THEN
    CREATE POLICY "Users can create override requests"
    ON override_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;
-- Audit Log (Read-only for users, write-only for system)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_log' AND policyname = 'Users can view own audit logs'
  ) THEN
    CREATE POLICY "Users can view own audit logs"
    ON audit_log FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END$$;
-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hypotheses_updated_at BEFORE UPDATE ON hypotheses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evidence_updated_at BEFORE UPDATE ON evidence
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON experiments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Vector Search Function (requires pgvector extension)
-- Uncomment when pgvector is enabled in Supabase Dashboard
-- CREATE OR REPLACE FUNCTION match_evidence(
--   query_embedding VECTOR(1536),
--   match_threshold FLOAT DEFAULT 0.7,
--   match_count INT DEFAULT 10,
--   filter_project_id UUID DEFAULT NULL
-- )
-- RETURNS TABLE (
--   id UUID,
--   content TEXT,
--   similarity FLOAT
-- )
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   RETURN QUERY
--   SELECT
--     evidence.id,
--     evidence.content,
--     1 - (evidence.embedding <=> query_embedding) AS similarity
--   FROM evidence
--   WHERE 
--     (filter_project_id IS NULL OR evidence.project_id = filter_project_id)
--     AND 1 - (evidence.embedding <=> query_embedding) > match_threshold
--   ORDER BY evidence.embedding <=> query_embedding
--   LIMIT match_count;
-- END;
-- $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE projects IS 'Core projects table with portfolio management and gate tracking';
COMMENT ON TABLE hypotheses IS 'Business hypotheses linked to projects for validation tracking';
COMMENT ON TABLE evidence IS 'Evidence items with vector embeddings for semantic search';
COMMENT ON TABLE experiments IS 'Experiments conducted to test hypotheses';
COMMENT ON TABLE reports IS 'AI-generated reports and assessments';
COMMENT ON TABLE gate_policies IS 'Configurable gate policies per user/organization';
COMMENT ON TABLE override_requests IS 'Gate override requests requiring approval';
COMMENT ON TABLE audit_log IS 'Tamper-evident audit trail for compliance';
