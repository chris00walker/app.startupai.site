/**
 * Topic-Based Stage Advancement Tests
 *
 * These tests validate the NEW architecture where:
 * - Stage advancement is based on topics covered, not LLM quality scores
 * - "I don't know" is a valid response that counts as topic coverage
 * - Assessment extracts data but does NOT gate progression
 *
 * TDD Approach: These tests define the desired behavior.
 * Implementation changes will make them pass.
 *
 * @see Plan: /home/chris/.claude/plans/precious-kindling-balloon.md
 */

import {
  shouldAdvanceStage,
  mergeExtractedData,
  type QualityAssessment,
} from '@/lib/onboarding/quality-assessment';
import { getStageConfig, TOTAL_STAGES } from '@/lib/onboarding/stages-config';

// ============================================================================
// Test Data Helpers
// ============================================================================

/**
 * Create a mock assessment with specified properties
 * Automatically generates topicsCovered array based on coverage if not provided
 */
function createMockAssessment(overrides: Partial<QualityAssessment> = {}): QualityAssessment {
  // Default Stage 1 topics for calculating topicsCovered if not provided
  const stage1Topics = ['business_concept', 'inspiration', 'current_stage', 'founder_background'];

  // Calculate topics covered from coverage percentage if topicsCovered not provided
  const coverage = overrides.coverage ?? 0.5;
  const topicsCount = Math.round(coverage * stage1Topics.length);
  const defaultTopicsCovered = stage1Topics.slice(0, topicsCount);

  return {
    topicsCovered: defaultTopicsCovered,
    coverage: 0.5,
    clarity: 'medium',
    completeness: 'partial',
    notes: 'Test assessment',
    extractedData: {},
    ...overrides,
  };
}

/**
 * Create an assessment that represents "I don't know" responses
 * These should still count as topic coverage
 */
function createUncertaintyAssessment(
  topicsDiscussed: string[],
  uncertainTopics: string[]
): QualityAssessment {
  const extractedData: Record<string, string | string[]> = {};

  // Topics with actual answers
  for (const topic of topicsDiscussed) {
    extractedData[topic] = `User response for ${topic}`;
  }

  // Topics where user said "I don't know" - still valid data!
  for (const topic of uncertainTopics) {
    extractedData[topic] = 'uncertain'; // Mark as uncertain, not empty
  }

  const totalTopics = topicsDiscussed.length + uncertainTopics.length;
  const stage1DataFields = getStageConfig(1)?.dataToCollect.length ?? 4;

  // All discussed topics (both confident and uncertain) count as covered
  const topicsCovered = [...topicsDiscussed, ...uncertainTopics];

  return {
    topicsCovered, // NEW: Explicit list of covered topics
    coverage: totalTopics / stage1DataFields, // Coverage = topics discussed / total
    clarity: 'medium',
    completeness: totalTopics >= stage1DataFields ? 'complete' : 'partial',
    notes: `User uncertain about: ${uncertainTopics.join(', ')}`,
    extractedData,
  };
}

// ============================================================================
// Topic-Based Advancement Tests
// ============================================================================

describe('Topic-Based Stage Advancement', () => {
  describe('Advancement Based on Topic Coverage', () => {
    it('should advance stage when all topics are covered', () => {
      // Stage 1 has 4 data fields: business_concept, inspiration, current_stage, founder_background
      const assessment = createMockAssessment({
        coverage: 1.0, // All topics covered
        completeness: 'complete',
        extractedData: {
          business_concept: 'A meal planning app',
          inspiration: 'Personal frustration with meal prep',
          current_stage: 'Just an idea',
          founder_background: 'Software engineer',
        },
      });

      expect(shouldAdvanceStage(assessment, 1)).toBe(true);
    });

    it('should advance stage when 3 of 4 topics are covered', () => {
      // 75% coverage should be sufficient to advance from Stage 1 (threshold is 0.7)
      const assessment = createMockAssessment({
        coverage: 0.75, // 3 of 4 topics
        completeness: 'complete',
        extractedData: {
          business_concept: 'A meal planning app',
          inspiration: 'Personal frustration',
          current_stage: 'Just starting',
          // founder_background missing - that's OK
        },
      });

      expect(shouldAdvanceStage(assessment, 1)).toBe(true);
    });

    it('should NOT advance when only 1-2 topics are covered', () => {
      const assessment = createMockAssessment({
        coverage: 0.5, // 2 of 4 topics
        completeness: 'partial',
        extractedData: {
          business_concept: 'A meal planning app',
          inspiration: 'Personal frustration',
        },
      });

      // With only 2 topics, we shouldn't advance yet
      expect(shouldAdvanceStage(assessment, 1)).toBe(false);
    });

    it('should NOT advance past stage 7', () => {
      const assessment = createMockAssessment({
        coverage: 1.0,
        completeness: 'complete',
      });

      expect(shouldAdvanceStage(assessment, 7)).toBe(false);
      expect(shouldAdvanceStage(assessment, TOTAL_STAGES)).toBe(false);
    });
  });

  describe('Handling "I Don\'t Know" Responses', () => {
    it('should count "I don\'t know" as valid topic coverage', () => {
      // User discussed all 4 topics, but said "I don't know" for 2 of them
      const assessment = createUncertaintyAssessment(
        ['business_concept', 'inspiration'], // Known
        ['current_stage', 'founder_background'] // "I don't know"
      );

      // 4 topics discussed = 100% coverage, even if 2 are uncertain
      expect(assessment.coverage).toBe(1.0);
      expect(shouldAdvanceStage(assessment, 1)).toBe(true);
    });

    it('should extract "I don\'t know" as a data point', () => {
      const assessment = createUncertaintyAssessment(
        ['business_concept'],
        ['inspiration', 'current_stage', 'founder_background']
      );

      // Uncertain topics should have 'uncertain' value, not be missing
      expect(assessment.extractedData?.inspiration).toBe('uncertain');
      expect(assessment.extractedData?.current_stage).toBe('uncertain');
      expect(assessment.extractedData?.founder_background).toBe('uncertain');
    });

    it('should mark uncertain responses appropriately in notes', () => {
      const assessment = createUncertaintyAssessment(
        ['business_concept'],
        ['inspiration', 'current_stage']
      );

      expect(assessment.notes).toContain('uncertain');
      expect(assessment.notes).toContain('inspiration');
      expect(assessment.notes).toContain('current_stage');
    });

    it('should not block advancement due to uncertain responses', () => {
      // All topics discussed, but user said "I don't know" for all of them
      const assessment = createUncertaintyAssessment(
        [], // No confident answers
        ['business_concept', 'inspiration', 'current_stage', 'founder_background'] // All uncertain
      );

      // Still 100% topic coverage - all topics were discussed
      expect(assessment.coverage).toBe(1.0);

      // Should still advance because topics were COVERED (discussed)
      // The QUALITY of answers is separate from advancement
      expect(shouldAdvanceStage(assessment, 1)).toBe(true);
    });
  });

  describe('Message-Based Fallback Advancement', () => {
    it('should advance after 3-4 exchanges even with partial coverage', () => {
      // After 3-4 exchanges (6-8 messages), should be able to advance
      const assessment = createMockAssessment({
        coverage: 0.6, // Only 60% coverage
        completeness: 'partial',
      });

      // With 6 messages in stage, fallback should trigger
      expect(shouldAdvanceStage(assessment, 1, 6)).toBe(true);
    });

    it('should advance after 4 exchanges with minimal coverage', () => {
      const assessment = createMockAssessment({
        coverage: 0.6,
        completeness: 'partial',
      });

      // 8 messages = 4 exchanges (user + assistant each)
      expect(shouldAdvanceStage(assessment, 1, 8)).toBe(true);
    });

    it('should NOT advance with too few messages and low coverage', () => {
      const assessment = createMockAssessment({
        coverage: 0.3, // Low coverage
        completeness: 'insufficient',
      });

      // Only 2 messages - not enough for fallback
      expect(shouldAdvanceStage(assessment, 1, 2)).toBe(false);
    });
  });

  describe('Assessment Extracts Without Gating', () => {
    it('should extract all mentioned data regardless of completeness', () => {
      const assessment = createMockAssessment({
        coverage: 0.25, // Low coverage
        completeness: 'insufficient', // Not ready by quality standards
        extractedData: {
          business_concept: 'Some vague idea about apps', // Vague but captured
        },
      });

      // Data should still be extracted even if completeness is insufficient
      expect(assessment.extractedData?.business_concept).toBeDefined();
      expect(assessment.extractedData?.business_concept).toBe('Some vague idea about apps');
    });

    it('should preserve extracted data across stage transitions', () => {
      const stage1Data = {
        business_concept: 'A meal planning app',
        inspiration: 'Personal frustration',
      };

      const stage2Extraction = {
        target_customers: ['busy parents', 'health-conscious individuals'],
        customer_segments: ['families with kids'],
      };

      const merged = mergeExtractedData(stage1Data, stage2Extraction);

      // Stage 1 data preserved
      expect(merged.business_concept).toBe('A meal planning app');
      expect(merged.inspiration).toBe('Personal frustration');

      // Stage 2 data added
      expect(merged.target_customers).toEqual(['busy parents', 'health-conscious individuals']);
      expect(merged.customer_segments).toEqual(['families with kids']);
    });
  });
});

// ============================================================================
// Data Merging Tests
// ============================================================================

describe('Data Merging', () => {
  describe('mergeExtractedData', () => {
    it('should merge new data into existing brief', () => {
      const existing = { business_concept: 'App idea' };
      const newData = { inspiration: 'Personal experience' };

      const result = mergeExtractedData(existing, newData);

      expect(result.business_concept).toBe('App idea');
      expect(result.inspiration).toBe('Personal experience');
    });

    it('should append arrays instead of replacing', () => {
      const existing = { target_customers: ['segment A'] };
      const newData = { target_customers: ['segment B', 'segment C'] };

      const result = mergeExtractedData(existing, newData);

      expect(result.target_customers).toEqual(['segment A', 'segment B', 'segment C']);
    });

    it('should dedupe arrays when merging', () => {
      const existing = { competitors: ['Company A', 'Company B'] };
      const newData = { competitors: ['Company B', 'Company C'] };

      const result = mergeExtractedData(existing, newData);

      expect(result.competitors).toEqual(['Company A', 'Company B', 'Company C']);
    });

    it('should overwrite non-array values with new non-empty values', () => {
      const existing = { business_concept: 'Old idea' };
      const newData = { business_concept: 'Updated idea with more detail' };

      const result = mergeExtractedData(existing, newData);

      expect(result.business_concept).toBe('Updated idea with more detail');
    });

    it('should handle undefined extractedData', () => {
      const existing = { business_concept: 'Test' };

      const result = mergeExtractedData(existing, undefined);

      expect(result).toEqual(existing);
    });

    it('should skip empty string values', () => {
      const existing = { business_concept: 'Test' };
      const newData = { inspiration: '' };

      const result = mergeExtractedData(existing, newData);

      expect(result.inspiration).toBeUndefined();
    });

    it('should handle "uncertain" as a valid value', () => {
      const existing = {};
      const newData = {
        business_concept: 'Meal planning app',
        inspiration: 'uncertain', // User said "I don't know"
      };

      const result = mergeExtractedData(existing, newData);

      expect(result.inspiration).toBe('uncertain');
    });
  });
});

// ============================================================================
// Stage-Specific Advancement Tests
// ============================================================================

/**
 * Create a mock assessment for a specific stage with correct topicsCovered
 */
function createStageAssessment(
  stageNumber: number,
  topicCoverageRatio: number
): QualityAssessment {
  const stageConfig = getStageConfig(stageNumber);
  const topics = stageConfig?.dataToCollect ?? [];
  const topicsCount = Math.round(topicCoverageRatio * topics.length);
  const topicsCovered = topics.slice(0, topicsCount);

  return {
    topicsCovered: [...topicsCovered], // Convert readonly to mutable
    coverage: topicCoverageRatio,
    clarity: 'medium',
    completeness: topicCoverageRatio >= 0.75 ? 'complete' : 'partial',
    notes: 'Test assessment',
    extractedData: {},
  };
}

describe('Stage-Specific Advancement', () => {
  // Test each stage's threshold
  const stageThresholds = [
    { stage: 1, threshold: 0.7, name: 'Welcome & Introduction' },
    { stage: 2, threshold: 0.75, name: 'Customer Discovery' },
    { stage: 3, threshold: 0.8, name: 'Problem Definition' },
    { stage: 4, threshold: 0.75, name: 'Solution Validation' },
    { stage: 5, threshold: 0.7, name: 'Competitive Analysis' },
    { stage: 6, threshold: 0.75, name: 'Resources & Constraints' },
    { stage: 7, threshold: 0.85, name: 'Goals & Next Steps' },
  ];

  describe.each(stageThresholds)(
    'Stage $stage: $name (threshold: $threshold)',
    ({ stage, threshold }) => {
      it(`should advance when 75%+ topics covered (topic-based advancement)`, () => {
        if (stage === 7) {
          // Stage 7 can't advance further
          return;
        }

        // Topic-based advancement: 75% of topics covered = advance
        const assessment = createStageAssessment(stage, 0.75);

        expect(shouldAdvanceStage(assessment, stage)).toBe(true);
      });

      it(`should NOT advance when only 50% topics covered without message fallback`, () => {
        // Only 2 of 4 topics covered = no advancement
        const assessment = createStageAssessment(stage, 0.5);

        // Without message count, should not advance
        expect(shouldAdvanceStage(assessment, stage)).toBe(false);
      });

      it(`should advance via fallback after 6+ messages with 60% coverage`, () => {
        if (stage === 7) {
          // Stage 7 can't advance further
          return;
        }

        // Even with low topic coverage, message fallback kicks in
        const assessment = createStageAssessment(stage, 0.5);
        // Add the required coverage for message-based fallback
        assessment.coverage = 0.6;

        expect(shouldAdvanceStage(assessment, stage, 6)).toBe(true);
      });
    }
  );
});
