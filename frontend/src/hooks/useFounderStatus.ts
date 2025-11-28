/**
 * useFounderStatus Hook
 *
 * Polls the /api/agents/status endpoint for real-time founder status.
 * Returns founder data with current status for UI display.
 */
import { useQuery } from '@tanstack/react-query'
import {
  AI_FOUNDERS,
  getAllFounders,
  type Founder,
  type FounderId,
  type FounderStatus,
} from '@/lib/founders/founder-mapping'

interface AgentInfo {
  id: string
  name: string
  title: string
  role: string
  status: FounderStatus
  lastUpdated: string
  currentTask?: string
}

interface AgentStatusResponse {
  success: boolean
  data: {
    agents: AgentInfo[]
    timestamp: string
  }
}

export interface FounderWithStatus extends Founder {
  status: FounderStatus
  currentTask?: string
  lastUpdated: string
}

interface UseFounderStatusResult {
  /** All founders with their current status */
  founders: FounderWithStatus[]
  /** The currently active founder (if any) */
  activeFounder: FounderWithStatus | null
  /** Whether any founder is currently running */
  isAnalyzing: boolean
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Last updated timestamp */
  timestamp: string | null
  /** Manually refetch status */
  refetch: () => void
}

interface UseFounderStatusOptions {
  /** Project ID for context (optional, for future use) */
  projectId?: string
  /** Polling interval in ms (default: 5000) */
  refetchInterval?: number
  /** Whether to poll (default: true) */
  enabled?: boolean
}

export function useFounderStatus(options?: UseFounderStatusOptions): UseFounderStatusResult {
  const { projectId, refetchInterval = 5000, enabled = true } = options || {}

  const { data, isLoading, error, refetch } = useQuery<AgentStatusResponse>({
    queryKey: ['foundersStatus', projectId],
    queryFn: async () => {
      const response = await fetch('/api/agents/status')
      if (!response.ok) throw new Error('Failed to fetch founder status')
      return response.json()
    },
    refetchInterval: enabled ? refetchInterval : false,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled,
  })

  const agents: AgentInfo[] = data?.data?.agents || []
  const timestamp = data?.data?.timestamp || null

  // Merge agent status data with founder definitions
  const founders: FounderWithStatus[] = getAllFounders().map((founder) => {
    const agentData = agents.find((a) => a.id === founder.id)
    return {
      ...founder,
      status: (agentData?.status || 'idle') as FounderStatus,
      currentTask: agentData?.currentTask,
      lastUpdated: agentData?.lastUpdated || new Date().toISOString(),
    }
  })

  const activeFounder = founders.find((f) => f.status === 'running') || null
  const isAnalyzing = founders.some((f) => f.status === 'running')

  return {
    founders,
    activeFounder,
    isAnalyzing,
    isLoading,
    error: error as Error | null,
    timestamp,
    refetch,
  }
}

/**
 * Get a specific founder's status from the hook result
 */
export function getFounderStatus(
  founders: FounderWithStatus[],
  founderId: FounderId
): FounderWithStatus | undefined {
  return founders.find((f) => f.id === founderId)
}
