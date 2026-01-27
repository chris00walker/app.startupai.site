-- Fix for admin user search - avoids infinite recursion
-- Uses SECURITY DEFINER function to check admin role without triggering RLS
--
-- IMPORTANT: The original version of this migration caused infinite recursion
-- because the policy queried user_profiles within a policy ON user_profiles.
-- This version uses a SECURITY DEFINER function to bypass RLS for the check.
--
-- @story US-A01, US-A02, US-A08

-- Step 1: Create a SECURITY DEFINER function to check if current user is admin
-- This function runs with elevated privileges and bypasses RLS
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Step 2: Create admin SELECT policy using the function
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- User can see their own profile OR user is admin
    auth.uid() = id OR public.is_current_user_admin()
  );

-- Step 3: Create admin UPDATE policy using the function
DROP POLICY IF EXISTS "Admins can update all user profiles" ON user_profiles;
CREATE POLICY "Admins can update all user profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- User can update their own profile OR user is admin
    auth.uid() = id OR public.is_current_user_admin()
  )
  WITH CHECK (
    auth.uid() = id OR public.is_current_user_admin()
  );

-- Step 4: Drop the old "Users can view own profile" policy since it's now redundant
-- (the new policy handles both cases)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Add index for admin role lookup performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_admin
  ON user_profiles(role)
  WHERE role = 'admin';

-- Add helpful comments
COMMENT ON FUNCTION public.is_current_user_admin() IS
  'Checks if the current authenticated user has admin role. Uses SECURITY DEFINER to avoid RLS recursion.';

COMMENT ON POLICY "Admins can view all user profiles" ON user_profiles IS
  'Users can view their own profile. Admins can view all profiles for user management (US-A01).';
