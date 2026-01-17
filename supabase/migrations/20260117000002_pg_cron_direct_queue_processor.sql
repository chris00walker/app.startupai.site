-- ============================================================================
-- Direct Queue Processor for pg_cron (no HTTP/Edge Function needed)
-- ============================================================================
-- Created: 2026-01-17
-- Purpose: Process Stage 7 completions directly from PostgreSQL
-- Reference: ADR-005 Split API Architecture
--
-- This approach processes the queue directly in PostgreSQL, which is more
-- efficient than calling an Edge Function. The Edge Function remains available
-- for manual invocation or external triggers.
--
-- The Modal kickoff is handled via pg_net HTTP call directly from the database.
-- ============================================================================

-- Create a function that processes one pending completion
CREATE OR REPLACE FUNCTION process_one_pending_completion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item RECORD;
    v_brief_data jsonb;
    v_project_id uuid;
    v_request_id bigint;
    v_modal_url text := 'https://chris00walker--startupai-validation-fastapi-app.modal.run/kickoff';
BEGIN
    -- ========================================================================
    -- 1. Claim a pending item (atomic with SKIP LOCKED)
    -- ========================================================================
    SELECT * INTO v_item
    FROM pending_completions
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'empty', 'message', 'No pending completions');
    END IF;

    -- Mark as processing
    UPDATE pending_completions
    SET status = 'processing',
        claimed_at = NOW(),
        attempts = attempts + 1
    WHERE id = v_item.id;

    -- ========================================================================
    -- 2. Extract brief data
    -- ========================================================================
    v_brief_data := jsonb_build_object(
        'customer_segments', COALESCE(v_item.stage_data->'brief'->'target_customers', '[]'::jsonb),
        'problem_description', COALESCE(v_item.stage_data->'brief'->>'problem_description', v_item.stage_data->'brief'->>'problem'),
        'solution_description', COALESCE(v_item.stage_data->'brief'->>'solution_description', v_item.stage_data->'brief'->>'solution'),
        'unique_value_proposition', COALESCE(v_item.stage_data->'brief'->>'unique_value_prop', v_item.stage_data->'brief'->>'differentiation'),
        'business_stage', COALESCE(v_item.stage_data->'brief'->>'current_stage', 'idea')
    );

    -- ========================================================================
    -- 3. Create project from session (if RPC exists)
    -- ========================================================================
    BEGIN
        SELECT create_project_from_onboarding INTO v_project_id
        FROM create_project_from_onboarding(v_item.session_id);
    EXCEPTION WHEN undefined_function THEN
        -- Function doesn't exist yet, generate a UUID
        v_project_id := gen_random_uuid();
    END;

    -- ========================================================================
    -- 4. Call Modal /kickoff via pg_net (async HTTP)
    -- ========================================================================
    SELECT net.http_post(
        url := v_modal_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
            'project_id', v_project_id::text,
            'user_id', v_item.user_id::text,
            'session_id', v_item.session_id,
            'entrepreneur_input', jsonb_build_object(
                'raw_transcript', v_item.conversation_history::text
            ) || v_brief_data
        )
    ) INTO v_request_id;

    -- ========================================================================
    -- 5. Mark as completed (Modal call is async, we trust pg_net)
    -- ========================================================================
    UPDATE pending_completions
    SET status = 'completed',
        completed_at = NOW(),
        project_id = v_project_id,
        workflow_id = 'pending-' || v_request_id::text  -- Will be updated by webhook
    WHERE id = v_item.id;

    -- Update onboarding session
    UPDATE onboarding_sessions
    SET stage_data = stage_data || jsonb_build_object(
        'completion', jsonb_build_object(
            'projectId', v_project_id,
            'queueProcessedAt', NOW()::text,
            'pgNetRequestId', v_request_id
        )
    )
    WHERE session_id = v_item.session_id;

    RETURN jsonb_build_object(
        'status', 'processed',
        'session_id', v_item.session_id,
        'project_id', v_project_id,
        'pg_net_request_id', v_request_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Handle failure - increment attempts or move to dead_letter
    IF v_item.id IS NOT NULL THEN
        IF v_item.attempts >= 9 THEN  -- This was attempt 10
            UPDATE pending_completions
            SET status = 'dead_letter',
                error_message = SQLERRM
            WHERE id = v_item.id;
        ELSE
            UPDATE pending_completions
            SET status = 'pending',
                claimed_at = NULL,
                error_message = SQLERRM
            WHERE id = v_item.id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'status', 'error',
        'error', SQLERRM
    );
END;
$$;

-- ========================================================================
-- Schedule the direct processor (only on Supabase Cloud where pg_cron is available)
-- ========================================================================
DO $$
BEGIN
    -- Only schedule if cron schema exists (Supabase Cloud)
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
        PERFORM cron.schedule(
            'process-completions-direct',
            '* * * * *',  -- every minute
            $CRON$SELECT process_one_pending_completion();$CRON$
        );
        RAISE NOTICE 'Scheduled process-completions-direct cron job';
    ELSE
        RAISE NOTICE 'pg_cron not available - skipping cron job (use manual processing for local dev)';
    END IF;
END $$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_one_pending_completion TO service_role;

COMMENT ON FUNCTION process_one_pending_completion IS 'Processes one pending Stage 7 completion directly from pg_cron - no Edge Function needed (Cloud only, use manual processing locally)';
