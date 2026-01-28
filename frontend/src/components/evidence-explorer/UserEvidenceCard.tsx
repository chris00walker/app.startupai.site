/**
 * @story US-F14
 */
'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Heart,
  Cog,
  DollarSign,
  FileText,
  Users,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  User,
} from 'lucide-react'
import { format } from 'date-fns'
import type { UserEvidenceItem, EvidenceDimension } from '@/types/evidence-explorer'
import { DIMENSION_CONFIG, STRENGTH_CONFIG } from '@/types/evidence-explorer'

interface UserEvidenceCardProps {
  item: UserEvidenceItem
  onClick?: () => void
  className?: string
}

const categoryIcons = {
  Survey: BarChart3,
  Interview: Users,
  Experiment: FileText,
  Analytics: BarChart3,
  Research: FileText,
}

const dimensionIcons: Record<EvidenceDimension, typeof Heart> = {
  desirability: Heart,
  feasibility: Cog,
  viability: DollarSign,
}

export function UserEvidenceCard({ item, onClick, className }: UserEvidenceCardProps) {
  const dimensionConfig = DIMENSION_CONFIG[item.dimension]
  const strengthConfig = STRENGTH_CONFIG[item.strength]
  const CategoryIcon = categoryIcons[item.category] || FileText
  const DimensionIcon = dimensionIcons[item.dimension]

  return (
    <Card
      className={cn(
        'border-l-4 transition-shadow hover:shadow-md cursor-pointer',
        dimensionConfig.borderColor,
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-wide">
                {item.category}
              </CardDescription>
            </div>
          </div>
          {item.isContradiction && (
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        {item.data.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.data.summary}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn('text-xs', strengthConfig.bgColor, strengthConfig.color)}>
            {strengthConfig.label}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <DimensionIcon className={cn('h-3 w-3', dimensionConfig.color)} />
            {dimensionConfig.label}
          </Badge>
          {item.isContradiction && (
            <Badge variant="destructive" className="text-xs">
              Contradiction
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{item.data.author || 'Unknown'}</span>
          </div>
          <span>{format(item.timestamp, 'MMM dd, yyyy')}</span>
        </div>

        {/* View Details */}
        <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
          View details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default UserEvidenceCard
