-- Migration: RFQ pending response count RPC function
-- Purpose: TASK-022 - Get pending response counts for founder RFQ list

-- Function to count PENDING responses for RFQs owned by the caller
CREATE OR REPLACE FUNCTION get_rfq_pending_counts(rfq_ids UUID[])
RETURNS TABLE (request_id UUID, pending_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    crr.request_id,
    COUNT(*)::BIGINT AS pending_count
  FROM consultant_request_responses crr
  INNER JOIN consultant_requests cr ON cr.id = crr.request_id
  WHERE crr.request_id = ANY(rfq_ids)
    AND cr.founder_id = auth.uid()  -- Ensure caller owns the RFQ
    AND crr.status = 'pending'       -- Only count pending responses
  GROUP BY crr.request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_rfq_pending_counts(UUID[]) TO authenticated;

COMMENT ON FUNCTION get_rfq_pending_counts(UUID[]) IS
  'Returns pending response counts for RFQs owned by the caller. Bypasses RLS for accurate counting.';
