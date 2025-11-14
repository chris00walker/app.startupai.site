-- Migration: Add RLS policies for consultants to view their clients
-- Fixes issue where consultants cannot see their clients in the dashboard
-- because Row Level Security blocks the query

-- Enable RLS on user_profiles if not already enabled
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON "user_profiles"
FOR SELECT
USING (auth.uid() = id);

-- Policy: Consultants can view their clients' profiles
-- A consultant can see user_profiles where consultant_id = their own user ID
CREATE POLICY "Consultants can view their clients"
ON "user_profiles"
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id
    FROM user_profiles
    WHERE id = consultant_id
  )
  OR auth.uid() = consultant_id
);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON "user_profiles"
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON "user_profiles"
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id
    FROM user_profiles
    WHERE role = 'admin'
  )
);

-- Add comment explaining the policies
COMMENT ON TABLE "user_profiles" IS
'Row Level Security enabled. Policies:
1. Users can view/update their own profile
2. Consultants can view profiles where consultant_id matches their ID
3. Admins can view all profiles';
