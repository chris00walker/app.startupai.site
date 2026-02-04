-- ============================================================================
-- Schema Cleanup Phase 3: ROLLBACK (ADR-005)
-- ============================================================================
-- Use this script to rollback Phase 3 changes if issues occur
-- Run manually: psql -f 20260205000003_schema_cleanup_phase3_rollback.sql
--
-- CRITICAL: This rollback MUST restore both the column AND the function atomically

BEGIN;

-- ============================================================================
-- 1. Rename column back
-- ============================================================================

ALTER TABLE onboarding_sessions RENAME COLUMN session_version TO version;

-- ============================================================================
-- 2. Restore original apply_onboarding_turn() function
-- ============================================================================

DROP FUNCTION IF EXISTS apply_onboarding_turn(TEXT, TEXT, JSONB, JSONB, JSONB, INTEGER);

CREATE OR REPLACE FUNCTION apply_onboarding_turn(
    p_session_id TEXT,
    p_message_id TEXT,
    p_user_message JSONB,
    p_assistant_message JSONB,
    p_assessment JSONB DEFAULT NULL,
    p_expected_version INTEGER DEFAULT NULL
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
    SELECT * INTO v_session
    FROM onboarding_sessions
    WHERE session_id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found: %', p_session_id;
    END IF;

    IF v_session.user_id != auth.uid() AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: session belongs to different user';
    END IF;

    IF p_expected_version IS NOT NULL AND v_session.version != p_expected_version THEN
        RETURN jsonb_build_object(
            'status', 'version_conflict',
            'current_version', v_session.version,
            'expected_version', p_expected_version,
            'message', 'Session has been modified. Please refresh and retry.'
        );
    END IF;

    IF v_session.stage_data ? p_message_id THEN
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

    v_new_history := COALESCE(v_session.conversation_history, '[]'::jsonb)
                     || jsonb_build_array(
                         p_user_message || jsonb_build_object('stage', v_session.current_stage)
                     );

    v_new_history := v_new_history
                     || jsonb_build_array(
                         p_assistant_message || jsonb_build_object('stage', v_session.current_stage)
                     );

    v_brief := COALESCE(v_session.stage_data->'brief', '{}'::jsonb);

    IF p_assessment IS NOT NULL AND p_assessment ? 'extractedData' THEN
        v_brief := jsonb_deep_merge(v_brief, p_assessment->'extractedData');
    END IF;

    v_new_version := COALESCE(v_session.version, 0) + 1;

    v_new_stage_data := COALESCE(v_session.stage_data, '{}'::jsonb)
        || jsonb_build_object('brief', v_brief)
        || jsonb_build_object('version', v_new_version)
        || jsonb_build_object(p_message_id, jsonb_build_object(
             'timestamp', NOW()::text,
             'stage', v_session.current_stage
           ));

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

    v_new_stage := v_session.current_stage;
    v_new_stage_progress := COALESCE((p_assessment->>'stageProgress')::integer, v_session.stage_progress);
    v_new_progress := v_session.overall_progress;

    IF p_assessment IS NOT NULL THEN
        IF (p_assessment->>'shouldAdvance')::boolean = true
           AND v_session.current_stage < 7 THEN
            v_new_stage := v_session.current_stage + 1;
            v_stage_advanced := true;
            v_new_stage_progress := 0;
            v_new_progress := ((v_new_stage - 1) * 100) / 7;

            v_new_stage_data := v_new_stage_data
                || jsonb_build_object(
                    'stage_' || v_session.current_stage || '_summary',
                    'Completed with ' || ROUND(COALESCE((p_assessment->>'coverage')::numeric, 0) * 100) || '% coverage'
                );
        ELSE
            v_new_progress := COALESCE((p_assessment->>'overallProgress')::integer, v_session.overall_progress);
        END IF;

        IF (p_assessment->>'isComplete')::boolean = true THEN
            v_completed := true;
            v_new_progress := 100;

            v_new_stage_data := v_new_stage_data
                || jsonb_build_object('completion', jsonb_build_object(
                    'completedAt', NOW()::text,
                    'keyInsights', COALESCE(p_assessment->'keyInsights', '[]'::jsonb),
                    'recommendedNextSteps', COALESCE(p_assessment->'recommendedNextSteps', '[]'::jsonb),
                    'readinessScore', COALESCE((p_assessment->>'coverage')::numeric, 0)
                ));
        END IF;
    END IF;

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

GRANT EXECUTE ON FUNCTION apply_onboarding_turn TO authenticated;
GRANT EXECUTE ON FUNCTION apply_onboarding_turn TO service_role;

COMMIT;
