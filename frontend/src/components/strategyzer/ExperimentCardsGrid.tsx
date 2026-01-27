/**
 * ExperimentCardsGrid Component
 *
 * Grid view for managing Strategyzer experiment cards with CRUD operations,
 * filtering by status and method, and analytics summary.
 *
 * @story US-F06
 */
"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Beaker,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Target,
  LayoutGrid,
  List,
  Filter
} from 'lucide-react'
import { FounderBadge } from '@/components/founders'
import { createClient } from '@/lib/supabase/client'
import { useProjects } from '@/hooks/useProjects'
import { ExperimentCard } from './ExperimentCard'
import { ExperimentCardForm, type ExperimentCardFormData } from './ExperimentCardForm'
import {
  type StrategyzerExperiment,
  type DbExperimentRecord,
  type DbHypothesisRecord,
  type ExperimentStatus,
  type Assumption,
  type EvidenceStrength,
  transformDbToExperiment,
  transformDbToAssumption,
  experimentMethodConfig
} from './types'

interface ExperimentCardsGridProps {
  projectId?: string
}

const statusFilters = [
  { value: 'all', label: 'All', icon: Beaker },
  { value: 'draft', label: 'Draft', icon: Clock },
  { value: 'planned', label: 'Planned', icon: Target },
  { value: 'running', label: 'Running', icon: Play },
  { value: 'completed', label: 'Completed', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle }
] as const

export function ExperimentCardsGrid({ projectId: propProjectId }: ExperimentCardsGridProps) {
  const supabase = useMemo(() => createClient(), [])
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects()
  const activeProjectId = useMemo(() => propProjectId || projects[0]?.id || null, [propProjectId, projects])

  const [experiments, setExperiments] = useState<StrategyzerExperiment[]>([])
  const [assumptions, setAssumptions] = useState<Assumption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI State
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExperiment, setEditingExperiment] = useState<StrategyzerExperiment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch experiments from database
  const fetchExperiments = useCallback(async () => {
    if (!activeProjectId) {
      setExperiments([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const { data, error: queryError } = await supabase
        .from('experiments')
        .select('*')
        .eq('project_id', activeProjectId)
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      // Transform to StrategyzerExperiment format (using snake_case to match CrewAI)
      const transformed: StrategyzerExperiment[] = (data ?? []).map((record: any) => ({
        id: record.id,
        name: record.name || record.hypothesis || '',
        project_id: record.project_id,
        assumption_id: record.hypothesis_id || undefined,
        hypothesis: record.hypothesis || record.name || '',
        method: record.test_method || record.type || 'interview',
        metric: record.metric || undefined,
        success_criteria: record.success_criteria || '',
        expected_outcome: record.expected_outcome as 'pivot' | 'iterate' | 'kill' | undefined,
        cost_time: record.cost_time || record.estimated_time || undefined,
        cost_money: record.cost_money || undefined,
        evidence_strength: (record.evidence_strength || record.expected_strength || 'none') as EvidenceStrength,
        status: (record.status || 'draft') as ExperimentStatus,
        start_date: record.start_date || undefined,
        end_date: record.end_date || undefined,
        actual_outcome: record.actual_outcome as 'pivot' | 'iterate' | 'kill' | undefined,
        actual_metric_value: record.actual_metric_value || undefined,
        learning_card_id: record.learning_card_id || undefined,
        owner: record.owner || undefined,
        created_at: record.created_at,
        updated_at: record.updated_at
      }))

      setExperiments(transformed)
      setError(null)
    } catch (err) {
      console.error('Error fetching experiments:', err)
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId, supabase])

  // Fetch assumptions for linking
  const fetchAssumptions = useCallback(async () => {
    if (!activeProjectId) return

    try {
      const { data, error: queryError } = await supabase
        .from('hypotheses')
        .select('*')
        .eq('project_id', activeProjectId)
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      const transformed = ((data as DbHypothesisRecord[]) ?? []).map(transformDbToAssumption)
      setAssumptions(transformed)
    } catch (err) {
      console.error('Error fetching assumptions:', err)
    }
  }, [activeProjectId, supabase])

  useEffect(() => {
    if (projectsLoading) return
    fetchExperiments()
    fetchAssumptions()
  }, [projectsLoading, fetchExperiments, fetchAssumptions])

  // Filter experiments
  const filteredExperiments = useMemo(() => {
    return experiments.filter(exp => {
      const matchesStatus = statusFilter === 'all' || exp.status === statusFilter
      const matchesMethod = methodFilter === 'all' || exp.method === methodFilter
      return matchesStatus && matchesMethod
    })
  }, [experiments, statusFilter, methodFilter])

  // Analytics
  const analytics = useMemo(() => {
    const total = experiments.length
    const running = experiments.filter(e => e.status === 'running').length
    const completed = experiments.filter(e => e.status === 'completed').length
    const successRate = completed > 0
      ? Math.round((experiments.filter(e => e.status === 'completed' && e.actual_outcome === 'iterate').length / completed) * 100)
      : 0

    return { total, running, completed, successRate }
  }, [experiments])

  // CRUD Operations
  const handleCreateExperiment = async (data: ExperimentCardFormData) => {
    if (!activeProjectId) return

    try {
      setIsSubmitting(true)
      const { error: insertError } = await supabase
        .from('experiments')
        .insert({
          project_id: activeProjectId,
          name: data.hypothesis,
          hypothesis: data.hypothesis,
          hypothesis_id: data.assumptionId,
          type: data.testMethod,
          test_method: data.testMethod,
          metric: data.metric,
          success_criteria: data.successCriteria,
          expected_outcome: data.expectedOutcome,
          cost_time: data.costTime,
          cost_money: data.costMoney,
          evidence_strength: data.evidenceStrength,
          expected_strength: data.evidenceStrength,
          status: 'draft'
        })

      if (insertError) throw insertError

      setIsFormOpen(false)
      await fetchExperiments()
    } catch (err) {
      console.error('Error creating experiment:', err)
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateExperiment = async (data: ExperimentCardFormData) => {
    if (!editingExperiment) return

    try {
      setIsSubmitting(true)
      const { error: updateError } = await supabase
        .from('experiments')
        .update({
          name: data.hypothesis,
          hypothesis: data.hypothesis,
          hypothesis_id: data.assumptionId,
          type: data.testMethod,
          test_method: data.testMethod,
          metric: data.metric,
          success_criteria: data.successCriteria,
          expected_outcome: data.expectedOutcome,
          cost_time: data.costTime,
          cost_money: data.costMoney,
          evidence_strength: data.evidenceStrength,
          expected_strength: data.evidenceStrength,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingExperiment.id)

      if (updateError) throw updateError

      setEditingExperiment(null)
      await fetchExperiments()
    } catch (err) {
      console.error('Error updating experiment:', err)
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (id: string, status: ExperimentStatus) => {
    try {
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'running') {
        updateData.start_date = new Date().toISOString()
      } else if (status === 'completed' || status === 'cancelled') {
        updateData.end_date = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('experiments')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      await fetchExperiments()
    } catch (err) {
      console.error('Error updating status:', err)
      setError((err as Error).message)
    }
  }

  const handleDeleteExperiment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experiment card?')) return

    try {
      const { error: deleteError } = await supabase
        .from('experiments')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchExperiments()
    } catch (err) {
      console.error('Error deleting experiment:', err)
      setError((err as Error).message)
    }
  }

  const handleEdit = (id: string) => {
    const experiment = experiments.find(e => e.id === id)
    if (experiment) {
      setEditingExperiment(experiment)
    }
  }

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
        Create a project to start designing experiment cards.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Experiment Cards</h2>
            <FounderBadge founderId="pulse" variant="badge" size="sm" />
          </div>
          <p className="text-muted-foreground">
            Design and track experiments to validate your assumptions
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Experiment Card
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{analytics.total}</div>
            <p className="text-xs text-muted-foreground">Total Experiments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{analytics.running}</div>
            <p className="text-xs text-muted-foreground">Running</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{analytics.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{analytics.successRate}%</div>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {(projectsError || error) && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {projectsError?.message || error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>

        {/* Status Filter */}
        <div className="flex gap-1">
          {statusFilters.map(filter => {
            const Icon = filter.icon
            const count = filter.value === 'all'
              ? experiments.length
              : experiments.filter(e => e.status === filter.value).length
            return (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {filter.label} ({count})
              </Button>
            )
          })}
        </div>

        {/* Method Filter */}
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Test Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {Object.entries(experimentMethodConfig).map(([method, config]) => (
              <SelectItem key={method} value={method}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex gap-1 ml-auto">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Experiments Grid/List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading experiment cards...
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
          : 'space-y-4'
        }>
          {filteredExperiments.map(experiment => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              compact={viewMode === 'list'}
              onEdit={handleEdit}
              onDelete={handleDeleteExperiment}
              onStatusChange={handleStatusChange}
            />
          ))}
          {filteredExperiments.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center">
                <Beaker className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">No experiment cards yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first experiment card to start validating assumptions
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Experiment Card
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create Form Dialog */}
      <ExperimentCardForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateExperiment}
        assumptions={assumptions}
        isSubmitting={isSubmitting}
        mode="create"
      />

      {/* Edit Form Dialog */}
      {editingExperiment && (
        <ExperimentCardForm
          open={true}
          onOpenChange={() => setEditingExperiment(null)}
          onSubmit={handleUpdateExperiment}
          initialData={{
            hypothesis: editingExperiment.hypothesis,
            testMethod: editingExperiment.method,
            metric: editingExperiment.metric,
            successCriteria: editingExperiment.success_criteria,
            expectedOutcome: editingExperiment.expected_outcome,
            costTime: editingExperiment.cost_time,
            costMoney: editingExperiment.cost_money,
            evidenceStrength: editingExperiment.evidence_strength,
            assumptionId: editingExperiment.assumption_id
          }}
          assumptions={assumptions}
          isSubmitting={isSubmitting}
          mode="edit"
        />
      )}
    </div>
  )
}

export default ExperimentCardsGrid
