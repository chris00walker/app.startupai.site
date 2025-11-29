'use client'

import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Heart,
  Cog,
  DollarSign,
  Bot,
  User,
  Calendar,
  FileText,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Info,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import type {
  UnifiedEvidenceItem,
  UserEvidenceItem,
  AIEvidenceItem,
  EvidenceDimension,
} from '@/types/evidence-explorer'
import type {
  DesirabilityEvidence,
  FeasibilityEvidence,
  ViabilityEvidence,
} from '@/types/crewai'
import {
  DIMENSION_CONFIG,
  STRENGTH_CONFIG,
  METHODOLOGY_TOOLTIPS,
  getSignalDisplayInfo,
} from '@/types/evidence-explorer'

interface EvidenceDetailPanelProps {
  evidence: UnifiedEvidenceItem | null
  open: boolean
  onClose: () => void
}

const categoryIcons = {
  Survey: BarChart3,
  Interview: Users,
  Experiment: FileText,
  Analytics: BarChart3,
  Research: FileText,
}

const dimensionIcons: Record<EvidenceDimension, typeof Heart> = {
  desirability: Heart,
  feasibility: Cog,
  viability: DollarSign,
}

export function EvidenceDetailPanel({ evidence, open, onClose }: EvidenceDetailPanelProps) {
  if (!evidence) return null

  const dimensionConfig = DIMENSION_CONFIG[evidence.dimension]
  const strengthConfig = STRENGTH_CONFIG[evidence.strength]
  const DimensionIcon = dimensionIcons[evidence.dimension]

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2 mb-2">
            {evidence.source === 'ai' ? (
              <Bot className="h-5 w-5 text-purple-500" />
            ) : (
              <User className="h-5 w-5 text-blue-500" />
            )}
            <Badge variant="outline" className="text-xs">
              {evidence.source === 'ai' ? 'AI Analysis' : 'User Created'}
            </Badge>
          </div>
          <SheetTitle className="flex items-center gap-2">
            <DimensionIcon className={cn('h-5 w-5', dimensionConfig.color)} />
            {evidence.title}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            {format(evidence.timestamp, 'MMMM dd, yyyy')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={cn(strengthConfig.bgColor, strengthConfig.color)}>
              {strengthConfig.label} Evidence
            </Badge>
            <Badge variant="outline" className="gap-1">
              <DimensionIcon className={cn('h-3 w-3', dimensionConfig.color)} />
              {dimensionConfig.label}
            </Badge>
            {evidence.source === 'user' &&
              (evidence as UserEvidenceItem).isContradiction && (
                <Badge variant="destructive">Contradiction</Badge>
              )}
          </div>

          {/* Methodology Context */}
          <div
            className={cn(
              'p-3 rounded-lg border-l-4',
              dimensionConfig.borderColor,
              dimensionConfig.bgColor
            )}
          >
            <p className="text-sm font-medium mb-1">{dimensionConfig.label}</p>
            <p className="text-xs text-muted-foreground">{dimensionConfig.description}</p>
          </div>

          <Separator />

          {/* Content based on source type */}
          {evidence.source === 'user' ? (
            <UserEvidenceDetails item={evidence as UserEvidenceItem} />
          ) : (
            <AIEvidenceDetails item={evidence as AIEvidenceItem} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// =======================================================================================
// USER EVIDENCE DETAILS
// =======================================================================================

function UserEvidenceDetails({ item }: { item: UserEvidenceItem }) {
  const CategoryIcon = categoryIcons[item.category] || FileText

  return (
    <div className="space-y-6">
      {/* Category & Source */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Category</p>
          <div className="flex items-center gap-2">
            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{item.category}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Author</p>
          <span className="text-sm font-medium">{item.data.author || 'Unknown'}</span>
        </div>
      </div>

      {/* Summary */}
      {item.data.summary && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Summary</p>
          <p className="text-sm">{item.data.summary}</p>
        </div>
      )}

      {/* Full Text */}
      {item.data.fullText && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Full Evidence</p>
          <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
            {item.data.fullText}
          </div>
        </div>
      )}

      {/* Source URL */}
      {item.data.sourceUrl && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Source</p>
          <a
            href={item.data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {item.data.source || 'View source'}
          </a>
        </div>
      )}

      {/* Linked Assumptions */}
      {item.data.linkedAssumptions && item.data.linkedAssumptions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Linked Assumptions</p>
          <div className="space-y-2">
            {item.data.linkedAssumptions.map((assumption, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded bg-muted text-sm"
              >
                <LinkIcon className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                {assumption}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {item.data.tags && item.data.tags.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Tags</p>
          <div className="flex flex-wrap gap-1">
            {item.data.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =======================================================================================
// AI EVIDENCE DETAILS
// =======================================================================================

function AIEvidenceDetails({ item }: { item: AIEvidenceItem }) {
  const signalInfo = getSignalDisplayInfo(item.signal, item.dimension)

  return (
    <div className="space-y-6">
      {/* Iteration Info */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
        <div>
          <p className="text-xs text-muted-foreground">Analysis Iteration</p>
          <p className="text-lg font-bold">#{item.iteration}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Signal Status</p>
          <Badge variant="outline" className="mt-1">
            {signalInfo.label}
          </Badge>
        </div>
      </div>

      {/* Signal Description */}
      <div className="p-3 rounded-lg border bg-card">
        <p className="text-sm">{signalInfo.description}</p>
      </div>

      {/* Dimension-specific metrics */}
      {item.dimension === 'desirability' && (
        <DesirabilityDetails evidence={item.evidence as DesirabilityEvidence} />
      )}
      {item.dimension === 'feasibility' && (
        <FeasibilityDetails evidence={item.evidence as FeasibilityEvidence} />
      )}
      {item.dimension === 'viability' && (
        <ViabilityDetails evidence={item.evidence as ViabilityEvidence} />
      )}
    </div>
  )
}

// =======================================================================================
// DESIRABILITY METRICS DETAIL
// =======================================================================================

function DesirabilityDetails({ evidence }: { evidence: DesirabilityEvidence }) {
  const resonancePercent = Math.round(evidence.problem_resonance * 100)
  const conversionPercent = Math.round(evidence.conversion_rate * 100)
  const zombiePercent = Math.round(evidence.zombie_ratio * 100)

  return (
    <div className="space-y-4">
      {/* Problem Resonance */}
      <MetricWithTooltip
        metricKey="problem_resonance"
        value={resonancePercent}
        format="percent"
        threshold={{ good: 60, warning: 30 }}
      />

      {/* Conversion Rate */}
      <MetricWithTooltip
        metricKey="conversion_rate"
        value={conversionPercent}
        format="percent"
        threshold={{ good: 10, warning: 3 }}
      />

      {/* Commitment Depth */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <MetricLabel metricKey="commitment_depth" />
          <CommitmentBadge type={evidence.commitment_depth} />
        </div>
      </div>

      {/* Zombie Ratio */}
      {zombiePercent > 0 && (
        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center justify-between mb-1">
            <MetricLabel metricKey="zombie_ratio" />
            <span className="font-bold text-yellow-700">{zombiePercent}%</span>
          </div>
          {zombiePercent > 30 && (
            <p className="text-xs text-yellow-700">
              High zombie ratio indicates interest without commitment. Consider Value or Segment
              pivot.
            </p>
          )}
        </div>
      )}

      {/* Campaign Metrics */}
      {evidence.impressions > 0 && (
        <div className="grid grid-cols-4 gap-2 pt-4 border-t">
          <MetricChip label="Impressions" value={formatNumber(evidence.impressions)} />
          <MetricChip label="Clicks" value={formatNumber(evidence.clicks)} />
          <MetricChip label="Signups" value={formatNumber(evidence.signups)} />
          <MetricChip label="Spend" value={`$${formatNumber(evidence.spend_usd)}`} />
        </div>
      )}

      {/* Key Learnings */}
      {evidence.key_learnings.length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Key Learnings
          </p>
          <ul className="space-y-2">
            {evidence.key_learnings.map((learning, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-pink-600">•</span>
                {learning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tested Segments */}
      {evidence.tested_segments.length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Tested Segments
          </p>
          <div className="flex flex-wrap gap-1">
            {evidence.tested_segments.map((segment, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {segment}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =======================================================================================
// FEASIBILITY METRICS DETAIL
// =======================================================================================

function FeasibilityDetails({ evidence }: { evidence: FeasibilityEvidence }) {
  const features = Object.entries(evidence.core_features_feasible)

  return (
    <div className="space-y-4">
      {/* Core Features Assessment */}
      {features.length > 0 && (
        <div>
          <MetricLabel metricKey="core_features_feasible" />
          <div className="mt-2 space-y-2">
            {features.map(([feature, status]) => (
              <div
                key={feature}
                className="flex items-center justify-between p-2 rounded bg-muted"
              >
                <span className="text-sm">{feature}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    status === 'POSSIBLE' && 'bg-green-50 text-green-700 border-green-200',
                    status === 'CONSTRAINED' &&
                      'bg-yellow-50 text-yellow-700 border-yellow-200',
                    status === 'IMPOSSIBLE' && 'bg-red-50 text-red-700 border-red-200'
                  )}
                >
                  {status === 'POSSIBLE' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {status === 'CONSTRAINED' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {status === 'IMPOSSIBLE' && <XCircle className="h-3 w-3 mr-1" />}
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Risks */}
      {evidence.technical_risks.length > 0 && (
        <div>
          <MetricLabel metricKey="technical_risks" />
          <ul className="mt-2 space-y-2">
            {evidence.technical_risks.map((risk, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cost Estimate */}
      <div className="p-3 rounded-lg bg-muted">
        <MetricLabel metricKey="monthly_cost_estimate" />
        <p className="text-2xl font-bold mt-1">
          ${formatNumber(evidence.monthly_cost_estimate_usd)}/mo
        </p>
      </div>

      {/* Downgrade Warning */}
      {evidence.downgrade_required && (
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-800">Scope Downgrade Required</span>
          </div>
          {evidence.downgrade_impact && (
            <p className="text-sm text-orange-700">{evidence.downgrade_impact}</p>
          )}
        </div>
      )}

      {/* Removed Features */}
      {evidence.removed_features.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Removed Features
          </p>
          <div className="flex flex-wrap gap-1">
            {evidence.removed_features.map((feature, i) => (
              <Badge key={i} variant="destructive" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =======================================================================================
// VIABILITY METRICS DETAIL
// =======================================================================================

function ViabilityDetails({ evidence }: { evidence: ViabilityEvidence }) {
  const ltvCacHealth =
    evidence.ltv_cac_ratio >= 3 ? 'healthy' :
    evidence.ltv_cac_ratio >= 1 ? 'marginal' : 'underwater'

  return (
    <div className="space-y-4">
      {/* LTV/CAC Ratio - Primary */}
      <div className="p-4 rounded-lg bg-muted">
        <div className="flex items-center justify-between mb-2">
          <MetricLabel metricKey="ltv_cac_ratio" />
          <Badge
            className={cn(
              ltvCacHealth === 'healthy' && 'bg-green-100 text-green-700',
              ltvCacHealth === 'marginal' && 'bg-yellow-100 text-yellow-700',
              ltvCacHealth === 'underwater' && 'bg-red-100 text-red-700'
            )}
          >
            {ltvCacHealth === 'healthy' && <TrendingUp className="h-3 w-3 mr-1" />}
            {ltvCacHealth === 'underwater' && <TrendingDown className="h-3 w-3 mr-1" />}
            {ltvCacHealth.charAt(0).toUpperCase() + ltvCacHealth.slice(1)}
          </Badge>
        </div>
        <p className="text-3xl font-bold">{evidence.ltv_cac_ratio.toFixed(1)}x</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>LTV: ${formatNumber(evidence.ltv)}</span>
          <span>CAC: ${formatNumber(evidence.cac)}</span>
        </div>
      </div>

      {/* Unit Economics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          metricKey="gross_margin"
          value={`${Math.round(evidence.gross_margin * 100)}%`}
          isGood={evidence.gross_margin >= 0.6}
        />
        <MetricCard
          metricKey="payback_months"
          value={`${evidence.payback_months.toFixed(1)} mo`}
          isGood={evidence.payback_months <= 12}
        />
      </div>

      {/* Market Size */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground">Break-even Customers</p>
          <p className="text-lg font-semibold mt-1">
            {formatNumber(evidence.break_even_customers)}
          </p>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <MetricLabel metricKey="tam_usd" />
          <p className="text-lg font-semibold mt-1">${formatCurrency(evidence.tam_usd)}</p>
        </div>
      </div>

      {/* Viability Assessment */}
      {evidence.viability_assessment && (
        <div className="pt-4 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Assessment Summary
          </p>
          <p className="text-sm">{evidence.viability_assessment}</p>
        </div>
      )}
    </div>
  )
}

// =======================================================================================
// HELPER COMPONENTS
// =======================================================================================

function MetricWithTooltip({
  metricKey,
  value,
  format,
  threshold,
}: {
  metricKey: keyof typeof METHODOLOGY_TOOLTIPS
  value: number
  format: 'percent' | 'number' | 'currency'
  threshold?: { good: number; warning: number }
}) {
  const displayValue =
    format === 'percent' ? `${value}%` :
    format === 'currency' ? `$${formatNumber(value)}` :
    formatNumber(value)

  const isGood = threshold ? value >= threshold.good : undefined
  const isWarning = threshold ? value >= threshold.warning && value < threshold.good : undefined

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <MetricLabel metricKey={metricKey} />
        <span
          className={cn(
            'font-bold',
            isGood && 'text-green-600',
            isWarning && 'text-yellow-600',
            !isGood && !isWarning && 'text-red-600'
          )}
        >
          {displayValue}
        </span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}

function MetricLabel({ metricKey }: { metricKey: keyof typeof METHODOLOGY_TOOLTIPS }) {
  const tooltip = METHODOLOGY_TOOLTIPS[metricKey]
  if (!tooltip) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center gap-1 text-sm text-muted-foreground">
          {tooltip.title}
          <Info className="h-3 w-3" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px]">
          <p className="font-medium mb-1">{tooltip.title}</p>
          <p className="text-xs text-muted-foreground">{tooltip.description}</p>
          {'methodology' in tooltip && (
            <p className="text-xs text-muted-foreground mt-1 italic">{tooltip.methodology}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function MetricCard({
  metricKey,
  value,
  isGood,
}: {
  metricKey: keyof typeof METHODOLOGY_TOOLTIPS
  value: string
  isGood?: boolean
}) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <MetricLabel metricKey={metricKey} />
      <p className={cn('text-lg font-semibold mt-1', isGood ? 'text-green-600' : 'text-yellow-600')}>
        {value}
      </p>
    </div>
  )
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded bg-muted">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function CommitmentBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
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
    <Badge variant="outline" className={cn('gap-1', className)}>
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

export default EvidenceDetailPanel
