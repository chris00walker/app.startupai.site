-- Ad Performance Metrics Table
-- Stores daily performance metrics collected from ad platforms
-- @story US-AP06

-- Create confidence level enum
DO $$ BEGIN
  CREATE TYPE confidence_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the ad_performance_metrics table
CREATE TABLE IF NOT EXISTS ad_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,

  -- Platform identification
  platform ad_platform NOT NULL,
  platform_campaign_id TEXT,
  platform_ad_set_id TEXT,
  platform_ad_id TEXT,

  -- Time period
  metric_date DATE NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Reach metrics
  impressions INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  frequency NUMERIC(8,4) DEFAULT 0,

  -- Engagement metrics
  clicks INTEGER NOT NULL DEFAULT 0,
  unique_clicks INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(8,6) DEFAULT 0,

  -- Cost metrics (in cents for precision)
  spend_cents INTEGER NOT NULL DEFAULT 0,
  cpc_cents INTEGER DEFAULT 0,
  cpm_cents INTEGER DEFAULT 0,

  -- Conversion metrics
  landing_page_views INTEGER NOT NULL DEFAULT 0,
  form_submissions INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(8,6) DEFAULT 0,
  cost_per_conversion_cents INTEGER DEFAULT 0,
  conversion_actions JSONB,

  -- Calculated scores
  desirability_score INTEGER NOT NULL DEFAULT 0 CHECK (desirability_score >= 0 AND desirability_score <= 100),
  confidence_level confidence_level NOT NULL DEFAULT 'low',

  -- Benchmark comparison
  benchmark_comparison JSONB,

  -- Raw API response for debugging
  raw_insights JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one record per campaign per day
  UNIQUE(campaign_id, metric_date)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ad_metrics_user_id ON ad_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_project_id ON ad_performance_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_campaign_id ON ad_performance_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_date ON ad_performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_campaign_date ON ad_performance_metrics(campaign_id, metric_date DESC);

-- Enable RLS
ALTER TABLE ad_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own metrics
CREATE POLICY "users_view_own_metrics" ON ad_performance_metrics
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own metrics
CREATE POLICY "users_insert_own_metrics" ON ad_performance_metrics
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own metrics
CREATE POLICY "users_update_own_metrics" ON ad_performance_metrics
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role has full access (for cron jobs)
CREATE POLICY "service_role_full_access" ON ad_performance_metrics
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable realtime for metrics updates
ALTER PUBLICATION supabase_realtime ADD TABLE ad_performance_metrics;

-- Add updated_at trigger
CREATE OR REPLACE TRIGGER set_ad_metrics_updated_at
  BEFORE UPDATE ON ad_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE ad_performance_metrics IS 'Daily performance metrics collected from ad platforms for desirability evidence';
COMMENT ON COLUMN ad_performance_metrics.desirability_score IS 'Score 0-100 based on conversion rate vs industry benchmarks';
COMMENT ON COLUMN ad_performance_metrics.confidence_level IS 'Statistical confidence based on click volume (low <100, medium 100-500, high >500)';
COMMENT ON COLUMN ad_performance_metrics.spend_cents IS 'Total spend in cents for precision';
