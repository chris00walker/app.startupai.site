-- Migration: Connection count RPC function
-- Purpose: TASK-010 - Fix connection counts returning 0 due to RLS restrictions
-- Provides a SECURITY DEFINER function to count active connections for consultants

-- Function to get active connection count for a consultant
-- This bypasses RLS to provide accurate counts for directory display
CREATE OR REPLACE FUNCTION get_consultant_connection_count(consultant_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count_result
  FROM consultant_clients
  WHERE consultant_id = consultant_uuid
    AND connection_status = 'active';

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users (for directory browsing)
GRANT EXECUTE ON FUNCTION get_consultant_connection_count(UUID) TO authenticated;

COMMENT ON FUNCTION get_consultant_connection_count(UUID) IS
  'Returns the count of active connections for a consultant. Used by Consultant Directory.';
