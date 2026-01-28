/**
 * @story US-F14
 */
'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Calendar } from 'lucide-react'
import type { UnifiedEvidenceItem, UserEvidenceItem, AIEvidenceItem } from '@/types/evidence-explorer'
import { groupEvidenceByDate } from '@/lib/evidence/transform'
import { UserEvidenceCard } from './UserEvidenceCard'
import { AIEvidenceCard } from './AIEvidenceCard'

interface EvidenceTimelineProps {
  evidence: UnifiedEvidenceItem[]
  onSelectItem: (item: UnifiedEvidenceItem) => void
  isLoading?: boolean
  className?: string
}

export function EvidenceTimeline({
  evidence,
  onSelectItem,
  isLoading,
  className,
}: EvidenceTimelineProps) {
  if (isLoading) {
    return <TimelineSkeleton />
  }

  if (evidence.length === 0) {
    return <EmptyState />
  }

  // Group evidence by month
  const groupedEvidence = groupEvidenceByDate(evidence)

  return (
    <div className={cn('space-y-8', className)}>
      {Array.from(groupedEvidence.entries()).map(([dateKey, items]) => (
        <TimelineGroup
          key={dateKey}
          dateLabel={dateKey}
          items={items}
          onSelectItem={onSelectItem}
        />
      ))}
    </div>
  )
}

// =======================================================================================
// TIMELINE GROUP
// =======================================================================================

interface TimelineGroupProps {
  dateLabel: string
  items: UnifiedEvidenceItem[]
  onSelectItem: (item: UnifiedEvidenceItem) => void
}

function TimelineGroup({ dateLabel, items, onSelectItem }: TimelineGroupProps) {
  return (
    <div className="relative">
      {/* Date Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground">{dateLabel}</h3>
          <Badge variant="outline" className="text-xs">
            {items.length} item{items.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Timeline Line */}
      <div className="absolute left-[7px] top-8 bottom-0 w-px bg-border" />

      {/* Evidence Items */}
      <div className="space-y-4 pl-6">
        {items.map((item) => (
          <div key={item.id} className="relative">
            {/* Timeline Dot */}
            <div
              className={cn(
                'absolute -left-6 top-4 h-3 w-3 rounded-full border-2 bg-background',
                item.source === 'ai' ? 'border-purple-500' : 'border-blue-500'
              )}
            />

            {/* Evidence Card */}
            {item.source === 'user' ? (
              <UserEvidenceCard
                item={item as UserEvidenceItem}
                onClick={() => onSelectItem(item)}
              />
            ) : (
              <AIEvidenceCard
                item={item as AIEvidenceItem}
                onClick={() => onSelectItem(item)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// =======================================================================================
// EMPTY STATE
// =======================================================================================

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No evidence found</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Start collecting evidence by adding interview notes, survey results, or run a CrewAI
          analysis to generate quantitative metrics.
        </p>
      </CardContent>
    </Card>
  )
}

// =======================================================================================
// LOADING SKELETON
// =======================================================================================

function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map((group) => (
        <div key={group} className="space-y-4">
          {/* Date header skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>

          {/* Card skeletons */}
          <div className="space-y-4 pl-6">
            {[1, 2, 3].map((card) => (
              <Card key={card} className="border-l-4 border-l-muted">
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default EvidenceTimeline
