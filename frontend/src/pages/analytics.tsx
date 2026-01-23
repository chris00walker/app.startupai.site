/**
 * Analytics Dashboard Page
 *
 * @story US-CP06
 */

import React, { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  Activity,
  Brain,
  CheckCircle,
  Download,
  FileText,
  Target,
  Users,
  Workflow,
} from "lucide-react"

interface AnalyticsDashboardPayload {
  metrics: {
    projects: number
    validations: number
    hypotheses: number
    evidence: number
    clients: number
  }
  workflows: {
    total: number
    completed: number
  }
  updatedAt: string
}

interface AnalyticsDashboardResponse {
  success: boolean
  data: AnalyticsDashboardPayload
}

interface AnalyticsMetric {
  id: string
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  helper: string
}

function formatUpdatedAt(value?: string) {
  if (!value) return "Unavailable"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unavailable"
  return date.toLocaleString()
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const { data, isLoading, error } = useQuery<AnalyticsDashboardResponse>({
    queryKey: ["analytics-dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/dashboard")
      if (!response.ok) {
        throw new Error("Failed to load analytics")
      }
      return response.json()
    },
  })

  const dashboard = data?.data
  const metrics = dashboard?.metrics ?? {
    projects: 0,
    validations: 0,
    hypotheses: 0,
    evidence: 0,
    clients: 0,
  }

  const workflows = dashboard?.workflows ?? { total: 0, completed: 0 }
  const hasAnyData = useMemo(() => {
    return (
      metrics.projects +
        metrics.validations +
        metrics.hypotheses +
        metrics.evidence +
        metrics.clients >
      0
    )
  }, [metrics])

  const keyMetrics: AnalyticsMetric[] = [
    {
      id: "projects",
      title: "Projects",
      value: metrics.projects,
      icon: Target,
      helper: "Active projects tracked",
    },
    {
      id: "validations",
      title: "Validation Runs",
      value: metrics.validations,
      icon: Workflow,
      helper: "CrewAI runs completed",
    },
    {
      id: "evidence",
      title: "Evidence Items",
      value: metrics.evidence,
      icon: FileText,
      helper: "Evidence captured",
    },
    {
      id: "hypotheses",
      title: "Hypotheses",
      value: metrics.hypotheses,
      icon: Brain,
      helper: "Assumptions tracked",
    },
  ]

  return (
    <DashboardLayout breadcrumbs={[{ title: "Analytics", href: "/analytics" }]}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground">
              Business intelligence and performance metrics for your projects
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" disabled={!hasAnyData}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {error && (
          <EmptyState
            title="Analytics unavailable"
            description="We couldn't load analytics right now. Please try again in a moment."
            icon={<Activity className="h-8 w-8" />}
          />
        )}

        {!error && (
          <>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-7 w-16" />
                      <Skeleton className="mt-2 h-3 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !hasAnyData ? (
              <EmptyState
                title="No analytics yet"
                description="Complete your first project to see analytics."
                icon={<Activity className="h-8 w-8" />}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {keyMetrics.map((metric) => {
                  const IconComponent = metric.icon
                  return (
                    <Card key={metric.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <p className="text-xs text-muted-foreground">{metric.helper}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="workflows">AI Workflows</TabsTrigger>
                <TabsTrigger value="clients">Client Performance</TabsTrigger>
                <TabsTrigger value="agents">Agent Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {!hasAnyData ? (
                  <EmptyState
                    title="Complete onboarding to unlock analytics"
                    description="Once you finish onboarding and launch a validation run, analytics will populate here."
                    icon={<Activity className="h-8 w-8" />}
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="col-span-2">
                      <CardHeader>
                        <CardTitle>Portfolio Overview</CardTitle>
                        <CardDescription>Key counts across your workspace</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm text-muted-foreground">Projects</span>
                          <span className="text-lg font-semibold">{metrics.projects}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm text-muted-foreground">Validation Runs</span>
                          <span className="text-lg font-semibold">{metrics.validations}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm text-muted-foreground">Evidence Items</span>
                          <span className="text-lg font-semibold">{metrics.evidence}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm text-muted-foreground">Hypotheses</span>
                          <span className="text-lg font-semibold">{metrics.hypotheses}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Active Clients</span>
                          <span className="font-medium">{metrics.clients}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completed Runs</span>
                          <span className="font-medium">{workflows.completed}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Updated</span>
                          <span className="font-medium">{formatUpdatedAt(dashboard?.updatedAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="workflows" className="space-y-4">
                {workflows.total === 0 ? (
                  <EmptyState
                    title="No workflows yet"
                    description="Kick off your first validation run to see workflow analytics."
                    icon={<Workflow className="h-8 w-8" />}
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Workflow Completion</CardTitle>
                        <CardDescription>Completed vs. total runs</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {workflows.completed}
                            </div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {workflows.total - workflows.completed}
                            </div>
                            <div className="text-sm text-muted-foreground">In Progress</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Success Rate</span>
                            <span className="font-medium">
                              {workflows.total === 0
                                ? "0%"
                                : `${Math.round((workflows.completed / workflows.total) * 100)}%`}
                            </span>
                          </div>
                          <Progress
                            value={
                              workflows.total === 0
                                ? 0
                                : Math.round((workflows.completed / workflows.total) * 100)
                            }
                            className="h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Workflow Health</CardTitle>
                        <CardDescription>Signal coverage and pacing</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Validation Runs</span>
                          <span className="font-medium">{workflows.total}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Evidence Items</span>
                          <span className="font-medium">{metrics.evidence}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Hypotheses</span>
                          <span className="font-medium">{metrics.hypotheses}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="clients" className="space-y-4">
                {metrics.clients === 0 ? (
                  <EmptyState
                    title="No client data yet"
                    description="Add your first client to track performance metrics."
                    icon={<Users className="h-8 w-8" />}
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle>Total Clients</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{metrics.clients}</div>
                        <p className="text-sm text-muted-foreground">Managed accounts</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Active Projects</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="text-3xl font-bold text-green-600">{metrics.projects}</div>
                        <p className="text-sm text-muted-foreground">Projects in flight</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Validation Runs</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="text-3xl font-bold text-yellow-600">
                          {metrics.validations}
                        </div>
                        <p className="text-sm text-muted-foreground">Runs completed</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="agents" className="space-y-4">
                <EmptyState
                  title="Agent analytics are not available yet"
                  description="Agent performance metrics appear once workflows capture per-agent telemetry."
                  icon={<CheckCircle className="h-8 w-8" />}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
