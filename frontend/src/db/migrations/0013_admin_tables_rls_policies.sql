-- Enable RLS on all admin tables
-- @story US-A07, US-A06, US-A03

-- ============================================================
-- admin_audit_log: Admin read, service role write
-- ============================================================

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit logs
CREATE POLICY "admin_read_audit_log"
  ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Service role can insert audit logs (backend operations)
-- Note: This is handled by Supabase's service role bypass of RLS
-- For extra safety, we also allow authenticated admins to insert
CREATE POLICY "admin_insert_audit_log"
  ON admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- No update or delete allowed - audit logs are immutable
-- (Policies not created for UPDATE/DELETE = denied by default)

-- ============================================================
-- feature_flags: All authenticated users can read, admins can write
-- ============================================================

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read feature flags
-- (Needed for client-side feature flag checks)
CREATE POLICY "authenticated_read_feature_flags"
  ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create feature flags
CREATE POLICY "admin_insert_feature_flags"
  ON feature_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can update feature flags
CREATE POLICY "admin_update_feature_flags"
  ON feature_flags
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can delete feature flags
CREATE POLICY "admin_delete_feature_flags"
  ON feature_flags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================================
-- admin_sessions: Only admins can read/write their own sessions
-- ============================================================

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Admins can read all impersonation sessions (for audit purposes)
CREATE POLICY "admin_read_sessions"
  ON admin_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admins can create new impersonation sessions
CREATE POLICY "admin_insert_sessions"
  ON admin_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be admin
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    -- admin_id must be the current user
    AND admin_id = auth.uid()
  );

-- Admins can update their own sessions (to end them)
CREATE POLICY "admin_update_own_sessions"
  ON admin_sessions
  FOR UPDATE
  TO authenticated
  USING (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    admin_id = auth.uid()
  );

-- No delete allowed - sessions are soft-deleted (ended_at is set)
-- (Policy not created for DELETE = denied by default)

-- ============================================================
-- Additional RLS for user_profiles: Admin read access
-- ============================================================

-- Admins can read all user profiles (for user search)
CREATE POLICY "admin_read_all_user_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- User can read their own profile
    id = auth.uid()
    -- OR user is an admin
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
    -- OR user is a consultant viewing their client
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'consultant'
      AND user_profiles.consultant_id = up.id
    )
  );

-- ============================================================
-- Indexes for RLS query performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_consultant ON user_profiles(consultant_id);
