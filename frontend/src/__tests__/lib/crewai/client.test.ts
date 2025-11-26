/**
 * Unit tests for CrewAI client functions
 */

import {
  formatBriefForCrew,
  kickoffCrewAIAnalysis,
  getCrewAIStatus,
} from '@/lib/crewai/client';

describe('CrewAI Client', () => {
  describe('formatBriefForCrew', () => {
    it('should format a complete brief correctly', () => {
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

    it('should handle missing optional fields with defaults', () => {
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

    it('should use customer_segments as fallback for target_customer', () => {
      const brief = {
        customer_segments: [{ name: 'Segment 1' }, { name: 'Segment 2' }],
      };

      const result = formatBriefForCrew(brief);

      expect(result.target_customer).toBe(JSON.stringify(brief.customer_segments));
    });
  });

  describe('kickoffCrewAIAnalysis', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      global.fetch = jest.fn();
    });

    it('should call CrewAI kickoff endpoint with correct payload', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ kickoff_id: 'test-kickoff-123' }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const briefData = {
        problem_description: 'Test problem',
        solution_description: 'Test solution',
      };

      const result = await kickoffCrewAIAnalysis(briefData, 'project-123', 'user-456');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/kickoff'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toBe('test-kickoff-123');
    });

    it('should throw error if kickoff fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const briefData = {};

      await expect(
        kickoffCrewAIAnalysis(briefData, 'project-123', 'user-456')
      ).rejects.toThrow('CrewAI kickoff failed');
    });

    it('should throw error if environment variables are missing', async () => {
      // Save all possible env vars
      const originalUrl = process.env.CREWAI_API_URL;
      const originalToken = process.env.CREWAI_API_TOKEN;
      const originalLegacyUrl = process.env.MCP_CREWAI_ENTERPRISE_SERVER_URL;
      const originalLegacyToken = process.env.MCP_CREWAI_ENTERPRISE_BEARER_TOKEN;

      // Delete both new and legacy env vars
      delete process.env.CREWAI_API_URL;
      delete process.env.CREWAI_API_TOKEN;
      delete process.env.MCP_CREWAI_ENTERPRISE_SERVER_URL;
      delete process.env.MCP_CREWAI_ENTERPRISE_BEARER_TOKEN;

      const briefData = {};

      await expect(
        kickoffCrewAIAnalysis(briefData, 'project-123', 'user-456')
      ).rejects.toThrow('CrewAI configuration missing');

      // Restore env vars
      process.env.CREWAI_API_URL = originalUrl;
      process.env.CREWAI_API_TOKEN = originalToken;
      process.env.MCP_CREWAI_ENTERPRISE_SERVER_URL = originalLegacyUrl;
      process.env.MCP_CREWAI_ENTERPRISE_BEARER_TOKEN = originalLegacyToken;
    });
  });

  describe('getCrewAIStatus', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      global.fetch = jest.fn();
    });

    it('should fetch status from CrewAI endpoint', async () => {
      const mockStatus = {
        state: 'RUNNING',
        status: 'Agent 3 executing',
        progress: 0.5,
      };
      const mockResponse = {
        ok: true,
        json: async () => mockStatus,
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await getCrewAIStatus('test-kickoff-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/status/test-kickoff-123'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockStatus);
    });

    it('should throw error if status check fails', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        text: async () => 'Not found',
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await expect(getCrewAIStatus('invalid-id')).rejects.toThrow(
        'CrewAI status check failed'
      );
    });
  });
});
