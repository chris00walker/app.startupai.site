import React from 'react'
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import GuidedBusinessModelCanvas from "@/components/canvas/GuidedBusinessModelCanvas"
import { useDemoMode } from "@/hooks/useDemoMode"
import { getDemoBusinessModelCanvas } from "@/data/demoData"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, Save, Download, Share } from "lucide-react"

export default function BMCPage() {
  const demoMode = useDemoMode()
  
  // Get demo data using lazy loading function
  const demoBusinessModelCanvas = getDemoBusinessModelCanvas()
  
  // Check if we're in founder platform mode (client-side only)
  const [isFounderPlatform, setIsFounderPlatform] = React.useState(false)
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const platform = urlParams.get('platform')
      setIsFounderPlatform(platform === 'founder')
    }
  }, [])

  return (
    <DashboardLayout
      userType={isFounderPlatform ? "founder" : "consultant"}
      breadcrumbs={
        isFounderPlatform 
          ? [
              { title: "Founder Dashboard", href: "/founder-dashboard" },
              { title: "Business Model Canvas", href: "/canvas/bmc?platform=founder" },
            ]
          : [
              { title: "Canvas Gallery", href: "/canvas" },
              { title: "Business Model Canvas", href: "/canvas/bmc" },
            ]
      }
    >
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
              <Brain className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Business Model Canvas</h2>
              <p className="text-muted-foreground">
                Design, describe, and pivot your business model with the 9-block BMC framework
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {demoMode.isDemo && (
              <Badge variant="secondary">Demo Mode</Badge>
            )}
            <Button variant="outline">
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Canvas
            </Button>
          </div>
        </div>

        {/* Canvas Description */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Brain className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Guided Business Model Canvas</h3>
              <p className="text-green-800 text-sm mt-1">
                Step-by-step guided creation of your business model. Follow the structured workflow to build 
                each component in the right order, with contextual guidance and examples at every step.
              </p>
            </div>
          </div>
        </div>

        {/* Business Model Canvas Component */}
        <div className="bg-white rounded-lg border shadow-sm">
          <GuidedBusinessModelCanvas 
            canvasId={demoMode.isDemo ? "demo-bmc-1" : undefined}
            clientId={demoMode.isDemo ? "demo-techstart" : "demo-client"}
            onSave={(canvasData) => {
              console.log('Saving BMC:', canvasData)
              // TODO: Implement save functionality
            }}
            readOnly={false}
          />
        </div>


      </div>
    </DashboardLayout>
  )
}
