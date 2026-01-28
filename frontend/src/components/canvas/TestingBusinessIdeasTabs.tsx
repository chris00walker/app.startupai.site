/**
 * @story US-CP04
 */
"use client"

import * as React from "react"
import { Plus, X, CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TabsContent } from "@/components/ui/tabs"
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
import { Calendar } from "@/components/ui/calendar"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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
  decisionDate?: Date
  status: "draft" | "published"
}

interface Experiment {
  id: string
  title: string
  type: "interview" | "survey" | "prototype" | "landing-page" | "mvp"
  status: "planned" | "running" | "completed" | "cancelled"
  owner: string
  startDate?: Date
  endDate?: Date
}

interface TBITabsProps {
  testCards: TestCard[]
  learningCards: LearningCard[]
  experiments: Experiment[]
  onUpdateTestCard: (id: string, field: keyof TestCard, value: any) => void
  onUpdateLearningCard: (id: string, field: keyof LearningCard, value: any) => void
  onUpdateExperiment: (id: string, field: keyof Experiment, value: any) => void
  onAddTestCard: () => void
  onAddLearningCard: () => void
  onAddExperiment: () => void
  onRemoveTestCard: (id: string) => void
  onRemoveLearningCard: (id: string) => void
  onRemoveExperiment: (id: string) => void
  readOnly?: boolean
}

export function TestCardsTab({
  testCards,
  onUpdateTestCard,
  onAddTestCard,
  onRemoveTestCard,
  readOnly = false
}: Pick<TBITabsProps, 'testCards' | 'onUpdateTestCard' | 'onAddTestCard' | 'onRemoveTestCard' | 'readOnly'>) {
  return (
    <TabsContent value="tests" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Test Cards</h2>
          <p className="text-muted-foreground">Design experiments to validate your assumptions</p>
        </div>
        <Button onClick={onAddTestCard} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Test Card
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testCards.map((testCard) => (
          <Card key={testCard.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Test Card</CardTitle>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveTestCard(testCard.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`hypothesis-${testCard.id}`}>Hypothesis</Label>
                <Textarea
                  id={`hypothesis-${testCard.id}`}
                  value={testCard.hypothesis}
                  onChange={(e) => onUpdateTestCard(testCard.id, "hypothesis", e.target.value)}
                  placeholder="We believe that..."
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`test-method-${testCard.id}`}>Test Method</Label>
                <Textarea
                  id={`test-method-${testCard.id}`}
                  value={testCard.testMethod}
                  onChange={(e) => onUpdateTestCard(testCard.id, "testMethod", e.target.value)}
                  placeholder="How will you test this?"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`metric-${testCard.id}`}>Metric</Label>
                <Input
                  id={`metric-${testCard.id}`}
                  value={testCard.metric}
                  onChange={(e) => onUpdateTestCard(testCard.id, "metric", e.target.value)}
                  placeholder="What will you measure?"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`success-${testCard.id}`}>Success Criteria</Label>
                <Input
                  id={`success-${testCard.id}`}
                  value={testCard.successCriteria}
                  onChange={(e) => onUpdateTestCard(testCard.id, "successCriteria", e.target.value)}
                  placeholder="What indicates success?"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`expected-outcome-${testCard.id}`}>Expected Outcome</Label>
                <RadioGroup
                  value={testCard.expectedOutcome}
                  onValueChange={(value) => onUpdateTestCard(testCard.id, "expectedOutcome", value)}
                  disabled={readOnly}
                  aria-labelledby={`expected-outcome-${testCard.id}`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="pivot" id={`pivot-${testCard.id}`} />
                    <Label htmlFor={`pivot-${testCard.id}`}>Pivot</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="iterate" id={`iterate-${testCard.id}`} />
                    <Label htmlFor={`iterate-${testCard.id}`}>Iterate</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="kill" id={`kill-${testCard.id}`} />
                    <Label htmlFor={`kill-${testCard.id}`}>Kill</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`evidence-threshold-${testCard.id}`}>Evidence Threshold</Label>
                <Slider
                  value={[testCard.evidenceThreshold]}
                  onValueChange={(value) => onUpdateTestCard(testCard.id, "evidenceThreshold", value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                  disabled={readOnly}
                  aria-labelledby={`evidence-threshold-${testCard.id}`}
                />
                <div className="text-sm text-center">{testCard.evidenceThreshold}%</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  )
}

export function LearningCardsTab({
  learningCards,
  testCards,
  onUpdateLearningCard,
  onAddLearningCard,
  onRemoveLearningCard,
  readOnly = false
}: Pick<TBITabsProps, 'learningCards' | 'onUpdateLearningCard' | 'onAddLearningCard' | 'onRemoveLearningCard' | 'readOnly'> & { testCards: TestCard[] }) {
  return (
    <TabsContent value="learning" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Learning Cards</h2>
          <p className="text-muted-foreground">Capture insights and make decisions based on test results</p>
        </div>
        <Button onClick={onAddLearningCard} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Learning Card
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {learningCards.map((learningCard) => (
          <Card key={learningCard.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Learning Card</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={learningCard.status === "published" ? "default" : "outline"}>
                    {learningCard.status}
                  </Badge>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveLearningCard(learningCard.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`test-id-${learningCard.id}`}>Related Test</Label>
                <Select
                  value={learningCard.testId}
                  onValueChange={(value) => onUpdateLearningCard(learningCard.id, "testId", value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id={`test-id-${learningCard.id}`}>
                    <SelectValue placeholder="Select a test card" />
                  </SelectTrigger>
                  <SelectContent>
                    {testCards.map((testCard) => (
                      <SelectItem key={testCard.id} value={testCard.id}>
                        {testCard.hypothesis.substring(0, 50)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`observations-${learningCard.id}`}>Observations</Label>
                <Textarea
                  id={`observations-${learningCard.id}`}
                  value={learningCard.observations}
                  onChange={(e) => onUpdateLearningCard(learningCard.id, "observations", e.target.value)}
                  placeholder="What did you observe?"
                  className="min-h-[100px]"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`insights-${learningCard.id}`}>Insights</Label>
                <Textarea
                  id={`insights-${learningCard.id}`}
                  value={learningCard.insights}
                  onChange={(e) => onUpdateLearningCard(learningCard.id, "insights", e.target.value)}
                  placeholder="What insights did you gain?"
                  className="min-h-[100px]"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label id={`decision-label-${learningCard.id}`}>Decision</Label>
                <RadioGroup
                  value={learningCard.decision}
                  onValueChange={(value) => onUpdateLearningCard(learningCard.id, "decision", value)}
                  disabled={readOnly}
                  aria-labelledby={`decision-label-${learningCard.id}`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="pivot" id={`l-pivot-${learningCard.id}`} />
                    <Label htmlFor={`l-pivot-${learningCard.id}`}>Pivot</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="iterate" id={`l-iterate-${learningCard.id}`} />
                    <Label htmlFor={`l-iterate-${learningCard.id}`}>Iterate</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="kill" id={`l-kill-${learningCard.id}`} />
                    <Label htmlFor={`l-kill-${learningCard.id}`}>Kill</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`owner-${learningCard.id}`}>Owner</Label>
                <Input
                  id={`owner-${learningCard.id}`}
                  value={learningCard.owner}
                  onChange={(e) => onUpdateLearningCard(learningCard.id, "owner", e.target.value)}
                  placeholder="Who owns this decision?"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`decision-date-${learningCard.id}`}>Decision Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={`decision-date-${learningCard.id}`}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !learningCard.decisionDate && "text-muted-foreground"
                      )}
                      disabled={readOnly}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {learningCard.decisionDate ? (
                        format(learningCard.decisionDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={learningCard.decisionDate}
                      onSelect={(date) => onUpdateLearningCard(learningCard.id, "decisionDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  )
}

export function ExperimentsTab({
  experiments,
  onUpdateExperiment,
  onAddExperiment,
  onRemoveExperiment,
  readOnly = false
}: Pick<TBITabsProps, 'experiments' | 'onUpdateExperiment' | 'onAddExperiment' | 'onRemoveExperiment' | 'readOnly'>) {
  return (
    <TabsContent value="experiments" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Experiment Library</CardTitle>
              <p className="text-muted-foreground">
                Manage your portfolio of experiments and track their progress
              </p>
            </div>
            <Button onClick={onAddExperiment} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Experiment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map((experiment) => (
                <TableRow key={experiment.id}>
                  <TableCell>
                    <Input
                      id={`exp-title-${experiment.id}`}
                      value={experiment.title}
                      onChange={(e) => onUpdateExperiment(experiment.id, "title", e.target.value)}
                      placeholder="Experiment title..."
                      disabled={readOnly}
                      aria-label="Experiment title"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={experiment.type}
                      onValueChange={(value) => onUpdateExperiment(experiment.id, "type", value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger id={`exp-type-${experiment.id}`} className="w-[120px]" aria-label="Experiment type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="survey">Survey</SelectItem>
                        <SelectItem value="prototype">Prototype</SelectItem>
                        <SelectItem value="landing-page">Landing Page</SelectItem>
                        <SelectItem value="mvp">MVP</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={experiment.status}
                      onValueChange={(value) => onUpdateExperiment(experiment.id, "status", value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger id={`exp-status-${experiment.id}`} className="w-[120px]" aria-label="Experiment status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      id={`exp-owner-${experiment.id}`}
                      value={experiment.owner}
                      onChange={(e) => onUpdateExperiment(experiment.id, "owner", e.target.value)}
                      placeholder="Owner..."
                      disabled={readOnly}
                      aria-label="Experiment owner"
                    />
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id={`exp-start-${experiment.id}`}
                          variant="outline"
                          className={cn(
                            "w-[120px] justify-start text-left font-normal",
                            !experiment.startDate && "text-muted-foreground"
                          )}
                          disabled={readOnly}
                          aria-label="Experiment start date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {experiment.startDate ? (
                            format(experiment.startDate, "MMM dd")
                          ) : (
                            <span>Start</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={experiment.startDate}
                          onSelect={(date) => onUpdateExperiment(experiment.id, "startDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id={`exp-end-${experiment.id}`}
                          variant="outline"
                          className={cn(
                            "w-[120px] justify-start text-left font-normal",
                            !experiment.endDate && "text-muted-foreground"
                          )}
                          disabled={readOnly}
                          aria-label="Experiment end date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {experiment.endDate ? (
                            format(experiment.endDate, "MMM dd")
                          ) : (
                            <span>End</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={experiment.endDate}
                          onSelect={(date) => onUpdateExperiment(experiment.id, "endDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveExperiment(experiment.id)}
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
  )
}
