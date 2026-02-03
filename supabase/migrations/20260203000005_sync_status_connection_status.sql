-- ============================================================================
-- Synchronize status and connection_status (TASK-002)
-- ============================================================================
-- Created: February 3, 2026
-- Purpose: Ensure status and connection_status fields are in sync
-- Related: Legacy flows updated status only; new flows use connection_status
--
-- This migration syncs existing data and adds a trigger to keep them in sync.
-- ============================================================================

-- First, sync connection_status to match status for any discrepancies
-- This handles legacy data where only status was updated
UPDATE consultant_clients
SET connection_status = status
WHERE connection_status IS DISTINCT FROM status
  AND status IN ('invited', 'active', 'archived');

-- For any 'declined' or 'requested' in connection_status, those are marketplace-only
-- and have no equivalent in the legacy status field, so leave them alone

-- Create trigger function to keep status and connection_status in sync
CREATE OR REPLACE FUNCTION sync_consultant_client_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is updated, sync to connection_status
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.connection_status := NEW.status;
  END IF;

  -- If connection_status is updated, sync to status (except marketplace-only states)
  IF NEW.connection_status IS DISTINCT FROM OLD.connection_status THEN
    -- Only sync states that exist in both fields
    IF NEW.connection_status IN ('invited', 'active', 'archived') THEN
      NEW.status := NEW.connection_status;
    END IF;
    -- 'requested' and 'declined' are marketplace-only, leave status as-is
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS sync_status_trigger ON consultant_clients;
CREATE TRIGGER sync_status_trigger
  BEFORE UPDATE ON consultant_clients
  FOR EACH ROW
  EXECUTE FUNCTION sync_consultant_client_status();

COMMENT ON FUNCTION sync_consultant_client_status() IS
  'Keeps status and connection_status fields in sync. Legacy flows update status; new flows update connection_status.';
