-- Add admin policy to view all user profiles
-- Fixes: Admin Dashboard user search returning 0 results
-- The user_profiles table only had "Users can view own profile" policy,
-- which blocked admins from searching/viewing other users.
--
-- @story US-A01, US-A02, US-A08

-- Policy: Admins can view all user profiles
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Policy: Admins can update all user profiles (for role changes, etc.)
DROP POLICY IF EXISTS "Admins can update all user profiles" ON user_profiles;
CREATE POLICY "Admins can update all user profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Add index to improve admin policy performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_admin
  ON user_profiles(role)
  WHERE role = 'admin';

COMMENT ON POLICY "Admins can view all user profiles" ON user_profiles IS
  'Allows admin users to view all user profiles for the Admin Dashboard user management feature (US-A01)';

COMMENT ON POLICY "Admins can update all user profiles" ON user_profiles IS
  'Allows admin users to update all user profiles for role changes and user management (US-A01)';
