-- Fix search_path vulnerability in calculate_brief_completeness function
-- This function is SECURITY DEFINER, making the unfixed search_path a critical security risk

CREATE OR REPLACE FUNCTION public.calculate_brief_completeness(p_brief_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public  -- Fixed: prevent privilege escalation
AS $function$
DECLARE
  v_brief entrepreneur_briefs%ROWTYPE;
  v_completeness INTEGER := 0;
  v_total_sections INTEGER := 6;
  v_completed_sections INTEGER := 0;
BEGIN
  SELECT * INTO v_brief FROM entrepreneur_briefs WHERE id = p_brief_id;

  -- Check each section for completeness
  IF jsonb_array_length(v_brief.customer_segments) > 0 THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;

  IF v_brief.problem_description IS NOT NULL AND LENGTH(v_brief.problem_description) > 50 THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;

  IF v_brief.solution_description IS NOT NULL AND LENGTH(v_brief.solution_description) > 50 THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;

  IF jsonb_array_length(v_brief.competitors) > 0 THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;

  IF v_brief.budget_range IS NOT NULL THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;

  IF v_brief.business_stage IS NOT NULL THEN
    v_completed_sections := v_completed_sections + 1;
  END IF;

  v_completeness := (v_completed_sections * 100) / v_total_sections;

  -- Update the completeness score
  UPDATE entrepreneur_briefs
  SET completeness_score = v_completeness
  WHERE id = p_brief_id;

  RETURN v_completeness;
END;
$function$;
