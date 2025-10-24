-- ============================================================================
-- User Profile Auto-Creation Trigger
-- ============================================================================
-- Created: October 24, 2025
-- Purpose: Add avatar_url column and automatic profile creation on signup
-- Dependencies: user_profiles table from 00001_initial_schema.sql
-- Cross-Reference: docs/technical/two-site-implementation-plan.md Phase 0 Steps 2-3

-- ============================================================================
-- Step 2: Add missing avatar_url column
-- ============================================================================

-- Add avatar_url column if it doesn't exist
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================================
-- Step 3: Create automatic profile creation trigger
-- ============================================================================

-- Function to handle new user signup
-- This automatically creates a user_profile record when a user signs up via OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert profile with data from OAuth provider (stored in raw_user_meta_data)
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    subscription_tier,
    plan_status
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'trial'::user_role),
    COALESCE(new.raw_user_meta_data->>'plan_type', 'trial'),
    'trialing'
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  
  RETURN new;
END;
$$;

-- Create trigger that fires on user creation
-- This runs automatically whenever a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Verification queries (commented out - run manually to test)
-- ============================================================================

-- Check if avatar_url column exists:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' AND column_name = 'avatar_url';

-- Check if trigger exists:
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'on_auth_user_created';

-- Test profile creation:
-- 1. Sign up a new user via GitHub OAuth
-- 2. Check auth.users: SELECT id, email, raw_user_meta_data FROM auth.users ORDER BY created_at DESC LIMIT 1;
-- 3. Check user_profiles: SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 1;
-- 4. Verify full_name and avatar_url are populated
