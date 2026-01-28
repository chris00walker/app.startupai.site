/**
 * @story US-C03
 */
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface RiskBudgetWidgetProps {
  planned: number
  actual: number
  delta: number
  projectName?: string
  className?: string
}

export function RiskBudgetWidget({ 
  planned, 
  actual, 
  delta, 
  projectName,
  className = "" 
}: RiskBudgetWidgetProps) {
  const percentage = (actual / planned) * 100
  const deltaPercentage = delta * 100
  
  const getRiskLevel = () => {
    if (delta <= 0) return 'low'
    if (delta <= 0.2) return 'medium'
    return 'high'
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          badge: 'default' as const,
          progress: 'bg-green-500'
        }
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
          badge: 'secondary' as const,
          progress: 'bg-yellow-500'
        }
      case 'high':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          badge: 'destructive' as const,
          progress: 'bg-red-500'
        }
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          badge: 'outline' as const,
          progress: 'bg-gray-500'
        }
    }
  }

  const riskLevel = getRiskLevel()
  const colors = getRiskColor(riskLevel)

  const getTrendIcon = () => {
    if (delta > 0.05) return <TrendingUp className="h-4 w-4" />
    if (delta < -0.05) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'low': return 'Low Risk'
      case 'medium': return 'Medium Risk'
      case 'high': return 'High Risk'
      default: return 'Unknown'
    }
  }

  return (
    <Card className={`${colors.bg} ${colors.border} border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`text-sm font-medium ${colors.text}`}>
              Risk Budget
            </CardTitle>
            {projectName && (
              <CardDescription className="text-xs">
                {projectName}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={colors.badge} className="text-xs">
              {getRiskLabel(riskLevel)}
            </Badge>
            {riskLevel === 'high' && (
              <AlertTriangle className={`h-4 w-4 ${colors.text}`} />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Actual vs Planned</span>
            <span className={`font-medium ${colors.text}`}>
              {percentage.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={Math.min(percentage, 100)} 
            className="h-2"
          />
        </div>

        {/* Risk Metrics */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">Planned</div>
            <div className="font-semibold">{planned.toFixed(1)}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Actual</div>
            <div className="font-semibold">{actual.toFixed(1)}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Delta</div>
            <div className={`font-semibold flex items-center justify-center gap-1 ${colors.text}`}>
              {getTrendIcon()}
              {deltaPercentage > 0 ? '+' : ''}{deltaPercentage.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Risk Alert */}
        {riskLevel === 'high' && (
          <div className={`text-xs p-2 rounded ${colors.bg} ${colors.border} border`}>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium">Risk Alert:</span>
            </div>
            <span>Budget exceeded by {deltaPercentage.toFixed(0)}%. Review required.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
