/**
 * @story US-CP08
 */
"use client"

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Target,
  Users,
  Zap,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Info,
  Percent,
  RefreshCcw
} from 'lucide-react'
import type {
  ViabilityMetrics,
  ViabilityEvidence,
  ViabilitySignal,
  BusinessModelType
} from '@/types/crewai'
import {
  VIABILITY_BENCHMARKS,
  compareMetricToBenchmark,
  getBenchmarkComparison,
  formatBusinessModelType,
  calculateBreakdownPercentages,
  CAC_BREAKDOWN_CATEGORIES,
  LTV_BREAKDOWN_CATEGORIES,
  type MetricStatus
} from '@/lib/viability/benchmarks'

/**
 * Enhanced Viability Metrics Panel
 *
 * Displays all viability metrics from CrewAI Ledger Crew including:
 * - Primary metrics: LTV/CAC ratio, gross margin, payback period
 * - Secondary metrics: monthly churn rate, break-even customers
 * - Breakdown views: CAC breakdown, LTV breakdown
 * - Business model context: model-specific benchmarks
 * - Model assumptions: collapsible calculation details
 */

interface ViabilityMetricsPanelProps {
  /** Full viability metrics from CrewAI ViabilityMetrics model */
  metrics?: ViabilityMetrics | null
  /** Viability evidence summary */
  evidence?: ViabilityEvidence | null
  /** Current viability signal */
  signal: ViabilitySignal
  /** Business model type for benchmark context */
  businessModelType?: BusinessModelType
  /** Show CAC/LTV breakdown charts */
  showBreakdowns?: boolean
  /** Display variant */
  variant?: 'full' | 'compact' | 'inline'
  /** Additional className */
  className?: string
}

export function ViabilityMetricsPanel({
  metrics,
  evidence,
  signal,
  businessModelType = 'unknown',
  showBreakdowns = true,
  variant = 'full',
  className
}: ViabilityMetricsPanelProps) {
  const [assumptionsOpen, setAssumptionsOpen] = useState(false)
  const [breakdownsOpen, setBreakdownsOpen] = useState(false)

  const benchmark = VIABILITY_BENCHMARKS[businessModelType]

  // Use metrics if available, otherwise fall back to evidence
  const displayData = {
    cac: metrics?.cac_usd ?? evidence?.cac ?? 0,
    ltv: metrics?.ltv_usd ?? evidence?.ltv ?? 0,
    ltvCacRatio: metrics?.ltv_cac_ratio ?? evidence?.ltv_cac_ratio ?? 0,
    grossMargin: metrics?.gross_margin_pct ?? evidence?.gross_margin ?? 0,
    paybackMonths: metrics?.payback_months ?? evidence?.payback_months ?? 0,
    tam: metrics?.tam_annual_revenue_potential_usd ?? evidence?.tam_usd ?? 0,
    monthlyChurn: metrics?.monthly_churn_pct ?? 0,
    breakEven: evidence?.break_even_customers ?? 0,
    cacBreakdown: metrics?.cac_breakdown ?? {},
    ltvBreakdown: metrics?.ltv_breakdown ?? {},
    assumptions: metrics?.model_assumptions ?? {},
    benchmarkSource: metrics?.benchmark_source
  }

  const signalConfig = getSignalConfig(signal)

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-4 text-sm', className)}>
        <Badge className={signalConfig.badgeColor}>
          {signalConfig.icon}
          <span className="ml-1">{signalConfig.label}</span>
        </Badge>
        <span>
          LTV/CAC: <strong>{displayData.ltvCacRatio.toFixed(1)}x</strong>
        </span>
        <span>
          Margin: <strong>{formatPercent(displayData.grossMargin)}</strong>
        </span>
        <span>
          Payback: <strong>{displayData.paybackMonths.toFixed(0)}mo</strong>
        </span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('border-l-4', signalConfig.borderColor, className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <CardTitle className="text-base">Viability</CardTitle>
            </div>
            <Badge className={signalConfig.badgeColor}>
              {signalConfig.icon}
              <span className="ml-1">{signalConfig.label}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-2 text-center">
            <CompactMetric label="LTV/CAC" value={`${displayData.ltvCacRatio.toFixed(1)}x`} />
            <CompactMetric label="Margin" value={formatPercent(displayData.grossMargin)} />
            <CompactMetric label="Payback" value={`${displayData.paybackMonths.toFixed(0)}mo`} />
            <CompactMetric label="Churn" value={formatPercent(displayData.monthlyChurn)} />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full variant
  return (
    <Card className={cn('border-l-4', signalConfig.borderColor, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-lg">Viability Metrics</CardTitle>
          </div>
          <Badge className={signalConfig.badgeColor}>
            {signalConfig.icon}
            <span className="ml-1">{signalConfig.label}</span>
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <span>Unit economics from Ledger (CFO)</span>
          {businessModelType !== 'unknown' && (
            <Badge variant="outline" className="text-xs">
              {formatBusinessModelType(businessModelType)}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Primary Metric: LTV/CAC Ratio */}
        <LTVCACRatioDisplay
          ratio={displayData.ltvCacRatio}
          ltv={displayData.ltv}
          cac={displayData.cac}
          benchmark={benchmark}
          signal={signal}
        />

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Gross Margin"
            value={formatPercent(displayData.grossMargin)}
            icon={<Zap className="h-4 w-4 text-green-600" />}
            status={compareMetricToBenchmark(displayData.grossMargin, benchmark.target_gross_margin)}
            benchmark={`Target: ${formatPercent(benchmark.target_gross_margin)}`}
          />
          <MetricCard
            label="Payback Period"
            value={`${displayData.paybackMonths.toFixed(1)} months`}
            icon={<Clock className="h-4 w-4 text-blue-600" />}
            status={compareMetricToBenchmark(displayData.paybackMonths, benchmark.typical_payback_months, false)}
            benchmark={`Typical: ${benchmark.typical_payback_months}mo`}
          />
          <MetricCard
            label="Monthly Churn"
            value={formatPercent(displayData.monthlyChurn)}
            icon={<RefreshCcw className="h-4 w-4 text-orange-600" />}
            status={compareMetricToBenchmark(displayData.monthlyChurn, benchmark.typical_churn_pct, false)}
            benchmark={`Typical: ${formatPercent(benchmark.typical_churn_pct)}`}
          />
          <MetricCard
            label="TAM"
            value={formatCurrency(displayData.tam)}
            icon={<Users className="h-4 w-4 text-purple-600" />}
            status={displayData.tam >= benchmark.tam_threshold_usd ? 'good' : 'warning'}
            benchmark={`Min: ${formatCurrency(benchmark.tam_threshold_usd)}`}
          />
        </div>

        {/* Break-even customers if available */}
        {displayData.breakEven > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Break-even Point</span>
            </div>
            <span className="text-lg font-bold">
              {displayData.breakEven.toLocaleString()} customers
            </span>
          </div>
        )}

        {/* Zombie Market Warning */}
        {signal === 'zombie_market' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
            <AlertTriangle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-purple-800">Zombie Market Detected</p>
              <p className="text-xs text-purple-700">
                Unit economics are positive but TAM is too small for a venture-scale business.
                Consider expanding the addressable market or pivoting to adjacent segments.
              </p>
            </div>
          </div>
        )}

        {/* CAC/LTV Breakdowns */}
        {showBreakdowns && (Object.keys(displayData.cacBreakdown).length > 0 || Object.keys(displayData.ltvBreakdown).length > 0) && (
          <Collapsible open={breakdownsOpen} onOpenChange={setBreakdownsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">CAC & LTV Breakdowns</span>
                </div>
                {breakdownsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-4">
              {Object.keys(displayData.cacBreakdown).length > 0 && (
                <BreakdownChart
                  title="CAC Breakdown"
                  total={displayData.cac}
                  breakdown={displayData.cacBreakdown}
                  categories={CAC_BREAKDOWN_CATEGORIES}
                />
              )}
              {Object.keys(displayData.ltvBreakdown).length > 0 && (
                <BreakdownChart
                  title="LTV Breakdown"
                  total={displayData.ltv}
                  breakdown={displayData.ltvBreakdown}
                  categories={LTV_BREAKDOWN_CATEGORIES}
                />
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Model Assumptions */}
        {Object.keys(displayData.assumptions).length > 0 && (
          <Collapsible open={assumptionsOpen} onOpenChange={setAssumptionsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span className="text-sm font-medium">Model Assumptions</span>
                  {displayData.benchmarkSource && (
                    <Badge variant="outline" className="text-xs">
                      {displayData.benchmarkSource}
                    </Badge>
                  )}
                </div>
                {assumptionsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="rounded-lg border p-3 bg-muted/50">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(displayData.assumptions).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <dt className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </dt>
                      <dd className="font-medium">
                        {typeof value === 'number'
                          ? value.toLocaleString()
                          : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Viability Assessment Text */}
        {evidence?.viability_assessment && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Assessment Summary
            </p>
            <p className="text-sm text-muted-foreground">{evidence.viability_assessment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Sub-components

function LTVCACRatioDisplay({
  ratio,
  ltv,
  cac,
  benchmark,
  signal
}: {
  ratio: number
  ltv: number
  cac: number
  benchmark: typeof VIABILITY_BENCHMARKS['unknown']
  signal: ViabilitySignal
}) {
  const signalConfig = getSignalConfig(signal)

  return (
    <div className="p-4 rounded-lg bg-muted">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">LTV/CAC Ratio</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={signalConfig.badgeColor}>
                {signalConfig.icon}
                <span className="ml-1">{signalConfig.shortLabel}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="text-xs space-y-1">
                <p><strong>Profitable:</strong> LTV/CAC ≥ {benchmark.healthy_ltv_cac}x</p>
                <p><strong>Marginal:</strong> LTV/CAC {benchmark.marginal_ltv_cac}-{benchmark.healthy_ltv_cac}x</p>
                <p><strong>Underwater:</strong> LTV/CAC &lt; {benchmark.marginal_ltv_cac}x</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="text-4xl font-bold mb-2">
        {ratio.toFixed(1)}x
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>LTV: ${formatNumber(ltv)}</span>
        <span className="text-muted-foreground/50">|</span>
        <span>CAC: ${formatNumber(cac)}</span>
      </div>

      {/* Progress bar showing position on healthy/marginal/underwater scale */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>0x</span>
          <span>{benchmark.marginal_ltv_cac}x</span>
          <span>{benchmark.healthy_ltv_cac}x</span>
          <span>{benchmark.healthy_ltv_cac * 2}x+</span>
        </div>
        <div className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative">
          <div
            className="absolute w-3 h-3 bg-white border-2 border-gray-800 rounded-full top-1/2 -translate-y-1/2 shadow-sm"
            style={{
              left: `${Math.min(Math.max((ratio / (benchmark.healthy_ltv_cac * 2)) * 100, 0), 100)}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  status,
  benchmark
}: {
  label: string
  value: string
  icon: React.ReactNode
  status: MetricStatus
  benchmark?: string
}) {
  const statusColors: Record<MetricStatus, string> = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    bad: 'text-red-600',
    neutral: 'text-muted-foreground'
  }

  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn('text-lg font-semibold', statusColors[status])}>
        {value}
      </p>
      {benchmark && (
        <p className="text-xs text-muted-foreground mt-1">{benchmark}</p>
      )}
    </div>
  )
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded bg-muted">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function BreakdownChart({
  title,
  total,
  breakdown,
  categories
}: {
  title: string
  total: number
  breakdown: Record<string, number>
  categories: readonly { key: string; label: string; color: string }[]
}) {
  const breakdownData = calculateBreakdownPercentages(breakdown)

  if (breakdownData.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">${formatNumber(total)}</span>
      </div>

      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex">
        {breakdownData.map((item, index) => {
          const category = categories.find(c => c.key === item.key)
          return (
            <TooltipProvider key={item.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn('h-full', category?.color ?? 'bg-gray-400')}
                    style={{ width: `${item.percentage}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {category?.label ?? item.key}: ${formatNumber(item.value)} ({item.percentage.toFixed(0)}%)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {breakdownData.map(item => {
          const category = categories.find(c => c.key === item.key)
          return (
            <div key={item.key} className="flex items-center gap-1 text-xs">
              <div className={cn('w-2 h-2 rounded-full', category?.color ?? 'bg-gray-400')} />
              <span className="text-muted-foreground">
                {category?.label ?? item.key}: {item.percentage.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Helper functions

function getSignalConfig(signal: ViabilitySignal) {
  const configs: Record<ViabilitySignal, {
    label: string
    shortLabel: string
    icon: React.ReactNode
    badgeColor: string
    borderColor: string
  }> = {
    unknown: {
      label: 'Not Analyzed',
      shortLabel: 'Unknown',
      icon: null,
      badgeColor: 'bg-gray-100 text-gray-800',
      borderColor: 'border-l-gray-400'
    },
    profitable: {
      label: 'Profitable',
      shortLabel: 'Healthy',
      icon: <TrendingUp className="h-3 w-3" />,
      badgeColor: 'bg-green-100 text-green-800',
      borderColor: 'border-l-green-500'
    },
    marginal: {
      label: 'Marginal Economics',
      shortLabel: 'Marginal',
      icon: <AlertTriangle className="h-3 w-3" />,
      badgeColor: 'bg-yellow-100 text-yellow-800',
      borderColor: 'border-l-yellow-500'
    },
    underwater: {
      label: 'Underwater',
      shortLabel: 'Underwater',
      icon: <TrendingDown className="h-3 w-3" />,
      badgeColor: 'bg-red-100 text-red-800',
      borderColor: 'border-l-red-500'
    },
    zombie_market: {
      label: 'Zombie Market',
      shortLabel: 'Zombie',
      icon: <AlertTriangle className="h-3 w-3" />,
      badgeColor: 'bg-purple-100 text-purple-800',
      borderColor: 'border-l-purple-500'
    }
  }
  return configs[signal]
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function formatPercent(n: number): string {
  // Handle both 0-1 and 0-100 formats
  const value = n > 1 ? n : n * 100
  return `${value.toFixed(1)}%`
}

export default ViabilityMetricsPanel
