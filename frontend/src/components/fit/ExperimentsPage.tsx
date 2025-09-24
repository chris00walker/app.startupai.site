"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
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
  status: "not_started" | "in_progress" | "completed"
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

const mockExperiments: Experiment[] = [
  {
    id: "1",
    name: "Customer Interview Round 2",
    description: "Deep dive interviews with 10 small business owners to validate pricing assumptions and feature priorities.",
    fitType: "Desirability",
    expectedStrength: "Strong",
    status: "not_started",
    progress: 0,
    hypothesis: "Small business owners will pay $40-50/month for inventory management if it saves them 4+ hours weekly and prevents stockouts.",
    steps: [
      "Recruit 10 small business owners (retail, food service, services)",
      "Prepare interview script focusing on current pain points and pricing sensitivity",
      "Conduct 45-minute interviews via video call",
      "Analyze responses for patterns and contradictions",
      "Update fit scores based on findings"
    ],
    estimatedTime: "2 weeks",
    potentialImpact: "If successful, Desirability may increase by 8-12 points"
  },
  {
    id: "2",
    name: "MVP Prototype Development",
    description: "Build a working prototype with core inventory tracking features to validate technical feasibility.",
    fitType: "Feasibility",
    expectedStrength: "Strong",
    status: "in_progress",
    progress: 35,
    hypothesis: "Our team can build a functional MVP with real-time inventory syncing within 8 months using React Native and Node.js.",
    steps: [
      "Set up development environment and architecture",
      "Build core inventory CRUD operations",
      "Implement real-time syncing between devices",
      "Create basic mobile interface",
      "Test with sample data and multiple users",
      "Document technical challenges and solutions"
    ],
    estimatedTime: "8 weeks",
    potentialImpact: "If successful, Feasibility may increase by 15-20 points"
  },
  {
    id: "3",
    name: "Pricing Strategy Survey",
    description: "Large-scale survey to understand price sensitivity across different business segments and feature sets.",
    fitType: "Desirability",
    expectedStrength: "Medium",
    status: "completed",
    progress: 100,
    hypothesis: "Price sensitivity varies by business size, with micro-businesses preferring $30-40/month and small businesses accepting $50-60/month.",
    steps: [
      "Design survey with price sensitivity questions",
      "Segment by business size and industry",
      "Deploy via social media and business forums",
      "Collect 200+ responses",
      "Analyze price elasticity by segment"
    ],
    estimatedTime: "3 weeks",
    potentialImpact: "Completed - contributed 5 points to Desirability",
    results: {
      quantitative: "Survey of 247 small business owners. Price acceptance: $30-40 (68%), $40-50 (45%), $50+ (23%). Willingness to pay premium for mobile-first design: 61%.",
      qualitative: "Strong preference for simple, mobile-first solutions. Many mentioned frustration with complex enterprise tools. Price sensitivity higher in food service (avg $35) vs retail (avg $45).",
      submittedAt: "2024-08-20"
    }
  },
  {
    id: "4",
    name: "Competitive Feature Analysis",
    description: "Detailed analysis of top 5 competitors to identify feature gaps and differentiation opportunities.",
    fitType: "Desirability",
    expectedStrength: "Medium",
    status: "not_started",
    progress: 0,
    hypothesis: "Current solutions lack mobile-first design and intuitive UX, creating opportunity for differentiation.",
    steps: [
      "Identify top 5 direct competitors",
      "Sign up for free trials and document user experience",
      "Create feature comparison matrix",
      "Analyze user reviews for pain points",
      "Identify 3-5 key differentiation opportunities"
    ],
    estimatedTime: "1 week",
    potentialImpact: "If successful, Desirability may increase by 3-5 points"
  },
  {
    id: "5",
    name: "Technical Architecture Review",
    description: "Comprehensive review with senior developers to validate technical approach and timeline estimates.",
    fitType: "Feasibility",
    expectedStrength: "Strong",
    status: "completed",
    progress: 100,
    hypothesis: "Technical team can deliver MVP in 6 months with current architecture plan.",
    steps: [
      "Review proposed technical architecture",
      "Assess team capabilities and capacity",
      "Identify potential technical risks",
      "Estimate development timeline for each component",
      "Create risk mitigation strategies"
    ],
    estimatedTime: "1 week",
    potentialImpact: "Completed - reduced Feasibility by 10 points due to timeline concerns",
    results: {
      quantitative: "Revised timeline: 8-10 months for MVP (vs original 6 months). Key bottlenecks: real-time syncing (2 months), mobile development (3 months), POS integrations (2 months).",
      qualitative: "Team has strong backend capabilities but limited mobile experience. Recommend hiring mobile developer or partnering with development agency. Architecture is sound but more complex than initially estimated.",
      submittedAt: "2024-08-18"
    }
  }
]

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
  }
}

function ExperimentCard({ experiment, isSelected, onClick }: { 
  experiment: Experiment
  isSelected: boolean
  onClick: () => void 
}) {
  const status = statusConfig[experiment.status]
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

export function ExperimentsPage() {
  const [selectedExperiment, setSelectedExperiment] = React.useState<Experiment>(mockExperiments[0])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
          <p className="text-muted-foreground">
            Run validation experiments and track results to improve your fit scores
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Experiment
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Experiments List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Available Experiments</h2>
          {mockExperiments.map((experiment) => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              isSelected={selectedExperiment.id === experiment.id}
              onClick={() => setSelectedExperiment(experiment)}
            />
          ))}
        </div>

        {/* Experiment Details */}
        <div className="lg:col-span-2">
          <ExperimentDetails experiment={selectedExperiment} />
        </div>
      </div>
    </div>
  )
}
