/**
 * usePortfolioActivity Hook
 *
 * Fetches recent activity across all projects in a consultant's portfolio.
 * Queries evidence, experiments, and hypotheses tables to show
 * what's happening across all client projects.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

export interface PortfolioActivityItem {
  id: string
  action: string
  client: string
  type: string
  time: string
  status: 'success' | 'pending' | 'warning' | 'default'
  projectId: string
  timestamp: Date
}

interface UsePortfolioActivityOptions {
  projectIds?: string[]
  limit?: number
}

interface UsePortfolioActivityResult {
  activities: PortfolioActivityItem[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Maps activity data to status for visual indicators
 */
function getActivityStatus(type: string, metadata?: { status?: string; is_contradiction?: boolean }): PortfolioActivityItem['status'] {
  if (metadata?.is_contradiction) return 'warning'
  if (metadata?.status === 'completed' || metadata?.status === 'validated') return 'success'
  if (metadata?.status === 'running' || metadata?.status === 'testing' || metadata?.status === 'planned') return 'pending'
  if (metadata?.status === 'invalidated' || metadata?.status === 'cancelled') return 'warning'
  return 'default'
}

/**
 * Formats timestamp as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

export function usePortfolioActivity(options: UsePortfolioActivityOptions = {}): UsePortfolioActivityResult {
  const { projectIds, limit = 10 } = options
  const supabase = useMemo(() => createClient(), [])

  const [activities, setActivities] = useState<PortfolioActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchActivities = useCallback(async () => {
    if (!projectIds || projectIds.length === 0) {
      setActivities([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch project names for client display
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds)

      if (projectsError) throw projectsError

      const projectNameMap = new Map<string, string>(
        (projectsData || []).map(p => [p.id, p.name])
      )

      // Fetch recent evidence
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .select('id, title, fit_type, is_contradiction, created_at, project_id')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (evidenceError) throw evidenceError

      // Fetch recent experiments
      const { data: experimentsData, error: experimentsError } = await supabase
        .from('experiments')
        .select('id, name, status, fit_type, updated_at, project_id')
        .in('project_id', projectIds)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (experimentsError) throw experimentsError

      // Fetch recent hypotheses/assumptions
      const { data: hypothesesData, error: hypothesesError } = await supabase
        .from('hypotheses')
        .select('id, statement, type, status, updated_at, project_id')
        .in('project_id', projectIds)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (hypothesesError) throw hypothesesError

      // Transform and combine activities
      const allActivities: PortfolioActivityItem[] = []

      // Transform evidence
      if (evidenceData) {
        evidenceData.forEach((item) => {
          const timestamp = new Date(item.created_at)
          allActivities.push({
            id: `evidence-${item.id}`,
            action: item.is_contradiction ? 'Contradiction Found' : 'Evidence Added',
            client: projectNameMap.get(item.project_id) || 'Unknown Project',
            type: item.fit_type || 'Validation',
            time: formatRelativeTime(timestamp),
            status: getActivityStatus('evidence', { is_contradiction: item.is_contradiction }),
            projectId: item.project_id,
            timestamp,
          })
        })
      }

      // Transform experiments
      if (experimentsData) {
        experimentsData.forEach((item) => {
          const actionMap: Record<string, string> = {
            planned: 'Experiment Planned',
            running: 'Experiment Started',
            completed: 'Experiment Completed',
            cancelled: 'Experiment Cancelled',
          }
          const timestamp = new Date(item.updated_at)
          allActivities.push({
            id: `experiment-${item.id}`,
            action: actionMap[item.status] || 'Experiment Updated',
            client: projectNameMap.get(item.project_id) || 'Unknown Project',
            type: item.fit_type || 'Validation',
            time: formatRelativeTime(timestamp),
            status: getActivityStatus('experiment', { status: item.status }),
            projectId: item.project_id,
            timestamp,
          })
        })
      }

      // Transform hypotheses
      if (hypothesesData) {
        hypothesesData.forEach((item) => {
          const actionMap: Record<string, string> = {
            untested: 'Assumption Added',
            testing: 'Assumption Testing',
            validated: 'Assumption Validated',
            invalidated: 'Assumption Invalidated',
          }
          const timestamp = new Date(item.updated_at)
          allActivities.push({
            id: `hypothesis-${item.id}`,
            action: actionMap[item.status] || 'Assumption Updated',
            client: projectNameMap.get(item.project_id) || 'Unknown Project',
            type: item.type || 'Assumption',
            time: formatRelativeTime(timestamp),
            status: getActivityStatus('hypothesis', { status: item.status }),
            projectId: item.project_id,
            timestamp,
          })
        })
      }

      // Sort by timestamp and limit
      allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setActivities(allActivities.slice(0, limit))
    } catch (err) {
      console.error('Error fetching portfolio activity:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [projectIds, limit, supabase])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities,
  }
}

export default usePortfolioActivity
