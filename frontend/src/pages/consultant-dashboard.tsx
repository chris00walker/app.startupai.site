"use client"

/**
 * Consultant Dashboard Page
 *
 * Main dashboard for consultants showing portfolio overview,
 * client cards, and validation metrics.
 *
 * @story US-C03, US-C04
 */

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
import { useConsultantClients } from "@/hooks/useConsultantClients"
import { useAuth, useRoleInfo } from "@/lib/auth/hooks"
import { usePortfolioActivity } from "@/hooks/usePortfolioActivity"
import { InviteClientModal } from "@/components/consultant/InviteClientModal"
import { TrialStatusCard } from "@/components/upgrade/TrialStatusCard"
// Connection requests (TASK-025)
import { ConnectionRequestCard } from "@/components/dashboard/ConnectionRequestCard"
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
  Brain,
  Mail,
  Clock,
  RefreshCw,
  X,
  Copy,
  UserPlus
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

// Pending Invites Section Component
function PendingInvitesSection({
  invites,
  isLoading,
  onResend,
  onRevoke,
  onCopyUrl,
  actionLoading,
}: {
  invites: Array<{
    id: string;
    email: string;
    name: string | null;
    inviteToken: string;
    expiresAt: string;
    invitedAt: string;
    isExpired: boolean;
  }>;
  isLoading: boolean;
  onResend: (id: string) => Promise<{ success: boolean; error?: string }>;
  onRevoke: (id: string) => Promise<{ success: boolean; error?: string }>;
  onCopyUrl: (token: string) => Promise<boolean>;
  actionLoading: boolean;
}) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = async (token: string, id: string) => {
    const success = await onCopyUrl(token);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pending Invites
          {invites.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {invites.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Invitations waiting for clients to sign up</CardDescription>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            No pending invites
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => {
              const daysLeft = getDaysUntilExpiry(invite.expiresAt);
              const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

              return (
                <div
                  key={invite.id}
                  className={`p-3 rounded-lg border ${
                    invite.isExpired
                      ? 'bg-red-50 border-red-200'
                      : isExpiringSoon
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {invite.name || invite.email}
                      </div>
                      {invite.name && (
                        <div className="text-xs text-muted-foreground truncate">
                          {invite.email}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {invite.isExpired ? (
                          <span className="text-red-600">Expired</span>
                        ) : (
                          <span className={isExpiringSoon ? 'text-amber-600' : ''}>
                            Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span>•</span>
                        <span>Sent {formatDate(invite.invitedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(invite.inviteToken, invite.id)}
                        disabled={actionLoading}
                        title="Copy invite link"
                      >
                        {copiedId === invite.id ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onResend(invite.id)}
                        disabled={actionLoading}
                        title="Resend invite"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onRevoke(invite.id)}
                        disabled={actionLoading}
                        title="Revoke invite"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { user } = useAuth()
  const roleInfo = useRoleInfo()
  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = React.useState(false)
  // TASK-025: Pending connection requests count
  const [pendingConnectionCount, setPendingConnectionCount] = React.useState(0)

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

  // TASK-025: Fetch pending connection requests
  React.useEffect(() => {
    async function fetchPendingConnections() {
      try {
        const response = await fetch('/api/consultant/connections?status=requested')
        if (response.ok) {
          const data = await response.json()
          // Count requests initiated by founders (incoming requests)
          const incomingRequests = (data.connections || []).filter(
            (c: { initiatedBy: string }) => c.initiatedBy === 'founder'
          )
          setPendingConnectionCount(incomingRequests.length)
        }
      } catch {
        // Silently fail - this is a non-critical feature
      }
    }
    if (user && userRole === 'consultant') {
      fetchPendingConnections()
    }
  }, [user, userRole])

  // Use appropriate hook based on user role
  const isConsultant = userRole === 'consultant'
  const projectsData = useProjects()
  const clientsData = useClients()

  // Consultant clients hook for invite management
  const {
    invites,
    isLoading: invitesLoading,
    actionLoading: inviteActionLoading,
    createInvite,
    resendInvite,
    revokeInvite,
    copyInviteUrl,
  } = useConsultantClients()

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
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Client
              </Button>
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
            <div className="space-y-6">
              {/* TASK-025: Connection request notification */}
              <ConnectionRequestCard count={pendingConnectionCount} role="consultant" />

              {/* Trial Status Card - shown for trial users */}
              <TrialStatusCard />

              {/* Pending Invites Section */}
              {isConsultant && (
                <PendingInvitesSection
                  invites={invites}
                  isLoading={invitesLoading}
                  onResend={resendInvite}
                  onRevoke={revokeInvite}
                  onCopyUrl={copyInviteUrl}
                  actionLoading={inviteActionLoading}
                />
              )}
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
                      Start building your portfolio by inviting your first client.
                    </p>
                    <Button onClick={() => setShowInviteModal(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Your First Client
                    </Button>
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

          {/* Invite Client Modal */}
          <InviteClientModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            onInvite={createInvite}
            isTrial={roleInfo.isTrial}
          />
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
