/**
 * Chat API Route Tests
 *
 * Tests for the onboarding chat endpoint (/api/chat)
 * Focuses on two-pass architecture: progress calculation and backend assessment.
 *
 * Note: The actual streamText call is complex to mock, so we test
 * the key logic: progress calculation and backend assessment functions.
 *
 * @see Plan: /home/chris/.claude/plans/async-mixing-ritchie.md
 */

import {
  mergeExtractedData,
  shouldAdvanceStage,
  hashMessageForIdempotency,
  calculateOverallProgress, // Added for Erratum 4 fix
  type QualityAssessment,
} from '@/lib/onboarding/quality-assessment';

// Mock dependencies before imports
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/crewai/modal-client', () => ({
  createModalClient: jest.fn(() => ({
    kickoff: jest.fn().mockResolvedValue({ run_id: 'test-workflow-id' }),
  })),
}));

jest.mock('ai', () => ({
  streamText: jest.fn(),
}));

describe('Chat API Route', () => {
  /**
   * Progress Calculation Tests
   *
   * Uses the exported calculateOverallProgress function (Erratum 4 fix).
   * Function signature: calculateOverallProgress(stage, coverage, isCompleted, messageCount)
   *
   * Progress formula:
   * - baseProgress = Math.floor(((newStage - 1) / 7) * 100)
   * - Stage 1 = 0%, Stage 2 = 14%, Stage 3 = 28%, ..., Stage 7 = 85%
   * - Additional progress from quality assessment coverage
   * - Capped at 95% until completion
   */
  describe('Progress Calculation', () => {
    it('should calculate 0% progress for stage 1 with no coverage', () => {
      expect(calculateOverallProgress(1, 0, false, 0)).toBe(0);
    });

    it('should calculate ~14% progress for stage 2 base', () => {
      const progress = calculateOverallProgress(2, 0, false, 0);
      expect(progress).toBe(14);
    });

    it('should calculate ~28% progress for stage 3 base', () => {
      const progress = calculateOverallProgress(3, 0, false, 0);
      expect(progress).toBe(28);
    });

    it('should calculate ~85% progress for stage 7 base', () => {
      const progress = calculateOverallProgress(7, 0, false, 0);
      expect(progress).toBe(85);
    });

    it('should add coverage-based progress within stage', () => {
      // Stage 1 with 50% coverage = 0 + (0.5 * 14) = 7%
      const progress = calculateOverallProgress(1, 0.5, false, 0);
      expect(progress).toBe(7);
    });

    it('should add message-based progress as fallback', () => {
      // 26 messages * 0.5 = 13%
      const progress = calculateOverallProgress(1, 0, false, 26);
      expect(progress).toBe(13);
    });

    it('should cap progress at 95% before completion', () => {
      const progress = calculateOverallProgress(7, 1.0, false, 200);
      expect(progress).toBe(95);
    });

    it('should return 100% when completed', () => {
      expect(calculateOverallProgress(7, 1.0, true, 100)).toBe(100);
    });

    it('should use higher of quality-based or message-based progress', () => {
      // Quality-based: 0 + (0.3 * 14) = 4%
      // Message-based: 20 * 0.5 = 10%
      // Should use message-based (10%)
      const progress = calculateOverallProgress(1, 0.3, false, 20);
      expect(progress).toBe(10);
    });
  });

  /**
   * Backend Assessment Tests
   *
   * Two-pass architecture: LLM generates conversation (Pass 1),
   * backend ALWAYS runs quality assessment (Pass 2).
   *
   * These tests verify the assessment utility functions imported from
   * quality-assessment.ts that are used in the route's onFinish callback.
   */
  describe('Backend Assessment', () => {
    describe('mergeExtractedData', () => {
      it('should merge new data into existing brief', () => {
        const existing = { business_concept: 'old idea' };
        const extracted = { target_customers: ['B2B SaaS'] };
        const merged = mergeExtractedData(existing, extracted);

        expect(merged).toEqual({
          business_concept: 'old idea',
          target_customers: ['B2B SaaS'],
        });
      });

      it('should append arrays instead of replacing', () => {
        const existing = { competitors: ['Competitor A'] };
        const extracted = { competitors: ['Competitor B'] };
        const merged = mergeExtractedData(existing, extracted);

        expect(merged.competitors).toEqual(['Competitor A', 'Competitor B']);
      });

      it('should dedupe arrays when merging', () => {
        const existing = { competitors: ['A', 'B'] };
        const extracted = { competitors: ['B', 'C'] };
        const merged = mergeExtractedData(existing, extracted);

        expect(merged.competitors).toEqual(['A', 'B', 'C']);
      });

      it('should overwrite non-array values', () => {
        const existing = { business_concept: 'old' };
        const extracted = { business_concept: 'updated' };
        const merged = mergeExtractedData(existing, extracted);

        expect(merged.business_concept).toBe('updated');
      });

      it('should handle undefined extractedData', () => {
        const existing = { business_concept: 'test' };
        const merged = mergeExtractedData(existing, undefined);

        expect(merged).toEqual({ business_concept: 'test' });
      });

      it('should skip empty string values', () => {
        const existing = { business_concept: 'test' };
        const extracted = { inspiration: '' };
        const merged = mergeExtractedData(existing, extracted);

        expect(merged).toEqual({ business_concept: 'test' });
        expect(merged).not.toHaveProperty('inspiration');
      });
    });

    describe('shouldAdvanceStage', () => {
      // Topic-based advancement: advances when 75%+ of topics are covered
      // Stage 1 has 4 topics: business_concept, inspiration, current_stage, founder_background

      it('should return true when 75%+ topics covered (topic-based advancement)', () => {
        const assessment: QualityAssessment = {
          topicsCovered: ['business_concept', 'inspiration', 'current_stage'], // 3 of 4 = 75%
          coverage: 0.75,
          clarity: 'high',
          completeness: 'complete',
          notes: 'Good progress',
        };
        expect(shouldAdvanceStage(assessment, 1)).toBe(true);
      });

      it('should return false when only 50% topics covered', () => {
        const assessment: QualityAssessment = {
          topicsCovered: ['business_concept', 'inspiration'], // 2 of 4 = 50%
          coverage: 0.5,
          clarity: 'medium',
          completeness: 'partial',
          notes: 'Needs more detail',
        };
        expect(shouldAdvanceStage(assessment, 1)).toBe(false);
      });

      it('should advance via message fallback even with low topic coverage', () => {
        const assessment: QualityAssessment = {
          topicsCovered: ['business_concept'], // Only 1 of 4 = 25%
          coverage: 0.6, // 60% coverage meets fallback threshold
          clarity: 'high',
          completeness: 'partial',
          notes: 'Low topic coverage but fallback applies',
        };
        // With 6+ messages, fallback kicks in
        expect(shouldAdvanceStage(assessment, 1, 6)).toBe(true);
      });

      it('should return false at stage 7 (cannot advance past final)', () => {
        const assessment: QualityAssessment = {
          topicsCovered: ['short_term_goals', 'success_metrics', 'priorities', 'first_experiment'],
          coverage: 1.0,
          clarity: 'high',
          completeness: 'complete',
          notes: 'All done',
        };
        expect(shouldAdvanceStage(assessment, 7)).toBe(false);
      });
    });

    describe('hashMessageForIdempotency', () => {
      it('should produce consistent hash for same inputs', () => {
        const hash1 = hashMessageForIdempotency('session1', 5, 2, 'hello');
        const hash2 = hashMessageForIdempotency('session1', 5, 2, 'hello');

        expect(hash1).toBe(hash2);
      });

      it('should produce different hash for different messages', () => {
        const hash1 = hashMessageForIdempotency('session1', 5, 2, 'hello');
        const hash2 = hashMessageForIdempotency('session1', 5, 2, 'world');

        expect(hash1).not.toBe(hash2);
      });

      it('should produce different hash for same message at different index', () => {
        const hash1 = hashMessageForIdempotency('session1', 5, 2, 'yes');
        const hash2 = hashMessageForIdempotency('session1', 7, 2, 'yes');

        expect(hash1).not.toBe(hash2);
      });

      it('should produce different hash for same message at different stage', () => {
        const hash1 = hashMessageForIdempotency('session1', 5, 2, 'yes');
        const hash2 = hashMessageForIdempotency('session1', 5, 3, 'yes');

        expect(hash1).not.toBe(hash2);
      });

      it('should produce different hash for different sessions', () => {
        const hash1 = hashMessageForIdempotency('session1', 5, 2, 'hello');
        const hash2 = hashMessageForIdempotency('session2', 5, 2, 'hello');

        expect(hash1).not.toBe(hash2);
      });

      it('should return string starting with assessment_', () => {
        const hash = hashMessageForIdempotency('session1', 5, 2, 'hello');

        expect(hash).toMatch(/^assessment_[a-f0-9]+$/);
      });
    });
  });

  describe('Empty Response Handling', () => {
    it('should skip saving empty AI responses', () => {
      const text: string = '';
      const shouldSave = !!(text && text.trim().length > 0);

      expect(shouldSave).toBe(false);
    });

    it('should skip saving whitespace-only responses', () => {
      const text: string = '   \n\t  ';
      const shouldSave = !!(text && text.trim().length > 0);

      expect(shouldSave).toBe(false);
    });

    it('should save valid responses', () => {
      const text: string = 'Hello! Tell me about your business idea.';
      const shouldSave = !!(text && text.trim().length > 0);

      expect(shouldSave).toBe(true);
    });
  });
});
