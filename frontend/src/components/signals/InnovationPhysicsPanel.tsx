/**
 * @story US-F02, US-F06
 */
'use client'

import { useMemo } from 'react'
import {
  Target,
  Wrench,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { SignalGauge } from './SignalGauge'
import { SignalDotsGroup } from './SignalBadge'
import { useInnovationSignals, getOverallHealth, getRecommendedAction } from '@/hooks/useCrewAIState'
import { pivotConfig } from '@/components/strategyzer/types'
import type { Phase, PivotType } from '@/types/crewai'
import { FounderBadge } from '@/components/founders'
import { getFounderByDataType } from '@/lib/founders/founder-mapping'

export interface InnovationPhysicsPanelProps {
  projectId: string
  variant?: 'full' | 'compact' | 'mini'
  showEvidence?: boolean
  onAddEvidence?: () => void
  className?: string
}

const phaseConfig: Record<Phase, { label: string; color: string; bgColor: string }> = {
  ideation: { label: 'Ideation', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  desirability: { label: 'Testing Desirability', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  feasibility: { label: 'Testing Feasibility', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  viability: { label: 'Testing Viability', color: 'text-green-600', bgColor: 'bg-green-100' },
  validated: { label: 'Validated', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  killed: { label: 'Killed', color: 'text-red-600', bgColor: 'bg-red-100' },
}

// Fallback for unexpected values (defensive - should not happen with proper data)
const defaultPhaseConfig = { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' }

const healthConfig = {
  healthy: { label: 'Healthy', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  warning: { label: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle },
  critical: { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
  unknown: { label: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Target },
}

export function InnovationPhysicsPanel({
  projectId,
  variant = 'full',
  showEvidence = true,
  onAddEvidence,
  className,
}: InnovationPhysicsPanelProps) {
  const {
    signals,
    desirabilityEvidence,
    feasibilityEvidence,
    viabilityEvidence,
    isLoading,
    error,
  } = useInnovationSignals(projectId)

  const health = useMemo(() => {
    if (!signals) return 'unknown'
    return getOverallHealth(signals)
  }, [signals])

  const recommendedAction = useMemo(() => {
    if (!signals) return null
    return getRecommendedAction(signals)
  }, [signals])

  if (isLoading) {
    return <InnovationPhysicsPanelSkeleton variant={variant} className={className} />
  }

  if (error) {
    return (
      <Card className={cn('border-red-200', className)}>
        <CardContent className="py-4">
          <p className="text-sm text-red-600">Failed to load innovation signals</p>
        </CardContent>
      </Card>
    )
  }

  if (!signals) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="py-6 text-center">
          <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No validation data yet</p>
          <p className="text-xs text-gray-400 mt-1">Run a CrewAI analysis to see signals</p>
        </CardContent>
      </Card>
    )
  }

  // Mini variant - just dots
  if (variant === 'mini') {
    return (
      <SignalDotsGroup
        desirability={signals.desirability}
        feasibility={signals.feasibility}
        viability={signals.viability}
        size="md"
        className={className}
      />
    )
  }

  // Compact variant - single row
  if (variant === 'compact') {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PhaseBadge phase={signals.phase} size="sm" />
              <HealthBadge health={health} size="sm" />
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex gap-3">
                <div className="flex-1">
                  <SignalGauge
                    signalType="desirability"
                    currentSignal={signals.desirability}
                    evidence={desirabilityEvidence || undefined}
                    showThresholds={false}
                    showLabel={false}
                    size="sm"
                  />
                </div>
                <div className="flex-1">
                  <SignalGauge
                    signalType="feasibility"
                    currentSignal={signals.feasibility}
                    evidence={feasibilityEvidence || undefined}
                    showThresholds={false}
                    showLabel={false}
                    size="sm"
                  />
                </div>
                <div className="flex-1">
                  <SignalGauge
                    signalType="viability"
                    currentSignal={signals.viability}
                    evidence={viabilityEvidence || undefined}
                    showThresholds={false}
                    showLabel={false}
                    size="sm"
                  />
                </div>
              </div>
            </div>
            {signals.pivotRecommendation !== 'none' && (
              <PivotBadge pivotType={signals.pivotRecommendation} size="sm" />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full variant
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-gray-500" />
            Innovation Physics
          </CardTitle>
          <div className="flex items-center gap-2">
            <PhaseBadge phase={signals.phase} />
            <HealthBadge health={health} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Signal Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SignalCard
            icon={Target}
            title="Desirability"
            description="Do customers want this?"
            signalType="desirability"
            signal={signals.desirability}
            evidence={showEvidence ? desirabilityEvidence || undefined : undefined}
          />
          <SignalCard
            icon={Wrench}
            title="Feasibility"
            description="Can we build it?"
            signalType="feasibility"
            signal={signals.feasibility}
            evidence={showEvidence ? feasibilityEvidence || undefined : undefined}
          />
          <SignalCard
            icon={DollarSign}
            title="Viability"
            description="Should we build it?"
            signalType="viability"
            signal={signals.viability}
            evidence={showEvidence ? viabilityEvidence || undefined : undefined}
          />
        </div>

        {/* Pivot Recommendation */}
        {signals.pivotRecommendation !== 'none' && (
          <PivotRecommendationBanner pivotType={signals.pivotRecommendation} />
        )}

        {/* Recommended Action */}
        {recommendedAction && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{recommendedAction}</span>
            </div>
            {onAddEvidence && (
              <Button variant="outline" size="sm" onClick={onAddEvidence}>
                <Plus className="h-4 w-4 mr-1" />
                Add Evidence
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Sub-components

interface SignalCardProps {
  icon: React.ElementType
  title: string
  description: string
  signalType: 'desirability' | 'feasibility' | 'viability'
  signal: string
  evidence?: any
}

function SignalCard({ icon: Icon, title, description, signalType, signal, evidence }: SignalCardProps) {
  const founder = getFounderByDataType(signalType)

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <FounderBadge founderId={founder.id} variant="minimal" size="sm" />
      </div>
      <SignalGauge
        signalType={signalType}
        currentSignal={signal as any}
        evidence={evidence}
        showLabel={false}
        size="md"
      />
    </div>
  )
}

interface PhaseBadgeProps {
  phase: Phase
  size?: 'sm' | 'md'
}

function PhaseBadge({ phase, size = 'md' }: PhaseBadgeProps) {
  const config = phaseConfig[phase] || defaultPhaseConfig
  return (
    <Badge
      variant="outline"
      className={cn(
        config.bgColor,
        config.color,
        size === 'sm' ? 'text-[10px] px-1.5' : 'text-xs'
      )}
    >
      {config.label}
    </Badge>
  )
}

interface HealthBadgeProps {
  health: 'healthy' | 'warning' | 'critical' | 'unknown'
  size?: 'sm' | 'md'
}

function HealthBadge({ health, size = 'md' }: HealthBadgeProps) {
  const config = healthConfig[health]
  const Icon = config.icon
  return (
    <Badge
      variant="outline"
      className={cn(
        config.bgColor,
        config.color,
        size === 'sm' ? 'text-[10px] px-1.5' : 'text-xs'
      )}
    >
      <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      {config.label}
    </Badge>
  )
}

interface PivotBadgeProps {
  pivotType: PivotType
  size?: 'sm' | 'md'
}

function PivotBadge({ pivotType, size = 'md' }: PivotBadgeProps) {
  const config = pivotConfig[pivotType]
  if (!config || pivotType === 'none') return null

  const severityColors = {
    none: 'bg-green-100 text-green-600',
    low: 'bg-yellow-100 text-yellow-600',
    medium: 'bg-orange-100 text-orange-600',
    high: 'bg-red-100 text-red-600',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        severityColors[config.severity],
        size === 'sm' ? 'text-[10px] px-1.5' : 'text-xs'
      )}
    >
      <AlertTriangle className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      {config.label}
    </Badge>
  )
}

interface PivotRecommendationBannerProps {
  pivotType: PivotType
}

function PivotRecommendationBanner({ pivotType }: PivotRecommendationBannerProps) {
  const config = pivotConfig[pivotType]
  if (!config || pivotType === 'none') return null

  const severityColors = {
    none: 'bg-green-50 border-green-200',
    low: 'bg-yellow-50 border-yellow-200',
    medium: 'bg-orange-50 border-orange-200',
    high: 'bg-red-50 border-red-200',
  }

  return (
    <div className={cn('p-3 rounded-lg border', severityColors[config.severity])}>
      <div className="flex items-start gap-2">
        <AlertTriangle className={cn('h-4 w-4 mt-0.5', config.color)} />
        <div>
          <p className={cn('text-sm font-medium', config.color)}>{config.label} Recommended</p>
          <p className="text-xs text-gray-600 mt-0.5">{config.description}</p>
        </div>
      </div>
    </div>
  )
}

// Skeleton for loading state
function InnovationPhysicsPanelSkeleton({
  variant,
  className,
}: {
  variant: 'full' | 'compact' | 'mini'
  className?: string
}) {
  if (variant === 'mini') {
    return (
      <div className={cn('flex gap-1', className)}>
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-3 rounded-full" />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
            <div className="flex-1 flex gap-3">
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-2 flex-1 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  )
}

export default InnovationPhysicsPanel
