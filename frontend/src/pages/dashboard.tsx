"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid"
import { PortfolioMetrics } from "@/components/portfolio/PortfolioMetrics"
import { StageProgressIndicator } from "@/components/portfolio/StageProgressIndicator"
import { RiskBudgetWidget } from "@/components/portfolio/RiskBudgetWidget"
import { GuidedTour, DemoBanner } from "@/components/demo/GuidedTour"
import { useDemoMode } from "@/hooks/useDemoMode"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users,
  Settings,
  Shield,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter
} from "lucide-react"
import { mockPortfolioProjects, mockPortfolioMetrics } from "@/data/portfolioMockData"
import { PortfolioProject } from "@/types/portfolio"

function PortfolioOverview() {
  const highRiskProjects = mockPortfolioProjects.filter(p => p.riskBudget.delta > 0.2)
  const recentActivity = [
    {
      id: "1",
      action: "Gate Attempted",
      client: "TechStart Inc.",
      type: "Desirability Gate",
      time: "2 hours ago",
      status: "pending",
    },
    {
      id: "2",
      action: "Evidence Added",
      client: "CloudCorp",
      type: "User Interview",
      time: "4 hours ago",
      status: "success",
    },
    {
      id: "3",
      action: "Override Requested",
      client: "AppVenture",
      type: "Viability Gate",
      time: "1 day ago",
      status: "warning",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Risk Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Risk Alerts
          </CardTitle>
          <CardDescription>Projects requiring attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {highRiskProjects.map((project) => (
            <div key={project.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm">{project.clientName}</div>
                  <div className="text-xs text-muted-foreground">
                    Risk budget exceeded by {(project.riskBudget.delta * 100).toFixed(0)}%
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">High Risk</Badge>
              </div>
            </div>
          ))}
          {highRiskProjects.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              No high-risk projects
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Portfolio Activity</CardTitle>
          <CardDescription>Latest validation activities across projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
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
    </div>
  )
}

function Dashboard() {
  const demoMode = useDemoMode()
  
  const handleProjectClick = (project: PortfolioProject) => {
    // Navigate to project details - placeholder for now
    console.log('Navigate to project:', project.id)
  }

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
          { title: "Portfolio Dashboard", href: "/dashboard" },
        ]}
      >
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
              <p className="text-muted-foreground">
                Evidence-led validation across all client projects
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter Projects
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Gate Policies
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          </div>

          {/* Portfolio Metrics */}
          <div data-tour="portfolio-metrics">
            <PortfolioMetrics metrics={mockPortfolioMetrics} />
          </div>

          {/* Portfolio Overview */}
          <div data-tour="portfolio-overview">
            <PortfolioOverview />
          </div>

          {/* Portfolio Projects Grid */}
          <div data-tour="portfolio-projects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Active Projects
                  <Badge variant="outline" className="ml-2">
                    {mockPortfolioProjects.length} Projects
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Multi-client validation pipeline with evidence-based gates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioGrid 
                  projects={mockPortfolioProjects} 
                  onProjectClick={handleProjectClick}
                />
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
