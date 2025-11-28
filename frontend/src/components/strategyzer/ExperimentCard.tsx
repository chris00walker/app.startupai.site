"use client"

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Beaker,
  Clock,
  DollarSign,
  Target,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  MoreHorizontal,
  ArrowRight,
  AlertTriangle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  type StrategyzerExperimentCard,
  type ExperimentStatus,
  experimentMethodConfig,
  evidenceLevelConfig,
  outcomeConfig
} from './types'

interface ExperimentCardProps {
  experiment: StrategyzerExperimentCard
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: ExperimentStatus) => void
  onRecordResults?: (id: string) => void
  compact?: boolean
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  planned: { label: 'Planned', color: 'bg-blue-100 text-blue-800', icon: Target },
  running: { label: 'Running', color: 'bg-yellow-100 text-yellow-800', icon: Play },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
} as const

export function ExperimentCard({
  experiment,
  onEdit,
  onDelete,
  onStatusChange,
  onRecordResults,
  compact = false
}: ExperimentCardProps) {
  const StatusIcon = statusConfig[experiment.status].icon
  const methodInfo = experimentMethodConfig[experiment.method] || { label: experiment.method || 'Unknown' }

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={statusConfig[experiment.status].color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig[experiment.status].label}
                </Badge>
                <Badge variant="outline">{methodInfo.label}</Badge>
              </div>
              <p className="text-sm font-medium line-clamp-2">{experiment.hypothesis}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {experiment.metric || 'No metric'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {experiment.cost_time || 'TBD'}
                </span>
              </div>
            </div>
            <CardActions
              experiment={experiment}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onRecordResults={onRecordResults}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get evidence strength config safely
  const evidenceStrength = experiment.evidence_strength || 'none'
  const evidenceConfig = evidenceLevelConfig[evidenceStrength] || evidenceLevelConfig.none

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge className={statusConfig[experiment.status].color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[experiment.status].label}
            </Badge>
            <Badge variant="outline">
              <Beaker className="h-3 w-3 mr-1" />
              {methodInfo.label}
            </Badge>
            <Badge className={evidenceConfig.color}>
              {evidenceConfig.label} Evidence
            </Badge>
          </div>
          <CardActions
            experiment={experiment}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onRecordResults={onRecordResults}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hypothesis */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">HYPOTHESIS</p>
          <p className="text-sm leading-relaxed">{experiment.hypothesis}</p>
        </div>

        {/* Metric & Success Criteria - Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">METRIC</p>
            <p className="text-sm">{experiment.metric || <span className="text-muted-foreground italic">Not defined</span>}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">SUCCESS CRITERIA</p>
            <p className="text-sm">{experiment.success_criteria || <span className="text-muted-foreground italic">Not defined</span>}</p>
          </div>
        </div>

        {/* Expected Outcome */}
        {experiment.expected_outcome && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">EXPECTED OUTCOME</p>
            <Badge className={outcomeConfig[experiment.expected_outcome].color}>
              {outcomeConfig[experiment.expected_outcome].label}
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              {outcomeConfig[experiment.expected_outcome].description}
            </span>
          </div>
        )}

        {/* Cost & Timeline */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{experiment.cost_time || 'TBD'}</span>
          </div>
          {experiment.cost_money !== undefined && experiment.cost_money !== null && experiment.cost_money > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>${experiment.cost_money.toLocaleString()}</span>
            </div>
          )}
          {experiment.start_date && (
            <div className="text-xs text-muted-foreground ml-auto">
              Started: {new Date(experiment.start_date).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Results Section (if completed) */}
        {experiment.status === 'completed' && experiment.actual_outcome && (
          <div className="pt-3 border-t bg-muted/30 -mx-6 -mb-6 px-6 pb-4 rounded-b-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">RESULTS</p>
            <div className="flex items-center gap-3">
              <Badge className={outcomeConfig[experiment.actual_outcome].color}>
                {outcomeConfig[experiment.actual_outcome].label}
              </Badge>
              {experiment.actual_metric_value && (
                <span className="text-sm">
                  Measured: <span className="font-medium">{experiment.actual_metric_value}</span>
                </span>
              )}
            </div>
            {experiment.expected_outcome && experiment.actual_outcome !== experiment.expected_outcome && (
              <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                <span>
                  Outcome differs from expected ({outcomeConfig[experiment.expected_outcome].label})
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CardActions({
  experiment,
  onEdit,
  onDelete,
  onStatusChange,
  onRecordResults
}: Pick<ExperimentCardProps, 'experiment' | 'onEdit' | 'onDelete' | 'onStatusChange' | 'onRecordResults'>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(experiment.id)}>
            Edit Card
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Status transitions */}
        {onStatusChange && experiment.status === 'draft' && (
          <DropdownMenuItem onClick={() => onStatusChange(experiment.id, 'planned')}>
            <Target className="h-4 w-4 mr-2" />
            Mark as Planned
          </DropdownMenuItem>
        )}
        {onStatusChange && experiment.status === 'planned' && (
          <DropdownMenuItem onClick={() => onStatusChange(experiment.id, 'running')}>
            <Play className="h-4 w-4 mr-2" />
            Start Experiment
          </DropdownMenuItem>
        )}
        {onStatusChange && experiment.status === 'running' && (
          <>
            <DropdownMenuItem onClick={() => onRecordResults?.(experiment.id)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Record Results
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(experiment.id, 'cancelled')}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Experiment
            </DropdownMenuItem>
          </>
        )}

        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(experiment.id)}
            >
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ExperimentCard
