/**
 * @story US-F14
 * Tests for evidence transform utilities - specifically date handling edge cases
 *
 * These tests verify that the transform functions handle null/undefined dates
 * gracefully, even though TypeScript types say dates are non-null.
 * This is defensive testing for runtime data that may not match types.
 */

import {
  transformUserEvidence,
  transformAIValidationState,
  generateTrendData,
  mergeEvidenceSources,
} from '@/lib/evidence/transform'
import { type Evidence } from '@/db/schema/evidence'
import { type CrewAIValidationState } from '@/db/schema/crewai-validation-states'

// Helper to create minimal AI validation state for testing
// Uses type assertion via unknown because we're testing edge cases where runtime data
// doesn't match TypeScript types (e.g., null dates from database)
function createTestAIState(overrides: Partial<Record<string, unknown>> = {}): CrewAIValidationState {
  return {
    id: 'state-1',
    projectId: 'proj-1',
    userId: 'user-1',
    iteration: 1,
    phase: 'ideation',
    desirabilitySignal: 'strong_positive',
    feasibilitySignal: 'unknown',
    viabilitySignal: 'unknown',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as unknown as CrewAIValidationState
}

// Helper to create minimal Evidence for testing
function createTestEvidence(overrides: Partial<Record<string, unknown>> = {}): Evidence {
  return {
    id: 'ev-1',
    projectId: 'proj-1',
    title: 'Test Evidence',
    content: 'Content',
    summary: null,
    fitType: 'Desirability',
    strength: 'medium',
    isContradiction: false,
    category: 'Research',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    sourceType: null,
    sourceUrl: null,
    tags: null,
    embedding: null,
    fullText: null,
    author: null,
    source: null,
    occurredOn: null,
    linkedAssumptions: null,
    ...overrides,
  } as unknown as Evidence
}

describe('Evidence Transform - Date Handling', () => {
  describe('generateTrendData', () => {
    it('should NOT throw RangeError when updatedAt is null', () => {
      const statesWithNullDates = [
        createTestAIState({
          updatedAt: null, // Simulating null from database
          desirabilityEvidence: { signals: [] },
        }),
      ]

      // This was throwing: RangeError: Invalid time value
      expect(() => generateTrendData(statesWithNullDates)).not.toThrow()
    })

    it('should NOT throw RangeError when updatedAt is undefined', () => {
      const statesWithUndefinedDates = [
        createTestAIState({
          updatedAt: undefined,
          desirabilityEvidence: { signals: [] },
        }),
      ]

      expect(() => generateTrendData(statesWithUndefinedDates)).not.toThrow()
    })

    it('should return valid trend data with fallback dates', () => {
      const statesWithNullDates = [
        createTestAIState({
          updatedAt: null,
          desirabilityEvidence: { signals: [] },
        }),
      ]

      const result = generateTrendData(statesWithNullDates)

      expect(result).toHaveLength(1)
      expect(result[0].date).toBeDefined()
      expect(typeof result[0].date).toBe('string')
      expect(result[0].iteration).toBe(1)
    })

    it('should handle mixed valid and invalid dates', () => {
      const mixedStates = [
        createTestAIState({
          id: 'state-1',
          updatedAt: new Date('2024-06-15T10:00:00Z'), // Valid
          desirabilityEvidence: { signals: [] },
        }),
        createTestAIState({
          id: 'state-2',
          iteration: 2,
          updatedAt: null, // Invalid
          desirabilityEvidence: { signals: [] },
        }),
      ]

      expect(() => generateTrendData(mixedStates)).not.toThrow()
      const result = generateTrendData(mixedStates)
      expect(result).toHaveLength(2)
    })
  })

  describe('transformAIValidationState', () => {
    it('should NOT throw when updatedAt is null', () => {
      const stateWithNullDate = createTestAIState({
        updatedAt: null,
        desirabilityEvidence: { signals: [] },
      })

      expect(() => transformAIValidationState(stateWithNullDate)).not.toThrow()
    })

    it('should return items with valid timestamps when input date is null', () => {
      const stateWithNullDate = createTestAIState({
        updatedAt: null,
        desirabilityEvidence: { signals: [] },
      })

      const result = transformAIValidationState(stateWithNullDate)

      expect(result.length).toBeGreaterThan(0)
      result.forEach((item) => {
        expect(item.timestamp).toBeInstanceOf(Date)
        expect(isNaN(item.timestamp.getTime())).toBe(false) // Not Invalid Date
      })
    })
  })

  describe('transformUserEvidence', () => {
    it('should NOT throw when createdAt is null', () => {
      const evidenceWithNullDate = createTestEvidence({
        createdAt: null,
      })

      expect(() => transformUserEvidence(evidenceWithNullDate)).not.toThrow()
    })

    it('should return valid timestamp when createdAt is null', () => {
      const evidenceWithNullDate = createTestEvidence({
        createdAt: null,
      })

      const result = transformUserEvidence(evidenceWithNullDate)

      expect(result.timestamp).toBeInstanceOf(Date)
      expect(isNaN(result.timestamp.getTime())).toBe(false)
    })
  })

  describe('mergeEvidenceSources', () => {
    it('should NOT throw when mixing evidence with null dates', () => {
      const userEvidence = [
        createTestEvidence({
          createdAt: null,
        }),
      ]

      const aiStates = [
        createTestAIState({
          updatedAt: null,
          desirabilityEvidence: { signals: [] },
        }),
      ]

      expect(() => mergeEvidenceSources(userEvidence, aiStates)).not.toThrow()
    })
  })
})
