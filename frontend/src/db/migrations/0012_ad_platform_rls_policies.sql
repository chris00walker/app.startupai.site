-- RLS Policies for Ad Platform Tables
-- @story US-AM01, US-AC01

-- Enable RLS on all ad platform tables
ALTER TABLE ad_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_budget_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_performance_snapshots ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ad_platform_connections: Admin-only access (system-level resource)
-- =============================================================================

-- Admin can do everything
CREATE POLICY "admin_full_access_ad_platform_connections"
  ON ad_platform_connections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Service role can access for backend operations
CREATE POLICY "service_role_ad_platform_connections"
  ON ad_platform_connections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- ad_budget_pools: Users can view/update their own budget pool
-- =============================================================================

-- Users can view their own budget pool
CREATE POLICY "users_view_own_ad_budget_pool"
  ON ad_budget_pools
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can manage all budget pools
CREATE POLICY "service_role_ad_budget_pools"
  ON ad_budget_pools
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin can view all budget pools
CREATE POLICY "admin_view_all_ad_budget_pools"
  ON ad_budget_pools
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- =============================================================================
-- ad_campaigns: Users can view their own campaigns, consultants can view clients'
-- =============================================================================

-- Users can view their own campaigns
CREATE POLICY "users_view_own_ad_campaigns"
  ON ad_campaigns
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Consultants can view their clients' campaigns
CREATE POLICY "consultants_view_client_ad_campaigns"
  ON ad_campaigns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = ad_campaigns.user_id
      AND user_profiles.consultant_id = auth.uid()
    )
  );

-- Admin can view all campaigns
CREATE POLICY "admin_view_all_ad_campaigns"
  ON ad_campaigns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Service role can manage all campaigns (for CrewAI backend)
CREATE POLICY "service_role_ad_campaigns"
  ON ad_campaigns
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- ad_performance_snapshots: Access follows campaign access
-- =============================================================================

-- Users can view snapshots for their own campaigns
CREATE POLICY "users_view_own_ad_performance"
  ON ad_performance_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ad_campaigns
      WHERE ad_campaigns.id = ad_performance_snapshots.campaign_id
      AND ad_campaigns.user_id = auth.uid()
    )
  );

-- Consultants can view their clients' campaign snapshots
CREATE POLICY "consultants_view_client_ad_performance"
  ON ad_performance_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ad_campaigns
      JOIN user_profiles ON user_profiles.id = ad_campaigns.user_id
      WHERE ad_campaigns.id = ad_performance_snapshots.campaign_id
      AND user_profiles.consultant_id = auth.uid()
    )
  );

-- Admin can view all snapshots
CREATE POLICY "admin_view_all_ad_performance"
  ON ad_performance_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Service role can manage all snapshots (for monitoring jobs)
CREATE POLICY "service_role_ad_performance_snapshots"
  ON ad_performance_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- Create indexes for performance optimization
-- =============================================================================

-- Index for budget pool lookup by user
CREATE INDEX IF NOT EXISTS idx_ad_budget_pools_user_id ON ad_budget_pools(user_id);

-- Index for campaign lookup by user and project
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_user_id ON ad_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_project_id ON ad_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);

-- Index for performance snapshots by campaign and time
CREATE INDEX IF NOT EXISTS idx_ad_performance_snapshots_campaign_id ON ad_performance_snapshots(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_performance_snapshots_snapshot_at ON ad_performance_snapshots(snapshot_at DESC);
