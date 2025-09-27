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
      url: "/",
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
      url: "https://startupai-site.netlify.app",
      icon: LogOut,
      isExternal: true,
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
      url: "https://startupai-site.netlify.app",
      icon: LogOut,
      isExternal: true,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userType?: "consultant" | "founder"
}

export function AppSidebar({ userType = "consultant", ...props }: AppSidebarProps) {
  const navigationData = userType === "founder" ? founderNavigation : consultantNavigation
  const platformLabel = userType === "founder" ? "Validation Framework" : "Platform"
  const secondaryLabel = userType === "founder" ? "Fit Types" : "Canvas Generation"
  
  const secondaryItems = userType === "founder" 
    ? (founderNavigation.validation || [])
    : (consultantNavigation.canvasTypes || [])
  
  const toolsItems = userType === "founder" 
    ? (founderNavigation.tools || [])
    : []
  
  const settingsItems = userType === "founder"
    ? (founderNavigation.settings || [])
    : (consultantNavigation.settings || [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <Link href="/" className="block">
          <div className="flex items-center gap-2 px-2 py-2 hover:bg-accent rounded-lg transition-colors cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold">StartupAI</span>
              <span className="text-xs text-muted-foreground">
                {userType === "founder" ? "Founder Platform" : "Consulting Platform"}
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
              {navigationData.main.map((item) => (
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

        {/* Tools (Founder only) */}
        {userType === "founder" && toolsItems.length > 0 && (
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
                    {item.isExternal ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    ) : (
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-2">
          <Button variant="outline" size="sm" className="w-full">
            <Brain className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
