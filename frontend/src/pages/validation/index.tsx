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
// import { useProject } from '@/hooks/useProject' // TODO: Create this hook when needed

// Types
import type {
  Phase,
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
  PivotType
} from '@/types/crewai'

// Demo data for development
const DEMO_DATA = {
  segment: {
    segmentKey: 'early-adopters',
    segmentName: 'Early Adopter Founders',
    customerProfile: {
      segment_name: 'Early Adopter Founders',
      jobs: [
        { functional: 'Validate business ideas quickly', emotional: 'Feel confident', social: 'Be seen as innovative', importance: 9 },
        { functional: 'Reduce startup risk', emotional: 'Reduce anxiety', social: 'Appear credible to investors', importance: 8 }
      ],
      pains: ['Wasting time on bad ideas', 'Lack of validation methodology', 'Investor skepticism'],
      gains: ['Fast validation cycles', 'Data-driven decisions', 'Investor confidence'],
      pain_intensity: { 'Wasting time on bad ideas': 9, 'Lack of validation methodology': 8 },
      gain_importance: { 'Fast validation cycles': 9, 'Data-driven decisions': 8 }
    }
  },
  signals: {
    desirability: 'strong_commitment' as DesirabilitySignal,
    feasibility: 'green' as FeasibilitySignal,
    viability: 'marginal' as ViabilitySignal
  },
  evidence: {
    desirability: {
      problem_resonance: 0.72,
      conversion_rate: 0.08,
      commitment_depth: 'skin_in_game' as const,
      zombie_ratio: 0.15,
      experiments: [],
      key_learnings: ['Problem resonates strongly', 'Price sensitivity moderate'],
      tested_segments: ['Early Adopter Founders'],
      impressions: 50000,
      clicks: 2500,
      signups: 200,
      spend_usd: 3500
    },
    feasibility: {
      core_features_feasible: { 'AI Analysis': 'POSSIBLE', 'VPC Generator': 'POSSIBLE', 'Real-time Dashboard': 'CONSTRAINED' } as Record<string, 'POSSIBLE' | 'CONSTRAINED' | 'IMPOSSIBLE'>,
      technical_risks: ['LLM cost scaling', 'Real-time sync complexity'],
      skill_requirements: ['AI/ML Engineer', 'Full-stack Developer'],
      estimated_effort: '3-4 months',
      downgrade_required: false,
      removed_features: [],
      alternative_approaches: ['Async processing instead of real-time'],
      monthly_cost_estimate_usd: 2500
    },
    viability: {
      cac: 175,
      ltv: 420,
      ltv_cac_ratio: 2.4,
      gross_margin: 0.68,
      payback_months: 8,
      break_even_customers: 150,
      tam_usd: 45000000,
      market_share_target: 0.02,
      viability_assessment: 'Marginal economics - needs CAC optimization or price increase'
    }
  },
  metrics: {
    cac_usd: 175,
    ltv_usd: 420,
    ltv_cac_ratio: 2.4,
    gross_margin_pct: 0.68,
    tam_annual_revenue_potential_usd: 45000000,
    monthly_churn_pct: 0.04,
    payback_months: 8,
    cac_breakdown: { marketing: 100, sales: 50, onboarding: 25 },
    ltv_breakdown: { subscription: 350, expansion: 50, services: 20 },
    model_assumptions: { avg_contract_months: 24, expansion_rate: 0.12 }
  },
  bmcData: {
    revenueStreams: ['SaaS Subscription ($99/mo)', 'Enterprise tier ($499/mo)', 'Professional Services'],
    costStructure: ['Cloud Infrastructure', 'AI/ML Processing', 'Customer Support', 'Marketing']
  },
  phase: 'viability' as Phase,
  pivotRecommendation: 'cost_pivot' as PivotType
}

export default function ValidationDashboard() {
  const router = useRouter()
  const { projectId } = router.query

  // In production, use real hooks
  // const { state, isLoading, error, refetch } = useCrewAIState(projectId as string)
  // const { project } = useProject(projectId as string)

  // For demo, use static data
  const isDemo = !projectId || projectId === 'demo'
  const isLoading = false
  const error = null

  const data = useMemo(() => {
    // In production, transform state to our display format
    // For now, use demo data
    return DEMO_DATA
  }, [])

  const phaseConfig = getPhaseConfig(data.phase)

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

  return (
    <>
      <Head>
        <title>Validation Dashboard | StartupAI</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Breadcrumb */}
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

          {/* Header */}
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
              {isDemo && (
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                  Demo Mode
                </Badge>
              )}
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
              onViewFullVPC={() => router.push('/canvas/vpc')}
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
              href="/canvas/vpc"
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
