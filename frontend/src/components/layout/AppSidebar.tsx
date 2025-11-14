"use client"

import * as React from "react"
import Link from "next/link"
import {
  BarChart3,
  Brain,
  Palette,
  FileText,
  Home,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Settings,
  Users,
  Workflow,
  Target,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useRoleInfo } from "@/lib/auth/hooks"

// Navigation item type
interface NavigationItem {
  title: string
  url: string
  icon: any
  description?: string
  isExternal?: boolean
}

// Strategyzer AI navigation data
const consultantNavigation = {
  main: [
    {
      title: "Dashboard",
      url: "/consultant-dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Client Portfolio",
      url: "/clients",
      icon: Users,
    },
    {
      title: "Canvas Gallery",
      url: "/canvas",
      icon: Palette,
    },
    {
      title: "AI Workflows",
      url: "/workflows",
      icon: Workflow,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
  ],
  canvasTypes: [
    {
      title: "Value Proposition Canvas",
      url: "/canvas/vpc",
      icon: Lightbulb,
      description: "Customer Profile + Value Map",
    },
    {
      title: "Business Model Canvas",
      url: "/canvas/bmc",
      icon: Brain,
      description: "9-block BMC structure",
    },
    {
      title: "Testing Business Ideas",
      url: "/canvas/tbi",
      icon: FileText,
      description: "Experiment design framework",
    },
  ],
  canvases: [
    {
      title: "Value Proposition Canvas",
      url: "/canvas/vpc",
      icon: Lightbulb,
      description: "Customer Profile + Value Map",
    },
    {
      title: "Business Model Canvas",
      url: "/canvas/bmc",
      icon: Brain,
      description: "9-block BMC structure",
    },
    {
      title: "Testing Business Ideas",
      url: "/canvas/tbi",
      icon: FileText,
      description: "Experiment design framework",
    },
  ],
  settings: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Logout",
      url: "/api/auth/logout",
      icon: LogOut,
    },
  ],
}

const founderNavigation = {
  main: [
    {
      title: "Founder Dashboard",
      url: "/founder-dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Value Proposition Canvas",
      url: "/canvas/vpc?platform=founder",
      icon: Lightbulb,
    },
    {
      title: "Testing Business Ideas",
      url: "/canvas/tbi?platform=founder",
      icon: FileText,
    },
    {
      title: "Business Model Canvas",
      url: "/canvas/bmc?platform=founder",
      icon: Brain,
    },
    {
      title: "Hypotheses",
      url: "/founder-dashboard?tab=hypotheses",
      icon: Lightbulb,
    },
    {
      title: "Experiments",
      url: "/founder-dashboard?tab=experiments", 
      icon: Workflow,
    },
    {
      title: "Evidence Ledger",
      url: "/founder-dashboard?tab=evidence",
      icon: FileText,
    },
    {
      title: "AI Insights",
      url: "/founder-dashboard?tab=insights",
      icon: Brain,
    },
  ],
  gates: [
    {
      title: "Gate Evaluation",
      url: "/project/current/gate",
      icon: Target,
      description: "Stage gate evaluation and readiness",
    },
  ],
  validation: [
    {
      title: "Product-Customer Fit",
      url: "/founder-dashboard?tab=evidence&filter=desirability",
      icon: Users,
      description: "Do customers want what we're building?",
    },
    {
      title: "Product-Market Fit",
      url: "/founder-dashboard?tab=evidence&filter=feasibility",
      icon: Lightbulb,
      description: "Can we build and reach the market?",
    },
    {
      title: "Product-Model Fit",
      url: "/founder-dashboard?tab=evidence&filter=viability",
      icon: BarChart3,
      description: "Can we sustain a profitable business?",
    },
  ],
  
  tools: [
    {
      title: "Export Evidence Pack",
      url: "/export",
      icon: Palette,
    },
  ],
  settings: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Logout",
      url: "/api/auth/logout",
      icon: LogOut,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userType?: "consultant" | "founder"
}

export function AppSidebar({ userType = "consultant", ...props }: AppSidebarProps) {
  const roleInfo = useRoleInfo()

  const resolvedType: "consultant" | "founder" = roleInfo.role === "founder" ? "founder" : userType

  const navigationData = resolvedType === "founder" ? founderNavigation : consultantNavigation
  const platformLabel = resolvedType === "founder" ? "Validation Framework" : "Platform"
  const secondaryLabel = resolvedType === "founder" ? "Fit Types" : "Canvas Generation"
  
  const secondaryItems = resolvedType === "founder" 
    ? (founderNavigation.validation || [])
    : (consultantNavigation.canvasTypes || [])
  
  const gatesItems = resolvedType === "founder" 
    ? (founderNavigation.gates || [])
    : []
  
  const toolsItems = resolvedType === "founder" 
    ? (founderNavigation.tools || [])
    : []
  
  const settingsItems = resolvedType === "founder"
    ? (founderNavigation.settings || [])
    : (consultantNavigation.settings || [])

  const showConsultantMenu = roleInfo.canAccessConsultant
  const showFounderMenu = roleInfo.canAccessFounder || roleInfo.role === "founder"

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0" data-testid="user-menu" {...props}>
      <SidebarHeader className="border-b-0">
        <Link href={showConsultantMenu ? "/consultant-dashboard" : "/founder-dashboard"} className="block">
          <div className="flex items-center gap-2 px-2 py-2 hover:bg-accent rounded-lg transition-colors cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold">StartupAI</span>
              <span className="text-xs text-muted-foreground">
                {resolvedType === "founder" ? "Founder Platform" : "Consulting Platform"}
              </span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.main
                .filter((item) => {
                  if (item.url.startsWith("/founder") && !showFounderMenu) return false
                  if (item.url.startsWith("/clients") && !showConsultantMenu) return false
                  if (item.url.startsWith("/analytics") && !showConsultantMenu) return false
                  return true
                })
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        {/* Secondary Navigation */}
        {(resolvedType === "founder" ? showFounderMenu : showConsultantMenu) && (
          <SidebarGroup>
            <SidebarGroupLabel>{secondaryLabel}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {secondaryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.description}>
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Gates (Founder only) */}
        {resolvedType === "founder" && showFounderMenu && gatesItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Gates</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {gatesItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.description}>
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Tools (Founder only) */}
        {resolvedType === "founder" && showFounderMenu && toolsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {toolsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-2">
          <div className="space-y-2">
            {roleInfo.trialReadonly && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900">
                Trial mode: upgrade to unlock full AI automation.
              </div>
            )}
            <Link href={resolvedType === "founder" ? "/onboarding/founder" : "/onboarding/consultant"} className="block">
              <Button variant="outline" size="sm" className="w-full">
                <Brain className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
            </Link>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
