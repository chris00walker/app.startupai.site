/**
 * Feasibility Section
 *
 * Displays all feasibility-related fields from CrewAI analysis:
 * - Innovation Physics signal
 * - Build artifact and features
 * - Cost breakdown (API, infra)
 * - Technical risks
 * - Assumptions
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Wrench,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
  DollarSign,
  Cpu,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeasibilityReportSection } from '@/lib/reports/field-extractors'
import { formatCurrency } from '@/lib/reports/field-extractors'
import { FounderBadge } from '@/components/founders'

interface FeasibilityProps {
  data: FeasibilityReportSection
}

const signalConfig = {
  unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-600', icon: Minus },
  green: { label: 'Green - Feasible', color: 'bg-green-100 text-green-600', icon: CheckCircle },
  orange_constrained: { label: 'Constrained', color: 'bg-orange-100 text-orange-600', icon: AlertTriangle },
  red_impossible: { label: 'Impossible', color: 'bg-red-100 text-red-600', icon: XCircle },
}

const featureStatusConfig = {
  POSSIBLE: { label: 'Possible', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  CONSTRAINED: { label: 'Constrained', color: 'text-orange-600 bg-orange-50', icon: AlertTriangle },
  IMPOSSIBLE: { label: 'Impossible', color: 'text-red-600 bg-red-50', icon: XCircle },
}

export function FeasibilitySection({ data }: FeasibilityProps) {
  const signal = signalConfig[data.signal]
  const SignalIcon = signal.icon

  const hasEvidence = data.evidence !== null
  const hasArtifact = data.artifact !== null
  const hasApiCosts = Object.keys(data.apiCosts).length > 0
  const hasInfraCosts = Object.keys(data.infraCosts).length > 0

  return (
    <div className="space-y-6">
      {/* Signal Overview */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <FounderBadge founderId="forge" variant="minimal" size="sm" />
          <Badge className={cn('gap-1', signal.color)}>
            <SignalIcon className="h-3 w-3" />
            {signal.label}
          </Badge>
        </div>
        {data.downgradeActive && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Scope Reduction Active
          </Badge>
        )}
        {data.totalMonthlyCost > 0 && (
          <Badge variant="outline">
            {formatCurrency(data.totalMonthlyCost)}/month
          </Badge>
        )}
      </div>

      {/* Evidence Summary */}
      {hasEvidence && data.evidence && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Feasibility Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Feature Feasibility */}
            {Object.keys(data.evidence.core_features_feasible).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Core Features</p>
                <div className="grid gap-2">
                  {Object.entries(data.evidence.core_features_feasible).map(([feature, status]) => {
                    const config = featureStatusConfig[status] || featureStatusConfig.POSSIBLE
                    const StatusIcon = config.icon
                    return (
                      <div
                        key={feature}
                        className={cn(
                          'flex items-center justify-between p-2 rounded',
                          config.color
                        )}
                      >
                        <span className="text-sm font-medium">{feature}</span>
                        <div className="flex items-center gap-1">
                          <StatusIcon className="h-4 w-4" />
                          <span className="text-xs">{config.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Technical Risks */}
            {data.evidence.technical_risks?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Technical Risks</p>
                <ul className="space-y-1">
                  {data.evidence.technical_risks.map((risk, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Removed Features */}
            {data.evidence.removed_features?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Features Removed for Feasibility
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.evidence.removed_features.map((feature, i) => (
                    <Badge key={i} variant="outline" className="text-xs line-through opacity-70">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Alternative Approaches */}
            {data.evidence.alternative_approaches?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Alternative Approaches
                </p>
                <ul className="space-y-1">
                  {data.evidence.alternative_approaches.map((approach, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Zap className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <span>{approach}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cost Estimate */}
            {data.evidence.monthly_cost_estimate_usd > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Estimated Monthly Cost</p>
                <p className="text-xl font-bold">
                  {formatCurrency(data.evidence.monthly_cost_estimate_usd)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Build Artifact */}
      {hasArtifact && data.artifact && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Build Artifact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Build ID</p>
                <p className="text-sm font-mono">{data.artifact.build_id}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Complexity Score</p>
                <p className="text-lg font-semibold">{data.artifact.technical_complexity_score}/10</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Monthly Cost</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(data.artifact.total_monthly_cost_usd)}
                </p>
              </div>
            </div>

            {/* Features Table */}
            {data.artifact.features?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Features</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Complexity</TableHead>
                      <TableHead>Cost/mo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.artifact.features.map((feature) => (
                      <TableRow key={feature.feature_id}>
                        <TableCell className="font-medium">{feature.feature_name}</TableCell>
                        <TableCell>
                          <Progress value={feature.complexity * 10} className="w-16 h-2" />
                        </TableCell>
                        <TableCell>{formatCurrency(feature.monthly_cost_usd)}</TableCell>
                        <TableCell>
                          {feature.enabled ? (
                            <Badge variant="default" className="text-xs">Enabled</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Disabled</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      {(hasApiCosts || hasInfraCosts) && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {/* API Costs */}
              {hasApiCosts && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">API Costs</p>
                  <div className="space-y-2">
                    {Object.entries(data.apiCosts).map(([service, cost]) => (
                      <div
                        key={service}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <span className="text-sm">{service}</span>
                        <span className="text-sm font-medium">{formatCurrency(cost)}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Infra Costs */}
              {hasInfraCosts && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Infrastructure Costs
                  </p>
                  <div className="space-y-2">
                    {Object.entries(data.infraCosts).map(([resource, cost]) => (
                      <div
                        key={resource}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <span className="text-sm">{resource}</span>
                        <span className="text-sm font-medium">{formatCurrency(cost)}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="font-medium">Total Monthly Cost</span>
              <span className="text-xl font-bold">{formatCurrency(data.totalMonthlyCost)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assumptions */}
      {data.assumptions.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Feasibility Assumptions ({data.assumptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {data.assumptions.map((assumption) => (
                <div
                  key={assumption.id}
                  className="p-3 border rounded-lg flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <p className="text-sm">{assumption.statement}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Evidence needed: {assumption.evidence_needed}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        assumption.status === 'validated'
                          ? 'default'
                          : assumption.status === 'invalidated'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {assumption.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Priority: {assumption.priority}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FeasibilitySection
