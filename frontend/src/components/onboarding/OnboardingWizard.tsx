'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { OnboardingSidebar, ConversationInterface } from '@/components/onboarding';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface OnboardingWizardProps {
  userId: string;
  planType: 'trial' | 'sprint' | 'founder' | 'enterprise';
  userEmail: string;
}

interface OnboardingSession {
  sessionId: string;
  currentStage: number;
  totalStages: number;
  overallProgress: number;
  stageProgress: number;
  agentPersonality: any;
  conversationHistory: ConversationMessage[];
  isActive: boolean;
  coverageByStage: Record<string, StageCoverage>;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  stage: number;
  isPending?: boolean;
  qualitySignals?: QualitySignals;
  systemActions?: {
    triggerWorkflow?: boolean;
    requestClarification?: boolean;
    needsReview?: boolean;
  };
}

interface ApiQualitySignals {
  clarity: { label: 'high' | 'medium' | 'low'; score: number };
  completeness: { label: 'complete' | 'partial' | 'insufficient'; score: number };
  detail_score: number;
  overall: number;
  quality_tags?: string[];
  suggestions?: string[];
  encouragement?: string;
}

interface ApiStageSnapshot {
  stage: number;
  coverage: number;
  quality: {
    clarity: { label: 'high' | 'medium' | 'low'; score: number };
    completeness: { label: 'complete' | 'partial' | 'insufficient'; score: number };
    detail_score: number;
  };
  brief_fields: string[];
  last_message_excerpt?: string;
  updated_at: string;
  notes?: string;
}

interface QualitySignals {
  clarity: { label: 'high' | 'medium' | 'low'; score: number };
  completeness: { label: 'complete' | 'partial' | 'insufficient'; score: number };
  detailScore: number;
  overall: number;
  qualityTags?: string[];
  suggestions?: string[];
  encouragement?: string;
}

interface StageSnapshotState {
  stage: number;
  coverage: number;
  quality: {
    clarity: QualitySignals['clarity'];
    completeness: QualitySignals['completeness'];
    detailScore: number;
  };
  briefFields: string[];
  lastMessageExcerpt?: string;
  updatedAt: string;
  notes?: string;
}

interface StageCoverage {
  snapshot: StageSnapshotState;
  quality: QualitySignals;
}

function mapQualitySignals(payload?: ApiQualitySignals): QualitySignals {
  // Provide defaults if payload is undefined or incomplete
  const defaultQuality = {
    clarity: { label: 'medium' as const, score: 0.5 },
    completeness: { label: 'partial' as const, score: 0.5 },
    detailScore: 0.5,
    overall: 0.5,
  };

  if (!payload) {
    return defaultQuality;
  }

  return {
    clarity: payload.clarity || defaultQuality.clarity,
    completeness: payload.completeness || defaultQuality.completeness,
    detailScore: payload.detail_score ?? defaultQuality.detailScore,
    overall: payload.overall ?? defaultQuality.overall,
    qualityTags: payload.quality_tags,
    suggestions: payload.suggestions,
    encouragement: payload.encouragement,
  };
}

function mapStageSnapshot(payload?: ApiStageSnapshot): StageSnapshotState {
  // Provide defaults if payload is undefined or incomplete
  const now = new Date().toISOString();
  const defaultSnapshot = {
    stage: 1,
    coverage: 0,
    quality: {
      clarity: { label: 'medium' as const, score: 0.5 },
      completeness: { label: 'partial' as const, score: 0.5 },
      detailScore: 0.5,
    },
    briefFields: [],
    updatedAt: now,
  };

  if (!payload) {
    return defaultSnapshot;
  }

  return {
    stage: payload.stage ?? defaultSnapshot.stage,
    coverage: payload.coverage ?? defaultSnapshot.coverage,
    quality: {
      clarity: payload.quality?.clarity || defaultSnapshot.quality.clarity,
      completeness: payload.quality?.completeness || defaultSnapshot.quality.completeness,
      detailScore: payload.quality?.detail_score ?? defaultSnapshot.quality.detailScore,
    },
    briefFields: payload.brief_fields || defaultSnapshot.briefFields,
    lastMessageExcerpt: payload.last_message_excerpt,
    updatedAt: payload.updated_at || defaultSnapshot.updatedAt,
    notes: payload.notes,
  };
}

function mergeCoverage(
  previous: Record<string, StageCoverage>,
  snapshot: StageSnapshotState,
  quality: QualitySignals,
): Record<string, StageCoverage> {
  const key = `stage_${snapshot.stage}`;
  return {
    ...previous,
    [key]: {
      snapshot,
      quality,
    },
  };
}

interface StageInfo {
  stage: number;
  name: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

// ============================================================================
// Main OnboardingWizard Component
// ============================================================================

export function OnboardingWizard({ userId, planType, userEmail }: OnboardingWizardProps) {
  const router = useRouter();
  
  // State management
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Initialize stages
  const initializeStages = useCallback((currentStage: number = 1) => {
    const stageNames = [
      'Welcome & Introduction',
      'Customer Discovery', 
      'Problem Definition',
      'Solution Validation',
      'Competitive Analysis',
      'Resources & Constraints',
      'Goals & Next Steps',
    ];

    const stageDescriptions = [
      'Getting to know you and your business idea',
      'Understanding your target customers',
      'Defining the core problem you\'re solving',
      'Exploring your proposed solution',
      'Understanding the competitive landscape',
      'Assessing your available resources',
      'Setting strategic goals and priorities',
    ];

    return stageNames.map((name, index) => ({
      stage: index + 1,
      name,
      description: stageDescriptions[index],
      isComplete: index + 1 < currentStage,
      isActive: index + 1 === currentStage,
    }));
  }, []);

  // Initialize onboarding session
  const initializeSession = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/start/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planType,
          userContext: {
            referralSource: 'direct',
            previousExperience: 'first_time',
            timeAvailable: 30,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to start onboarding session');
      }

      const initialQuality = mapQualitySignals(data.qualitySignals);
      const initialSnapshot = mapStageSnapshot(data.stageSnapshot);

      const newSession: OnboardingSession = {
        sessionId: data.sessionId,
        currentStage: data.stageInfo.currentStage,
        totalStages: data.stageInfo.totalStages,
        overallProgress: 0,
        stageProgress: 0,
        agentPersonality: data.conversationContext.agentPersonality,
        conversationHistory: [
          {
            id: 'intro-1',
            type: 'ai',
            content: data.agentIntroduction,
            timestamp: new Date().toISOString(),
            stage: 1,
          },
          {
            id: 'question-1',
            type: 'ai', 
            content: data.firstQuestion,
            timestamp: new Date().toISOString(),
            stage: 1,
          },
        ],
        isActive: true,
        coverageByStage: mergeCoverage({}, initialSnapshot, initialQuality),
      };

      setSession(newSession);
      setStages(initializeStages(data.stageInfo.currentStage));
      
      // Announce to screen readers
      const announcement = `Onboarding session started. You're now in ${data.stageInfo.stageName}. ${data.agentIntroduction}`;
      announceToScreenReader(announcement);

      toast.success('Onboarding session started successfully!');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start onboarding';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Announce error to screen readers
      announceToScreenReader(`Error starting onboarding: ${errorMessage}`);
    } finally {
      setIsInitializing(false);
    }
  }, [userId, planType, initializeStages]);

  // Handle onboarding completion
  const handleCompleteOnboarding = useCallback(async () => {
    if (!session) return;

    try {
      const response = await fetch('/api/onboarding/complete/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          finalConfirmation: true,
          entrepreneurBrief: {},
          userFeedback: {
            conversationRating: 5,
            clarityRating: 5,
            helpfulnessRating: 5,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to complete onboarding');
      }

      if (data.deliverables) {
        try {
          sessionStorage.setItem('startupai:lastAnalysis', JSON.stringify(data.deliverables));
        } catch (storageError) {
          console.warn('Unable to persist analysis summary to sessionStorage:', storageError);
        }
      }

      const summarySnippet = data.deliverables?.summary
        ? `${data.deliverables.summary}`.slice(0, 160)
        : null;

      if (data.workflowTriggered && summarySnippet) {
        toast.success(`Onboarding complete. CrewAI summary: ${summarySnippet}${summarySnippet.length === 160 ? '…' : ''}`);
      } else {
        toast.success('Onboarding completed! Redirecting to your project...');
      }

      if (!data.workflowTriggered) {
        toast.warning('AI analysis is still running. Your project will update as soon as the deliverables are ready.');
      }

      announceToScreenReader('Onboarding completed successfully. Redirecting to your new project dashboard.');

      setTimeout(() => {
        router.push(data.dashboardRedirect);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding';
      toast.error(errorMessage);
      announceToScreenReader(`Error completing onboarding: ${errorMessage}`);
    }
  }, [session, router, announceToScreenReader]);

  // Handle message sending
  const handleSendMessage = useCallback(
    async (message: string, messageType: 'text' | 'voice_transcript' = 'text') => {
      if (!session) return;

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      const pendingMessageId = `pending_${messageId}`;

      const userMessage: ConversationMessage = {
        id: messageId,
        type: 'user',
        content: message,
        timestamp,
        stage: session.currentStage,
      };

      const pendingMessage: ConversationMessage = {
        id: pendingMessageId,
        type: 'system',
        content: 'Analyzing your response…',
        timestamp,
        stage: session.currentStage,
        isPending: true,
      };

      setSession(prev =>
        prev
          ? {
              ...prev,
              conversationHistory: [...prev.conversationHistory, userMessage, pendingMessage],
            }
          : null,
      );

      try {
        const response = await fetch('/api/onboarding/message/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session.sessionId,
            userMessage: message,
            messageType,
            timestamp,
            messageId,
            conversationContext: {
              userConfidence: 'medium',
              needsHelp: false,
            },
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to process message');
        }

        const quality = mapQualitySignals(data.qualitySignals);
        const snapshot = mapStageSnapshot(data.stageSnapshot);

        const aiMessage: ConversationMessage = {
          id: data.messageId,
          type: 'ai',
          content: data.agentResponse,
          timestamp: new Date().toISOString(),
          stage: data.stageProgress.currentStage,
          qualitySignals: quality,
          systemActions: data.systemActions,
        };

        const messages: ConversationMessage[] = [aiMessage];
        if (data.followUpQuestion) {
          messages.push({
            id: `followup_${data.messageId}`,
            type: 'ai',
            content: data.followUpQuestion,
            timestamp: new Date().toISOString(),
            stage: data.stageProgress.currentStage,
          });
        }

        setSession(prev => {
          if (!prev) return prev;
          const updatedHistory = prev.conversationHistory
            .filter(msg => msg.id !== pendingMessageId)
            .concat(messages);

          return {
            ...prev,
            currentStage: data.stageProgress.currentStage,
            overallProgress: data.stageProgress.overallProgress,
            stageProgress: data.stageProgress.stageProgress,
            conversationHistory: updatedHistory,
            coverageByStage: mergeCoverage(prev.coverageByStage, snapshot, quality),
          };
        });

        if (data.stageProgress.currentStage !== session.currentStage) {
          setStages(initializeStages(data.stageProgress.currentStage));
          const stageAnnouncement = `Advanced to stage ${data.stageProgress.currentStage}: ${data.stageProgress.nextStageName || 'Next stage'}`;
          announceToScreenReader(stageAnnouncement);
        }

        if (
          quality.qualityTags?.includes('clarity_low') ||
          quality.qualityTags?.includes('incomplete') ||
          data.systemActions?.requestClarification
        ) {
          toast.warning('Let’s add a bit more detail so the AI can give you stronger recommendations.');
        }

        if (data.systemActions?.triggerWorkflow) {
          handleCompleteOnboarding();
        }

        announceToScreenReader(data.agentResponse);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
        toast.error(errorMessage);
        setSession(prev =>
          prev
            ? {
                ...prev,
                conversationHistory: prev.conversationHistory.filter(
                  msg => msg.id !== messageId && msg.id !== pendingMessageId,
                ),
              }
            : null,
        );
        announceToScreenReader(`Error sending message: ${errorMessage}`);
      }
    },
    [session, initializeStages, handleCompleteOnboarding],
  );

  // Handle exit onboarding
  const handleExitOnboarding = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const confirmExit = useCallback(() => {
    toast.info('Onboarding session saved. You can resume anytime.');
    router.push('/dashboard');
  }, [router]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await initializeSession();
      setIsLoading(false);
    };

    init();
  }, [initializeSession]);

  // Loading state
  if (isLoading || isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {isInitializing ? 'Starting your AI consultation...' : 'Loading onboarding...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-semibold text-destructive">Unable to Start Onboarding</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Sidebar with progress tracking */}
        <OnboardingSidebar
          stages={stages}
          currentStage={session?.currentStage || 1}
          overallProgress={session?.overallProgress || 0}
          agentPersonality={session?.agentPersonality}
          onExit={handleExitOnboarding}
        />

        {/* Main conversation area */}
        <SidebarInset className="flex-1">
          {session && (
            <ConversationInterface
              session={session}
              onSendMessage={handleSendMessage}
              onComplete={handleCompleteOnboarding}
            />
          )}
        </SidebarInset>
      </div>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Onboarding?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved and you can resume this conversation anytime. 
              Are you sure you want to exit now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Onboarding</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>
              Save & Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
