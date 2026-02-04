/**
 * @story US-F09
 */
/**
 * useRecentActivity Hook
 *
 * Fetches recent activity from evidence, experiments, and hypotheses tables
 * to show what's happening in the user's validation journey.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ActivityItem {
  id: string
  type: 'evidence' | 'experiment' | 'assumption' | 'contradiction'
  title: string
  description: string
  timestamp: Date
  metadata?: {
    category?: string
    status?: string
    strength?: string
  }
}

interface UseRecentActivityOptions {
  projectId?: string
  limit?: number
}

interface UseRecentActivityResult {
  activities: ActivityItem[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useRecentActivity(options: UseRecentActivityOptions = {}): UseRecentActivityResult {
  const { projectId, limit = 10 } = options
  const supabase = useMemo(() => createClient(), [])

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchActivities = useCallback(async () => {
    if (!projectId) {
      setActivities([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch recent evidence
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .select('id, title, summary, fit_type, strength, is_contradiction, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (evidenceError) throw evidenceError

      // Fetch recent experiments
      const { data: experimentsData, error: experimentsError } = await supabase
        .from('experiments')
        .select('id, name, status, fit_type, created_at, updated_at')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (experimentsError) throw experimentsError

      // Fetch recent hypotheses/assumptions
      const { data: hypothesesData, error: hypothesesError } = await supabase
        .from('hypotheses')
        .select('id, statement, hypothesis_type, status, created_at, updated_at')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (hypothesesError) throw hypothesesError

      // Transform and combine activities
      const allActivities: ActivityItem[] = []

      // Transform evidence
      if (evidenceData) {
        evidenceData.forEach((item: any) => {
          if (item.is_contradiction) {
            allActivities.push({
              id: `contradiction-${item.id}`,
              type: 'contradiction',
              title: 'Contradiction detected',
              description: `${item.title} - ${item.summary?.substring(0, 50) || 'Review needed'}`,
              timestamp: new Date(item.created_at),
              metadata: {
                category: item.fit_type,
                strength: item.strength
              }
            })
          } else {
            allActivities.push({
              id: `evidence-${item.id}`,
              type: 'evidence',
              title: 'New evidence added',
              description: `${item.title} - ${item.strength || 'Medium'} evidence for ${item.fit_type || 'validation'}`,
              timestamp: new Date(item.created_at),
              metadata: {
                category: item.fit_type,
                strength: item.strength
              }
            })
          }
        })
      }

      // Transform experiments
      if (experimentsData) {
        experimentsData.forEach((item: any) => {
          const statusText = {
            planned: 'Experiment planned',
            running: 'Experiment started',
            completed: 'Experiment completed',
            cancelled: 'Experiment cancelled'
          }[item.status] || 'Experiment updated'

          allActivities.push({
            id: `experiment-${item.id}`,
            type: 'experiment',
            title: statusText,
            description: `${item.name} - ${item.fit_type || 'validation'} testing`,
            timestamp: new Date(item.updated_at || item.created_at),
            metadata: {
              category: item.fit_type,
              status: item.status
            }
          })
        })
      }

      // Transform hypotheses/assumptions
      if (hypothesesData) {
        hypothesesData.forEach((item: any) => {
          const statusText = {
            untested: 'Assumption added',
            testing: 'Assumption under test',
            validated: 'Assumption validated',
            invalidated: 'Assumption invalidated'
          }[item.status] || 'Assumption updated'

          allActivities.push({
            id: `assumption-${item.id}`,
            type: 'assumption',
            title: statusText,
            description: item.statement?.substring(0, 60) + (item.statement?.length > 60 ? '...' : ''),
            timestamp: new Date(item.updated_at || item.created_at),
            metadata: {
              category: item.hypothesis_type,
              status: item.status
            }
          })
        })
      }

      // Sort by timestamp and limit
      allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setActivities(allActivities.slice(0, limit))
    } catch (err) {
      console.error('Error fetching recent activity:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, limit, supabase])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities
  }
}

export default useRecentActivity
