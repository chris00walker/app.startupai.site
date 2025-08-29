"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { MetricsCards } from "@/components/dashboard/MetricsCards"
import { CanvasGallery } from "@/components/canvas/CanvasGallery"
import { GuidedTour, DemoBanner } from "@/components/demo/GuidedTour"
import { useDemoMode } from "@/hooks/useDemoMode"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Brain, 
  Palette, 
  Clock, 
  Play, 
  Pause, 
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp
} from "lucide-react"

// Mock data for active workflows
const activeWorkflows = [
  {
    id: "1",
    client: "TechStart Inc.",
    type: "Discovery",
    progress: 75,
    status: "running",
    estimatedCompletion: "2 hours",
    agent: "Customer Discovery Agent",
  },
  {
    id: "2",
    client: "CloudCorp",
    type: "Validation",
    progress: 45,
    status: "paused",
    estimatedCompletion: "4 hours",
    agent: "Business Model Agent",
  },
  {
    id: "3",
    client: "AppVenture",
    type: "Scale",
    progress: 90,
    status: "completed",
    estimatedCompletion: "Completed",
    agent: "Canvas Generator Agent",
  },
]

const statusConfig = {
  running: { 
    icon: Play, 
    color: "text-green-500", 
    bg: "bg-green-50", 
    badge: "default" as const 
  },
  paused: { 
    icon: Pause, 
    color: "text-yellow-500", 
    bg: "bg-yellow-50", 
    badge: "secondary" as const 
  },
  completed: { 
    icon: CheckCircle, 
    color: "text-blue-500", 
    bg: "bg-blue-50", 
    badge: "outline" as const 
  },
}

function WorkflowCard({ workflow }: { workflow: typeof activeWorkflows[0] }) {
  const config = statusConfig[workflow.status as keyof typeof statusConfig]
  const StatusIcon = config.icon

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <StatusIcon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-base">{workflow.client}</CardTitle>
              <CardDescription>{workflow.type} Workflow</CardDescription>
            </div>
          </div>
          <Badge variant={config.badge}>{workflow.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{workflow.progress}%</span>
          </div>
          <Progress value={workflow.progress} className="h-2" />
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Brain className="h-3 w-3" />
              {workflow.agent}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {workflow.estimatedCompletion}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivity() {
  const activities = [
    {
      id: "1",
      action: "Canvas Generated",
      client: "TechStart Inc.",
      type: "Value Proposition Canvas",
      time: "2 minutes ago",
      status: "success",
    },
    {
      id: "2",
      action: "Workflow Started",
      client: "CloudCorp",
      type: "Business Model Analysis",
      time: "1 hour ago",
      status: "info",
    },
    {
      id: "3",
      action: "Client Onboarded",
      client: "AppVenture",
      type: "New Client Setup",
      time: "3 hours ago",
      status: "success",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "info":
        return <Brain className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest platform activities and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3">
              {getStatusIcon(activity.status)}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.client} • {activity.type}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function Dashboard() {
  const demoMode = useDemoMode()
  
  // Use demo data when in demo mode, otherwise use regular data
  const displayMetrics = demoMode.isDemo ? demoMode.metrics : {
    activeClients: 12,
    canvasGenerated: 156,
    workflowSuccessRate: 94,
    costEfficiency: 1.2
  }
  
  const displayWorkflows = demoMode.isDemo ? demoMode.activeWorkflows : activeWorkflows
  const displayActivity = demoMode.isDemo ? demoMode.recentActivity : []
  const displayCanvases = demoMode.isDemo ? demoMode.canvases : []

  return (
    <>
      {demoMode.isDemo && (
        <DemoBanner 
          onExitDemo={demoMode.exitDemo}
          onRestartTour={demoMode.restartTour}
        />
      )}
      
      <DashboardLayout
        breadcrumbs={[
          { title: demoMode.isDemo ? "Demo Dashboard" : "Dashboard", href: "/dashboard" },
        ]}
      >
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
              <p className="text-muted-foreground">
                Here's what's happening with your AI consulting platform today.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Add Client
              </Button>
              <Button>
                <Palette className="h-4 w-4 mr-2" />
                Generate Canvas
              </Button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div data-tour="metrics">
            <MetricsCards />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Active Workflows */}
            <div data-tour="workflows">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Active AI Workflows
                    {demoMode.isDemo && (
                      <Badge variant="secondary" className="ml-2">
                        Demo: TechStart Inc.
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {demoMode.isDemo 
                      ? "AI agents collaborating on TechStart Inc. strategy validation"
                      : "Multi-agent collaboration in progress"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayWorkflows.map((workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <RecentActivity />
            </div>
          </div>

          {/* Canvas Gallery Preview */}
          <div data-tour="canvas-gallery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {demoMode.isDemo ? "TechStart Inc. Strategic Canvases" : "Recent Canvas Generation"}
                  {demoMode.isDemo && (
                    <Badge variant="outline" className="ml-2">
                      3 Completed
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {demoMode.isDemo 
                    ? "Complete Strategyzer methodology: VPC, BMC, and TBI frameworks"
                    : "Latest AI-generated strategic canvases"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CanvasGallery demoCanvases={demoMode.isDemo ? displayCanvases : undefined} />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
      
      <GuidedTour
        currentStep={demoMode.currentStep}
        onNext={demoMode.nextStep}
        onPrev={demoMode.prevStep}
        onSkip={demoMode.skipTour}
        onComplete={demoMode.skipTour}
        isVisible={demoMode.showGuidedTour}
      />
    </>
  )
}

export default Dashboard
