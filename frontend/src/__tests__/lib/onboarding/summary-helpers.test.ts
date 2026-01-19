/**
 * Summary Helpers Tests
 *
 * Tests for the summary modal helper functions that transform
 * onboarding session data for display in the Approve/Revise modal.
 */

import {
  transformSessionToSummary,
  calculateSummaryStats,
  extractBriefForDisplay,
} from '@/lib/onboarding/summary-helpers';

describe('Summary Helpers - transformSessionToSummary', () => {
  describe('basic transformation', () => {
    it('should return all stages with empty data when stageData is null', () => {
      const result = transformSessionToSummary(null);
      expect(result).toHaveLength(7);
      result.forEach(stage => {
        expect(stage.data).toEqual({});
      });
    });

    it('should return all stages with empty data when stageData is undefined', () => {
      const result = transformSessionToSummary(undefined);
      expect(result).toHaveLength(7);
      result.forEach(stage => {
        expect(stage.data).toEqual({});
      });
    });

    it('should return stages with empty data when brief is empty', () => {
      const result = transformSessionToSummary({ brief: {} });
      expect(result).toHaveLength(7);
      result.forEach(stage => {
        expect(stage.data).toEqual({});
      });
    });

    it('should return correct number of stages based on currentStage', () => {
      const result = transformSessionToSummary({ brief: {} }, 3);
      expect(result).toHaveLength(3);
    });
  });

  describe('data extraction', () => {
    it('should extract stage 1 data fields correctly', () => {
      const stageData = {
        brief: {
          business_concept: 'AI validation platform',
          inspiration: 'Personal experience',
          current_stage: 'Idea stage',
          founder_background: 'Tech entrepreneur',
        },
      };

      const result = transformSessionToSummary(stageData, 1);
      expect(result).toHaveLength(1);
      expect(result[0].stage).toBe(1);
      expect(result[0].stageName).toBe('Welcome & Introduction');
      expect(result[0].data.business_concept).toBe('AI validation platform');
      expect(result[0].data.inspiration).toBe('Personal experience');
    });

    it('should extract data across multiple stages', () => {
      const stageData = {
        brief: {
          // Stage 1 data
          business_concept: 'Test concept',
          inspiration: 'Test inspiration',
          // Stage 2 data
          target_customers: 'Startups',
          customer_segments: 'B2B SaaS',
          // Stage 3 data
          problem_description: 'Validation is hard',
          pain_level: 'High',
        },
      };

      const result = transformSessionToSummary(stageData, 3);
      expect(result).toHaveLength(3);
      expect(result[0].data.business_concept).toBe('Test concept');
      expect(result[1].data.target_customers).toBe('Startups');
      expect(result[2].data.problem_description).toBe('Validation is hard');
    });

    it('should handle array values', () => {
      const stageData = {
        brief: {
          competitors: ['Competitor A', 'Competitor B'],
          alternatives: ['Alternative 1', 'Alternative 2'],
        },
      };

      const result = transformSessionToSummary(stageData, 5);
      expect(result[4].data.competitors).toEqual(['Competitor A', 'Competitor B']);
    });

    it('should not include undefined values in output', () => {
      const stageData = {
        brief: {
          business_concept: 'Test',
          // inspiration is missing
        },
      };

      const result = transformSessionToSummary(stageData, 1);
      expect(result[0].data).toHaveProperty('business_concept');
      expect(result[0].data).not.toHaveProperty('inspiration');
    });

    it('should only extract fields defined in stage config', () => {
      const stageData = {
        brief: {
          business_concept: 'Test',
          random_field: 'Should not be included',
        },
      };

      const result = transformSessionToSummary(stageData, 1);
      expect(result[0].data).toHaveProperty('business_concept');
      expect(result[0].data).not.toHaveProperty('random_field');
    });
  });

  describe('stage metadata', () => {
    it('should include correct stage numbers', () => {
      const result = transformSessionToSummary({ brief: {} }, 7);
      expect(result.map(s => s.stage)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('should include correct stage names', () => {
      const result = transformSessionToSummary({ brief: {} }, 7);
      expect(result[0].stageName).toBe('Welcome & Introduction');
      expect(result[1].stageName).toBe('Customer Discovery');
      expect(result[2].stageName).toBe('Problem Definition');
      expect(result[3].stageName).toBe('Solution Validation');
      expect(result[4].stageName).toBe('Competitive Analysis');
      expect(result[5].stageName).toBe('Resources & Constraints');
      expect(result[6].stageName).toBe('Goals & Next Steps');
    });
  });
});

describe('Summary Helpers - calculateSummaryStats', () => {
  describe('basic counting', () => {
    it('should return zero counts for empty summary', () => {
      const result = calculateSummaryStats([]);
      expect(result).toEqual({
        totalFields: 0,
        capturedFields: 0,
        uncertainFields: 0,
      });
    });

    it('should count total fields based on stage config', () => {
      const summaryData = [
        { stage: 1, stageName: 'Welcome & Introduction', data: {} },
        { stage: 2, stageName: 'Customer Discovery', data: {} },
      ];

      const result = calculateSummaryStats(summaryData);
      // Stage 1 has 4 fields, Stage 2 has 4 fields = 8 total
      expect(result.totalFields).toBe(8);
    });

    it('should count captured fields correctly', () => {
      const summaryData = [
        {
          stage: 1,
          stageName: 'Welcome & Introduction',
          data: {
            business_concept: 'Test concept',
            inspiration: 'Test inspiration',
          },
        },
      ];

      const result = calculateSummaryStats(summaryData);
      expect(result.capturedFields).toBe(2);
    });

    it('should not count empty strings as captured', () => {
      const summaryData = [
        {
          stage: 1,
          stageName: 'Welcome & Introduction',
          data: {
            business_concept: 'Valid value',
            inspiration: '',
          },
        },
      ];

      const result = calculateSummaryStats(summaryData);
      expect(result.capturedFields).toBe(1);
    });
  });

  describe('uncertainty detection', () => {
    it('should count "uncertain" values', () => {
      const summaryData = [
        {
          stage: 1,
          stageName: 'Welcome & Introduction',
          data: {
            business_concept: 'uncertain',
          },
        },
      ];

      const result = calculateSummaryStats(summaryData);
      expect(result.uncertainFields).toBe(1);
      expect(result.capturedFields).toBe(1); // Still counted as captured
    });

    it('should count "unknown" values', () => {
      const summaryData = [
        {
          stage: 1,
          stageName: 'Welcome & Introduction',
          data: {
            business_concept: 'unknown',
          },
        },
      ];

      const result = calculateSummaryStats(summaryData);
      expect(result.uncertainFields).toBe(1);
    });

    it('should count "don\'t know" values (case insensitive)', () => {
      const summaryData = [
        {
          stage: 1,
          stageName: 'Welcome & Introduction',
          data: {
            business_concept: "I don't know yet",
            inspiration: "DON'T KNOW",
          },
        },
      ];

      const result = calculateSummaryStats(summaryData);
      expect(result.uncertainFields).toBe(2);
    });

    it('should count "haven\'t thought" values', () => {
      const summaryData = [
        {
          stage: 1,
          stageName: 'Welcome & Introduction',
          data: {
            business_concept: "I haven't thought about that",
          },
        },
      ];

      const result = calculateSummaryStats(summaryData);
      expect(result.uncertainFields).toBe(1);
    });

    it('should count "not sure" values', () => {
      const summaryData = [
        {
          stage: 1,
          stageName: 'Welcome & Introduction',
          data: {
            business_concept: "I'm not sure about this",
          },
        },
      ];

      const result = calculateSummaryStats(summaryData);
      expect(result.uncertainFields).toBe(1);
    });

    it('should count empty arrays as uncertain', () => {
      const summaryData = [
        {
          stage: 5,
          stageName: 'Competitive Analysis',
          data: {
            competitors: [],
          },
        },
      ];

      const result = calculateSummaryStats(summaryData);
      expect(result.uncertainFields).toBe(1);
    });

    it('should not count non-empty arrays as uncertain', () => {
      const summaryData = [
        {
          stage: 5,
          stageName: 'Competitive Analysis',
          data: {
            competitors: ['Competitor A'],
          },
        },
      ];

      const result = calculateSummaryStats(summaryData);
      expect(result.uncertainFields).toBe(0);
    });
  });

  describe('mixed data', () => {
    it('should calculate correct stats for full session', () => {
      const summaryData = [
        {
          stage: 1,
          stageName: 'Welcome & Introduction',
          data: {
            business_concept: 'Valid concept',
            inspiration: 'Valid inspiration',
            current_stage: "don't know",
            founder_background: 'unknown',
          },
        },
        {
          stage: 2,
          stageName: 'Customer Discovery',
          data: {
            target_customers: 'Startups',
            customer_segments: '',
            // other fields missing
          },
        },
      ];

      const result = calculateSummaryStats(summaryData);
      expect(result.totalFields).toBe(8); // 4 + 4
      expect(result.capturedFields).toBe(5); // 4 from stage 1 + 1 from stage 2 (empty string not counted)
      expect(result.uncertainFields).toBe(2); // "don't know" and "unknown"
    });
  });

  describe('edge cases', () => {
    it('should skip stages not in config', () => {
      const summaryData = [
        {
          stage: 99, // Invalid stage
          stageName: 'Invalid Stage',
          data: { some_field: 'value' },
        },
      ];

      const result = calculateSummaryStats(summaryData);
      expect(result.totalFields).toBe(0);
      expect(result.capturedFields).toBe(0);
    });
  });
});

describe('Summary Helpers - extractBriefForDisplay', () => {
  describe('basic extraction', () => {
    it('should return empty object when stageData is null', () => {
      const result = extractBriefForDisplay(null);
      expect(result).toEqual({});
    });

    it('should return empty object when stageData is undefined', () => {
      const result = extractBriefForDisplay(undefined);
      expect(result).toEqual({});
    });

    it('should return empty object when brief is empty', () => {
      const result = extractBriefForDisplay({ brief: {} });
      expect(result).toEqual({});
    });

    it('should extract string values', () => {
      const stageData = {
        brief: {
          business_concept: 'AI platform',
          inspiration: 'Personal need',
        },
      };

      const result = extractBriefForDisplay(stageData);
      expect(result).toEqual({
        business_concept: 'AI platform',
        inspiration: 'Personal need',
      });
    });

    it('should extract array values', () => {
      const stageData = {
        brief: {
          competitors: ['A', 'B', 'C'],
        },
      };

      const result = extractBriefForDisplay(stageData);
      expect(result.competitors).toEqual(['A', 'B', 'C']);
    });
  });

  describe('filtering', () => {
    it('should exclude undefined values', () => {
      const stageData = {
        brief: {
          business_concept: 'Valid',
          inspiration: undefined,
        },
      };

      const result = extractBriefForDisplay(stageData);
      expect(result).toHaveProperty('business_concept');
      expect(result).not.toHaveProperty('inspiration');
    });

    it('should exclude null values', () => {
      const stageData = {
        brief: {
          business_concept: 'Valid',
          inspiration: undefined,
        },
      };

      const result = extractBriefForDisplay(stageData);
      expect(result).toHaveProperty('business_concept');
      expect(result).not.toHaveProperty('inspiration');
    });

    it('should exclude empty strings', () => {
      const stageData = {
        brief: {
          business_concept: 'Valid',
          inspiration: '',
        },
      };

      const result = extractBriefForDisplay(stageData);
      expect(result).toHaveProperty('business_concept');
      expect(result).not.toHaveProperty('inspiration');
    });

    it('should include zero as a valid value', () => {
      const stageData = {
        brief: {
          budget_range: '0',
        },
      };

      const result = extractBriefForDisplay(stageData);
      expect(result.budget_range).toBe('0');
    });
  });

  describe('edge cases', () => {
    it('should handle missing brief key', () => {
      const stageData = {};

      const result = extractBriefForDisplay(stageData);
      expect(result).toEqual({});
    });

    it('should preserve all valid keys regardless of stage', () => {
      const stageData = {
        brief: {
          custom_field_1: 'Value 1',
          custom_field_2: 'Value 2',
        },
      };

      const result = extractBriefForDisplay(stageData);
      expect(result).toEqual({
        custom_field_1: 'Value 1',
        custom_field_2: 'Value 2',
      });
    });
  });
});
