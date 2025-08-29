import React from 'react'
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import BusinessModelCanvas from "@/components/canvas/BusinessModelCanvas"
import { useDemoMode } from "@/hooks/useDemoMode"
import { demoBusinessModelCanvas } from "@/data/demoData"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, Save, Download, Share } from "lucide-react"

export default function BMCPage() {
  const demoMode = useDemoMode()

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Canvas Gallery", href: "/canvas" },
        { title: "Business Model Canvas", href: "/canvas/bmc" },
      ]}
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
              <h3 className="font-semibold text-green-900">About Business Model Canvas</h3>
              <p className="text-green-800 text-sm mt-1">
                The Business Model Canvas is a strategic management template for developing new business models 
                and documenting existing ones. It offers a visual chart with 9 elements describing a firm's 
                value proposition, infrastructure, customers, and finances to help businesses align their activities.
              </p>
            </div>
          </div>
        </div>

        {/* Business Model Canvas Component */}
        <div className="bg-white rounded-lg border shadow-sm">
          <BusinessModelCanvas 
            canvasId={demoMode.isDemo ? "demo-bmc-1" : undefined}
            clientId={demoMode.isDemo ? "demo-techstart" : "demo-client"}
            onSave={(canvasData) => {
              console.log('Saving BMC:', canvasData)
              // TODO: Implement save functionality
            }}
            readOnly={false}
          />
        </div>

        {/* Canvas Building Blocks Guide */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Value Creation</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>Key Partners:</strong> Network of suppliers and partners</li>
              <li>• <strong>Key Activities:</strong> Most important actions to operate</li>
              <li>• <strong>Key Resources:</strong> Assets required to offer value</li>
            </ul>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Value Proposition</h4>
            <ul className="text-purple-800 text-sm space-y-1">
              <li>• <strong>Value Propositions:</strong> Bundle of products/services</li>
              <li>• <strong>Customer Relationships:</strong> Types of relationships</li>
              <li>• <strong>Channels:</strong> How you reach customers</li>
            </ul>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-2">Value Capture</h4>
            <ul className="text-orange-800 text-sm space-y-1">
              <li>• <strong>Customer Segments:</strong> Groups you aim to serve</li>
              <li>• <strong>Cost Structure:</strong> All costs to operate</li>
              <li>• <strong>Revenue Streams:</strong> Cash from customers</li>
            </ul>
          </div>
        </div>

        {/* Strategyzer Attribution */}
        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <p>
            Business Model Canvas methodology by{" "}
            <a 
              href="https://www.strategyzer.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Strategyzer
            </a>
            {" "}• Powered by AI-driven canvas generation and analysis
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
