"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { FitDashboard } from "@/components/fit/FitDashboard"
import HypothesisManager from "@/components/hypothesis/HypothesisManager"
import { EvidenceLedger } from "@/components/fit/EvidenceLedger"
import { ExperimentsPage } from "@/components/fit/ExperimentsPage"
import { StageSelector } from "@/components/founder/StageSelector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Target,
  FileText,
  Beaker,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"

function QuickStats() {
  const stats = [
    {
      label: "Overall Fit Score",
      value: "59%",
      change: "+12% this week",
      trend: "up",
      icon: Target,
      color: "text-blue-600"
    },
    {
      label: "Evidence Items",
      value: "23",
      change: "5 contradictions",
      trend: "warning",
      icon: FileText,
      color: "text-green-600"
    },
    {
      label: "Active Experiments",
      value: "2",
      change: "3 completed",
      trend: "neutral",
      icon: Beaker,
      color: "text-purple-600"
    },
    {
      label: "Next Milestone",
      value: "Feasibility",
      change: "15 points needed",
      trend: "neutral",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {stat.trend === "warning" && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                    {stat.trend === "neutral" && <Clock className="h-3 w-3 text-gray-500" />}
                    <span className={`text-xs ${
                      stat.trend === "up" ? "text-green-600" :
                      stat.trend === "warning" ? "text-yellow-600" : 
                      "text-muted-foreground"
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-muted`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function RecentActivity() {
  const activities = [
    {
      id: "1",
      type: "evidence",
      title: "New evidence added",
      description: "Customer Interview #12 - Strong evidence for Desirability",
      time: "2 hours ago",
      icon: FileText,
      color: "text-green-500"
    },
    {
      id: "2", 
      type: "experiment",
      title: "Experiment completed",
      description: "Technical Architecture Review - Updated Feasibility score",
      time: "1 day ago",
      icon: CheckCircle,
      color: "text-blue-500"
    },
    {
      id: "3",
      type: "contradiction",
      title: "Contradiction detected",
      description: "Price Sensitivity Survey conflicts with previous assumptions",
      time: "3 days ago",
      icon: AlertTriangle,
      color: "text-red-500"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest updates to your validation project</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-muted">
                  <Icon className={`h-3 w-3 ${activity.color}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function NextSteps() {
  const steps = [
    {
      id: "1",
      title: "Complete Customer Interview Round 2",
      description: "Gather more evidence for Desirability validation",
      priority: "High",
      estimatedTime: "2 weeks"
    },
    {
      id: "2",
      title: "Address Price Sensitivity Contradiction",
      description: "Resolve conflicting evidence about pricing assumptions",
      priority: "Medium", 
      estimatedTime: "1 week"
    },
    {
      id: "3",
      title: "Continue MVP Prototype Development",
      description: "Progress on technical feasibility validation",
      priority: "High",
      estimatedTime: "6 weeks"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
        <CardDescription>AI-suggested actions to improve your fit scores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">{step.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={step.priority === "High" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {step.priority} Priority
                  </Badge>
                  <span className="text-xs text-muted-foreground">{step.estimatedTime}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Start
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function FounderDashboard() {
  const [activeTab, setActiveTab] = React.useState('overview')
  
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tabFromUrl = urlParams.get('tab')
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [])

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Founder Dashboard", href: "/founder-dashboard" },
      ]}
      userType="founder"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hypotheses">Hypotheses</TabsTrigger>
            <TabsTrigger value="experiments">Experiments</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <QuickStats />

          {/* Validation Journey Stage Selector */}
          <StageSelector currentStage="validation" className="mb-6" />

          {/* Fit Dashboard */}
          <FitDashboard />

          {/* Bottom Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentActivity />
            <NextSteps />
          </div>
        </TabsContent>

        <TabsContent value="hypotheses" className="space-y-6">
          <HypothesisManager />
        </TabsContent>

        <TabsContent value="experiments">
          <ExperimentsPage />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceLedger />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Advanced analytics and recommendations based on your validation data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Insights Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  We're building advanced AI analytics to provide deeper insights into your validation progress.
                </p>
                <Button variant="outline">
                  Request Early Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
