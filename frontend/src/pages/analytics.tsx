import React, { useState } from 'react'
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target,
  Brain,
  Clock,
  DollarSign,
  Activity,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Eye,
  Download
} from "lucide-react"
import { useDemoMode } from "@/hooks/useDemoMode"

interface AnalyticsMetric {
  id: string
  title: string
  value: string | number
  change: number
  changeType: "increase" | "decrease" | "neutral"
  period: string
  icon: React.ComponentType<any>
}

interface WorkflowAnalytics {
  totalWorkflows: number
  completedWorkflows: number
  avgDuration: string
  successRate: number
  agentUtilization: {
    agent: string
    utilization: number
    completedTasks: number
  }[]
}

interface ClientAnalytics {
  totalClients: number
  activeClients: number
  avgProjectValue: string
  clientSatisfaction: number
  retentionRate: number
}

export default function AnalyticsPage() {
  const demoMode = useDemoMode()
  const [activeTab, setActiveTab] = useState("overview")

  // Demo analytics data
  const keyMetrics: AnalyticsMetric[] = [
    {
      id: "revenue",
      title: "Total Revenue Impact",
      value: "$1.2M",
      change: 23.5,
      changeType: "increase",
      period: "vs last quarter",
      icon: DollarSign
    },
    {
      id: "clients",
      title: "Active Clients",
      value: 24,
      change: 12.3,
      changeType: "increase",
      period: "vs last month",
      icon: Users
    },
    {
      id: "workflows",
      title: "Workflows Completed",
      value: 156,
      change: 8.7,
      changeType: "increase",
      period: "this month",
      icon: CheckCircle
    },
    {
      id: "efficiency",
      title: "AI Efficiency Score",
      value: "94%",
      change: 5.2,
      changeType: "increase",
      period: "vs baseline",
      icon: Brain
    }
  ]

  const workflowAnalytics: WorkflowAnalytics = {
    totalWorkflows: 156,
    completedWorkflows: 142,
    avgDuration: "47 minutes",
    successRate: 91.0,
    agentUtilization: [
      { agent: "ValuePropositionAgent", utilization: 87, completedTasks: 45 },
      { agent: "BusinessModelAgent", utilization: 92, completedTasks: 52 },
      { agent: "CanvasGeneratorAgent", utilization: 78, completedTasks: 38 },
      { agent: "TestingBusinessIdeasAgent", utilization: 83, completedTasks: 41 }
    ]
  }

  const clientAnalytics: ClientAnalytics = {
    totalClients: 24,
    activeClients: 18,
    avgProjectValue: "$45K",
    clientSatisfaction: 4.7,
    retentionRate: 89
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "increase": return <TrendingUp className="h-4 w-4 text-green-600" />
      case "decrease": return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "increase": return "text-green-600"
      case "decrease": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Analytics", href: "/analytics" },
      ]}
    >
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground">
              Business intelligence and performance metrics for your strategic consulting platform
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {demoMode.isDemo && (
              <Badge variant="secondary">Demo Data</Badge>
            )}
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
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
                  <div className="flex items-center space-x-1 text-xs">
                    {getChangeIcon(metric.changeType)}
                    <span className={getChangeColor(metric.changeType)}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span className="text-muted-foreground">{metric.period}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflows">AI Workflows</TabsTrigger>
            <TabsTrigger value="clients">Client Performance</TabsTrigger>
            <TabsTrigger value="agents">Agent Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Business Impact */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Business Impact Overview</CardTitle>
                  <CardDescription>
                    Key performance indicators for your strategic consulting practice
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Revenue Growth</span>
                        <span className="text-sm text-green-600">+23.5%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Client Satisfaction</span>
                        <span className="text-sm text-green-600">4.7/5.0</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Project Success Rate</span>
                        <span className="text-sm text-green-600">91%</span>
                      </div>
                      <Progress value={91} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">AI Automation</span>
                        <span className="text-sm text-blue-600">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">This Month</span>
                    </div>
                    <span className="text-sm font-medium">Dec 2024</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Projects Delivered</span>
                    </div>
                    <span className="text-sm font-medium">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Avg Delivery Time</span>
                    </div>
                    <span className="text-sm font-medium">12 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">AI Tasks Completed</span>
                    </div>
                    <span className="text-sm font-medium">1,247</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Performance</CardTitle>
                  <CardDescription>AI workflow execution metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{workflowAnalytics.completedWorkflows}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{workflowAnalytics.totalWorkflows - workflowAnalytics.completedWorkflows}</div>
                      <div className="text-sm text-muted-foreground">In Progress</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-medium">{workflowAnalytics.successRate}%</span>
                    </div>
                    <Progress value={workflowAnalytics.successRate} className="h-2" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average Duration</span>
                    <span className="font-medium">{workflowAnalytics.avgDuration}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agent Utilization</CardTitle>
                  <CardDescription>AI agent performance and workload</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workflowAnalytics.agentUtilization.map((agent) => (
                    <div key={agent.agent} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{agent.agent.replace('Agent', '')}</span>
                        <span>{agent.utilization}%</span>
                      </div>
                      <Progress value={agent.utilization} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {agent.completedTasks} tasks completed
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Client Portfolio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{clientAnalytics.totalClients}</div>
                    <div className="text-sm text-muted-foreground">Total Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{clientAnalytics.activeClients}</div>
                    <div className="text-sm text-muted-foreground">Active Projects</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{clientAnalytics.avgProjectValue}</div>
                    <div className="text-sm text-muted-foreground">Avg Project Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{clientAnalytics.retentionRate}%</div>
                    <div className="text-sm text-muted-foreground">Client Retention</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{clientAnalytics.clientSatisfaction}/5.0</div>
                    <div className="text-sm text-muted-foreground">Average Rating</div>
                  </div>
                  <Progress value={(clientAnalytics.clientSatisfaction / 5) * 100} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">
                    Based on 47 client reviews
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Performance</CardTitle>
                  <CardDescription>Individual AI agent metrics and capabilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workflowAnalytics.agentUtilization.map((agent) => (
                    <div key={agent.agent} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Brain className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="font-medium">{agent.agent.replace('Agent', '')}</div>
                          <div className="text-sm text-muted-foreground">
                            {agent.completedTasks} tasks completed
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{agent.utilization}%</div>
                        <div className="text-sm text-muted-foreground">Utilization</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>AI system performance and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">System Status</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">API Response Time</span>
                    </div>
                    <span className="text-sm font-medium">247ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">AI Model Accuracy</span>
                    </div>
                    <span className="text-sm font-medium">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Uptime</span>
                    </div>
                    <span className="text-sm font-medium">99.8%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
