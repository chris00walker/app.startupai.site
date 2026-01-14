-- Migration: Create archived_clients junction table
-- Purpose: Track which clients a consultant has archived (hidden from portfolio view)
-- Note: This does NOT affect the client's actual data - only visibility in consultant's view

CREATE TABLE IF NOT EXISTS archived_clients (
  consultant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (consultant_id, client_id)
);

COMMENT ON TABLE archived_clients IS 'Junction table for consultant-archived client relationships. Does not affect client data.';

-- Enable RLS
ALTER TABLE archived_clients ENABLE ROW LEVEL SECURITY;

-- Consultants can only see/manage their own archived relationships
CREATE POLICY "archived_clients_consultant_all"
  ON archived_clients FOR ALL
  USING (consultant_id = auth.uid())
  WITH CHECK (consultant_id = auth.uid());
