/**
 * Evidence Transform Utilities
 *
 * Functions to transform evidence from different sources into a unified format
 * for the Evidence Explorer.
 * @story US-F14
 */

import type { Evidence } from '@/db/schema/evidence'
import type {
  UnifiedEvidenceItem,
  UserEvidenceItem,
  AIEvidenceItem,
  EvidenceDimension,
  EvidenceSummary,
  TrendDataPoint,
  EvidenceFilters,
  CrewAIValidationEvidenceState,
} from '@/types/evidence-explorer'
import { signalToStrength, signalToNumeric, getSignalDisplayInfo } from '@/types/evidence-explorer'
import { format, isValid } from 'date-fns'

/**
 * Safely parse a date value, returning current date as fallback for invalid values
 */
function safeParseDate(value: string | Date | null | undefined): Date {
  if (!value) {
    return new Date()
  }
  const date = value instanceof Date ? value : new Date(value)
  return isValid(date) ? date : new Date()
}

// =======================================================================================
// USER EVIDENCE TRANSFORMATION
// =======================================================================================

/**
 * Transform user-created evidence to unified format
 */
export function transformUserEvidence(evidence: Evidence): UserEvidenceItem {
  const dimension = fitTypeToDimension(evidence.fitType)

  return {
    source: 'user',
    id: evidence.id,
    data: evidence,
    timestamp: safeParseDate(evidence.createdAt),
    dimension,
    title: evidence.title || 'Untitled Evidence',
    strength: evidence.strength || 'medium',
    isContradiction: evidence.isContradiction || false,
    category: evidence.evidenceCategory || 'Research',
  }
}

/**
 * Convert fitType to dimension
 */
function fitTypeToDimension(fitType: string | null | undefined): EvidenceDimension {
  switch (fitType) {
    case 'Desirability':
      return 'desirability'
    case 'Feasibility':
      return 'feasibility'
    case 'Viability':
      return 'viability'
    default:
      return 'desirability'
  }
}

// =======================================================================================
// AI EVIDENCE TRANSFORMATION
// =======================================================================================

/**
 * Transform CrewAI validation state to AI evidence items
 * Each state can produce up to 3 evidence items (one per dimension)
 */
export function transformAIValidationState(state: CrewAIValidationEvidenceState): AIEvidenceItem[] {
  const items: AIEvidenceItem[] = []
  const timestamp = safeParseDate(state.updatedAt)

  // Desirability Evidence
  if (state.desirabilityEvidence && state.desirabilitySignal !== 'no_signal') {
    const signalInfo = getSignalDisplayInfo(state.desirabilitySignal, 'desirability')
    items.push({
      source: 'ai',
      id: `${state.id}-desirability`,
      dimension: 'desirability',
      signal: state.desirabilitySignal,
      evidence: state.desirabilityEvidence,
      timestamp,
      title: `AI Analysis: ${signalInfo.label}`,
      strength: signalToStrength(state.desirabilitySignal),
      iteration: state.iteration,
      validationStateId: state.id,
    })
  }

  // Feasibility Evidence
  if (state.feasibilityEvidence && state.feasibilitySignal !== 'unknown') {
    const signalInfo = getSignalDisplayInfo(state.feasibilitySignal, 'feasibility')
    items.push({
      source: 'ai',
      id: `${state.id}-feasibility`,
      dimension: 'feasibility',
      signal: state.feasibilitySignal,
      evidence: state.feasibilityEvidence,
      timestamp,
      title: `AI Analysis: ${signalInfo.label}`,
      strength: signalToStrength(state.feasibilitySignal),
      iteration: state.iteration,
      validationStateId: state.id,
    })
  }

  // Viability Evidence
  if (state.viabilityEvidence && state.viabilitySignal !== 'unknown') {
    const signalInfo = getSignalDisplayInfo(state.viabilitySignal, 'viability')
    items.push({
      source: 'ai',
      id: `${state.id}-viability`,
      dimension: 'viability',
      signal: state.viabilitySignal,
      evidence: state.viabilityEvidence,
      timestamp,
      title: `AI Analysis: ${signalInfo.label}`,
      strength: signalToStrength(state.viabilitySignal),
      iteration: state.iteration,
      validationStateId: state.id,
    })
  }

  return items
}

// =======================================================================================
// MERGE & SORT
// =======================================================================================

/**
 * Merge user evidence and AI validation states into unified list
 * Sorted by timestamp (most recent first)
 */
export function mergeEvidenceSources(
  userEvidence: Evidence[],
  aiStates: CrewAIValidationEvidenceState[]
): UnifiedEvidenceItem[] {
  // Transform user evidence
  const userItems: UnifiedEvidenceItem[] = userEvidence.map(transformUserEvidence)

  // Transform AI states (each state produces multiple evidence items)
  const aiItems: UnifiedEvidenceItem[] = aiStates.flatMap(transformAIValidationState)

  // Merge and sort by timestamp (most recent first)
  const merged = [...userItems, ...aiItems].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )

  return merged
}

// =======================================================================================
// FILTERING
// =======================================================================================

/**
 * Apply filters to unified evidence list
 */
export function filterEvidence(
  evidence: UnifiedEvidenceItem[],
  filters: EvidenceFilters
): UnifiedEvidenceItem[] {
  return evidence.filter((item) => {
    // Dimension filter
    if (filters.dimension !== 'all' && item.dimension !== filters.dimension) {
      return false
    }

    // Source filter
    if (filters.source !== 'all' && item.source !== filters.source) {
      return false
    }

    // Strength filter
    if (filters.strength !== 'all' && item.strength !== filters.strength) {
      return false
    }

    // Contradictions filter (only applies to user evidence)
    if (filters.showContradictions && item.source === 'user' && !item.isContradiction) {
      return false
    }

    // Date range filter
    if (filters.dateRange) {
      const itemDate = item.timestamp.getTime()
      const startDate = filters.dateRange.start.getTime()
      const endDate = filters.dateRange.end.getTime()
      if (itemDate < startDate || itemDate > endDate) {
        return false
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesTitle = item.title.toLowerCase().includes(searchLower)

      if (item.source === 'user') {
        const userItem = item as UserEvidenceItem
        const matchesContent =
          userItem.data.content?.toLowerCase().includes(searchLower) ||
          userItem.data.summary?.toLowerCase().includes(searchLower)
        return matchesTitle || matchesContent
      }

      return matchesTitle
    }

    return true
  })
}

// =======================================================================================
// ANALYTICS & SUMMARY
// =======================================================================================

/**
 * Calculate evidence summary statistics
 */
export function calculateEvidenceSummary(evidence: UnifiedEvidenceItem[]): EvidenceSummary {
  const summary: EvidenceSummary = {
    total: evidence.length,
    byDimension: {
      desirability: 0,
      feasibility: 0,
      viability: 0,
    },
    byStrength: {
      weak: 0,
      medium: 0,
      strong: 0,
    },
    bySource: {
      user: 0,
      ai: 0,
    },
    contradictions: 0,
  }

  for (const item of evidence) {
    // Count by dimension
    summary.byDimension[item.dimension]++

    // Count by strength
    summary.byStrength[item.strength]++

    // Count by source
    summary.bySource[item.source]++

    // Count contradictions (user evidence only)
    if (item.source === 'user' && item.isContradiction) {
      summary.contradictions++
    }
  }

  return summary
}

/**
 * Generate trend data points from AI validation states
 * Used for Recharts visualization
 */
export function generateTrendData(aiStates: CrewAIValidationEvidenceState[]): TrendDataPoint[] {
  // Sort by timestamp ascending for trend display
  const sortedStates = [...aiStates].sort(
    (a, b) => safeParseDate(a.updatedAt).getTime() - safeParseDate(b.updatedAt).getTime()
  )

  return sortedStates.map((state) => ({
    date: format(safeParseDate(state.updatedAt), 'MMM dd'),
    desirability: signalToNumeric(state.desirabilitySignal),
    feasibility: signalToNumeric(state.feasibilitySignal),
    viability: signalToNumeric(state.viabilitySignal),
    evidenceCount: countEvidenceInState(state),
    iteration: state.iteration,
  }))
}

/**
 * Count evidence items in a validation state
 */
function countEvidenceInState(state: CrewAIValidationEvidenceState): number {
  let count = 0
  if (state.desirabilityEvidence) count++
  if (state.feasibilityEvidence) count++
  if (state.viabilityEvidence) count++
  return count
}

// =======================================================================================
// GROUPING
// =======================================================================================

/**
 * Group evidence by date for timeline display
 */
export function groupEvidenceByDate(
  evidence: UnifiedEvidenceItem[]
): Map<string, UnifiedEvidenceItem[]> {
  const groups = new Map<string, UnifiedEvidenceItem[]>()

  for (const item of evidence) {
    const dateKey = format(item.timestamp, 'MMMM yyyy')
    const existing = groups.get(dateKey) || []
    existing.push(item)
    groups.set(dateKey, existing)
  }

  return groups
}

/**
 * Group evidence by dimension for tabbed display
 */
export function groupEvidenceByDimension(
  evidence: UnifiedEvidenceItem[]
): Record<EvidenceDimension, UnifiedEvidenceItem[]> {
  return {
    desirability: evidence.filter((e) => e.dimension === 'desirability'),
    feasibility: evidence.filter((e) => e.dimension === 'feasibility'),
    viability: evidence.filter((e) => e.dimension === 'viability'),
  }
}
