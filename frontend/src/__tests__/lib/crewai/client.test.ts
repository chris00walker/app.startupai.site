/**
 * Unit tests for founder validation input builder
 */

import { buildFounderValidationInputs } from '@/lib/crewai/founder-validation';

describe('buildFounderValidationInputs', () => {
  it('builds a structured payload from brief data', () => {
    const inputs = buildFounderValidationInputs(
      {
        solution_description: 'Automated data import tool',
        problem_description: 'Manual data entry is time-consuming',
        unique_value_proposition: 'Saves 10 hours per week',
        customer_segments: ['Small business owners'],
        primary_customer_segment: 'Small business owners',
        competitors: ['Competitor A', 'Competitor B'],
        differentiation_factors: ['AI-powered', 'Easy to use'],
        budget_range: '$10k-50k',
        business_stage: 'idea',
        three_month_goals: ['Launch MVP', 'Get 10 customers'],
      },
      'project-123',
      'user-456',
      'session-789'
    );

    expect(inputs.flow_type).toBe('founder_validation');
    expect(inputs.project_id).toBe('project-123');
    expect(inputs.user_id).toBe('user-456');
    expect(inputs.session_id).toBe('session-789');
    expect(inputs.entrepreneur_input).toContain('Business Idea: Automated data import tool');
    expect(inputs.entrepreneur_input).toContain('Problem: Manual data entry is time-consuming');
    expect(inputs.entrepreneur_brief).toMatchObject({
      business_idea: 'Automated data import tool',
      budget_range: '$10k-50k',
      business_stage: 'idea',
    });
  });

  it('falls back to defaults when optional fields are missing', () => {
    const inputs = buildFounderValidationInputs({}, 'project-1', 'user-2');

    expect(inputs.entrepreneur_input).toContain('Business Idea: ');
    expect(inputs.entrepreneur_brief).toMatchObject({
      business_stage: 'idea',
      budget_range: 'not specified',
    });
  });
});
