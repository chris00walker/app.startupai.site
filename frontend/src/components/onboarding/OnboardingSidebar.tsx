'use client';

import { useState, useEffect } from 'react';
import { Check, X, RefreshCw, Clock, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface StageInfo {
  stage: number;
  name: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

interface AgentPersonality {
  name: string;
  role: string;
  tone: string;
  expertise: string;
}

interface OnboardingSidebarProps {
  stages: StageInfo[];
  currentStage: number;
  overallProgress: number;
  agentPersonality?: AgentPersonality;
  onExit: () => void;
  onStartNew?: () => void;
  isResuming?: boolean;
}

// ============================================================================
// OnboardingSidebar Component - Clean Professional Design
// ============================================================================

export function OnboardingSidebar({
  stages,
  currentStage,
  overallProgress,
  agentPersonality,
  onExit,
  onStartNew,
  isResuming,
}: OnboardingSidebarProps) {
  const totalStages = stages.length || 7; // Default to 7 if stages empty

  // Track session start time for dynamic time estimate
  const [sessionStartTime] = useState(() => Date.now());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Update elapsed time every 30 seconds
  useEffect(() => {
    const updateElapsed = () => {
      setElapsedMinutes(Math.floor((Date.now() - sessionStartTime) / 60000));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 30000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Calculate time estimate based on actual elapsed time
  const completedStagesCount = currentStage - 1;
  const avgMinutesPerStage = completedStagesCount > 0
    ? Math.max(2, elapsedMinutes / completedStagesCount) // At least 2 min per stage
    : 3; // Default 3 min if no stages completed yet
  const remainingStages = totalStages - currentStage;
  const estimatedTimeRemaining = Math.max(0, Math.ceil(remainingStages * avgMinutesPerStage));

  return (
    <aside
      className="flex h-full w-full flex-col border-r border-border/50 onboarding-sidebar-bg relative overflow-hidden"
      role="complementary"
      aria-label="Onboarding progress"
    >
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none" />
      {/* Header */}
      <header className="relative z-10 p-6 pb-4 reveal-1">
        <h2 className="text-sm font-display font-normal text-foreground">AI Strategic Onboarding</h2>
        <p className="text-xs font-body text-muted-foreground mt-0.5">with {agentPersonality?.name || 'Alex'}</p>
      </header>

      {/* Progress Bar */}
      <div className="relative z-10 px-6 pb-6 reveal-2">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Progress</span>
          <span
            className="text-xs font-semibold text-primary tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out onboarding-progress-animate"
            style={{ width: `${overallProgress}%` }}
            role="progressbar"
            aria-label={`Onboarding progress: ${Math.round(overallProgress)} percent complete`}
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
          <span>
            Stage {currentStage} of {totalStages}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ~{estimatedTimeRemaining}m left
          </span>
        </div>
      </div>

      {/* Consultant Card */}
      {agentPersonality && (
        <div className="relative z-10 mx-6 mb-6 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-primary/10 shadow-sm reveal-3">
          <div className="flex items-start gap-3">
            <div className="onboarding-consultant-avatar flex-shrink-0">
              {agentPersonality.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">{agentPersonality.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  AI Consultant
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{agentPersonality.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stages */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-6 pb-4 reveal-4">
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 sticky top-0 bg-inherit pt-1">
          Stages
        </h3>
        <TooltipProvider>
          <nav role="navigation" aria-label="Onboarding stages">
            <ol className="space-y-1">
              {stages.map((stage) => {
                const isPending = !stage.isComplete && !stage.isActive;
                const stageContent = (
                  <div
                    className={cn(
                      'onboarding-step',
                      stage.isComplete && 'onboarding-step-complete',
                      stage.isActive && 'onboarding-step-current',
                      isPending && 'onboarding-step-pending cursor-not-allowed opacity-60'
                    )}
                    aria-current={stage.isActive ? 'step' : undefined}
                    aria-disabled={isPending}
                  >
                    {/* Step Number/Check/Lock */}
                    <div className="onboarding-step-number">
                      {stage.isComplete ? (
                        <Check className="h-3 w-3" />
                      ) : isPending ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <span>{stage.stage}</span>
                      )}
                    </div>

                    {/* Step Label */}
                    <span
                      className={cn(
                        'text-sm truncate',
                        stage.isActive
                          ? 'text-foreground font-medium'
                          : stage.isComplete
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground/70'
                      )}
                    >
                      {stage.name}
                    </span>
                  </div>
                );

                return (
                  <li key={stage.stage}>
                    {isPending ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {stageContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          Complete previous stages first
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      stageContent
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </TooltipProvider>
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6 pt-4 space-y-3 border-t border-border/50">
        {/* Resume Indicator */}
        {isResuming && (
          <div className="text-xs text-center py-2 px-3 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            Resuming previous conversation
          </div>
        )}

        {/* Help Text */}
        <p className="text-[11px] text-muted-foreground text-center">
          Your progress is automatically saved.
          <br />
          You can resume anytime.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {onStartNew && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartNew}
              className="w-full h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Start New Conversation
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onExit}
            className="w-full h-9 text-xs"
          >
            <X className="h-3.5 w-3.5 mr-2" />
            Save & Exit
          </Button>
        </div>
      </footer>
    </aside>
  );
}
