/**
 * Business Model Canvas Page
 *
 * @story US-CP03
 */

import React from "react"
import { useRouter } from "next/router"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import GuidedBusinessModelCanvas from "@/components/canvas/GuidedBusinessModelCanvas"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/button"
import { Brain, Save, Download, Share, Loader2 } from "lucide-react"
import { useProjects } from "@/hooks/useProjects"

export default function BMCPage() {
  const router = useRouter()
  const { projects, isLoading } = useProjects()
  const platform = typeof router.query.platform === "string" ? router.query.platform : undefined
  const queryProjectId = typeof router.query.projectId === "string" ? router.query.projectId : undefined

  const currentProjectId = queryProjectId || projects[0]?.id
  const isFounderPlatform = platform === "founder"

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

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading project data...
          </div>
        ) : !currentProjectId ? (
          <EmptyState
            title="No canvases yet"
            description="Complete onboarding to generate your first Business Model Canvas."
            icon={<Brain className="h-8 w-8" />}
          />
        ) : (
          <div className="bg-white rounded-lg border shadow-sm">
            <GuidedBusinessModelCanvas canvasId={currentProjectId} readOnly={false} />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
