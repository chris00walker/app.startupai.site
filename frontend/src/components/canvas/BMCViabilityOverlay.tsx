/**
 * @story US-CP03
 */
"use client"

/**
 * BMC Viability Overlay Component
 *
 * Adds viability metrics overlay to Business Model Canvas Revenue Streams
 * and Cost Structure blocks. Displays Ledger Crew economics alongside
 * the standard BMC content.
 *
 * Usage:
 * - Use as standalone overlay cards for Revenue/Cost sections
 * - Or integrate into existing BMC component
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Coins,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Percent,
  RefreshCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViabilityMetrics, ViabilityEvidence, ViabilitySignal } from '@/types/crewai'
import {
  VIABILITY_BENCHMARKS,
  formatBusinessModelType,
  calculateBreakdownPercentages,
  LTV_BREAKDOWN_CATEGORIES,
  CAC_BREAKDOWN_CATEGORIES,
  type MetricStatus
} from '@/lib/viability/benchmarks'
import type { BusinessModelType } from '@/types/crewai'

interface ViabilityOverlayProps {
  metrics?: ViabilityMetrics | null
  evidence?: ViabilityEvidence | null
  signal?: ViabilitySignal
  businessModelType?: BusinessModelType
  className?: string
}

/**
 * Revenue Streams with LTV Overlay
 *
 * Enhances the Revenue Streams block with:
 * - LTV estimate
 * - LTV breakdown (subscription, expansion, services)
 * - Monthly churn indicator
 */
interface RevenueStreamsOverlayProps extends ViabilityOverlayProps {
  items: string[]
}

export function RevenueStreamsOverlay({
  items,
  metrics,
  evidence,
  signal,
  businessModelType = 'unknown',
  className
}: RevenueStreamsOverlayProps) {
  const ltv = metrics?.ltv_usd ?? evidence?.ltv ?? 0
  const ltvBreakdown = metrics?.ltv_breakdown ?? {}
  const monthlyChurn = metrics?.monthly_churn_pct ?? 0
  const hasBreakdown = Object.keys(ltvBreakdown).length > 0

  const benchmark = VIABILITY_BENCHMARKS[businessModelType]
  const breakdownPercentages = calculateBreakdownPercentages(ltvBreakdown)

  return (
    <Card className={cn('h-full border hover:shadow-md transition-all', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Coins className="w-4 h-4 text-green-600" />
            Revenue Streams
          </CardTitle>
          {ltv > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                    LTV: ${formatNumber(ltv)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Customer Lifetime Value from Ledger Crew</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <CardDescription className="text-sm">
          For what value are customers willing to pay?
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Revenue Items */}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, index) => (
              item.trim() && (
                <div key={index} className="p-3 bg-muted/30 rounded-md text-sm leading-relaxed">
                  {item}
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Coins className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No revenue streams added</p>
          </div>
        )}

        {/* LTV Metrics Overlay */}
        {ltv > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-800 uppercase tracking-wide">
                Unit Economics
              </span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>

            {/* LTV Breakdown Bar */}
            {hasBreakdown && (
              <div className="space-y-1">
                <div className="text-xs text-green-700 mb-1">LTV Sources</div>
                <div className="h-2 rounded-full overflow-hidden flex">
                  {breakdownPercentages.map((item, idx) => {
                    const category = LTV_BREAKDOWN_CATEGORIES.find(c => c.key === item.key)
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
                <div className="flex flex-wrap gap-2 text-[10px] text-green-700">
                  {breakdownPercentages.map(item => {
                    const category = LTV_BREAKDOWN_CATEGORIES.find(c => c.key === item.key)
                    return (
                      <span key={item.key} className="flex items-center gap-1">
                        <div className={cn('w-1.5 h-1.5 rounded-full', category?.color ?? 'bg-gray-400')} />
                        {category?.label ?? item.key}: {item.percentage.toFixed(0)}%
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Churn Indicator */}
            {monthlyChurn > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-700 flex items-center gap-1">
                  <RefreshCcw className="h-3 w-3" />
                  Monthly Churn
                </span>
                <span className={cn(
                  'font-medium',
                  monthlyChurn <= benchmark.typical_churn_pct ? 'text-green-700' :
                  monthlyChurn <= benchmark.typical_churn_pct * 1.5 ? 'text-yellow-700' :
                  'text-red-700'
                )}>
                  {(monthlyChurn * 100).toFixed(1)}%
                  {monthlyChurn <= benchmark.typical_churn_pct && ' (healthy)'}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Cost Structure with CAC Overlay
 *
 * Enhances the Cost Structure block with:
 * - CAC estimate
 * - CAC breakdown (marketing, sales, onboarding)
 * - Infrastructure costs from Build Crew
 */
interface CostStructureOverlayProps extends ViabilityOverlayProps {
  items: string[]
  infraCosts?: Record<string, number>
  apiCosts?: Record<string, number>
}

export function CostStructureOverlay({
  items,
  metrics,
  evidence,
  signal,
  businessModelType = 'unknown',
  infraCosts = {},
  apiCosts = {},
  className
}: CostStructureOverlayProps) {
  const cac = metrics?.cac_usd ?? evidence?.cac ?? 0
  const cacBreakdown = metrics?.cac_breakdown ?? {}
  const hasBreakdown = Object.keys(cacBreakdown).length > 0

  const totalInfra = Object.values(infraCosts).reduce((sum, v) => sum + v, 0)
  const totalApi = Object.values(apiCosts).reduce((sum, v) => sum + v, 0)
  const totalMonthlyCost = totalInfra + totalApi

  const benchmark = VIABILITY_BENCHMARKS[businessModelType]
  const breakdownPercentages = calculateBreakdownPercentages(cacBreakdown)

  return (
    <Card className={cn('h-full border hover:shadow-md transition-all', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <DollarSign className="w-4 h-4 text-red-600" />
            Cost Structure
          </CardTitle>
          {cac > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                    CAC: ${formatNumber(cac)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Customer Acquisition Cost from Ledger Crew</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <CardDescription className="text-sm">
          What are the most important costs in your business model?
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Cost Items */}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, index) => (
              item.trim() && (
                <div key={index} className="p-3 bg-muted/30 rounded-md text-sm leading-relaxed">
                  {item}
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <DollarSign className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No costs added</p>
          </div>
        )}

        {/* CAC Metrics Overlay */}
        {cac > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-800 uppercase tracking-wide">
                Acquisition Costs
              </span>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>

            {/* CAC Breakdown Bar */}
            {hasBreakdown && (
              <div className="space-y-1">
                <div className="text-xs text-red-700 mb-1">CAC Sources</div>
                <div className="h-2 rounded-full overflow-hidden flex">
                  {breakdownPercentages.map((item, idx) => {
                    const category = CAC_BREAKDOWN_CATEGORIES.find(c => c.key === item.key)
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
                <div className="flex flex-wrap gap-2 text-[10px] text-red-700">
                  {breakdownPercentages.map(item => {
                    const category = CAC_BREAKDOWN_CATEGORIES.find(c => c.key === item.key)
                    return (
                      <span key={item.key} className="flex items-center gap-1">
                        <div className={cn('w-1.5 h-1.5 rounded-full', category?.color ?? 'bg-gray-400')} />
                        {category?.label ?? item.key}: {item.percentage.toFixed(0)}%
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Infrastructure Costs (from Build Crew) */}
        {totalMonthlyCost > 0 && (
          <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-800 uppercase tracking-wide">
                Monthly Infrastructure
              </span>
              <span className="text-sm font-bold text-blue-700">
                ${formatNumber(totalMonthlyCost)}/mo
              </span>
            </div>

            {Object.keys(infraCosts).length > 0 && (
              <div className="space-y-1 text-xs text-blue-700">
                {Object.entries(infraCosts).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}</span>
                    <span>${formatNumber(value)}</span>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(apiCosts).length > 0 && (
              <div className="space-y-1 text-xs text-blue-700 mt-2 pt-2 border-t border-blue-200">
                {Object.entries(apiCosts).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key} API</span>
                    <span>${formatNumber(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact LTV/CAC Summary
 *
 * A small inline display of the key viability metrics
 * for use in BMC headers or compact views.
 */
export function ViabilitySummaryBar({
  metrics,
  evidence,
  signal,
  className
}: ViabilityOverlayProps) {
  const cac = metrics?.cac_usd ?? evidence?.cac ?? 0
  const ltv = metrics?.ltv_usd ?? evidence?.ltv ?? 0
  const ratio = metrics?.ltv_cac_ratio ?? evidence?.ltv_cac_ratio ?? 0
  const grossMargin = metrics?.gross_margin_pct ?? evidence?.gross_margin ?? 0

  if (cac === 0 && ltv === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Info className="h-4 w-4" />
        <span>No viability data available</span>
      </div>
    )
  }

  const getSignalColor = () => {
    if (signal === 'profitable') return 'text-green-600'
    if (signal === 'marginal') return 'text-yellow-600'
    if (signal === 'underwater') return 'text-red-600'
    if (signal === 'zombie_market') return 'text-purple-600'
    return 'text-gray-600'
  }

  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">LTV:</span>
        <span className="font-medium text-green-600">${formatNumber(ltv)}</span>
      </div>
      <div className="text-muted-foreground">/</div>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">CAC:</span>
        <span className="font-medium text-red-600">${formatNumber(cac)}</span>
      </div>
      <div className="text-muted-foreground">=</div>
      <div className={cn('flex items-center gap-1 font-bold', getSignalColor())}>
        {ratio.toFixed(1)}x
        {ratio >= 3 && <TrendingUp className="h-4 w-4" />}
        {ratio < 1 && <TrendingDown className="h-4 w-4" />}
      </div>
      {grossMargin > 0 && (
        <>
          <div className="text-muted-foreground">|</div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Margin:</span>
            <span className="font-medium">{Math.round(grossMargin * 100)}%</span>
          </div>
        </>
      )}
    </div>
  )
}

// Helper function
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export default {
  RevenueStreamsOverlay,
  CostStructureOverlay,
  ViabilitySummaryBar
}
