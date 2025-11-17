-- Fix search_path vulnerability in upsert_entrepreneur_brief function
-- This function is SECURITY DEFINER, making the unfixed search_path a critical security risk

CREATE OR REPLACE FUNCTION public.upsert_entrepreneur_brief(p_session_id character varying, p_user_id uuid, p_brief_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public  -- Fixed: prevent privilege escalation
AS $function$
DECLARE
  v_brief_id UUID;
  v_existing_brief entrepreneur_briefs%ROWTYPE;
BEGIN
  -- Check if brief already exists for this session
  SELECT * INTO v_existing_brief
  FROM entrepreneur_briefs
  WHERE session_id = p_session_id;

  IF FOUND THEN
    -- Update existing brief
    UPDATE entrepreneur_briefs SET
      customer_segments = COALESCE((p_brief_data->>'customer_segments')::jsonb, customer_segments),
      problem_description = COALESCE(p_brief_data->>'problem_description', problem_description),
      solution_description = COALESCE(p_brief_data->>'solution_description', solution_description),
      competitors = COALESCE((p_brief_data->>'competitors')::jsonb, competitors),
      budget_range = COALESCE(p_brief_data->>'budget_range', budget_range),
      business_stage = COALESCE(p_brief_data->>'business_stage', business_stage),
      updated_at = NOW()
    WHERE id = v_existing_brief.id;

    v_brief_id := v_existing_brief.id;
  ELSE
    -- Create new brief
    INSERT INTO entrepreneur_briefs (
      session_id,
      user_id,
      customer_segments,
      problem_description,
      solution_description,
      competitors,
      budget_range,
      business_stage
    ) VALUES (
      p_session_id,
      p_user_id,
      (p_brief_data->>'customer_segments')::jsonb,
      p_brief_data->>'problem_description',
      p_brief_data->>'solution_description',
      (p_brief_data->>'competitors')::jsonb,
      p_brief_data->>'budget_range',
      p_brief_data->>'business_stage'
    ) RETURNING id INTO v_brief_id;
  END IF;

  -- Calculate and update completeness
  PERFORM calculate_brief_completeness(v_brief_id);

  RETURN v_brief_id;
END;
$function$;
