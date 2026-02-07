/**
 * ValidationProgressTimeline Component
 *
 * Displays real-time progress of a validation run with phase stepper,
 * crew/agent/task indicators, and HITL pause states.
 *
 * Pattern follows: components/signals/InnovationPhysicsPanel.tsx
 * Reference: startupai-crew/docs/features/state-persistence.md
 *
 * @story US-E04
 */

'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  Search,
  Target,
  Wrench,
  DollarSign,
  Loader2,
  CheckCircle,
  XCircle,
  PauseCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useValidationProgress } from '@/hooks/useValidationProgress';
import {
  PHASE_INFO,
  calculateOverallProgress,
  getLatestCrewEvents,
  type ValidationRunStatus,
  type ValidationProgressEvent,
} from '@/types/validation-progress';

export interface ValidationProgressTimelineProps {
  runId: string;
  variant?: 'modal' | 'inline';
  onHITLRequired?: (checkpoint: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onRunRestarted?: (runId: string) => void;
  className?: string;
}

const phaseIcons: Record<number, React.ElementType> = {
  0: MessageSquare,
  1: Search,
  2: Target,
  3: Wrench,
  4: DollarSign,
};

const statusConfig: Record<
  ValidationRunStatus | 'idle',
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  idle: {
    label: 'Initializing...',
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  pending: {
    label: 'Starting...',
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  running: {
    label: 'In Progress',
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  paused: {
    label: 'Awaiting Approval',
    icon: PauseCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

const PHASE1_WARNING_MS = 20 * 60 * 1000;
const PHASE1_ESCALATION_MS = 30 * 60 * 1000;

// Fix 3: Map HITL states to deterministic progress values
const HITL_PROGRESS: Record<string, number> = {
  approve_brief: 23,
  approve_founders_brief: 23,
  approve_discovery_output: 40,
  approve_desirability_gate: 60,
  approve_feasibility_gate: 80,
  approve_viability_gate: 100,
};

function getProgressForPausedState(hitlState: string | null): number | null {
  return hitlState ? HITL_PROGRESS[hitlState] ?? null : null;
}

// Fix 5: Human-readable HITL descriptions
function getHITLDescription(hitlState: string): string {
  const descriptions: Record<string, string> = {
    approve_brief: "Your Founder's Brief is ready for review.",
    approve_founders_brief: "Your Founder's Brief is ready for review.",
    approve_discovery_output: 'VPC Discovery is complete. Review results to continue.',
    approve_desirability_gate: 'Desirability validation is complete. Review to continue.',
    approve_feasibility_gate: 'Feasibility analysis is complete. Review to continue.',
    approve_viability_gate: 'Viability evaluation is complete. Review to continue.',
  };
  return descriptions[hitlState] ?? 'Your review is needed to continue validation.';
}

// Fix 5: Detect HITL events in activity feed
function isHITLEvent(event: ValidationProgressEvent): boolean {
  return (
    event.status === ('hitl_checkpoint' as ValidationProgressEvent['status']) ||
    ['approve_brief', 'approve_discovery_output', 'approve_founders_brief'].includes(event.crew ?? '')
  );
}

// Fix 0b: Sanitize error message for display
function sanitizeErrorMessage(message: string | undefined): string {
  if (!message) return 'An unexpected error occurred during validation.';
  // Strip Pydantic stack traces — show only the first sentence
  const firstSentence = message.split('\n')[0].slice(0, 200);
  return firstSentence || 'An unexpected error occurred during validation.';
}

export function ValidationProgressTimeline({
  runId,
  variant = 'modal',
  onHITLRequired,
  onComplete,
  onError,
  onRunRestarted,
  className,
}: ValidationProgressTimelineProps) {
  const { run, progress, status, currentPhase, isLoading, error, refetch } =
    useValidationProgress(runId);
  const [now, setNow] = useState(() => Date.now());
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Calculate current phase progress based on events
  const phaseProgress = useMemo(() => {
    if (!progress.length) return 0;
    const phaseEvents = progress.filter((e) => e.phase === currentPhase);
    const completedEvents = phaseEvents.filter(
      (e) => e.status === 'completed'
    ).length;
    const totalEvents = phaseEvents.length;
    return totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;
  }, [progress, currentPhase]);

  // Fix 3: Use deterministic progress for paused states
  const overallProgress = status === 'paused'
    ? getProgressForPausedState(run?.hitl_state ?? null) ?? calculateOverallProgress(currentPhase, phaseProgress)
    : calculateOverallProgress(currentPhase, phaseProgress);

  // Get latest event for current activity display
  const latestEvent = progress.length > 0 ? progress[progress.length - 1] : null;

  // Get latest events per crew for phase display
  const latestCrewEvents = useMemo(
    () => getLatestCrewEvents(progress),
    [progress]
  );

  const phase1StartMs = useMemo(() => {
    if (currentPhase !== 1) return null;
    const phaseEvents = progress.filter((event) => event.phase === 1);
    if (phaseEvents.length > 0) {
      const firstEvent = phaseEvents[0];
      const startMs = new Date(firstEvent.created_at).getTime();
      return Number.isNaN(startMs) ? null : startMs;
    }
    if (!run?.started_at) return null;
    const startMs = new Date(run.started_at).getTime();
    return Number.isNaN(startMs) ? null : startMs;
  }, [currentPhase, progress, run?.started_at]);

  const phase1ElapsedMs =
    phase1StartMs && status === 'running' ? Math.max(0, now - phase1StartMs) : 0;
  const showPhase1Warning =
    status === 'running' && currentPhase === 1 && phase1ElapsedMs >= PHASE1_WARNING_MS;
  const showPhase1Escalation =
    status === 'running' && currentPhase === 1 && phase1ElapsedMs >= PHASE1_ESCALATION_MS;

  useEffect(() => {
    if (status !== 'running' || currentPhase !== 1 || !phase1StartMs) return;
    const interval = window.setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(interval);
  }, [status, currentPhase, phase1StartMs]);

  // Fix 2: Only auto-trigger onComplete — HITL requires manual button click (no auto-redirect)
  useEffect(() => {
    if (status === 'completed' && onComplete) {
      onComplete();
    }
  }, [status, onComplete]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (isLoading && !run) {
    return <ValidationProgressTimelineSkeleton variant={variant} className={className} />;
  }

  if (error) {
    return (
      <Card className={cn('border-red-200', className)}>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message || 'Failed to load validation progress'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const supportMailTo = run
    ? `mailto:support@startupai.site?subject=Phase%201%20timeout%20(${encodeURIComponent(run.project_id)})&body=${encodeURIComponent(
        `Project ID: ${run.project_id}\nRun ID: ${run.run_id}`
      )}`
    : 'mailto:support@startupai.site';

  const handleRetry = async () => {
    if (!run) return;
    setIsRetrying(true);
    setRetryError(null);

    try {
      const response = await fetch('/api/crewai/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: run.run_id }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retry validation run');
      }

      if (data.run_id) {
        onRunRestarted?.(data.run_id);
      }

      await refetch();
      setNow(Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retry validation run';
      setRetryError(message);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card className={cn(variant === 'modal' ? '' : 'border-2', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            AI Validation Analysis
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(statusInfo.bgColor, statusInfo.color)}
          >
            <StatusIcon
              className={cn(
                'h-3.5 w-3.5 mr-1.5',
                status === 'running' && 'animate-spin'
              )}
            />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {showPhase1Warning && (
          <Alert variant={showPhase1Escalation ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {showPhase1Escalation ? 'Extended processing time' : 'Taking longer than expected'}
            </AlertTitle>
            <AlertDescription>
              {showPhase1Escalation
                ? 'Phase 1 is still running. If this continues, contact support or retry the analysis.'
                : 'Phase 1 is still running. Our team is working on your analysis.'}
              {showPhase1Escalation && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={supportMailTo}>Contact Support</a>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleRetry} disabled={isRetrying}>
                    {isRetrying ? 'Restarting...' : 'Cancel and retry'}
                  </Button>
                </div>
              )}
              {retryError && (
                <div className="mt-3 text-sm text-red-600">
                  {retryError}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{overallProgress}%</span>
          </div>
          <Progress
            value={overallProgress}
            className={cn('h-2', status === 'failed' && '[&>div]:bg-red-500')}
          />
        </div>

        {/* Phase Stepper */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Validation Phases</h4>
          <div className="flex items-center justify-between">
            {[0, 1, 2, 3, 4].map((phase) => {
              const PhaseIcon = phaseIcons[phase];
              const info = PHASE_INFO[phase];
              const isActive = phase === currentPhase;
              const isComplete = phase < currentPhase;
              const isPending = phase > currentPhase;

              return (
                <div
                  key={phase}
                  className={cn(
                    'flex flex-col items-center gap-1.5 flex-1',
                    isPending && 'opacity-40'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      isComplete && 'bg-green-100 border-green-500 text-green-600',
                      isActive && 'bg-blue-100 border-blue-500 text-blue-600',
                      isPending && 'bg-gray-100 border-gray-300 text-gray-400'
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <PhaseIcon
                        className={cn(
                          'h-5 w-5',
                          isActive && status === 'running' && 'animate-pulse'
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs text-center leading-tight',
                      isActive && 'font-medium text-blue-600',
                      isComplete && 'text-green-600',
                      isPending && 'text-gray-400'
                    )}
                  >
                    {info.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Activity */}
        {latestEvent && status === 'running' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {latestEvent.crew}
                </p>
                {latestEvent.task && (
                  <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                    {latestEvent.task}
                  </p>
                )}
                {latestEvent.agent && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Agent: {latestEvent.agent}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fix 5: HITL Pause State — prominent banner */}
        {status === 'paused' && run?.hitl_state && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 dark:bg-amber-950/30 dark:border-amber-700">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  Action Required
                </Badge>
                <p className="mt-1 text-sm text-amber-900 dark:text-amber-100">
                  {getHITLDescription(run.hitl_state)}
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => onHITLRequired?.(run.hitl_state!)}
              >
                Review & Approve
              </Button>
            </div>
          </div>
        )}

        {/* Completion State */}
        {status === 'completed' && (
          <Alert className="border-green-300 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              Analysis Complete
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Your validation analysis has finished. View the results to see
              insights and recommendations.
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full border-green-400 text-green-700 hover:bg-green-100"
                onClick={onComplete}
              >
                View Results
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Fix 0b: Enhanced Error State */}
        {status === 'failed' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Validation Failed</AlertTitle>
            <AlertDescription>
              <p>{sanitizeErrorMessage(run?.error_message)}</p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Restarting...' : 'Start New Validation'}
                </Button>
              </div>
              {retryError && (
                <p className="mt-2 text-sm text-red-600">{retryError}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Activity Log (for inline variant) */}
        {variant === 'inline' && progress.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Recent Activity
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {progress.slice(-5).reverse().map((event) => (
                <ActivityLogItem key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Fix 5: Activity log item with HITL event prominence
function ActivityLogItem({ event }: { event: ValidationProgressEvent }) {
  const hitl = isHITLEvent(event);
  const statusColors = {
    started: 'text-blue-600',
    in_progress: 'text-blue-600',
    completed: 'text-green-600',
    failed: 'text-red-600',
    skipped: 'text-gray-500',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs py-1 px-2 rounded',
        hitl ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-700' : 'bg-muted/50'
      )}
    >
      <span className={cn('font-medium', hitl ? 'text-amber-600' : statusColors[event.status])}>
        {hitl ? (
          <PauseCircle className="h-3 w-3 inline mr-1" />
        ) : event.status === 'completed' ? (
          <CheckCircle className="h-3 w-3 inline mr-1" />
        ) : event.status === 'failed' ? (
          <XCircle className="h-3 w-3 inline mr-1" />
        ) : (
          <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />
        )}
      </span>
      <span className={cn('truncate flex-1', hitl ? 'text-amber-800 font-medium dark:text-amber-200' : 'text-muted-foreground')}>
        {hitl ? 'Action Required' : event.crew}
        {!hitl && event.task && ` - ${event.task}`}
      </span>
      <span className="text-muted-foreground">
        {new Date(event.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}

// Skeleton for loading state
function ValidationProgressTimelineSkeleton({
  variant,
  className,
}: {
  variant: 'modal' | 'inline';
  className?: string;
}) {
  return (
    <Card className={cn(variant === 'modal' ? '' : 'border-2', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="flex justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

export default ValidationProgressTimeline;
