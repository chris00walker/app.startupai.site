"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target,
  TrendingUp,
  Users,
  ArrowRight
} from "lucide-react"
import { PortfolioProject } from "@/types/portfolio"

interface GateAlert {
  id: string
  type: 'gate_ready' | 'gate_overdue' | 'gate_failed' | 'evidence_low' | 'experiments_needed'
  priority: 'high' | 'medium' | 'low'
  project: PortfolioProject
  message: string
  actionText: string
  timestamp: string
}

interface GateAlertsProps {
  projects: PortfolioProject[]
  onProjectClick?: (project: PortfolioProject) => void
  className?: string
}

const alertTypeConfig = {
  gate_ready: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    badge: "default" as const,
    title: "Gate Ready"
  },
  gate_overdue: {
    icon: Clock,
    color: "text-red-600", 
    bg: "bg-red-50",
    badge: "destructive" as const,
    title: "Gate Overdue"
  },
  gate_failed: {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50", 
    badge: "destructive" as const,
    title: "Gate Failed"
  },
  evidence_low: {
    icon: TrendingUp,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    badge: "secondary" as const,
    title: "Low Evidence Quality"
  },
  experiments_needed: {
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    badge: "secondary" as const,
    title: "More Experiments Needed"
  }
}

const priorityConfig = {
  high: { label: "High", color: "bg-red-500" },
  medium: { label: "Medium", color: "bg-yellow-500" },
  low: { label: "Low", color: "bg-blue-500" }
}

function generateGateAlerts(projects: PortfolioProject[]): GateAlert[] {
  const alerts: GateAlert[] = []
  
  projects.forEach(project => {
    // Gate Ready Alert (high evidence quality + good experiment count)
    if (project.evidenceQuality >= 0.85 && project.experimentsCount >= 10 && project.gateStatus === 'Pending') {
      alerts.push({
        id: `${project.id}_ready`,
        type: 'gate_ready',
        priority: 'high',
        project,
        message: `${project.clientName} is ready for ${project.stage.toLowerCase()} gate evaluation`,
        actionText: 'Evaluate Gate',
        timestamp: project.lastActivity || 'Recently'
      })
    }

    // Gate Failed Alert
    if (project.gateStatus === 'Failed') {
      alerts.push({
        id: `${project.id}_failed`,
        type: 'gate_failed',
        priority: 'high',
        project,
        message: `${project.clientName} failed ${project.stage.toLowerCase()} gate - needs attention`,
        actionText: 'Review Failure',
        timestamp: project.lastActivity || 'Recently'
      })
    }

    // Low Evidence Quality Alert
    if (project.evidenceQuality < 0.6) {
      alerts.push({
        id: `${project.id}_evidence`,
        type: 'evidence_low',
        priority: 'medium',
        project,
        message: `${project.clientName} has low evidence quality (${(project.evidenceQuality * 100).toFixed(0)}%)`,
        actionText: 'Improve Evidence',
        timestamp: project.lastActivity || 'Recently'
      })
    }

    // More Experiments Needed Alert
    if (project.experimentsCount < 5) {
      alerts.push({
        id: `${project.id}_experiments`,
        type: 'experiments_needed',
        priority: 'medium',
        project,
        message: `${project.clientName} needs more experiments (${project.experimentsCount}/10 recommended)`,
        actionText: 'Plan Experiments',
        timestamp: project.lastActivity || 'Recently'
      })
    }

    // Gate Overdue Alert - based on nextGateDate if available
    if (project.gateStatus === 'Pending' && project.evidenceQuality > 0.7 && project.experimentsCount > 8) {
      alerts.push({
        id: `${project.id}_overdue`,
        type: 'gate_overdue',
        priority: 'high',
        project,
        message: `${project.clientName} gate evaluation is overdue`,
        actionText: 'Schedule Gate',
        timestamp: project.nextGateDate || project.lastActivity || 'Recently'
      })
    }
  })
  
  // Sort by priority and timestamp
  return alerts
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
    .slice(0, 5) // Limit to top 5 alerts
}

function GateAlertItem({ 
  alert, 
  onProjectClick 
}: { 
  alert: GateAlert
  onProjectClick?: (project: PortfolioProject) => void 
}) {
  const config = alertTypeConfig[alert.type]
  const Icon = config.icon
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant={config.badge} className="text-xs">
            {config.title}
          </Badge>
          <div className={`w-2 h-2 rounded-full ${priorityConfig[alert.priority].color}`} />
          <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
        </div>
        
        <p className="text-sm font-medium">{alert.message}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {alert.project.stage} • {alert.project.gateStatus}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onProjectClick?.(alert.project)}
            className="text-xs h-7 px-2"
          >
            {alert.actionText}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function GateAlerts({ projects, onProjectClick, className = "" }: GateAlertsProps) {
  const alerts = generateGateAlerts(projects)
  
  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Gate Alerts</CardTitle>
          </div>
          <CardDescription>
            Gate-related notifications and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-sm mb-1">All Gates on Track</h3>
            <p className="text-xs text-muted-foreground">
              No gate-related issues requiring attention
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Gate Alerts</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {alerts.length} active
          </Badge>
        </div>
        <CardDescription>
          Gate-related notifications and recommendations across your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <GateAlertItem 
            key={alert.id} 
            alert={alert} 
            onProjectClick={onProjectClick}
          />
        ))}
        
        {alerts.length >= 5 && (
          <div className="text-center pt-2 border-t">
            <Button variant="ghost" size="sm" className="text-xs">
              View All Gate Alerts
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
