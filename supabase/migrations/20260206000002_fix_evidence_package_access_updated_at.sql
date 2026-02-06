-- Fix evidence_package_access updated_at trigger target
-- The narrative layer schema attached set_updated_at_timestamp() to this table
-- but the table did not include an updated_at column.

ALTER TABLE evidence_package_access
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE evidence_package_access
SET updated_at = COALESCE(last_accessed_at, first_accessed_at, NOW())
WHERE updated_at IS NULL;

DROP TRIGGER IF EXISTS set_evidence_package_access_updated_at ON evidence_package_access;

CREATE TRIGGER set_evidence_package_access_updated_at
  BEFORE UPDATE ON evidence_package_access
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

