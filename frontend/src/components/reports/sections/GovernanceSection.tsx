/**
 * @story US-F06, US-F16
 */
/**
 * Governance Section
 *
 * Displays governance and QA fields from CrewAI analysis:
 * - QA reports and compliance
 * - Evidence summary and recommendations
 * - Next steps
 * - Pivot recommendations
 * - Human approval status
 * - Budget tracking
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  User,
  FileCheck,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GovernanceReportSection } from '@/lib/reports/field-extractors'
import { formatCurrency, formatPercent } from '@/lib/reports/field-extractors'
import { FounderBadge } from '@/components/founders'
import { getPivotInfo } from '@/types/crewai'

interface GovernanceProps {
  data: GovernanceReportSection
}

const qaStatusConfig = {
  passed: { label: 'Passed', color: 'bg-green-100 text-green-600', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-600', icon: XCircle },
  conditional: { label: 'Conditional', color: 'bg-yellow-100 text-yellow-600', icon: AlertTriangle },
  escalated: { label: 'Escalated', color: 'bg-orange-100 text-orange-600', icon: AlertTriangle },
}

const budgetStatusConfig = {
  ok: { label: 'OK', color: 'bg-green-100 text-green-600' },
  warning: { label: 'Warning', color: 'bg-yellow-100 text-yellow-600' },
  exceeded: { label: 'Exceeded', color: 'bg-red-100 text-red-600' },
  kill: { label: 'Kill', color: 'bg-red-100 text-red-600' },
}

export function GovernanceSection({ data }: GovernanceProps) {
  const qaStatus = data.currentQaStatus ? qaStatusConfig[data.currentQaStatus] : null
  const budgetStatus = budgetStatusConfig[data.budgetStatus]

  const hasPivotRecommendation =
    data.pivotRecommendation && data.pivotRecommendation !== 'none'
  const hasQAReports = data.qaReports.length > 0

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <FounderBadge founderId="guardian" variant="minimal" size="sm" />
          {qaStatus && (
            <Badge className={cn('gap-1', qaStatus.color)}>
              <qaStatus.icon className="h-3 w-3" />
              QA: {qaStatus.label}
            </Badge>
          )}
        </div>
        <Badge className={budgetStatus.color}>Budget: {budgetStatus.label}</Badge>
        {data.synthesisConfidence > 0 && (
          <Badge variant="outline">
            Confidence: {formatPercent(data.synthesisConfidence)}
          </Badge>
        )}
      </div>

      {/* Pivot Recommendation Alert */}
      {hasPivotRecommendation && (
        <Alert
          variant={data.pivotRecommendation === 'kill' ? 'destructive' : 'default'}
          className={cn(
            data.pivotRecommendation !== 'kill' && 'border-orange-200 bg-orange-50'
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {getPivotInfo(data.pivotRecommendation!).label} Recommended
          </AlertTitle>
          <AlertDescription>
            {getPivotInfo(data.pivotRecommendation!).description}
          </AlertDescription>
        </Alert>
      )}

      {/* Final Recommendation */}
      {data.finalRecommendation && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Final Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{data.finalRecommendation}</p>
          </CardContent>
        </Card>
      )}

      {/* Evidence Summary */}
      {data.evidenceSummary && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Evidence Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{data.evidenceSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {data.nextSteps.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ol className="space-y-2">
              {data.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="text-sm pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* QA Compliance */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            QA Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <ComplianceIndicator
              label="Framework Compliance"
              passed={data.frameworkCompliance}
            />
            <ComplianceIndicator
              label="Logical Consistency"
              passed={data.logicalConsistency}
            />
            <ComplianceIndicator
              label="Completeness"
              passed={data.completeness}
            />
          </div>

          {/* QA Reports */}
          {hasQAReports && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                QA Reports ({data.qaReports.length})
              </p>
              <div className="space-y-2">
                {data.qaReports.map((report, i) => {
                  const status = qaStatusConfig[report.status]
                  return (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={status.color}>
                          <status.icon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Confidence: {formatPercent(report.confidence_score)}
                        </span>
                      </div>

                      {report.specific_issues?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Issues:</p>
                          <ul className="text-sm space-y-0.5">
                            {report.specific_issues.map((issue, j) => (
                              <li key={j} className="flex items-start gap-1">
                                <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {report.required_changes?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Required Changes:</p>
                          <ul className="text-sm space-y-0.5">
                            {report.required_changes.map((change, j) => (
                              <li key={j} className="flex items-start gap-1">
                                <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 shrink-0" />
                                <span>{change}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Human Approval Status */}
      {(data.humanInputRequired || data.humanApprovalStatus) && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Human-in-the-Loop
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {data.humanInputRequired && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Human Input Required</AlertTitle>
                  <AlertDescription>
                    {data.humanInputReason || 'A decision requires human approval.'}
                  </AlertDescription>
                </Alert>
              )}

              {data.humanApprovalStatus && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Approval Status</span>
                  <Badge
                    variant={
                      data.humanApprovalStatus === 'approved'
                        ? 'default'
                        : data.humanApprovalStatus === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {data.humanApprovalStatus}
                  </Badge>
                </div>
              )}

              {data.humanComment && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Human Comment</p>
                  <p className="text-sm">{data.humanComment}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Tracking */}
      {(data.dailySpendUsd > 0 || data.campaignSpendUsd > 0) && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Daily Spend</p>
                <p className="text-lg font-semibold">{formatCurrency(data.dailySpendUsd)}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Campaign Spend</p>
                <p className="text-lg font-semibold">{formatCurrency(data.campaignSpendUsd)}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Escalation</p>
                <p className="text-lg font-semibold">
                  {data.budgetEscalationTriggered ? (
                    <AlertTriangle className="h-5 w-5 text-orange-500 mx-auto" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  )}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Kill Triggered</p>
                <p className="text-lg font-semibold">
                  {data.budgetKillTriggered ? (
                    <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ComplianceIndicator({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg text-center',
        passed ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
      )}
    >
      <div className="flex justify-center mb-1">
        {passed ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
      <p className="text-xs font-medium">{label}</p>
    </div>
  )
}

export default GovernanceSection
