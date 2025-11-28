'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FounderAvatar } from './FounderAvatar'
import { useFounderStatus } from '@/hooks/useFounderStatus'
import { getAllFounders } from '@/lib/founders/founder-mapping'

interface FounderStatusPanelProps {
  /** Project ID for context */
  projectId?: string
  /** Display variant */
  variant?: 'sidebar' | 'header' | 'compact'
  /** Whether sidebar variant starts expanded */
  defaultExpanded?: boolean
  className?: string
}

export function FounderStatusPanel({
  projectId,
  variant = 'sidebar',
  defaultExpanded = true,
  className,
}: FounderStatusPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const { founders, activeFounder, isAnalyzing, isLoading, error, timestamp } = useFounderStatus({
    projectId,
  })

  // Header variant: compact row of avatars
  if (variant === 'header') {
    return (
      <div
        className={cn('flex items-center gap-2', className)}
        data-testid="founder-status-header"
      >
        {getAllFounders().map((founder) => {
          const founderStatus = founders.find((f) => f.id === founder.id)
          return (
            <FounderAvatar
              key={founder.id}
              founderId={founder.id}
              size="sm"
              status={founderStatus?.status}
            />
          )
        })}
        {isAnalyzing && (
          <Badge variant="default" className="animate-pulse ml-1 text-xs">
            Processing
          </Badge>
        )}
      </div>
    )
  }

  // Compact variant: just avatars in a row
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {getAllFounders().map((founder) => {
          const founderStatus = founders.find((f) => f.id === founder.id)
          return (
            <FounderAvatar
              key={founder.id}
              founderId={founder.id}
              size="sm"
              status={founderStatus?.status}
            />
          )
        })}
      </div>
    )
  }

  // Sidebar variant: full collapsible card
  return (
    <Card className={cn('', className)}>
      <CardHeader
        className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            AI Founders
            {isAnalyzing && (
              <Badge variant="default" className="animate-pulse text-xs">
                Active
              </Badge>
            )}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : error ? (
            <p className="text-xs text-amber-600 py-2">Unable to connect to founders</p>
          ) : (
            <div className="space-y-2">
              {founders.map((founder) => {
                const Icon = founder.icon

                return (
                  <div
                    key={founder.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg transition-colors',
                      founder.status === 'running' && 'bg-blue-50 dark:bg-blue-950/50',
                      founder.status === 'completed' && 'bg-green-50 dark:bg-green-950/50',
                      founder.status === 'idle' && 'bg-muted/30'
                    )}
                  >
                    <FounderAvatar
                      founderId={founder.id}
                      size="sm"
                      status={founder.status}
                      showTooltip={false}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium truncate">{founder.name}</span>
                        <span className="text-xs text-muted-foreground">{founder.title}</span>
                      </div>
                      {founder.status === 'running' && founder.currentTask && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                          {founder.currentTask}
                        </p>
                      )}
                    </div>
                    {founder.status !== 'idle' && (
                      <Badge
                        variant={founder.status === 'running' ? 'default' : 'outline'}
                        className="text-xs capitalize"
                      >
                        {founder.status}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {timestamp && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Updated: {new Date(timestamp).toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
