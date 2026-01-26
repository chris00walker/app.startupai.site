/**
 * CrewAI Report Viewer
 *
 * Main container component for the comprehensive report viewer.
 * Provides dual organization via tabs:
 * - D-F-V Risk Axis view
 * - Strategyzer Phase view
 *
 * Includes PDF export and expand/collapse controls.
 *
 * @story US-F06, US-F16
 */

'use client'

import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Target,
  Wrench,
  DollarSign,
  Shield,
  Lightbulb,
  CheckSquare,
  TrendingUp,
  Building2,
  AlertCircle,
  RefreshCw,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCrewAIReport } from '@/hooks/useCrewAIReport'
import { DesirabilitySection } from './sections/DesirabilitySection'
import { FeasibilitySection } from './sections/FeasibilitySection'
import { ViabilitySection } from './sections/ViabilitySection'
import { GovernanceSection } from './sections/GovernanceSection'
import { PDFExporter } from './export/PDFExporter'

export interface CrewAIReportViewerProps {
  projectId: string
  className?: string
}

const phaseLabels = {
  ideation: 'Ideation',
  desirability: 'Testing Desirability',
  feasibility: 'Testing Feasibility',
  viability: 'Testing Viability',
  validated: 'Validated',
  killed: 'Killed',
}

export function CrewAIReportViewer({ projectId, className }: CrewAIReportViewerProps) {
  const reportRef = useRef<HTMLDivElement>(null!)
  const [expandAll, setExpandAll] = useState(true)
  const [activeTab, setActiveTab] = useState('risk')

  const {
    reportData,
    isLoading,
    error,
    refetch,
    hasData,
    populatedFieldCount,
    hasDesirability,
    hasFeasibility,
    hasViability,
    hasGovernance,
  } = useCrewAIReport({ projectId })

  // Loading state
  if (isLoading) {
    return <ReportViewerSkeleton className={className} />
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Report</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load CrewAI analysis data.</span>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (!hasData || !reportData) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Analysis Report Available</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Run a CrewAI strategic analysis to generate a comprehensive report
            with customer profiles, market analysis, and financial projections.
          </p>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check for Updates
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { metadata } = reportData

  return (
    <div className={cn('space-y-4', className)} ref={reportRef}>
      {/* Report Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">CrewAI Analysis Report</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {phaseLabels[metadata.phase]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Iteration {metadata.iteration}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {populatedFieldCount} fields analyzed
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandAll(!expandAll)}
                className="text-xs"
              >
                {expandAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Expand All
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <PDFExporter
                projectName={metadata.businessIdea || 'Project'}
                reportRef={reportRef}
              />
            </div>
          </div>
        </CardHeader>

        {/* Business Context Summary */}
        {(metadata.businessIdea || metadata.problemStatement) && (
          <CardContent className="pt-0 pb-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              {metadata.businessIdea && (
                <p className="text-sm">
                  <span className="font-medium">Business Idea:</span>{' '}
                  {metadata.businessIdea}
                </p>
              )}
              {metadata.problemStatement && (
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium">Problem:</span>{' '}
                  {metadata.problemStatement}
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Card>
          <CardContent className="pt-4 pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="risk" className="gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">D-F-V Risk Axis</span>
                <span className="sm:hidden">Risk Axis</span>
              </TabsTrigger>
              <TabsTrigger value="phase" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Strategyzer Phase</span>
                <span className="sm:hidden">Phase View</span>
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* D-F-V Risk Axis View */}
        <TabsContent value="risk" className="space-y-4 mt-4">
          {/* Desirability Section */}
          <CollapsibleSection
            title="Desirability"
            subtitle="Do customers want this?"
            icon={Target}
            iconColor="text-pink-500"
            hasData={hasDesirability}
            expanded={expandAll}
          >
            <DesirabilitySection data={reportData.desirability} />
          </CollapsibleSection>

          {/* Feasibility Section */}
          <CollapsibleSection
            title="Feasibility"
            subtitle="Can we build it?"
            icon={Wrench}
            iconColor="text-blue-500"
            hasData={hasFeasibility}
            expanded={expandAll}
          >
            <FeasibilitySection data={reportData.feasibility} />
          </CollapsibleSection>

          {/* Viability Section */}
          <CollapsibleSection
            title="Viability"
            subtitle="Should we build it?"
            icon={DollarSign}
            iconColor="text-green-500"
            hasData={hasViability}
            expanded={expandAll}
          >
            <ViabilitySection data={reportData.viability} />
          </CollapsibleSection>

          {/* Governance Section */}
          <CollapsibleSection
            title="Governance & QA"
            subtitle="Quality assurance and recommendations"
            icon={Shield}
            iconColor="text-purple-500"
            hasData={hasGovernance}
            expanded={expandAll}
          >
            <GovernanceSection data={reportData.governance} />
          </CollapsibleSection>
        </TabsContent>

        {/* Strategyzer Phase View */}
        <TabsContent value="phase" className="space-y-4 mt-4">
          {/* Problem Fit Section */}
          <CollapsibleSection
            title="Problem Fit"
            subtitle="Understanding the customer problem"
            icon={Lightbulb}
            iconColor="text-amber-500"
            hasData={Object.keys(reportData.problemFit.customerProfiles).length > 0}
            expanded={expandAll}
          >
            <ProblemFitContent data={reportData.problemFit} />
          </CollapsibleSection>

          {/* Solution Fit Section */}
          <CollapsibleSection
            title="Solution Fit"
            subtitle="Validating the value proposition"
            icon={CheckSquare}
            iconColor="text-teal-500"
            hasData={Object.keys(reportData.solutionFit.valueMaps).length > 0}
            expanded={expandAll}
          >
            <SolutionFitContent data={reportData.solutionFit} />
          </CollapsibleSection>

          {/* Product-Market Fit Section */}
          <CollapsibleSection
            title="Product-Market Fit"
            subtitle="Technical feasibility and costs"
            icon={TrendingUp}
            iconColor="text-indigo-500"
            hasData={reportData.productMarket.feasibilitySignal !== 'unknown'}
            expanded={expandAll}
          >
            <FeasibilitySection data={reportData.feasibility} />
          </CollapsibleSection>

          {/* Business Model Section */}
          <CollapsibleSection
            title="Business Model"
            subtitle="Unit economics and viability"
            icon={Building2}
            iconColor="text-emerald-500"
            hasData={reportData.businessModel.viabilitySignal !== 'unknown'}
            expanded={expandAll}
          >
            <ViabilitySection data={reportData.viability} />
          </CollapsibleSection>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Collapsible section wrapper
interface CollapsibleSectionProps {
  title: string
  subtitle: string
  icon: React.ElementType
  iconColor: string
  hasData: boolean
  expanded: boolean
  children: React.ReactNode
}

function CollapsibleSection({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  hasData,
  expanded,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(expanded)

  // Sync with parent expand/collapse
  useState(() => {
    setIsOpen(expanded)
  })

  return (
    <Card className={cn(!hasData && 'opacity-60')}>
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={cn('h-5 w-5', iconColor)} />
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasData && (
              <Badge variant="secondary" className="text-xs">
                No data
              </Badge>
            )}
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      {isOpen && hasData && <CardContent>{children}</CardContent>}
    </Card>
  )
}

// Placeholder components for Strategyzer Phase sections
// These reuse the D-F-V section components with different organization

function ProblemFitContent({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Customer Profiles Summary */}
      <div>
        <h4 className="text-sm font-medium mb-2">Customer Segments</h4>
        {Object.keys(data.customerProfiles).length > 0 ? (
          <div className="grid gap-2">
            {Object.entries(data.customerProfiles).map(([key, profile]: [string, any]) => (
              <div key={key} className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">{profile.segment_name || key}</p>
                {profile.jobs?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile.jobs.length} jobs to be done identified
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No customer profiles available</p>
        )}
      </div>

      {/* Problem Fit Indicator */}
      <div>
        <h4 className="text-sm font-medium mb-2">Problem Fit Status</h4>
        <ProblemFitBadge fit={data.problemFit} />
      </div>

      {/* Analysis Insights */}
      {data.analysisInsights.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Key Insights</h4>
          <ul className="space-y-1">
            {data.analysisInsights.map((insight: string, i: number) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SolutionFitContent({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Value Maps Summary */}
      <div>
        <h4 className="text-sm font-medium mb-2">Value Propositions</h4>
        {Object.keys(data.valueMaps).length > 0 ? (
          <div className="grid gap-2">
            {Object.entries(data.valueMaps).map(([key, valueMap]: [string, any]) => (
              <div key={key} className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">{key}</p>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <p>{valueMap.products_services?.length || 0} products/services</p>
                  <p>{Object.keys(valueMap.pain_relievers || {}).length} pain relievers</p>
                  <p>{Object.keys(valueMap.gain_creators || {}).length} gain creators</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No value maps available</p>
        )}
      </div>

      {/* Segment Fit Scores */}
      {Object.keys(data.segmentFitScores).length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Segment Fit Scores</h4>
          <div className="grid gap-2">
            {Object.entries(data.segmentFitScores).map(([segment, score]: [string, any]) => (
              <div
                key={segment}
                className="flex items-center justify-between p-2 bg-muted/50 rounded"
              >
                <span className="text-sm">{segment}</span>
                <Badge variant={score >= 0.7 ? 'default' : score >= 0.4 ? 'secondary' : 'outline'}>
                  {(score * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor Report Summary */}
      {data.competitorReport && (
        <div>
          <h4 className="text-sm font-medium mb-2">Competitive Position</h4>
          <p className="text-sm">{data.competitorReport.our_positioning}</p>
          {data.competitorReport.competitors?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {data.competitorReport.competitors.length} competitors analyzed
            </p>
          )}
        </div>
      )}

      {/* Ad Metrics */}
      {data.adMetrics.impressions > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Experiment Metrics</h4>
          <div className="grid grid-cols-4 gap-2">
            <MetricCard label="Impressions" value={data.adMetrics.impressions.toLocaleString()} />
            <MetricCard label="Clicks" value={data.adMetrics.clicks.toLocaleString()} />
            <MetricCard label="Signups" value={data.adMetrics.signups.toLocaleString()} />
            <MetricCard
              label="Spend"
              value={`$${data.adMetrics.spend.toLocaleString()}`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ProblemFitBadge({ fit }: { fit: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    strong_fit: { label: 'Strong Fit', variant: 'default' },
    partial_fit: { label: 'Partial Fit', variant: 'secondary' },
    no_fit: { label: 'No Fit', variant: 'destructive' },
    unknown: { label: 'Unknown', variant: 'outline' },
  }
  const { label, variant } = config[fit] || config.unknown
  return <Badge variant={variant}>{label}</Badge>
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 bg-muted/50 rounded text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

// Loading skeleton
function ReportViewerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <div>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32 mt-2" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48 mt-1" />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export default CrewAIReportViewer
