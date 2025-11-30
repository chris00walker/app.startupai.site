'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useUnifiedEvidence } from '@/hooks/useUnifiedEvidence'
import { trackPageView } from '@/lib/analytics'
import {
  EvidenceFilters,
  EvidenceSummaryPanel,
  EvidenceTimeline,
  EvidenceDetailPanel,
} from '@/components/evidence-explorer'
import type { UnifiedEvidenceItem } from '@/types/evidence-explorer'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EvidenceExplorerPage({ params }: PageProps) {
  const { id: projectId } = use(params)

  const {
    filteredEvidence,
    summary,
    trendData,
    isLoading,
    error,
    filters,
    updateFilter,
    resetFilters,
  } = useUnifiedEvidence(projectId)

  const [selectedEvidence, setSelectedEvidence] = useState<UnifiedEvidenceItem | null>(null)

  // Track page view
  useEffect(() => {
    if (projectId) {
      trackPageView('Evidence Explorer', {
        project_id: projectId,
        evidence_count: filteredEvidence.length,
      })
    }
  }, [projectId, filteredEvidence.length])

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Error loading evidence: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href={`/project/${projectId}`}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to project
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Evidence Explorer</h1>
          <p className="text-muted-foreground mt-1">
            Unified view of validation evidence across Desirability, Feasibility, and Viability
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href={`/project/${projectId}/fit`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Evidence
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Dashboard */}
      <EvidenceSummaryPanel
        summary={summary}
        trendData={trendData}
      />

      {/* Filters */}
      <EvidenceFilters
        filters={filters}
        onFilterChange={updateFilter}
        onReset={resetFilters}
        evidenceCount={filteredEvidence.length}
      />

      {/* Evidence Timeline */}
      <EvidenceTimeline
        evidence={filteredEvidence}
        onSelectItem={setSelectedEvidence}
        isLoading={isLoading}
      />

      {/* Detail Panel (Side Drawer) */}
      <EvidenceDetailPanel
        evidence={selectedEvidence}
        open={selectedEvidence !== null}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  )
}
