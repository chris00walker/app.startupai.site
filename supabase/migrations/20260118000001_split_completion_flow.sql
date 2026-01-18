-- ============================================================================
-- Split Completion Flow for SummaryModal Approve/Revise
-- ============================================================================
--
-- Problem: complete_onboarding_with_kickoff() inserts queue row immediately,
--          preventing the Revise flow from working correctly.
--
-- Solution: Two new RPCs:
--   1. queue_onboarding_for_kickoff() - Insert queue row (Approve click)
--   2. reset_session_for_revision() - Cancel queue, reset session (Revise click)
--
-- Related: precious-kindling-balloon.md, ADR-004, ADR-005
-- Plan: prancy-tickling-quokka.md
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RPC: queue_onboarding_for_kickoff
-- Called when user clicks "Approve" in SummaryModal
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION queue_onboarding_for_kickoff(
    p_session_id VARCHAR(255),
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
BEGIN
    -- Lock and fetch session
    SELECT * INTO v_session
    FROM onboarding_sessions
    WHERE session_id = p_session_id
    FOR UPDATE;

    IF v_session IS NULL THEN
        RETURN jsonb_build_object('status', 'not_found', 'error', 'Session not found');
    END IF;

    -- Verify ownership
    IF v_session.user_id != p_user_id THEN
        RETURN jsonb_build_object('status', 'unauthorized', 'error', 'Session ownership mismatch');
    END IF;

    -- Session must be completed (Stage 7 finished)
    IF v_session.status != 'completed' THEN
        RETURN jsonb_build_object(
            'status', 'invalid_state',
            'error', 'Session must be completed before queueing',
            'current_status', v_session.status
        );
    END IF;

    -- Check if already queued
    IF EXISTS (SELECT 1 FROM pending_completions WHERE session_id = p_session_id) THEN
        -- Already queued - return current state
        RETURN jsonb_build_object('status', 'already_queued');
    END IF;

    -- Insert queue row (user has approved)
    INSERT INTO pending_completions (
        session_id,
        user_id,
        conversation_history,
        stage_data,
        status,
        created_at
    ) VALUES (
        p_session_id,
        p_user_id,
        v_session.conversation_history,
        v_session.stage_data,
        'pending',
        NOW()
    );

    RETURN jsonb_build_object('status', 'queued');
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC: reset_session_for_revision
-- Called when user clicks "Revise" in SummaryModal
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reset_session_for_revision(
    p_session_id VARCHAR(255),
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_queue_deleted BOOLEAN := false;
BEGIN
    -- Lock and fetch session
    SELECT * INTO v_session
    FROM onboarding_sessions
    WHERE session_id = p_session_id
    FOR UPDATE;

    IF v_session IS NULL THEN
        RETURN jsonb_build_object('status', 'not_found', 'error', 'Session not found');
    END IF;

    -- Verify ownership
    IF v_session.user_id != p_user_id THEN
        RETURN jsonb_build_object('status', 'unauthorized', 'error', 'Session ownership mismatch');
    END IF;

    -- Delete any pending queue row (if user approved then changed mind)
    -- Only delete if status is 'pending' (not yet processing)
    DELETE FROM pending_completions
    WHERE session_id = p_session_id
      AND status = 'pending';

    IF FOUND THEN
        v_queue_deleted := true;
    END IF;

    -- Check if already processing - cannot revise
    IF EXISTS (
        SELECT 1 FROM pending_completions
        WHERE session_id = p_session_id
          AND status IN ('processing', 'completed')
    ) THEN
        RETURN jsonb_build_object(
            'status', 'cannot_revise',
            'error', 'Analysis already in progress or completed',
            'queue_deleted', false
        );
    END IF;

    -- Reset session to active state
    UPDATE onboarding_sessions
    SET status = 'active',
        overall_progress = 95,  -- High progress, still near completion
        completed_at = NULL,
        last_activity = NOW()
    WHERE session_id = p_session_id;

    RETURN jsonb_build_object(
        'status', 'reset',
        'queue_deleted', v_queue_deleted
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION queue_onboarding_for_kickoff(VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_session_for_revision(VARCHAR, UUID) TO authenticated;
