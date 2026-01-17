-- ============================================================================
-- Enable pg_cron and schedule process-completions worker
-- ============================================================================
-- Created: 2026-01-17
-- Purpose: Automatically process Stage 7 completion queue every minute
-- Reference: ADR-005 Split API Architecture
-- ============================================================================

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role (required for cron jobs)
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================================================
-- Reset stuck completions (backup safety net)
-- ============================================================================
-- Resets items stuck in 'processing' state for more than 5 minutes

SELECT cron.schedule(
    'reset-stuck-completions',     -- job name
    '*/5 * * * *',                 -- every 5 minutes
    $$
    UPDATE pending_completions
    SET status = 'pending',
        claimed_at = NULL,
        error_message = 'Reset: stuck in processing state'
    WHERE status = 'processing'
      AND claimed_at < NOW() - INTERVAL '5 minutes';
    $$
);

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used for process-completions queue worker';
