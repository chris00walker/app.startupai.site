"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Heart,
  Cog,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Target
} from 'lucide-react'
import type {
  DesirabilityEvidence,
  FeasibilityEvidence,
  ViabilityEvidence,
  CommitmentType
} from '@/types/crewai'

/**
 * Desirability Evidence Metrics Display
 * Shows: problem_resonance, conversion_rate, commitment_depth, zombie_ratio
 */
interface DesirabilityMetricsProps {
  evidence: DesirabilityEvidence
  className?: string
}

export function DesirabilityMetrics({ evidence, className }: DesirabilityMetricsProps) {
  const resonancePercent = Math.round(evidence.problem_resonance * 100)
  const conversionPercent = Math.round(evidence.conversion_rate * 100)
  const zombiePercent = Math.round(evidence.zombie_ratio * 100)

  const getCommitmentDisplay = (type: CommitmentType) => {
    switch (type) {
      case 'skin_in_game':
        return { label: 'Skin in Game', color: 'text-green-600', icon: CheckCircle }
      case 'verbal':
        return { label: 'Verbal Only', color: 'text-yellow-600', icon: AlertTriangle }
      case 'none':
      default:
        return { label: 'No Commitment', color: 'text-red-600', icon: XCircle }
    }
  }

  const commitment = getCommitmentDisplay(evidence.commitment_depth)
  const CommitmentIcon = commitment.icon

  return (
    <Card className={cn('border-l-4 border-l-pink-500', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-600" />
          <CardTitle className="text-lg">Desirability Evidence</CardTitle>
        </div>
        <CardDescription>Customer demand and problem-solution fit metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Problem Resonance Gauge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Problem Resonance</span>
            <span className={cn(
              'font-bold',
              resonancePercent >= 60 ? 'text-green-600' :
              resonancePercent >= 30 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {resonancePercent}%
            </span>
          </div>
          <Progress
            value={resonancePercent}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            How strongly the problem resonates with target customers
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Conversion Rate</span>
            <span className={cn(
              'font-bold',
              conversionPercent >= 10 ? 'text-green-600' :
              conversionPercent >= 3 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {conversionPercent}%
            </span>
          </div>
          <Progress
            value={conversionPercent}
            className="h-2"
          />
        </div>

        {/* Commitment Depth */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <div className="flex items-center gap-2">
            <CommitmentIcon className={cn('h-4 w-4', commitment.color)} />
            <span className="text-sm font-medium">Commitment Depth</span>
          </div>
          <Badge variant="outline" className={commitment.color}>
            {commitment.label}
          </Badge>
        </div>

        {/* Zombie Ratio Warning */}
        {zombiePercent > 30 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                High Zombie Ratio: {zombiePercent}%
              </p>
              <p className="text-xs text-yellow-700">
                Many users show interest but fail to commit. Consider segment or value pivot.
              </p>
            </div>
          </div>
        )}

        {/* Campaign Metrics */}
        {(evidence.impressions > 0 || evidence.clicks > 0) && (
          <div className="grid grid-cols-4 gap-2 pt-2 border-t">
            <MetricChip label="Impressions" value={formatNumber(evidence.impressions)} />
            <MetricChip label="Clicks" value={formatNumber(evidence.clicks)} />
            <MetricChip label="Signups" value={formatNumber(evidence.signups)} />
            <MetricChip label="Spend" value={`$${formatNumber(evidence.spend_usd)}`} />
          </div>
        )}

        {/* Key Learnings */}
        {evidence.key_learnings.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Key Learnings
            </p>
            <ul className="space-y-1">
              {evidence.key_learnings.slice(0, 3).map((learning, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-pink-600">•</span>
                  {learning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Feasibility Evidence Metrics Display
 * Shows: core_features_feasible, technical_risks, monthly_cost_estimate
 */
interface FeasibilityMetricsProps {
  evidence: FeasibilityEvidence
  className?: string
}

export function FeasibilityMetrics({ evidence, className }: FeasibilityMetricsProps) {
  const features = Object.entries(evidence.core_features_feasible)
  const possibleCount = features.filter(([, v]) => v === 'POSSIBLE').length
  const constrainedCount = features.filter(([, v]) => v === 'CONSTRAINED').length
  const impossibleCount = features.filter(([, v]) => v === 'IMPOSSIBLE').length

  return (
    <Card className={cn('border-l-4 border-l-blue-500', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Cog className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Feasibility Evidence</CardTitle>
        </div>
        <CardDescription>Technical viability and build assessment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feature Feasibility Summary */}
        {features.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Core Features Assessment</p>
            <div className="flex gap-2">
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {possibleCount} Possible
              </Badge>
              {constrainedCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {constrainedCount} Constrained
                </Badge>
              )}
              {impossibleCount > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 mr-1" />
                  {impossibleCount} Impossible
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Downgrade Warning */}
        {evidence.downgrade_required && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Scope Downgrade Required
              </p>
              {evidence.downgrade_impact && (
                <p className="text-xs text-orange-700">{evidence.downgrade_impact}</p>
              )}
            </div>
          </div>
        )}

        {/* Technical Risks */}
        {evidence.technical_risks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Technical Risks</p>
              <Badge variant="outline" className="text-red-600">
                {evidence.technical_risks.length} identified
              </Badge>
            </div>
            <ul className="space-y-1">
              {evidence.technical_risks.slice(0, 3).map((risk, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cost Estimate */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Monthly Cost Estimate</span>
          </div>
          <span className="text-lg font-bold">
            ${formatNumber(evidence.monthly_cost_estimate_usd)}
          </span>
        </div>

        {/* Effort Estimate */}
        {evidence.estimated_effort && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated Effort</span>
            <span className="font-medium">{evidence.estimated_effort}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Viability Evidence Metrics Display
 * Shows: LTV/CAC ratio, payback_months, gross_margin, TAM
 */
interface ViabilityMetricsProps {
  evidence: ViabilityEvidence
  className?: string
}

export function ViabilityMetrics({ evidence, className }: ViabilityMetricsProps) {
  const ltvCacHealth = evidence.ltv_cac_ratio >= 3 ? 'healthy' :
                       evidence.ltv_cac_ratio >= 1 ? 'marginal' : 'underwater'

  const healthColors = {
    healthy: 'text-green-600 bg-green-100',
    marginal: 'text-yellow-600 bg-yellow-100',
    underwater: 'text-red-600 bg-red-100'
  }

  return (
    <Card className={cn('border-l-4 border-l-green-500', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Viability Evidence</CardTitle>
        </div>
        <CardDescription>Unit economics and financial sustainability</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* LTV/CAC Ratio - Primary Metric */}
        <div className="p-4 rounded-lg bg-muted">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">LTV/CAC Ratio</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge className={healthColors[ltvCacHealth]}>
                    {ltvCacHealth === 'healthy' ? (
                      <><TrendingUp className="h-3 w-3 mr-1" /> Healthy</>
                    ) : ltvCacHealth === 'marginal' ? (
                      <><AlertTriangle className="h-3 w-3 mr-1" /> Marginal</>
                    ) : (
                      <><TrendingDown className="h-3 w-3 mr-1" /> Underwater</>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Healthy: ≥3x | Marginal: 1-3x | Underwater: &lt;1x
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-3xl font-bold">
            {evidence.ltv_cac_ratio.toFixed(1)}x
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>LTV: ${formatNumber(evidence.ltv)}</span>
            <span>CAC: ${formatNumber(evidence.cac)}</span>
          </div>
        </div>

        {/* Unit Economics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Gross Margin"
            value={`${Math.round(evidence.gross_margin * 100)}%`}
            icon={<Zap className="h-4 w-4 text-green-600" />}
            isGood={evidence.gross_margin >= 0.6}
          />
          <MetricCard
            label="Payback Period"
            value={`${evidence.payback_months.toFixed(1)} mo`}
            icon={<Clock className="h-4 w-4 text-blue-600" />}
            isGood={evidence.payback_months <= 12}
          />
          <MetricCard
            label="Break-even"
            value={`${formatNumber(evidence.break_even_customers)} customers`}
            icon={<Target className="h-4 w-4 text-purple-600" />}
          />
          <MetricCard
            label="TAM"
            value={`$${formatCurrency(evidence.tam_usd)}`}
            icon={<Users className="h-4 w-4 text-pink-600" />}
          />
        </div>

        {/* Viability Assessment */}
        {evidence.viability_assessment && (
          <div className="pt-2 border-t">
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

// Helper components

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded bg-muted">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  isGood
}: {
  label: string
  value: string
  icon: React.ReactNode
  isGood?: boolean
}) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn(
        'text-lg font-semibold',
        isGood !== undefined && (isGood ? 'text-green-600' : 'text-yellow-600')
      )}>
        {value}
      </p>
    </div>
  )
}

// Formatting helpers

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

export default DesirabilityMetrics
