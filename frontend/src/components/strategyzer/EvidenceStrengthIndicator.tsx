/**
 * EvidenceStrengthIndicator Components
 *
 * Visual indicators for evidence strength based on CrewAI's 3-value system:
 * - Strong (>60%): Green filled circle - behavioral commitment demonstrated
 * - Weak (30-60%): Yellow half-filled circle - verbal interest only
 * - None (<30%): Gray empty circle - insufficient evidence
 *
 * @story US-F06
 */
"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { type EvidenceStrength, evidenceStrengthConfig } from './types'

// Defensive fallback for unknown evidence strength values
const defaultEvidenceConfig = { label: 'Unknown', color: 'bg-gray-100 text-gray-800', description: 'Unknown evidence level' }

const getEvidenceConfig = (strength: string | undefined | null) => {
  if (!strength) return defaultEvidenceConfig
  return evidenceStrengthConfig[strength as keyof typeof evidenceStrengthConfig] || defaultEvidenceConfig
}

interface EvidenceStrengthIndicatorProps {
  strength: EvidenceStrength
  showLabel?: boolean
  showDescription?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Visual indicator for evidence strength based on CrewAI's 3-value system:
 * - Strong (>60%): Green filled circle - behavioral commitment demonstrated
 * - Weak (30-60%): Yellow half-filled circle - verbal interest only
 * - None (<30%): Gray empty circle - insufficient evidence
 */
export function EvidenceStrengthIndicator({
  strength,
  showLabel = false,
  showDescription = false,
  size = 'md',
  className
}: EvidenceStrengthIndicatorProps) {
  const config = getEvidenceConfig(strength)

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const indicator = (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="relative">
        {/* Outer ring */}
        <div
          className={cn(
            'rounded-full border-2',
            sizeClasses[size],
            strength === 'strong' && 'border-green-500 bg-green-500',
            strength === 'weak' && 'border-yellow-500 bg-gradient-to-t from-yellow-500 to-transparent',
            strength === 'none' && 'border-gray-400 bg-transparent'
          )}
        />
        {/* Half-fill for weak evidence */}
        {strength === 'weak' && (
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 rounded-b-full bg-yellow-500',
              size === 'sm' && 'h-1.5',
              size === 'md' && 'h-2',
              size === 'lg' && 'h-2.5'
            )}
            style={{ clipPath: 'inset(50% 0 0 0)' }}
          />
        )}
      </div>
      {showLabel && (
        <span className={cn(labelSizes[size], 'font-medium', config.color.split(' ')[1])}>
          {config.label}
        </span>
      )}
    </div>
  )

  if (showDescription) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{config.label} Evidence</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return indicator
}

/**
 * Badge variant of the evidence strength indicator
 * More compact, suitable for inline use in cards
 */
interface EvidenceStrengthBadgeProps {
  strength: EvidenceStrength
  showIcon?: boolean
  className?: string
}

export function EvidenceStrengthBadge({
  strength,
  showIcon = true,
  className
}: EvidenceStrengthBadgeProps) {
  const config = getEvidenceConfig(strength)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        config.color,
        className
      )}
    >
      {showIcon && (
        <EvidenceStrengthIndicator strength={strength} size="sm" />
      )}
      {config.label}
    </span>
  )
}

/**
 * Evidence strength progress bar
 * Shows visual progress from None → Weak → Strong
 */
interface EvidenceStrengthProgressProps {
  strength: EvidenceStrength
  showLabels?: boolean
  className?: string
}

export function EvidenceStrengthProgress({
  strength,
  showLabels = false,
  className
}: EvidenceStrengthProgressProps) {
  const progressValue = strength === 'strong' ? 100 : strength === 'weak' ? 50 : 0

  return (
    <div className={cn('space-y-1', className)}>
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>None</span>
          <span>Weak</span>
          <span>Strong</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            strength === 'strong' && 'bg-green-500',
            strength === 'weak' && 'bg-yellow-500',
            strength === 'none' && 'bg-gray-300'
          )}
          style={{ width: `${progressValue}%` }}
        />
      </div>
    </div>
  )
}

export default EvidenceStrengthIndicator
