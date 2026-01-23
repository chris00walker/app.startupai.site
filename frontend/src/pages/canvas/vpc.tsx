/**
 * Value Proposition Canvas Page
 *
 * @story US-CP02
 */

import React from "react"
import { useRouter } from "next/router"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import GuidedValuePropositionCanvas from "@/components/canvas/GuidedValuePropositionCanvas"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/button"
import { Lightbulb, Save, Download, Share, Loader2 } from "lucide-react"
import { useProjects } from "@/hooks/useProjects"

export default function VPCPage() {
  const router = useRouter()
  const { projects, isLoading } = useProjects()
  const platform = typeof router.query.platform === "string" ? router.query.platform : undefined
  const queryProjectId = typeof router.query.projectId === "string" ? router.query.projectId : undefined
  const segmentKey = typeof router.query.segmentKey === "string" ? router.query.segmentKey : undefined

  const currentProjectId = queryProjectId || projects[0]?.id
  const isFounderPlatform = platform === "founder"

  return (
    <DashboardLayout
      userType={isFounderPlatform ? "founder" : "consultant"}
      breadcrumbs={
        isFounderPlatform
          ? [
              { title: "Founder Dashboard", href: "/founder-dashboard" },
              { title: "Value Proposition Canvas", href: "/canvas/vpc?platform=founder" },
            ]
          : [
              { title: "Canvas Gallery", href: "/canvas" },
              { title: "Value Proposition Canvas", href: "/canvas/vpc" },
            ]
      }
    >
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <Lightbulb className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Value Proposition Canvas</h2>
              <p className="text-muted-foreground">
                Design and test value propositions that perfectly match customer needs
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Guided Value Proposition Canvas</h3>
              <p className="text-blue-800 text-sm mt-1">
                Step-by-step creation of customer-aligned value propositions. Follow the structured workflow to
                design compelling value maps that perfectly match customer needs and pain points.
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
            description="Complete onboarding to generate your first Value Proposition Canvas."
            icon={<Lightbulb className="h-8 w-8" />}
          />
        ) : (
          <GuidedValuePropositionCanvas
            projectId={currentProjectId}
            segmentKey={segmentKey}
            readOnly={false}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
