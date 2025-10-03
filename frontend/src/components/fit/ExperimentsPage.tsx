"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { useProjects } from "@/hooks/useProjects"
import { 
  Play,
  Pause,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  ChevronRight,
  Plus
} from "lucide-react"

interface Experiment {
  id: string
  name: string
  description: string
  fitType: "Desirability" | "Feasibility" | "Viability"
  expectedStrength: "Strong" | "Medium" | "Weak"
  status: "not_started" | "in_progress" | "completed" | "cancelled"
  progress: number
  hypothesis: string
  steps: string[]
  estimatedTime: string
  potentialImpact: string
  results?: {
    quantitative?: string
    qualitative?: string
    submittedAt?: string
  }
}

type DbExperiment = {
  id: string
  project_id: string
  hypothesis_id: string | null
  name: string
  description: string | null
  fit_type: Experiment['fitType']
  evidence_strength: 'weak' | 'medium' | 'strong' | null
  status: 'planned' | 'running' | 'completed' | 'cancelled'
  progress: number | null
  estimated_time: string | null
  potential_impact: string | null
  steps: string[] | null
  results_quantitative: string | null
  results_qualitative: string | null
  results_submitted_at: string | null
  hypotheses?: {
    statement: string | null
  } | null
}

const fitTypeColors = {
  Desirability: "bg-pink-100 text-pink-800",
  Feasibility: "bg-blue-100 text-blue-800", 
  Viability: "bg-green-100 text-green-800"
}

const statusConfig = {
  not_started: { 
    icon: Clock, 
    label: "Not Started",
    color: "text-gray-500",
    variant: "outline" as const
  },
  in_progress: { 
    icon: Play, 
    label: "In Progress",
    color: "text-blue-500",
    variant: "default" as const
  },
  completed: { 
    icon: CheckCircle, 
    label: "Completed",
    color: "text-green-500",
    variant: "secondary" as const
  },
  cancelled: {
    icon: AlertCircle,
    label: "Cancelled",
    color: "text-red-500",
    variant: "outline" as const
  }
}

function ExperimentCard({ experiment, isSelected, onClick }: { 
  experiment: Experiment
  isSelected: boolean
  onClick: () => void 
}) {
  const status = statusConfig[experiment.status] ?? statusConfig.not_started
  const StatusIcon = status.icon

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base mb-1">{experiment.name}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {experiment.description}
            </CardDescription>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={fitTypeColors[experiment.fitType]}>
              {experiment.fitType}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {experiment.expectedStrength} Evidence
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${status.color}`} />
              <span className="text-sm font-medium">{status.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">{experiment.estimatedTime}</span>
          </div>

          {experiment.status === "in_progress" && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{experiment.progress}%</span>
              </div>
              <Progress value={experiment.progress} className="h-2" />
            </div>
          )}

          <div className="flex gap-2">
            {experiment.status === "not_started" && (
              <Button size="sm" className="flex-1">
                <Play className="h-3 w-3 mr-1" />
                Start
              </Button>
            )}
            {experiment.status === "in_progress" && (
              <Button size="sm" className="flex-1">
                <Pause className="h-3 w-3 mr-1" />
                Continue
              </Button>
            )}
            {experiment.status === "completed" && (
              <Button variant="outline" size="sm" className="flex-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                View Results
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ExperimentDetails({ experiment }: { experiment: Experiment }) {
  const [quantitativeResults, setQuantitativeResults] = React.useState(experiment.results?.quantitative || "")
  const [qualitativeResults, setQualitativeResults] = React.useState(experiment.results?.qualitative || "")

  const handleSubmitResults = () => {
    // In a real app, this would call an API to update fit scores
    console.log("Submitting results:", { quantitativeResults, qualitativeResults })
    // Show success message and redirect
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{experiment.name}</h2>
        <p className="text-muted-foreground">{experiment.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Fit Type</span>
            </div>
            <Badge className={fitTypeColors[experiment.fitType]}>
              {experiment.fitType}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Expected Evidence</span>
            </div>
            <Badge variant="outline">{experiment.expectedStrength}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Timeline</span>
            </div>
            <span className="text-sm">{experiment.estimatedTime}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hypothesis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{experiment.hypothesis}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Experiment Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {experiment.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Expected Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">{experiment.potentialImpact}</p>
          </div>
        </CardContent>
      </Card>

      {experiment.status === "completed" && experiment.results ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Experiment Results
            </CardTitle>
            <CardDescription>Submitted on {experiment.results.submittedAt}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Quantitative Results</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {experiment.results.quantitative}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Qualitative Insights</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {experiment.results.qualitative}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : experiment.status === "in_progress" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Record Results</CardTitle>
            <CardDescription>
              Submit your experiment results to update fit scores automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantitative Results</label>
              <Textarea
                placeholder="Enter measurable results, metrics, and data points..."
                value={quantitativeResults}
                onChange={(e) => setQuantitativeResults(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Qualitative Insights</label>
              <Textarea
                placeholder="Enter observations, user feedback, and qualitative findings..."
                value={qualitativeResults}
                onChange={(e) => setQualitativeResults(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSubmitResults}
              disabled={!quantitativeResults.trim() && !qualitativeResults.trim()}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Results & Update Fit Scores
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Play className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-2">Ready to Start</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Begin this experiment to gather evidence for your {experiment.fitType.toLowerCase()} validation.
              </p>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Start Experiment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function mapStatus(status: DbExperiment['status']): Experiment['status'] {
  switch (status) {
    case 'planned':
      return 'not_started'
    case 'running':
      return 'in_progress'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'not_started'
  }
}

function mapStrength(value: DbExperiment['evidence_strength']): Experiment['expectedStrength'] {
  switch (value) {
    case 'strong':
      return 'Strong'
    case 'weak':
      return 'Weak'
    case 'medium':
    default:
      return 'Medium'
  }
}

function transformExperiment(record: DbExperiment): Experiment {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? '',
    fitType: record.fit_type,
    expectedStrength: mapStrength(record.evidence_strength),
    status: mapStatus(record.status),
    progress: record.progress ?? 0,
    hypothesis: record.hypotheses?.statement ?? 'Unlinked hypothesis',
    steps: record.steps ?? [],
    estimatedTime: record.estimated_time ?? 'Not specified',
    potentialImpact: record.potential_impact ?? 'Impact not documented yet.',
    results: record.status === 'completed'
      ? {
          quantitative: record.results_quantitative ?? undefined,
          qualitative: record.results_qualitative ?? undefined,
          submittedAt: record.results_submitted_at ?? undefined,
        }
      : undefined,
  }
}

export function ExperimentsPage() {
  const supabase = React.useMemo(() => createClient(), [])
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects()
  const activeProjectId = React.useMemo(() => projects[0]?.id ?? null, [projects])

  const [experiments, setExperiments] = React.useState<Experiment[]>([])
  const [selectedExperiment, setSelectedExperiment] = React.useState<Experiment | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchExperiments = React.useCallback(async () => {
    if (!activeProjectId) {
      setExperiments([])
      setSelectedExperiment(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const { data, error: queryError } = await supabase
        .from('experiments')
        .select('*, hypotheses: hypothesis_id (statement)')
        .eq('project_id', activeProjectId)
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      const transformed = ((data as DbExperiment[]) ?? []).map(transformExperiment)
      setExperiments(transformed)
      setSelectedExperiment(transformed[0] ?? null)
      setError(null)
    } catch (err) {
      console.error('Error fetching experiments:', err)
      setError((err as Error).message)
      setExperiments([])
      setSelectedExperiment(null)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId, supabase])

  React.useEffect(() => {
    if (projectsLoading) return
    fetchExperiments()
  }, [projectsLoading, fetchExperiments])

  if (projectsLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Loading your projects…
      </div>
    )
  }

  if (!activeProjectId) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Create a project to start planning experiments.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
          <p className="text-muted-foreground">
            Run validation experiments and track results to improve your fit scores
          </p>
        </div>
        <Button disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Experiment
        </Button>
      </div>

      {(projectsError || error) && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {projectsError?.message || error}
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading experiments…
          </CardContent>
        </Card>
      ) : experiments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <Play className="h-10 w-10 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No experiments yet</h3>
              <p className="text-muted-foreground">
                Start planning experiments to validate your hypotheses and improve fit scores.
              </p>
            </div>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add Experiment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Experiments List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Available Experiments</h2>
            {experiments.map((experiment) => (
              <ExperimentCard
                key={experiment.id}
                experiment={experiment}
                isSelected={selectedExperiment?.id === experiment.id}
                onClick={() => setSelectedExperiment(experiment)}
              />
            ))}
          </div>

          {/* Experiment Details */}
          <div className="lg:col-span-2">
            {selectedExperiment ? (
              <ExperimentDetails experiment={selectedExperiment} />
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Select an experiment to view the plan and record results.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
