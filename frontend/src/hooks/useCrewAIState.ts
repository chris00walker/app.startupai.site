/**
 * CrewAI State Hooks
 *
 * React hooks for fetching and managing CrewAI validation state.
 * These hooks integrate with the CrewAI types defined in @/types/crewai.ts
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  StartupValidationState,
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
  Phase,
  PivotType,
  DesirabilityEvidence,
  FeasibilityEvidence,
  ViabilityEvidence,
} from '@/types/crewai'

// ============================================================================
// TYPES
// ============================================================================

export interface InnovationPhysicsSignals {
  desirability: DesirabilitySignal
  feasibility: FeasibilitySignal
  viability: ViabilitySignal
  phase: Phase
  pivotRecommendation: PivotType
}

export interface CrewAIStateOptions {
  projectId?: string
  autoRefresh?: boolean
  refreshIntervalMs?: number
}

export interface UseCrewAIStateResult {
  validationState: Partial<StartupValidationState> | null
  signals: InnovationPhysicsSignals | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseInnovationSignalsResult {
  signals: InnovationPhysicsSignals | null
  desirabilityEvidence: DesirabilityEvidence | null
  feasibilityEvidence: FeasibilityEvidence | null
  viabilityEvidence: ViabilityEvidence | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// ============================================================================
// useCrewAIState - Main hook for CrewAI validation state
// ============================================================================

/**
 * Hook to fetch and manage CrewAI validation state for a project
 *
 * @param options - Configuration options
 * @returns CrewAI validation state, signals, loading state, and error
 *
 * @example
 * ```tsx
 * const { validationState, signals, isLoading } = useCrewAIState({ projectId: 'xxx' })
 *
 * if (signals?.desirability === 'strong_commitment') {
 *   // Show success indicator
 * }
 * ```
 */
export function useCrewAIState(options: CrewAIStateOptions = {}): UseCrewAIStateResult {
  const { projectId, autoRefresh = false, refreshIntervalMs = 30000 } = options
  const supabase = useMemo(() => createClient(), [])

  const [validationState, setValidationState] = useState<Partial<StartupValidationState> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchState = useCallback(async () => {
    if (!projectId) {
      setValidationState(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch the latest validation state from crewai_validation_states table
      const { data, error: queryError } = await supabase
        .from('crewai_validation_states')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (queryError) {
        // If no state exists yet, that's OK - just return null
        if (queryError.code === 'PGRST116') {
          setValidationState(null)
        } else {
          throw queryError
        }
      } else if (data) {
        // Map database record to StartupValidationState
        setValidationState({
          id: data.id,
          project_id: data.project_id,
          phase: data.phase || 'ideation',
          desirability_signal: data.desirability_signal || 'no_signal',
          feasibility_signal: data.feasibility_signal || 'unknown',
          viability_signal: data.viability_signal || 'unknown',
          last_pivot_type: data.last_pivot_type || 'none',
          pending_pivot_type: data.pending_pivot_type || 'none',
          human_approval_status: data.human_approval_status || 'not_required',
          human_input_required: data.human_input_required || false,
          // Evidence containers
          desirability_evidence: data.desirability_evidence,
          feasibility_evidence: data.feasibility_evidence,
          viability_evidence: data.viability_evidence,
          // Metrics
          cac: data.cac,
          ltv: data.ltv,
          ltv_cac_ratio: data.ltv_cac_ratio,
          gross_margin: data.gross_margin,
          tam: data.tam,
          // Budget
          daily_spend_usd: data.daily_spend_usd,
          campaign_spend_usd: data.campaign_spend_usd,
          budget_status: data.budget_status,
          // Output
          evidence_summary: data.evidence_summary,
          final_recommendation: data.final_recommendation,
          next_steps: data.next_steps || [],
        })
      }
    } catch (err) {
      console.error('[useCrewAIState] Error fetching state:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, supabase])

  // Initial fetch
  useEffect(() => {
    fetchState()
  }, [fetchState])

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !projectId) return

    const intervalId = setInterval(fetchState, refreshIntervalMs)
    return () => clearInterval(intervalId)
  }, [autoRefresh, projectId, refreshIntervalMs, fetchState])

  // Derive signals from state
  const signals = useMemo<InnovationPhysicsSignals | null>(() => {
    if (!validationState) return null

    return {
      desirability: validationState.desirability_signal || 'no_signal',
      feasibility: validationState.feasibility_signal || 'unknown',
      viability: validationState.viability_signal || 'unknown',
      phase: validationState.phase || 'ideation',
      pivotRecommendation: validationState.pending_pivot_type || validationState.last_pivot_type || 'none',
    }
  }, [validationState])

  return {
    validationState,
    signals,
    isLoading,
    error,
    refetch: fetchState,
  }
}

// ============================================================================
// useInnovationSignals - Focused hook for displaying signals
// ============================================================================

/**
 * Hook focused on innovation physics signals for UI display
 *
 * @param projectId - Project ID to fetch signals for
 * @returns Innovation physics signals with evidence summaries
 *
 * @example
 * ```tsx
 * const { signals, desirabilityEvidence } = useInnovationSignals(projectId)
 *
 * return (
 *   <SignalBadge signal={signals.desirability} />
 * )
 * ```
 */
export function useInnovationSignals(projectId?: string): UseInnovationSignalsResult {
  const { validationState, signals, isLoading, error, refetch } = useCrewAIState({ projectId })

  return {
    signals,
    desirabilityEvidence: validationState?.desirability_evidence || null,
    feasibilityEvidence: validationState?.feasibility_evidence || null,
    viabilityEvidence: validationState?.viability_evidence || null,
    isLoading,
    error,
    refetch,
  }
}

// ============================================================================
// useCrewAIKickoff - Hook for triggering and monitoring CrewAI analysis
// ============================================================================

export type KickoffStatus = 'idle' | 'starting' | 'running' | 'completed' | 'failed'

export interface UseCrewAIKickoffResult {
  status: KickoffStatus
  kickoffId: string | null
  progress: string | null
  result: any | null
  error: Error | null
  kickoff: (inputs: Record<string, any>) => Promise<void>
  reset: () => void
}

/**
 * Hook for triggering and monitoring CrewAI crew execution
 *
 * @param projectId - Project ID for the analysis
 * @returns Kickoff state and control functions
 *
 * @example
 * ```tsx
 * const { status, kickoff, progress, result } = useCrewAIKickoff(projectId)
 *
 * const handleAnalyze = async () => {
 *   await kickoff({ entrepreneur_input: '...' })
 * }
 *
 * return (
 *   <>
 *     <Button onClick={handleAnalyze} disabled={status !== 'idle'}>
 *       {status === 'running' ? progress : 'Analyze'}
 *     </Button>
 *   </>
 * )
 * ```
 */
export function useCrewAIKickoff(projectId?: string): UseCrewAIKickoffResult {
  const [status, setStatus] = useState<KickoffStatus>('idle')
  const [kickoffId, setKickoffId] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const kickoff = useCallback(async (inputs: Record<string, any>) => {
    if (!projectId) {
      setError(new Error('Project ID is required'))
      return
    }

    try {
      setStatus('starting')
      setError(null)
      setProgress('Initializing analysis...')

      // Call our API route to start the analysis
      const response = await fetch('/api/crewai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          inputs,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start analysis')
      }

      const data = await response.json()
      setKickoffId(data.kickoff_id)
      setStatus('running')
      setProgress('Analysis in progress...')

      // Start polling for status
      await pollForCompletion(data.kickoff_id)
    } catch (err) {
      console.error('[useCrewAIKickoff] Error:', err)
      setStatus('failed')
      setError(err as Error)
      setProgress(null)
    }
  }, [projectId])

  const pollForCompletion = useCallback(async (id: string) => {
    const maxAttempts = 60 // 5 minutes at 5s intervals
    let attempt = 0

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/crewai/status/${id}`)
        if (!response.ok) {
          throw new Error('Failed to get status')
        }

        const statusData = await response.json()
        setProgress(statusData.status || 'Processing...')

        if (statusData.state === 'COMPLETED') {
          setStatus('completed')
          setResult(statusData.result || statusData.output)
          setProgress(null)
          return
        }

        if (statusData.state === 'FAILED') {
          throw new Error(statusData.error || 'Analysis failed')
        }

        // Continue polling
        attempt++
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          await poll()
        } else {
          throw new Error('Analysis timed out')
        }
      } catch (err) {
        setStatus('failed')
        setError(err as Error)
        setProgress(null)
      }
    }

    await poll()
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setKickoffId(null)
    setProgress(null)
    setResult(null)
    setError(null)
  }, [])

  return {
    status,
    kickoffId,
    progress,
    result,
    error,
    kickoff,
    reset,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the overall health status based on signals
 */
export function getOverallHealth(signals: InnovationPhysicsSignals): 'healthy' | 'warning' | 'critical' | 'unknown' {
  const { desirability, feasibility, viability } = signals

  // Check for critical issues
  if (
    desirability === 'no_interest' ||
    feasibility === 'red_impossible' ||
    viability === 'underwater'
  ) {
    return 'critical'
  }

  // Check for warnings
  if (
    desirability === 'weak_interest' ||
    feasibility === 'orange_constrained' ||
    viability === 'marginal' ||
    viability === 'zombie_market'
  ) {
    return 'warning'
  }

  // Check for healthy
  if (
    desirability === 'strong_commitment' &&
    feasibility === 'green' &&
    viability === 'profitable'
  ) {
    return 'healthy'
  }

  return 'unknown'
}

/**
 * Get recommended next action based on signals
 */
export function getRecommendedAction(signals: InnovationPhysicsSignals): string {
  const { desirability, feasibility, viability, phase, pivotRecommendation } = signals

  // If a pivot is recommended, surface that
  if (pivotRecommendation !== 'none') {
    const pivotActions: Record<PivotType, string> = {
      none: '',
      segment_pivot: 'Consider pivoting to a different customer segment',
      value_pivot: 'Reconsider your value proposition',
      channel_pivot: 'Explore alternative distribution channels',
      price_pivot: 'Review your pricing strategy',
      cost_pivot: 'Focus on reducing customer acquisition cost',
      kill: 'Strongly consider ending this project',
    }
    return pivotActions[pivotRecommendation]
  }

  // Phase-specific recommendations
  if (phase === 'ideation') {
    return 'Identify and prioritize your riskiest assumptions'
  }

  // Signal-based recommendations
  if (desirability === 'no_signal') {
    return 'Run a desirability experiment to validate customer interest'
  }

  if (desirability === 'no_interest') {
    return 'Your current segment shows no interest - consider a segment pivot'
  }

  if (desirability === 'weak_interest') {
    return 'Zombies detected - high interest but no commitment. Increase friction to filter real customers.'
  }

  if (feasibility === 'unknown' && desirability === 'strong_commitment') {
    return 'Customers are committed! Now validate technical feasibility.'
  }

  if (feasibility === 'orange_constrained') {
    return 'Consider scope reduction to improve feasibility'
  }

  if (viability === 'unknown' && feasibility === 'green') {
    return 'Technical feasibility confirmed! Now validate unit economics.'
  }

  if (viability === 'marginal') {
    return 'Unit economics are marginal - optimize pricing or reduce CAC'
  }

  if (viability === 'zombie_market') {
    return 'Market too small for sustainable business - consider expansion'
  }

  if (desirability === 'strong_commitment' && feasibility === 'green' && viability === 'profitable') {
    return 'All signals green! Ready to scale.'
  }

  return 'Continue validation experiments'
}

export default useCrewAIState
