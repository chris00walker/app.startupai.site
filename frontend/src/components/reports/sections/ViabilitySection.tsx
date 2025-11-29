/**
 * Viability Section
 *
 * Displays all viability-related fields from CrewAI analysis:
 * - Innovation Physics signal
 * - Unit economics (CAC, LTV, ratio)
 * - Detailed viability metrics
 * - Business model type
 * - Assumptions
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
  PieChart,
  Target,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViabilityReportSection } from '@/lib/reports/field-extractors'
import { formatCurrency, formatPercent, formatRatio } from '@/lib/reports/field-extractors'
import { FounderBadge } from '@/components/founders'

interface ViabilityProps {
  data: ViabilityReportSection
}

const signalConfig = {
  unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-600', icon: Minus },
  profitable: { label: 'Profitable', color: 'bg-green-100 text-green-600', icon: CheckCircle },
  marginal: { label: 'Marginal', color: 'bg-yellow-100 text-yellow-600', icon: AlertTriangle },
  underwater: { label: 'Underwater', color: 'bg-red-100 text-red-600', icon: XCircle },
  zombie_market: { label: 'Zombie Market', color: 'bg-purple-100 text-purple-600', icon: AlertTriangle },
}

const businessModelLabels: Record<string, string> = {
  saas_b2b_smb: 'SaaS B2B (SMB)',
  saas_b2b_midmarket: 'SaaS B2B (Mid-Market)',
  saas_b2b_enterprise: 'SaaS B2B (Enterprise)',
  saas_b2c_freemium: 'SaaS B2C (Freemium)',
  saas_b2c_subscription: 'SaaS B2C (Subscription)',
  ecommerce_dtc: 'E-Commerce (DTC)',
  ecommerce_marketplace: 'Marketplace',
  fintech_b2b: 'FinTech B2B',
  fintech_b2c: 'FinTech B2C',
  consulting: 'Consulting',
  unknown: 'Unknown',
}

export function ViabilitySection({ data }: ViabilityProps) {
  const signal = signalConfig[data.signal]
  const SignalIcon = signal.icon

  const hasEvidence = data.evidence !== null
  const hasMetrics = data.metrics !== null

  // Calculate LTV/CAC health
  const ltvCacHealth =
    data.ltvCacRatio >= 3
      ? 'healthy'
      : data.ltvCacRatio >= 1
      ? 'marginal'
      : data.ltvCacRatio > 0
      ? 'unhealthy'
      : 'unknown'

  return (
    <div className="space-y-6">
      {/* Signal Overview */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <FounderBadge founderId="ledger" variant="minimal" size="sm" />
          <Badge className={cn('gap-1', signal.color)}>
            <SignalIcon className="h-3 w-3" />
            {signal.label}
          </Badge>
        </div>
        {data.businessModelType && (
          <Badge variant="outline">
            {businessModelLabels[data.businessModelType] || data.businessModelType}
          </Badge>
        )}
        {data.ltvCacRatio > 0 && (
          <Badge
            className={cn(
              ltvCacHealth === 'healthy'
                ? 'bg-green-100 text-green-600'
                : ltvCacHealth === 'marginal'
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-red-100 text-red-600'
            )}
          >
            LTV/CAC: {formatRatio(data.ltvCacRatio)}x
          </Badge>
        )}
      </div>

      {/* Key Metrics */}
      {(data.cac > 0 || data.ltv > 0 || data.tam > 0) && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Unit Economics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="CAC"
                value={formatCurrency(data.cac)}
                description="Customer Acquisition Cost"
                trend="down"
              />
              <MetricCard
                label="LTV"
                value={formatCurrency(data.ltv)}
                description="Lifetime Value"
                trend="up"
              />
              <MetricCard
                label="LTV/CAC Ratio"
                value={`${formatRatio(data.ltvCacRatio)}x`}
                description={data.ltvCacRatio >= 3 ? 'Healthy' : data.ltvCacRatio >= 1 ? 'Marginal' : 'Unhealthy'}
                highlight={data.ltvCacRatio >= 3}
              />
              <MetricCard
                label="Gross Margin"
                value={formatPercent(data.grossMargin)}
                description="Revenue after COGS"
              />
            </div>

            {/* TAM */}
            {data.tam > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Addressable Market</p>
                      <p className="text-xs text-muted-foreground">Annual revenue potential</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(data.tam)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evidence Details */}
      {hasEvidence && data.evidence && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Viability Evidence
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Payback Period</p>
                <p className="text-lg font-semibold">{data.evidence.payback_months} months</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Break-even Customers</p>
                <p className="text-lg font-semibold">
                  {data.evidence.break_even_customers.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Market Share Target</p>
                <p className="text-lg font-semibold">
                  {formatPercent(data.evidence.market_share_target)}
                </p>
              </div>
            </div>

            {/* Viability Assessment */}
            {data.evidence.viability_assessment && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Assessment
                </p>
                <p className="text-sm">{data.evidence.viability_assessment}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      {hasMetrics && data.metrics && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Detailed Financial Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {/* CAC Breakdown */}
              {Object.keys(data.metrics.cac_breakdown || {}).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">CAC Breakdown</p>
                  <div className="space-y-2">
                    {Object.entries(data.metrics.cac_breakdown).map(([channel, cost]) => (
                      <div
                        key={channel}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <span className="text-sm">{channel}</span>
                        <span className="text-sm font-medium">{formatCurrency(cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LTV Breakdown */}
              {Object.keys(data.metrics.ltv_breakdown || {}).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">LTV Breakdown</p>
                  <div className="space-y-2">
                    {Object.entries(data.metrics.ltv_breakdown).map(([component, value]) => (
                      <div
                        key={component}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <span className="text-sm">{component}</span>
                        <span className="text-sm font-medium">{formatCurrency(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Metrics */}
            <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Monthly Churn</p>
                <p className="text-lg font-semibold">
                  {formatPercent(data.metrics.monthly_churn_pct)}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Payback Months</p>
                <p className="text-lg font-semibold">{data.metrics.payback_months}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">TAM Potential</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(data.metrics.tam_annual_revenue_potential_usd)}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Benchmark</p>
                <p className="text-sm font-medium">{data.metrics.benchmark_source || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Model */}
      {(data.businessModelType || data.revenueModel) && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Model
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {data.businessModelType && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Model Type</p>
                  <p className="text-sm font-medium">
                    {businessModelLabels[data.businessModelType] || data.businessModelType}
                  </p>
                </div>
              )}
              {data.revenueModel && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Revenue Model</p>
                  <p className="text-sm">{data.revenueModel}</p>
                </div>
              )}
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
              Viability Assumptions ({data.assumptions.length})
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

// Helper component
function MetricCard({
  label,
  value,
  description,
  trend,
  highlight = false,
}: {
  label: string
  value: string
  description?: string
  trend?: 'up' | 'down'
  highlight?: boolean
}) {
  return (
    <div className={cn('p-3 rounded-lg', highlight ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/50')}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {trend && (
          <span className={cn(trend === 'up' ? 'text-green-500' : 'text-red-500')}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          </span>
        )}
      </div>
      <p className="text-lg font-semibold">{value}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  )
}

export default ViabilitySection
