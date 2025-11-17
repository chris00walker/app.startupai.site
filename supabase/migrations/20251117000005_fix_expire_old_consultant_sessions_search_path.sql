-- Fix search_path vulnerability in expire_old_consultant_sessions function
-- This function is SECURITY DEFINER, making the unfixed search_path a critical security risk

CREATE OR REPLACE FUNCTION public.expire_old_consultant_sessions()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public  -- Fixed: prevent privilege escalation
AS $function$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE consultant_onboarding_sessions
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$function$;
