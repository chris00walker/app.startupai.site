"use client"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ProjectCreationWizard } from "@/components/onboarding/ProjectCreationWizard"

export default function NewProjectPage() {
  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Projects", href: "/founder-dashboard" },
        { title: "New Project", href: "/projects/new" },
      ]}
      userType="founder"
    >
      <ProjectCreationWizard />
    </DashboardLayout>
  )
}
