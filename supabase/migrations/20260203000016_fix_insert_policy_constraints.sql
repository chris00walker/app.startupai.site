-- ============================================================================
-- Migration: Fix INSERT policy constraints for consultant_clients
-- ============================================================================
-- Addresses two HIGH-priority audit findings:
--
-- 1. founders_can_insert lacks connection_status = 'requested' check
--    Risk: Founders could insert active connections, bypassing acceptance flow
--
-- 2. verified_consultants_can_insert lacks initiated_by = 'consultant' check
--    Risk: Consultants could insert founder-initiated rows, breaking consent model
-- ============================================================================

-- ============================================================================
-- 1. Fix founders_can_insert policy
-- ============================================================================
-- Drop and recreate with connection_status constraint

DROP POLICY IF EXISTS "founders_can_insert" ON consultant_clients;

CREATE POLICY "founders_can_insert" ON consultant_clients
FOR INSERT
WITH CHECK (
  client_id = auth.uid()
  AND initiated_by = 'founder'
  AND connection_status = 'requested'
);

COMMENT ON POLICY "founders_can_insert" ON consultant_clients IS
  'Founders can only insert connection requests (status=requested, initiated_by=founder)';

-- ============================================================================
-- 2. Fix verified_consultants_can_insert policy
-- ============================================================================
-- Drop and recreate with initiated_by constraint

DROP POLICY IF EXISTS "verified_consultants_can_insert" ON consultant_clients;

CREATE POLICY "verified_consultants_can_insert" ON consultant_clients
FOR INSERT
WITH CHECK (
  consultant_id = auth.uid()
  AND public.is_verified_consultant()
  AND connection_status IN ('requested', 'invited')
  AND initiated_by = 'consultant'
);

COMMENT ON POLICY "verified_consultants_can_insert" ON consultant_clients IS
  'Verified consultants can insert invites/requests only as consultant-initiated';

-- ============================================================================
-- Verification queries (run manually to test)
-- ============================================================================
-- Test 1: Founder cannot insert active connection
-- INSERT INTO consultant_clients (consultant_id, client_id, connection_status, initiated_by)
-- VALUES ('...', auth.uid(), 'active', 'founder');
-- Expected: FAIL (connection_status must be 'requested')

-- Test 2: Consultant cannot insert as founder-initiated
-- INSERT INTO consultant_clients (consultant_id, client_id, connection_status, initiated_by)
-- VALUES (auth.uid(), '...', 'requested', 'founder');
-- Expected: FAIL (initiated_by must be 'consultant')
