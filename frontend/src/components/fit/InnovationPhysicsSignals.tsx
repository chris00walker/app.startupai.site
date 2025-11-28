"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Circle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Skull,
  HelpCircle
} from 'lucide-react'
import {
  type DesirabilitySignal,
  type FeasibilitySignal,
  type ViabilitySignal
} from '@/types/crewai'
import { signalConfig } from '@/components/strategyzer/types'

// Type-safe helper to get signal config
type SignalConfigItem = { label: string; color: string; bgColor: string; icon: string }

function getSignalConfig(
  type: 'desirability' | 'feasibility' | 'viability',
  signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal
): SignalConfigItem {
  const typeConfig = signalConfig[type]
  // Default config for unknown signals
  const defaultConfig: SignalConfigItem = {
    label: 'Unknown',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: 'circle'
  }

  if (type === 'desirability' && signal in typeConfig) {
    return typeConfig[signal as DesirabilitySignal]
  }
  if (type === 'feasibility' && signal in typeConfig) {
    return typeConfig[signal as FeasibilitySignal]
  }
  if (type === 'viability' && signal in typeConfig) {
    return typeConfig[signal as ViabilitySignal]
  }

  return defaultConfig
}

interface InnovationPhysicsSignalsProps {
  desirability: DesirabilitySignal
  feasibility: FeasibilitySignal
  viability: ViabilitySignal
  compact?: boolean
  showLabels?: boolean
  className?: string
}

/**
 * Innovation Physics Signal Display
 *
 * Shows the current D-F-V signals from CrewAI validation:
 * - Desirability: no_signal | no_interest | weak_interest | strong_commitment
 * - Feasibility: unknown | green | orange_constrained | red_impossible
 * - Viability: unknown | profitable | marginal | underwater | zombie_market
 */
export function InnovationPhysicsSignals({
  desirability,
  feasibility,
  viability,
  compact = false,
  showLabels = true,
  className
}: InnovationPhysicsSignalsProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <SignalDot type="desirability" signal={desirability} />
        <SignalDot type="feasibility" signal={feasibility} />
        <SignalDot type="viability" signal={viability} />
      </div>
    )
  }

  return (
    <div className={cn('grid gap-3 md:grid-cols-3', className)}>
      <SignalCard
        type="desirability"
        signal={desirability}
        showLabel={showLabels}
      />
      <SignalCard
        type="feasibility"
        signal={feasibility}
        showLabel={showLabels}
      />
      <SignalCard
        type="viability"
        signal={viability}
        showLabel={showLabels}
      />
    </div>
  )
}

/**
 * Compact signal dot with tooltip
 */
interface SignalDotProps {
  type: 'desirability' | 'feasibility' | 'viability'
  signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal
}

function SignalDot({ type, signal }: SignalDotProps) {
  const config = getSignalConfig(type, signal)
  const Icon = getSignalIcon(signal)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'h-4 w-4 rounded-full flex items-center justify-center',
              config.bgColor
            )}
          >
            <Icon className={cn('h-2.5 w-2.5', config.color)} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs">
            <span className="font-medium capitalize">{type}:</span> {config.label}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Full signal card with icon, label, and description
 */
interface SignalCardProps {
  type: 'desirability' | 'feasibility' | 'viability'
  signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal
  showLabel?: boolean
}

function SignalCard({ type, signal, showLabel = true }: SignalCardProps) {
  const config = getSignalConfig(type, signal)
  const TypeIcon = getTypeIcon(type)
  const SignalIcon = getSignalIcon(signal)

  const typeLabels = {
    desirability: 'Desirability',
    feasibility: 'Feasibility',
    viability: 'Viability'
  }

  const typeColors = {
    desirability: 'text-pink-600 bg-pink-50',
    feasibility: 'text-blue-600 bg-blue-50',
    viability: 'text-green-600 bg-green-50'
  }

  return (
    <Card className={cn('border-l-4', getBorderColor(signal))}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg', typeColors[type])}>
              <TypeIcon className={cn('h-4 w-4', typeColors[type].split(' ')[0])} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {typeLabels[type]}
              </p>
              {showLabel && (
                <p className={cn('text-sm font-semibold', config.color)}>
                  {config.label}
                </p>
              )}
            </div>
          </div>
          <div className={cn('p-2 rounded-full', config.bgColor)}>
            <SignalIcon className={cn('h-4 w-4', config.color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Signal summary banner - shows all three signals in a compact header format
 */
interface SignalBannerProps {
  desirability: DesirabilitySignal
  feasibility: FeasibilitySignal
  viability: ViabilitySignal
  className?: string
}

export function SignalBanner({
  desirability,
  feasibility,
  viability,
  className
}: SignalBannerProps) {
  return (
    <div className={cn('flex items-center gap-4 p-3 rounded-lg bg-muted/50', className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Innovation Physics
      </span>
      <div className="flex items-center gap-3">
        <SignalBadge type="desirability" signal={desirability} />
        <SignalBadge type="feasibility" signal={feasibility} />
        <SignalBadge type="viability" signal={viability} />
      </div>
    </div>
  )
}

/**
 * Individual signal badge
 */
interface SignalBadgeProps {
  type: 'desirability' | 'feasibility' | 'viability'
  signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal
}

function SignalBadge({ type, signal }: SignalBadgeProps) {
  const config = getSignalConfig(type, signal)
  const Icon = getSignalIcon(signal)
  const TypeIcon = getTypeIcon(type)

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5', config.bgColor, 'border-transparent')}
    >
      <TypeIcon className="h-3 w-3" />
      <Icon className={cn('h-3 w-3', config.color)} />
    </Badge>
  )
}

// Helper functions

function getTypeIcon(type: 'desirability' | 'feasibility' | 'viability') {
  switch (type) {
    case 'desirability':
      return Heart
    case 'feasibility':
      return Cog
    case 'viability':
      return DollarSign
  }
}

function getSignalIcon(signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal) {
  switch (signal) {
    // Positive signals
    case 'strong_commitment':
    case 'green':
    case 'profitable':
      return CheckCircle

    // Warning signals
    case 'weak_interest':
    case 'orange_constrained':
    case 'marginal':
      return AlertTriangle

    // Negative signals
    case 'no_interest':
    case 'red_impossible':
    case 'underwater':
      return XCircle

    // Special cases
    case 'zombie_market':
      return Skull

    // Unknown/untested
    case 'no_signal':
    case 'unknown':
    default:
      return Circle
  }
}

function getBorderColor(signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal): string {
  switch (signal) {
    case 'strong_commitment':
    case 'green':
    case 'profitable':
      return 'border-l-green-500'

    case 'weak_interest':
    case 'orange_constrained':
    case 'marginal':
      return 'border-l-yellow-500'

    case 'no_interest':
    case 'red_impossible':
    case 'underwater':
      return 'border-l-red-500'

    case 'zombie_market':
      return 'border-l-purple-500'

    default:
      return 'border-l-gray-300'
  }
}

export default InnovationPhysicsSignals
