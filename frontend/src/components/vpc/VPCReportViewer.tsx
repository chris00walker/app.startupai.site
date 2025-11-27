/**
 * VPCReportViewer Component
 *
 * Full display of CrewAI VPC analysis with segment selection,
 * fit scores, and validation metadata.
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVPCReport, VPCUISegment } from '@/hooks/useVPCReport';
import { VPCFitBadge } from './VPCFitBadge';
import ValuePropositionCanvas from '@/components/canvas/ValuePropositionCanvas';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Calendar,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';

export interface VPCReportViewerProps {
  projectId: string;
  variant?: 'full' | 'compact';
  showFitScores?: boolean;
  showMetadata?: boolean;
  className?: string;
}

/**
 * Convert VPCUISegment to the format expected by ValuePropositionCanvas
 */
function segmentToCanvasData(segment: VPCUISegment) {
  return {
    valuePropositionTitle: segment.valuePropositionTitle,
    customerSegmentTitle: segment.customerSegmentTitle,
    valueMap: {
      productsAndServices: segment.valueMap.productsAndServices.length > 0
        ? segment.valueMap.productsAndServices
        : [''],
      gainCreators: segment.valueMap.gainCreators.length > 0
        ? segment.valueMap.gainCreators
        : [''],
      painRelievers: segment.valueMap.painRelievers.length > 0
        ? segment.valueMap.painRelievers
        : [''],
    },
    customerProfile: {
      gains: segment.customerProfile.gains.length > 0
        ? segment.customerProfile.gains
        : [''],
      pains: segment.customerProfile.pains.length > 0
        ? segment.customerProfile.pains
        : [''],
      jobs: segment.customerProfile.jobs.length > 0
        ? segment.customerProfile.jobs
        : [''],
    },
  };
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
}

export function VPCReportViewer({
  projectId,
  variant = 'full',
  showFitScores = true,
  showMetadata = true,
  className,
}: VPCReportViewerProps) {
  const {
    segments,
    activeSegment,
    activeSegmentIndex,
    setActiveSegmentIndex,
    fitScores,
    reportMetadata,
    hasVPCData,
    isLoading,
    error,
    segmentCount,
    refetch,
  } = useVPCReport(projectId);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('', className)}>
        <Alert variant="destructive">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <AlertDescription>
              <span className="font-semibold">Error Loading Analysis:</span>{' '}
              Failed to load Value Proposition Canvas data.
              <button
                onClick={refetch}
                className="ml-2 underline hover:no-underline"
              >
                Try again
              </button>
            </AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (!hasVPCData) {
    return (
      <div className={cn('', className)}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Value Proposition Canvas</CardTitle>
            </div>
            <CardDescription>
              AI-generated strategic analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
              <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Run a CrewAI strategic analysis to generate your Value Proposition Canvas
                with customer profiles, value maps, and fit scoring.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Data available - show full viewer
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Value Proposition Canvas</CardTitle>
              {segmentCount > 1 && (
                <Badge variant="secondary">
                  {segmentCount} segments
                </Badge>
              )}
            </div>
            {reportMetadata.generatedAt && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(reportMetadata.generatedAt)}</span>
              </div>
            )}
          </div>
          <CardDescription>
            AI-generated customer profile and value map analysis
          </CardDescription>
        </CardHeader>

        {/* Fit Scores */}
        {showFitScores && fitScores && (
          <CardContent className="pt-0 pb-4">
            <div className="flex flex-wrap gap-2">
              <VPCFitBadge
                type="desirability"
                score={fitScores.desirability.score}
                band={fitScores.desirability.band}
              />
              <VPCFitBadge
                type="feasibility"
                score={fitScores.feasibility.score}
                band={fitScores.feasibility.band}
              />
              <VPCFitBadge
                type="viability"
                score={fitScores.viability.score}
                band={fitScores.viability.band}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Segment Tabs + VPC Canvas */}
      <Card>
        <CardContent className="pt-6">
          {segmentCount > 1 ? (
            <Tabs
              value={activeSegment?.segmentKey || segments[0]?.segmentKey}
              onValueChange={(value) => {
                const index = segments.findIndex((s) => s.segmentKey === value);
                if (index !== -1) setActiveSegmentIndex(index);
              }}
            >
              <TabsList className="mb-4">
                {segments.map((segment) => (
                  <TabsTrigger key={segment.segmentKey} value={segment.segmentKey}>
                    {segment.segmentName}
                  </TabsTrigger>
                ))}
              </TabsList>
              {segments.map((segment) => (
                <TabsContent key={segment.segmentKey} value={segment.segmentKey}>
                  <ValuePropositionCanvas
                    canvasId={`report-${projectId}-${segment.segmentKey}`}
                    initialData={segmentToCanvasData(segment)}
                    readOnly={true}
                  />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            // Single segment - no tabs needed
            activeSegment && (
              <ValuePropositionCanvas
                canvasId={`report-${projectId}-${activeSegment.segmentKey}`}
                initialData={segmentToCanvasData(activeSegment)}
                readOnly={true}
              />
            )
          )}
        </CardContent>
      </Card>

      {/* Validation Metadata */}
      {showMetadata && variant === 'full' && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Validation Outcome */}
          {reportMetadata.validationOutcome && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Validation Outcome</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{reportMetadata.validationOutcome}</p>
              </CardContent>
            </Card>
          )}

          {/* Evidence Summary */}
          {reportMetadata.evidenceSummary && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Evidence Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{reportMetadata.evidenceSummary}</p>
              </CardContent>
            </Card>
          )}

          {/* Pivot Recommendation */}
          {reportMetadata.pivotRecommendation && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base">Pivot Recommendation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{reportMetadata.pivotRecommendation}</p>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {reportMetadata.nextSteps.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Next Steps</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1.5">
                  {reportMetadata.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-muted-foreground">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default VPCReportViewer;
