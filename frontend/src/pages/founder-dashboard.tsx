"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { FitDashboard } from "@/components/fit/FitDashboard"
import { GateDashboard } from "@/components/gates/GateDashboard"
import { ValidationResultsSummary } from "@/components/validation/ValidationResultsSummary"
import { GateStatusBadge } from "@/components/gates/GateStatusBadge"
import { GateReadinessIndicator } from "@/components/gates/GateReadinessIndicator"
import { useGateEvaluation } from "@/hooks/useGateEvaluation"
import { useGateAlerts } from "@/hooks/useGateAlerts"
import { EvidenceLedger } from "@/components/fit/EvidenceLedger"
import { StageSelector } from "@/components/founder/StageSelector"
import { ProjectCreationWizard } from "@/components/onboarding/ProjectCreationWizard"
import { DashboardAIAssistant } from "@/components/assistant/DashboardAIAssistant"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProjects } from "@/hooks/useProjects"
import { useAuth } from "@/lib/auth/hooks"
import Link from "next/link"
import { useRouter } from "next/router"
import { VPCSummaryCard } from "@/components/vpc"
import { InnovationPhysicsPanel } from "@/components/signals"
// Strategyzer Components
import { AssumptionMap, ExperimentCardsGrid, CanvasesGallery } from "@/components/strategyzer"
// Hooks for real data
import { useRecentActivity, type ActivityItem } from "@/hooks/useRecentActivity"
import { useRecommendedActions, type RecommendedAction } from "@/hooks/useRecommendedActions"
import {
  Target,
  FileText,
  Beaker,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Rocket,
  Brain,
  LayoutGrid,
  Users,
  BookOpen,
  Map
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

function RecentActivity({ projectId }: { projectId?: string }) {
  const { activities, isLoading } = useRecentActivity({ projectId, limit: 5 })

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'evidence': return { icon: FileText, color: 'text-green-500' }
      case 'experiment': return { icon: Beaker, color: 'text-blue-500' }
      case 'assumption': return { icon: Target, color: 'text-purple-500' }
      case 'contradiction': return { icon: AlertTriangle, color: 'text-red-500' }
      default: return { icon: Clock, color: 'text-gray-500' }
    }
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest updates to your validation project</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No activity yet. Start by adding assumptions or evidence.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const { icon: Icon, color } = getActivityIcon(activity.type)
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <Icon className={`h-3 w-3 ${color}`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function NextSteps({ projectId }: { projectId?: string }) {
  const { actions, isLoading } = useRecommendedActions({ projectId, limit: 5 })

  const getCategoryIcon = (category: RecommendedAction['category']) => {
    switch (category) {
      case 'assumption': return Target
      case 'experiment': return Beaker
      case 'evidence': return FileText
      case 'canvas': return LayoutGrid
      default: return CheckCircle
    }
  }

  const getActionVerb = (actionType: RecommendedAction['actionType']) => {
    switch (actionType) {
      case 'create': return 'Create'
      case 'complete': return 'Complete'
      case 'review': return 'Review'
      case 'resolve': return 'Resolve'
      default: return 'Start'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
        <CardDescription>AI-suggested actions based on your validation state</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Analyzing your project...</div>
        ) : actions.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>Great progress! No immediate actions recommended.</p>
            <p className="text-xs mt-1">Keep validating your assumptions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => {
              const Icon = getCategoryIcon(action.category)
              return (
                <div key={action.id} className="flex items-start justify-between p-3 rounded-lg border">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-1.5 rounded-lg bg-muted mt-0.5">
                      <Icon className={`h-3 w-3 ${
                        action.priority === 'high' ? 'text-red-500' :
                        action.priority === 'medium' ? 'text-yellow-500' :
                        'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">{action.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{action.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={action.priority === 'high' ? 'destructive' :
                                   action.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {action.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {getActionVerb(action.actionType)}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
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
  const { user } = useAuth()
  const router = useRouter()

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
        <div data-testid="dashboard-loading" className="text-center py-16">
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
        <div data-testid="dashboard">
          <EmptyState />
        </div>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" data-testid="dashboard">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="overview">
              <Target className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="canvases">
              <LayoutGrid className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Canvases
            </TabsTrigger>
            <TabsTrigger value="assumptions">
              <Map className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Assumption Map
            </TabsTrigger>
            <TabsTrigger value="experiments">
              <Beaker className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Experiment Cards
            </TabsTrigger>
            <TabsTrigger value="evidence">
              <BookOpen className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Evidence & Learnings
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Link href="/ai-analysis">
              <Button data-testid="ai-analysis-button">
                <Brain className="h-4 w-4 mr-2" />
                AI Strategic Analysis
              </Button>
            </Link>
            <Link href="/projects/new">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <QuickStats projectId={projectId} currentStage={currentStage} />

          {/* Innovation Physics Signals - D-F-V visualization */}
          {projectId && (
            <InnovationPhysicsPanel
              projectId={projectId}
              variant="full"
              showEvidence={true}
            />
          )}

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
            <FitDashboard projectId={projectId} />
          )}

          {/* AI Validation Results Summary */}
          <ValidationResultsSummary projectId={projectId} />

          {/* Bottom Grid with VPC Summary */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Value Proposition Canvas Summary */}
            {projectId && (
              <VPCSummaryCard
                projectId={projectId}
                onClick={() => router.push(`/project/${projectId}/analysis`)}
              />
            )}
            <RecentActivity projectId={projectId} />
            <NextSteps projectId={projectId} />
          </div>
        </TabsContent>

        {/* CANVASES TAB - Value Proposition Canvas + Business Model Canvas */}
        <TabsContent value="canvases" className="space-y-6">
          <CanvasesGallery projectId={projectId} />
        </TabsContent>

        {/* ASSUMPTION MAP TAB - Strategyzer terminology */}
        <TabsContent value="assumptions" className="space-y-6">
          <AssumptionMap projectId={projectId} />
        </TabsContent>

        {/* EXPERIMENT CARDS TAB - Strict Strategyzer format */}
        <TabsContent value="experiments" className="space-y-6">
          <ExperimentCardsGrid projectId={projectId} />
        </TabsContent>

        {/* EVIDENCE & LEARNINGS TAB - Combined view */}
        <TabsContent value="evidence" className="space-y-6">
          {/* Evidence Ledger */}
          <EvidenceLedger />

          {/* Learning Cards Summary (placeholder for now) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Learning Cards
              </CardTitle>
              <CardDescription>
                Capture insights and decisions from your experiments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Learning cards will appear here after completing experiments.</p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('experiments')}
                >
                  <Beaker className="h-4 w-4 mr-2" />
                  View Experiment Cards
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dashboard AI Assistant - Floating Panel */}
      {user && (
        <DashboardAIAssistant
          userId={user.id}
          userRole="founder"
          projectId={projectId}
        />
      )}
    </DashboardLayout>
  )
}
