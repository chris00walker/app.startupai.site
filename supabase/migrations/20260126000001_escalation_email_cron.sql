-- ============================================================================
-- Approval Escalation Email Cron Job
-- ============================================================================
-- Created: 2026-01-26
-- Purpose: Check for stale approvals hourly and trigger email notifications
-- Reference: US-AA03 - Configure Escalation Contact
--
-- NOTE: pg_cron and pg_net are only available in Supabase Cloud, not locally
-- For local development, call /api/cron/escalate-approvals manually
-- ============================================================================

-- Create function to call the escalation endpoint via pg_net
CREATE OR REPLACE FUNCTION send_escalation_emails()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_request_id bigint;
    v_base_url text;
    v_cron_secret text;
BEGIN
    -- Get configuration
    v_base_url := COALESCE(
        current_setting('app.site_url', true),
        'https://app.startupai.site'
    );
    v_cron_secret := current_setting('app.cron_secret', true);

    -- If no cron secret configured, skip
    IF v_cron_secret IS NULL OR v_cron_secret = '' THEN
        RETURN jsonb_build_object(
            'status', 'skipped',
            'reason', 'No CRON_SECRET configured'
        );
    END IF;

    -- Call escalation endpoint via pg_net (async HTTP)
    SELECT net.http_post(
        url := v_base_url || '/api/cron/escalate-approvals',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_cron_secret
        ),
        body := '{}'::jsonb
    ) INTO v_request_id;

    RETURN jsonb_build_object(
        'status', 'triggered',
        'pg_net_request_id', v_request_id,
        'endpoint', v_base_url || '/api/cron/escalate-approvals'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'status', 'error',
        'error', SQLERRM
    );
END;
$$;

-- Schedule the cron job (only on Supabase Cloud where pg_cron is available)
DO $$
BEGIN
    -- Only schedule if cron schema exists (Supabase Cloud)
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
        -- Check for stale approvals every hour at minute 0
        PERFORM cron.schedule(
            'escalate-stale-approvals',    -- job name
            '0 * * * *',                   -- every hour at minute 0
            $CRON$SELECT send_escalation_emails();$CRON$
        );
        RAISE NOTICE 'Scheduled escalate-stale-approvals cron job (hourly)';
    ELSE
        RAISE NOTICE 'pg_cron not available - skipping escalation cron job (call /api/cron/escalate-approvals manually for local dev)';
    END IF;
END $$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_escalation_emails TO service_role;

COMMENT ON FUNCTION send_escalation_emails IS 'Triggers escalation email check via HTTP endpoint. Called hourly by pg_cron. For local dev, call /api/cron/escalate-approvals manually.';
