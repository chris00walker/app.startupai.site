/**
 * @story US-F14
 */

import { isValid } from 'date-fns'
import {
  getEvidenceValidationPolicy,
  parseEvidenceRows,
  parseValidationStateRows,
} from '@/lib/evidence/boundary'

const basePolicy = getEvidenceValidationPolicy({
  source: 'evidence-boundary-test',
  mode: 'open',
  strict: false,
  sampleRate: 0,
})

describe('Evidence Boundary Validation', () => {
  describe('parseEvidenceRows', () => {
    it('maps snake_case rows to Evidence with safe dates', () => {
      const rows = [
        {
          id: 'ev-1',
          project_id: 'proj-1',
          title: 'Test Evidence',
          category: 'Research',
          summary: null,
          full_text: null,
          content: 'Evidence content',
          embedding: null,
          strength: 'medium',
          is_contradiction: false,
          fit_type: 'Desirability',
          source_type: 'user_input',
          source_url: null,
          author: null,
          source: null,
          occurred_on: '2024-01-01',
          linked_assumptions: ['assumption-1'],
          tags: ['tag-1'],
          created_at: '2024-01-02T00:00:00Z',
          updated_at: null,
        },
      ]

      const result = parseEvidenceRows(rows, basePolicy)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('ev-1')
      expect(result[0].projectId).toBe('proj-1')
      expect(result[0].createdAt).toBeInstanceOf(Date)
      expect(isValid(result[0].createdAt)).toBe(true)
      expect(result[0].updatedAt).toBeInstanceOf(Date)
      expect(isValid(result[0].updatedAt)).toBe(true)
    })

    it('drops invalid rows in open mode', () => {
      const rows = [{ project_id: 'proj-1' }]

      const result = parseEvidenceRows(rows, basePolicy)

      expect(result).toHaveLength(0)
    })

    it('throws in closed mode when validation fails', () => {
      const rows = [{ project_id: 'proj-1' }]
      const closedPolicy = { ...basePolicy, mode: 'closed' as const }

      expect(() => parseEvidenceRows(rows, closedPolicy)).toThrow(
        'Evidence boundary validation failed'
      )
    })
  })

  describe('parseValidationStateRows', () => {
    it('maps snake_case rows with defaults', () => {
      const rows = [
        {
          id: 'state-1',
          iteration: null,
          updated_at: null,
          desirability_signal: 'no_signal',
          feasibility_signal: 'unknown',
          viability_signal: 'unknown',
          desirability_evidence: null,
          feasibility_evidence: null,
          viability_evidence: null,
        },
      ]

      const result = parseValidationStateRows(rows, basePolicy)

      expect(result).toHaveLength(1)
      expect(result[0].iteration).toBe(1)
      expect(result[0].updatedAt).toBeInstanceOf(Date)
      expect(isValid(result[0].updatedAt as Date)).toBe(true)
    })

    it('drops rows with invalid signals in open mode', () => {
      const rows = [
        {
          id: 'state-1',
          desirability_signal: 'strong_positive',
        },
      ]

      const result = parseValidationStateRows(rows, basePolicy)

      expect(result).toHaveLength(0)
    })
  })
})
