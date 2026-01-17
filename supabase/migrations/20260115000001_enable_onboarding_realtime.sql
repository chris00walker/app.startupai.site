-- ============================================================================
-- Enable Realtime for Onboarding Sessions
-- ============================================================================
-- Created: 2026-01-15
-- Purpose: Add onboarding_sessions to Realtime publication for WebSocket updates
-- Issue: UI was not receiving real-time progress updates during onboarding
-- Plan: /home/chris/.claude/plans/snappy-hugging-lollipop.md

-- Enable Realtime for onboarding_sessions (scalar columns only)
-- This allows the frontend to subscribe to UPDATE events via WebSocket
-- and display progress changes instantly without polling delays.

-- Check if table is already in publication (idempotent)
DO $$
BEGIN
    -- Remove table from publication if it exists (to re-add with column filter)
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE onboarding_sessions;
    EXCEPTION
        WHEN undefined_table THEN NULL;
        WHEN object_not_in_prerequisite_state THEN NULL;
        WHEN undefined_object THEN NULL; -- Catch "not part of publication" error
        WHEN OTHERS THEN
            -- If error is "not part of publication", continue
            IF SQLERRM LIKE '%not part of the publication%' THEN
                NULL;
            ELSE
                RAISE;
            END IF;
    END;

    -- Add table with filtered columns (excludes large JSONB for performance)
    ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_sessions (
        id,
        session_id,
        user_id,
        status,
        current_stage,
        stage_progress,
        overall_progress,
        last_activity,
        completed_at
    );
END $$;

-- ============================================================================
-- Excluded Columns (Not in Realtime publication):
-- ============================================================================
-- These JSONB columns are excluded to reduce WebSocket payload size:
-- - conversation_history: Large array of message objects
-- - stage_data: Collected form data per stage
-- - ai_context: AI agent state and context
-- - user_context: User profile and preferences
-- - response_quality_scores: Quality metrics per response
-- - user_feedback: User satisfaction data
--
-- The frontend can fetch these via REST API when needed, but doesn't need
-- real-time updates for them.
-- ============================================================================

-- Verification query (for manual testing):
-- SELECT schemaname, tablename FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime' AND tablename = 'onboarding_sessions';

COMMENT ON TABLE onboarding_sessions IS 'Enabled for Realtime with filtered columns (excludes large JSONB)';
