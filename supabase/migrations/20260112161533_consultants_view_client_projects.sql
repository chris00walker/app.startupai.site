-- Migration: Allow consultants to view their clients' projects
-- Description: Adds RLS policy for consultants to access projects of users they're assigned to
-- NOTE: This migration is conditionally executed only if consultant_id column exists
-- The consultant features may not be fully implemented yet in all environments

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Consultants can view client projects" ON "projects";

-- Enable RLS on projects table (idempotent)
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;

-- Conditional policy creation based on whether consultant_id column exists
DO $$
BEGIN
  -- Check if consultant_id column exists on user_profiles
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'consultant_id'
  ) THEN

    -- Policy: Consultants can view client projects
    -- This allows consultants to see:
    -- 1. Their own projects (user_id match)
    -- 2. Projects where assigned_consultant matches their ID
    -- 3. Projects owned by users whose consultant_id matches their ID
    EXECUTE '
      CREATE POLICY "Consultants can view client projects"
      ON "projects"
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = user_id
        OR auth.uid()::text = assigned_consultant
        OR user_id IN (
          SELECT id FROM user_profiles WHERE consultant_id = auth.uid()
        )
      )
    ';

    -- Add index for performance optimization on consultant_id lookups
    CREATE INDEX IF NOT EXISTS idx_user_profiles_consultant_id
    ON user_profiles(consultant_id);

    RAISE NOTICE 'Consultant policies applied to projects table';
  ELSE
    -- Create simpler policy without consultant_id support
    EXECUTE '
      CREATE POLICY "Consultants can view client projects"
      ON "projects"
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = user_id
        OR auth.uid()::text = assigned_consultant
      )
    ';

    RAISE NOTICE 'Basic consultant policies applied (consultant_id column not found)';
  END IF;
END $$;

-- Add index for performance optimization on projects.user_id
-- (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_projects_user_id
ON projects(user_id);

-- Add index for performance optimization on projects.assigned_consultant
-- (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_projects_assigned_consultant
ON projects(assigned_consultant);
