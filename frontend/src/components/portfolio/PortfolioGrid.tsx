"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users,
  FileText,
  BarChart3
} from "lucide-react"
import { PortfolioProject } from "@/types/portfolio"

interface PortfolioGridProps {
  projects: PortfolioProject[]
  onProjectClick?: (project: PortfolioProject) => void
}

const stageConfig = {
  DESIRABILITY: { 
    color: "bg-blue-500", 
    text: "text-blue-700", 
    bg: "bg-blue-50",
    label: "Desirability"
  },
  FEASIBILITY: { 
    color: "bg-orange-500", 
    text: "text-orange-700", 
    bg: "bg-orange-50",
    label: "Feasibility"
  },
  VIABILITY: { 
    color: "bg-green-500", 
    text: "text-green-700", 
    bg: "bg-green-50",
    label: "Viability"
  },
  SCALE: { 
    color: "bg-purple-500", 
    text: "text-purple-700", 
    bg: "bg-purple-50",
    label: "Scale"
  }
}

const gateStatusConfig = {
  Pending: { 
    icon: Clock, 
    color: "text-yellow-600", 
    bg: "bg-yellow-50",
    badge: "secondary" as const
  },
  Passed: { 
    icon: CheckCircle, 
    color: "text-green-600", 
    bg: "bg-green-50",
    badge: "default" as const
  },
  Failed: { 
    icon: XCircle, 
    color: "text-red-600", 
    bg: "bg-red-50",
    badge: "destructive" as const
  }
}

function ProjectCard({ project, onClick }: { 
  project: PortfolioProject
  onClick?: (project: PortfolioProject) => void 
}) {
  const stageStyle = stageConfig[project.stage]
  const statusStyle = gateStatusConfig[project.gateStatus]
  const StatusIcon = statusStyle.icon

  const getRiskColor = (delta: number) => {
    if (delta <= 0) return "text-green-600"
    if (delta <= 0.2) return "text-yellow-600"
    return "text-red-600"
  }

  const getEvidenceQualityColor = (quality: number) => {
    if (quality >= 0.8) return "text-green-600"
    if (quality >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onClick?.(project)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-8 rounded-full ${stageStyle.color}`} />
            <div>
              <CardTitle className="text-lg">{project.clientName}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{stageStyle.label} Stage</span>
                <Badge variant={statusStyle.badge} className="text-xs">
                  {project.gateStatus}
                </Badge>
              </div>
            </div>
          </div>
          <div className={`p-2 rounded-lg ${statusStyle.bg}`}>
            <StatusIcon className={`h-4 w-4 ${statusStyle.color}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Budget */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Risk Budget</span>
            <span className={`font-medium ${getRiskColor(project.riskBudget.delta)}`}>
              {project.riskBudget.delta > 0 ? '+' : ''}{(project.riskBudget.delta * 100).toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={(project.riskBudget.actual / project.riskBudget.planned) * 100} 
            className="h-2"
          />
        </div>

        {/* Evidence Quality */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Evidence Quality</span>
            <span className={`font-medium ${getEvidenceQualityColor(project.evidenceQuality)}`}>
              {(project.evidenceQuality * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={project.evidenceQuality * 100} className="h-2" />
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
              Hypotheses
            </div>
            <div className="font-semibold text-sm">{project.hypothesesCount}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Experiments
            </div>
            <div className="font-semibold text-sm">{project.experimentsCount}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              Evidence
            </div>
            <div className="font-semibold text-sm">{project.evidenceCount}</div>
          </div>
        </div>

        {/* Last Activity & Next Gate */}
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
          <span>Last: {project.lastActivity}</span>
          {project.nextGateDate && (
            <span>Next Gate: {project.nextGateDate}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function PortfolioGrid({ projects, onProjectClick }: PortfolioGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onClick={onProjectClick}
        />
      ))}
    </div>
  )
}
