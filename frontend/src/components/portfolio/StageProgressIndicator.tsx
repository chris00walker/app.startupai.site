/**
 * @story US-C03
 */
"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, XCircle, Clock } from "lucide-react"
import { PortfolioProject } from "@/types/portfolio"

interface StageProgressIndicatorProps {
  currentStage: PortfolioProject['stage']
  gateStatus: PortfolioProject['gateStatus']
  className?: string
}

const stages = [
  { key: 'DESIRABILITY', label: 'Desirability', short: 'DES' },
  { key: 'FEASIBILITY', label: 'Feasibility', short: 'FEA' },
  { key: 'VIABILITY', label: 'Viability', short: 'VIA' },
  { key: 'SCALE', label: 'Scale', short: 'SCA' }
] as const

export function StageProgressIndicator({ 
  currentStage, 
  gateStatus, 
  className = "" 
}: StageProgressIndicatorProps) {
  const currentStageIndex = stages.findIndex(stage => stage.key === currentStage)
  
  const getStageStatus = (stageIndex: number) => {
    if (stageIndex < currentStageIndex) return 'completed'
    if (stageIndex === currentStageIndex) {
      return gateStatus === 'Passed' ? 'completed' : 
             gateStatus === 'Failed' ? 'failed' : 'current'
    }
    return 'pending'
  }

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'current':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'current':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {stages.map((stage, index) => {
        const status = getStageStatus(index)
        const isLast = index === stages.length - 1
        
        return (
          <React.Fragment key={stage.key}>
            <div className="flex items-center gap-2">
              {getStageIcon(status)}
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-1 ${getStageColor(status)}`}
              >
                {stage.short}
              </Badge>
            </div>
            {!isLast && (
              <div className="w-8 h-px bg-gray-300" />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
