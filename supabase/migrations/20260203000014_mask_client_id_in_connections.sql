-- Mask client_id for non-active connections (DB-level enforcement)
-- Enforces: "client_id not visible until connection_status='active'"
-- @story US-PH03, US-FM05

-- ============================================================================
-- Problem:
-- The consultant_clients_select_policy allows consultants to see client_id
-- for pending requests via direct PostgREST queries. PostgreSQL RLS controls
-- row visibility, not column visibility.
--
-- Solution:
-- 1. Drop consultant SELECT access on the base table
-- 2. Keep founder SELECT access (they can see their own data)
-- 3. Create SECURITY DEFINER functions for consultant operations
-- 4. API routes use the functions; direct PostgREST is blocked
-- ============================================================================

-- ============================================================================
-- 1. SECURITY DEFINER function to get connections (with masking)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_connections(
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  consultant_id UUID,
  client_id UUID,  -- Masked for consultant-initiated pending requests
  relationship_type TEXT,
  connection_status TEXT,
  initiated_by TEXT,
  request_message TEXT,
  status TEXT,
  invite_email TEXT,
  invite_token TEXT,
  invite_expires_at TIMESTAMPTZ,
  client_name TEXT,
  invited_at TIMESTAMPTZ,
  linked_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
DECLARE
  v_total BIGINT;
BEGIN
  -- Get total count for pagination
  SELECT COUNT(*) INTO v_total
  FROM consultant_clients cc
  WHERE (cc.consultant_id = auth.uid() OR cc.client_id = auth.uid())
    AND (p_status IS NULL OR cc.connection_status = p_status);

  RETURN QUERY
  SELECT
    cc.id,
    cc.consultant_id,
    -- Mask client_id for consultant-initiated PENDING requests only
    -- Active, archived, invited, and declined connections show client_id
    CASE
      -- Active/archived connections: always show (was accepted at some point)
      WHEN cc.connection_status IN ('active', 'archived') THEN cc.client_id
      -- Invited (via email): show (invite workflow, not directory request)
      WHEN cc.connection_status = 'invited' THEN cc.client_id
      -- Declined: show (they already interacted)
      WHEN cc.connection_status = 'declined' THEN cc.client_id
      -- Founder-initiated requests: show (founder consented by initiating)
      WHEN cc.initiated_by = 'founder' THEN cc.client_id
      -- Consultant-initiated PENDING requests: hide founder identity
      WHEN cc.connection_status = 'requested' AND cc.consultant_id = auth.uid() THEN NULL::UUID
      -- Fallback: show
      ELSE cc.client_id
    END as client_id,
    cc.relationship_type,
    cc.connection_status,
    cc.initiated_by,
    cc.request_message,
    cc.status,
    cc.invite_email,
    cc.invite_token,
    cc.invite_expires_at,
    cc.client_name,
    cc.invited_at,
    cc.linked_at,
    cc.accepted_at,
    cc.declined_at,
    cc.archived_at,
    cc.archived_by,
    cc.created_at,
    v_total as total_count
  FROM consultant_clients cc
  WHERE (cc.consultant_id = auth.uid() OR cc.client_id = auth.uid())
    AND (p_status IS NULL OR cc.connection_status = p_status)
  ORDER BY cc.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_my_connections(TEXT, INTEGER, INTEGER) IS
  'Returns paginated connections with client_id masked for consultant-initiated pending requests.';

GRANT EXECUTE ON FUNCTION public.get_my_connections(TEXT, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- 2. SECURITY DEFINER function to get a single connection
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_connection(p_connection_id UUID)
RETURNS TABLE (
  id UUID,
  consultant_id UUID,
  client_id UUID,
  relationship_type TEXT,
  connection_status TEXT,
  initiated_by TEXT,
  request_message TEXT,
  status TEXT,
  invite_email TEXT,
  invite_token TEXT,
  invite_expires_at TIMESTAMPTZ,
  client_name TEXT,
  invited_at TIMESTAMPTZ,
  linked_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archived_by TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.consultant_id,
    CASE
      WHEN cc.connection_status = 'active' THEN cc.client_id
      WHEN cc.initiated_by = 'founder' THEN cc.client_id
      WHEN cc.consultant_id = auth.uid() THEN NULL::UUID
      ELSE cc.client_id
    END as client_id,
    cc.relationship_type,
    cc.connection_status,
    cc.initiated_by,
    cc.request_message,
    cc.status,
    cc.invite_email,
    cc.invite_token,
    cc.invite_expires_at,
    cc.client_name,
    cc.invited_at,
    cc.linked_at,
    cc.accepted_at,
    cc.declined_at,
    cc.archived_at,
    cc.archived_by,
    cc.created_at
  FROM consultant_clients cc
  WHERE cc.id = p_connection_id
    AND (cc.consultant_id = auth.uid() OR cc.client_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_connection(UUID) IS
  'Returns a single connection with client_id masked appropriately.';

GRANT EXECUTE ON FUNCTION public.get_connection(UUID) TO authenticated;

-- ============================================================================
-- 3. SECURITY DEFINER function to check for existing connection
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_existing_connection(
  p_consultant_id UUID,
  p_founder_id UUID,
  p_statuses TEXT[]
)
RETURNS TABLE (
  id UUID,
  connection_status TEXT
) AS $$
BEGIN
  -- Only allow checking if the caller is the consultant or founder
  IF auth.uid() != p_consultant_id AND auth.uid() != p_founder_id THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT cc.id, cc.connection_status
  FROM consultant_clients cc
  WHERE cc.consultant_id = p_consultant_id
    AND cc.client_id = p_founder_id
    AND cc.connection_status = ANY(p_statuses)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.check_existing_connection(UUID, UUID, TEXT[]) IS
  'Check if a connection exists between a consultant and founder.';

GRANT EXECUTE ON FUNCTION public.check_existing_connection(UUID, UUID, TEXT[]) TO authenticated;

-- ============================================================================
-- 4. SECURITY DEFINER function to create a connection request
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_connection_request(
  p_founder_id UUID,
  p_relationship_type TEXT,
  p_message TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_connection_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- Verify caller is a verified consultant
  IF NOT public.is_verified_consultant() THEN
    RETURN json_build_object(
      'error', 'unverified',
      'message', 'Upgrade to Advisor or Capital plan to request connections.'
    );
  END IF;

  -- Check cooldown
  DECLARE
    v_cooldown JSON;
  BEGIN
    SELECT public.check_connection_cooldown(auth.uid(), p_founder_id) INTO v_cooldown;
    IF (v_cooldown->>'cooldown_active')::BOOLEAN THEN
      RETURN json_build_object(
        'error', 'cooldown_active',
        'message', format('You can reconnect with this founder in %s days.', v_cooldown->>'days_remaining'),
        'cooldown_ends_at', v_cooldown->>'cooldown_ends_at',
        'days_remaining', v_cooldown->>'days_remaining'
      );
    END IF;
  END;

  -- Check for existing connection
  IF EXISTS (
    SELECT 1 FROM consultant_clients
    WHERE consultant_id = auth.uid()
      AND client_id = p_founder_id
      AND connection_status IN ('requested', 'active')
  ) THEN
    RETURN json_build_object(
      'error', 'already_exists',
      'message', 'A connection already exists or is pending.'
    );
  END IF;

  -- Create the connection
  INSERT INTO consultant_clients (
    consultant_id,
    client_id,
    relationship_type,
    status,
    connection_status,
    initiated_by,
    request_message
  ) VALUES (
    auth.uid(),
    p_founder_id,
    p_relationship_type,
    'requested',
    'requested',
    'consultant',
    p_message
  )
  RETURNING id, created_at INTO v_connection_id, v_created_at;

  RETURN json_build_object(
    'success', true,
    'connection_id', v_connection_id,
    'status', 'requested',
    'created_at', v_created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_connection_request(UUID, TEXT, TEXT) IS
  'Create a connection request from consultant to founder. Returns the created connection.';

GRANT EXECUTE ON FUNCTION public.create_connection_request(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 5. Update RLS policies - restrict consultant SELECT access
-- ============================================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "consultant_clients_select_policy" ON consultant_clients;

-- Create restrictive SELECT policy:
-- - Founders can SELECT their rows (they're the client, can see their own data)
-- - Consultants must use SECURITY DEFINER functions
CREATE POLICY "consultant_clients_select_founders_only" ON consultant_clients
FOR SELECT
USING (
  -- Only founders can directly SELECT rows where they are the client
  client_id = auth.uid()
);

-- ============================================================================
-- 6. Keep INSERT policy for consultants (for direct Supabase client use if needed)
-- Note: Prefer using create_connection_request() function instead
-- ============================================================================

-- Ensure INSERT policies exist
DROP POLICY IF EXISTS "consultant_clients_insert_policy" ON consultant_clients;
DROP POLICY IF EXISTS "consultants_can_invite_clients" ON consultant_clients;
DROP POLICY IF EXISTS "founders_can_request_connections" ON consultant_clients;

-- Consultant INSERT (for invites and connection requests)
CREATE POLICY "consultants_can_insert" ON consultant_clients
FOR INSERT
WITH CHECK (
  consultant_id = auth.uid()
  AND public.is_consultant()
);

-- Founder INSERT (for founder-initiated requests)
CREATE POLICY "founders_can_insert" ON consultant_clients
FOR INSERT
WITH CHECK (
  client_id = auth.uid()
  AND initiated_by = 'founder'
);

-- ============================================================================
-- 7. Update active_connections view with masking
-- ============================================================================

CREATE OR REPLACE VIEW public.active_connections AS
SELECT
  cc.id as connection_id,
  cc.consultant_id,
  CASE
    WHEN cc.connection_status = 'active' THEN cc.client_id
    WHEN cc.initiated_by = 'founder' THEN cc.client_id
    ELSE NULL
  END as founder_id,
  cc.relationship_type,
  cc.connection_status,
  cc.initiated_by,
  cc.request_message,
  cc.accepted_at,
  cc.created_at,
  cp.company_name as consultant_organization,
  up_consultant.full_name as consultant_name,
  CASE
    WHEN cc.connection_status = 'active' OR cc.initiated_by = 'founder' THEN up_founder.full_name
    ELSE NULL
  END as founder_name,
  CASE
    WHEN cc.connection_status = 'active' OR cc.initiated_by = 'founder' THEN up_founder.email
    ELSE NULL
  END as founder_email
FROM consultant_clients cc
JOIN user_profiles up_consultant ON up_consultant.id = cc.consultant_id
LEFT JOIN consultant_profiles cp ON cp.id = cc.consultant_id
LEFT JOIN user_profiles up_founder ON up_founder.id = cc.client_id
WHERE cc.consultant_id = auth.uid() OR cc.client_id = auth.uid();

COMMENT ON VIEW public.active_connections IS
  'Connection details with PII masking for consultant-initiated pending requests.';

GRANT SELECT ON public.active_connections TO authenticated;
