/**
 * useRecommendedActions Hook
 *
 * Analyzes current project state and generates AI-suggested next actions
 * based on the Strategyzer validation methodology.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface RecommendedAction {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'assumption' | 'experiment' | 'evidence' | 'canvas'
  actionType: 'create' | 'complete' | 'review' | 'resolve'
  linkedId?: string // ID of the related assumption/experiment
}

interface UseRecommendedActionsOptions {
  projectId?: string
  limit?: number
}

interface UseRecommendedActionsResult {
  actions: RecommendedAction[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useRecommendedActions(options: UseRecommendedActionsOptions = {}): UseRecommendedActionsResult {
  const { projectId, limit = 5 } = options
  const supabase = useMemo(() => createClient(), [])

  const [actions, setActions] = useState<RecommendedAction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const generateRecommendations = useCallback(async () => {
    if (!projectId) {
      setActions([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const recommendations: RecommendedAction[] = []

      // 1. Check for high-criticality untested assumptions (Test First quadrant)
      const { data: untestedAssumptions, error: assumptionsError } = await supabase
        .from('hypotheses')
        .select('id, statement, type, importance, evidence_strength')
        .eq('project_id', projectId)
        .eq('status', 'untested')
        .in('importance', ['high', 'medium'])
        .in('evidence_strength', ['none', 'weak'])
        .order('importance', { ascending: false })
        .limit(3)

      if (assumptionsError) throw assumptionsError

      if (untestedAssumptions && untestedAssumptions.length > 0) {
        untestedAssumptions.forEach((assumption: any, index: number) => {
          recommendations.push({
            id: `test-assumption-${assumption.id}`,
            title: 'Design Experiment for Critical Assumption',
            description: `"${assumption.statement.substring(0, 50)}..." needs validation`,
            priority: assumption.importance === 'high' ? 'high' : 'medium',
            category: 'experiment',
            actionType: 'create',
            linkedId: assumption.id
          })
        })
      }

      // 2. Check for running experiments without results
      const { data: runningExperiments, error: experimentsError } = await supabase
        .from('experiments')
        .select('id, name, status, start_date')
        .eq('project_id', projectId)
        .eq('status', 'running')
        .order('start_date', { ascending: true })
        .limit(3)

      if (experimentsError) throw experimentsError

      if (runningExperiments && runningExperiments.length > 0) {
        runningExperiments.forEach((experiment: any) => {
          recommendations.push({
            id: `complete-experiment-${experiment.id}`,
            title: 'Record Experiment Results',
            description: `"${experiment.name}" is running - capture learnings when complete`,
            priority: 'high',
            category: 'experiment',
            actionType: 'complete',
            linkedId: experiment.id
          })
        })
      }

      // 3. Check for contradictions that need resolution
      const { data: contradictions, error: contradictionsError } = await supabase
        .from('evidence')
        .select('id, title, fit_type')
        .eq('project_id', projectId)
        .eq('is_contradiction', true)
        .limit(3)

      if (contradictionsError) throw contradictionsError

      if (contradictions && contradictions.length > 0) {
        contradictions.forEach((contradiction: any) => {
          recommendations.push({
            id: `resolve-contradiction-${contradiction.id}`,
            title: 'Resolve Contradicting Evidence',
            description: `"${contradiction.title}" conflicts with other evidence`,
            priority: 'high',
            category: 'evidence',
            actionType: 'resolve',
            linkedId: contradiction.id
          })
        })
      }

      // 4. Check evidence coverage by fit type
      const { data: evidenceCounts, error: evidenceCountError } = await supabase
        .from('evidence')
        .select('fit_type')
        .eq('project_id', projectId)

      if (evidenceCountError) throw evidenceCountError

      const fitTypeCounts = {
        Desirability: 0,
        Feasibility: 0,
        Viability: 0
      }

      if (evidenceCounts) {
        evidenceCounts.forEach((item: any) => {
          if (item.fit_type && fitTypeCounts.hasOwnProperty(item.fit_type)) {
            fitTypeCounts[item.fit_type as keyof typeof fitTypeCounts]++
          }
        })
      }

      // Recommend gathering evidence for underrepresented fit types
      const minEvidence = Math.min(...Object.values(fitTypeCounts))
      Object.entries(fitTypeCounts).forEach(([fitType, count]) => {
        if (count === minEvidence && count < 3) {
          recommendations.push({
            id: `gather-evidence-${fitType.toLowerCase()}`,
            title: `Gather ${fitType} Evidence`,
            description: `Only ${count} evidence items for ${fitType.toLowerCase()} - run experiments to strengthen`,
            priority: count === 0 ? 'high' : 'medium',
            category: 'evidence',
            actionType: 'create'
          })
        }
      })

      // 5. If no assumptions exist, recommend canvas work
      const { count: assumptionCount, error: countError } = await supabase
        .from('hypotheses')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      if (countError) throw countError

      if ((assumptionCount || 0) < 3) {
        recommendations.push({
          id: 'create-assumptions',
          title: 'Identify Key Assumptions',
          description: 'Review your canvases and extract critical business assumptions to test',
          priority: assumptionCount === 0 ? 'high' : 'medium',
          category: 'assumption',
          actionType: 'create'
        })
      }

      // Sort by priority and limit
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

      setActions(recommendations.slice(0, limit))
    } catch (err) {
      console.error('Error generating recommendations:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, limit, supabase])

  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  return {
    actions,
    isLoading,
    error,
    refetch: generateRecommendations
  }
}

export default useRecommendedActions
