"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { FitDashboard } from "@/components/fit/FitDashboard"
import { GateDashboard } from "@/components/gates/GateDashboard"
import { GateStatusBadge } from "@/components/gates/GateStatusBadge"
import { GateReadinessIndicator } from "@/components/gates/GateReadinessIndicator"
import { useGateEvaluation } from "@/hooks/useGateEvaluation"
import { useGateAlerts } from "@/hooks/useGateAlerts"
import HypothesisManager from "@/components/hypothesis/HypothesisManager"
import { EvidenceLedger } from "@/components/fit/EvidenceLedger"
import { ExperimentsPage } from "@/components/fit/ExperimentsPage"
import { StageSelector } from "@/components/founder/StageSelector"
import { ProjectCreationWizard } from "@/components/onboarding/ProjectCreationWizard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProjects } from "@/hooks/useProjects"
import Link from "next/link"
import { 
  Target,
  FileText,
  Beaker,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Rocket
} from "lucide-react"

function QuickStats({ projectId, currentStage }: { projectId?: string, currentStage?: string }) {
  // Use gate evaluation hook for dynamic data
  const { 
    result, 
    isLoading: gateLoading 
  } = useGateEvaluation({ 
    projectId: projectId || 'default', 
    stage: (currentStage as any) || 'FEASIBILITY',
    autoRefresh: true 
  })
  
  const gateStatus = result?.status || 'Pending'
  const readinessScore = result?.readiness_score || 0
  const evidenceCount = result?.evidence_count || 0
  const experimentsCount = result?.experiments_count || 0

  const stats = [
    {
      label: "Gate Readiness",
      value: gateLoading ? "Loading..." : `${readinessScore}%`,
      change: gateStatus === 'Passed' ? "Gate Passed" : gateStatus === 'Failed' ? "Gate Failed" : "In Progress",
      trend: gateStatus === 'Passed' ? "up" : gateStatus === 'Failed' ? "warning" : "neutral",
      icon: Target,
      color: "text-blue-600"
    },
    {
      label: "Evidence Items",
      value: gateLoading ? "Loading..." : evidenceCount.toString(),
      change: "Quality tracked",
      trend: "neutral",
      icon: FileText,
      color: "text-green-600"
    },
    {
      label: "Active Experiments",
      value: gateLoading ? "Loading..." : experimentsCount.toString(),
      change: "Stage requirements",
      trend: "neutral",
      icon: Beaker,
      color: "text-purple-600"
    },
    {
      label: "Next Milestone",
      value: currentStage || "Feasibility",
      change: gateStatus === 'Pending' ? "Gate evaluation pending" : "Ready to progress",
      trend: "neutral",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {stat.trend === "warning" && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                    {stat.trend === "neutral" && <Clock className="h-3 w-3 text-gray-500" />}
                    <span className={`text-xs ${
                      stat.trend === "up" ? "text-green-600" :
                      stat.trend === "warning" ? "text-yellow-600" : 
                      "text-muted-foreground"
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-muted`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function RecentActivity() {
  const activities = [
    {
      id: "1",
      type: "evidence",
      title: "New evidence added",
      description: "Customer Interview #12 - Strong evidence for Desirability",
      time: "2 hours ago",
      icon: FileText,
      color: "text-green-500"
    },
    {
      id: "2", 
      type: "experiment",
      title: "Experiment completed",
      description: "Technical Architecture Review - Updated Feasibility score",
      time: "1 day ago",
      icon: CheckCircle,
      color: "text-blue-500"
    },
    {
      id: "3",
      type: "contradiction",
      title: "Contradiction detected",
      description: "Price Sensitivity Survey conflicts with previous assumptions",
      time: "3 days ago",
      icon: AlertTriangle,
      color: "text-red-500"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest updates to your validation project</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Icon className={`h-3 w-3 ${activity.color}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function NextSteps() {
  const steps = [
    {
      id: "1",
      title: "Complete Customer Interview Round 2",
      description: "Gather more evidence for Desirability validation",
      priority: "High",
      estimatedTime: "2 weeks"
    },
    {
      id: "2",
      title: "Address Price Sensitivity Contradiction",
      description: "Resolve conflicting evidence about pricing assumptions",
      priority: "Medium", 
      estimatedTime: "1 week"
    },
    {
      id: "3",
      title: "Continue MVP Prototype Development",
      description: "Progress on technical feasibility validation",
      priority: "High",
      estimatedTime: "6 weeks"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
        <CardDescription>AI-suggested actions to improve your fit scores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">{step.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={step.priority === "High" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {step.priority} Priority
                  </Badge>
                  <span className="text-xs text-muted-foreground">{step.estimatedTime}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Start
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16 space-y-6">
      <div className="space-y-4">
        <Rocket className="h-16 w-16 text-blue-600 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Welcome to StartupAI! 🚀</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ready to validate your startup idea with AI-powered insights? Let's create your first validation project.
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
        <Card className="text-left">
          <CardContent className="pt-6">
            <Target className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Our AI analyzes your idea and creates personalized hypotheses and experiments
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-left">
          <CardContent className="pt-6">
            <FileText className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold mb-2">Evidence-Led Validation</h3>
            <p className="text-sm text-muted-foreground">
              Track evidence, measure progress, and make data-driven decisions
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-left">
          <CardContent className="pt-6">
            <Beaker className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold mb-2">Structured Experiments</h3>
            <p className="text-sm text-muted-foreground">
              Follow proven methodologies to validate desirability, feasibility, and viability
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Link href="/projects/new">
        <Button 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Your First Project
        </Button>
      </Link>
    </div>
  )
}

export default function FounderDashboard() {
  const [activeTab, setActiveTab] = React.useState('overview')
  const { projects, isLoading, error } = useProjects()
  
  // Get current project (first project for now, can be enhanced later)
  const currentProject = projects.length > 0 ? projects[0] : null
  const projectId = currentProject?.id
  const currentStage = currentProject?.stage || 'FEASIBILITY'
  
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tabFromUrl = urlParams.get('tab')
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [])

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { title: "Founder Dashboard", href: "/founder-dashboard" },
        ]}
        userType="founder"
      >
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
      </DashboardLayout>
    )
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { title: "Founder Dashboard", href: "/founder-dashboard" },
        ]}
        userType="founder"
      >
        <div className="text-center py-16 space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Error Loading Projects</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  // Show empty state if no projects
  if (projects.length === 0) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { title: "Founder Dashboard", href: "/founder-dashboard" },
        ]}
        userType="founder"
      >
        <EmptyState />
      </DashboardLayout>
    )
  }

  // Show normal dashboard with projects
  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Founder Dashboard", href: "/founder-dashboard" },
      ]}
      userType="founder"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-3xl grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gates">Gates</TabsTrigger>
            <TabsTrigger value="hypotheses">Hypotheses</TabsTrigger>
            <TabsTrigger value="experiments">Experiments</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <Link href="/projects/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <QuickStats projectId={projectId} currentStage={currentStage} />

          {/* Validation Journey Stage Selector */}
          <StageSelector currentStage="validation" className="mb-6" />

          {/* Gate Dashboard - Replace FitDashboard with GateDashboard */}
          {projectId ? (
            <GateDashboard 
              projectId={projectId}
              stage={currentStage as any}
              gateStatus={currentProject?.gateStatus || 'Pending'}
              readinessScore={0} // Will be calculated by the component
              evidenceCount={0} // Will be calculated by the component
              experimentsCount={0} // Will be calculated by the component
            />
          ) : (
            <FitDashboard />
          )}

          {/* Bottom Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentActivity />
            <NextSteps />
          </div>
        </TabsContent>

        <TabsContent value="gates" className="space-y-6">
          {/* Dedicated Gates Tab */}
          {projectId ? (
            <div className="space-y-6">
              {/* Gate Status Overview */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Target className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Stage</p>
                        <p className="text-2xl font-bold">{currentStage}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Gate Status</p>
                        <GateStatusBadge status={currentProject?.gateStatus || 'Pending'} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Readiness</p>
                        <GateReadinessIndicator 
                          score={0} 
                          stage={currentStage as any}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Full Gate Dashboard */}
              <GateDashboard 
                projectId={projectId}
                stage={currentStage as any}
                gateStatus={currentProject?.gateStatus || 'Pending'}
                readinessScore={0}
                evidenceCount={0}
                experimentsCount={0}
              />
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Gate Actions</CardTitle>
                  <CardDescription>
                    Quick actions to improve your gate readiness
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <Link href="/founder-dashboard?tab=evidence">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Add Evidence
                      </Button>
                    </Link>
                    <Link href="/founder-dashboard?tab=experiments">
                      <Button variant="outline" className="w-full justify-start">
                        <Beaker className="h-4 w-4 mr-2" />
                        Run Experiment
                      </Button>
                    </Link>
                    <Link href={`/project/${projectId}/gate`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Target className="h-4 w-4 mr-2" />
                        Full Gate View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a project to access gate evaluation features.
                  </p>
                  <Link href="/projects/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hypotheses" className="space-y-6">
          <HypothesisManager />
        </TabsContent>

        <TabsContent value="experiments">
          <ExperimentsPage />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceLedger />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Advanced analytics and recommendations based on your validation data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Insights Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  We're building advanced AI analytics to provide deeper insights into your validation progress.
                </p>
                <Button variant="outline">
                  Request Early Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
