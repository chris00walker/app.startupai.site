"use client"

/**
 * Evidence Ledger with fit-type filters and evidence entry.
 * @story US-F13
 */

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Plus,
  Download,
  Eye,
  Link,
  AlertTriangle,
  FileText,
  Users,
  BarChart3,
  Filter
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useProjects } from "@/hooks/useProjects"
import { EvidenceInputForm, type EvidenceFormData } from "@/components/evidence"

interface EvidenceItem {
  id: string
  title: string
  category: "Survey" | "Interview" | "Experiment" | "Analytics" | "Research"
  summary: string
  fullText: string
  strength: "weak" | "medium" | "strong"
  isContradiction: boolean
  fitType: "Desirability" | "Feasibility" | "Viability"
  date: string
  author: string
  source: string
  linkedAssumptions: string[]
}

interface FilterState {
  search: string
  fitType: string
  strength: string
  contradictions: string
}

type DbEvidence = {
  id: string
  project_id: string
  title: string | null
  evidence_category: EvidenceItem['category'] | null
  summary: string | null
  full_text: string | null
  strength: EvidenceItem['strength'] | null
  is_contradiction: boolean | null
  fit_type: EvidenceItem['fitType'] | null
  occurred_on: string | null
  author: string | null
  evidence_source: string | null
  linked_assumptions: string[] | null
  created_at: string
}

function formatEvidenceDate(value: string | null | undefined): string {
  if (!value) return 'Not dated'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString()
}

function transformEvidence(record: DbEvidence): EvidenceItem {
  return {
    id: record.id,
    title: record.title ?? 'Untitled evidence',
    category: (record.evidence_category ?? 'Research') as EvidenceItem['category'],
    summary: record.summary ?? record.full_text?.slice(0, 180) ?? '',
    fullText: record.full_text ?? record.summary ?? '',
    strength: (record.strength ?? 'medium') as EvidenceItem['strength'],
    isContradiction: Boolean(record.is_contradiction),
    fitType: (record.fit_type ?? 'Desirability') as EvidenceItem['fitType'],
    date: formatEvidenceDate(record.occurred_on ?? record.created_at),
    author: record.author ?? 'Unknown',
    source: record.evidence_source ?? 'Unspecified',
    linkedAssumptions: record.linked_assumptions ?? []
  }
}

const categoryIcons = {
  Survey: BarChart3,
  Interview: Users,
  Experiment: FileText,
  Analytics: BarChart3,
  Research: FileText
}

function EvidenceCard({ evidence }: { evidence: EvidenceItem }) {
  const CategoryIcon = categoryIcons[evidence.category]
  
  const getStrengthColor = () => {
    switch (evidence.strength) {
      case "strong": return "bg-green-500"
      case "medium": return "bg-yellow-500"
      case "weak": return "bg-red-500"
    }
  }

  const getStrengthVariant = () => {
    switch (evidence.strength) {
      case "strong": return "default"
      case "medium": return "secondary"
      case "weak": return "outline"
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <CategoryIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{evidence.title}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-wide">
                {evidence.category}
              </CardDescription>
            </div>
          </div>
          {evidence.isContradiction && (
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {evidence.summary}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getStrengthVariant()} className="text-xs">
              {evidence.strength} evidence
            </Badge>
            <Badge variant="outline" className="text-xs">
              {evidence.fitType}
            </Badge>
            {evidence.isContradiction && (
              <Badge variant="destructive" className="text-xs shrink-0">
                Contradiction
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{evidence.date}</span>
            <span>{evidence.author}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4" />
                    {evidence.title}
                  </DialogTitle>
                  <DialogDescription>
                    {evidence.category} • {evidence.source} • {evidence.date}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Full Evidence</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {evidence.fullText}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Metadata</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Strength:</span>
                        <Badge variant={getStrengthVariant()} className="ml-2 text-xs">
                          {evidence.strength}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fit Type:</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {evidence.fitType}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Author:</span>
                        <span className="ml-2">{evidence.author}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Source:</span>
                        <span className="ml-2">{evidence.source}</span>
                      </div>
                    </div>
                  </div>

                  {evidence.linkedAssumptions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Linked Assumptions</h4>
                      <div className="space-y-2">
                        {evidence.linkedAssumptions.map((assumption, index) => (
                          <div key={index} className="text-sm p-2 bg-muted rounded">
                            {assumption}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" size="sm">
              <Link className="h-3 w-3 mr-1" />
              Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EvidenceLedger() {
  const supabase = React.useMemo(() => createClient(), [])
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects()
  const activeProjectId = React.useMemo(() => projects[0]?.id ?? null, [projects])

  const [filters, setFilters] = React.useState<FilterState>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const filterParam = urlParams.get('filter')
      let fitType = "all"
      
      if (filterParam === 'desirability') fitType = 'Desirability'
      else if (filterParam === 'feasibility') fitType = 'Feasibility'  
      else if (filterParam === 'viability') fitType = 'Viability'
      
      return {
        search: "",
        fitType,
        strength: "all", 
        contradictions: "all"
      }
    }

    return {
      search: "",
      fitType: "all",
      strength: "all", 
      contradictions: "all"
    }
  })

  const [evidenceItems, setEvidenceItems] = React.useState<EvidenceItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [showEvidenceForm, setShowEvidenceForm] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const fetchEvidence = React.useCallback(async () => {
    if (!activeProjectId) {
      setEvidenceItems([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const { data, error: queryError } = await supabase
        .from('evidence')
        .select('*')
        .eq('project_id', activeProjectId)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      const transformed = ((data as DbEvidence[]) ?? []).map(transformEvidence)
      setEvidenceItems(transformed)
      setError(null)
    } catch (err) {
      console.error('Error fetching evidence:', err)
      setError((err as Error).message)
      setEvidenceItems([])
    } finally {
      setIsLoading(false)
    }
  }, [activeProjectId, supabase])

  React.useEffect(() => {
    if (projectsLoading) return
    fetchEvidence()
  }, [projectsLoading, fetchEvidence])

  const handleAddEvidence = React.useCallback(async (data: EvidenceFormData) => {
    if (!activeProjectId) return

    setIsSubmitting(true)
    try {
      const { error: insertError } = await supabase
        .from('evidence')
        .insert({
          project_id: activeProjectId,
          title: data.title,
          evidence_category: data.category,
          summary: data.summary,
          full_text: data.fullText || null,
          fit_type: data.fitType,
          strength: data.strength,
          is_contradiction: data.isContradiction,
          evidence_source: data.source || null,
          author: data.author || null,
          occurred_on: data.occurredOn?.toISOString().split('T')[0] || null,
          linked_assumptions: data.linkedAssumptions || [],
          content: data.summary, // content is required, use summary as fallback
        })

      if (insertError) throw insertError

      // Success - close form and refresh list
      setShowEvidenceForm(false)
      await fetchEvidence()
    } catch (err) {
      console.error('Error adding evidence:', err)
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }, [activeProjectId, supabase, fetchEvidence])

  const filteredEvidence = React.useMemo(() => {
    return evidenceItems.filter(evidence => {
      const searchTerm = filters.search.toLowerCase()
      const matchesSearch = !searchTerm ||
        evidence.title.toLowerCase().includes(searchTerm) ||
        evidence.summary.toLowerCase().includes(searchTerm) ||
        evidence.fullText.toLowerCase().includes(searchTerm)

      const matchesFitType = filters.fitType === "all" || evidence.fitType === filters.fitType
      const matchesStrength = filters.strength === "all" || evidence.strength === filters.strength
      const matchesContradictions = filters.contradictions === "all" || 
        (filters.contradictions === "contradictions" && evidence.isContradiction)

      return matchesSearch && matchesFitType && matchesStrength && matchesContradictions
    })
  }, [filters, evidenceItems])

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
        Create a project to start collecting evidence.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Loading evidence…
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evidence Ledger</h1>
          <p className="text-muted-foreground">
            Manage all evidence supporting or contradicting your business assumptions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export Evidence Pack
          </Button>
          <Button disabled={isLoading} onClick={() => setShowEvidenceForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Evidence
          </Button>
        </div>
      </div>

      {/* Evidence Input Form */}
      <EvidenceInputForm
        open={showEvidenceForm}
        onOpenChange={setShowEvidenceForm}
        onSubmit={handleAddEvidence}
        projectId={activeProjectId}
        isSubmitting={isSubmitting}
      />

      {(projectsError || error) && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {projectsError?.message || error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label htmlFor="evidence-search" className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="evidence-search"
                  placeholder="Search evidence..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label id="fit-type-label" className="text-sm font-medium">Fit Type</label>
              <Select
                value={filters.fitType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, fitType: value }))}
              >
                <SelectTrigger aria-labelledby="fit-type-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Desirability">Desirability</SelectItem>
                  <SelectItem value="Feasibility">Feasibility</SelectItem>
                  <SelectItem value="Viability">Viability</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label id="strength-label" className="text-sm font-medium">Evidence Strength</label>
              <Select
                value={filters.strength}
                onValueChange={(value) => setFilters(prev => ({ ...prev, strength: value }))}
              >
                <SelectTrigger aria-labelledby="strength-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strengths</SelectItem>
                  <SelectItem value="strong">Strong</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="weak">Weak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label id="contradictions-label" className="text-sm font-medium">Contradictions</label>
              <Select
                value={filters.contradictions}
                onValueChange={(value) => setFilters(prev => ({ ...prev, contradictions: value }))}
              >
                <SelectTrigger aria-labelledby="contradictions-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Evidence</SelectItem>
                  <SelectItem value="contradictions">Only Contradictions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading evidence…
          </CardContent>
        </Card>
      ) : filteredEvidence.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvidence.map((evidence) => (
            <EvidenceCard key={evidence.id} evidence={evidence} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No evidence found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {filters.search || filters.fitType !== "all" || filters.strength !== "all" || filters.contradictions !== "all"
                ? "Try adjusting your filters to see more evidence."
                : "Start building your evidence base by adding your first piece of evidence."
              }
            </p>
            <Button onClick={() => setShowEvidenceForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Evidence
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
