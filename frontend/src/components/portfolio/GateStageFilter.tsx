"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, Target } from "lucide-react"
import type { ValidationStage, GateStatus } from "@/types/portfolio"

// Re-export for backwards compatibility
export type GateStage = ValidationStage
export type { GateStatus }

interface GateStageFilterProps {
  selectedStages: GateStage[]
  selectedStatuses: GateStatus[]
  onStageChange: (stages: GateStage[]) => void
  onStatusChange: (statuses: GateStatus[]) => void
  projectCounts: Record<GateStage, number>
  className?: string
}

const stageConfig = {
  DESIRABILITY: { 
    label: "Desirability",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50"
  },
  FEASIBILITY: { 
    label: "Feasibility",
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50"
  },
  VIABILITY: { 
    label: "Viability",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50"
  },
  SCALE: { 
    label: "Scale",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50"
  }
}

const statusConfig: Record<GateStatus, { label: string; color: string }> = {
  Pending: { label: "Pending", color: "bg-yellow-500" },
  Passed: { label: "Passed", color: "bg-green-500" },
  Failed: { label: "Failed", color: "bg-red-500" },
  "At Risk": { label: "At Risk", color: "bg-orange-500" },
}

export function GateStageFilter({
  selectedStages,
  selectedStatuses,
  onStageChange,
  onStatusChange,
  projectCounts,
  className = ""
}: GateStageFilterProps) {
  const totalFilters = selectedStages.length + selectedStatuses.length
  const allStages: GateStage[] = ['DESIRABILITY', 'FEASIBILITY', 'VIABILITY', 'SCALE']
  const allStatuses: GateStatus[] = ['Pending', 'Passed', 'Failed', 'At Risk']

  const handleStageToggle = (stage: GateStage) => {
    if (selectedStages.includes(stage)) {
      onStageChange(selectedStages.filter(s => s !== stage))
    } else {
      onStageChange([...selectedStages, stage])
    }
  }

  const handleStatusToggle = (status: GateStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status))
    } else {
      onStatusChange([...selectedStatuses, status])
    }
  }

  const clearAllFilters = () => {
    onStageChange([])
    onStatusChange([])
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Gate Filters
            {totalFilters > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {totalFilters}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Gate Stages
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {allStages.map((stage) => (
            <DropdownMenuCheckboxItem
              key={stage}
              checked={selectedStages.includes(stage)}
              onCheckedChange={() => handleStageToggle(stage)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div 
                  className={`w-2 h-2 rounded-full ${stageConfig[stage].color}`}
                  aria-hidden="true"
                />
                {stageConfig[stage].label}
              </div>
              <Badge variant="outline" className="text-xs">
                {projectCounts[stage] || 0}
              </Badge>
            </DropdownMenuCheckboxItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Gate Status</DropdownMenuLabel>
          
          {allStatuses.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={selectedStatuses.includes(status)}
              onCheckedChange={() => handleStatusToggle(status)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div 
                  className={`w-2 h-2 rounded-full ${statusConfig[status].color}`}
                  aria-hidden="true"
                />
                {statusConfig[status].label}
              </div>
            </DropdownMenuCheckboxItem>
          ))}
          
          {totalFilters > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="w-full text-xs"
                >
                  Clear All Filters
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Active Filter Badges */}
      {selectedStages.length > 0 && (
        <div className="flex gap-1">
          {selectedStages.map((stage) => (
            <Badge 
              key={stage} 
              variant="secondary" 
              className={`text-xs ${stageConfig[stage].textColor} ${stageConfig[stage].bgColor}`}
            >
              {stageConfig[stage].label}
              <button
                onClick={() => handleStageToggle(stage)}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                aria-label={`Remove ${stageConfig[stage].label} filter`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {selectedStatuses.length > 0 && (
        <div className="flex gap-1">
          {selectedStatuses.map((status) => (
            <Badge 
              key={status} 
              variant="secondary" 
              className="text-xs"
            >
              {status}
              <button
                onClick={() => handleStatusToggle(status)}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                aria-label={`Remove ${status} filter`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
