import React, { useState } from 'react'
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Workflow, 
  Play, 
  Pause, 
  RotateCcw,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  Palette,
  Target,
  TrendingUp,
  Users,
  Search,
  Plus,
  MoreVertical,
  Eye
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDemoMode } from "@/hooks/useDemoMode"
import { getDemoActiveWorkflows } from "@/data/demoData"

interface WorkflowStep {
  id: string
  name: string
  agent: string
  status: "pending" | "running" | "completed" | "failed"
  duration?: string
  output?: string
}

interface AIWorkflow {
  id: string
  name: string
  description: string
  client: string
  type: "canvas_generation" | "business_analysis" | "validation" | "optimization"
  status: "running" | "completed" | "paused" | "failed"
  progress: number
  startedAt: string
  estimatedCompletion?: string
  steps: WorkflowStep[]
  artifacts: string[]
}

export default function WorkflowsPage() {
  const demoMode = useDemoMode()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  
  // Get demo data using lazy loading function
  const demoActiveWorkflows = getDemoActiveWorkflows()

  // Demo workflows data
  const demoWorkflows: AIWorkflow[] = [
    {
      id: "wf-001",
      name: "Complete Business Model Analysis",
      description: "Full multi-agent analysis including VPC, BMC, and TBI generation for TechStart Inc.",
      client: "TechStart Inc.",
      type: "canvas_generation",
      status: "running",
      progress: 65,
      startedAt: "2 hours ago",
      estimatedCompletion: "45 minutes",
      steps: [
        { id: "step-1", name: "Customer Discovery", agent: "ValuePropositionAgent", status: "completed", duration: "12 min" },
        { id: "step-2", name: "Value Proposition Design", agent: "ValuePropositionAgent", status: "completed", duration: "18 min" },
        { id: "step-3", name: "Business Model Generation", agent: "BusinessModelAgent", status: "running", duration: "25 min" },
        { id: "step-4", name: "Canvas Visualization", agent: "CanvasGeneratorAgent", status: "pending" },
        { id: "step-5", name: "Testing Strategy", agent: "TestingBusinessIdeasAgent", status: "pending" }
      ],
      artifacts: ["Value Proposition Canvas", "Customer Profile Analysis"]
    },
    {
      id: "wf-002",
      name: "Market Validation Workflow",
      description: "Comprehensive market validation and testing strategy for EcoSmart Solutions",
      client: "EcoSmart Solutions",
      type: "validation",
      status: "completed",
      progress: 100,
      startedAt: "1 day ago",
      steps: [
        { id: "step-1", name: "Market Research", agent: "BusinessModelAgent", status: "completed", duration: "30 min" },
        { id: "step-2", name: "Hypothesis Generation", agent: "TestingBusinessIdeasAgent", status: "completed", duration: "22 min" },
        { id: "step-3", name: "Test Design", agent: "TestingBusinessIdeasAgent", status: "completed", duration: "15 min" },
        { id: "step-4", name: "Validation Report", agent: "CanvasGeneratorAgent", status: "completed", duration: "8 min" }
      ],
      artifacts: ["Market Analysis Report", "Testing Business Ideas Canvas", "Validation Metrics"]
    },
    {
      id: "wf-003",
      name: "Strategic Optimization Review",
      description: "AI-powered business model optimization and scaling recommendations",
      client: "HealthTrack Analytics",
      type: "optimization",
      status: "paused",
      progress: 40,
      startedAt: "3 hours ago",
      steps: [
        { id: "step-1", name: "Current State Analysis", agent: "BusinessModelAgent", status: "completed", duration: "20 min" },
        { id: "step-2", name: "Performance Assessment", agent: "ValuePropositionAgent", status: "running", duration: "35 min" },
        { id: "step-3", name: "Optimization Recommendations", agent: "BusinessModelAgent", status: "pending" },
        { id: "step-4", name: "Implementation Roadmap", agent: "CanvasGeneratorAgent", status: "pending" }
      ],
      artifacts: ["Current BMC Analysis"]
    }
  ]

  const workflows = demoMode.isDemo ? demoWorkflows : []

  // Filter workflows based on search and tab
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.client.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeTab === "all") return matchesSearch
    return matchesSearch && workflow.status === activeTab
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-blue-100 text-blue-800"
      case "completed": return "bg-green-100 text-green-800"
      case "paused": return "bg-yellow-100 text-yellow-800"
      case "failed": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <Play className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "paused": return <Pause className="h-4 w-4" />
      case "failed": return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "running": return "text-blue-600"
      case "completed": return "text-green-600"
      case "failed": return "text-red-600"
      default: return "text-gray-400"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "canvas_generation": return <Palette className="h-4 w-4" />
      case "business_analysis": return <Brain className="h-4 w-4" />
      case "validation": return <Target className="h-4 w-4" />
      case "optimization": return <TrendingUp className="h-4 w-4" />
      default: return <Workflow className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "AI Workflows", href: "/workflows" },
      ]}
    >
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">AI Workflows</h2>
            <p className="text-muted-foreground">
              Multi-agent orchestration for strategic business model development
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Tabs for filtering by status */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Workflows</TabsTrigger>
            <TabsTrigger value="running">Running</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Workflow Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                  <Workflow className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {workflows.filter(w => w.status === "running").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently processing
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {workflows.filter(w => w.status === "completed").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successful completions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground">
                    Specialized agents
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">47m</div>
                  <p className="text-xs text-muted-foreground">
                    Per workflow
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Workflow Cards */}
            <div className="space-y-4">
              {filteredWorkflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(workflow.type)}
                        <div>
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {workflow.client} • {workflow.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(workflow.status)} variant="secondary">
                          <span className="flex items-center gap-1">
                            {getStatusIcon(workflow.status)}
                            {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                          </span>
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause Workflow
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restart
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{workflow.progress}%</span>
                      </div>
                      <Progress value={workflow.progress} className="h-2" />
                    </div>

                    {/* Workflow Steps */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Workflow Steps</h4>
                      <div className="space-y-1">
                        {workflow.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                step.status === "completed" ? "bg-green-500" :
                                step.status === "running" ? "bg-blue-500" :
                                step.status === "failed" ? "bg-red-500" : "bg-gray-300"
                              }`} />
                              <span className={getStepStatusColor(step.status)}>
                                {step.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {step.agent}
                              </Badge>
                            </div>
                            {step.duration && (
                              <span className="text-muted-foreground text-xs">
                                {step.duration}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Artifacts */}
                    {workflow.artifacts.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Generated Artifacts</h4>
                        <div className="flex flex-wrap gap-1">
                          {workflow.artifacts.map((artifact, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {artifact}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timing Info */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        Started {workflow.startedAt}
                      </div>
                      {workflow.estimatedCompletion && (
                        <span>ETA: {workflow.estimatedCompletion}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredWorkflows.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Workflow className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? "Try adjusting your search terms" 
                      : "Create your first AI workflow to get started"}
                  </p>
                  {!searchTerm && (
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Workflow
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
