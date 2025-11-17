-- Fix search_path vulnerability in create_onboarding_session function
-- This function is SECURITY DEFINER, making the unfixed search_path a critical security risk

CREATE OR REPLACE FUNCTION public.create_onboarding_session(p_user_id uuid, p_plan_type character varying, p_user_context jsonb DEFAULT '{}'::jsonb)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public  -- Fixed: prevent privilege escalation
AS $function$
DECLARE
  v_session_id VARCHAR(255);
BEGIN
  -- Generate unique session ID
  v_session_id := 'onb_' || encode(gen_random_bytes(16), 'hex');

  -- Insert new session
  INSERT INTO onboarding_sessions (
    session_id,
    user_id,
    plan_type,
    user_context,
    started_at,
    last_activity,
    expires_at
  ) VALUES (
    v_session_id,
    p_user_id,
    p_plan_type,
    p_user_context,
    NOW(),
    NOW(),
    NOW() + INTERVAL '24 hours'
  );

  RETURN v_session_id;
END;
$function$;
