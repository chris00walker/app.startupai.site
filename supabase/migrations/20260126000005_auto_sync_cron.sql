-- ============================================================================
-- Auto-Sync Cron Job
-- ============================================================================
-- Created: 2026-01-26
-- Purpose: Schedule automatic project sync to external platforms
-- Reference: US-BI02 - Sync Project to External Platform
-- ============================================================================

-- ============================================================================
-- CRON JOB: Auto-sync projects hourly
-- ============================================================================
-- This job runs every hour and triggers the sync-projects API endpoint
-- which will sync projects for users who have auto-sync enabled.

SELECT cron.schedule(
    'auto-sync-projects',
    '0 * * * *', -- Every hour at minute 0
    $$
    SELECT net.http_post(
        url := COALESCE(
            current_setting('app.base_url', true),
            'https://app.startupai.site'
        ) || '/api/cron/sync-projects',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION cron.schedule IS 'pg_cron scheduler for periodic jobs';
