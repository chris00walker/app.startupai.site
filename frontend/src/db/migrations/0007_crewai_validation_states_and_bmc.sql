-- Migration: Add CrewAI Validation States and Business Model Canvas tables
-- Description: Creates tables for persisting CrewAI analysis results and editable BMC data

-- ============================================================================
-- Table: crewai_validation_states
-- Purpose: Stores full StartupValidationState from CrewAI analysis runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS crewai_validation_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Session tracking
  session_id TEXT,
  kickoff_id TEXT,
  iteration INTEGER NOT NULL DEFAULT 1,

  -- Phase & Risk Tracking
  phase TEXT NOT NULL DEFAULT 'ideation',
  current_risk_axis TEXT DEFAULT 'desirability',

  -- Problem/Solution Fit
  problem_fit TEXT DEFAULT 'unknown',
  current_segment TEXT,
  current_value_prop TEXT,
  vpc_document_url TEXT,
  bmc_document_url TEXT,

  -- Innovation Physics Signals
  desirability_signal TEXT NOT NULL DEFAULT 'no_signal',
  feasibility_signal TEXT NOT NULL DEFAULT 'unknown',
  viability_signal TEXT NOT NULL DEFAULT 'unknown',

  -- Pivot Tracking
  last_pivot_type TEXT DEFAULT 'none',
  pending_pivot_type TEXT DEFAULT 'none',
  pivot_recommendation TEXT,

  -- Human Approval Status
  human_approval_status TEXT DEFAULT 'not_required',
  human_comment TEXT,
  human_input_required BOOLEAN DEFAULT FALSE,
  human_input_reason TEXT,

  -- Evidence Containers (JSONB)
  desirability_evidence JSONB,
  feasibility_evidence JSONB,
  viability_evidence JSONB,

  -- VPC Data (JSONB)
  customer_profiles JSONB,
  value_maps JSONB,
  competitor_report JSONB,

  -- Assumptions
  assumptions JSONB,

  -- Desirability Artifacts
  desirability_experiments JSONB,
  downgrade_active BOOLEAN DEFAULT FALSE,

  -- Feasibility/Viability Artifacts
  last_feasibility_artifact JSONB,
  last_viability_metrics JSONB,

  -- QA and Governance
  qa_reports JSONB,
  current_qa_status TEXT,
  framework_compliance BOOLEAN DEFAULT FALSE,
  logical_consistency BOOLEAN DEFAULT FALSE,
  completeness BOOLEAN DEFAULT FALSE,

  -- Service Crew Outputs
  business_idea TEXT,
  entrepreneur_input TEXT,
  target_segments JSONB,
  problem_statement TEXT,
  solution_description TEXT,
  revenue_model TEXT,

  -- Analysis Crew Outputs
  segment_fit_scores JSONB,
  analysis_insights JSONB,

  -- Growth Crew Outputs
  ad_impressions INTEGER DEFAULT 0,
  ad_clicks INTEGER DEFAULT 0,
  ad_signups INTEGER DEFAULT 0,
  ad_spend NUMERIC(12, 2) DEFAULT 0,

  -- Build Crew Outputs
  api_costs JSONB,
  infra_costs JSONB,
  total_monthly_cost NUMERIC(12, 2) DEFAULT 0,

  -- Finance Crew Outputs
  cac NUMERIC(12, 2) DEFAULT 0,
  ltv NUMERIC(12, 2) DEFAULT 0,
  ltv_cac_ratio NUMERIC(6, 2) DEFAULT 0,
  gross_margin NUMERIC(5, 4) DEFAULT 0,
  tam NUMERIC(15, 2) DEFAULT 0,

  -- Synthesis Crew Outputs
  synthesis_confidence NUMERIC(4, 3) DEFAULT 0,
  evidence_summary TEXT,
  final_recommendation TEXT,
  next_steps JSONB,

  -- Budget Tracking
  daily_spend_usd NUMERIC(12, 2) DEFAULT 0,
  campaign_spend_usd NUMERIC(12, 2) DEFAULT 0,
  budget_status TEXT DEFAULT 'ok',
  budget_escalation_triggered BOOLEAN DEFAULT FALSE,
  budget_kill_triggered BOOLEAN DEFAULT FALSE,

  -- Business Model
  business_model_type TEXT,
  business_model_inferred_from TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for crewai_validation_states
CREATE INDEX IF NOT EXISTS idx_crewai_validation_states_project_id ON crewai_validation_states(project_id);
CREATE INDEX IF NOT EXISTS idx_crewai_validation_states_user_id ON crewai_validation_states(user_id);
CREATE INDEX IF NOT EXISTS idx_crewai_validation_states_kickoff_id ON crewai_validation_states(kickoff_id);
CREATE INDEX IF NOT EXISTS idx_crewai_validation_states_phase ON crewai_validation_states(phase);
CREATE INDEX IF NOT EXISTS idx_crewai_validation_states_signals ON crewai_validation_states(desirability_signal, feasibility_signal, viability_signal);

-- GIN indexes for JSONB columns (for querying nested data)
CREATE INDEX IF NOT EXISTS idx_crewai_validation_states_customer_profiles_gin ON crewai_validation_states USING GIN(customer_profiles);
CREATE INDEX IF NOT EXISTS idx_crewai_validation_states_value_maps_gin ON crewai_validation_states USING GIN(value_maps);

-- Enable RLS on crewai_validation_states
ALTER TABLE crewai_validation_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crewai_validation_states
DO $$
BEGIN
  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own validation states' AND tablename = 'crewai_validation_states'
  ) THEN
    CREATE POLICY "Users can view their own validation states"
      ON crewai_validation_states FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own validation states' AND tablename = 'crewai_validation_states'
  ) THEN
    CREATE POLICY "Users can insert their own validation states"
      ON crewai_validation_states FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own validation states' AND tablename = 'crewai_validation_states'
  ) THEN
    CREATE POLICY "Users can update their own validation states"
      ON crewai_validation_states FOR UPDATE
      USING (user_id = auth.uid());
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own validation states' AND tablename = 'crewai_validation_states'
  ) THEN
    CREATE POLICY "Users can delete their own validation states"
      ON crewai_validation_states FOR DELETE
      USING (user_id = auth.uid());
  END IF;

  -- Consultants can view their clients' validation states
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Consultants can view client validation states' AND tablename = 'crewai_validation_states'
  ) THEN
    CREATE POLICY "Consultants can view client validation states"
      ON crewai_validation_states FOR SELECT
      USING (
        user_id IN (
          SELECT id FROM user_profiles WHERE consultant_id = auth.uid()
        )
      );
  END IF;
END $$;


-- ============================================================================
-- Table: business_model_canvas
-- Purpose: Stores editable Business Model Canvas data for projects
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_model_canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Data source tracking
  source TEXT NOT NULL DEFAULT 'crewai',
  kickoff_id TEXT,

  -- The 9 Building Blocks (JSONB arrays of BMCItem)
  customer_segments JSONB DEFAULT '[]'::jsonb,
  value_propositions JSONB DEFAULT '[]'::jsonb,
  channels JSONB DEFAULT '[]'::jsonb,
  customer_relationships JSONB DEFAULT '[]'::jsonb,
  revenue_streams JSONB DEFAULT '[]'::jsonb,
  key_resources JSONB DEFAULT '[]'::jsonb,
  key_activities JSONB DEFAULT '[]'::jsonb,
  key_partners JSONB DEFAULT '[]'::jsonb,
  cost_structure JSONB DEFAULT '[]'::jsonb,

  -- Original CrewAI data for "Reset" feature
  original_crewai_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for business_model_canvas
CREATE INDEX IF NOT EXISTS idx_business_model_canvas_project_id ON business_model_canvas(project_id);
CREATE INDEX IF NOT EXISTS idx_business_model_canvas_user_id ON business_model_canvas(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_model_canvas_project_unique ON business_model_canvas(project_id);

-- Enable RLS on business_model_canvas
ALTER TABLE business_model_canvas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_model_canvas
DO $$
BEGIN
  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own BMC' AND tablename = 'business_model_canvas'
  ) THEN
    CREATE POLICY "Users can view their own BMC"
      ON business_model_canvas FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own BMC' AND tablename = 'business_model_canvas'
  ) THEN
    CREATE POLICY "Users can insert their own BMC"
      ON business_model_canvas FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own BMC' AND tablename = 'business_model_canvas'
  ) THEN
    CREATE POLICY "Users can update their own BMC"
      ON business_model_canvas FOR UPDATE
      USING (user_id = auth.uid());
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own BMC' AND tablename = 'business_model_canvas'
  ) THEN
    CREATE POLICY "Users can delete their own BMC"
      ON business_model_canvas FOR DELETE
      USING (user_id = auth.uid());
  END IF;

  -- Consultants can view their clients' BMC
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Consultants can view client BMC' AND tablename = 'business_model_canvas'
  ) THEN
    CREATE POLICY "Consultants can view client BMC"
      ON business_model_canvas FOR SELECT
      USING (
        user_id IN (
          SELECT id FROM user_profiles WHERE consultant_id = auth.uid()
        )
      );
  END IF;
END $$;


-- ============================================================================
-- Trigger: Auto-update updated_at timestamps
-- ============================================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for both tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_crewai_validation_states_updated_at') THEN
    CREATE TRIGGER update_crewai_validation_states_updated_at
      BEFORE UPDATE ON crewai_validation_states
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_model_canvas_updated_at') THEN
    CREATE TRIGGER update_business_model_canvas_updated_at
      BEFORE UPDATE ON business_model_canvas
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
