-- Fix search_path vulnerability in create_project_from_onboarding function
-- This function is SECURITY DEFINER, making the unfixed search_path a critical security risk

CREATE OR REPLACE FUNCTION public.create_project_from_onboarding(p_session_id character varying, p_project_name character varying DEFAULT NULL::character varying)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public  -- Fixed: prevent privilege escalation
AS $function$
DECLARE
  v_session onboarding_sessions%ROWTYPE;
  v_brief entrepreneur_briefs%ROWTYPE;
  v_project_id UUID;
  v_project_name VARCHAR(255);
BEGIN
  -- Get session and brief data
  SELECT * INTO v_session FROM onboarding_sessions WHERE session_id = p_session_id;
  SELECT * INTO v_brief FROM entrepreneur_briefs WHERE session_id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Onboarding session not found: %', p_session_id;
  END IF;

  -- Generate project name if not provided
  IF p_project_name IS NULL THEN
    v_project_name := COALESCE(
      v_brief.unique_value_proposition,
      'Project from ' || TO_CHAR(v_session.started_at, 'YYYY-MM-DD')
    );
  ELSE
    v_project_name := p_project_name;
  END IF;

  -- Create project
  INSERT INTO projects (
    user_id,
    name,
    description,
    stage,
    onboarding_session_id,
    entrepreneur_brief_id,
    onboarding_completed_at,
    onboarding_quality_score,
    created_at,
    updated_at
  ) VALUES (
    v_session.user_id,
    v_project_name,
    v_brief.problem_description,
    CASE v_brief.business_stage
      WHEN 'idea' THEN 'idea'
      WHEN 'validation' THEN 'validation'
      ELSE 'scaling'
    END,
    p_session_id,
    v_brief.id,
    NOW(),
    v_brief.overall_quality_score,
    NOW(),
    NOW()
  ) RETURNING id INTO v_project_id;

  -- Update session status
  UPDATE onboarding_sessions
  SET status = 'completed', completed_at = NOW()
  WHERE session_id = p_session_id;

  RETURN v_project_id;
END;
$function$;
