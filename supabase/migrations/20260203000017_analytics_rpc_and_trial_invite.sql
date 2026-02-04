-- ============================================================================
-- Migration: Analytics RPC function + Trial consultant invite policy
-- ============================================================================
-- Fixes:
-- 1. Consultant analytics blocked by RLS - add SECURITY DEFINER function
-- 2. Trial consultant invite regression - add separate INSERT policy
-- ============================================================================

-- ============================================================================
-- 1. RPC function for consultant analytics (bypasses RLS)
-- ============================================================================
-- Consultants need connection details (relationship_type, initiated_by, created_at)
-- for analytics when accepting/declining, but can't SELECT from consultant_clients.

CREATE OR REPLACE FUNCTION public.get_connection_for_analytics(p_connection_id UUID)
RETURNS TABLE(
  relationship_type TEXT,
  initiated_by TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Only return data if the current user is the consultant for this connection
  RETURN QUERY
  SELECT
    cc.relationship_type,
    cc.initiated_by,
    cc.created_at
  FROM consultant_clients cc
  WHERE cc.id = p_connection_id
    AND cc.consultant_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_connection_for_analytics(UUID) IS
  'Fetch connection details for analytics. Consultant-only, bypasses RLS.';

GRANT EXECUTE ON FUNCTION public.get_connection_for_analytics(UUID) TO authenticated;

-- ============================================================================
-- 2. Trial consultant invite policy
-- ============================================================================
-- The verified_consultants_can_insert policy broke the legacy invite flow for
-- trial consultants. Add a separate policy for trial invites only.

CREATE POLICY "trial_consultants_can_invite" ON consultant_clients
FOR INSERT
WITH CHECK (
  consultant_id = auth.uid()
  AND public.is_consultant()  -- includes trial consultants
  AND connection_status = 'invited'
  AND initiated_by = 'consultant'
);

COMMENT ON POLICY "trial_consultants_can_invite" ON consultant_clients IS
  'Trial consultants can send invites (status=invited only). For marketplace requests, use verified policy.';

-- ============================================================================
-- Summary of INSERT policies after this migration:
-- ============================================================================
-- 1. verified_consultants_can_insert: verified consultants can insert
--    'requested' or 'invited' with initiated_by='consultant'
-- 2. trial_consultants_can_invite: any consultant (incl. trial) can insert
--    'invited' only with initiated_by='consultant'
-- 3. founders_can_insert: founders can insert 'requested' with
--    initiated_by='founder'
--
-- This means:
-- - Trial consultants: can only use invite flow (status='invited')
-- - Verified consultants: can use both invite and request flows
-- - Founders: can only request connections (status='requested')
-- ============================================================================
