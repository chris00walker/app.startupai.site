-- ============================================================================
-- Fix Connection Functions (TASK-019, TASK-020)
-- ============================================================================
-- Created: February 3, 2026
-- Purpose: Fix accept_connection to set linked_at; fix archive_connection to set audit columns
-- Related: TASK-019, TASK-020
-- ============================================================================

-- Fix accept_connection to also set linked_at and status for backwards compatibility
CREATE OR REPLACE FUNCTION public.accept_connection(connection_id UUID)
RETURNS JSON AS $$
DECLARE
  v_connection RECORD;
BEGIN
  -- Get connection details
  SELECT * INTO v_connection
  FROM consultant_clients
  WHERE id = connection_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found', 'message', 'Connection not found');
  END IF;

  -- Verify the current user is the recipient
  IF v_connection.initiated_by = 'consultant' AND v_connection.client_id != auth.uid() THEN
    RETURN json_build_object('error', 'forbidden', 'message', 'Only the founder can accept this request');
  END IF;

  IF v_connection.initiated_by = 'founder' AND v_connection.consultant_id != auth.uid() THEN
    RETURN json_build_object('error', 'forbidden', 'message', 'Only the consultant can accept this request');
  END IF;

  -- Verify status is 'requested' (can only accept pending requests)
  IF v_connection.connection_status != 'requested' THEN
    RETURN json_build_object('error', 'invalid_state', 'message', 'Can only accept pending requests');
  END IF;

  -- Perform the update - set both connection_status and status for backwards compatibility
  UPDATE consultant_clients
  SET connection_status = 'active',
      status = 'active',           -- Keep in sync (TASK-002)
      accepted_at = NOW(),
      linked_at = NOW(),           -- TASK-019: Set linked_at
      updated_at = NOW()
  WHERE id = connection_id;

  RETURN json_build_object(
    'success', true,
    'connection_id', connection_id,
    'status', 'active',
    'accepted_at', NOW(),
    'linked_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.accept_connection(UUID) IS
  'Accept a connection request. Sets both accepted_at and linked_at. Only the recipient can accept.';

-- Fix archive_connection to set audit columns
CREATE OR REPLACE FUNCTION public.archive_connection(connection_id UUID)
RETURNS JSON AS $$
DECLARE
  v_connection RECORD;
  v_archived_by TEXT;
BEGIN
  -- Get connection details
  SELECT * INTO v_connection
  FROM consultant_clients
  WHERE id = connection_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found', 'message', 'Connection not found');
  END IF;

  -- Verify the current user is a party to this connection
  IF v_connection.client_id != auth.uid() AND v_connection.consultant_id != auth.uid() THEN
    RETURN json_build_object('error', 'forbidden', 'message', 'You are not part of this connection');
  END IF;

  -- Verify status is 'active' (can only archive active connections)
  IF v_connection.connection_status != 'active' THEN
    RETURN json_build_object('error', 'invalid_state', 'message', 'Can only archive active connections');
  END IF;

  -- Determine who is archiving
  IF v_connection.consultant_id = auth.uid() THEN
    v_archived_by := 'consultant';
  ELSE
    v_archived_by := 'client';
  END IF;

  -- Perform the update with audit columns (TASK-020)
  UPDATE consultant_clients
  SET connection_status = 'archived',
      status = 'archived',           -- Keep in sync (TASK-002)
      archived_at = NOW(),           -- TASK-020: Set archived_at
      archived_by = v_archived_by,   -- TASK-020: Set archived_by
      updated_at = NOW()
  WHERE id = connection_id;

  RETURN json_build_object(
    'success', true,
    'connection_id', connection_id,
    'status', 'archived',
    'archived_at', NOW(),
    'archived_by', v_archived_by
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.archive_connection(UUID) IS
  'Archive an active connection. Sets archived_at and archived_by. Either party can archive.';

-- Also fix decline_connection to sync status
CREATE OR REPLACE FUNCTION public.decline_connection(connection_id UUID, decline_reason TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_connection RECORD;
BEGIN
  -- Get connection details
  SELECT * INTO v_connection
  FROM consultant_clients
  WHERE id = connection_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found', 'message', 'Connection not found');
  END IF;

  -- Verify the current user is the recipient
  IF v_connection.initiated_by = 'consultant' AND v_connection.client_id != auth.uid() THEN
    RETURN json_build_object('error', 'forbidden', 'message', 'Only the founder can decline this request');
  END IF;

  IF v_connection.initiated_by = 'founder' AND v_connection.consultant_id != auth.uid() THEN
    RETURN json_build_object('error', 'forbidden', 'message', 'Only the consultant can decline this request');
  END IF;

  -- Verify status is 'requested' (can only decline pending requests)
  IF v_connection.connection_status != 'requested' THEN
    RETURN json_build_object('error', 'invalid_state', 'message', 'Can only decline pending requests');
  END IF;

  -- Perform the update
  UPDATE consultant_clients
  SET connection_status = 'declined',
      declined_at = NOW(),
      updated_at = NOW()
  WHERE id = connection_id;

  RETURN json_build_object(
    'success', true,
    'connection_id', connection_id,
    'status', 'declined',
    'declined_at', NOW(),
    'cooldown_ends_at', NOW() + INTERVAL '30 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.decline_connection(UUID, TEXT) IS
  'Decline a connection request. Triggers 30-day cooldown. Only the recipient can decline.';
