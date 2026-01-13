import React, { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/hooks"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/ui/EmptyState"
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
  Search,
  Plus,
  MoreVertical,
  Eye,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  durationMinutes?: number
}

interface DbProject {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface DbValidationState {
  id: string
  project_id: string
  phase: string
  created_at: string
  updated_at: string
}

function formatRelativeTime(date: Date) {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`
  return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`
}

function mapPhaseToStatus(phase: string): AIWorkflow["status"] {
  if (phase === "validated") return "completed"
  if (phase === "killed") return "failed"
  return "running"
}

function mapPhaseToProgress(phase: string) {
  const progressMap: Record<string, number> = {
    ideation: 10,
    desirability: 35,
    feasibility: 65,
    viability: 85,
    validated: 100,
    killed: 100,
  }

  return progressMap[phase] ?? 0
}

function getWorkflowTypeLabel(type: AIWorkflow["type"]) {
  switch (type) {
    case "canvas_generation":
      return "Canvas Generation"
    case "business_analysis":
      return "Business Analysis"
    case "validation":
      return "Validation"
    case "optimization":
      return "Optimization"
    default:
      return "Workflow"
  }
}

export default function WorkflowsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [workflows, setWorkflows] = useState<AIWorkflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [averageDurationMinutes, setAverageDurationMinutes] = useState<number | null>(null)

  useEffect(() => {
    const fetchWorkflows = async () => {
      if (!user) {
        setWorkflows([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data: projects, error: projectsError } = await supabase
          .from("projects")
          .select("id, name, created_at, updated_at")
          .eq("user_id", user.id)

        if (projectsError) {
          throw projectsError
        }

        const { data: validationStates, error: statesError } = await supabase
          .from("crewai_validation_states")
          .select("id, project_id, phase, created_at, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })

        if (statesError) {
          throw statesError
        }

        const projectMap = new Map<string, DbProject>()
        ;(projects || []).forEach((project) => projectMap.set(project.id, project))

        const latestByProject = new Map<string, DbValidationState>()
        ;(validationStates || []).forEach((state) => {
          if (!latestByProject.has(state.project_id)) {
            latestByProject.set(state.project_id, state)
          }
        })

        const workflowItems: AIWorkflow[] = Array.from(latestByProject.values()).map((state) => {
          const project = projectMap.get(state.project_id)
          const status = mapPhaseToStatus(state.phase)
          const durationMinutes = Math.max(
            0,
            Math.round((new Date(state.updated_at).getTime() - new Date(state.created_at).getTime()) / 60000)
          )

          return {
            id: state.id,
            name: `${project?.name ?? "Project"} Validation`,
            description: `CrewAI ${getWorkflowTypeLabel("validation")} workflow`,
            client: project?.name ?? "Unknown project",
            type: "validation",
            status,
            progress: mapPhaseToProgress(state.phase),
            startedAt: formatRelativeTime(new Date(state.created_at)),
            steps: [],
            artifacts: [],
            durationMinutes,
          }
        })

        const durations = workflowItems
          .map((workflow) => workflow.durationMinutes)
          .filter((value): value is number => typeof value === "number")

        if (durations.length > 0) {
          const avg = Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
          setAverageDurationMinutes(avg)
        } else {
          setAverageDurationMinutes(null)
        }

        setWorkflows(workflowItems)
      } catch (fetchError) {
        console.error("[workflows] Failed to load workflows:", fetchError)
        setError("Unable to load workflows right now.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkflows()
  }, [user])

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.client.toLowerCase().includes(searchTerm.toLowerCase())

      if (activeTab === "all") return matchesSearch
      return matchesSearch && workflow.status === activeTab
    })
  }, [workflows, searchTerm, activeTab])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "paused":
        return <Pause className="h-4 w-4" />
      case "failed":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-blue-600"
      case "completed":
        return "text-green-600"
      case "failed":
        return "text-red-600"
      default:
        return "text-gray-400"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "canvas_generation":
        return <Palette className="h-4 w-4" />
      case "business_analysis":
        return <Brain className="h-4 w-4" />
      case "validation":
        return <Target className="h-4 w-4" />
      case "optimization":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Workflow className="h-4 w-4" />
    }
  }

  const runningCount = workflows.filter((workflow) => workflow.status === "running").length
  const completedCount = workflows.filter((workflow) => workflow.status === "completed").length

  return (
    <DashboardLayout breadcrumbs={[{ title: "AI Workflows", href: "/workflows" }]}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">AI Workflows</h2>
            <p className="text-muted-foreground">
              Multi-agent orchestration for strategic business model development
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
          </div>
        </div>

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

        {error && (
          <EmptyState
            title="Workflows unavailable"
            description={error}
            icon={<Workflow className="h-8 w-8" />}
          />
        )}

        {!error && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Workflows</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                    <Workflow className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{runningCount}</div>
                    <p className="text-xs text-muted-foreground">Currently processing</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Runs</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{completedCount}</div>
                    <p className="text-xs text-muted-foreground">Finished workflows</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projects Tracked</CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{workflows.length}</div>
                    <p className="text-xs text-muted-foreground">Validation runs recorded</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {averageDurationMinutes !== null ? `${averageDurationMinutes}m` : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground">Based on completed runs</p>
                  </CardContent>
                </Card>
              </div>

              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-sm">Loading workflow...</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={30} className="h-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredWorkflows.length === 0 ? (
                <EmptyState
                  title="No workflows found"
                  description={
                    searchTerm
                      ? "Try adjusting your search terms."
                      : "Create your first workflow to automate tasks."
                  }
                  icon={<Workflow className="h-8 w-8" />}
                />
              ) : (
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
                                <DropdownMenuItem disabled>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause Workflow
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Restart
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{workflow.progress}%</span>
                          </div>
                          <Progress value={workflow.progress} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Workflow Steps</h4>
                          {workflow.steps.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Steps will appear after CrewAI begins processing.
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {workflow.steps.map((step) => (
                                <div key={step.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        step.status === "completed"
                                          ? "bg-green-500"
                                          : step.status === "running"
                                          ? "bg-blue-500"
                                          : step.status === "failed"
                                          ? "bg-red-500"
                                          : "bg-gray-300"
                                      }`}
                                    />
                                    <span className={getStepStatusColor(step.status)}>{step.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {step.agent}
                                    </Badge>
                                  </div>
                                  {step.duration && (
                                    <span className="text-muted-foreground text-xs">{step.duration}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

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

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            Started {workflow.startedAt}
                          </div>
                          {workflow.durationMinutes !== undefined && workflow.durationMinutes > 0 && (
                            <span>{workflow.durationMinutes}m duration</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
