/**
 * @story US-F02
 */
'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AI_FOUNDERS, type FounderId } from '@/lib/founders/founder-mapping'

interface FounderBadgeProps {
  founderId: FounderId
  /** badge = outlined with tooltip, inline = text only, minimal = icon only */
  variant?: 'badge' | 'inline' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  /** Show the founder's title (CSO, CTO, etc.) */
  showRole?: boolean
  /** Prefix the name with "by" */
  showPrefix?: boolean
  className?: string
}

const sizeClasses = {
  sm: { icon: 'h-3 w-3', text: 'text-xs', badge: 'px-1.5 py-0.5', iconWrapper: 'p-0.5' },
  md: { icon: 'h-4 w-4', text: 'text-sm', badge: 'px-2 py-1', iconWrapper: 'p-1' },
  lg: { icon: 'h-5 w-5', text: 'text-base', badge: 'px-3 py-1.5', iconWrapper: 'p-1.5' },
}

export function FounderBadge({
  founderId,
  variant = 'badge',
  size = 'sm',
  showRole = false,
  showPrefix = false,
  className,
}: FounderBadgeProps) {
  const founder = AI_FOUNDERS[founderId]
  const Icon = founder.icon
  const sizes = sizeClasses[size]

  const content = (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className={cn('rounded', sizes.iconWrapper, founder.bgColor)}>
        <Icon className={cn(sizes.icon, founder.textColor)} />
      </div>
      {variant !== 'minimal' && (
        <span className={cn(sizes.text, 'font-medium')}>
          {showPrefix && 'by '}
          {founder.name}
        </span>
      )}
      {showRole && variant !== 'minimal' && (
        <span className={cn(sizes.text, 'text-muted-foreground')}>({founder.title})</span>
      )}
    </div>
  )

  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(sizes.badge, 'cursor-default hover:bg-muted/50')}
              data-testid={`founder-badge-${founderId}`}
            >
              {content}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">
              {founder.name} - {founder.title}
            </p>
            <p className="text-xs text-muted-foreground">{founder.role}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div data-testid={`founder-badge-${founderId}`} className={className}>
      {content}
    </div>
  )
}
