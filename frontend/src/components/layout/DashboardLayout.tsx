"use client"

import * as React from "react"
import { AppSidebar } from "./AppSidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useRoleInfo } from "@/lib/auth/hooks"
import { FounderStatusPanel } from "@/components/founders"

interface DashboardLayoutProps {
  children: React.ReactNode
  breadcrumbs?: Array<{
    title: string
    href?: string
  }>
  userType?: "consultant" | "founder"
}

export function DashboardLayout({ children, breadcrumbs = [], userType = "consultant" }: DashboardLayoutProps) {
  const roleInfo = useRoleInfo()

  const resolvedUserType: "consultant" | "founder" = roleInfo.loading
    ? userType
    : roleInfo.role === "founder" || roleInfo.role === "trial"
      ? "founder"
      : "consultant"

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" userType={resolvedUserType} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 h-4"
          />
          {breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                      {crumb.href ? (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.title}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          <div className="ml-auto">
            <FounderStatusPanel variant="header" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
