/**
 * PortfolioMetrics Component
 *
 * Displays aggregated metrics for consultant's client portfolio.
 *
 * @story US-C03
 */

"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Users,
  FileText
} from "lucide-react"
import { PortfolioMetrics as PortfolioMetricsType } from "@/types/portfolio"

interface PortfolioMetricsProps {
  metrics: PortfolioMetricsType
  className?: string
}

export function PortfolioMetrics({ metrics, className = "" }: PortfolioMetricsProps) {
  const totalProjects = Object.values(metrics.activeProjectsByStage).reduce((sum, count) => sum + count, 0)
  
  const getPassRateColor = (rate: number) => {
    if (rate >= 0.8) return "text-green-600"
    if (rate >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 0.9) return "text-green-600"
    if (coverage >= 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  const getOverrideRateColor = (rate: number) => {
    if (rate <= 0.1) return "text-green-600"
    if (rate <= 0.2) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {/* Active Projects by Stage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProjects}</div>
          <div className="space-y-2 mt-3">
            {Object.entries(metrics.activeProjectsByStage).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground capitalize">
                  {stage.toLowerCase()}
                </span>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gate Pass Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gate Pass Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getPassRateColor(metrics.gatePassRate)}`}>
            {(metrics.gatePassRate * 100).toFixed(0)}%
          </div>
          <div className="mt-3">
            <Progress value={metrics.gatePassRate * 100} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Success rate across all gates
          </p>
        </CardContent>
      </Card>

      {/* Average Cycle Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Cycle Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.averageCycleTime.toFixed(0)}d
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Days per validation stage
          </p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600">12% faster</span>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Coverage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Evidence Coverage</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getCoverageColor(metrics.evidenceCoverage)}`}>
            {(metrics.evidenceCoverage * 100).toFixed(0)}%
          </div>
          <div className="mt-3">
            <Progress value={metrics.evidenceCoverage * 100} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Hypotheses with evidence
          </p>
        </CardContent>
      </Card>

      {/* Override Rate - Governance Metric */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Override Rate</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getOverrideRateColor(metrics.overrideRate)}`}>
            {(metrics.overrideRate * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Gate bypasses (governance)
          </p>
          {metrics.overrideRate > 0.2 && (
            <div className="flex items-center gap-1 mt-2 text-red-600">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Review required</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Health Summary */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Portfolio Health</CardTitle>
          <CardDescription>Key performance indicators across all projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {Object.values(metrics.activeProjectsByStage).filter((_, i) => i >= 2).reduce((sum, count) => sum + count, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Advanced Stage</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {(metrics.gatePassRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {metrics.averageCycleTime.toFixed(0)}d
              </div>
              <div className="text-xs text-muted-foreground">Avg Cycle</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
