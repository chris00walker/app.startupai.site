/**
 * @story US-F14
 */
/**
 * useUnifiedEvidence Hook
 *
 * Fetches and merges evidence from two sources:
 * 1. User-created evidence from the `evidence` table
 * 2. AI-generated evidence from `crewai_validation_states` table
 *
 * Provides a unified list for the Evidence Explorer with real-time updates.
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Evidence } from '@/db/schema/evidence'
import type {
  UnifiedEvidenceItem,
  EvidenceFilters,
  EvidenceSummary,
  TrendDataPoint,
  CrewAIValidationEvidenceState,
} from '@/types/evidence-explorer'
import { DEFAULT_EVIDENCE_FILTERS } from '@/types/evidence-explorer'
import { fetchEvidenceSources } from '@/lib/evidence/data-access'
import {
  mergeEvidenceSources,
  filterEvidence,
  calculateEvidenceSummary,
  generateTrendData,
} from '@/lib/evidence/transform'

interface UseUnifiedEvidenceOptions {
  initialFilters?: Partial<EvidenceFilters>
}

interface UseUnifiedEvidenceResult {
  // Data
  unifiedEvidence: UnifiedEvidenceItem[]
  filteredEvidence: UnifiedEvidenceItem[]
  userEvidence: Evidence[]
  aiStates: CrewAIValidationEvidenceState[]
  summary: EvidenceSummary
  trendData: TrendDataPoint[]

  // State
  isLoading: boolean
  error: Error | null

  // Filters
  filters: EvidenceFilters
  setFilters: (filters: EvidenceFilters) => void
  updateFilter: <K extends keyof EvidenceFilters>(key: K, value: EvidenceFilters[K]) => void
  resetFilters: () => void

  // Actions
  refetch: () => Promise<void>
}

export function useUnifiedEvidence(
  projectId: string | undefined,
  options: UseUnifiedEvidenceOptions = {}
): UseUnifiedEvidenceResult {
  const supabase = createClient()

  // Raw data state
  const [userEvidence, setUserEvidence] = useState<Evidence[]>([])
  const [aiStates, setAIStates] = useState<CrewAIValidationEvidenceState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Filter state
  const [filters, setFilters] = useState<EvidenceFilters>(() => ({
    ...DEFAULT_EVIDENCE_FILTERS,
    ...options.initialFilters,
  }))

  // Fetch data from both sources
  const fetchData = useCallback(async () => {
    if (!projectId) {
      setUserEvidence([])
      setAIStates([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { userEvidence: evidenceRows, aiStates: validationStates } =
        await fetchEvidenceSources(projectId, {
          supabase,
          policy: { mode: 'open', source: 'useUnifiedEvidence' },
        })

      setUserEvidence(evidenceRows)
      setAIStates(validationStates)
    } catch (err) {
      console.error('Error fetching evidence:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!projectId) return

    // Subscribe to evidence table changes
    const evidenceChannel = supabase
      .channel(`evidence-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidence',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // Re-fetch on any evidence change
          fetchData()
        }
      )
      .subscribe()

    // Subscribe to validation state changes
    const validationChannel = supabase
      .channel(`validation-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crewai_validation_states',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // Re-fetch on any validation state change
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(evidenceChannel)
      supabase.removeChannel(validationChannel)
    }
  }, [projectId, fetchData, supabase])

  // Compute unified evidence
  const unifiedEvidence = useMemo(() => {
    return mergeEvidenceSources(userEvidence, aiStates)
  }, [userEvidence, aiStates])

  // Apply filters
  const filteredEvidence = useMemo(() => {
    return filterEvidence(unifiedEvidence, filters)
  }, [unifiedEvidence, filters])

  // Calculate summary
  const summary = useMemo(() => {
    return calculateEvidenceSummary(unifiedEvidence)
  }, [unifiedEvidence])

  // Generate trend data
  const trendData = useMemo(() => {
    return generateTrendData(aiStates)
  }, [aiStates])

  // Filter helpers
  const updateFilter = useCallback(
    <K extends keyof EvidenceFilters>(key: K, value: EvidenceFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_EVIDENCE_FILTERS)
  }, [])

  return {
    // Data
    unifiedEvidence,
    filteredEvidence,
    userEvidence,
    aiStates,
    summary,
    trendData,

    // State
    isLoading,
    error,

    // Filters
    filters,
    setFilters,
    updateFilter,
    resetFilters,

    // Actions
    refetch: fetchData,
  }
}

/**
 * Hook for fetching evidence trend data only (lighter weight)
 */
export function useEvidenceTrend(projectId: string | undefined) {
  const { trendData, aiStates, isLoading, error } = useUnifiedEvidence(projectId)

  return {
    trendData,
    aiStates,
    isLoading,
    error,
  }
}
