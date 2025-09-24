"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Search, 
  CheckSquare, 
  TrendingUp, 
  Zap,
  Target,
  CheckCircle
} from "lucide-react"

interface StageSelectorProps {
  currentStage?: 'discovery' | 'validation' | 'scaling' | 'optimization'
  onStageChange?: (stage: string) => void
  className?: string
}

const stageConfig = {
  discovery: {
    icon: Search,
    label: "Discovery",
    description: "Understanding your market and customers",
    color: "text-blue-600",
    bg: "bg-blue-50",
    progress: 25,
    focus: "Desirability",
    keyActivities: [
      "Customer interviews and surveys",
      "Problem validation research", 
      "Market size analysis",
      "Competitor landscape mapping"
    ],
    nextMilestone: "Validate core problem-solution fit",
    tools: ["Interview templates", "Survey builders", "Market research"]
  },
  validation: {
    icon: CheckSquare,
    label: "Validation",
    description: "Testing your solution and business model",
    color: "text-green-600", 
    bg: "bg-green-50",
    progress: 50,
    focus: "Feasibility",
    keyActivities: [
      "MVP development and testing",
      "Technical feasibility validation",
      "Business model experiments",
      "Early customer acquisition"
    ],
    nextMilestone: "Prove product-market fit",
    tools: ["A/B testing", "Analytics", "Prototype builders"]
  },
  scaling: {
    icon: TrendingUp,
    label: "Scaling", 
    description: "Growing your validated business model",
    color: "text-purple-600",
    bg: "bg-purple-50", 
    progress: 75,
    focus: "Viability",
    keyActivities: [
      "Revenue model optimization",
      "Unit economics validation",
      "Operational scaling",
      "Team building and processes"
    ],
    nextMilestone: "Achieve sustainable growth",
    tools: ["Financial models", "Operations tools", "Team management"]
  },
  optimization: {
    icon: Zap,
    label: "Optimization",
    description: "Maximizing efficiency and market position", 
    color: "text-orange-600",
    bg: "bg-orange-50",
    progress: 100,
    focus: "Excellence",
    keyActivities: [
      "Performance optimization",
      "Market expansion strategies", 
      "Competitive differentiation",
      "Innovation and R&D"
    ],
    nextMilestone: "Market leadership position",
    tools: ["Advanced analytics", "Automation", "Strategic planning"]
  }
}

function StageOverview({ stage }: { stage: keyof typeof stageConfig }) {
  const config = stageConfig[stage]
  const Icon = config.icon

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <Card className={`${config.bg} border-2`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-white shadow-sm">
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{config.label} Stage</CardTitle>
              <CardDescription className="text-base">{config.description}</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {config.focus} Focus
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Stage Progress</span>
              <span className="text-sm text-muted-foreground">{config.progress}%</span>
            </div>
            <Progress value={config.progress} className="h-2" />
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4" />
              <span className="font-medium">Next Milestone:</span>
              <span className="text-muted-foreground">{config.nextMilestone}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Activities</CardTitle>
            <CardDescription>Focus areas for this stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {config.keyActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">{activity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommended Tools</CardTitle>
            <CardDescription>Resources to accelerate progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {config.tools.map((tool, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{tool}</span>
                  <Button variant="ghost" size="sm">
                    Access
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function StageSelector({ 
  currentStage = 'discovery', 
  onStageChange,
  className = "" 
}: StageSelectorProps) {
  const [activeStage, setActiveStage] = React.useState(currentStage)

  const handleStageChange = (stage: string) => {
    setActiveStage(stage as keyof typeof stageConfig)
    onStageChange?.(stage)
  }

  return (
    <div className={className}>
      <Tabs value={activeStage} onValueChange={handleStageChange}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Validation Journey</h2>
            <p className="text-muted-foreground">
              Navigate through your startup's validation stages
            </p>
          </div>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="discovery" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discovery
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="scaling" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Scaling
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Optimization
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="discovery">
          <StageOverview stage="discovery" />
        </TabsContent>

        <TabsContent value="validation">
          <StageOverview stage="validation" />
        </TabsContent>

        <TabsContent value="scaling">
          <StageOverview stage="scaling" />
        </TabsContent>

        <TabsContent value="optimization">
          <StageOverview stage="optimization" />
        </TabsContent>
      </Tabs>
    </div>
  )
}