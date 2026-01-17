-- Enable RLS on user_profiles table
-- This migration fixes the security gap where RLS policies existed but were not enforced

-- Step 1: Fix the INSERT policy to require authentication
-- The original policy allowed NULL auth.uid() which could permit anonymous inserts
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

-- Step 2: Add performance indexes for RLS policy columns
-- These indexes improve query performance when RLS policies are evaluated
-- NOTE: consultant_id column doesn't exist on user_profiles table
-- This index is created in migration 20260112161533 which handles consultant features
-- CREATE INDEX IF NOT EXISTS idx_user_profiles_consultant_id
--   ON public.user_profiles(consultant_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role
  ON public.user_profiles(role);

-- Step 3: Enable Row Level Security
-- This makes all the existing policies take effect
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Verification queries (commented out, run manually if needed):
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_profiles';
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'user_profiles';
