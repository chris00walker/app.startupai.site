'use client'

import { useMemo } from 'react'
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
import { cn } from '@/lib/utils'
import { signalConfig } from '@/components/strategyzer/types'
import type {
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
  DesirabilityEvidence,
  FeasibilityEvidence,
  ViabilityEvidence,
} from '@/types/crewai'

// Icon mapping from string to Lucide component
const iconMap: Record<string, LucideIcon> = {
  'circle': Circle,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-triangle': AlertTriangle,
  'skull': Skull,
}

// Signal ordering for progress calculation
const desirabilityOrder: DesirabilitySignal[] = ['no_signal', 'no_interest', 'weak_interest', 'strong_commitment']
const feasibilityOrder: FeasibilitySignal[] = ['unknown', 'red_impossible', 'orange_constrained', 'green']
const viabilityOrder: ViabilitySignal[] = ['unknown', 'underwater', 'zombie_market', 'marginal', 'profitable']

export type SignalType = 'desirability' | 'feasibility' | 'viability'

export interface SignalGaugeProps {
  signalType: SignalType
  currentSignal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal
  evidence?: DesirabilityEvidence | FeasibilityEvidence | ViabilityEvidence
  showThresholds?: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface GaugeSegment {
  signal: string
  label: string
  color: string
  bgColor: string
  icon: string
  position: number // 0-100
}

function getSegments(signalType: SignalType): GaugeSegment[] {
  if (signalType === 'desirability') {
    const config = signalConfig.desirability
    return desirabilityOrder.map((signal, idx) => {
      const signalData = config[signal]
      return {
        signal,
        label: signalData.label,
        color: signalData.color,
        bgColor: signalData.bgColor,
        icon: signalData.icon,
        position: (idx / (desirabilityOrder.length - 1)) * 100,
      }
    })
  }

  if (signalType === 'feasibility') {
    const config = signalConfig.feasibility
    return feasibilityOrder.map((signal, idx) => {
      const signalData = config[signal]
      return {
        signal,
        label: signalData.label,
        color: signalData.color,
        bgColor: signalData.bgColor,
        icon: signalData.icon,
        position: (idx / (feasibilityOrder.length - 1)) * 100,
      }
    })
  }

  // viability
  const config = signalConfig.viability
  return viabilityOrder.map((signal, idx) => {
    const signalData = config[signal]
    return {
      signal,
      label: signalData.label,
      color: signalData.color,
      bgColor: signalData.bgColor,
      icon: signalData.icon,
      position: (idx / (viabilityOrder.length - 1)) * 100,
    }
  })
}

function getSignalPosition(signalType: SignalType, signal: string): number {
  if (signalType === 'desirability') {
    const idx = desirabilityOrder.indexOf(signal as DesirabilitySignal)
    return idx >= 0 ? (idx / (desirabilityOrder.length - 1)) * 100 : 0
  }
  if (signalType === 'feasibility') {
    const idx = feasibilityOrder.indexOf(signal as FeasibilitySignal)
    return idx >= 0 ? (idx / (feasibilityOrder.length - 1)) * 100 : 0
  }
  const idx = viabilityOrder.indexOf(signal as ViabilitySignal)
  return idx >= 0 ? (idx / (viabilityOrder.length - 1)) * 100 : 0
}

function getSignalConfig(signalType: SignalType, signal: string): { label: string; color: string; bgColor: string; icon: string } {
  if (signalType === 'desirability') {
    const config = signalConfig.desirability
    return config[signal as DesirabilitySignal] || config.no_signal
  }
  if (signalType === 'feasibility') {
    const config = signalConfig.feasibility
    return config[signal as FeasibilitySignal] || config.unknown
  }
  const config = signalConfig.viability
  return config[signal as ViabilitySignal] || config.unknown
}

function formatEvidenceMetrics(signalType: SignalType, evidence: DesirabilityEvidence | FeasibilityEvidence | ViabilityEvidence | undefined): string[] {
  if (!evidence) return []

  const metrics: string[] = []

  if (signalType === 'desirability' && 'problem_resonance' in evidence) {
    const e = evidence as DesirabilityEvidence
    metrics.push(`Problem Resonance: ${(e.problem_resonance * 100).toFixed(0)}%`)
    metrics.push(`Conversion Rate: ${(e.conversion_rate * 100).toFixed(1)}%`)
    if (e.zombie_ratio > 0) {
      metrics.push(`Zombie Ratio: ${(e.zombie_ratio * 100).toFixed(0)}%`)
    }
    metrics.push(`Signups: ${e.signups}`)
  }

  if (signalType === 'feasibility' && 'core_features_feasible' in evidence) {
    const e = evidence as FeasibilityEvidence
    const features = Object.entries(e.core_features_feasible)
    const possible = features.filter(([, v]) => v === 'POSSIBLE').length
    const total = features.length
    metrics.push(`Features: ${possible}/${total} Feasible`)
    if (e.monthly_cost_estimate_usd > 0) {
      metrics.push(`Est. Monthly Cost: $${e.monthly_cost_estimate_usd.toLocaleString()}`)
    }
    if (e.downgrade_required) {
      metrics.push('Downgrade Required')
    }
  }

  if (signalType === 'viability' && 'ltv_cac_ratio' in evidence) {
    const e = evidence as ViabilityEvidence
    metrics.push(`LTV/CAC: ${e.ltv_cac_ratio.toFixed(1)}x`)
    metrics.push(`CAC: $${e.cac.toLocaleString()}`)
    metrics.push(`LTV: $${e.ltv.toLocaleString()}`)
    if (e.gross_margin > 0) {
      metrics.push(`Gross Margin: ${(e.gross_margin * 100).toFixed(0)}%`)
    }
  }

  return metrics
}

const sizeConfig = {
  sm: { height: 'h-2', text: 'text-xs', icon: 'h-3 w-3' },
  md: { height: 'h-3', text: 'text-sm', icon: 'h-4 w-4' },
  lg: { height: 'h-4', text: 'text-base', icon: 'h-5 w-5' },
}

const labelMap: Record<SignalType, string> = {
  desirability: 'Desirability',
  feasibility: 'Feasibility',
  viability: 'Viability',
}

export function SignalGauge({
  signalType,
  currentSignal,
  evidence,
  showThresholds = true,
  showLabel = true,
  size = 'md',
  className,
}: SignalGaugeProps) {
  const segments = useMemo(() => getSegments(signalType), [signalType])
  const position = useMemo(() => getSignalPosition(signalType, currentSignal), [signalType, currentSignal])
  const currentConfig = useMemo(() => getSignalConfig(signalType, currentSignal), [signalType, currentSignal])
  const metrics = useMemo(() => formatEvidenceMetrics(signalType, evidence), [signalType, evidence])

  const Icon = iconMap[currentConfig.icon] || Circle
  const sizes = sizeConfig[size]

  // Get color for each segment of the progress bar
  const getSegmentColor = (segmentIdx: number): string => {
    const segment = segments[segmentIdx]
    const currentIdx = segments.findIndex(s => s.signal === currentSignal)

    // Segment is "filled" if current signal is at or past this point
    if (segmentIdx <= currentIdx) {
      return segment.bgColor.replace('bg-', 'bg-opacity-100 bg-')
    }
    return 'bg-gray-200'
  }

  return (
    <TooltipProvider>
      <div className={cn('w-full', className)}>
        {/* Label */}
        {showLabel && (
          <div className="flex items-center justify-between mb-1">
            <span className={cn('font-medium text-gray-700', sizes.text)}>
              {labelMap[signalType]}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn('flex items-center gap-1', currentConfig.color)}>
                  <Icon className={sizes.icon} />
                  <span className={sizes.text}>{currentConfig.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{currentConfig.label}</p>
                  {metrics.length > 0 && (
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {metrics.map((metric, i) => (
                        <li key={i}>{metric}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Gauge Track */}
        <div className="relative">
          {/* Segmented Progress Bar */}
          <div className={cn('flex rounded-full overflow-hidden gap-0.5', sizes.height)}>
            {segments.map((segment, idx) => (
              <div
                key={segment.signal}
                className={cn(
                  'flex-1 transition-colors duration-300',
                  idx === 0 && 'rounded-l-full',
                  idx === segments.length - 1 && 'rounded-r-full',
                  getSegmentColor(idx)
                )}
              />
            ))}
          </div>

          {/* Threshold Markers */}
          {showThresholds && (
            <div className="absolute inset-0 pointer-events-none">
              {segments.slice(1, -1).map((segment) => (
                <div
                  key={segment.signal}
                  className="absolute top-0 h-full w-px bg-gray-400"
                  style={{ left: `${segment.position}%` }}
                />
              ))}
            </div>
          )}

          {/* Current Position Indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ left: `calc(${position}% - 6px)` }}
          >
            <div className={cn(
              'w-3 h-3 rounded-full border-2 border-white shadow-md',
              currentConfig.bgColor
            )} />
          </div>
        </div>

        {/* Segment Labels (for lg size) */}
        {size === 'lg' && showThresholds && (
          <div className="flex justify-between mt-1 text-[10px] text-gray-500">
            <span>{segments[0].label}</span>
            <span>{segments[segments.length - 1].label}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default SignalGauge
