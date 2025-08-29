import React from 'react'
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { CanvasGallery } from "@/components/canvas/CanvasGallery"
import { useDemoMode } from "@/hooks/useDemoMode"
import { 
  demoValuePropositionCanvas, 
  demoBusinessModelCanvas, 
  demoTestingBusinessIdeas 
} from "@/data/demoData"

export default function CanvasPage() {
  const demoMode = useDemoMode()

  // Create demo canvases array from individual demo objects
  const demoCanvases = [
    {
      id: demoValuePropositionCanvas.id,
      title: demoValuePropositionCanvas.title,
      type: demoValuePropositionCanvas.type,
      client: "TechStart Inc.",
      status: demoValuePropositionCanvas.status,
      lastModified: "2 hours ago",
      aiGenerated: true,
      completionRate: 95,
    },
    {
      id: demoBusinessModelCanvas.id,
      title: demoBusinessModelCanvas.title,
      type: demoBusinessModelCanvas.type,
      client: "TechStart Inc.",
      status: demoBusinessModelCanvas.status,
      lastModified: "1 day ago",
      aiGenerated: true,
      completionRate: 88,
    },
    {
      id: demoTestingBusinessIdeas.id,
      title: demoTestingBusinessIdeas.title,
      type: demoTestingBusinessIdeas.type,
      client: "TechStart Inc.",
      status: demoTestingBusinessIdeas.status,
      lastModified: "3 days ago",
      aiGenerated: false,
      completionRate: 72,
    },
  ]

  // Use demo canvases for display
  const displayCanvases = demoCanvases

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Canvas Gallery", href: "/canvas" },
      ]}
    >
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Canvas Gallery</h2>
          <div className="flex items-center space-x-2">
            {demoMode.isDemo && (
              <div className="text-sm text-muted-foreground">
                Demo Mode: Showing sample canvases
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Browse and manage your strategic canvases. Create new canvases or view existing ones 
            including Value Proposition Canvas, Business Model Canvas, and Testing Business Ideas.
          </p>
          
          <CanvasGallery demoCanvases={demoMode.isDemo ? displayCanvases : undefined} />
        </div>
      </div>
    </DashboardLayout>
  )
}
