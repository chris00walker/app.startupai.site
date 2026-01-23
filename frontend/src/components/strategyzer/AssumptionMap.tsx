"use client"

/**
 * Assumption Map UI for capturing and prioritizing hypotheses.
 * @story US-F12
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Target,
  Users,
  Cog,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Beaker,
  TrendingUp,
  Heart,
  FileText,
  FlaskConical
} from 'lucide-react'
import { FounderBadge } from '@/components/founders'
import { EvidenceStrengthIndicator } from './EvidenceStrengthIndicator'
import { createClient } from '@/lib/supabase/client'
import { useProjects } from '@/hooks/useProjects'
import {
  type Assumption,
  type DbHypothesisRecord,
  type AssumptionCategory,
  type AssumptionMapQuadrants,
  categoryConfig,
  priorityConfig,
  evidenceStrengthConfig,
  statusConfig,
  quadrantConfig,
  transformDbToAssumption,
  categorizeAssumptions,
  getPriorityLabel,
  getPriorityColor
} from './types'

interface AssumptionMapProps {
  projectId?: string
}

const categoryIcons = {
  desirability: Heart,
  feasibility: Cog,
  viability: DollarSign
} as const

const statusIcons = {
  untested: Clock,
  testing: Target,
  validated: CheckCircle,
  invalidated: XCircle
} as const

export function AssumptionMap({ projectId: propProjectId }: AssumptionMapProps) {
  const supabase = useMemo(() => createClient(), [])
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects()
  const activeProjectId = useMemo(() => propProjectId || projects[0]?.id || null, [propProjectId, projects])

  const [assumptions, setAssumptions] = useState<Assumption[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAssumption, setNewAssumption] = useState({
    statement: '',
    category: 'desirability' as AssumptionCategory,
    priority: 5, // 1-10 scale (1-3 critical, 4-7 important, 8-10 nice-to-have)
    source: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssumptions = useCallback(async () => {
    if (!activeProjectId) {
      setAssumptions([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const { data, error: queryError } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('project_id', activeProjectId)
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      const transformed = ((data as DbHypothesisRecord[]) ?? []).map(transformDbToAssumption)
      setAssumptions(transformed)
      setError(null)
    } catch (err) {
      console.error('Error fetching assumptions:', err)
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId, supabase])

  useEffect(() => {
    if (projectsLoading) return
    fetchAssumptions()
  }, [projectsLoading, fetchAssumptions])

  const filteredAssumptions = useMemo(() => {
    if (selectedCategory === 'all') return assumptions
    return assumptions.filter(a => a.category === selectedCategory)
  }, [selectedCategory, assumptions])

  const quadrants = useMemo(() => categorizeAssumptions(assumptions), [assumptions])

  const handleCreateAssumption = useCallback(async () => {
    if (!activeProjectId) return

    // Convert priority (1-10) to importance (high/medium/low) for database
    const priorityToImportance = (priority: number): string => {
      if (priority <= 3) return 'high'
      if (priority <= 7) return 'medium'
      return 'low'
    }

    try {
      setIsSubmitting(true)
      const { error: insertError } = await supabase
        .from('hypotheses')
        .insert({
          project_id: activeProjectId,
          statement: newAssumption.statement,
          type: newAssumption.category,
          importance: priorityToImportance(newAssumption.priority),
          evidence_strength: 'none',
          status: 'untested',
          source: newAssumption.source || null
        })

      if (insertError) throw insertError

      setNewAssumption({ statement: '', category: 'desirability', priority: 5, source: '' })
      setIsCreateDialogOpen(false)
      setError(null)
      await fetchAssumptions()
    } catch (err) {
      console.error('Error creating assumption:', err)
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }, [activeProjectId, fetchAssumptions, newAssumption, supabase])

  // Analytics calculations
  const analytics = useMemo(() => {
    const total = assumptions.length
    const testFirst = quadrants.testFirst.length
    const validated = assumptions.filter(a => a.status === 'validated').length
    const validationRate = total > 0 ? Math.round((validated / total) * 100) : 0

    return { total, testFirst, validated, validationRate }
  }, [assumptions, quadrants])

  if (projectsLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Loading your projects...
      </div>
    )
  }

  if (!activeProjectId) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Create a project to start capturing assumptions.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Assumption Map</h2>
            <FounderBadge founderId="sage" variant="badge" size="sm" />
          </div>
          <p className="text-muted-foreground">
            Identify, prioritize, and validate your riskiest business assumptions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Assumption
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assumption</DialogTitle>
              <DialogDescription>
                Add a testable, precise business assumption to your map
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="statement">Assumption Statement</Label>
                <Textarea
                  id="statement"
                  placeholder="We believe that..."
                  value={newAssumption.statement}
                  onChange={(e) => setNewAssumption({...newAssumption, statement: e.target.value})}
                  className="min-h-20"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newAssumption.category}
                    onValueChange={(value: AssumptionCategory) => setNewAssumption({...newAssumption, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desirability">Desirability</SelectItem>
                      <SelectItem value="feasibility">Feasibility</SelectItem>
                      <SelectItem value="viability">Viability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority (1-10)</Label>
                  <Select
                    value={String(newAssumption.priority)}
                    onValueChange={(value) => setNewAssumption({...newAssumption, priority: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Critical (test first)</SelectItem>
                      <SelectItem value="2">2 - Critical</SelectItem>
                      <SelectItem value="3">3 - Critical</SelectItem>
                      <SelectItem value="4">4 - Important</SelectItem>
                      <SelectItem value="5">5 - Important</SelectItem>
                      <SelectItem value="6">6 - Important</SelectItem>
                      <SelectItem value="7">7 - Important</SelectItem>
                      <SelectItem value="8">8 - Nice to have</SelectItem>
                      <SelectItem value="9">9 - Nice to have</SelectItem>
                      <SelectItem value="10">10 - Nice to have</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Source (BMC/VPC)</Label>
                  <Select
                    value={newAssumption.source}
                    onValueChange={(value) => setNewAssumption({...newAssumption, source: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Value Propositions">Value Propositions</SelectItem>
                      <SelectItem value="Customer Segments">Customer Segments</SelectItem>
                      <SelectItem value="Channels">Channels</SelectItem>
                      <SelectItem value="Customer Relationships">Customer Relationships</SelectItem>
                      <SelectItem value="Revenue Streams">Revenue Streams</SelectItem>
                      <SelectItem value="Key Resources">Key Resources</SelectItem>
                      <SelectItem value="Key Activities">Key Activities</SelectItem>
                      <SelectItem value="Key Partners">Key Partners</SelectItem>
                      <SelectItem value="Cost Structure">Cost Structure</SelectItem>
                      <SelectItem value="Customer Jobs">Customer Jobs</SelectItem>
                      <SelectItem value="Customer Pains">Customer Pains</SelectItem>
                      <SelectItem value="Customer Gains">Customer Gains</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssumption} disabled={!newAssumption.statement.trim() || isSubmitting}>
                Add Assumption
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {(projectsError || error) && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {projectsError?.message || error}
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="matrix" className="space-y-6">
        <TabsList>
          <TabsTrigger value="matrix">Prioritization Matrix</TabsTrigger>
          <TabsTrigger value="list">Assumption List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* MATRIX VIEW - Default */}
        <TabsContent value="matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assumption Prioritization Matrix</CardTitle>
              <CardDescription>
                Focus on the <span className="text-red-600 font-medium">Test First</span> quadrant:
                critical assumptions with little evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Matrix Labels - Top */}
              <div className="flex justify-center mb-2">
                <div className="flex items-center gap-8 text-sm">
                  <span className="text-muted-foreground">Little Evidence</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Strong Evidence</span>
                </div>
              </div>

              {/* 2x2 Matrix Grid */}
              <div className="grid grid-cols-2 gap-4 h-[500px]">
                {/* Top Left - Test First (High criticality, low evidence) */}
                <QuadrantCard
                  quadrant="test-first"
                  assumptions={quadrants.testFirst}
                  title="Test First"
                />

                {/* Top Right - Validated (High criticality, high evidence) */}
                <QuadrantCard
                  quadrant="validated"
                  assumptions={quadrants.validated}
                  title="Validated"
                />

                {/* Bottom Left - Park (Low criticality, low evidence) */}
                <QuadrantCard
                  quadrant="park"
                  assumptions={quadrants.park}
                  title="Park"
                />

                {/* Bottom Right - Deprioritize (Low criticality, high evidence) */}
                <QuadrantCard
                  quadrant="deprioritize"
                  assumptions={quadrants.deprioritize}
                  title="Deprioritize"
                />
              </div>

              {/* Matrix Labels - Side */}
              <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>High Criticality (top row)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Low Criticality (bottom row)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LIST VIEW */}
        <TabsContent value="list" className="space-y-6">
          {/* Category Filter */}
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All ({assumptions.length})
            </Button>
            {Object.entries(categoryConfig).map(([category, config]) => {
              const count = assumptions.filter(a => a.category === category).length
              const Icon = categoryIcons[category as AssumptionCategory]
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {config.label} ({count})
                </Button>
              )
            })}
          </div>

          {/* Assumption Cards */}
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Loading assumptions...
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAssumptions.map((assumption) => (
                <AssumptionCard key={assumption.id} assumption={assumption} />
              ))}
              {!filteredAssumptions.length && (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No assumptions found. Add your first assumption to get started.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ANALYTICS VIEW */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Assumptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total}</div>
                <p className="text-xs text-muted-foreground">
                  Across all business areas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Test First</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analytics.testFirst}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need immediate testing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Validated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.validated}
                </div>
                <p className="text-xs text-muted-foreground">
                  Assumptions validated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Validation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.validationRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Of all assumptions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Assumptions by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(categoryConfig).map(([category, config]) => {
                  const categoryAssumptions = assumptions.filter(a => a.category === category)
                  const count = categoryAssumptions.length
                  // Test First: priority 1-3 (critical) with no/weak evidence
                  const testFirst = categoryAssumptions.filter(a =>
                    a.priority <= 3 &&
                    (a.evidence_strength === 'none' || a.evidence_strength === 'weak' || !a.evidence_strength)
                  ).length
                  const Icon = categoryIcons[category as AssumptionCategory]

                  return (
                    <Card key={category}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">{config.label}</p>
                            <p className="text-xs text-muted-foreground">{config.description}</p>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total: {count}</span>
                          <span className="text-red-600">Test First: {testFirst}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// =============================================================================
// Sub-Components
// =============================================================================

function QuadrantCard({
  quadrant,
  assumptions,
  title
}: {
  quadrant: keyof typeof quadrantConfig
  assumptions: Assumption[]
  title: string
}) {
  const config = quadrantConfig[quadrant]

  return (
    <div className={`border-2 ${config.color} p-4 rounded-lg flex flex-col`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${config.textColor}`}>{title}</h3>
        <Badge className={config.badgeColor}>
          {assumptions.length}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{config.description}</p>
      <p className="text-xs font-medium mb-3">{config.action}</p>

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {assumptions.map(assumption => {
            const testCount = assumption.test_results?.length || 0
            return (
              <div
                key={assumption.id}
                className="p-2 bg-white rounded border text-xs hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-1 mb-1">
                  {quadrant === 'test-first' && (
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  )}
                  {quadrant === 'validated' && (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  )}
                  <Badge className={categoryConfig[assumption.category].color} variant="outline">
                    {categoryConfig[assumption.category].label}
                  </Badge>
                  <span className="text-muted-foreground">P{assumption.priority}</span>
                  {/* Evidence strength indicator */}
                  <EvidenceStrengthIndicator
                    strength={assumption.evidence_strength || 'none'}
                    size="sm"
                    showDescription
                  />
                  {/* Test count */}
                  {testCount > 0 && (
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      <FlaskConical className="h-2.5 w-2.5" />
                      {testCount}
                    </span>
                  )}
                </div>
                <p className="line-clamp-2">{assumption.statement}</p>
              </div>
            )
          })}
          {assumptions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No assumptions in this quadrant
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function AssumptionCard({ assumption }: { assumption: Assumption }) {
  const categoryInfo = categoryConfig[assumption.category]
  const CategoryIcon = categoryIcons[assumption.category]
  const StatusIcon = statusIcons[assumption.status]

  // Count of test results
  const testCount = assumption.test_results?.length || 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={categoryInfo.color}>
                <CategoryIcon className="h-3 w-3 mr-1" />
                {categoryInfo.label}
              </Badge>
              <Badge className={getPriorityColor(assumption.priority)}>
                P{assumption.priority} - {getPriorityLabel(assumption.priority)}
              </Badge>
              {/* Evidence strength indicator */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-xs">
                <EvidenceStrengthIndicator
                  strength={assumption.evidence_strength || 'none'}
                  size="sm"
                />
                <span className="text-muted-foreground">
                  {assumption.evidence_strength
                    ? evidenceStrengthConfig[assumption.evidence_strength]?.label
                    : 'No Evidence'}
                </span>
              </div>
              <Badge className={statusConfig[assumption.status].color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[assumption.status].label}
              </Badge>
              {/* Test results count badge */}
              {testCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <FlaskConical className="h-3 w-3" />
                  {testCount} test{testCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Statement */}
            <p className="text-sm leading-relaxed">{assumption.statement}</p>

            {/* Evidence Needed (if available) */}
            {assumption.evidence_needed && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-dashed">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Evidence Needed
                  </p>
                  <p className="text-sm text-foreground">{assumption.evidence_needed}</p>
                </div>
              </div>
            )}

            {/* Metadata row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Source: {assumption.source || 'Not specified'}</span>
              <span>Created: {assumption.created_at ? new Date(assumption.created_at).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Beaker className="h-3 w-3 mr-1" />
              Test
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AssumptionMap
