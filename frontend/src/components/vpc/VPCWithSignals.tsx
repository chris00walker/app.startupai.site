/**
 * @story US-CP08
 */
"use client"

/**
 * VPCWithSignals Component
 *
 * Integrates the Value Proposition Canvas with Innovation Physics signals.
 * Replaces simple fit bands (High/Medium/Low) with full SignalGauge visualization.
 *
 * Shows:
 * - VPC canvas (customer profile + value map)
 * - D-F-V signal gauges with evidence tooltips
 * - Evidence metrics summary
 * - Pivot recommendations when signals indicate issues
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutGrid,
  ArrowRight,
  Users,
  Heart,
  Cog,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  RefreshCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SignalGauge } from '@/components/signals/SignalGauge'
import type {
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
  DesirabilityEvidence,
  FeasibilityEvidence,
  ViabilityEvidence,
  PivotType,
  CustomerProfile,
  ValueMap
} from '@/types/crewai'
import { getPivotInfo } from '@/types/crewai'

interface VPCSegmentData {
  segmentKey: string
  segmentName: string
  customerProfile?: CustomerProfile
  valueMap?: ValueMap
  resonanceScore?: number
}

export interface VPCWithSignalsProps {
  /** Customer segment data */
  segment: VPCSegmentData
  /** Additional segments count */
  additionalSegments?: number
  /** Current signals from CrewAI state */
  signals: {
    desirability: DesirabilitySignal
    feasibility: FeasibilitySignal
    viability: ViabilitySignal
  }
  /** Evidence from CrewAI state */
  evidence?: {
    desirability?: DesirabilityEvidence
    feasibility?: FeasibilityEvidence
    viability?: ViabilityEvidence
  }
  /** Current pivot recommendation */
  pivotRecommendation?: PivotType
  /** Callback to view full VPC */
  onViewFullVPC?: () => void
  /** Callback to run analysis */
  onRunAnalysis?: () => void
  /** Is analysis running? */
  isAnalyzing?: boolean
  /** Variant */
  variant?: 'full' | 'compact' | 'card'
  /** Additional className */
  className?: string
}

export function VPCWithSignals({
  segment,
  additionalSegments = 0,
  signals,
  evidence,
  pivotRecommendation,
  onViewFullVPC,
  onRunAnalysis,
  isAnalyzing = false,
  variant = 'full',
  className
}: VPCWithSignalsProps) {
  const hasEvidence = evidence?.desirability || evidence?.feasibility || evidence?.viability

  if (variant === 'card') {
    return (
      <VPCSignalsCard
        segment={segment}
        additionalSegments={additionalSegments}
        signals={signals}
        evidence={evidence}
        pivotRecommendation={pivotRecommendation}
        onViewFullVPC={onViewFullVPC}
        className={className}
      />
    )
  }

  if (variant === 'compact') {
    return (
      <VPCSignalsCompact
        segment={segment}
        signals={signals}
        evidence={evidence}
        className={className}
      />
    )
  }

  // Full variant
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">Value Proposition Canvas</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onRunAnalysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRunAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-1" />
                    Re-analyze
                  </>
                )}
              </Button>
            )}
            {onViewFullVPC && (
              <Button variant="outline" size="sm" onClick={onViewFullVPC}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Full Canvas
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Customer-Value fit with Innovation Physics signals
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Segment Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{segment.segmentName}</span>
            {additionalSegments > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{additionalSegments} segments
              </Badge>
            )}
          </div>
          {segment.resonanceScore !== undefined && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      segment.resonanceScore >= 0.6 ? 'border-green-500 text-green-700' :
                      segment.resonanceScore >= 0.3 ? 'border-yellow-500 text-yellow-700' :
                      'border-red-500 text-red-700'
                    )}
                  >
                    {Math.round(segment.resonanceScore * 100)}% Resonance
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Problem-solution resonance from customer testing
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* VPC Summary (Jobs, Pains, Gains preview) */}
        {segment.customerProfile && (
          <VPCProfileSummary profile={segment.customerProfile} />
        )}

        <Separator />

        {/* Innovation Physics Signals */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Innovation Physics Signals
          </h4>

          <div className="space-y-4">
            <SignalGauge
              signalType="desirability"
              currentSignal={signals.desirability}
              evidence={evidence?.desirability}
              showLabel={true}
              showThresholds={true}
              size="md"
            />

            <SignalGauge
              signalType="feasibility"
              currentSignal={signals.feasibility}
              evidence={evidence?.feasibility}
              showLabel={true}
              showThresholds={true}
              size="md"
            />

            <SignalGauge
              signalType="viability"
              currentSignal={signals.viability}
              evidence={evidence?.viability}
              showLabel={true}
              showThresholds={true}
              size="md"
            />
          </div>
        </div>

        {/* Pivot Recommendation Warning */}
        {pivotRecommendation && pivotRecommendation !== 'none' && (
          <PivotWarning pivotType={pivotRecommendation} />
        )}

        {/* Evidence Summary */}
        {hasEvidence && (
          <>
            <Separator />
            <EvidenceSummarySection evidence={evidence} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Sub-components

function VPCSignalsCard({
  segment,
  additionalSegments,
  signals,
  evidence,
  pivotRecommendation,
  onViewFullVPC,
  className
}: Omit<VPCWithSignalsProps, 'variant' | 'onRunAnalysis' | 'isAnalyzing'>) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-base">Value Proposition Canvas</CardTitle>
          </div>
          <SignalDotsGroup signals={signals} />
        </div>
        <CardDescription>
          {segment.segmentName}
          {additionalSegments && additionalSegments > 0 && ` (+${additionalSegments} more)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Compact signal gauges */}
        <div className="space-y-2">
          <SignalGauge
            signalType="desirability"
            currentSignal={signals.desirability}
            evidence={evidence?.desirability}
            showLabel={true}
            showThresholds={false}
            size="sm"
          />
          <SignalGauge
            signalType="feasibility"
            currentSignal={signals.feasibility}
            evidence={evidence?.feasibility}
            showLabel={true}
            showThresholds={false}
            size="sm"
          />
          <SignalGauge
            signalType="viability"
            currentSignal={signals.viability}
            evidence={evidence?.viability}
            showLabel={true}
            showThresholds={false}
            size="sm"
          />
        </div>

        {/* Pivot warning if applicable */}
        {pivotRecommendation && pivotRecommendation !== 'none' && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{getPivotInfo(pivotRecommendation).label} recommended</span>
          </div>
        )}

        {/* View button */}
        {onViewFullVPC && (
          <Button variant="outline" className="w-full" onClick={onViewFullVPC}>
            View Full Analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function VPCSignalsCompact({
  segment,
  signals,
  evidence,
  className
}: Pick<VPCWithSignalsProps, 'segment' | 'signals' | 'evidence' | 'className'>) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-medium">{segment.segmentName}</span>
        </div>
        <SignalDotsGroup signals={signals} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <SignalGauge
          signalType="desirability"
          currentSignal={signals.desirability}
          evidence={evidence?.desirability}
          showLabel={false}
          showThresholds={false}
          size="sm"
        />
        <SignalGauge
          signalType="feasibility"
          currentSignal={signals.feasibility}
          evidence={evidence?.feasibility}
          showLabel={false}
          showThresholds={false}
          size="sm"
        />
        <SignalGauge
          signalType="viability"
          currentSignal={signals.viability}
          evidence={evidence?.viability}
          showLabel={false}
          showThresholds={false}
          size="sm"
        />
      </div>
    </div>
  )
}

function SignalDotsGroup({ signals }: { signals: VPCWithSignalsProps['signals'] }) {
  const getSignalColor = (signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal) => {
    // Good signals
    if (signal === 'strong_commitment' || signal === 'green' || signal === 'profitable') {
      return 'bg-green-500'
    }
    // Warning signals
    if (signal === 'weak_interest' || signal === 'orange_constrained' || signal === 'marginal') {
      return 'bg-yellow-500'
    }
    // Bad signals
    if (signal === 'no_interest' || signal === 'red_impossible' || signal === 'underwater') {
      return 'bg-red-500'
    }
    // Special case: zombie market
    if (signal === 'zombie_market') {
      return 'bg-purple-500'
    }
    // Unknown/no signal
    return 'bg-gray-400'
  }

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('w-2 h-2 rounded-full', getSignalColor(signals.desirability))} />
          </TooltipTrigger>
          <TooltipContent>Desirability: {signals.desirability}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('w-2 h-2 rounded-full', getSignalColor(signals.feasibility))} />
          </TooltipTrigger>
          <TooltipContent>Feasibility: {signals.feasibility}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('w-2 h-2 rounded-full', getSignalColor(signals.viability))} />
          </TooltipTrigger>
          <TooltipContent>Viability: {signals.viability}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

function VPCProfileSummary({ profile }: { profile: CustomerProfile }) {
  const topJobs = profile.jobs.slice(0, 2)
  const topPains = profile.pains.slice(0, 2)
  const topGains = profile.gains.slice(0, 2)

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase">
          <Heart className="h-3 w-3 text-pink-500" />
          Jobs ({profile.jobs.length})
        </div>
        <ul className="text-sm space-y-0.5">
          {topJobs.map((job, i) => (
            <li key={i} className="truncate text-muted-foreground">
              {job.functional}
            </li>
          ))}
          {profile.jobs.length > 2 && (
            <li className="text-xs text-muted-foreground/70">
              +{profile.jobs.length - 2} more
            </li>
          )}
        </ul>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          Pains ({profile.pains.length})
        </div>
        <ul className="text-sm space-y-0.5">
          {topPains.map((pain, i) => (
            <li key={i} className="truncate text-muted-foreground">
              {pain}
            </li>
          ))}
          {profile.pains.length > 2 && (
            <li className="text-xs text-muted-foreground/70">
              +{profile.pains.length - 2} more
            </li>
          )}
        </ul>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase">
          <DollarSign className="h-3 w-3 text-green-500" />
          Gains ({profile.gains.length})
        </div>
        <ul className="text-sm space-y-0.5">
          {topGains.map((gain, i) => (
            <li key={i} className="truncate text-muted-foreground">
              {gain}
            </li>
          ))}
          {profile.gains.length > 2 && (
            <li className="text-xs text-muted-foreground/70">
              +{profile.gains.length - 2} more
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

function PivotWarning({ pivotType }: { pivotType: PivotType }) {
  const pivotInfo = getPivotInfo(pivotType)

  const severityColors = {
    none: 'bg-gray-50 border-gray-200 text-gray-700',
    low: 'bg-blue-50 border-blue-200 text-blue-700',
    medium: 'bg-amber-50 border-amber-200 text-amber-700',
    high: 'bg-red-50 border-red-200 text-red-700'
  }

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-lg border',
      severityColors[pivotInfo.severity]
    )}>
      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">{pivotInfo.label} Recommended</p>
        <p className="text-sm opacity-80">{pivotInfo.description}</p>
      </div>
    </div>
  )
}

function EvidenceSummarySection({
  evidence
}: {
  evidence?: VPCWithSignalsProps['evidence']
}) {
  if (!evidence) return null

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Evidence Summary
      </h4>

      <div className="grid grid-cols-3 gap-3">
        {/* Desirability evidence */}
        {evidence.desirability && (
          <div className="p-3 rounded-lg bg-pink-50 border border-pink-100">
            <div className="flex items-center gap-1 mb-2">
              <Heart className="h-4 w-4 text-pink-600" />
              <span className="text-xs font-medium text-pink-800">Desirability</span>
            </div>
            <div className="space-y-1 text-xs text-pink-700">
              <p>Resonance: {Math.round(evidence.desirability.problem_resonance * 100)}%</p>
              <p>Conversion: {(evidence.desirability.conversion_rate * 100).toFixed(1)}%</p>
              <p>Signups: {evidence.desirability.signups}</p>
            </div>
          </div>
        )}

        {/* Feasibility evidence */}
        {evidence.feasibility && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-1 mb-2">
              <Cog className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Feasibility</span>
            </div>
            <div className="space-y-1 text-xs text-blue-700">
              {(() => {
                const features = Object.values(evidence.feasibility!.core_features_feasible)
                const possible = features.filter(v => v === 'POSSIBLE').length
                return <p>Features: {possible}/{features.length} feasible</p>
              })()}
              <p>Cost: ${evidence.feasibility.monthly_cost_estimate_usd.toLocaleString()}/mo</p>
              {evidence.feasibility.downgrade_required && (
                <p className="text-orange-600 font-medium">Downgrade required</p>
              )}
            </div>
          </div>
        )}

        {/* Viability evidence */}
        {evidence.viability && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-100">
            <div className="flex items-center gap-1 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-800">Viability</span>
            </div>
            <div className="space-y-1 text-xs text-green-700">
              <p>LTV/CAC: {evidence.viability.ltv_cac_ratio.toFixed(1)}x</p>
              <p>Margin: {Math.round(evidence.viability.gross_margin * 100)}%</p>
              <p>Payback: {evidence.viability.payback_months.toFixed(0)} months</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VPCWithSignals
