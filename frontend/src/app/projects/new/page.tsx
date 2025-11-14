"use client"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ProjectCreationWizard } from "@/components/onboarding/ProjectCreationWizard"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function NewProjectPage() {
  const [userType, setUserType] = useState<"consultant" | "founder">("founder")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function detectUserType() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Check user metadata or role to determine user type
          const metadata = user.user_metadata || {}
          const planType = metadata.plan_type || metadata.planType

          // Set user type based on plan type or role
          if (planType === 'sprint' || metadata.role === 'consultant') {
            setUserType("consultant")
          } else {
            setUserType("founder")
          }
        }
      } catch (error) {
        console.error("Error detecting user type:", error)
      } finally {
        setIsLoading(false)
      }
    }

    detectUserType()
  }, [])

  const dashboardHref = userType === "consultant" ? "/consultant-dashboard" : "/founder-dashboard"

  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { title: "New Project", href: "/projects/new" },
        ]}
      >
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: userType === "consultant" ? "Portfolio" : "Projects", href: dashboardHref },
        { title: "New Project", href: "/projects/new" },
      ]}
      userType={userType}
    >
      <ProjectCreationWizard />
    </DashboardLayout>
  )
}
