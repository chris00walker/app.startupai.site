/**
 * Project Report Page
 *
 * Comprehensive CrewAI analysis report viewer with dual organization:
 * - D-F-V Risk Axis (Desirability, Feasibility, Viability)
 * - Strategyzer Phase (Problem Fit, Solution Fit, Product-Market Fit, Business Model)
 *
 * Surfaces all 65+ CrewAI analysis fields with PDF export capability.
 */

'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CrewAIReportViewer } from '@/components/reports/CrewAIReportViewer'
import { trackPageView } from '@/lib/analytics'

export default function ProjectReportPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  // Track page view
  useEffect(() => {
    if (projectId) {
      trackPageView('Project Report', { project_id: projectId })
    }
  }, [projectId])

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Unable to load project report.
          </p>
          <Button onClick={() => router.push('/founder-dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href={`/project/${projectId}/analysis`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">CrewAI Analysis Report</h1>
              <p className="text-xs text-muted-foreground">
                Comprehensive strategic analysis
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <main className="container mx-auto px-4 py-6">
        <CrewAIReportViewer projectId={projectId} />
      </main>
    </div>
  )
}
