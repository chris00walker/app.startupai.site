export interface FounderValidationInputs {
  flow_type: 'founder_validation';
  project_id: string;
  user_id: string;
  session_id?: string;
  entrepreneur_input: string;
  entrepreneur_brief: Record<string, unknown>;
}

/**
 * Build inputs for the founder_validation flow.
 * Transforms entrepreneur brief data to the schema expected by the flow.
 */
export function buildFounderValidationInputs(
  briefData: Record<string, any>,
  projectId: string,
  userId: string,
  sessionId?: string
): FounderValidationInputs {
  const businessIdea = briefData.solution_description || briefData.unique_value_proposition || '';
  const problemDesc = briefData.problem_description || '';
  const segments = (briefData.customer_segments || []).join(', ');
  const competitors = (briefData.competitors || []).join(', ');
  const differentiators = (briefData.differentiation_factors || []).join(', ');
  const goals = (briefData.three_month_goals || []).join(', ');

  const entrepreneurInput = [
    `Business Idea: ${businessIdea}`,
    problemDesc ? `Problem: ${problemDesc}` : '',
    briefData.unique_value_proposition ? `Value Proposition: ${briefData.unique_value_proposition}` : '',
    segments ? `Target Customers: ${segments}` : '',
    briefData.primary_customer_segment ? `Primary Segment: ${briefData.primary_customer_segment}` : '',
    competitors ? `Competitors: ${competitors}` : '',
    differentiators ? `Differentiation: ${differentiators}` : '',
    briefData.budget_range ? `Budget: ${briefData.budget_range}` : '',
    briefData.business_stage ? `Stage: ${briefData.business_stage}` : '',
    goals ? `Goals: ${goals}` : '',
  ].filter(Boolean).join('\n');

  return {
    flow_type: 'founder_validation',
    project_id: projectId,
    user_id: userId,
    session_id: sessionId,
    entrepreneur_input: entrepreneurInput,
    entrepreneur_brief: {
      business_idea: businessIdea,
      problem_description: problemDesc,
      solution_description: briefData.solution_description || '',
      unique_value_proposition: briefData.unique_value_proposition || '',
      customer_segments: briefData.customer_segments || [],
      primary_customer_segment: briefData.primary_customer_segment || (briefData.customer_segments?.[0] ?? ''),
      business_stage: briefData.business_stage || 'idea',
      budget_range: briefData.budget_range || 'not specified',
      competitors: briefData.competitors || [],
      differentiation_factors: briefData.differentiation_factors || [],
      available_channels: briefData.available_channels || [],
      team_capabilities: briefData.team_capabilities || [],
      three_month_goals: briefData.three_month_goals || [],
      success_criteria: briefData.success_criteria || [],
      key_metrics: briefData.key_metrics || [],
    },
  };
}
