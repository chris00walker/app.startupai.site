'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AI_FOUNDERS, type FounderId, type FounderStatus } from '@/lib/founders/founder-mapping'

interface FounderAvatarProps {
  founderId: FounderId
  size?: 'sm' | 'md' | 'lg'
  status?: FounderStatus
  /** Show pulse animation when running */
  showPulse?: boolean
  /** Show tooltip on hover */
  showTooltip?: boolean
  className?: string
}

const sizeClasses = {
  sm: { container: 'h-6 w-6', icon: 'h-3 w-3', pulse: 'h-2 w-2' },
  md: { container: 'h-8 w-8', icon: 'h-4 w-4', pulse: 'h-2.5 w-2.5' },
  lg: { container: 'h-10 w-10', icon: 'h-5 w-5', pulse: 'h-3 w-3' },
}

const statusRingClasses: Record<FounderStatus, string> = {
  idle: '',
  running: 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900',
  completed: 'ring-2 ring-green-500 ring-offset-1 dark:ring-offset-gray-900',
  error: 'ring-2 ring-red-500 ring-offset-1 dark:ring-offset-gray-900',
}

export function FounderAvatar({
  founderId,
  size = 'md',
  status = 'idle',
  showPulse = true,
  showTooltip = true,
  className,
}: FounderAvatarProps) {
  const founder = AI_FOUNDERS[founderId]
  const Icon = founder.icon
  const sizes = sizeClasses[size]

  const avatar = (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center transition-all',
          sizes.container,
          founder.bgColor,
          statusRingClasses[status]
        )}
        data-testid={`founder-avatar-${founderId}`}
      >
        <Icon className={cn(sizes.icon, founder.textColor)} />
      </div>
      {status === 'running' && showPulse && (
        <span className="absolute -top-0.5 -right-0.5">
          <span
            className={cn(
              'animate-ping absolute inline-flex rounded-full bg-blue-400 opacity-75',
              sizes.pulse
            )}
          />
          <span className={cn('relative inline-flex rounded-full bg-blue-500', sizes.pulse)} />
        </span>
      )}
    </div>
  )

  if (!showTooltip) {
    return avatar
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{avatar}</TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">
            {founder.name} - {founder.title}
          </p>
          <p className="text-xs text-muted-foreground">{founder.role}</p>
          {status !== 'idle' && (
            <p
              className={cn(
                'text-xs mt-1 capitalize',
                status === 'running' && 'text-blue-500',
                status === 'completed' && 'text-green-500',
                status === 'error' && 'text-red-500'
              )}
            >
              {status}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
