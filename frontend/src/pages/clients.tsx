/**
 * Client Portfolio Page
 *
 * Dedicated client management view with extended filtering.
 * Main portfolio overview is on /consultant-dashboard.
 *
 * @story US-C03
 */

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  Users,
  Plus,
  Search,
  Eye,
  MoreVertical,
  TrendingUp,
  Calendar,
  Target,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useClients } from "@/hooks/useClients"
import type { PortfolioProject } from "@/types/portfolio"

const stageLabels: Record<PortfolioProject["stage"], string> = {
  DESIRABILITY: "Discovery",
  FEASIBILITY: "Validation",
  VIABILITY: "Scaling",
  SCALE: "Optimization",
}

const stageColors: Record<PortfolioProject["stage"], string> = {
  DESIRABILITY: "bg-blue-100 text-blue-800",
  FEASIBILITY: "bg-yellow-100 text-yellow-800",
  VIABILITY: "bg-green-100 text-green-800",
  SCALE: "bg-purple-100 text-purple-800",
}

export default function ClientsPage() {
  const { projects, isLoading, error } = useClients()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "DESIRABILITY" | "FEASIBILITY" | "VIABILITY" | "SCALE">("all")

  const filteredClients = useMemo(() => {
    return projects.filter((client) => {
      const matchesSearch = client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      if (activeTab === "all") return matchesSearch
      return matchesSearch && client.stage === activeTab
    })
  }, [projects, searchTerm, activeTab])

  const averageEvidenceQuality = useMemo(() => {
    if (projects.length === 0) return 0
    const total = projects.reduce((sum, project) => sum + (project.evidenceQuality || 0), 0)
    return Math.round(total / projects.length)
  }, [projects])

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbs={[{ title: "Client Portfolio", href: "/clients" }]}>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your clients...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={[{ title: "Client Portfolio", href: "/clients" }]}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Client Portfolio</h2>
            <p className="text-muted-foreground">
              Manage your strategic consulting clients and track their progress
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/clients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {error && (
          <EmptyState
            title="Clients unavailable"
            description="We couldn't load your client portfolio."
            icon={<Users className="h-8 w-8" />}
          />
        )}

        {!error && (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Clients</TabsTrigger>
              <TabsTrigger value="DESIRABILITY">Discovery</TabsTrigger>
              <TabsTrigger value="FEASIBILITY">Validation</TabsTrigger>
              <TabsTrigger value="VIABILITY">Scaling</TabsTrigger>
              <TabsTrigger value="SCALE">Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projects.length}</div>
                    <p className="text-xs text-muted-foreground">Active clients</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Evidence Quality</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{averageEvidenceQuality}%</div>
                    <p className="text-xs text-muted-foreground">Across projects</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Evidence</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {projects.reduce((sum, client) => sum + (client.evidenceCount || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Evidence items captured</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Stages</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Set(projects.map((client) => client.stage)).size}
                    </div>
                    <p className="text-xs text-muted-foreground">Stages in motion</p>
                  </CardContent>
                </Card>
              </div>

              {filteredClients.length === 0 ? (
                <EmptyState
                  title="No clients yet"
                  description="Add your first client to get started."
                  icon={<Users className="h-8 w-8" />}
                  action={
                    <Link href="/clients/new">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredClients.map((client) => (
                    <Card key={client.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={stageColors[client.stage]}>
                              {stageLabels[client.stage]}
                            </Badge>
                            <CardTitle className="text-lg">{client.clientName}</CardTitle>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          Last activity: {client.lastActivity}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Evidence Quality</span>
                          <span className="font-medium">{Math.round(client.evidenceQuality || 0)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Gate Status</span>
                          <Badge variant="outline">{client.gateStatus}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
