"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Heart,
  Cog,
  DollarSign,
  ChevronRight,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lock,
  Loader2,
  Zap
} from "lucide-react"
import { useFitData, type FitData } from "@/hooks/useFitData"
import { SignalBanner } from "./InnovationPhysicsSignals"
import type {
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal
} from "@/types/crewai"

// Extended FitData type for internal use (adds icon for rendering)
interface FitDataWithIcons extends Omit<FitData, 'qaInsights'> {
  qaInsights: Array<{
    id: string
    type: "satisfaction" | "validation" | "copy"
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
  }>
}

interface FitCardProps {
  title: string
  type: "desirability" | "feasibility" | "viability"
  data: FitDataWithIcons
  icon: React.ComponentType<{ className?: string }>
  color: {
    primary: string
    bg: string
    progress: string
  }
}

const fitTypes = {
  desirability: {
    title: "Desirability",
    icon: Heart,
    color: {
      primary: "text-pink-600",
      bg: "bg-pink-50",
      progress: "bg-pink-500"
    }
  },
  feasibility: {
    title: "Feasibility", 
    icon: Cog,
    color: {
      primary: "text-blue-600",
      bg: "bg-blue-50",
      progress: "bg-blue-500"
    }
  },
  viability: {
    title: "Viability",
    icon: DollarSign,
    color: {
      primary: "text-green-600", 
      bg: "bg-green-50",
      progress: "bg-green-500"
    }
  }
}

function FitCard({ title, type, data, icon: Icon, color }: FitCardProps) {
  const getProgressColor = () => {
    if (data.score >= 70) return "bg-green-500"
    if (data.score >= 40) return "bg-yellow-500" 
    return "bg-red-500"
  }

  const getBandColor = () => {
    if (data.band === "High Fit") return "text-green-600"
    if (data.band === "Medium Fit") return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceVariant = () => {
    if (data.confidence === "High confidence") return "default"
    if (data.confidence === "Medium confidence") return "secondary"
    return "outline"
  }

  if (data.isLocked) {
    return (
      <Card className="opacity-60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${color.bg}`}>
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-400">{title}</CardTitle>
                <CardDescription>Complete previous fit to unlock</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Locked</span>
              <Badge variant="outline" className="text-gray-400">
                Requires validation
              </Badge>
            </div>
            <Progress value={0} className="h-3" />
            <Button disabled className="w-full">
              <Lock className="h-4 w-4 mr-2" />
              Locked
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${color.bg}`}>
              <Icon className={`h-5 w-5 ${color.primary}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>Current validation status</CardDescription>
            </div>
          </div>
          <Badge variant={getConfidenceVariant()} className="text-xs">
            {data.confidence}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">{data.score}%</span>
            <span className={`text-sm font-medium ${getBandColor()}`}>
              {data.band}
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={data.score} 
              className="h-3" 
            />
            <div 
              className="absolute inset-0 h-3 rounded-full opacity-20 pointer-events-none"
              style={{ backgroundColor: getProgressColor() }}
            />
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                View Details
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="mx-auto w-full max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${color.primary}`} />
                    {title} Analysis
                  </DialogTitle>
                  <DialogDescription>
                    Detailed breakdown of assumptions, evidence, and insights
                  </DialogDescription>
                </DialogHeader>
                
                <div className="p-6 space-y-6">
                  {/* Assumption Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Key Assumptions
                    </h3>
                    <div className="grid gap-3">
                      {data.assumptions.map((assumption) => (
                        <Card key={assumption.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">
                                  {assumption.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={
                                      assumption.strength === "strong" ? "default" :
                                      assumption.strength === "medium" ? "secondary" : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {assumption.strength} evidence
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {assumption.evidenceCount} evidence items
                                  </span>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                View Evidence
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Evidence Count */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Evidence Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Supporting Evidence</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600 mt-1">
                            {data.evidenceCounts.supporting}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium">Contradictions</span>
                          </div>
                          <p className="text-2xl font-bold text-red-600 mt-1">
                            {data.evidenceCounts.contradicting}
                          </p>
                          {data.evidenceCounts.contradicting > 0 && (
                            <Badge variant="destructive" className="mt-1 text-xs">
                              Needs attention
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* QA Insights */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      AI Insights
                    </h3>
                    <div className="grid gap-3">
                      {data.qaInsights.map((insight) => {
                        const InsightIcon = insight.icon
                        return (
                          <Card key={insight.id}>
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                  <InsightIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{insight.title}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {insight.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <Button className="w-full">
                      <Target className="h-4 w-4 mr-2" />
                      Run Experiments for {title}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper to add icons to insights from hook data
function addIconsToFitData(data: FitData, defaultIcon: React.ComponentType<{ className?: string }>): FitDataWithIcons {
  return {
    ...data,
    qaInsights: data.qaInsights.map(insight => ({
      ...insight,
      icon: insight.type === 'satisfaction' ? Users :
            insight.type === 'validation' ? Target : TrendingUp
    }))
  }
}

// Default empty data when loading
const emptyFitData: FitDataWithIcons = {
  score: 0,
  band: "Low Fit",
  confidence: "Low confidence",
  assumptions: [],
  evidenceCounts: { supporting: 0, contradicting: 0 },
  qaInsights: []
}

interface FitDashboardProps {
  projectId?: string
  signals?: {
    desirability: DesirabilitySignal
    feasibility: FeasibilitySignal
    viability: ViabilitySignal
  }
}

export function FitDashboard({ projectId, signals }: FitDashboardProps) {
  const { data, isLoading, error } = useFitData(projectId)

  // Default signals if not provided
  const displaySignals = signals || {
    desirability: 'no_signal' as DesirabilitySignal,
    feasibility: 'unknown' as FeasibilitySignal,
    viability: 'unknown' as ViabilitySignal
  }

  if (!projectId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Overview</h1>
          <p className="text-muted-foreground">
            Select a project to view validation status
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Overview</h1>
          <p className="text-muted-foreground">
            Track your business idea validation across the three critical dimensions
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading fit data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Overview</h1>
          <p className="text-muted-foreground">
            Track your business idea validation across the three critical dimensions
          </p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading fit data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Use real data or empty defaults
  const fitData = {
    desirability: data ? addIconsToFitData(data.desirability, Heart) : emptyFitData,
    feasibility: data ? addIconsToFitData(data.feasibility, Cog) : emptyFitData,
    viability: data ? addIconsToFitData(data.viability, DollarSign) : emptyFitData,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Overview</h1>
        <p className="text-muted-foreground">
          Track your business idea validation across the three critical dimensions
        </p>
      </div>

      {/* Innovation Physics Signals Banner */}
      <SignalBanner
        desirability={displaySignals.desirability}
        feasibility={displaySignals.feasibility}
        viability={displaySignals.viability}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <FitCard
          title="Desirability"
          type="desirability"
          data={fitData.desirability}
          icon={Heart}
          color={fitTypes.desirability.color}
        />
        <FitCard
          title="Feasibility"
          type="feasibility"
          data={fitData.feasibility}
          icon={Cog}
          color={fitTypes.feasibility.color}
        />
        <FitCard
          title="Viability"
          type="viability"
          data={fitData.viability}
          icon={DollarSign}
          color={fitTypes.viability.color}
        />
      </div>
    </div>
  )
}
