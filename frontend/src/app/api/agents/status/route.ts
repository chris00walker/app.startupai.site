/**
 * @story US-F02
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createModalClient } from '@/lib/crewai/modal-client'

/**
 * The 6 AI Founders in StartupAI
 */
const AI_FOUNDERS = [
  { id: 'sage', name: 'Sage', title: 'CSO', role: 'Strategy & Service', crew: 'service' },
  { id: 'forge', name: 'Forge', title: 'CTO', role: 'Technical Feasibility', crew: 'build' },
  { id: 'pulse', name: 'Pulse', title: 'CGO', role: 'Growth & Testing', crew: 'growth' },
  { id: 'compass', name: 'Compass', title: 'CPO', role: 'Synthesis & Balance', crew: 'synthesis' },
  { id: 'guardian', name: 'Guardian', title: 'CCO', role: 'Governance & QA', crew: 'governance' },
  { id: 'ledger', name: 'Ledger', title: 'CFO', role: 'Finance & Viability', crew: 'finance' },
] as const

interface AgentInfo {
  id: string
  name: string
  title: string
  role: string
  status: 'running' | 'idle' | 'completed' | 'error'
  lastUpdated: string
  currentTask?: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Start with all agents in idle state
    const agents: AgentInfo[] = AI_FOUNDERS.map(founder => ({
      id: founder.id,
      name: founder.name,
      title: founder.title,
      role: founder.role,
      status: 'idle' as const,
      lastUpdated: new Date().toISOString(),
    }))

    // If user is authenticated, check for active workflows
    if (user && !authError) {
      // Get projects with active workflows
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, initial_analysis_workflow_id, status, updated_at')
        .eq('user_id', user.id)
        .not('initial_analysis_workflow_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5)

      if (projects && projects.length > 0) {
        // Check status of the most recent workflow
        const activeProject = projects.find(p => p.status === 'analyzing')

        if (activeProject?.initial_analysis_workflow_id) {
          try {
            const modalClient = createModalClient()
            const status = await modalClient.getStatus(activeProject.initial_analysis_workflow_id)

            if (status.status === 'running' || status.status === 'pending' || status.status === 'paused') {
              // Determine which agent is currently running based on crew/phase hints
              const currentTask = (status.progress?.crew || status.phase_name || '').toLowerCase()

              // Map task names to founders
              const taskToFounder: Record<string, string> = {
                'service': 'sage',
                'analysis': 'sage',
                'segment': 'sage',
                'build': 'forge',
                'feasibility': 'forge',
                'technical': 'forge',
                'growth': 'pulse',
                'desirability': 'pulse',
                'experiment': 'pulse',
                'synthesis': 'compass',
                'pivot': 'compass',
                'governance': 'guardian',
                'qa': 'guardian',
                'audit': 'guardian',
                'finance': 'ledger',
                'viability': 'ledger',
                'economics': 'ledger',
              }

              // Find which founder is active
              let activeFounderId: string | null = null
              for (const [keyword, founderId] of Object.entries(taskToFounder)) {
                if (currentTask.includes(keyword)) {
                  activeFounderId = founderId
                  break
                }
              }

              // Update agent statuses
              agents.forEach(agent => {
                if (agent.id === activeFounderId) {
                  agent.status = 'running'
                  agent.currentTask = status.progress?.crew || status.phase_name || 'Processing...'
                }
              })
            } else if (status.status === 'completed') {
              // Mark all agents as completed
              agents.forEach(agent => {
                agent.status = 'completed'
              })
            } else if (status.status === 'failed') {
              // Mark relevant agent as error
              agents.forEach(agent => {
                agent.status = 'idle'
              })
            }
          } catch (statusError) {
            console.warn('[api/agents/status] Could not fetch workflow status:', statusError)
          }
        }

        // Get last activity from reports
        const { data: latestReport } = await supabase
          .from('reports')
          .select('report_type, generated_at')
          .eq('user_id', user.id)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestReport) {
          // Update lastUpdated for all agents
          agents.forEach(agent => {
            agent.lastUpdated = latestReport.generated_at || agent.lastUpdated
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        agents,
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Error in GET /api/agents/status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
