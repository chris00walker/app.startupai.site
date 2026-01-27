-- Copy Banks Table and RLS Policies
-- Pre-computed ad copy variants generated from VPC data
-- @story US-AP01

-- =============================================================================
-- Create copy_banks table
-- =============================================================================

CREATE TABLE IF NOT EXISTS copy_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- VPC tracking
  vpc_id UUID,
  vpc_version INTEGER NOT NULL DEFAULT 1,
  segment_key TEXT,

  -- Copy Bank data (JSONB for flexibility)
  headlines JSONB NOT NULL,
  primary_texts JSONB NOT NULL,
  pains JSONB NOT NULL,
  gains JSONB NOT NULL,
  product JSONB NOT NULL,
  image_keywords JSONB NOT NULL,
  ctas JSONB NOT NULL,

  -- Generation metadata
  model_used TEXT,
  prompt_version TEXT,
  generation_cost TEXT,

  -- Timestamps
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Enable RLS
-- =============================================================================

ALTER TABLE copy_banks ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- Users can view their own copy banks
CREATE POLICY "users_view_own_copy_banks"
  ON copy_banks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own copy banks
CREATE POLICY "users_create_own_copy_banks"
  ON copy_banks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own copy banks
CREATE POLICY "users_update_own_copy_banks"
  ON copy_banks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Consultants can view their clients' copy banks
CREATE POLICY "consultants_view_client_copy_banks"
  ON copy_banks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = copy_banks.user_id
      AND user_profiles.consultant_id = auth.uid()
    )
  );

-- Admin can view all copy banks
CREATE POLICY "admin_view_all_copy_banks"
  ON copy_banks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Service role can manage all copy banks (for backend operations)
CREATE POLICY "service_role_copy_banks"
  ON copy_banks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- Indexes for performance
-- =============================================================================

-- Index for copy bank lookup by user and project
CREATE INDEX IF NOT EXISTS idx_copy_banks_user_id ON copy_banks(user_id);
CREATE INDEX IF NOT EXISTS idx_copy_banks_project_id ON copy_banks(project_id);
CREATE INDEX IF NOT EXISTS idx_copy_banks_vpc_id ON copy_banks(vpc_id);

-- Index for finding latest version per project
CREATE INDEX IF NOT EXISTS idx_copy_banks_project_version ON copy_banks(project_id, vpc_version DESC);
