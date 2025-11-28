"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  LayoutGrid,
  Users,
  Target,
  Heart,
  Cog,
  DollarSign,
  ExternalLink,
  Maximize2
} from 'lucide-react'
import Link from 'next/link'

// Import canvas components
import ValuePropositionCanvas from '@/components/canvas/ValuePropositionCanvas'
import BusinessModelCanvas from '@/components/canvas/BusinessModelCanvas'

interface CanvasesGalleryProps {
  projectId?: string
}

export function CanvasesGallery({ projectId }: CanvasesGalleryProps) {
  const [activeCanvas, setActiveCanvas] = useState<'vpc' | 'bmc'>('vpc')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [fullScreenCanvas, setFullScreenCanvas] = useState<'vpc' | 'bmc' | null>(null)

  const openFullScreen = (canvas: 'vpc' | 'bmc') => {
    setFullScreenCanvas(canvas)
    setIsFullScreen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Strategyzer Canvases</h2>
          <p className="text-muted-foreground">
            Visualize your business model and value proposition
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/canvas/vpc">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Full VPC Editor
            </Button>
          </Link>
          <Link href="/canvas/bmc">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Full BMC Editor
            </Button>
          </Link>
        </div>
      </div>

      {/* Canvas Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <CanvasSummaryCard
          title="Value Proposition Canvas"
          description="Map customer needs to your solution"
          icon={Users}
          sections={[
            { name: 'Customer Jobs', count: 0 },
            { name: 'Pains', count: 0 },
            { name: 'Gains', count: 0 },
            { name: 'Products & Services', count: 0 },
            { name: 'Pain Relievers', count: 0 },
            { name: 'Gain Creators', count: 0 }
          ]}
          color="pink"
          onExpand={() => openFullScreen('vpc')}
          onEdit={() => setActiveCanvas('vpc')}
        />

        <CanvasSummaryCard
          title="Business Model Canvas"
          description="Design your entire business model"
          icon={LayoutGrid}
          sections={[
            { name: 'Value Propositions', count: 0 },
            { name: 'Customer Segments', count: 0 },
            { name: 'Channels', count: 0 },
            { name: 'Revenue Streams', count: 0 },
            { name: 'Key Resources', count: 0 },
            { name: 'Key Activities', count: 0 },
            { name: 'Key Partners', count: 0 },
            { name: 'Cost Structure', count: 0 }
          ]}
          color="blue"
          onExpand={() => openFullScreen('bmc')}
          onEdit={() => setActiveCanvas('bmc')}
        />
      </div>

      {/* Canvas Tabs */}
      <Tabs value={activeCanvas} onValueChange={(v) => setActiveCanvas(v as 'vpc' | 'bmc')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="vpc">
              <Users className="h-4 w-4 mr-2" />
              Value Proposition Canvas
            </TabsTrigger>
            <TabsTrigger value="bmc">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Business Model Canvas
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openFullScreen(activeCanvas)}
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Full Screen
          </Button>
        </div>

        <TabsContent value="vpc" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="min-h-[500px]">
                <ValuePropositionCanvas
                  canvasId={projectId ? `vpc-${projectId}` : 'default-vpc'}
                  readOnly={false}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bmc" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="min-h-[500px]">
                <BusinessModelCanvas
                  canvasId={projectId ? `bmc-${projectId}` : 'default-bmc'}
                  clientId={projectId || 'founder'}
                  readOnly={false}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Full Screen Dialog */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
          <DialogHeader>
            <DialogTitle>
              {fullScreenCanvas === 'vpc' ? 'Value Proposition Canvas' : 'Business Model Canvas'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4">
            {fullScreenCanvas === 'vpc' ? (
              <ValuePropositionCanvas
                canvasId={projectId ? `vpc-${projectId}` : 'default-vpc'}
                readOnly={false}
              />
            ) : (
              <BusinessModelCanvas
                canvasId={projectId ? `bmc-${projectId}` : 'default-bmc'}
                clientId={projectId || 'founder'}
                readOnly={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CanvasSummaryCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  sections: { name: string; count: number }[]
  color: 'pink' | 'blue'
  onExpand: () => void
  onEdit: () => void
}

function CanvasSummaryCard({
  title,
  description,
  icon: Icon,
  sections,
  color,
  onExpand,
  onEdit
}: CanvasSummaryCardProps) {
  const colorClasses = {
    pink: 'border-pink-200 bg-pink-50/50',
    blue: 'border-blue-200 bg-blue-50/50'
  }

  const iconColorClasses = {
    pink: 'text-pink-600',
    blue: 'text-blue-600'
  }

  return (
    <Card className={`${colorClasses[color]} hover:shadow-md transition-shadow cursor-pointer`} onClick={onEdit}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white`}>
              <Icon className={`h-5 w-5 ${iconColorClasses[color]}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onExpand(); }}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {sections.map((section, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {section.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default CanvasesGallery
