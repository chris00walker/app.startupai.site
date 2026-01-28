/**
 * @story US-F06, US-F16
 */
/**
 * Desirability Section
 *
 * Displays all desirability-related fields from CrewAI analysis:
 * - Innovation Physics signal
 * - Customer profiles and value maps
 * - Competitor report
 * - Analysis insights
 * - Experiments and ad metrics
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Users,
  Target,
  Lightbulb,
  TrendingUp,
  Beaker,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DesirabilityReportSection } from '@/lib/reports/field-extractors'
import { FounderBadge } from '@/components/founders'

interface DesirabilityProps {
  data: DesirabilityReportSection
}

const signalConfig = {
  no_signal: { label: 'No Signal', color: 'bg-gray-100 text-gray-600', icon: Minus },
  no_interest: { label: 'No Interest', color: 'bg-red-100 text-red-600', icon: XCircle },
  weak_interest: { label: 'Weak Interest', color: 'bg-yellow-100 text-yellow-600', icon: AlertTriangle },
  strong_commitment: { label: 'Strong Commitment', color: 'bg-green-100 text-green-600', icon: CheckCircle },
}

const problemFitConfig = {
  unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-600' },
  no_fit: { label: 'No Fit', color: 'bg-red-100 text-red-600' },
  partial_fit: { label: 'Partial Fit', color: 'bg-yellow-100 text-yellow-600' },
  strong_fit: { label: 'Strong Fit', color: 'bg-green-100 text-green-600' },
}

export function DesirabilitySection({ data }: DesirabilityProps) {
  const signal = signalConfig[data.signal]
  const problemFit = problemFitConfig[data.problemFit]
  const SignalIcon = signal.icon

  const segmentCount = Object.keys(data.customerProfiles).length
  const hasCompetitors = data.competitorReport && data.competitorReport.competitors?.length > 0

  return (
    <div className="space-y-6">
      {/* Signal Overview */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <FounderBadge founderId="compass" variant="minimal" size="sm" />
          <Badge className={cn('gap-1', signal.color)}>
            <SignalIcon className="h-3 w-3" />
            {signal.label}
          </Badge>
        </div>
        <Badge className={problemFit.color}>{problemFit.label}</Badge>
        {segmentCount > 0 && (
          <Badge variant="outline">{segmentCount} segment{segmentCount > 1 ? 's' : ''}</Badge>
        )}
      </div>

      {/* Evidence Summary */}
      {data.evidence && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Evidence Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Problem Resonance"
                value={`${(data.evidence.problem_resonance * 100).toFixed(0)}%`}
                progress={data.evidence.problem_resonance * 100}
              />
              <MetricCard
                label="Conversion Rate"
                value={`${(data.evidence.conversion_rate * 100).toFixed(1)}%`}
                progress={Math.min(data.evidence.conversion_rate * 100, 100)}
              />
              <MetricCard
                label="Commitment"
                value={formatCommitment(data.evidence.commitment_depth)}
              />
              <MetricCard
                label="Zombie Ratio"
                value={`${(data.evidence.zombie_ratio * 100).toFixed(0)}%`}
                progress={data.evidence.zombie_ratio * 100}
                inverted
              />
            </div>

            {/* Key Learnings */}
            {data.evidence.key_learnings?.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Key Learnings</h4>
                <ul className="space-y-1">
                  {data.evidence.key_learnings.map((learning, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{learning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Profiles */}
      {segmentCount > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer Profiles
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(data.customerProfiles).map(([key, profile]) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      {profile.segment_name || key}
                      {profile.resonance_score && (
                        <Badge variant="outline" className="text-xs">
                          {(profile.resonance_score * 100).toFixed(0)}% resonance
                        </Badge>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {/* Jobs */}
                      {profile.jobs?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Jobs to be Done
                          </p>
                          <div className="space-y-2">
                            {profile.jobs.map((job, i) => (
                              <div key={i} className="p-2 bg-muted/50 rounded text-sm">
                                <p><strong>Functional:</strong> {job.functional}</p>
                                <p><strong>Emotional:</strong> {job.emotional}</p>
                                <p><strong>Social:</strong> {job.social}</p>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  Importance: {job.importance}/10
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pains */}
                      {profile.pains?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Pains</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.pains.map((pain, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {pain}
                                {profile.pain_intensity?.[pain] && (
                                  <span className="ml-1 text-muted-foreground">
                                    ({profile.pain_intensity[pain]}/10)
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Gains */}
                      {profile.gains?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Gains</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.gains.map((gain, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {gain}
                                {profile.gain_importance?.[gain] && (
                                  <span className="ml-1 text-muted-foreground">
                                    ({profile.gain_importance[gain]}/10)
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Analysis Insights */}
      {data.analysisInsights.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Analysis Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {data.analysisInsights.map((insight, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-muted-foreground font-medium">{i + 1}.</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Competitor Report */}
      {hasCompetitors && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Competitive Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.competitorReport?.our_positioning && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Our Positioning
                </p>
                <p className="text-sm">{data.competitorReport.our_positioning}</p>
              </div>
            )}

            {data.competitorReport?.differentiation_strategy && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Differentiation Strategy
                </p>
                <p className="text-sm">{data.competitorReport.differentiation_strategy}</p>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competitor</TableHead>
                  <TableHead>Strengths</TableHead>
                  <TableHead>Weaknesses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.competitorReport?.competitors.map((comp, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{comp.competitor_name}</TableCell>
                    <TableCell>
                      <ul className="text-sm space-y-0.5">
                        {comp.strengths.slice(0, 3).map((s, j) => (
                          <li key={j} className="text-green-600">+ {s}</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>
                      <ul className="text-sm space-y-0.5">
                        {comp.weaknesses.slice(0, 3).map((w, j) => (
                          <li key={j} className="text-red-600">- {w}</li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Ad Metrics */}
      {data.adMetrics.impressions > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Beaker className="h-4 w-4" />
              Experiment Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Impressions" value={data.adMetrics.impressions.toLocaleString()} />
              <StatCard label="Clicks" value={data.adMetrics.clicks.toLocaleString()} />
              <StatCard label="Signups" value={data.adMetrics.signups.toLocaleString()} />
              <StatCard label="Spend" value={`$${data.adMetrics.spend.toLocaleString()}`} />
            </div>
            {data.adMetrics.clicks > 0 && (
              <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4">
                <StatCard
                  label="CTR"
                  value={`${((data.adMetrics.clicks / data.adMetrics.impressions) * 100).toFixed(2)}%`}
                />
                <StatCard
                  label="Conversion Rate"
                  value={`${((data.adMetrics.signups / data.adMetrics.clicks) * 100).toFixed(2)}%`}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assumptions */}
      {data.assumptions.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Desirability Assumptions ({data.assumptions.length})
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

// Helper components

function MetricCard({
  label,
  value,
  progress,
  inverted = false,
}: {
  label: string
  value: string
  progress?: number
  inverted?: boolean
}) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {progress !== undefined && (
        <Progress
          value={progress}
          className={cn('h-1 mt-2', inverted && progress > 30 && '[&>div]:bg-red-500')}
        />
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function formatCommitment(depth: string): string {
  const labels: Record<string, string> = {
    skin_in_game: 'Skin in Game',
    verbal: 'Verbal Only',
    none: 'None',
  }
  return labels[depth] || depth
}

export default DesirabilitySection
