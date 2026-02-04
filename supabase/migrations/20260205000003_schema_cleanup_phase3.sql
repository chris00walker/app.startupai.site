-- ============================================================================
-- Schema Cleanup Phase 3: ADR-005 Infrastructure (CRITICAL)
-- ============================================================================
-- Created: 2026-02-05
-- Purpose: Rename onboarding_sessions.version → session_version
-- Plan Reference: Schema Cleanup Migration Plan
--
-- CRITICAL: This migration MUST update both the column AND the
-- apply_onboarding_turn() RPC function atomically. The function uses
-- the version column for concurrency control (ADR-005).
--
-- References in apply_onboarding_turn():
-- - Line 73: v_session.version (version conflict check)
-- - Line 89: v_session.version (duplicate return)
-- - Line 125: v_session.version (new version calculation)
-- - Line 205: version = v_new_version (UPDATE SET)

BEGIN;

-- ============================================================================
-- 1. Rename the column
-- ============================================================================

ALTER TABLE onboarding_sessions RENAME COLUMN version TO session_version;

-- ============================================================================
-- 2. Recreate apply_onboarding_turn() with updated column references
-- ============================================================================

-- Drop old function first
DROP FUNCTION IF EXISTS apply_onboarding_turn(TEXT, TEXT, JSONB, JSONB, JSONB, INTEGER);

-- Recreate with new column name
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
    -- ========================================================================
    -- 1. Lock row for update (serialize concurrent writers)
    -- ========================================================================
    SELECT * INTO v_session
    FROM onboarding_sessions
    WHERE session_id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found: %', p_session_id;
    END IF;

    -- Verify caller owns this session (RLS bypass for service role)
    IF v_session.user_id != auth.uid() AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized: session belongs to different user';
    END IF;

    -- ========================================================================
    -- 1.5 Version conflict check (ADR-005 concurrency protection)
    -- ========================================================================
    -- UPDATED: Uses session_version instead of version
    IF p_expected_version IS NOT NULL AND v_session.session_version != p_expected_version THEN
        RETURN jsonb_build_object(
            'status', 'version_conflict',
            'current_version', v_session.session_version,
            'expected_version', p_expected_version,
            'message', 'Session has been modified. Please refresh and retry.'
        );
    END IF;

    -- ========================================================================
    -- 2. Idempotency check: has this message already been processed?
    -- ========================================================================
    IF v_session.stage_data ? p_message_id THEN
        -- Return existing state without modification
        -- UPDATED: Uses session_version instead of version
        RETURN jsonb_build_object(
            'status', 'duplicate',
            'version', v_session.session_version,
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
    v_new_history := COALESCE(v_session.conversation_history, '[]'::jsonb)
                     || jsonb_build_array(
                         p_user_message || jsonb_build_object('stage', v_session.current_stage)
                     );

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
    -- UPDATED: Uses session_version instead of version
    v_new_version := COALESCE(v_session.session_version, 0) + 1;

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

    -- ========================================================================
    -- 6. Check stage advancement from assessment
    -- ========================================================================
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

    -- ========================================================================
    -- 7. Atomic update
    -- ========================================================================
    -- UPDATED: Uses session_version instead of version
    UPDATE onboarding_sessions
    SET conversation_history = v_new_history,
        stage_data = v_new_stage_data,
        current_stage = v_new_stage,
        overall_progress = v_new_progress,
        stage_progress = v_new_stage_progress,
        session_version = v_new_version,
        status = CASE WHEN v_completed THEN 'completed' ELSE status END,
        completed_at = CASE WHEN v_completed THEN NOW() ELSE completed_at END,
        last_activity = NOW()
    WHERE session_id = p_session_id;

    -- ========================================================================
    -- 8. Return result for frontend
    -- ========================================================================
    -- Note: Response still uses 'version' key for backward compatibility
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

COMMENT ON FUNCTION apply_onboarding_turn IS 'Atomic state machine transition for onboarding with row-level locking, idempotency, and version conflict detection (ADR-005). Uses session_version column.';

-- ============================================================================
-- 3. Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION apply_onboarding_turn TO authenticated;
GRANT EXECUTE ON FUNCTION apply_onboarding_turn TO service_role;

-- ============================================================================
-- 4. Verify changes
-- ============================================================================

DO $$
BEGIN
  -- Verify column rename
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'onboarding_sessions'
    AND column_name = 'session_version'
  ) THEN
    RAISE EXCEPTION 'Migration failed: onboarding_sessions.session_version not found';
  END IF;

  -- Verify old column is gone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'onboarding_sessions'
    AND column_name = 'version'
  ) THEN
    RAISE EXCEPTION 'Migration failed: old column onboarding_sessions.version still exists';
  END IF;

  -- Verify function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'apply_onboarding_turn'
  ) THEN
    RAISE EXCEPTION 'Migration failed: apply_onboarding_turn function not found';
  END IF;

  RAISE NOTICE 'Phase 3 (ADR-005) migration completed successfully';
END $$;

COMMIT;
