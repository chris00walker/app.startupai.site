/**
 * @story US-F14
 * Tests for evidence transform utilities - specifically date handling edge cases
 */

import {
  transformUserEvidence,
  transformAIValidationState,
  generateTrendData,
  mergeEvidenceSources,
} from '@/lib/evidence/transform'
import type { Evidence } from '@/db/schema/evidence'
import type { CrewAIValidationState } from '@/db/schema/crewai-validation-states'

describe('Evidence Transform - Date Handling', () => {
  describe('generateTrendData', () => {
    it('should NOT throw RangeError when updatedAt is null', () => {
      const statesWithNullDates: CrewAIValidationState[] = [
        {
          id: 'state-1',
          projectId: 'proj-1',
          iteration: 1,
          updatedAt: null as unknown as string, // Simulating null from database
          createdAt: '2024-01-01T00:00:00Z',
          desirabilitySignal: 'strong_positive',
          desirabilityEvidence: 'Some evidence',
          feasibilitySignal: 'unknown',
          feasibilityEvidence: null,
          viabilitySignal: 'unknown',
          viabilityEvidence: null,
        },
      ]

      // This was throwing: RangeError: Invalid time value
      expect(() => generateTrendData(statesWithNullDates)).not.toThrow()
    })

    it('should NOT throw RangeError when updatedAt is undefined', () => {
      const statesWithUndefinedDates: CrewAIValidationState[] = [
        {
          id: 'state-1',
          projectId: 'proj-1',
          iteration: 1,
          updatedAt: undefined as unknown as string,
          createdAt: '2024-01-01T00:00:00Z',
          desirabilitySignal: 'weak_positive',
          desirabilityEvidence: 'Evidence text',
          feasibilitySignal: 'unknown',
          feasibilityEvidence: null,
          viabilitySignal: 'unknown',
          viabilityEvidence: null,
        },
      ]

      expect(() => generateTrendData(statesWithUndefinedDates)).not.toThrow()
    })

    it('should return valid trend data with fallback dates', () => {
      const statesWithNullDates: CrewAIValidationState[] = [
        {
          id: 'state-1',
          projectId: 'proj-1',
          iteration: 1,
          updatedAt: null as unknown as string,
          createdAt: '2024-01-01T00:00:00Z',
          desirabilitySignal: 'strong_positive',
          desirabilityEvidence: 'Evidence',
          feasibilitySignal: 'unknown',
          feasibilityEvidence: null,
          viabilitySignal: 'unknown',
          viabilityEvidence: null,
        },
      ]

      const result = generateTrendData(statesWithNullDates)

      expect(result).toHaveLength(1)
      expect(result[0].date).toBeDefined()
      expect(typeof result[0].date).toBe('string')
      expect(result[0].iteration).toBe(1)
    })

    it('should handle mixed valid and invalid dates', () => {
      const mixedStates: CrewAIValidationState[] = [
        {
          id: 'state-1',
          projectId: 'proj-1',
          iteration: 1,
          updatedAt: '2024-06-15T10:00:00Z', // Valid
          createdAt: '2024-06-15T10:00:00Z',
          desirabilitySignal: 'strong_positive',
          desirabilityEvidence: 'Evidence 1',
          feasibilitySignal: 'unknown',
          feasibilityEvidence: null,
          viabilitySignal: 'unknown',
          viabilityEvidence: null,
        },
        {
          id: 'state-2',
          projectId: 'proj-1',
          iteration: 2,
          updatedAt: null as unknown as string, // Invalid
          createdAt: '2024-06-16T10:00:00Z',
          desirabilitySignal: 'weak_positive',
          desirabilityEvidence: 'Evidence 2',
          feasibilitySignal: 'unknown',
          feasibilityEvidence: null,
          viabilitySignal: 'unknown',
          viabilityEvidence: null,
        },
      ]

      expect(() => generateTrendData(mixedStates)).not.toThrow()
      const result = generateTrendData(mixedStates)
      expect(result).toHaveLength(2)
    })
  })

  describe('transformAIValidationState', () => {
    it('should NOT throw when updatedAt is null', () => {
      const stateWithNullDate: CrewAIValidationState = {
        id: 'state-1',
        projectId: 'proj-1',
        iteration: 1,
        updatedAt: null as unknown as string,
        createdAt: '2024-01-01T00:00:00Z',
        desirabilitySignal: 'strong_positive',
        desirabilityEvidence: 'Some evidence',
        feasibilitySignal: 'unknown',
        feasibilityEvidence: null,
        viabilitySignal: 'unknown',
        viabilityEvidence: null,
      }

      expect(() => transformAIValidationState(stateWithNullDate)).not.toThrow()
    })

    it('should return items with valid timestamps when input date is null', () => {
      const stateWithNullDate: CrewAIValidationState = {
        id: 'state-1',
        projectId: 'proj-1',
        iteration: 1,
        updatedAt: null as unknown as string,
        createdAt: '2024-01-01T00:00:00Z',
        desirabilitySignal: 'strong_positive',
        desirabilityEvidence: 'Some evidence',
        feasibilitySignal: 'unknown',
        feasibilityEvidence: null,
        viabilitySignal: 'unknown',
        viabilityEvidence: null,
      }

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
      const evidenceWithNullDate: Evidence = {
        id: 'ev-1',
        projectId: 'proj-1',
        title: 'Test Evidence',
        content: 'Content',
        summary: null,
        fitType: 'Desirability',
        strength: 'medium',
        isContradiction: false,
        category: 'Research',
        createdAt: null as unknown as Date,
        updatedAt: null as unknown as Date,
        userId: 'user-1',
        sourceType: null,
        sourceUrl: null,
        tags: null,
      }

      expect(() => transformUserEvidence(evidenceWithNullDate)).not.toThrow()
    })

    it('should return valid timestamp when createdAt is null', () => {
      const evidenceWithNullDate: Evidence = {
        id: 'ev-1',
        projectId: 'proj-1',
        title: 'Test Evidence',
        content: 'Content',
        summary: null,
        fitType: 'Desirability',
        strength: 'medium',
        isContradiction: false,
        category: 'Research',
        createdAt: null as unknown as Date,
        updatedAt: null as unknown as Date,
        userId: 'user-1',
        sourceType: null,
        sourceUrl: null,
        tags: null,
      }

      const result = transformUserEvidence(evidenceWithNullDate)

      expect(result.timestamp).toBeInstanceOf(Date)
      expect(isNaN(result.timestamp.getTime())).toBe(false)
    })
  })

  describe('mergeEvidenceSources', () => {
    it('should NOT throw when mixing evidence with null dates', () => {
      const userEvidence: Evidence[] = [
        {
          id: 'ev-1',
          projectId: 'proj-1',
          title: 'User Evidence',
          content: 'Content',
          summary: null,
          fitType: 'Desirability',
          strength: 'medium',
          isContradiction: false,
          category: 'Research',
          createdAt: null as unknown as Date,
          updatedAt: null as unknown as Date,
          userId: 'user-1',
          sourceType: null,
          sourceUrl: null,
          tags: null,
        },
      ]

      const aiStates: CrewAIValidationState[] = [
        {
          id: 'state-1',
          projectId: 'proj-1',
          iteration: 1,
          updatedAt: null as unknown as string,
          createdAt: '2024-01-01T00:00:00Z',
          desirabilitySignal: 'strong_positive',
          desirabilityEvidence: 'AI Evidence',
          feasibilitySignal: 'unknown',
          feasibilityEvidence: null,
          viabilitySignal: 'unknown',
          viabilityEvidence: null,
        },
      ]

      expect(() => mergeEvidenceSources(userEvidence, aiStates)).not.toThrow()
    })
  })
})
