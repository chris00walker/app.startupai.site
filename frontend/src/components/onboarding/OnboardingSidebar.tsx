'use client';

import { CheckCircle, Circle, User, Clock, Target, X } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
}

// ============================================================================
// OnboardingSidebar Component
// ============================================================================

export function OnboardingSidebar({
  stages,
  currentStage,
  overallProgress,
  agentPersonality,
  onExit,
}: OnboardingSidebarProps) {
  
  const completedStages = stages.filter(stage => stage.isComplete).length;
  const estimatedTimeRemaining = Math.max(0, (7 - currentStage) * 3); // ~3 minutes per stage

  return (
    <TooltipProvider>
      <Sidebar className="w-80 border-r bg-muted/10">
        {/* Header */}
        <SidebarHeader className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">AI Strategic Onboarding</h2>
              <p className="text-sm text-muted-foreground">
                Personalized business consultation
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExit}
                  className="h-8 w-8 p-0"
                  aria-label="Exit onboarding"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save progress and exit</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Overall Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <Progress 
              value={overallProgress} 
              className="h-2"
              aria-label={`Overall progress: ${Math.round(overallProgress)} percent complete`}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completedStages} of {stages.length} stages complete</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ~{estimatedTimeRemaining}m left
              </span>
            </div>
          </div>
        </SidebarHeader>

        {/* Content */}
        <SidebarContent className="px-6">
          {/* AI Agent Info */}
          {agentPersonality && (
            <div className="mb-6 p-4 rounded-lg bg-background border">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {agentPersonality.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{agentPersonality.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      AI Consultant
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {agentPersonality.role}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Specializes in {agentPersonality.expertise}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator className="mb-6" />

          {/* Stages List */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Conversation Stages
            </h3>
            
            <nav role="navigation" aria-label="Onboarding stages">
              <ol className="space-y-2">
                {stages.map((stage) => (
                  <li key={stage.stage}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            flex items-start gap-3 p-3 rounded-lg transition-colors cursor-default
                            ${stage.isActive 
                              ? 'bg-primary/10 border border-primary/20' 
                              : stage.isComplete 
                                ? 'bg-muted/50' 
                                : 'hover:bg-muted/30'
                            }
                          `}
                          role="listitem"
                          aria-current={stage.isActive ? 'step' : undefined}
                        >
                          {/* Stage Icon */}
                          <div className="flex-shrink-0 mt-0.5">
                            {stage.isComplete ? (
                              <CheckCircle 
                                className="h-5 w-5 text-green-600" 
                                aria-label="Completed"
                              />
                            ) : stage.isActive ? (
                              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                              </div>
                            ) : (
                              <Circle 
                                className="h-5 w-5 text-muted-foreground" 
                                aria-label="Not started"
                              />
                            )}
                          </div>

                          {/* Stage Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                Stage {stage.stage}
                              </span>
                              {stage.isActive && (
                                <Badge variant="default" className="text-xs px-1.5 py-0.5">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <h4 className={`
                              text-sm font-medium leading-tight
                              ${stage.isActive ? 'text-foreground' : 'text-muted-foreground'}
                            `}>
                              {stage.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {stage.description}
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div>
                          <p className="font-medium">{stage.name}</p>
                          <p className="text-xs mt-1">{stage.description}</p>
                          <p className="text-xs mt-2 text-muted-foreground">
                            Status: {stage.isComplete ? 'Completed' : stage.isActive ? 'In Progress' : 'Upcoming'}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-6">
          <div className="space-y-3">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2 rounded bg-muted/50">
                <div className="text-lg font-semibold text-primary">
                  {currentStage}
                </div>
                <div className="text-xs text-muted-foreground">
                  Current Stage
                </div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-lg font-semibold text-green-600">
                  {completedStages}
                </div>
                <div className="text-xs text-muted-foreground">
                  Completed
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-xs text-muted-foreground text-center">
              <p>Your progress is automatically saved.</p>
              <p className="mt-1">You can resume anytime.</p>
            </div>

            {/* Exit Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onExit}
              className="w-full"
              aria-label="Save progress and exit onboarding"
            >
              <X className="h-4 w-4 mr-2" />
              Save & Exit
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
