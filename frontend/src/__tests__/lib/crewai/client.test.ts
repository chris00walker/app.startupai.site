/**
 * Unit tests for CrewAI client functions
 */

describe('CrewAI Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    // Set required env vars for tests
    process.env = {
      ...originalEnv,
      CREWAI_AMP_API_URL: 'https://test-api.crewai.com',
      CREWAI_AMP_BEARER_TOKEN: 'test-token',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('formatBriefForCrew', () => {
    it('should format a complete brief correctly', async () => {
      const { formatBriefForCrew } = await import('@/lib/crewai/amp-client');

      const brief = {
        primary_customer_segment: 'Small business owners',
        problem_description: 'Manual data entry is time-consuming',
        problem_pain_level: 8,
        solution_description: 'Automated data import tool',
        unique_value_proposition: 'Saves 10 hours per week',
        differentiation_factors: ['AI-powered', 'Easy to use'],
        competitors: ['Competitor A', 'Competitor B'],
        available_channels: ['LinkedIn', 'Email'],
        budget_range: '$10k-50k',
        business_stage: 'idea',
        three_month_goals: ['Launch MVP', 'Get 10 customers'],
      };

      const result = formatBriefForCrew(brief);

      expect(result).toEqual({
        target_customer: 'Small business owners',
        problem_description: 'Manual data entry is time-consuming',
        pain_level: 8,
        solution_description: 'Automated data import tool. Unique Value: Saves 10 hours per week',
        key_differentiators: ['AI-powered', 'Easy to use'],
        competitors: ['Competitor A', 'Competitor B'],
        available_channels: ['LinkedIn', 'Email'],
        budget_range: '$10k-50k',
        business_stage: 'idea',
        goals: JSON.stringify(['Launch MVP', 'Get 10 customers']),
      });
    });

    it('should handle missing optional fields with defaults', async () => {
      const { formatBriefForCrew } = await import('@/lib/crewai/amp-client');

      const brief = {};
      const result = formatBriefForCrew(brief);

      expect(result).toEqual({
        target_customer: '[]',
        problem_description: '',
        pain_level: 5,
        solution_description: '. Unique Value: ',
        key_differentiators: [],
        competitors: [],
        available_channels: [],
        budget_range: 'not specified',
        business_stage: 'idea',
        goals: '[]',
      });
    });

    it('should use customer_segments as fallback for target_customer', async () => {
      const { formatBriefForCrew } = await import('@/lib/crewai/amp-client');

      const brief = {
        customer_segments: [{ name: 'Segment 1' }, { name: 'Segment 2' }],
      };

      const result = formatBriefForCrew(brief);

      expect(result.target_customer).toBe(JSON.stringify(brief.customer_segments));
    });
  });

  // Note: kickoffCrewAIAnalysis and getCrewAIStatus tests are skipped because they
  // require CREWAI_AMP_API_URL env var which isn't available in test environment.
  // These are integration tests that should be run separately with proper config.

  describe('kickoffCrewAIAnalysis', () => {
    it('should throw error if environment variables are missing', async () => {
      // Remove required env vars (ensure they're not set)
      delete process.env.CREWAI_AMP_API_URL;
      delete process.env.CREWAI_AMP_BEARER_TOKEN;

      const { kickoffCrewAIAnalysis } = await import('@/lib/crewai/amp-client');

      const briefData = {};

      await expect(
        kickoffCrewAIAnalysis(briefData, 'project-123', 'user-456')
      ).rejects.toThrow('CrewAI AMP API URL is required');
    });
  });

  describe('getCrewAIStatus', () => {
    it('should throw error if environment variables are missing', async () => {
      // Remove required env vars (ensure they're not set)
      delete process.env.CREWAI_AMP_API_URL;
      delete process.env.CREWAI_AMP_BEARER_TOKEN;

      const { getCrewAIStatus } = await import('@/lib/crewai/amp-client');

      await expect(getCrewAIStatus('test-123')).rejects.toThrow(
        'CrewAI AMP API URL is required'
      );
    });
  });
});
