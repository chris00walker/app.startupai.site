/**
 * @story US-F14
 */
'use client'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, X, Heart, Cog, DollarSign, Bot, User } from 'lucide-react'
import type { EvidenceFilters as FilterState, EvidenceDimension, EvidenceSubmitter } from '@/types/evidence-explorer'
import { DIMENSION_CONFIG } from '@/types/evidence-explorer'

interface EvidenceFiltersProps {
  filters: FilterState
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  onReset: () => void
  evidenceCount: number
  className?: string
}

const dimensionIcons: Record<EvidenceDimension, typeof Heart> = {
  desirability: Heart,
  feasibility: Cog,
  viability: DollarSign,
}

export function EvidenceFilters({
  filters,
  onFilterChange,
  onReset,
  evidenceCount,
  className,
}: EvidenceFiltersProps) {
  const hasActiveFilters =
    filters.dimension !== 'all' ||
    filters.search !== '' ||
    filters.strength !== 'all' ||
    filters.source !== 'all' ||
    filters.showContradictions

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dimension Tabs */}
      <Tabs
        value={filters.dimension}
        onValueChange={(value) => onFilterChange('dimension', value as 'all' | EvidenceDimension)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary" className="ml-1 text-xs">
              {evidenceCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="desirability" className="gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="hidden sm:inline">Desirability</span>
            <span className="sm:hidden">D</span>
          </TabsTrigger>
          <TabsTrigger value="feasibility" className="gap-2">
            <Cog className="h-4 w-4 text-blue-500" />
            <span className="hidden sm:inline">Feasibility</span>
            <span className="sm:hidden">F</span>
          </TabsTrigger>
          <TabsTrigger value="viability" className="gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline">Viability</span>
            <span className="sm:hidden">V</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search evidence..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Source Filter */}
        <Select
          value={filters.source}
          onValueChange={(value) => onFilterChange('source', value as 'all' | EvidenceSubmitter)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="user">
              <span className="flex items-center gap-2">
                <User className="h-3 w-3" />
                User
              </span>
            </SelectItem>
            <SelectItem value="ai">
              <span className="flex items-center gap-2">
                <Bot className="h-3 w-3" />
                AI Analysis
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Strength Filter */}
        <Select
          value={filters.strength}
          onValueChange={(value) =>
            onFilterChange('strength', value as 'all' | 'weak' | 'medium' | 'strong')
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Strength" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Strengths</SelectItem>
            <SelectItem value="strong">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Strong
              </span>
            </SelectItem>
            <SelectItem value="medium">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                Medium
              </span>
            </SelectItem>
            <SelectItem value="weak">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Weak
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.dimension !== 'all' && (
            <FilterBadge
              label={DIMENSION_CONFIG[filters.dimension].label}
              onRemove={() => onFilterChange('dimension', 'all')}
              color={DIMENSION_CONFIG[filters.dimension].color}
            />
          )}
          {filters.source !== 'all' && (
            <FilterBadge
              label={filters.source === 'ai' ? 'AI Analysis' : 'User Created'}
              onRemove={() => onFilterChange('source', 'all')}
            />
          )}
          {filters.strength !== 'all' && (
            <FilterBadge
              label={`${filters.strength} evidence`}
              onRemove={() => onFilterChange('strength', 'all')}
            />
          )}
          {filters.search && (
            <FilterBadge
              label={`"${filters.search}"`}
              onRemove={() => onFilterChange('search', '')}
            />
          )}
        </div>
      )}
    </div>
  )
}

function FilterBadge({
  label,
  onRemove,
  color,
}: {
  label: string
  onRemove: () => void
  color?: string
}) {
  return (
    <Badge variant="secondary" className={cn('gap-1 pr-1', color)}>
      {label}
      <button
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

export default EvidenceFilters
