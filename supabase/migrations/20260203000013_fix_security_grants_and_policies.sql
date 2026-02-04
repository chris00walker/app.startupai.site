-- ============================================================================
-- Fix Security Grants and Policies (TASK-028, TASK-029)
-- ============================================================================
-- TASK-028: Grant execute on accept_connection(UUID, TEXT)
-- TASK-029: Restrict consultant_clients INSERT to 'requested' status only
-- ============================================================================

-- ============================================================================
-- TASK-028: Fix accept_connection function grant
-- ============================================================================
-- The function was redefined with signature (UUID, TEXT) in migration 000009
-- but the grant in migration 000002 only covers (UUID).
-- PostgreSQL treats these as different functions, so we need a new grant.

GRANT EXECUTE ON FUNCTION public.accept_connection(UUID, TEXT) TO authenticated;

-- ============================================================================
-- TASK-029: Restrict consultant_clients INSERT to 'requested' status only
-- ============================================================================
-- The current policy allows founders to INSERT connections with any status,
-- bypassing the state transition rules. This fix ensures:
-- 1. Consultants can only INSERT with 'invited' status
-- 2. Founders can only INSERT with 'requested' status
-- All other state transitions must go through SECURITY DEFINER functions.

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "consultants_can_invite_clients" ON consultant_clients;
DROP POLICY IF EXISTS "founders_can_request_connections" ON consultant_clients;

-- Recreate consultant INSERT policy with status restriction
CREATE POLICY "consultants_can_invite_clients" ON consultant_clients
  FOR INSERT TO authenticated
  WITH CHECK (
    consultant_id = auth.uid()
    AND initiated_by = 'consultant'
    AND connection_status = 'invited'  -- TASK-029: Must be invited status
  );

-- Recreate founder INSERT policy with status restriction
CREATE POLICY "founders_can_request_connections" ON consultant_clients
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    AND initiated_by = 'founder'
    AND connection_status = 'requested'  -- TASK-029: Must be requested status
  );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "consultants_can_invite_clients" ON consultant_clients IS
  'Consultants can only create invitations (status=invited). State transitions via functions.';

COMMENT ON POLICY "founders_can_request_connections" ON consultant_clients IS
  'Founders can only create connection requests (status=requested). State transitions via functions.';
