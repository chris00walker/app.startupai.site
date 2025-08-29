"use client"

import * as React from "react"
import { Plus, X, Save, Download, Upload, Target, TestTube, BookOpen, Library } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TestCardsTab, LearningCardsTab, ExperimentsTab } from "./TestingBusinessIdeasTabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"

interface Assumption {
  id: string
  assumption: string
  risk: "high" | "medium" | "low"
  evidence: string
  confidence: number
  priority: "high" | "medium" | "low"
  status: "untested" | "testing" | "validated" | "invalidated"
}

interface TestCard {
  id: string
  hypothesis: string
  testMethod: string
  metric: string
  successCriteria: string
  expectedOutcome: "pivot" | "iterate" | "kill"
  evidenceThreshold: number
}

interface LearningCard {
  id: string
  testId: string
  observations: string
  insights: string
  decision: "pivot" | "iterate" | "kill"
  owner: string
  status: "draft" | "published"
}

interface Experiment {
  id: string
  title: string
  type: "interview" | "survey" | "prototype" | "landing-page" | "mvp"
  status: "planned" | "running" | "completed" | "cancelled"
  owner: string
}

interface TBIData {
  assumptions: Assumption[]
  testCards: TestCard[]
  learningCards: LearningCard[]
  experiments: Experiment[]
}

const defaultTBI: TBIData = {
  assumptions: [],
  testCards: [],
  learningCards: [],
  experiments: []
}

interface TestingBusinessIdeasCanvasProps {
  canvasId?: string
  clientId?: string
  initialData?: TBIData
  onSave?: (data: TBIData) => void
  readOnly?: boolean
}

export default function TestingBusinessIdeasCanvas({
  canvasId,
  clientId,
  initialData,
  onSave,
  readOnly = false
}: TestingBusinessIdeasCanvasProps) {
  const [canvasData, setCanvasData] = React.useState<TBIData>(initialData || defaultTBI)
  const [activeTab, setActiveTab] = React.useState("assumptions")

  const handleSave = () => {
    if (onSave) {
      onSave(canvasData)
    }
    localStorage.setItem(`tbi-canvas-${canvasId || 'default'}`, JSON.stringify(canvasData))
  }

  const addAssumption = () => {
    const newAssumption: Assumption = {
      id: Date.now().toString(),
      assumption: "",
      risk: "medium",
      evidence: "",
      confidence: 50,
      priority: "medium",
      status: "untested"
    }
    setCanvasData(prev => ({
      ...prev,
      assumptions: [...prev.assumptions, newAssumption]
    }))
  }

  const updateAssumption = (id: string, field: keyof Assumption, value: any) => {
    setCanvasData(prev => ({
      ...prev,
      assumptions: prev.assumptions.map(assumption =>
        assumption.id === id ? { ...assumption, [field]: value } : assumption
      )
    }))
  }

  const removeAssumption = (id: string) => {
    setCanvasData(prev => ({
      ...prev,
      assumptions: prev.assumptions.filter(assumption => assumption.id !== id)
    }))
  }

  const addTestCard = () => {
    const newTestCard: TestCard = {
      id: Date.now().toString(),
      hypothesis: "",
      testMethod: "",
      metric: "",
      successCriteria: "",
      expectedOutcome: "iterate",
      evidenceThreshold: 70
    }
    setCanvasData(prev => ({
      ...prev,
      testCards: [...prev.testCards, newTestCard]
    }))
  }

  const updateTestCard = (id: string, field: keyof TestCard, value: any) => {
    setCanvasData(prev => ({
      ...prev,
      testCards: prev.testCards.map(testCard =>
        testCard.id === id ? { ...testCard, [field]: value } : testCard
      )
    }))
  }

  const removeTestCard = (id: string) => {
    setCanvasData(prev => ({
      ...prev,
      testCards: prev.testCards.filter(testCard => testCard.id !== id)
    }))
  }

  const addLearningCard = () => {
    const newLearningCard: LearningCard = {
      id: Date.now().toString(),
      testId: "",
      observations: "",
      insights: "",
      decision: "iterate",
      owner: "",
      status: "draft"
    }
    setCanvasData(prev => ({
      ...prev,
      learningCards: [...prev.learningCards, newLearningCard]
    }))
  }

  const updateLearningCard = (id: string, field: keyof LearningCard, value: any) => {
    setCanvasData(prev => ({
      ...prev,
      learningCards: prev.learningCards.map(learningCard =>
        learningCard.id === id ? { ...learningCard, [field]: value } : learningCard
      )
    }))
  }

  const removeLearningCard = (id: string) => {
    setCanvasData(prev => ({
      ...prev,
      learningCards: prev.learningCards.filter(learningCard => learningCard.id !== id)
    }))
  }

  const addExperiment = () => {
    const newExperiment: Experiment = {
      id: Date.now().toString(),
      title: "",
      type: "interview",
      status: "planned",
      owner: ""
    }
    setCanvasData(prev => ({
      ...prev,
      experiments: [...prev.experiments, newExperiment]
    }))
  }

  const updateExperiment = (id: string, field: keyof Experiment, value: any) => {
    setCanvasData(prev => ({
      ...prev,
      experiments: prev.experiments.map(experiment =>
        experiment.id === id ? { ...experiment, [field]: value } : experiment
      )
    }))
  }

  const removeExperiment = (id: string) => {
    setCanvasData(prev => ({
      ...prev,
      experiments: prev.experiments.filter(experiment => experiment.id !== id)
    }))
  }

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case "high": return "destructive"
      case "medium": return "secondary"
      case "low": return "outline"
      default: return "secondary"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "validated": return "default"
      case "invalidated": return "destructive"
      case "testing": return "secondary"
      case "untested": return "outline"
      default: return "outline"
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Testing Business Ideas</h1>
          <p className="text-muted-foreground">Validate your business assumptions systematically</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSave} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assumptions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Assumptions
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test Cards
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Learning Cards
          </TabsTrigger>
          <TabsTrigger value="experiments" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Experiments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assumptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assumption Map</CardTitle>
                  <CardDescription>
                    Map your riskiest assumptions and track validation progress
                  </CardDescription>
                </div>
                <Button onClick={addAssumption} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assumption
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assumption</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {canvasData.assumptions.map((assumption) => (
                    <TableRow key={assumption.id}>
                      <TableCell>
                        <Textarea
                          value={assumption.assumption}
                          onChange={(e) => updateAssumption(assumption.id, "assumption", e.target.value)}
                          placeholder="Describe your assumption..."
                          className="min-h-[60px]"
                          disabled={readOnly}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={assumption.risk}
                          onValueChange={(value) => updateAssumption(assumption.id, "risk", value)}
                          disabled={readOnly}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={assumption.evidence}
                          onChange={(e) => updateAssumption(assumption.id, "evidence", e.target.value)}
                          placeholder="Evidence..."
                          disabled={readOnly}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Slider
                            value={[assumption.confidence]}
                            onValueChange={(value) => updateAssumption(assumption.id, "confidence", value[0])}
                            max={100}
                            step={1}
                            className="w-[100px]"
                            disabled={readOnly}
                          />
                          <div className="text-sm text-center">{assumption.confidence}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeVariant(assumption.priority)}>
                          {assumption.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(assumption.status)}>
                          {assumption.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAssumption(assumption.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TestCardsTab
          testCards={canvasData.testCards}
          onUpdateTestCard={updateTestCard}
          onAddTestCard={addTestCard}
          onRemoveTestCard={removeTestCard}
          readOnly={readOnly}
        />

        <LearningCardsTab
          testCards={canvasData.testCards}
          learningCards={canvasData.learningCards}
          onUpdateLearningCard={updateLearningCard}
          onAddLearningCard={addLearningCard}
          onRemoveLearningCard={removeLearningCard}
          readOnly={readOnly}
        />

        <ExperimentsTab
          experiments={canvasData.experiments}
          onUpdateExperiment={updateExperiment}
          onAddExperiment={addExperiment}
          onRemoveExperiment={removeExperiment}
          readOnly={readOnly}
        />
      </Tabs>
    </div>
  )
}
