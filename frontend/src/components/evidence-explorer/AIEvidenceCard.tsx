/**
 * @story US-F14
 */
'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Bot,
  Heart,
  Cog,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronRight,
  Users,
  Zap,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import type { AIEvidenceItem } from '@/types/evidence-explorer'
import type {
  DesirabilityEvidence,
  FeasibilityEvidence,
  ViabilityEvidence,
  CommitmentType,
} from '@/types/crewai'
import { DIMENSION_CONFIG, STRENGTH_CONFIG, getSignalDisplayInfo } from '@/types/evidence-explorer'

interface AIEvidenceCardProps {
  item: AIEvidenceItem
  onClick?: () => void
  className?: string
}

export function AIEvidenceCard({ item, onClick, className }: AIEvidenceCardProps) {
  const dimensionConfig = DIMENSION_CONFIG[item.dimension]
  const strengthConfig = STRENGTH_CONFIG[item.strength]
  const signalInfo = getSignalDisplayInfo(item.signal, item.dimension)

  const DimensionIcon =
    item.dimension === 'desirability' ? Heart :
    item.dimension === 'feasibility' ? Cog :
    DollarSign

  return (
    <Card
      className={cn(
        'border-l-4 transition-shadow hover:shadow-md cursor-pointer',
        dimensionConfig.borderColor,
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <Bot className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription className="text-xs">
                Iteration {item.iteration} • {format(item.timestamp, 'MMM dd, yyyy')}
              </CardDescription>
            </div>
          </div>
          <Badge className={cn('text-xs', strengthConfig.bgColor, strengthConfig.color)}>
            {strengthConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Signal Status */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
          <div className="flex items-center gap-2">
            <DimensionIcon className={cn('h-4 w-4', dimensionConfig.color)} />
            <span className="text-sm font-medium">{signalInfo.label}</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[250px]">
                <p className="text-xs">{signalInfo.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Dimension-specific metrics */}
        {item.dimension === 'desirability' && (
          <DesirabilityMetricsSummary evidence={item.evidence as DesirabilityEvidence} />
        )}
        {item.dimension === 'feasibility' && (
          <FeasibilityMetricsSummary evidence={item.evidence as FeasibilityEvidence} />
        )}
        {item.dimension === 'viability' && (
          <ViabilityMetricsSummary evidence={item.evidence as ViabilityEvidence} />
        )}

        {/* View Details */}
        <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
          View full analysis
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

// =======================================================================================
// METRIC SUMMARIES
// =======================================================================================

function DesirabilityMetricsSummary({ evidence }: { evidence: DesirabilityEvidence }) {
  const resonancePercent = Math.round(evidence.problem_resonance * 100)
  const conversionPercent = Math.round(evidence.conversion_rate * 100)
  const zombiePercent = Math.round(evidence.zombie_ratio * 100)

  return (
    <div className="space-y-2">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <MetricItem
          label="Problem Resonance"
          value={`${resonancePercent}%`}
          isGood={resonancePercent >= 60}
          isWarning={resonancePercent >= 30 && resonancePercent < 60}
        />
        <MetricItem
          label="Conversion"
          value={`${conversionPercent}%`}
          isGood={conversionPercent >= 10}
          isWarning={conversionPercent >= 3 && conversionPercent < 10}
        />
      </div>

      {/* Commitment Badge */}
      <CommitmentBadge type={evidence.commitment_depth} />

      {/* Zombie Warning */}
      {zombiePercent > 30 && (
        <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
          <AlertTriangle className="h-3 w-3" />
          <span>High zombie ratio: {zombiePercent}%</span>
        </div>
      )}

      {/* Campaign Stats */}
      {evidence.impressions > 0 && (
        <div className="flex gap-3 text-xs text-muted-foreground pt-1 border-t">
          <span>{formatNumber(evidence.impressions)} impr.</span>
          <span>{formatNumber(evidence.clicks)} clicks</span>
          <span>{formatNumber(evidence.signups)} signups</span>
        </div>
      )}
    </div>
  )
}

function FeasibilityMetricsSummary({ evidence }: { evidence: FeasibilityEvidence }) {
  const features = Object.entries(evidence.core_features_feasible)
  const possibleCount = features.filter(([, v]) => v === 'POSSIBLE').length
  const constrainedCount = features.filter(([, v]) => v === 'CONSTRAINED').length
  const impossibleCount = features.filter(([, v]) => v === 'IMPOSSIBLE').length

  return (
    <div className="space-y-2">
      {/* Feature Assessment */}
      {features.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {possibleCount > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              {possibleCount} feasible
            </Badge>
          )}
          {constrainedCount > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {constrainedCount} constrained
            </Badge>
          )}
          {impossibleCount > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
              <XCircle className="h-3 w-3 mr-1" />
              {impossibleCount} blocked
            </Badge>
          )}
        </div>
      )}

      {/* Downgrade Warning */}
      {evidence.downgrade_required && (
        <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
          <AlertTriangle className="h-3 w-3" />
          <span>Scope downgrade required</span>
        </div>
      )}

      {/* Cost Estimate */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Monthly cost estimate</span>
        <span className="font-medium">${formatNumber(evidence.monthly_cost_estimate_usd)}</span>
      </div>

      {/* Tech Risks Count */}
      {evidence.technical_risks.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {evidence.technical_risks.length} technical risk{evidence.technical_risks.length > 1 ? 's' : ''} identified
        </div>
      )}
    </div>
  )
}

function ViabilityMetricsSummary({ evidence }: { evidence: ViabilityEvidence }) {
  const ltvCacHealth =
    evidence.ltv_cac_ratio >= 3 ? 'healthy' :
    evidence.ltv_cac_ratio >= 1 ? 'marginal' : 'underwater'

  return (
    <div className="space-y-2">
      {/* LTV/CAC Ratio - Primary */}
      <div className="p-2 rounded-lg bg-muted">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">LTV/CAC Ratio</span>
          <Badge
            className={cn(
              'text-xs',
              ltvCacHealth === 'healthy' && 'bg-green-100 text-green-700',
              ltvCacHealth === 'marginal' && 'bg-yellow-100 text-yellow-700',
              ltvCacHealth === 'underwater' && 'bg-red-100 text-red-700'
            )}
          >
            {ltvCacHealth === 'healthy' && <TrendingUp className="h-3 w-3 mr-1" />}
            {ltvCacHealth === 'underwater' && <TrendingDown className="h-3 w-3 mr-1" />}
            {evidence.ltv_cac_ratio.toFixed(1)}x
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>LTV: ${formatNumber(evidence.ltv)}</span>
          <span>CAC: ${formatNumber(evidence.cac)}</span>
        </div>
      </div>

      {/* Other Metrics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <MetricItem
          label="Gross Margin"
          value={`${Math.round(evidence.gross_margin * 100)}%`}
          isGood={evidence.gross_margin >= 0.6}
          isWarning={evidence.gross_margin >= 0.4 && evidence.gross_margin < 0.6}
        />
        <MetricItem
          label="Payback"
          value={`${evidence.payback_months.toFixed(0)} mo`}
          isGood={evidence.payback_months <= 12}
          isWarning={evidence.payback_months > 12 && evidence.payback_months <= 24}
        />
      </div>

      {/* TAM */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>TAM</span>
        <span>${formatCurrency(evidence.tam_usd)}</span>
      </div>
    </div>
  )
}

// =======================================================================================
// HELPER COMPONENTS
// =======================================================================================

function MetricItem({
  label,
  value,
  isGood,
  isWarning,
}: {
  label: string
  value: string
  isGood?: boolean
  isWarning?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-medium',
          isGood && 'text-green-600',
          isWarning && 'text-yellow-600',
          !isGood && !isWarning && 'text-red-600'
        )}
      >
        {value}
      </span>
    </div>
  )
}

function CommitmentBadge({ type }: { type: CommitmentType }) {
  const config = {
    skin_in_game: {
      label: 'Skin in Game',
      icon: CheckCircle,
      className: 'text-green-600 bg-green-50 border-green-200',
    },
    verbal: {
      label: 'Verbal Only',
      icon: AlertTriangle,
      className: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    },
    none: {
      label: 'No Commitment',
      icon: XCircle,
      className: 'text-red-600 bg-red-50 border-red-200',
    },
  }

  const { label, icon: Icon, className } = config[type] || config.none

  return (
    <Badge variant="outline" className={cn('text-xs gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

// =======================================================================================
// FORMATTING HELPERS
// =======================================================================================

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

export default AIEvidenceCard
