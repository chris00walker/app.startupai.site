-- Fix search_path vulnerability in update_session_activity function
-- This function is SECURITY DEFINER, making the unfixed search_path a critical security risk

CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_id character varying)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public  -- Fixed: prevent privilege escalation
AS $function$
BEGIN
  UPDATE onboarding_sessions
  SET last_activity = NOW(),
      expires_at = NOW() + INTERVAL '24 hours'
  WHERE session_id = p_session_id
    AND status = 'active';
END;
$function$;
