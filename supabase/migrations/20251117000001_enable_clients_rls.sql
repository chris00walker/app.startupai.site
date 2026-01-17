-- Enable RLS on clients table
-- This migration secures client data with consultant-ownership model
-- NOTE: This migration is conditionally executed only if the clients table exists
-- The clients table may not be created yet in all environments

DO $$
BEGIN
  -- Check if clients table exists before applying RLS
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'clients'
  ) THEN

    -- Step 1: Add performance index on consultant_id (used in all policies)
    CREATE INDEX IF NOT EXISTS idx_clients_consultant_id
      ON public.clients(consultant_id);

    -- Step 2: Enable Row Level Security
    ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

    -- Step 3: Create policies for consultants (full access to their own clients)

    -- Consultants can view their own clients
    DROP POLICY IF EXISTS "Consultants can view own clients" ON public.clients;
    CREATE POLICY "Consultants can view own clients" ON public.clients
      FOR SELECT
      TO authenticated
      USING (consultant_id = auth.uid());

    -- Consultants can insert clients for themselves
    DROP POLICY IF EXISTS "Consultants can insert own clients" ON public.clients;
    CREATE POLICY "Consultants can insert own clients" ON public.clients
      FOR INSERT
      TO authenticated
      WITH CHECK (consultant_id = auth.uid());

    -- Consultants can update their own clients
    DROP POLICY IF EXISTS "Consultants can update own clients" ON public.clients;
    CREATE POLICY "Consultants can update own clients" ON public.clients
      FOR UPDATE
      TO authenticated
      USING (consultant_id = auth.uid())
      WITH CHECK (consultant_id = auth.uid());

    -- Consultants can delete their own clients
    DROP POLICY IF EXISTS "Consultants can delete own clients" ON public.clients;
    CREATE POLICY "Consultants can delete own clients" ON public.clients
      FOR DELETE
      TO authenticated
      USING (consultant_id = auth.uid());

    -- Step 4: Create admin override policy (view all clients)

    -- Admins can view all clients for oversight
    DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
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

    RAISE NOTICE 'RLS policies applied to clients table';
  ELSE
    RAISE NOTICE 'clients table does not exist, skipping RLS migration';
  END IF;
END $$;

-- Verification queries (commented out, run manually if needed):
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'clients';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'clients' ORDER BY policyname;
