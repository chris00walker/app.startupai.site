-- Migration: Add RLS policies for consultants to view their clients' projects
-- Fixes issue where consultants cannot see projects of their assigned clients

-- Policy: Consultants can view projects where they are assigned
-- Either via assigned_consultant field OR via the project owner's consultant_id
CREATE POLICY "Consultants can view client projects"
ON "projects"
FOR SELECT
USING (
  -- Own projects
  auth.uid() = user_id
  -- Projects where consultant is directly assigned
  OR auth.uid()::text = assigned_consultant
  -- Projects owned by users who have this consultant assigned
  OR user_id IN (
    SELECT id
    FROM user_profiles
    WHERE consultant_id = auth.uid()
  )
);

-- Add comment explaining the policy
COMMENT ON POLICY "Consultants can view client projects" ON "projects" IS
'Allows consultants to view:
1. Their own projects (user_id match)
2. Projects where assigned_consultant matches their ID
3. Projects owned by users whose consultant_id matches their ID';
