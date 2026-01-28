/**
 * @story US-F06, US-F16
 */
/**
 * useCrewAIReport Hook
 *
 * Fetches CrewAI validation state and transforms it into organized report sections
 * for the comprehensive report viewer. Provides both D-F-V Risk Axis and
 * Strategyzer Phase organization.
 */

import { useMemo } from 'react'
import { useCrewAIState } from './useCrewAIState'
import {
  extractReportData,
  countPopulatedFields,
  hasDesirabilityData,
  hasFeasibilityData,
  hasViabilityData,
  hasGovernanceData,
  type ReportData,
} from '@/lib/reports/field-extractors'

export interface UseCrewAIReportOptions {
  projectId: string
  autoRefresh?: boolean
  refreshIntervalMs?: number
}

export interface UseCrewAIReportResult {
  // Organized report data
  reportData: ReportData | null

  // Loading and error states
  isLoading: boolean
  error: Error | null

  // Actions
  refetch: () => Promise<void>

  // Convenience flags
  hasData: boolean
  populatedFieldCount: number
  hasDesirability: boolean
  hasFeasibility: boolean
  hasViability: boolean
  hasGovernance: boolean
}

/**
 * Hook for fetching and organizing CrewAI report data
 *
 * @example
 * ```tsx
 * const { reportData, isLoading, hasData } = useCrewAIReport({ projectId })
 *
 * if (!hasData) return <EmptyState />
 *
 * return (
 *   <Tabs>
 *     <TabsContent value="desirability">
 *       <DesirabilitySection data={reportData.desirability} />
 *     </TabsContent>
 *   </Tabs>
 * )
 * ```
 */
export function useCrewAIReport(options: UseCrewAIReportOptions): UseCrewAIReportResult {
  const { projectId, autoRefresh = false, refreshIntervalMs = 30000 } = options

  const {
    validationState,
    isLoading,
    error,
    refetch,
  } = useCrewAIState({
    projectId,
    autoRefresh,
    refreshIntervalMs,
  })

  // Transform raw state into organized report sections
  const reportData = useMemo(() => {
    return extractReportData(validationState)
  }, [validationState])

  // Compute convenience flags
  const hasData = reportData !== null
  const populatedFieldCount = useMemo(() => {
    return reportData ? countPopulatedFields(reportData) : 0
  }, [reportData])

  const hasDesirability = useMemo(() => {
    return reportData ? hasDesirabilityData(reportData.desirability) : false
  }, [reportData])

  const hasFeasibility = useMemo(() => {
    return reportData ? hasFeasibilityData(reportData.feasibility) : false
  }, [reportData])

  const hasViability = useMemo(() => {
    return reportData ? hasViabilityData(reportData.viability) : false
  }, [reportData])

  const hasGovernance = useMemo(() => {
    return reportData ? hasGovernanceData(reportData.governance) : false
  }, [reportData])

  return {
    reportData,
    isLoading,
    error,
    refetch,
    hasData,
    populatedFieldCount,
    hasDesirability,
    hasFeasibility,
    hasViability,
    hasGovernance,
  }
}

export default useCrewAIReport
