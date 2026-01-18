/**
 * Founder Quality Assessment Tests
 *
 * Tests for the pure utility functions in founder-quality-assessment.ts.
 * AI-dependent functions (assessFounderConversation, assessWithRetry) are
 * not tested here as they require external service mocking.
 */

import {
  buildAssessmentPrompt,
  shouldFounderAdvanceStage,
  isFounderOnboardingComplete,
  mergeExtractedData,
  hashMessageForIdempotency,
  calculateOverallProgress,
  type QualityAssessment,
} from '@/lib/onboarding/founder-quality-assessment';

// ============================================================================
// buildAssessmentPrompt Tests
// ============================================================================

describe('buildAssessmentPrompt', () => {
  const mockHistory = [
    { role: 'assistant' as const, content: 'What business are you building?', stage: 1 },
    { role: 'user' as const, content: 'An AI validation platform', stage: 1 },
  ];

  it('should include stage number and name', () => {
    const prompt = buildAssessmentPrompt(1, mockHistory, {});
    expect(prompt).toContain('Stage 1');
    expect(prompt).toContain('Welcome & Introduction');
  });

  it('should include stage objective', () => {
    const prompt = buildAssessmentPrompt(1, mockHistory, {});
    expect(prompt).toContain('Objective');
  });

  it('should include required data fields', () => {
    const prompt = buildAssessmentPrompt(1, mockHistory, {});
    expect(prompt).toContain('business_concept');
    expect(prompt).toContain('inspiration');
  });

  it('should include existing brief data', () => {
    const existingBrief = {
      business_concept: 'AI platform',
      inspiration: 'Personal need',
    };
    const prompt = buildAssessmentPrompt(2, mockHistory, existingBrief);
    expect(prompt).toContain('AI platform');
    expect(prompt).toContain('Personal need');
  });

  it('should show "(No data collected yet)" when brief is empty', () => {
    const prompt = buildAssessmentPrompt(1, mockHistory, {});
    expect(prompt).toContain('(No data collected yet)');
  });

  it('should filter messages by stage', () => {
    const mixedHistory = [
      { role: 'assistant' as const, content: 'Stage 1 message', stage: 1 },
      { role: 'user' as const, content: 'Stage 1 response', stage: 1 },
      { role: 'assistant' as const, content: 'Stage 2 message', stage: 2 },
      { role: 'user' as const, content: 'Stage 2 response', stage: 2 },
    ];
    const prompt = buildAssessmentPrompt(2, mixedHistory, {});
    expect(prompt).toContain('Stage 2 message');
    expect(prompt).toContain('Stage 2 response');
    // Stage 1 messages should not be in the "Current Stage Conversation" section
  });

  it('should include Stage 7 completion fields when at final stage', () => {
    const prompt = buildAssessmentPrompt(7, mockHistory, {});
    expect(prompt).toContain('keyInsights');
    expect(prompt).toContain('recommendedNextSteps');
    expect(prompt).toContain('Stage 7 Completion');
  });

  it('should not include Stage 7 fields for other stages', () => {
    const prompt = buildAssessmentPrompt(3, mockHistory, {});
    expect(prompt).not.toContain('Stage 7 Completion');
  });

  it('should handle empty history with fallback message', () => {
    const prompt = buildAssessmentPrompt(1, [], {});
    expect(prompt).toContain('No messages yet for this stage');
  });

  it('should fallback to all non-system messages when no stage-tagged messages', () => {
    const untaggedHistory = [
      { role: 'assistant' as const, content: 'Hello!' },
      { role: 'user' as const, content: 'Hi there' },
    ];
    const prompt = buildAssessmentPrompt(1, untaggedHistory, {});
    expect(prompt).toContain('Hello!');
    expect(prompt).toContain('Hi there');
  });
});

// ============================================================================
// shouldFounderAdvanceStage Tests
// ============================================================================

describe('shouldFounderAdvanceStage', () => {
  const createAssessment = (overrides: Partial<QualityAssessment> = {}): QualityAssessment => ({
    topicsCovered: [],
    coverage: 0,
    clarity: 'medium',
    completeness: 'partial',
    notes: '',
    extractedData: {},
    ...overrides,
  });

  describe('topic-based advancement', () => {
    it('should advance when 75% of topics are covered', () => {
      // Stage 1 has 4 fields, need 3 (75%) to advance
      const assessment = createAssessment({
        topicsCovered: ['business_concept', 'inspiration', 'current_stage'],
        coverage: 0.75,
      });
      expect(shouldFounderAdvanceStage(assessment, 1)).toBe(true);
    });

    it('should not advance when less than 75% topics covered', () => {
      const assessment = createAssessment({
        topicsCovered: ['business_concept', 'inspiration'], // 2 of 4 = 50%
        coverage: 0.5,
      });
      expect(shouldFounderAdvanceStage(assessment, 1)).toBe(false);
    });

    it('should handle empty topicsCovered array', () => {
      const assessment = createAssessment({
        topicsCovered: [],
        coverage: 0,
      });
      expect(shouldFounderAdvanceStage(assessment, 1)).toBe(false);
    });
  });

  describe('message-based fallback', () => {
    it('should advance after 6 messages with 60% coverage', () => {
      const assessment = createAssessment({
        topicsCovered: ['business_concept'], // Only 1 topic, not enough for topic-based
        coverage: 0.6,
      });
      expect(shouldFounderAdvanceStage(assessment, 1, 6)).toBe(true);
    });

    it('should not advance with 5 messages even at 60% coverage', () => {
      const assessment = createAssessment({
        topicsCovered: ['business_concept'],
        coverage: 0.6,
      });
      expect(shouldFounderAdvanceStage(assessment, 1, 5)).toBe(false);
    });

    it('should not advance with 6 messages but only 50% coverage', () => {
      const assessment = createAssessment({
        topicsCovered: ['business_concept'],
        coverage: 0.5,
      });
      expect(shouldFounderAdvanceStage(assessment, 1, 6)).toBe(false);
    });
  });

  describe('final stage handling', () => {
    it('should never advance past Stage 7', () => {
      const assessment = createAssessment({
        topicsCovered: ['short_term_goals', 'success_metrics', 'priorities', 'first_experiment'],
        coverage: 1.0,
        completeness: 'complete',
      });
      expect(shouldFounderAdvanceStage(assessment, 7)).toBe(false);
    });
  });
});

// ============================================================================
// isFounderOnboardingComplete Tests
// ============================================================================

describe('isFounderOnboardingComplete', () => {
  const createCompleteAssessment = (): QualityAssessment => ({
    topicsCovered: ['short_term_goals', 'success_metrics', 'priorities', 'first_experiment'],
    coverage: 1.0,
    clarity: 'high',
    completeness: 'complete',
    notes: '',
    extractedData: {},
    keyInsights: ['Insight 1', 'Insight 2', 'Insight 3'],
    recommendedNextSteps: ['Step 1', 'Step 2', 'Step 3'],
  });

  it('should return true when at Stage 7 with complete assessment', () => {
    const assessment = createCompleteAssessment();
    expect(isFounderOnboardingComplete(assessment, 7)).toBe(true);
  });

  it('should return false when not at Stage 7', () => {
    const assessment = createCompleteAssessment();
    expect(isFounderOnboardingComplete(assessment, 6)).toBe(false);
  });

  it('should return false when completeness is not "complete"', () => {
    const assessment = createCompleteAssessment();
    assessment.completeness = 'partial';
    expect(isFounderOnboardingComplete(assessment, 7)).toBe(false);
  });

  it('should return false when keyInsights has fewer than 3 items', () => {
    const assessment = createCompleteAssessment();
    assessment.keyInsights = ['Insight 1', 'Insight 2'];
    expect(isFounderOnboardingComplete(assessment, 7)).toBe(false);
  });

  it('should return false when recommendedNextSteps has fewer than 3 items', () => {
    const assessment = createCompleteAssessment();
    assessment.recommendedNextSteps = ['Step 1', 'Step 2'];
    expect(isFounderOnboardingComplete(assessment, 7)).toBe(false);
  });

  it('should return false when keyInsights is undefined', () => {
    const assessment = createCompleteAssessment();
    delete assessment.keyInsights;
    expect(isFounderOnboardingComplete(assessment, 7)).toBe(false);
  });

  it('should return false when recommendedNextSteps is undefined', () => {
    const assessment = createCompleteAssessment();
    delete assessment.recommendedNextSteps;
    expect(isFounderOnboardingComplete(assessment, 7)).toBe(false);
  });
});

// ============================================================================
// mergeExtractedData Tests
// ============================================================================

describe('mergeExtractedData', () => {
  it('should return existing brief when extracted data is undefined', () => {
    const existing = { business_concept: 'Existing' };
    const result = mergeExtractedData(existing, undefined);
    expect(result).toEqual(existing);
  });

  it('should merge new string values', () => {
    const existing = { field1: 'Old value' };
    const extracted = { field2: 'New value' };
    const result = mergeExtractedData(existing, extracted);
    expect(result).toEqual({
      field1: 'Old value',
      field2: 'New value',
    });
  });

  it('should overwrite existing string values with new values', () => {
    const existing = { field1: 'Old value' };
    const extracted = { field1: 'New value' };
    const result = mergeExtractedData(existing, extracted);
    expect(result.field1).toBe('New value');
  });

  it('should skip undefined values', () => {
    const existing = { field1: 'Existing' };
    const extracted = { field1: undefined, field2: 'New' };
    const result = mergeExtractedData(existing, extracted);
    expect(result.field1).toBe('Existing');
    expect(result.field2).toBe('New');
  });

  it('should skip null values', () => {
    const existing = { field1: 'Existing' };
    const extracted = { field1: null };
    const result = mergeExtractedData(existing, extracted);
    expect(result.field1).toBe('Existing');
  });

  it('should skip empty string values', () => {
    const existing = { field1: 'Existing' };
    const extracted = { field1: '' };
    const result = mergeExtractedData(existing, extracted);
    expect(result.field1).toBe('Existing');
  });

  it('should append and dedupe arrays', () => {
    const existing = { items: ['A', 'B'] };
    const extracted = { items: ['B', 'C', 'D'] };
    const result = mergeExtractedData(existing, extracted);
    expect(result.items).toEqual(['A', 'B', 'C', 'D']);
  });

  it('should replace non-array with array', () => {
    const existing = { items: 'Not an array' };
    const extracted = { items: ['A', 'B'] };
    const result = mergeExtractedData(existing, extracted);
    expect(result.items).toEqual(['A', 'B']);
  });

  it('should not mutate the existing object', () => {
    const existing = { field1: 'Original' };
    const extracted = { field2: 'New' };
    mergeExtractedData(existing, extracted);
    expect(existing).toEqual({ field1: 'Original' });
  });
});

// ============================================================================
// hashMessageForIdempotency Tests
// ============================================================================

describe('hashMessageForIdempotency', () => {
  it('should return consistent hash for same inputs', () => {
    const hash1 = hashMessageForIdempotency('session-1', 5, 2, 'Hello world');
    const hash2 = hashMessageForIdempotency('session-1', 5, 2, 'Hello world');
    expect(hash1).toBe(hash2);
  });

  it('should return different hash for different session IDs', () => {
    const hash1 = hashMessageForIdempotency('session-1', 5, 2, 'Hello');
    const hash2 = hashMessageForIdempotency('session-2', 5, 2, 'Hello');
    expect(hash1).not.toBe(hash2);
  });

  it('should return different hash for different message indices', () => {
    const hash1 = hashMessageForIdempotency('session-1', 5, 2, 'Hello');
    const hash2 = hashMessageForIdempotency('session-1', 6, 2, 'Hello');
    expect(hash1).not.toBe(hash2);
  });

  it('should return different hash for different stages', () => {
    const hash1 = hashMessageForIdempotency('session-1', 5, 2, 'Hello');
    const hash2 = hashMessageForIdempotency('session-1', 5, 3, 'Hello');
    expect(hash1).not.toBe(hash2);
  });

  it('should return different hash for different messages', () => {
    const hash1 = hashMessageForIdempotency('session-1', 5, 2, 'Hello');
    const hash2 = hashMessageForIdempotency('session-1', 5, 2, 'World');
    expect(hash1).not.toBe(hash2);
  });

  it('should start with "assessment_" prefix', () => {
    const hash = hashMessageForIdempotency('session-1', 5, 2, 'Hello');
    expect(hash).toMatch(/^assessment_/);
  });

  it('should produce a reasonable length hash', () => {
    const hash = hashMessageForIdempotency('session-1', 5, 2, 'Hello');
    expect(hash.length).toBeGreaterThan(10);
    expect(hash.length).toBeLessThan(50);
  });
});

// ============================================================================
// calculateOverallProgress Tests
// ============================================================================

describe('calculateOverallProgress', () => {
  it('should return 100 when completed', () => {
    const result = calculateOverallProgress(7, 1.0, true, 50);
    expect(result).toBe(100);
  });

  it('should return 0 for Stage 1 with 0 coverage', () => {
    const result = calculateOverallProgress(1, 0, false, 0);
    expect(result).toBe(0);
  });

  it('should increase with stage number', () => {
    const stage2 = calculateOverallProgress(2, 0, false, 0);
    const stage3 = calculateOverallProgress(3, 0, false, 0);
    const stage4 = calculateOverallProgress(4, 0, false, 0);
    expect(stage3).toBeGreaterThan(stage2);
    expect(stage4).toBeGreaterThan(stage3);
  });

  it('should increase with coverage within a stage', () => {
    const low = calculateOverallProgress(3, 0.3, false, 5);
    const high = calculateOverallProgress(3, 0.8, false, 5);
    expect(high).toBeGreaterThan(low);
  });

  it('should increase with message count', () => {
    const fewMessages = calculateOverallProgress(1, 0, false, 2);
    const manyMessages = calculateOverallProgress(1, 0, false, 20);
    expect(manyMessages).toBeGreaterThan(fewMessages);
  });

  it('should cap at 95 when not completed', () => {
    const result = calculateOverallProgress(7, 1.0, false, 100);
    expect(result).toBeLessThanOrEqual(95);
  });

  it('should use quality-based progress when higher than message-based', () => {
    const result = calculateOverallProgress(4, 0.9, false, 5);
    // Stage 4 base is ~43%, plus high coverage should push higher
    expect(result).toBeGreaterThan(50);
  });
});
