-- ============================================================================
-- Add expected_version parameter to apply_onboarding_turn
-- ============================================================================
-- Created: 2026-01-16
-- Purpose: Implement ADR-005 concurrency protection (version conflict detection)
-- Reference: startupai-crew/docs/adr/005-state-first-synchronized-loop.md
-- Plan: ~/.claude/plans/shiny-growing-sprout.md (PR 7)

-- ============================================================================
-- Problem: Out-of-order saves from concurrent tabs
-- ============================================================================
-- FOR UPDATE alone prevents concurrent writes but NOT out-of-order saves:
--
-- Tab A: message 1 at t=0, arrives at t=5 (slow network)
-- Tab B: message 2 at t=1, arrives at t=2 (fast network)
--
-- Without version check:
-- - Tab B saves first (version 2)
-- - Tab A saves second (overwrites with version 3, but message 1 is older!)
--
-- Solution: expected_version parameter that, when provided, rejects saves
-- if version mismatch. Returns 'version_conflict' for client to handle.

-- Drop old function signature first (required for adding new parameter)
DROP FUNCTION IF EXISTS apply_onboarding_turn(TEXT, TEXT, JSONB, JSONB, JSONB);

-- Recreate with new expected_version parameter
CREATE OR REPLACE FUNCTION apply_onboarding_turn(
    p_session_id TEXT,
    p_message_id TEXT,
    p_user_message JSONB,
    p_assistant_message JSONB,
    p_assessment JSONB DEFAULT NULL,
    p_expected_version INTEGER DEFAULT NULL  -- NEW: Optional version check
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_session RECORD;
    v_new_history JSONB;
    v_new_stage_data JSONB;
    v_new_stage INTEGER;
    v_new_progress INTEGER;
    v_new_stage_progress INTEGER;
    v_new_version INTEGER;
    v_brief JSONB;
    v_stage_advanced BOOLEAN := false;
    v_completed BOOLEAN := false;
BEGIN
    -- ========================================================================
    -- 1. Lock row for update (serialize concurrent writers)
    -- ========================================================================
    SELECT * INTO v_session
    FROM onboarding_sessions
    WHERE session_id = p_session_id
    FOR UPDATE;  -- Row-level lock prevents race conditions

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found: %', p_session_id;
    END IF;

    -- Verify caller owns this session (RLS bypass for service role)
    IF v_session.user_id != auth.uid() AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: session belongs to different user';
    END IF;

    -- ========================================================================
    -- 1.5 NEW: Version conflict check (ADR-005 concurrency protection)
    -- ========================================================================
    IF p_expected_version IS NOT NULL AND v_session.version != p_expected_version THEN
        RETURN jsonb_build_object(
            'status', 'version_conflict',
            'current_version', v_session.version,
            'expected_version', p_expected_version,
            'message', 'Session has been modified. Please refresh and retry.'
        );
    END IF;

    -- ========================================================================
    -- 2. Idempotency check: has this message already been processed?
    -- ========================================================================
    IF v_session.stage_data ? p_message_id THEN
        -- Return existing state without modification
        RETURN jsonb_build_object(
            'status', 'duplicate',
            'version', v_session.version,
            'current_stage', v_session.current_stage,
            'overall_progress', v_session.overall_progress,
            'stage_progress', v_session.stage_progress,
            'stage_advanced', false,
            'completed', v_session.status = 'completed'
        );
    END IF;

    -- ========================================================================
    -- 3. Append messages to conversation_history
    -- ========================================================================
    -- Add user message with stage tag
    v_new_history := COALESCE(v_session.conversation_history, '[]'::jsonb)
                     || jsonb_build_array(
                         p_user_message || jsonb_build_object('stage', v_session.current_stage)
                     );

    -- Add assistant message with stage tag
    v_new_history := v_new_history
                     || jsonb_build_array(
                         p_assistant_message || jsonb_build_object('stage', v_session.current_stage)
                     );

    -- ========================================================================
    -- 4. Deep-merge extracted data into stage_data.brief
    -- ========================================================================
    v_brief := COALESCE(v_session.stage_data->'brief', '{}'::jsonb);

    IF p_assessment IS NOT NULL AND p_assessment ? 'extractedData' THEN
        v_brief := jsonb_deep_merge(v_brief, p_assessment->'extractedData');
    END IF;

    -- ========================================================================
    -- 5. Build new stage_data with idempotency marker
    -- ========================================================================
    v_new_version := COALESCE(v_session.version, 0) + 1;

    v_new_stage_data := COALESCE(v_session.stage_data, '{}'::jsonb)
        || jsonb_build_object('brief', v_brief)
        || jsonb_build_object('version', v_new_version)
        || jsonb_build_object(p_message_id, jsonb_build_object(
             'timestamp', NOW()::text,
             'stage', v_session.current_stage
           ));

    -- Store quality assessment if provided
    IF p_assessment IS NOT NULL THEN
        v_new_stage_data := v_new_stage_data
            || jsonb_build_object(
                'stage_' || v_session.current_stage || '_quality',
                jsonb_build_object(
                    'coverage', COALESCE((p_assessment->>'coverage')::numeric, 0),
                    'clarity', p_assessment->>'clarity',
                    'completeness', p_assessment->>'completeness',
                    'timestamp', NOW()::text
                )
            );
    END IF;

    -- ========================================================================
    -- 6. Check stage advancement from assessment
    -- ========================================================================
    v_new_stage := v_session.current_stage;
    v_new_stage_progress := COALESCE((p_assessment->>'stageProgress')::integer, v_session.stage_progress);
    v_new_progress := v_session.overall_progress;

    IF p_assessment IS NOT NULL THEN
        -- Check if assessment indicates stage should advance
        IF (p_assessment->>'shouldAdvance')::boolean = true
           AND v_session.current_stage < 7 THEN
            v_new_stage := v_session.current_stage + 1;
            v_stage_advanced := true;

            -- Reset stage progress after advancement (new stage starts at 0%)
            v_new_stage_progress := 0;

            -- Calculate new overall progress based on completed stages
            v_new_progress := ((v_new_stage - 1) * 100) / 7;

            -- Record stage completion summary
            v_new_stage_data := v_new_stage_data
                || jsonb_build_object(
                    'stage_' || v_session.current_stage || '_summary',
                    'Completed with ' || ROUND(COALESCE((p_assessment->>'coverage')::numeric, 0) * 100) || '% coverage'
                );
        ELSE
            -- Update progress from assessment
            v_new_progress := COALESCE((p_assessment->>'overallProgress')::integer, v_session.overall_progress);
        END IF;

        -- Check for onboarding completion (Stage 7 complete)
        IF (p_assessment->>'isComplete')::boolean = true THEN
            v_completed := true;
            v_new_progress := 100;

            -- Store completion data
            v_new_stage_data := v_new_stage_data
                || jsonb_build_object('completion', jsonb_build_object(
                    'completedAt', NOW()::text,
                    'keyInsights', COALESCE(p_assessment->'keyInsights', '[]'::jsonb),
                    'recommendedNextSteps', COALESCE(p_assessment->'recommendedNextSteps', '[]'::jsonb),
                    'readinessScore', COALESCE((p_assessment->>'coverage')::numeric, 0)
                ));
        END IF;
    END IF;

    -- ========================================================================
    -- 7. Atomic update
    -- ========================================================================
    UPDATE onboarding_sessions
    SET conversation_history = v_new_history,
        stage_data = v_new_stage_data,
        current_stage = v_new_stage,
        overall_progress = v_new_progress,
        stage_progress = v_new_stage_progress,
        version = v_new_version,
        status = CASE WHEN v_completed THEN 'completed' ELSE status END,
        completed_at = CASE WHEN v_completed THEN NOW() ELSE completed_at END,
        last_activity = NOW()
    WHERE session_id = p_session_id;

    -- ========================================================================
    -- 8. Return result for frontend
    -- ========================================================================
    RETURN jsonb_build_object(
        'status', 'committed',
        'version', v_new_version,
        'current_stage', v_new_stage,
        'overall_progress', v_new_progress,
        'stage_progress', v_new_stage_progress,
        'stage_advanced', v_stage_advanced,
        'completed', v_completed
    );
END;
$$;

COMMENT ON FUNCTION apply_onboarding_turn IS 'Atomic state machine transition for onboarding with row-level locking, idempotency, and version conflict detection (ADR-005)';

-- ============================================================================
-- Grant Permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION apply_onboarding_turn TO authenticated;
GRANT EXECUTE ON FUNCTION apply_onboarding_turn TO service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================
