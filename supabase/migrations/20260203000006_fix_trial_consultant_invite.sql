-- ============================================================================
-- Fix Trial Consultant Invite Flow (TASK-017/S-005)
-- ============================================================================
-- Created: February 3, 2026
-- Purpose: Allow trial consultants to use the legacy invite flow
-- Related: S-005 - Trial consultants blocked from invite flow
--
-- The issue is that the INSERT policy requires is_verified_consultant() for ALL
-- consultant-initiated inserts, but the legacy invite flow should work for
-- any consultant (including trial users).
--
-- This migration updates the policy to:
-- - Allow ANY consultant to use the legacy invite flow (connection_status = 'invited')
-- - Require verification only for marketplace flows (connection_status = 'requested')
-- ============================================================================

-- First, create a helper function to check if user is any consultant (not just verified)
CREATE OR REPLACE FUNCTION public.is_consultant()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM consultant_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_consultant() IS
  'Returns TRUE if the current user has a consultant profile (any verification status).';

-- Drop and recreate the INSERT policy with fixed logic
DROP POLICY IF EXISTS "consultant_clients_insert_policy" ON consultant_clients;

CREATE POLICY "consultant_clients_insert_policy" ON consultant_clients
FOR INSERT
WITH CHECK (
  -- Legacy invite flow: ANY consultant can invite (trial or verified)
  (
    connection_status = 'invited'
    AND initiated_by = 'consultant'
    AND consultant_id = auth.uid()
    AND public.is_consultant()  -- Any consultant, not just verified
  )
  OR
  -- Marketplace request flow: VERIFIED consultants only
  (
    connection_status = 'requested'
    AND initiated_by = 'consultant'
    AND consultant_id = auth.uid()
    AND public.is_verified_consultant()
  )
  OR
  -- Founder-initiated request: any authenticated founder
  (
    initiated_by = 'founder'
    AND client_id = auth.uid()
  )
);

COMMENT ON POLICY "consultant_clients_insert_policy" ON consultant_clients IS
  'Allow consultants to create invites (any consultant) or marketplace requests (verified only). Founders can create requests to consultants.';
