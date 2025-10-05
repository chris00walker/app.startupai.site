"use client"

import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ProjectCreationWizard } from "@/components/onboarding/ProjectCreationWizard"

export default function NewClientProjectPage() {
  const params = useParams()
  const clientId = params?.clientId as string

  if (!clientId) {
    return <div>Client not found</div>
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Clients", href: "/clients" },
        { title: "Client Details", href: `/client/${clientId}` },
        { title: "New Project", href: `/client/${clientId}/projects/new` },
      ]}
      userType="consultant"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Project for Client</h1>
        <p className="text-muted-foreground mt-2">
          Use our AI-powered wizard to set up a comprehensive validation framework for this client's project
        </p>
      </div>
      <ProjectCreationWizard clientId={clientId} />
    </DashboardLayout>
  )
}
