-- ============================================================================
-- Pending Completions Queue Table and RPCs
-- ============================================================================
-- Created: 2026-01-16
-- Purpose: Implement ADR-005's Stage 7 queue mechanism for guaranteed delivery
-- Reference: startupai-crew/docs/adr/005-state-first-synchronized-loop.md
-- Plan: ~/.claude/plans/shiny-growing-sprout.md

-- ============================================================================
-- 1. Create pending_completions Queue Table
-- ============================================================================
-- This table acts as a transactional outbox for Stage 7 completions.
-- The queue pattern ensures CrewAI kickoff succeeds even if /save times out.

CREATE TABLE IF NOT EXISTS pending_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    conversation_history JSONB NOT NULL,
    stage_data JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt TIMESTAMP WITH TIME ZONE,
    workflow_id VARCHAR(255),
    project_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    -- Idempotency: One queue item per session
    CONSTRAINT pending_completions_session_id_unique UNIQUE (session_id),

    -- Status enum check
    CONSTRAINT pending_completions_status_check CHECK (
        status IN ('pending', 'processing', 'completed', 'dead_letter')
    ),

    -- Foreign key to onboarding_sessions
    CONSTRAINT fk_pending_completions_session
        FOREIGN KEY (session_id)
        REFERENCES onboarding_sessions(session_id)
        ON DELETE CASCADE,

    -- Foreign key to auth.users
    CONSTRAINT fk_pending_completions_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Indexes for queue operations
CREATE INDEX IF NOT EXISTS idx_pending_completions_status
    ON pending_completions(status);

CREATE INDEX IF NOT EXISTS idx_pending_completions_status_attempts
    ON pending_completions(status, last_attempt, attempts);

CREATE INDEX IF NOT EXISTS idx_pending_completions_user
    ON pending_completions(user_id);

COMMENT ON TABLE pending_completions IS 'Queue for Stage 7 onboarding completions - ensures CrewAI kickoff succeeds (ADR-005)';
COMMENT ON COLUMN pending_completions.status IS 'pending=ready to process, processing=claimed by worker, completed=done, dead_letter=failed after max retries';
COMMENT ON COLUMN pending_completions.attempts IS 'Number of processing attempts (max 10 before dead_letter)';

-- ============================================================================
-- 2. complete_onboarding_with_kickoff RPC
-- ============================================================================
-- Atomically marks session as completed AND inserts queue row.
-- Both succeed or both rollback - no orphaned states possible.

CREATE OR REPLACE FUNCTION complete_onboarding_with_kickoff(
    p_session_id TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_session RECORD;
BEGIN
    -- ========================================================================
    -- 1. Lock and fetch session
    -- ========================================================================
    SELECT * INTO v_session
    FROM onboarding_sessions
    WHERE session_id = p_session_id
    FOR UPDATE;

    IF v_session IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'not_found',
            'error', 'Session not found'
        );
    END IF;

    -- Verify ownership
    IF v_session.user_id != p_user_id THEN
        RETURN jsonb_build_object(
            'status', 'unauthorized',
            'error', 'Session belongs to different user'
        );
    END IF;

    -- ========================================================================
    -- 2. Handle already completed sessions (recovery case)
    -- ========================================================================
    IF v_session.status = 'completed' THEN
        -- Check if queue row exists
        IF NOT EXISTS (
            SELECT 1 FROM pending_completions
            WHERE session_id = p_session_id
        ) THEN
            -- Missing queue row - re-insert for recovery
            INSERT INTO pending_completions (
                session_id,
                user_id,
                conversation_history,
                stage_data,
                status
            )
            VALUES (
                p_session_id,
                p_user_id,
                COALESCE(v_session.conversation_history, '[]'::jsonb),
                COALESCE(v_session.stage_data, '{}'::jsonb),
                'pending'
            );

            RETURN jsonb_build_object(
                'status', 'requeued',
                'message', 'Session was completed but missing queue entry - requeued'
            );
        END IF;

        -- Already completed with queue row
        RETURN jsonb_build_object(
            'status', 'already_completed',
            'message', 'Session already completed'
        );
    END IF;

    -- ========================================================================
    -- 3. ATOMIC: Mark complete AND insert queue row
    -- ========================================================================
    UPDATE onboarding_sessions
    SET status = 'completed',
        completed_at = NOW(),
        last_activity = NOW()
    WHERE session_id = p_session_id;

    INSERT INTO pending_completions (
        session_id,
        user_id,
        conversation_history,
        stage_data,
        status
    )
    VALUES (
        p_session_id,
        p_user_id,
        COALESCE(v_session.conversation_history, '[]'::jsonb),
        COALESCE(v_session.stage_data, '{}'::jsonb),
        'pending'
    )
    ON CONFLICT (session_id) DO NOTHING;  -- Idempotent

    RETURN jsonb_build_object(
        'status', 'queued',
        'message', 'Onboarding completed and queued for processing'
    );
END;
$$;

COMMENT ON FUNCTION complete_onboarding_with_kickoff IS 'Atomically marks onboarding complete and queues for CrewAI kickoff (ADR-005)';

-- ============================================================================
-- 3. claim_pending_completion RPC
-- ============================================================================
-- Safe work claiming with FOR UPDATE SKIP LOCKED pattern.
-- Handles both pending items and lease timeout recovery.

CREATE OR REPLACE FUNCTION claim_pending_completion()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- ========================================================================
    -- Claim a single pending OR stale processing item atomically
    -- ========================================================================
    -- Priority:
    -- 1. Pending items ready for retry (with exponential backoff)
    -- 2. Processing items stuck > 5 minutes (worker crashed / lease timeout)

    WITH claimed AS (
        SELECT id
        FROM pending_completions
        WHERE (
            -- Pending items ready for retry (exponential backoff)
            (
                status = 'pending'
                AND (
                    last_attempt IS NULL
                    OR last_attempt < NOW() - (INTERVAL '1 minute' * POWER(2, LEAST(attempts, 9)))
                )
            )
            OR
            -- LEASE TIMEOUT: Processing items stuck > 5 minutes (worker crashed)
            (
                status = 'processing'
                AND last_attempt < NOW() - INTERVAL '5 minutes'
            )
        )
        ORDER BY
            -- Prioritize items that haven't been attempted yet
            CASE WHEN last_attempt IS NULL THEN 0 ELSE 1 END,
            created_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    UPDATE pending_completions pc
    SET
        status = 'processing',
        last_attempt = NOW(),
        attempts = CASE
            -- Crashed worker recovery: count as retry
            WHEN pc.status = 'processing' THEN pc.attempts + 1
            ELSE pc.attempts
        END
    FROM claimed
    WHERE pc.id = claimed.id
    RETURNING pc.* INTO v_item;

    IF v_item IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'empty',
            'message', 'No pending completions to process'
        );
    END IF;

    RETURN jsonb_build_object(
        'status', 'claimed',
        'item', jsonb_build_object(
            'id', v_item.id,
            'session_id', v_item.session_id,
            'user_id', v_item.user_id,
            'conversation_history', v_item.conversation_history,
            'stage_data', v_item.stage_data,
            'attempts', v_item.attempts,
            'created_at', v_item.created_at
        )
    );
END;
$$;

COMMENT ON FUNCTION claim_pending_completion IS 'Safely claims a pending completion for processing with SKIP LOCKED (ADR-005)';

-- ============================================================================
-- 4. complete_pending_completion RPC
-- ============================================================================
-- Marks a claimed item as completed with workflow/project info.

CREATE OR REPLACE FUNCTION complete_pending_completion(
    p_id UUID,
    p_workflow_id TEXT,
    p_project_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE pending_completions
    SET
        status = 'completed',
        workflow_id = p_workflow_id,
        project_id = p_project_id,
        completed_at = NOW()
    WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'not_found',
            'error', 'Pending completion not found'
        );
    END IF;

    RETURN jsonb_build_object(
        'status', 'completed',
        'message', 'Successfully marked as completed'
    );
END;
$$;

COMMENT ON FUNCTION complete_pending_completion IS 'Marks a pending completion as successfully processed (ADR-005)';

-- ============================================================================
-- 5. fail_pending_completion RPC
-- ============================================================================
-- Handles failure: retry or dead_letter based on attempt count.

CREATE OR REPLACE FUNCTION fail_pending_completion(
    p_id UUID,
    p_error_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item RECORD;
    v_new_status TEXT;
BEGIN
    SELECT * INTO v_item
    FROM pending_completions
    WHERE id = p_id;

    IF v_item IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'not_found',
            'error', 'Pending completion not found'
        );
    END IF;

    -- Increment attempts and determine new status
    IF v_item.attempts >= 9 THEN  -- 10th attempt just failed
        v_new_status := 'dead_letter';
    ELSE
        v_new_status := 'pending';  -- Will be retried after backoff
    END IF;

    UPDATE pending_completions
    SET
        status = v_new_status,
        attempts = attempts + 1,
        error_message = p_error_message
    WHERE id = p_id;

    RETURN jsonb_build_object(
        'status', v_new_status,
        'attempts', v_item.attempts + 1,
        'message', CASE
            WHEN v_new_status = 'dead_letter'
            THEN 'Max retries exceeded - moved to dead_letter'
            ELSE 'Will retry after backoff'
        END
    );
END;
$$;

COMMENT ON FUNCTION fail_pending_completion IS 'Handles processing failure with retry or dead_letter transition (ADR-005)';

-- ============================================================================
-- 6. Grant Permissions
-- ============================================================================

-- Allow authenticated users to view their own queue items
ALTER TABLE pending_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending completions"
    ON pending_completions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- RPCs are SECURITY DEFINER, so they bypass RLS
GRANT EXECUTE ON FUNCTION complete_onboarding_with_kickoff TO authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding_with_kickoff TO service_role;

GRANT EXECUTE ON FUNCTION claim_pending_completion TO service_role;
GRANT EXECUTE ON FUNCTION complete_pending_completion TO service_role;
GRANT EXECUTE ON FUNCTION fail_pending_completion TO service_role;

-- ============================================================================
-- 7. Migration Complete
-- ============================================================================
