/**
 * @story US-CP01
 */
"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { Brain, Palette, Eye, FileText, Lightbulb, MoreVertical, ArrowLeft, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ValuePropositionCanvas from "./ValuePropositionCanvas"
import BusinessModelCanvas from "./BusinessModelCanvas"
import TestingBusinessIdeasCanvas from "./TestingBusinessIdeasCanvas"

interface CanvasItem {
  id: string
  projectId: string
  title: string
  type: "vpc" | "bmc" | "tbi"
  client: string
  status: "completed" | "in-progress" | "draft"
  lastModified: string
  aiGenerated: boolean
  completionRate: number
  segmentKey?: string
  vpcData?: {
    valuePropositionTitle: string
    customerSegmentTitle: string
    valueMap: {
      productsAndServices: string[]
      painRelievers: string[]
      gainCreators: string[]
    }
    customerProfile: {
      gains: string[]
      pains: string[]
      jobs: string[]
    }
  }
  bmcData?: {
    keyPartners: string[]
    keyActivities: string[]
    keyResources: string[]
    valuePropositions: string[]
    customerRelationships: string[]
    channels: string[]
    customerSegments: string[]
    costStructure: string[]
    revenueStreams: string[]
  }
}

interface DbProject {
  id: string
  name: string
  updated_at: string
}

type UnknownRecord = Record<string, unknown>

interface CanvasGalleryProps {
  canvases?: CanvasItem[]
  projectId?: string
}

const canvasTypeConfig = {
  vpc: {
    label: "Value Proposition Canvas",
    icon: Lightbulb,
    color: "bg-blue-500",
  },
  bmc: {
    label: "Business Model Canvas",
    icon: Brain,
    color: "bg-green-500",
  },
  tbi: {
    label: "Testing Business Ideas",
    icon: FileText,
    color: "bg-purple-500",
  },
}

const statusConfig = {
  completed: { label: "Completed", variant: "default" as const },
  "in-progress": { label: "In Progress", variant: "secondary" as const },
  draft: { label: "Draft", variant: "outline" as const },
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

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

function getString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function formatCompositeText(primary: string | null, secondary: string | null) {
  if (primary && secondary) return `${primary}: ${secondary}`
  return primary || secondary || ""
}

function CanvasCard({ canvas, onView }: { canvas: CanvasItem; onView: (canvas: CanvasItem) => void }) {
  const typeConfig = canvasTypeConfig[canvas.type]
  const statusBadge = statusConfig[canvas.status]

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${typeConfig.color} text-white`}>
              <typeConfig.icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle
                className="text-base cursor-pointer hover:text-primary transition-colors"
                onClick={() => onView(canvas)}
              >
                {canvas.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {canvas.client} • {canvas.lastModified}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Canvas options menu">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Canvas
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Palette className="h-4 w-4 mr-2" />
                Edit Canvas
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Export Canvas</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          {canvas.aiGenerated && (
            <Badge variant="secondary" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              AI Generated
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{canvas.completionRate}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${canvas.completionRate}%` }}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" className="flex-1" onClick={() => onView(canvas)}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button size="sm" variant="outline" className="flex-1" disabled>
            <Palette className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  )
}

function buildStatus(completionRate: number): CanvasItem["status"] {
  if (completionRate === 0) return "draft"
  if (completionRate >= 90) return "completed"
  return "in-progress"
}

function calculateCompletion(counts: number[]) {
  const total = counts.length
  if (total === 0) return 0
  const filled = counts.filter((count) => count > 0).length
  return Math.round((filled / total) * 100)
}

export function CanvasGallery({ canvases: providedCanvases, projectId }: CanvasGalleryProps = {}) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = React.useState(!providedCanvases)
  const [error, setError] = React.useState<string | null>(null)
  const [viewingCanvas, setViewingCanvas] = React.useState<CanvasItem | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [canvasData, setCanvasData] = React.useState<CanvasItem[]>(providedCanvases || [])

  React.useEffect(() => {
    if (providedCanvases) {
      setCanvasData(providedCanvases)
      setIsLoading(false)
      return
    }

    const fetchCanvases = async () => {
      if (!user) {
        setCanvasData([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        let projectQuery = supabase
          .from("projects")
          .select("id, name, updated_at")
          .eq("user_id", user.id)

        if (projectId) {
          projectQuery = projectQuery.eq("id", projectId)
        }

        const { data: projects, error: projectsError } = await projectQuery

        if (projectsError) throw projectsError

        const projectList = (projects || []) as DbProject[]
        const projectIds = projectList.map((project) => project.id)

        if (projectIds.length === 0) {
          setCanvasData([])
          setIsLoading(false)
          return
        }

        const [vpcResult, bmcResult] = await Promise.all([
          supabase
            .from("value_proposition_canvas")
            .select(
              "id, project_id, segment_key, segment_name, data_source, updated_at, jobs, pains, gains, products_and_services, pain_relievers, gain_creators, differentiators"
            )
            .in("project_id", projectIds),
          supabase
            .from("business_model_canvas")
            .select(
              "id, project_id, data_source, updated_at, customer_segments, value_propositions, channels, customer_relationships, revenue_streams, key_resources, key_activities, key_partners, cost_structure"
            )
            .in("project_id", projectIds),
        ])

        if (vpcResult.error) throw vpcResult.error
        if (bmcResult.error) throw bmcResult.error

        const projectMap = new Map<string, string>()
        projectList.forEach((project) => projectMap.set(project.id, project.name))

        const vpcItems: CanvasItem[] = (vpcResult.data || []).map((row) => {
          const record = row as UnknownRecord
          const jobs = getArray(record.jobs)
          const pains = getArray(record.pains)
          const gains = getArray(record.gains)
          const products = getArray(record.products_and_services)
          const painRelievers = getArray(record.pain_relievers)
          const gainCreators = getArray(record.gain_creators)
          const differentiators = getArray(record.differentiators)

          const completionRate = calculateCompletion([
            jobs.length,
            pains.length,
            gains.length,
            products.length,
            painRelievers.length,
            gainCreators.length,
            differentiators.length,
          ])

          const projectName = projectMap.get(record.project_id as string) || "Project"
          const segmentName = getString(record.segment_name) || projectName

          const jobTexts = jobs.map((item) => {
            if (!isRecord(item)) return ""
            const functional = getString(item.functional)
            const emotional = getString(item.emotional)
            const social = getString(item.social)
            return [functional, emotional, social].filter(Boolean).join(" | ")
          })

          const vpcData = {
            valuePropositionTitle: segmentName,
            customerSegmentTitle: segmentName,
            valueMap: {
              productsAndServices: products
                .map((item) => (isRecord(item) ? getString(item.text) : null))
                .filter((value): value is string => Boolean(value)),
              painRelievers: painRelievers
                .map((item) => {
                  if (!isRecord(item)) return ""
                  const pain = getString(item.painDescription ?? item.pain_description)
                  const relief = getString(item.relief)
                  return formatCompositeText(pain, relief)
                })
                .filter(Boolean),
              gainCreators: gainCreators
                .map((item) => {
                  if (!isRecord(item)) return ""
                  const gain = getString(item.gainDescription ?? item.gain_description)
                  const creator = getString(item.creator)
                  return formatCompositeText(gain, creator)
                })
                .filter(Boolean),
            },
            customerProfile: {
              gains: gains
                .map((item) => (isRecord(item) ? getString(item.description) : null))
                .filter((value): value is string => Boolean(value)),
              pains: pains
                .map((item) => (isRecord(item) ? getString(item.description) : null))
                .filter((value): value is string => Boolean(value)),
              jobs: jobTexts.filter(Boolean),
            },
          }

          return {
            id: record.id as string,
            projectId: record.project_id as string,
            title: `${segmentName} VPC`,
            type: "vpc",
            client: projectName,
            status: buildStatus(completionRate),
            lastModified: formatRelativeTime(new Date(record.updated_at as string)),
            aiGenerated: ["crewai", "hybrid"].includes(getString(record.data_source) || ""),
            completionRate,
            segmentKey: getString(record.segment_key) || undefined,
            vpcData,
          }
        })

        const bmcItems: CanvasItem[] = (bmcResult.data || []).map((row) => {
          const record = row as UnknownRecord
          const blocks = [
            getArray(record.customer_segments),
            getArray(record.value_propositions),
            getArray(record.channels),
            getArray(record.customer_relationships),
            getArray(record.revenue_streams),
            getArray(record.key_resources),
            getArray(record.key_activities),
            getArray(record.key_partners),
            getArray(record.cost_structure),
          ]

          const completionRate = calculateCompletion(blocks.map((block) => block.length))
          const projectName = projectMap.get(record.project_id as string) || "Project"
          const bmcData = {
            keyPartners: blocks[7]
              .map((item) => (isRecord(item) ? getString(item.text) : null))
              .filter((value): value is string => Boolean(value)),
            keyActivities: blocks[6]
              .map((item) => (isRecord(item) ? getString(item.text) : null))
              .filter((value): value is string => Boolean(value)),
            keyResources: blocks[5]
              .map((item) => (isRecord(item) ? getString(item.text) : null))
              .filter((value): value is string => Boolean(value)),
            valuePropositions: blocks[1]
              .map((item) => (isRecord(item) ? getString(item.text) : null))
              .filter((value): value is string => Boolean(value)),
            customerRelationships: blocks[3]
              .map((item) => (isRecord(item) ? getString(item.text) : null))
              .filter((value): value is string => Boolean(value)),
            channels: blocks[2]
              .map((item) => (isRecord(item) ? getString(item.text) : null))
              .filter((value): value is string => Boolean(value)),
            customerSegments: blocks[0]
              .map((item) => (isRecord(item) ? getString(item.text) : null))
              .filter((value): value is string => Boolean(value)),
            costStructure: blocks[8]
              .map((item) => (isRecord(item) ? getString(item.text) : null))
              .filter((value): value is string => Boolean(value)),
            revenueStreams: blocks[4]
              .map((item) => (isRecord(item) ? getString(item.text) : null))
              .filter((value): value is string => Boolean(value)),
          }

          return {
            id: record.id as string,
            projectId: record.project_id as string,
            title: `${projectName} BMC`,
            type: "bmc",
            client: projectName,
            status: buildStatus(completionRate),
            lastModified: formatRelativeTime(new Date(record.updated_at as string)),
            aiGenerated: ["crewai", "hybrid"].includes(getString(record.data_source) || ""),
            completionRate,
            bmcData,
          }
        })

        setCanvasData([...vpcItems, ...bmcItems])
      } catch (fetchError) {
        console.error("[CanvasGallery] Failed to load canvases:", fetchError)
        setError("Unable to load canvases right now.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCanvases()
  }, [providedCanvases, user, projectId])

  const filterCanvases = (type?: string) => {
    if (!canvasData || canvasData.length === 0) {
      return []
    }

    let filtered = canvasData

    if (type && type !== "all") {
      filtered = filtered.filter((canvas) => canvas.type === type)
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (canvas) =>
          canvas.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          canvas.client.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const handleViewCanvas = (canvas: CanvasItem) => {
    setViewingCanvas(canvas)
  }

  const handleGenerateCanvas = () => {
    if (typeof window !== "undefined") {
      const target = projectId ? `/canvas/vpc?projectId=${projectId}` : "/canvas/vpc"
      window.location.href = target
    }
  }

  const handleBackToGallery = () => {
    setViewingCanvas(null)
  }

  if (viewingCanvas) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToGallery}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{viewingCanvas.title}</h2>
            <p className="text-muted-foreground">
              {viewingCanvas.client} • {viewingCanvas.lastModified}
            </p>
          </div>
        </div>

        {viewingCanvas.type === "vpc" && (
          viewingCanvas.vpcData ? (
            <ValuePropositionCanvas initialData={viewingCanvas.vpcData} readOnly={true} />
          ) : (
            <EmptyState
              title="No VPC data available"
              description="This canvas does not have enough data to render yet."
              icon={<Lightbulb className="h-8 w-8" />}
            />
          )
        )}

        {viewingCanvas.type === "bmc" && (
          viewingCanvas.bmcData ? (
            <BusinessModelCanvas initialData={viewingCanvas.bmcData} readOnly={true} />
          ) : (
            <EmptyState
              title="No BMC data available"
              description="This canvas does not have enough data to render yet."
              icon={<Brain className="h-8 w-8" />}
            />
          )
        )}

        {viewingCanvas.type === "tbi" && (
          <TestingBusinessIdeasCanvas readOnly={true} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Canvas Gallery</h2>
          <p className="text-muted-foreground">Strategic canvases generated from real project data</p>
        </div>
        <Button className="flex items-center gap-2" aria-label="Generate new canvas" onClick={handleGenerateCanvas}>
          <Palette className="h-4 w-4" />
          Generate Canvas
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search canvases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <EmptyState
          title="Unable to load canvases"
          description={error}
          icon={<FileText className="h-8 w-8" />}
        />
      )}

      {!error && (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Canvases</TabsTrigger>
            <TabsTrigger value="vpc">Value Proposition</TabsTrigger>
            <TabsTrigger value="bmc">Business Model</TabsTrigger>
            <TabsTrigger value="tbi">Testing Ideas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => <LoadingSkeleton key={index} />)
              ) : (
                <>
                  {filterCanvases("all").map((canvas) => (
                    <CanvasCard key={canvas.id} canvas={canvas} onView={handleViewCanvas} />
                  ))}
                  {filterCanvases("all").length === 0 && (
                    <EmptyState
                      title="No canvases yet"
                      description="Complete onboarding to generate your first canvas."
                      icon={<Palette className="h-8 w-8" />}
                    />
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="vpc" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterCanvases("vpc").length > 0 ? (
                filterCanvases("vpc").map((canvas) => (
                  <CanvasCard key={canvas.id} canvas={canvas} onView={handleViewCanvas} />
                ))
              ) : (
                <EmptyState
                  title="No Value Proposition canvases yet"
                  description="Generate a validation run to populate VPC data."
                  icon={<Lightbulb className="h-8 w-8" />}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="bmc" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterCanvases("bmc").length > 0 ? (
                filterCanvases("bmc").map((canvas) => (
                  <CanvasCard key={canvas.id} canvas={canvas} onView={handleViewCanvas} />
                ))
              ) : (
                <EmptyState
                  title="No Business Model canvases yet"
                  description="Complete onboarding to see Business Model Canvas data."
                  icon={<Brain className="h-8 w-8" />}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="tbi" className="space-y-4">
            <EmptyState
              title="No Testing Business Ideas canvases yet"
              description="TBI canvases appear once experimentation data is captured."
              icon={<FileText className="h-8 w-8" />}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
