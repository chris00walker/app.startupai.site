"use client"

import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid"
import { PortfolioMetrics as PortfolioMetricsComponent } from "@/components/portfolio/PortfolioMetrics"
import { StageProgressIndicator } from "@/components/portfolio/StageProgressIndicator"
import { RiskBudgetWidget } from "@/components/portfolio/RiskBudgetWidget"
import { GateStageFilter, type GateStage, type GateStatus } from "@/components/portfolio/GateStageFilter"
import { GateAlerts } from "@/components/portfolio/GateAlerts"
import { useProjects } from "@/hooks/useProjects"
import { useClients } from "@/hooks/useClients"
import { useAuth } from "@/lib/auth/hooks"
import { usePortfolioActivity } from "@/hooks/usePortfolioActivity"
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
  Filter,
  Loader2,
  Brain
} from "lucide-react"
import { trackEvent, trackPageView } from "@/lib/analytics"
import { PortfolioProject, PortfolioMetrics } from "@/types/portfolio"

function PortfolioOverview({ projects }: { projects: PortfolioProject[] }) {
  const highRiskProjects = projects.filter(p => p.riskBudget.delta > 0.2)
  const projectIds = React.useMemo(() => projects.map(p => p.id), [projects])
  const { activities, isLoading: activitiesLoading } = usePortfolioActivity({
    projectIds,
    limit: 10,
  })

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
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No recent activity across your portfolio
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const [userRole, setUserRole] = React.useState<string | null>(null)

  // Fetch user role
  React.useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        console.log('[Dashboard] No user found');
        return;
      }
      console.log('[Dashboard] Fetching role for user:', user.id, user.email);
      const supabase = createClient()
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      console.log('[Dashboard] User role fetched:', data?.role || 'null');
      setUserRole(data?.role || null)
    }
    fetchUserRole()
  }, [user])

  // Use appropriate hook based on user role
  const isConsultant = userRole === 'consultant'
  const projectsData = useProjects()
  const clientsData = useClients()

  const { projects, isLoading, error } = isConsultant ? clientsData : projectsData

  console.log('[Dashboard] isConsultant:', isConsultant, '| projects count:', projects.length, '| isLoading:', isLoading);

  // Track dashboard viewed on initial load
  React.useEffect(() => {
    trackPageView('Consultant Dashboard', {
      client_count: projects.length,
      has_clients: projects.length > 0,
    })
    trackEvent('dashboard_viewed', {
      role: 'consultant',
      client_count: projects.length,
      category: 'navigation',
    })
  }, [projects.length])

  // Gate filtering state
  const [selectedStages, setSelectedStages] = React.useState<GateStage[]>([])
  const [selectedStatuses, setSelectedStatuses] = React.useState<GateStatus[]>([])

  // Use real projects only (no fallback)
  const allProjects = projects

  // Calculate real metrics from projects
  const displayMetrics: PortfolioMetrics = React.useMemo(() => {
    const activeProjectsByStage = {
      DESIRABILITY: allProjects.filter(p => p.stage === 'DESIRABILITY').length,
      FEASIBILITY: allProjects.filter(p => p.stage === 'FEASIBILITY').length,
      VIABILITY: allProjects.filter(p => p.stage === 'VIABILITY').length,
      SCALE: allProjects.filter(p => p.stage === 'SCALE').length,
    };

    // Calculate real metrics from actual project data
    const passedGates = allProjects.filter(p => p.gateStatus === 'Passed').length
    const totalAttempts = allProjects.filter(p => ['Passed', 'Failed'].includes(p.gateStatus)).length

    return {
      activeProjectsByStage,
      gatePassRate: totalAttempts > 0 ? passedGates / totalAttempts : 0,
      averageCycleTime: 0, // Not tracked yet
      evidenceCoverage: allProjects.length > 0
        ? allProjects.reduce((sum, p) => sum + (p.evidenceQuality || 0), 0) / allProjects.length
        : 0,
      overrideRate: 0 // Not tracked yet
    };
  }, [allProjects]);
  
  // Apply gate filters
  const displayProjects = React.useMemo(() => {
    let filtered = allProjects
    
    if (selectedStages.length > 0) {
      filtered = filtered.filter(project => selectedStages.includes(project.stage))
    }
    
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(project => selectedStatuses.includes(project.gateStatus))
    }
    
    return filtered
  }, [allProjects, selectedStages, selectedStatuses])
  
  // Calculate project counts by stage for filter badges
  const projectCounts = React.useMemo(() => {
    const counts: Record<GateStage, number> = {
      DESIRABILITY: 0,
      FEASIBILITY: 0,
      VIABILITY: 0,
      SCALE: 0
    }
    
    allProjects.forEach(project => {
      counts[project.stage]++
    })
    
    return counts
  }, [allProjects])
  
  const handleProjectClick = (project: PortfolioProject) => {
    // Navigate to appropriate page based on user role
    if (isConsultant) {
      window.location.href = `/client/${project.id}`
    } else {
      window.location.href = `/project/${project.id}/gate`
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { title: "Consultant Dashboard", href: "/consultant-dashboard" },
        ]}
      >
        <div data-testid="dashboard-loading" className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your projects...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Consultant Dashboard", href: "/consultant-dashboard" },
      ]}
    >
      <div data-testid="dashboard" className="space-y-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
              <p className="text-muted-foreground">
                Evidence-led validation across all client projects
              </p>
            </div>
            <div className="flex gap-2">
              <GateStageFilter
                selectedStages={selectedStages}
                selectedStatuses={selectedStatuses}
                onStageChange={setSelectedStages}
                onStatusChange={setSelectedStatuses}
                projectCounts={projectCounts}
              />
              <Button variant="outline">
                <Brain className="h-4 w-4 mr-2" />
                Portfolio AI Analysis
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Gate Policies
              </Button>
              <Link href="/consultant/client/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </Link>
            </div>
          </div>

          {/* Portfolio Metrics */}
          <div data-tour="portfolio-metrics">
            <PortfolioMetricsComponent metrics={displayMetrics} />
          </div>

          {/* Portfolio Overview & Gate Alerts */}
          <div data-tour="portfolio-overview" className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PortfolioOverview projects={allProjects} />
            </div>
            <div>
              <GateAlerts 
                projects={allProjects} 
                onProjectClick={handleProjectClick}
              />
            </div>
          </div>

          {/* Portfolio Projects Grid */}
          <div data-tour="portfolio-projects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {isConsultant ? 'Active Clients' : 'Active Projects'}
                  <Badge variant="outline" className="ml-2">
                    {displayProjects.length} {isConsultant ? 'Clients' : 'Projects'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {isConsultant ? 'Client portfolio with evidence-based validation' : 'Multi-client validation pipeline with evidence-based gates'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    Error loading projects: {error.message}
                  </div>
                )}
                {displayProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your portfolio by adding your first client project.
                    </p>
                    <Link href="/consultant/client/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Client
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <PortfolioGrid
                    projects={displayProjects}
                    onProjectClick={handleProjectClick}
                  />
                )}
              </CardContent>
            </Card>
          </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
