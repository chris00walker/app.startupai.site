-- Enable RLS on clients table
-- This migration secures client data with consultant-ownership model

-- Step 1: Add performance index on consultant_id (used in all policies)
CREATE INDEX IF NOT EXISTS idx_clients_consultant_id
  ON public.clients(consultant_id);

-- Step 2: Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies for consultants (full access to their own clients)

-- Consultants can view their own clients
CREATE POLICY "Consultants can view own clients" ON public.clients
  FOR SELECT
  TO authenticated
  USING (consultant_id = auth.uid());

-- Consultants can insert clients for themselves
CREATE POLICY "Consultants can insert own clients" ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (consultant_id = auth.uid());

-- Consultants can update their own clients
CREATE POLICY "Consultants can update own clients" ON public.clients
  FOR UPDATE
  TO authenticated
  USING (consultant_id = auth.uid())
  WITH CHECK (consultant_id = auth.uid());

-- Consultants can delete their own clients
CREATE POLICY "Consultants can delete own clients" ON public.clients
  FOR DELETE
  TO authenticated
  USING (consultant_id = auth.uid());

-- Step 4: Create admin override policy (view all clients)

-- Admins can view all clients for oversight
CREATE POLICY "Admins can view all clients" ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

-- Optional: Admins can update all clients (uncomment if needed)
-- CREATE POLICY "Admins can update all clients" ON public.clients
--   FOR UPDATE
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1
--       FROM user_profiles
--       WHERE user_profiles.id = auth.uid()
--         AND user_profiles.role = 'admin'
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1
--       FROM user_profiles
--       WHERE user_profiles.id = auth.uid()
--         AND user_profiles.role = 'admin'
--     )
--   );

-- Verification queries (commented out, run manually if needed):
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'clients';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'clients' ORDER BY policyname;
