"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
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
import { getDemoValuePropositionCanvas } from "@/data/demoData"

interface CanvasItem {
  id: string
  title: string
  type: "vpc" | "bmc" | "tbi"
  client: string
  status: "completed" | "in-progress" | "draft"
  lastModified: string
  aiGenerated: boolean
  completionRate: number
}

const mockCanvases: CanvasItem[] = [
  {
    id: "1",
    title: "E-commerce Platform VPC",
    type: "vpc",
    client: "TechStart Inc.",
    status: "completed",
    lastModified: "2 hours ago",
    aiGenerated: true,
    completionRate: 95,
  },
  {
    id: "2",
    title: "SaaS Business Model",
    type: "bmc",
    client: "CloudCorp",
    status: "in-progress",
    lastModified: "1 day ago",
    aiGenerated: true,
    completionRate: 78,
  },
  {
    id: "3",
    title: "Mobile App Testing Framework",
    type: "tbi",
    client: "AppVenture",
    status: "draft",
    lastModified: "3 days ago",
    aiGenerated: false,
    completionRate: 45,
  },
]

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
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                aria-label="Canvas options menu"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Canvas
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Palette className="h-4 w-4 mr-2" />
                Edit Canvas
              </DropdownMenuItem>
              <DropdownMenuItem>
                Export Canvas
              </DropdownMenuItem>
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
          <Button size="sm" variant="outline" className="flex-1">
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

interface CanvasGalleryProps {
  demoCanvases?: CanvasItem[]
}

export function CanvasGallery({ demoCanvases }: CanvasGalleryProps = {}) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [viewingCanvas, setViewingCanvas] = React.useState<CanvasItem | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  // Get demo data using lazy loading function
  const demoValuePropositionCanvas = getDemoValuePropositionCanvas()

  // Use demo canvases if provided, otherwise use mock data
  const canvasData = demoCanvases || mockCanvases

  const filterCanvases = (type?: string) => {
    // Ensure we have data to filter
    if (!canvasData || canvasData.length === 0) {
      return []
    }
    
    let filtered = canvasData
    
    // Filter by type
    if (type && type !== "all") {
      filtered = filtered.filter(canvas => canvas.type === type)
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(canvas => 
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
    // Show loading state
    setIsLoading(true)
    
    // Simulate AI canvas generation process
    setTimeout(() => {
      setIsLoading(false)
      
      // Navigate to canvas creation - for now, default to VPC
      // In a real implementation, this would show a modal to select canvas type
      // and then redirect to the appropriate canvas editor
      if (typeof window !== 'undefined') {
        window.location.href = '/canvas/vpc'
      }
    }, 1500) // Simulate AI processing time
  }

  const handleBackToGallery = () => {
    setViewingCanvas(null)
  }

  // If viewing a specific canvas, show the canvas visualization
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
          <ValuePropositionCanvas
            clientId={viewingCanvas.client}
            initialData={{
              valuePropositionTitle: "Demo Value Proposition",
              customerSegmentTitle: "Demo Customer Segment",
              customerProfile: {
                jobs: demoValuePropositionCanvas?.data?.customerSegment?.customerJobs || [],
                pains: demoValuePropositionCanvas?.data?.customerSegment?.pains || [],
                gains: demoValuePropositionCanvas?.data?.customerSegment?.gains || []
              },
              valueMap: {
                productsAndServices: demoValuePropositionCanvas?.data?.valueProposition?.products || [],
                painRelievers: demoValuePropositionCanvas?.data?.valueProposition?.painRelievers || [],
                gainCreators: demoValuePropositionCanvas?.data?.valueProposition?.gainCreators || []
              }
            }}
            readOnly={true}
          />
        )}
        
        {viewingCanvas.type === "bmc" && (
          <BusinessModelCanvas
            canvasId={viewingCanvas.id}
            clientId={viewingCanvas.client}
            readOnly={true}
          />
        )}
        
        {viewingCanvas.type === "tbi" && (
          <TestingBusinessIdeasCanvas
            canvasId={viewingCanvas.id}
            clientId={viewingCanvas.client}
            readOnly={true}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Canvas Gallery</h2>
          <p className="text-muted-foreground">
            AI-generated strategic canvases for your clients
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          aria-label="Generate new canvas"
          onClick={handleGenerateCanvas}
          disabled={isLoading}
        >
          <Palette className="h-4 w-4" />
          {isLoading ? "Generating..." : "Generate Canvas"}
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search canvases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

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
              Array.from({ length: 6 }).map((_, i) => <LoadingSkeleton key={i} />)
            ) : (
              <>
                {filterCanvases("all").map((canvas) => (
                  <CanvasCard key={canvas.id} canvas={canvas} onView={handleViewCanvas} />
                ))}
                {filterCanvases("all").length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">No canvases found matching your search.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="vpc" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterCanvases("vpc").length > 0
              ? filterCanvases("vpc").map((canvas) => (
                  <CanvasCard key={canvas.id} canvas={canvas} onView={handleViewCanvas} />
                ))
              : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No Value Proposition canvases found matching your search.</p>
                </div>
              )}
          </div>
        </TabsContent>

        <TabsContent value="bmc" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterCanvases("bmc").length > 0
              ? filterCanvases("bmc").map((canvas) => (
                  <CanvasCard key={canvas.id} canvas={canvas} onView={handleViewCanvas} />
                ))
              : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No Business Model canvases found matching your search.</p>
                </div>
              )}
          </div>
        </TabsContent>

        <TabsContent value="tbi" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterCanvases("tbi").length > 0
              ? filterCanvases("tbi").map((canvas) => (
                  <CanvasCard key={canvas.id} canvas={canvas} onView={handleViewCanvas} />
                ))
              : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No Testing Business Ideas canvases found matching your search.</p>
                </div>
              )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
