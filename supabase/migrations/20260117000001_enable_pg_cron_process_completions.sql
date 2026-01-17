-- ============================================================================
-- Enable pg_cron and schedule process-completions worker
-- ============================================================================
-- Created: 2026-01-17
-- Purpose: Automatically process Stage 7 completion queue every minute
-- Reference: ADR-005 Split API Architecture
-- NOTE: pg_cron is only available in Supabase Cloud, not in local development
-- This migration gracefully skips if pg_cron is not available
-- ============================================================================

DO $$
BEGIN
    -- Try to enable pg_cron extension (only available on Supabase Cloud)
    BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

        -- Grant usage to postgres role (required for cron jobs)
        GRANT USAGE ON SCHEMA cron TO postgres;

        -- Reset stuck completions (backup safety net)
        -- Resets items stuck in 'processing' state for more than 5 minutes
        PERFORM cron.schedule(
            'reset-stuck-completions',     -- job name
            '*/5 * * * *',                 -- every 5 minutes
            $CRON$
            UPDATE pending_completions
            SET status = 'pending',
                claimed_at = NULL,
                error_message = 'Reset: stuck in processing state'
            WHERE status = 'processing'
              AND claimed_at < NOW() - INTERVAL '5 minutes';
            $CRON$
        );

        RAISE NOTICE 'pg_cron enabled and scheduled reset-stuck-completions job';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'pg_cron not available (local environment) - skipping cron job setup';
        WHEN undefined_file THEN
            RAISE NOTICE 'pg_cron extension not found - skipping cron job setup';
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not enable pg_cron: % - skipping cron job setup', SQLERRM;
    END;
END $$;
