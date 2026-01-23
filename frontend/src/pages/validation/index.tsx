/**
 * Unified Validation Dashboard
 *
 * Single-page orchestration view connecting:
 * - Value Proposition Canvas (VPC) - Customer fit
 * - Business Model Canvas (BMC) - Business model
 * - Innovation Physics Signals (D-F-V) - Validation status
 * - Viability Metrics - Ledger Crew economics
 *
 * This is the complete Strategyzer methodology view for entrepreneurs.
 *
 * @story US-CP08
 */

import React, { useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  LayoutDashboard,
  LayoutGrid,
  Building2,
  FlaskConical,
  ArrowRight,
  RefreshCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Components
import { SignalGauge } from '@/components/signals/SignalGauge'
import { VPCWithSignals } from '@/components/vpc/VPCWithSignals'
import { ViabilityMetricsPanel } from '@/components/viability/ViabilityMetricsPanel'
import { RevenueStreamsOverlay, CostStructureOverlay, ViabilitySummaryBar } from '@/components/canvas/BMCViabilityOverlay'

// Hooks
import { useCrewAIState } from '@/hooks/useCrewAIState'
import { useBMC } from '@/hooks/useBMC'
// import { useProject } from '@/hooks/useProject' // TODO: Create this hook when needed

// Types
import type {
  Phase,
  PivotType
} from '@/types/crewai'

export default function ValidationDashboard() {
  const router = useRouter()
  const projectId = typeof router.query.projectId === 'string' ? router.query.projectId : undefined

  const { validationState, signals, isLoading: stateLoading, error } = useCrewAIState({
    projectId,
  })
  const { bmc, isLoading: bmcLoading } = useBMC({ projectId })
  const isLoading = stateLoading || bmcLoading

  const data = useMemo(() => {
    if (!validationState || !signals) return null

    const customerProfiles = validationState.customer_profiles || {}
    const valueMaps = validationState.value_maps || {}
    const segmentKeys = Object.keys(customerProfiles)
    const primarySegmentKey = segmentKeys[0]
    const primaryProfile = primarySegmentKey ? customerProfiles[primarySegmentKey] : undefined
    const primaryValueMap = primarySegmentKey ? valueMaps[primarySegmentKey] : undefined

    const bmcRecord = typeof bmc === 'object' && bmc !== null ? (bmc as Record<string, unknown>) : null
    const getBmcItems = (camelKey: string, snakeKey: string) => {
      if (!bmcRecord) return []
      const value = bmcRecord[camelKey] ?? bmcRecord[snakeKey]
      return Array.isArray(value) ? value : []
    }
    const toTextList = (items: unknown[]) =>
      items
        .map((item) => (typeof item === 'object' && item !== null ? (item as Record<string, unknown>).text : null))
        .filter((value): value is string => typeof value === 'string')

    return {
      segment: {
        segmentKey: primarySegmentKey || 'primary',
        segmentName: primaryProfile?.segment_name || 'Primary Segment',
        customerProfile: primaryProfile,
        valueMap: primaryValueMap,
        resonanceScore: primaryProfile?.resonance_score,
      },
      signals: {
        desirability: signals.desirability,
        feasibility: signals.feasibility,
        viability: signals.viability,
      },
      evidence: {
        desirability: validationState.desirability_evidence,
        feasibility: validationState.feasibility_evidence,
        viability: validationState.viability_evidence,
      },
      metrics: validationState.last_viability_metrics ?? null,
      bmcData: {
        revenueStreams: toTextList(getBmcItems('revenueStreams', 'revenue_streams')),
        costStructure: toTextList(getBmcItems('costStructure', 'cost_structure')),
      },
      phase: signals.phase,
      pivotRecommendation: signals.pivotRecommendation,
    }
  }, [validationState, signals, bmc])

  const phaseConfig = getPhaseConfig(data?.phase || 'ideation')

  if (isLoading) {
    return <ValidationDashboardSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-red-800">Failed to Load Validation Data</h2>
              <p className="text-sm text-red-600 mt-2">Please try again or contact support.</p>
              <Button variant="outline" className="mt-4" onClick={() => router.reload()}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!projectId) {
    return (
      <>
        <Head>
          <title>Validation Dashboard | StartupAI</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            <EmptyState
              title="Select a project to view validation"
              description="Open a project to view its validation dashboard."
              icon={<FlaskConical className="h-8 w-8" />}
            />
          </div>
        </div>
      </>
    )
  }

  if (!data) {
    return (
      <>
        <Head>
          <title>Validation Dashboard | StartupAI</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            <EmptyState
              title="No validation data yet"
              description="Complete onboarding and trigger a validation run to populate this dashboard."
              icon={<FlaskConical className="h-8 w-8" />}
            />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Validation Dashboard | StartupAI</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Validation</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FlaskConical className="h-6 w-6 text-indigo-600" />
                Innovation Physics Dashboard
              </h1>
              <p className="text-muted-foreground">
                Complete validation view: VPC + BMC + D-F-V Signals
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={phaseConfig.badgeColor}>
                {phaseConfig.icon}
                <span className="ml-1">Phase: {phaseConfig.label}</span>
              </Badge>
            </div>
          </div>

          {/* Innovation Physics Signals Row */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Innovation Physics Signals</CardTitle>
              <CardDescription>
                Validation status across Desirability, Feasibility, and Viability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <SignalGauge
                  signalType="desirability"
                  currentSignal={data.signals.desirability}
                  evidence={data.evidence.desirability}
                  showLabel={true}
                  showThresholds={true}
                  size="lg"
                />
                <SignalGauge
                  signalType="feasibility"
                  currentSignal={data.signals.feasibility}
                  evidence={data.evidence.feasibility}
                  showLabel={true}
                  showThresholds={true}
                  size="lg"
                />
                <SignalGauge
                  signalType="viability"
                  currentSignal={data.signals.viability}
                  evidence={data.evidence.viability}
                  showLabel={true}
                  showThresholds={true}
                  size="lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Main Content: VPC + BMC Side by Side */}
          <div className="grid grid-cols-2 gap-6">
            {/* VPC with Signals */}
            <VPCWithSignals
              segment={data.segment}
              additionalSegments={0}
              signals={data.signals}
              evidence={data.evidence}
              pivotRecommendation={data.pivotRecommendation}
              onViewFullVPC={() => {
                const params = new URLSearchParams({ projectId })
                if (data.segment.segmentKey) {
                  params.set('segmentKey', data.segment.segmentKey)
                }
                router.push(`/canvas/vpc?${params.toString()}`)
              }}
              variant="full"
            />

            {/* BMC Economics View */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Business Model Economics</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/canvas/bmc">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Full BMC
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  Revenue Streams and Cost Structure with Ledger Crew metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Viability Summary Bar */}
                <ViabilitySummaryBar
                  metrics={data.metrics}
                  evidence={data.evidence.viability}
                  signal={data.signals.viability}
                />

                <Separator />

                {/* Revenue & Cost blocks */}
                <div className="grid grid-cols-2 gap-4">
                  <RevenueStreamsOverlay
                    items={data.bmcData.revenueStreams}
                    metrics={data.metrics}
                    evidence={data.evidence.viability}
                    signal={data.signals.viability}
                    businessModelType="saas_b2b_smb"
                  />
                  <CostStructureOverlay
                    items={data.bmcData.costStructure}
                    metrics={data.metrics}
                    evidence={data.evidence.viability}
                    signal={data.signals.viability}
                    businessModelType="saas_b2b_smb"
                    infraCosts={{ vercel: 20, supabase: 25 }}
                    apiCosts={{ openai: 150, anthropic: 50 }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Viability Metrics Panel */}
          <ViabilityMetricsPanel
            metrics={data.metrics}
            evidence={data.evidence.viability}
            signal={data.signals.viability}
            businessModelType="saas_b2b_smb"
            showBreakdowns={true}
            variant="full"
          />

          {/* Pivot Recommendation (if applicable) */}
          {data.pivotRecommendation && data.pivotRecommendation !== 'none' && (
            <PivotRecommendationCard pivotType={data.pivotRecommendation} />
          )}

          {/* Quick Navigation */}
          <div className="grid grid-cols-4 gap-4">
            <QuickNavCard
              title="Value Proposition Canvas"
              description="Full customer-value analysis"
              href={`/canvas/vpc?projectId=${projectId}`}
              icon={<LayoutGrid className="h-5 w-5" />}
            />
            <QuickNavCard
              title="Business Model Canvas"
              description="9-block business model"
              href="/canvas/bmc"
              icon={<Building2 className="h-5 w-5" />}
            />
            <QuickNavCard
              title="Testing Business Ideas"
              description="Experiments and assumptions"
              href="/canvas/tbi"
              icon={<FlaskConical className="h-5 w-5" />}
            />
            <QuickNavCard
              title="Main Dashboard"
              description="Project overview"
              href="/dashboard"
              icon={<LayoutDashboard className="h-5 w-5" />}
            />
          </div>
        </div>
      </div>
    </>
  )
}

// Helper components

function QuickNavCard({
  title,
  description,
  href,
  icon
}: {
  title: string
  description: string
  href: string
  icon: React.ReactNode
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="pt-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted">
            {icon}
          </div>
          <div>
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PivotRecommendationCard({ pivotType }: { pivotType: PivotType }) {
  const pivotConfig: Record<PivotType, { label: string; description: string; severity: string; actions: string[] }> = {
    none: { label: 'No Pivot', description: 'Continue current direction', severity: 'none', actions: [] },
    segment_pivot: {
      label: 'Segment Pivot Recommended',
      description: 'Current customer segment shows weak validation signals',
      severity: 'medium',
      actions: ['Re-analyze customer profiles', 'Test adjacent segments', 'Review VPC jobs/pains']
    },
    value_pivot: {
      label: 'Value Pivot Recommended',
      description: 'Value proposition not resonating with target customers',
      severity: 'medium',
      actions: ['Revise pain relievers', 'Test alternative value propositions', 'Gather more customer feedback']
    },
    channel_pivot: {
      label: 'Channel Pivot Recommended',
      description: 'Current channels not reaching customers effectively',
      severity: 'low',
      actions: ['Test new distribution channels', 'Review channel economics', 'Analyze competitor channels']
    },
    price_pivot: {
      label: 'Price Pivot Recommended',
      description: 'Pricing needs adjustment for better unit economics',
      severity: 'low',
      actions: ['Test higher price points', 'Add value-based pricing tiers', 'Review willingness-to-pay data']
    },
    cost_pivot: {
      label: 'Cost Pivot Recommended',
      description: 'Customer acquisition costs too high for sustainable growth',
      severity: 'low',
      actions: ['Optimize CAC channels', 'Improve conversion rates', 'Focus on organic growth']
    },
    kill: {
      label: 'Consider Stopping Project',
      description: 'Evidence suggests no viable path forward',
      severity: 'high',
      actions: ['Review all evidence', 'Consider pivoting to new idea', 'Preserve learnings']
    }
  }

  const config = pivotConfig[pivotType]

  const severityColors: Record<string, string> = {
    none: 'border-gray-200 bg-gray-50',
    low: 'border-blue-200 bg-blue-50',
    medium: 'border-amber-200 bg-amber-50',
    high: 'border-red-200 bg-red-50'
  }

  const severityTextColors: Record<string, string> = {
    none: 'text-gray-700',
    low: 'text-blue-700',
    medium: 'text-amber-700',
    high: 'text-red-700'
  }

  return (
    <Card className={cn('border-l-4', severityColors[config.severity])}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn('h-5 w-5', severityTextColors[config.severity])} />
          <CardTitle className={cn('text-lg', severityTextColors[config.severity])}>
            {config.label}
          </CardTitle>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium">Recommended Actions:</p>
          <ul className="space-y-1">
            {config.actions.map((action, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                <ArrowRight className="h-3 w-3" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function getPhaseConfig(phase: Phase) {
  const configs: Record<Phase, { label: string; icon: React.ReactNode; badgeColor: string }> = {
    ideation: {
      label: 'Ideation',
      icon: null,
      badgeColor: 'bg-gray-100 text-gray-800'
    },
    desirability: {
      label: 'Testing Desirability',
      icon: null,
      badgeColor: 'bg-pink-100 text-pink-800'
    },
    feasibility: {
      label: 'Testing Feasibility',
      icon: null,
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    viability: {
      label: 'Testing Viability',
      icon: null,
      badgeColor: 'bg-yellow-100 text-yellow-800'
    },
    validated: {
      label: 'Validated',
      icon: <CheckCircle className="h-3 w-3" />,
      badgeColor: 'bg-green-100 text-green-800'
    },
    killed: {
      label: 'Killed',
      icon: <XCircle className="h-3 w-3" />,
      badgeColor: 'bg-red-100 text-red-800'
    }
  }
  return configs[phase]
}

function ValidationDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
