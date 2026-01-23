/**
 * Canvas Gallery Page
 *
 * @story US-CP01
 */

import React from 'react'
import { GetServerSideProps } from 'next'
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { CanvasGallery } from "@/components/canvas/CanvasGallery"

// Force dynamic rendering to avoid expensive build-time processing
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} }
}

export default function CanvasPage() {
  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Canvas Gallery", href: "/canvas" },
      ]}
    >
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Canvas Gallery</h2>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            Browse and manage your strategic canvases. Create new canvases or view existing ones
            including Value Proposition Canvas, Business Model Canvas, and Testing Business Ideas.
          </p>

          <CanvasGallery />
        </div>
      </div>
    </DashboardLayout>
  )
}
