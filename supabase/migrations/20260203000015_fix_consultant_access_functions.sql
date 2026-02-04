-- ============================================================================
-- Fix Consultant Access Functions (Audit Response)
-- ============================================================================
-- Addresses audit findings:
-- 1. Consultant flows fail due to founders-only SELECT policy
-- 2. INSERT policy too permissive (missing verification check)
-- 3. Plan alignment for masking rules
-- ============================================================================

-- ============================================================================
-- 1. Function: Check if consultant has active access to a specific client
-- Used by: quick-start, client/new page
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_consultant_client_access(p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM consultant_clients
    WHERE consultant_id = auth.uid()
      AND client_id = p_client_id
      AND connection_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.check_consultant_client_access(UUID) IS
  'Check if the current consultant has active access to a specific client.';

GRANT EXECUTE ON FUNCTION public.check_consultant_client_access(UUID) TO authenticated;

-- ============================================================================
-- 2. Function: Get consultant's active clients (for client selection UI)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_consultant_active_clients()
RETURNS TABLE (
  id UUID,
  client_id UUID,
  client_name TEXT,
  invite_email TEXT,
  relationship_type TEXT,
  linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.client_id,
    cc.client_name,
    cc.invite_email,
    cc.relationship_type,
    cc.linked_at,
    cc.created_at
  FROM consultant_clients cc
  WHERE cc.consultant_id = auth.uid()
    AND cc.connection_status = 'active'
  ORDER BY cc.linked_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_consultant_active_clients() IS
  'Returns active clients for the current consultant. Client_id is visible because connection is active.';

GRANT EXECUTE ON FUNCTION public.get_consultant_active_clients() TO authenticated;

-- ============================================================================
-- 3. Function: Count consultant's mock clients (for trial limits)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.count_consultant_mock_clients()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM consultant_clients
  WHERE consultant_id = auth.uid()
    AND is_mock = TRUE;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.count_consultant_mock_clients() IS
  'Count mock clients for the current consultant (used for trial limits).';

GRANT EXECUTE ON FUNCTION public.count_consultant_mock_clients() TO authenticated;

-- ============================================================================
-- 4. Fix INSERT policy - require verification for consultants
-- ============================================================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "consultants_can_insert" ON consultant_clients;

-- Create stricter INSERT policy for consultants:
-- - Must be a verified consultant (via is_verified_consultant())
-- - Can only insert 'requested' or 'invited' status (no direct 'active')
CREATE POLICY "verified_consultants_can_insert" ON consultant_clients
FOR INSERT
WITH CHECK (
  consultant_id = auth.uid()
  AND public.is_verified_consultant()
  AND connection_status IN ('requested', 'invited')
);

-- Keep founder INSERT policy as-is (founders don't need verification)
-- founders_can_insert already exists from previous migration

-- ============================================================================
-- 5. Update plan documentation inline (masking rules)
-- ============================================================================
-- The current masking rules are:
-- - Active/archived: show client_id (accepted at some point)
-- - Invited: show client_id (email invite workflow)
-- - Declined: show client_id (already interacted)
-- - Founder-initiated pending: show client_id (founder consented by initiating)
-- - Consultant-initiated pending: MASK client_id (protection)
--
-- This is documented in the plan with the founder-initiated exception.
-- ============================================================================

