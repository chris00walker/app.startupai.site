-- Migration: RFQ response count RPC function
-- Purpose: TASK-011 - Ensure accurate RFQ response counts for founders

-- Function to count responses for RFQs owned by the caller
CREATE OR REPLACE FUNCTION get_rfq_response_counts(rfq_ids UUID[])
RETURNS TABLE (request_id UUID, response_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    crr.request_id,
    COUNT(*)::BIGINT AS response_count
  FROM consultant_request_responses crr
  INNER JOIN consultant_requests cr ON cr.id = crr.request_id
  WHERE crr.request_id = ANY(rfq_ids)
    AND cr.founder_id = auth.uid()  -- Ensure caller owns the RFQ
  GROUP BY crr.request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_rfq_response_counts(UUID[]) TO authenticated;

COMMENT ON FUNCTION get_rfq_response_counts(UUID[]) IS
  'Returns response counts for RFQs owned by the caller. Bypasses RLS for accurate counting.';
