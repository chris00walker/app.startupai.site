/**
 * @story US-CP06
 */
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Brain, 
  Palette, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle 
} from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon: React.ComponentType<{ className?: string }>
  progress?: number
}

function MetricCard({ title, value, description, trend, icon: Icon, progress }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className={`h-4 w-4 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </span>
          </div>
        )}
        {progress !== undefined && (
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{progress}% completion rate</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MetricsCards() {
  const metrics = [
    {
      title: "Active Clients",
      value: 24,
      description: "Clients with ongoing projects",
      trend: { value: 12, isPositive: true },
      icon: Users,
    },
    {
      title: "Canvas Generated",
      value: 156,
      description: "AI-generated canvases this month",
      trend: { value: 8, isPositive: true },
      icon: Palette,
    },
    {
      title: "Workflow Success Rate",
      value: "94%",
      description: "AI workflow completion rate",
      progress: 94,
      icon: Brain,
    },
    {
      title: "Cost Efficiency",
      value: "$1.2",
      description: "Average cost per canvas",
      trend: { value: 15, isPositive: false },
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  )
}
