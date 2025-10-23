import React, { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Plus, 
  Search, 
  Eye, 
  MoreVertical, 
  TrendingUp, 
  Calendar,
  Building,
  Target
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDemoMode } from "@/hooks/useDemoMode"
import { getDemoClient } from "@/data/demoData"

interface Client {
  id: string
  name: string
  industry: string
  description: string
  stage: "discovery" | "validation" | "scaling" | "optimization"
  createdAt: string
  lastActivity: string
  canvasCount: number
  completionRate: number
  revenue?: string
}

export default function ClientsPage() {
  const demoMode = useDemoMode()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Get demo data using lazy loading function
  const demoClient = getDemoClient()

  // Demo clients data
  const demoClients: Client[] = [
    {
      id: demoClient.id,
      name: demoClient.name,
      industry: demoClient.industry,
      description: demoClient.description,
      stage: demoClient.stage as "validation",
      createdAt: demoClient.createdAt,
      lastActivity: "2 hours ago",
      canvasCount: 3,
      completionRate: 85,
      revenue: "$50K ARR"
    },
    {
      id: "client-2",
      name: "EcoSmart Solutions",
      industry: "Sustainable Technology",
      description: "IoT-based smart home energy management system",
      stage: "scaling",
      createdAt: "2024-01-10",
      lastActivity: "1 day ago",
      canvasCount: 5,
      completionRate: 92,
      revenue: "$120K ARR"
    },
    {
      id: "client-3",
      name: "FinanceFlow Pro",
      industry: "Financial Technology",
      description: "AI-powered personal finance management platform",
      stage: "discovery",
      createdAt: "2024-02-01",
      lastActivity: "3 days ago",
      canvasCount: 2,
      completionRate: 45,
      revenue: "Pre-revenue"
    },
    {
      id: "client-4",
      name: "HealthTrack Analytics",
      industry: "Healthcare Technology",
      description: "Predictive analytics for patient care optimization",
      stage: "optimization",
      createdAt: "2023-11-15",
      lastActivity: "1 week ago",
      canvasCount: 8,
      completionRate: 98,
      revenue: "$300K ARR"
    }
  ]

  const clients = demoMode.isDemo ? demoClients : []

  // Filter clients based on search and tab
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.industry.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeTab === "all") return matchesSearch
    return matchesSearch && client.stage === activeTab
  })

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "discovery": return "bg-blue-100 text-blue-800"
      case "validation": return "bg-yellow-100 text-yellow-800"
      case "scaling": return "bg-green-100 text-green-800"
      case "optimization": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "discovery": return <Search className="h-4 w-4" />
      case "validation": return <Target className="h-4 w-4" />
      case "scaling": return <TrendingUp className="h-4 w-4" />
      case "optimization": return <Building className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Client Portfolio", href: "/clients" },
      ]}
    >
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header */}
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

        {/* Search and Filters */}
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

        {/* Tabs for filtering by stage */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Clients</TabsTrigger>
            <TabsTrigger value="discovery">Discovery</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="scaling">Scaling</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Client Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clients.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {demoMode.isDemo ? "Demo data" : "Active clients"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {clients.reduce((sum, client) => sum + client.canvasCount, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total canvases
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {clients.length > 0 
                      ? Math.round(clients.reduce((sum, client) => sum + client.completionRate, 0) / clients.length)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Project progress
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$470K</div>
                  <p className="text-xs text-muted-foreground">
                    Total ARR tracked
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Client Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStageIcon(client.stage)}
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/client/${client.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="text-sm">
                      {client.industry}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {client.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getStageColor(client.stage)} variant="secondary">
                        {client.stage.charAt(0).toUpperCase() + client.stage.slice(1)}
                      </Badge>
                      <span className="text-sm font-medium text-green-600">
                        {client.revenue}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{client.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${client.completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {client.lastActivity}
                      </div>
                      <span>{client.canvasCount} canvases</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredClients.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No clients found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? "Try adjusting your search terms" 
                      : "Get started by adding your first client"}
                  </p>
                  {!searchTerm && (
                    <Link href="/clients/new">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
