/**
 * CrewAI State Hooks
 *
 * React hooks for fetching and managing CrewAI validation state.
 * These hooks integrate with the CrewAI types defined in @/types/crewai.ts
 *
 * @story US-F06, US-F08
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
  CustomerProfile,
  ValueMap,
  RiskAxis,
  ProblemFit,
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
        // Note: snake_case fields from DB are kept as-is to match StartupValidationState interface
        setValidationState({
          // Identity
          id: data.id,
          project_id: data.project_id,
          session_id: data.session_id,
          kickoff_id: data.kickoff_id,
          iteration: data.iteration || 1,

          // Phase & Risk
          phase: data.validation_phase || 'ideation',
          current_risk_axis: data.current_risk_axis || 'desirability',

          // Problem/Solution Fit
          problem_fit: data.problem_fit || 'unknown',
          current_segment: data.current_segment,
          current_value_prop: data.current_value_prop,
          vpc_document_url: data.vpc_document_url,
          bmc_document_url: data.bmc_document_url,

          // Innovation Physics Signals
          desirability_signal: data.desirability_signal || 'no_signal',
          feasibility_signal: data.feasibility_signal || 'unknown',
          viability_signal: data.viability_signal || 'unknown',

          // Pivot Tracking
          last_pivot_type: data.last_pivot_type || 'none',
          pending_pivot_type: data.pending_pivot_type || 'none',
          pivot_recommendation: data.pivot_recommendation,

          // Human Approval
          human_approval_status: data.human_approval_status || 'not_required',
          human_comment: data.human_comment,
          human_input_required: data.human_input_required || false,
          human_input_reason: data.human_input_reason,

          // Evidence Containers (JSONB)
          desirability_evidence: data.desirability_evidence,
          feasibility_evidence: data.feasibility_evidence,
          viability_evidence: data.viability_evidence,

          // VPC Data (JSONB) - Critical for VPC visualization
          customer_profiles: data.customer_profiles || {},
          value_maps: data.value_maps || {},
          competitor_report: data.competitor_report,

          // Assumptions
          assumptions: data.assumptions || [],

          // Desirability Artifacts
          desirability_experiments: data.desirability_experiments || [],
          downgrade_active: data.downgrade_active || false,

          // Feasibility/Viability Artifacts
          last_feasibility_artifact: data.last_feasibility_artifact,
          last_viability_metrics: data.last_viability_metrics,

          // QA and Governance
          qa_reports: data.qa_reports || [],
          current_qa_status: data.current_qa_status,
          framework_compliance: data.framework_compliance || false,
          logical_consistency: data.logical_consistency || false,
          completeness: data.completeness || false,

          // Service Crew Outputs
          business_idea: data.business_idea,
          entrepreneur_input: data.entrepreneur_input,
          target_segments: data.target_segments || [],
          problem_statement: data.problem_statement,
          solution_description: data.solution_description,
          revenue_model: data.revenue_model,

          // Analysis Crew Outputs
          segment_fit_scores: data.segment_fit_scores || {},
          analysis_insights: data.analysis_insights || [],

          // Growth Crew Outputs
          ad_impressions: data.ad_impressions || 0,
          ad_clicks: data.ad_clicks || 0,
          ad_signups: data.ad_signups || 0,
          ad_spend: data.ad_spend || 0,

          // Build Crew Outputs
          api_costs: data.api_costs || {},
          infra_costs: data.infra_costs || {},
          total_monthly_cost: data.total_monthly_cost || 0,

          // Finance Crew Outputs
          cac: data.cac || 0,
          ltv: data.ltv || 0,
          ltv_cac_ratio: data.ltv_cac_ratio || 0,
          gross_margin: data.gross_margin || 0,
          tam: data.tam || 0,

          // Synthesis Crew Outputs
          synthesis_confidence: data.synthesis_confidence || 0,
          evidence_summary: data.evidence_summary,
          final_recommendation: data.final_recommendation,
          next_steps: data.next_steps || [],

          // Budget Tracking
          daily_spend_usd: data.daily_spend_usd || 0,
          campaign_spend_usd: data.campaign_spend_usd || 0,
          budget_status: data.budget_status || 'ok',
          budget_escalation_triggered: data.budget_escalation_triggered || false,
          budget_kill_triggered: data.budget_kill_triggered || false,

          // Business Model
          business_model_type: data.business_model_type,
          business_model_inferred_from: data.business_model_inferred_from,
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
// useVPCData - Hook for Value Proposition Canvas visualization
// ============================================================================

export interface UseVPCDataResult {
  customerProfiles: Record<string, CustomerProfile>
  valueMaps: Record<string, ValueMap>
  currentSegment: string | null
  currentValueProp: string | null
  problemFit: ProblemFit
  segments: string[]
  hasData: boolean
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook focused on VPC data for Value Proposition Canvas visualization
 *
 * @param projectId - Project ID to fetch VPC data for
 * @returns VPC-specific data structures for canvas rendering
 *
 * @example
 * ```tsx
 * const { customerProfiles, valueMaps, currentSegment } = useVPCData(projectId)
 *
 * const profile = customerProfiles[currentSegment]
 * const valueMap = valueMaps[currentSegment]
 * ```
 */
export function useVPCData(projectId?: string): UseVPCDataResult {
  const { validationState, isLoading, error, refetch } = useCrewAIState({ projectId })

  const customerProfiles = useMemo(() => {
    return validationState?.customer_profiles || {}
  }, [validationState])

  const valueMaps = useMemo(() => {
    return validationState?.value_maps || {}
  }, [validationState])

  const segments = useMemo(() => {
    return Object.keys(customerProfiles)
  }, [customerProfiles])

  const hasData = useMemo(() => {
    return segments.length > 0
  }, [segments])

  return {
    customerProfiles,
    valueMaps,
    currentSegment: validationState?.current_segment || null,
    currentValueProp: validationState?.current_value_prop || null,
    problemFit: validationState?.problem_fit || 'unknown',
    segments,
    hasData,
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
