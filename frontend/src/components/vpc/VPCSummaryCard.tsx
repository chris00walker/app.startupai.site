/**
 * VPCSummaryCard Component
 *
 * Compact dashboard card showing VPC analysis summary with fit scores.
 * Links to full analysis page.
 *
 * @story US-F02, US-F12
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useVPCReport } from '@/hooks/useVPCReport';
import { VPCFitBadge, VPCFitDotsGroup } from './VPCFitBadge';
import { cn } from '@/lib/utils';
import { LayoutGrid, ArrowRight, Users, AlertCircle } from 'lucide-react';

export interface VPCSummaryCardProps {
  projectId: string;
  onClick?: () => void;
  className?: string;
}

export function VPCSummaryCard({
  projectId,
  onClick,
  className,
}: VPCSummaryCardProps) {
  const {
    segments,
    activeSegment,
    fitScores,
    reportMetadata,
    hasVPCData,
    isLoading,
    error,
    segmentCount,
  } = useVPCReport(projectId);

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Value Proposition Canvas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load analysis</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - no VPC data yet
  if (!hasVPCData) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Value Proposition Canvas</CardTitle>
          </div>
          <CardDescription>
            AI-generated customer and value analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
            <p>No analysis available yet</p>
            <p className="text-xs mt-1">Run CrewAI analysis to generate your VPC</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Data available - show summary
  const primarySegment = activeSegment || segments[0];
  const additionalSegments = segmentCount - 1;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Value Proposition Canvas</CardTitle>
          </div>
          {fitScores && (
            <VPCFitDotsGroup
              desirabilityBand={fitScores.desirability.band}
              feasibilityBand={fitScores.feasibility.band}
              viabilityBand={fitScores.viability.band}
            />
          )}
        </div>
        <CardDescription>
          Strategic fit analysis from AI team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Primary segment */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {primarySegment?.segmentName || 'Customer Segment'}
          </span>
          {additionalSegments > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{additionalSegments} more
            </Badge>
          )}
        </div>

        {/* Fit scores */}
        {fitScores && (
          <div className="flex flex-wrap gap-2">
            <VPCFitBadge
              type="desirability"
              score={fitScores.desirability.score}
              band={fitScores.desirability.band}
              size="sm"
            />
            <VPCFitBadge
              type="feasibility"
              score={fitScores.feasibility.score}
              band={fitScores.feasibility.band}
              size="sm"
            />
            <VPCFitBadge
              type="viability"
              score={fitScores.viability.score}
              band={fitScores.viability.band}
              size="sm"
            />
          </div>
        )}

        {/* Validation outcome preview */}
        {reportMetadata.validationOutcome && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {reportMetadata.validationOutcome}
          </p>
        )}

        {/* View full analysis button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={onClick}
        >
          View Full Analysis
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default VPCSummaryCard;
