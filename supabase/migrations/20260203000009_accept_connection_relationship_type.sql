-- Migration: Accept connection with optional relationship type override
-- Purpose: TASK-012 - Fix confirmedRelationshipType not being persisted

-- Update accept_connection to accept optional relationship_type parameter
CREATE OR REPLACE FUNCTION accept_connection(
  connection_id UUID,
  confirmed_relationship_type TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  connection_record RECORD;
  result JSONB;
BEGIN
  -- Get the connection with lock
  SELECT * INTO connection_record
  FROM consultant_clients
  WHERE id = connection_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found', 'message', 'Connection not found');
  END IF;

  -- Verify the caller is the recipient of the connection request
  IF connection_record.initiated_by = 'consultant' AND connection_record.client_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'forbidden', 'message', 'Only the founder can accept this request');
  END IF;

  IF connection_record.initiated_by = 'founder' AND connection_record.consultant_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'forbidden', 'message', 'Only the consultant can accept this request');
  END IF;

  -- Check current state
  IF connection_record.connection_status NOT IN ('requested', 'invited') THEN
    RETURN jsonb_build_object(
      'error', 'invalid_state',
      'message', 'Connection is not in a pending state'
    );
  END IF;

  -- Update the connection status and optionally the relationship type
  UPDATE consultant_clients
  SET
    connection_status = 'active',
    status = 'active',
    accepted_at = NOW(),
    linked_at = NOW(),
    -- Only update relationship_type if a confirmed type is provided
    relationship_type = COALESCE(confirmed_relationship_type, relationship_type)
  WHERE id = connection_id;

  RETURN jsonb_build_object(
    'connection_id', connection_id,
    'accepted_at', NOW(),
    'relationship_type', COALESCE(confirmed_relationship_type, connection_record.relationship_type)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION accept_connection(UUID, TEXT) IS
  'Accept a connection request. Optionally confirm/override the relationship type.';
