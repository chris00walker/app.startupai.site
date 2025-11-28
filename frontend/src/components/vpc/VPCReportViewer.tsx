/**
 * VPCReportViewer Component
 *
 * Full display of CrewAI VPC analysis with segment selection,
 * fit scores, and validation metadata.
 *
 * Uses EnhancedValuePropositionCanvas for rich data display including:
 * - Job dimensions (functional, emotional, social, importance)
 * - Pain intensity and reliever mappings
 * - Gain importance and creator mappings
 * - Fit indicators and resonance scores
 */

'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useVPCReport } from '@/hooks/useVPCReport';
import { useVPC } from '@/hooks/useVPC';
import type { VPCUISegment } from '@/lib/crewai/vpc-transformer';
import { VPCFitBadge } from './VPCFitBadge';
import EnhancedValuePropositionCanvas from '@/components/canvas/EnhancedValuePropositionCanvas';
import EditableValuePropositionCanvas from '@/components/canvas/EditableValuePropositionCanvas';
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
  ExternalLink,
  Edit2,
  Eye,
  Plus,
  Loader2,
} from 'lucide-react';

export interface VPCReportViewerProps {
  projectId: string;
  variant?: 'full' | 'compact';
  showFitScores?: boolean;
  showMetadata?: boolean;
  className?: string;
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
  // View/Edit mode toggle
  const [editMode, setEditMode] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // VPC report data (read-only display from CrewAI)
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

  // Editable VPC data (from value_proposition_canvas table)
  const vpc = useVPC({ projectId });

  // Check if editable VPC data exists
  const hasEditableData = vpc.segments.length > 0;

  // Initialize editable VPC from CrewAI data
  const handleInitializeEditable = async () => {
    if (!hasVPCData) return;

    setIsInitializing(true);
    try {
      await vpc.initializeFromCrewAI();
      setEditMode(true);
    } catch (err) {
      console.error('Failed to initialize editable VPC:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  // Toggle edit mode - initialize if needed
  const handleToggleEditMode = async () => {
    if (!editMode && !hasEditableData) {
      // Need to initialize first
      await handleInitializeEditable();
    } else {
      setEditMode(!editMode);
    }
  };

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
            <div className="flex items-center gap-3">
              {reportMetadata.generatedAt && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(reportMetadata.generatedAt)}</span>
                </div>
              )}
              {/* Edit Mode Toggle */}
              <Button
                variant={editMode ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleToggleEditMode}
                disabled={isInitializing || vpc.isLoading}
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Initializing...
                  </>
                ) : editMode ? (
                  <>
                    <Eye className="h-4 w-4 mr-1.5" />
                    View Mode
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-1.5" />
                    Edit
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            AI-generated customer profile and value map analysis with fit scoring
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

      {/* Segment Tabs + VPC Canvas (View or Edit Mode) */}
      <Card>
        <CardContent className="pt-6">
          {editMode && vpc.activeSegment ? (
            // Edit mode - show editable canvas
            vpc.segments.length > 1 ? (
              <Tabs
                value={vpc.activeSegmentKey || vpc.segments[0]?.segmentKey}
                onValueChange={(value) => vpc.setActiveSegmentKey(value)}
              >
                <TabsList className="mb-4">
                  {vpc.segments.map((segment) => (
                    <TabsTrigger key={segment.segmentKey} value={segment.segmentKey}>
                      {segment.segmentName}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {vpc.segments.map((segment) => (
                  <TabsContent key={segment.segmentKey} value={segment.segmentKey}>
                    <EditableValuePropositionCanvas
                      segment={segment}
                      onAddJob={vpc.addJob}
                      onUpdateJob={vpc.updateJob}
                      onRemoveJob={vpc.removeJob}
                      onAddPain={vpc.addPain}
                      onUpdatePain={vpc.updatePain}
                      onRemovePain={vpc.removePain}
                      onAddGain={vpc.addGain}
                      onUpdateGain={vpc.updateGain}
                      onRemoveGain={vpc.removeGain}
                      onAddProductOrService={vpc.addProductOrService}
                      onUpdateProductOrService={vpc.updateProductOrService}
                      onRemoveProductOrService={vpc.removeProductOrService}
                      onAddPainReliever={vpc.addPainReliever}
                      onUpdatePainReliever={vpc.updatePainReliever}
                      onRemovePainReliever={vpc.removePainReliever}
                      onAddGainCreator={vpc.addGainCreator}
                      onUpdateGainCreator={vpc.updateGainCreator}
                      onRemoveGainCreator={vpc.removeGainCreator}
                      onAddDifferentiator={vpc.addDifferentiator}
                      onUpdateDifferentiator={vpc.updateDifferentiator}
                      onRemoveDifferentiator={vpc.removeDifferentiator}
                      onResetToCrewAI={vpc.resetToCrewAI}
                      isSaving={vpc.isSaving}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              // Single segment - no tabs needed
              <EditableValuePropositionCanvas
                segment={vpc.activeSegment}
                onAddJob={vpc.addJob}
                onUpdateJob={vpc.updateJob}
                onRemoveJob={vpc.removeJob}
                onAddPain={vpc.addPain}
                onUpdatePain={vpc.updatePain}
                onRemovePain={vpc.removePain}
                onAddGain={vpc.addGain}
                onUpdateGain={vpc.updateGain}
                onRemoveGain={vpc.removeGain}
                onAddProductOrService={vpc.addProductOrService}
                onUpdateProductOrService={vpc.updateProductOrService}
                onRemoveProductOrService={vpc.removeProductOrService}
                onAddPainReliever={vpc.addPainReliever}
                onUpdatePainReliever={vpc.updatePainReliever}
                onRemovePainReliever={vpc.removePainReliever}
                onAddGainCreator={vpc.addGainCreator}
                onUpdateGainCreator={vpc.updateGainCreator}
                onRemoveGainCreator={vpc.removeGainCreator}
                onAddDifferentiator={vpc.addDifferentiator}
                onUpdateDifferentiator={vpc.updateDifferentiator}
                onRemoveDifferentiator={vpc.removeDifferentiator}
                onResetToCrewAI={vpc.resetToCrewAI}
                isSaving={vpc.isSaving}
              />
            )
          ) : (
            // View mode - show read-only enhanced canvas
            segmentCount > 1 ? (
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
                    <EnhancedValuePropositionCanvas
                      segment={segment}
                      showFitLines={true}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              // Single segment - no tabs needed
              activeSegment && (
                <EnhancedValuePropositionCanvas
                  segment={activeSegment}
                  showFitLines={true}
                />
              )
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
