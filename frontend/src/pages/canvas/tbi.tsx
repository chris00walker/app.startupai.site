import React from 'react'
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import GuidedTestingBusinessIdeasCanvas from "@/components/canvas/GuidedTestingBusinessIdeasCanvas"
import { useDemoMode } from "@/hooks/useDemoMode"
import { demoTestingBusinessIdeas } from "@/data/demoData"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Save, Download, Share } from "lucide-react"

export default function TBIPage() {
  const demoMode = useDemoMode()
  
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
              { title: "Testing Business Ideas", href: "/canvas/tbi?platform=founder" },
            ]
          : [
              { title: "Canvas Gallery", href: "/canvas" },
              { title: "Testing Business Ideas", href: "/canvas/tbi" },
            ]
      }
    >
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Testing Business Ideas</h2>
              <p className="text-muted-foreground">
                Systematically validate your business model through structured experimentation
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
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900">Guided Experimentation Framework</h3>
              <p className="text-purple-800 text-sm mt-1">
                A proven approach to validate business assumptions through structured experiments. Map risks, design tests, capture insights, and track validation progress in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Guided Testing Business Ideas Canvas Component */}
        <GuidedTestingBusinessIdeasCanvas 
          canvasId={demoMode.isDemo ? "demo-tbi-1" : undefined}
          clientId={demoMode.isDemo ? "demo-techstart" : "demo-client"}
          onSave={(canvasData) => {
            console.log('Saving TBI:', canvasData)
            // TODO: Implement save functionality
          }}
          readOnly={false}
        />

        {/* Testing Framework Guide */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">Assumption Map</h4>
            <ul className="text-red-800 text-sm space-y-1">
              <li>• Map business model assumptions</li>
              <li>• Assess risk and confidence levels</li>
              <li>• Prioritize what to test first</li>
              <li>• Track assumption validation</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Test Cards</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Design focused experiments</li>
              <li>• Define hypotheses clearly</li>
              <li>• Choose testing methods</li>
              <li>• Set success criteria</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Learning Cards</h4>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• Capture experiment insights</li>
              <li>• Document key learnings</li>
              <li>• Make pivot decisions</li>
              <li>• Plan next experiments</li>
            </ul>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-2">Experiment Library</h4>
            <ul className="text-orange-800 text-sm space-y-1">
              <li>• Track all experiments</li>
              <li>• Monitor progress status</li>
              <li>• Analyze success patterns</li>
              <li>• Build testing knowledge</li>
            </ul>
          </div>
        </div>

        {/* Testing Best Practices */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">Testing Best Practices</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• Start with riskiest assumptions first</li>
              <li>• Design cheap, fast experiments</li>
              <li>• Focus on learning, not being right</li>
              <li>• Use multiple testing methods</li>
            </ul>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• Set clear success/failure criteria</li>
              <li>• Document all learnings systematically</li>
              <li>• Iterate based on evidence</li>
              <li>• Build a culture of experimentation</li>
            </ul>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
