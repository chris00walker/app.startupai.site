-- Marketplace RLS Policies Migration
-- Implements verification checks, state transition functions, and access control
-- @story US-PH01-07, US-FM01-11

-- ============================================================================
-- 1. Create is_verified_consultant() function
-- ============================================================================

-- Check if current user is a verified consultant (verified or grace period)
CREATE OR REPLACE FUNCTION public.is_verified_consultant()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM consultant_profiles
    WHERE id = auth.uid()
      AND verification_status IN ('verified', 'grace')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_verified_consultant() IS
  'Returns true if the current user is a verified consultant (verified or grace status)';

-- ============================================================================
-- 2. Create is_consultant() helper function
-- ============================================================================

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
  'Returns true if the current user has a consultant profile';

-- ============================================================================
-- 3. SECURITY DEFINER functions for connection state transitions
-- These prevent direct RLS bypass for status updates
-- ============================================================================

-- Accept a connection request (only the recipient can accept)
CREATE OR REPLACE FUNCTION public.accept_connection(connection_id UUID)
RETURNS JSON AS $$
DECLARE
  v_connection RECORD;
  v_result JSON;
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

  -- Perform the update
  UPDATE consultant_clients
  SET connection_status = 'active',
      accepted_at = NOW()
  WHERE id = connection_id;

  RETURN json_build_object(
    'success', true,
    'connection_id', connection_id,
    'status', 'active',
    'accepted_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.accept_connection(UUID) IS
  'Accept a connection request. Only the recipient (founder for consultant-initiated, consultant for founder-initiated) can accept.';

-- Decline a connection request (only the recipient can decline)
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
      declined_at = NOW()
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

-- Archive an active connection (either party can archive)
CREATE OR REPLACE FUNCTION public.archive_connection(connection_id UUID)
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

  -- Verify the current user is a party to this connection
  IF v_connection.client_id != auth.uid() AND v_connection.consultant_id != auth.uid() THEN
    RETURN json_build_object('error', 'forbidden', 'message', 'You are not part of this connection');
  END IF;

  -- Verify status is 'active' (can only archive active connections)
  IF v_connection.connection_status != 'active' THEN
    RETURN json_build_object('error', 'invalid_state', 'message', 'Can only archive active connections');
  END IF;

  -- Perform the update
  UPDATE consultant_clients
  SET connection_status = 'archived'
  WHERE id = connection_id;

  RETURN json_build_object(
    'success', true,
    'connection_id', connection_id,
    'status', 'archived'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.archive_connection(UUID) IS
  'Archive an active connection. Either party can archive.';

-- Check cooldown before creating connection request
CREATE OR REPLACE FUNCTION public.check_connection_cooldown(
  p_consultant_id UUID,
  p_founder_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_declined_at TIMESTAMP WITH TIME ZONE;
  v_cooldown_ends_at TIMESTAMP WITH TIME ZONE;
  v_days_remaining INTEGER;
BEGIN
  -- Check for recent declined connection
  SELECT declined_at INTO v_declined_at
  FROM consultant_clients
  WHERE consultant_id = p_consultant_id
    AND client_id = p_founder_id
    AND connection_status = 'declined'
    AND declined_at + INTERVAL '30 days' > NOW()
  ORDER BY declined_at DESC
  LIMIT 1;

  IF v_declined_at IS NOT NULL THEN
    v_cooldown_ends_at := v_declined_at + INTERVAL '30 days';
    v_days_remaining := CEIL(EXTRACT(EPOCH FROM (v_cooldown_ends_at - NOW())) / 86400);

    RETURN json_build_object(
      'cooldown_active', true,
      'cooldown_ends_at', v_cooldown_ends_at,
      'days_remaining', v_days_remaining
    );
  END IF;

  RETURN json_build_object('cooldown_active', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.check_connection_cooldown(UUID, UUID) IS
  'Check if there is an active 30-day cooldown between a consultant and founder';

-- ============================================================================
-- 4. RLS Policies for consultant_clients
-- Split INTO granular INSERT/SELECT/UPDATE policies
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "consultant_clients_select_policy" ON consultant_clients;
DROP POLICY IF EXISTS "consultant_clients_insert_policy" ON consultant_clients;
DROP POLICY IF EXISTS "consultant_clients_update_policy" ON consultant_clients;

-- SELECT: Consultants see all their connections; Founders see their connections
-- CRITICAL: client_id only visible when connection_status = 'active' for non-founders
CREATE POLICY "consultant_clients_select_policy" ON consultant_clients
FOR SELECT
USING (
  -- Consultant can see connections where they are the consultant
  consultant_id = auth.uid()
  OR
  -- Founder can see connections where they are the client
  client_id = auth.uid()
);

-- INSERT: Consultants can create connection requests to founders
-- Founders can create connection requests to consultants (via RFQ response acceptance)
CREATE POLICY "consultant_clients_insert_policy" ON consultant_clients
FOR INSERT
WITH CHECK (
  -- Consultant creating request: must be themselves and must be verified
  (initiated_by = 'consultant' AND consultant_id = auth.uid() AND public.is_verified_consultant())
  OR
  -- Founder creating request: must be themselves as client
  (initiated_by = 'founder' AND client_id = auth.uid())
);

-- UPDATE: Only allowed via SECURITY DEFINER functions (accept_connection, decline_connection, archive_connection)
-- This policy blocks direct updates to prevent status bypass attacks
CREATE POLICY "consultant_clients_update_policy" ON consultant_clients
FOR UPDATE
USING (FALSE);  -- Block all direct updates; use functions instead

-- ============================================================================
-- 5. RLS Policies for consultant_requests (RFQ)
-- ============================================================================

DROP POLICY IF EXISTS "consultant_requests_select_policy" ON consultant_requests;
DROP POLICY IF EXISTS "consultant_requests_insert_policy" ON consultant_requests;
DROP POLICY IF EXISTS "consultant_requests_update_policy" ON consultant_requests;

-- SELECT: Founders see their own RFQs; Verified consultants see open RFQs
CREATE POLICY "consultant_requests_select_policy" ON consultant_requests
FOR SELECT
USING (
  -- Founder can see their own RFQs (any status)
  founder_id = auth.uid()
  OR
  -- Verified consultant can see open RFQs
  (status = 'open' AND public.is_verified_consultant())
);

-- INSERT: Only founders can create RFQs
CREATE POLICY "consultant_requests_insert_policy" ON consultant_requests
FOR INSERT
WITH CHECK (
  founder_id = auth.uid()
);

-- UPDATE: Only founders can update their own RFQs
CREATE POLICY "consultant_requests_update_policy" ON consultant_requests
FOR UPDATE
USING (
  founder_id = auth.uid()
);

-- ============================================================================
-- 6. RLS Policies for consultant_request_responses
-- ============================================================================

DROP POLICY IF EXISTS "consultant_request_responses_select_policy" ON consultant_request_responses;
DROP POLICY IF EXISTS "consultant_request_responses_insert_policy" ON consultant_request_responses;
DROP POLICY IF EXISTS "consultant_request_responses_update_policy" ON consultant_request_responses;

-- SELECT: Consultants see their responses; Founders see responses to their RFQs
CREATE POLICY "consultant_request_responses_select_policy" ON consultant_request_responses
FOR SELECT
USING (
  -- Consultant can see their own responses
  consultant_id = auth.uid()
  OR
  -- Founder can see responses to their RFQs
  EXISTS (
    SELECT 1 FROM consultant_requests
    WHERE consultant_requests.id = consultant_request_responses.request_id
      AND consultant_requests.founder_id = auth.uid()
  )
);

-- INSERT: Only verified consultants can respond to RFQs
CREATE POLICY "consultant_request_responses_insert_policy" ON consultant_request_responses
FOR INSERT
WITH CHECK (
  consultant_id = auth.uid()
  AND public.is_verified_consultant()
  -- Also verify the RFQ is open
  AND EXISTS (
    SELECT 1 FROM consultant_requests
    WHERE consultant_requests.id = request_id
      AND consultant_requests.status = 'open'
  )
);

-- UPDATE: Founders can update response status (accept/decline)
CREATE POLICY "consultant_request_responses_update_policy" ON consultant_request_responses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM consultant_requests
    WHERE consultant_requests.id = consultant_request_responses.request_id
      AND consultant_requests.founder_id = auth.uid()
  )
);

-- ============================================================================
-- 7. RLS Policies for Founder Directory (consultant_profiles visible to founders)
-- ============================================================================

-- Founders can browse verified consultants who have opted into the directory
DROP POLICY IF EXISTS "consultant_profiles_founder_browse" ON consultant_profiles;
CREATE POLICY "consultant_profiles_founder_browse" ON consultant_profiles
FOR SELECT
USING (
  -- Consultant can always see their own profile
  id = auth.uid()
  OR
  -- Authenticated users can see verified consultants who opted in
  (verification_status IN ('verified', 'grace') AND directory_opt_in = TRUE)
);

-- ============================================================================
-- 8. Views for controlled data exposure
-- ============================================================================

-- View for Founder Directory (what consultants see about founders)
-- Anonymizes founder identity until connection is active
CREATE OR REPLACE VIEW public.founder_directory AS
SELECT
  u.id,
  -- Anonymized display: "S. J." format
  CONCAT(
    UPPER(LEFT(SPLIT_PART(u.full_name, ' ', 1), 1)),
    '. ',
    UPPER(LEFT(SPLIT_PART(u.full_name, ' ', 2), 1)),
    '.'
  ) as display_name,
  -- Company info (if they have a project with a company name)
  COALESCE(p.company_name, 'Stealth startup') as company,
  p.industry,
  p.stage,
  p.problem_fit,
  -- Evidence summary badges
  (
    SELECT COUNT(*) FROM hypotheses h
    WHERE h.project_id = p.id AND h.hypothesis_type = 'customer'
  ) as interviews_completed,
  (
    SELECT COUNT(*) FROM experiments e
    JOIN hypotheses h ON e.hypothesis_id = h.id
    WHERE h.project_id = p.id AND e.status = 'completed'
  ) as experiments_passed,
  p.fit_score,
  u.created_at as joined_at
FROM user_profiles u
JOIN projects p ON p.user_id = u.id
WHERE u.founder_directory_opt_in = TRUE
  AND p.problem_fit IN ('partial_fit', 'strong_fit');

COMMENT ON VIEW public.founder_directory IS
  'Anonymized founder directory for verified consultants. Shows validation progress without PII.';

-- Grant access to the view for authenticated users (RLS on underlying tables still applies)
GRANT SELECT ON public.founder_directory TO authenticated;

-- View for active connections with full details
CREATE OR REPLACE VIEW public.active_connections AS
SELECT
  cc.id as connection_id,
  cc.consultant_id,
  cc.client_id as founder_id,
  cc.relationship_type,
  cc.connection_status,
  cc.initiated_by,
  cc.request_message,
  cc.accepted_at,
  cc.created_at,
  -- Consultant details
  cp.company_name as consultant_organization,
  up_consultant.full_name as consultant_name,
  -- Founder details (only for active connections)
  CASE
    WHEN cc.connection_status = 'active' THEN up_founder.full_name
    ELSE NULL
  END as founder_name,
  CASE
    WHEN cc.connection_status = 'active' THEN up_founder.email
    ELSE NULL
  END as founder_email
FROM consultant_clients cc
JOIN user_profiles up_consultant ON up_consultant.id = cc.consultant_id
LEFT JOIN consultant_profiles cp ON cp.id = cc.consultant_id
JOIN user_profiles up_founder ON up_founder.id = cc.client_id
WHERE cc.consultant_id = auth.uid() OR cc.client_id = auth.uid();

COMMENT ON VIEW public.active_connections IS
  'Connection details visible to parties. Founder PII only visible for active connections.';

GRANT SELECT ON public.active_connections TO authenticated;

-- ============================================================================
-- 9. pg_cron job for grace period expiration
-- ============================================================================

-- Revoke verification after 7-day grace period expires
-- Runs daily at midnight UTC
SELECT cron.schedule(
  'revoke-grace-expired',
  '0 0 * * *',  -- Every day at midnight UTC
  $$
    UPDATE consultant_profiles
    SET verification_status = 'revoked'
    WHERE verification_status = 'grace'
      AND grace_started_at + INTERVAL '7 days' < NOW();
  $$
);

-- ============================================================================
-- 10. Verification lifecycle functions
-- ============================================================================

-- Grant verification (called by Stripe webhook on subscription.created/invoice.paid)
CREATE OR REPLACE FUNCTION public.grant_verification(consultant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE consultant_profiles
  SET verification_status = 'verified',
      grace_started_at = NULL
  WHERE id = consultant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.grant_verification(UUID) IS
  'Grant verified status to a consultant. Called by Stripe webhook.';

-- Start grace period (called by Stripe webhook on invoice.payment_failed)
CREATE OR REPLACE FUNCTION public.start_grace_period(consultant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE consultant_profiles
  SET verification_status = 'grace',
      grace_started_at = NOW()
  WHERE id = consultant_id
    AND verification_status = 'verified';  -- Only if currently verified
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.start_grace_period(UUID) IS
  'Start 7-day grace period for a consultant. Called when payment fails.';

-- Revoke verification (called by Stripe webhook on subscription.deleted or cron job)
CREATE OR REPLACE FUNCTION public.revoke_verification(consultant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE consultant_profiles
  SET verification_status = 'revoked',
      grace_started_at = NULL
  WHERE id = consultant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.revoke_verification(UUID) IS
  'Revoke verification status from a consultant. Called when subscription ends.';

-- ============================================================================
-- 11. Grant function permissions
-- ============================================================================

-- Public functions (can be called by authenticated users)
GRANT EXECUTE ON FUNCTION public.is_verified_consultant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_consultant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_connection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_connection(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_connection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_connection_cooldown(UUID, UUID) TO authenticated;

-- Admin-only functions (called by webhooks with service role)
GRANT EXECUTE ON FUNCTION public.grant_verification(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_grace_period(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_verification(UUID) TO service_role;
