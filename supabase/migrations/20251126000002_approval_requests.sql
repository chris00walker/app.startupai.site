-- Approval Requests Table
-- Stores HITL (Human-in-the-Loop) approval requests from CrewAI
-- Implements the approval workflow from approval-workflows.md

-- ============================================================================
-- APPROVAL REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- CrewAI execution context
  execution_id TEXT NOT NULL, -- CrewAI Flow execution ID
  task_id TEXT NOT NULL, -- CrewAI Task ID
  kickoff_id TEXT, -- Original kickoff ID

  -- User context
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Approval type and owner
  approval_type TEXT NOT NULL CHECK (approval_type IN (
    'segment_pivot',      -- Change target customer segment
    'value_pivot',        -- Iterate value proposition
    'feature_downgrade',  -- Remove features due to technical constraints
    'strategic_pivot',    -- Choose price increase or cost reduction
    'spend_increase',     -- Approve budget increase
    'campaign_launch',    -- Approve ad campaign
    'customer_contact',   -- Approve direct customer outreach
    'gate_progression',   -- Approve gate passage
    'data_sharing'        -- Approve third-party data sharing
  )),
  owner_role TEXT NOT NULL CHECK (owner_role IN ('compass', 'ledger', 'pulse', 'guardian', 'forge')),

  -- Request content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_output JSONB NOT NULL DEFAULT '{}', -- The AI's analysis/recommendation
  evidence_summary JSONB DEFAULT '{}', -- Supporting evidence
  options JSONB DEFAULT '[]', -- Available choices for the user

  -- Decision
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  decision TEXT, -- The chosen option
  human_feedback TEXT, -- User's reasoning
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,

  -- Auto-approve settings
  auto_approvable BOOLEAN DEFAULT FALSE,
  auto_approve_reason TEXT,

  -- Escalation
  escalation_level INTEGER DEFAULT 0 CHECK (escalation_level >= 0 AND escalation_level <= 3),
  last_escalated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_requests_user_id ON approval_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_project_id ON approval_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_type ON approval_requests(approval_type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_execution ON approval_requests(execution_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_expires ON approval_requests(expires_at) WHERE status = 'pending';

-- ============================================================================
-- APPROVAL PREFERENCES TABLE
-- User preferences for auto-approval rules
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Which types to auto-approve
  auto_approve_types TEXT[] DEFAULT '{}',

  -- Thresholds
  max_auto_approve_spend DECIMAL(10,2) DEFAULT 0, -- Auto-approve spend up to this amount
  auto_approve_low_risk BOOLEAN DEFAULT FALSE, -- Auto-approve low-risk decisions

  -- Notification preferences
  notify_email BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,
  escalation_email TEXT, -- Backup email for escalations

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id)
);

-- ============================================================================
-- APPROVAL HISTORY TABLE
-- Audit trail of all approval decisions
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,

  -- Action
  action TEXT NOT NULL CHECK (action IN ('created', 'viewed', 'approved', 'rejected', 'escalated', 'expired', 'auto_approved')),
  actor_id UUID REFERENCES auth.users(id),
  actor_type TEXT CHECK (actor_type IN ('user', 'system', 'cron')),

  -- Details
  details JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_approval_history_request ON approval_history(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_created ON approval_history(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
DROP TRIGGER IF EXISTS update_approval_requests_updated_at ON approval_requests;
CREATE TRIGGER update_approval_requests_updated_at
BEFORE UPDATE ON approval_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_approval_preferences_updated_at ON approval_preferences;
CREATE TRIGGER update_approval_preferences_updated_at
BEFORE UPDATE ON approval_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own approval requests
DROP POLICY IF EXISTS "Users can view own approval requests" ON approval_requests;
CREATE POLICY "Users can view own approval requests"
ON approval_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own approval requests (to approve/reject)
DROP POLICY IF EXISTS "Users can update own approval requests" ON approval_requests;
CREATE POLICY "Users can update own approval requests"
ON approval_requests FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Service role can manage all approval requests (for webhooks)
DROP POLICY IF EXISTS "Service role can manage approval requests" ON approval_requests;
CREATE POLICY "Service role can manage approval requests"
ON approval_requests FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can manage their own preferences
DROP POLICY IF EXISTS "Users can manage own preferences" ON approval_preferences;
CREATE POLICY "Users can manage own preferences"
ON approval_preferences FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can view history for their approval requests
DROP POLICY IF EXISTS "Users can view own approval history" ON approval_history;
CREATE POLICY "Users can view own approval history"
ON approval_history FOR SELECT
TO authenticated
USING (
  approval_request_id IN (
    SELECT id FROM approval_requests WHERE user_id = auth.uid()
  )
);

-- Service role can manage all history
DROP POLICY IF EXISTS "Service role can manage approval history" ON approval_history;
CREATE POLICY "Service role can manage approval history"
ON approval_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Consultants can view approval requests for their clients
-- NOTE: Commented out because consultant_id column doesn't exist on user_profiles table yet
-- This will be enabled when consultant features are fully implemented
-- DROP POLICY IF EXISTS "Consultants can view client approval requests" ON approval_requests;
-- CREATE POLICY "Consultants can view client approval requests"
-- ON approval_requests FOR SELECT
-- TO authenticated
-- USING (
--   user_id IN (
--     SELECT id FROM user_profiles WHERE consultant_id = auth.uid()
--   )
-- );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get pending approvals count for a user
CREATE OR REPLACE FUNCTION get_pending_approvals_count(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO count_result
  FROM approval_requests
  WHERE user_id = target_user_id
    AND status = 'pending'
    AND expires_at > NOW();

  RETURN count_result;
END;
$$;

-- Function to mark approval as expired (called by cron)
CREATE OR REPLACE FUNCTION expire_old_approvals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE approval_requests
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  -- Log expired approvals to history
  INSERT INTO approval_history (approval_request_id, action, actor_type, details)
  SELECT id, 'expired', 'cron', jsonb_build_object('expired_at', NOW())
  FROM approval_requests
  WHERE status = 'expired'
    AND updated_at >= NOW() - INTERVAL '1 minute';

  RETURN expired_count;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE approval_requests IS 'HITL approval requests from CrewAI validation flow';
COMMENT ON TABLE approval_preferences IS 'User preferences for auto-approval rules';
COMMENT ON TABLE approval_history IS 'Audit trail of approval actions';
COMMENT ON FUNCTION get_pending_approvals_count IS 'Returns count of pending approvals for a user';
COMMENT ON FUNCTION expire_old_approvals IS 'Marks old pending approvals as expired';
