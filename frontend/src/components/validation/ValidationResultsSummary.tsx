/**
 * ValidationResultsSummary Component
 *
 * Displays a summary of the latest AI validation report for a project.
 * Shows validation outcome, evidence summary, pivot recommendations, and next steps.
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLatestValidationReport } from '@/hooks/useProjectReports';
import Link from 'next/link';
import {
  Brain,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileText,
  Target,
  TrendingUp,
} from 'lucide-react';

interface ValidationResultsSummaryProps {
  projectId: string | undefined;
}

function getOutcomeColor(outcome: string | null): string {
  if (!outcome) return 'text-muted-foreground';
  const lower = outcome.toLowerCase();
  if (lower.includes('proceed') || lower.includes('valid') || lower.includes('success')) {
    return 'text-green-600';
  }
  if (lower.includes('pivot') || lower.includes('iterate') || lower.includes('adjust')) {
    return 'text-yellow-600';
  }
  if (lower.includes('kill') || lower.includes('stop') || lower.includes('fail')) {
    return 'text-red-600';
  }
  return 'text-blue-600';
}

function getOutcomeIcon(outcome: string | null) {
  if (!outcome) return Brain;
  const lower = outcome.toLowerCase();
  if (lower.includes('proceed') || lower.includes('valid') || lower.includes('success')) {
    return CheckCircle;
  }
  if (lower.includes('pivot') || lower.includes('iterate')) {
    return AlertTriangle;
  }
  if (lower.includes('kill') || lower.includes('stop') || lower.includes('fail')) {
    return XCircle;
  }
  return Target;
}

function getPivotBadgeVariant(pivot: string | null): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!pivot || pivot === 'none' || pivot === 'NONE') return 'outline';
  if (pivot.includes('kill') || pivot.includes('KILL')) return 'destructive';
  return 'secondary';
}

export function ValidationResultsSummary({ projectId }: ValidationResultsSummaryProps) {
  const {
    report,
    validationOutcome,
    evidenceSummary,
    pivotRecommendation,
    nextSteps,
    qaReport,
    isLoading,
    error,
    refetch,
  } = useLatestValidationReport(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Validation Results
          </CardTitle>
          <CardDescription>Loading latest analysis...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Validation Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">Failed to load validation results</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Validation Results
          </CardTitle>
          <CardDescription>No analysis results yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Run Your First Analysis</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get AI-powered insights into your business idea with strategic analysis.
            </p>
            <Link href="/ai-analysis">
              <Button>
                <Brain className="h-4 w-4 mr-2" />
                Start AI Analysis
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const OutcomeIcon = getOutcomeIcon(validationOutcome);
  const outcomeColor = getOutcomeColor(validationOutcome);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Validation Results
            </CardTitle>
            <CardDescription>
              Latest analysis from {new Date(report.generatedAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Link href="/ai-analysis">
              <Button variant="outline" size="sm">
                <Brain className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Validation Outcome */}
        {validationOutcome && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <OutcomeIcon className={`h-6 w-6 mt-0.5 ${outcomeColor}`} />
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Validation Outcome</h4>
              <p className={`text-sm ${outcomeColor}`}>{validationOutcome}</p>
            </div>
            {pivotRecommendation && pivotRecommendation !== 'none' && (
              <Badge variant={getPivotBadgeVariant(pivotRecommendation)}>
                {pivotRecommendation.replace('_', ' ')}
              </Badge>
            )}
          </div>
        )}

        {/* Evidence Summary */}
        {evidenceSummary && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Evidence Summary
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {evidenceSummary}
            </p>
          </div>
        )}

        {/* QA Metrics */}
        {qaReport && (qaReport.framework_compliance || qaReport.logical_consistency || qaReport.completeness) && (
          <div className="grid grid-cols-3 gap-4">
            {qaReport.framework_compliance !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(qaReport.framework_compliance * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Framework Compliance</p>
              </div>
            )}
            {qaReport.logical_consistency !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(qaReport.logical_consistency * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Logical Consistency</p>
              </div>
            )}
            {qaReport.completeness !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(qaReport.completeness * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Completeness</p>
              </div>
            )}
          </div>
        )}

        {/* Next Steps */}
        {nextSteps && nextSteps.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Recommended Next Steps
            </h4>
            <div className="space-y-2">
              {nextSteps.slice(0, 4).map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded border bg-background"
                >
                  <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{step}</span>
                </div>
              ))}
              {nextSteps.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  +{nextSteps.length - 4} more steps
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
