/**
 * @story US-F02, US-F06
 */
'use client'

import {
  Circle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Skull,
  type LucideIcon,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { signalConfig } from '@/components/strategyzer/types'
import type {
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
} from '@/types/crewai'

// Icon mapping from string to Lucide component
const iconMap: Record<string, LucideIcon> = {
  'circle': Circle,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-triangle': AlertTriangle,
  'skull': Skull,
}

export type SignalType = 'desirability' | 'feasibility' | 'viability'

export interface SignalBadgeProps {
  signalType: SignalType
  signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal
  size?: 'sm' | 'md'
  showIcon?: boolean
  showLabel?: boolean
  className?: string
}

const labelMap: Record<SignalType, { short: string; full: string }> = {
  desirability: { short: 'D', full: 'Desirability' },
  feasibility: { short: 'F', full: 'Feasibility' },
  viability: { short: 'V', full: 'Viability' },
}

const sizeConfig = {
  sm: { badge: 'px-1.5 py-0.5 text-[10px]', icon: 'h-3 w-3' },
  md: { badge: 'px-2 py-1 text-xs', icon: 'h-4 w-4' },
}

function getSignalData(signalType: SignalType, signal: string): { label: string; color: string; bgColor: string; icon: string } | null {
  if (signalType === 'desirability') {
    const config = signalConfig.desirability
    return config[signal as keyof typeof config] || null
  }
  if (signalType === 'feasibility') {
    const config = signalConfig.feasibility
    return config[signal as keyof typeof config] || null
  }
  const config = signalConfig.viability
  return config[signal as keyof typeof config] || null
}

export function SignalBadge({
  signalType,
  signal,
  size = 'sm',
  showIcon = true,
  showLabel = true,
  className,
}: SignalBadgeProps) {
  const signalData = getSignalData(signalType, signal)

  if (!signalData) {
    return null
  }

  const Icon = iconMap[signalData.icon] || Circle
  const sizes = sizeConfig[size]
  const labels = labelMap[signalType]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'font-medium border transition-colors',
              signalData.bgColor,
              signalData.color,
              sizes.badge,
              className
            )}
          >
            {showIcon && <Icon className={cn(sizes.icon, showLabel && 'mr-1')} />}
            {showLabel && (size === 'sm' ? labels.short : signalData.label)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="space-y-1">
            <p className="font-medium">{labels.full}</p>
            <p className={cn('text-sm', signalData.color)}>{signalData.label}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Compact dot indicator for signal status
 * Shows just a colored dot with tooltip
 */
export interface SignalDotProps {
  signalType: SignalType
  signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const dotSizeConfig = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
}

export function SignalDot({
  signalType,
  signal,
  size = 'md',
  className,
}: SignalDotProps) {
  const signalData = getSignalData(signalType, signal)
  const labels = labelMap[signalType]

  if (!signalData) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'rounded-full transition-colors',
              signalData.bgColor,
              dotSizeConfig[size],
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="space-y-1">
            <p className="font-medium">{labels.full}</p>
            <p className={cn('text-sm', signalData.color)}>{signalData.label}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Group of three signal dots for compact display
 */
export interface SignalDotsGroupProps {
  desirability: DesirabilitySignal
  feasibility: FeasibilitySignal
  viability: ViabilitySignal
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SignalDotsGroup({
  desirability,
  feasibility,
  viability,
  size = 'md',
  className,
}: SignalDotsGroupProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <SignalDot signalType="desirability" signal={desirability} size={size} />
      <SignalDot signalType="feasibility" signal={feasibility} size={size} />
      <SignalDot signalType="viability" signal={viability} size={size} />
    </div>
  )
}

export default SignalBadge
