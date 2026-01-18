/**
 * ConsultantOnboardingWizard V2 - Conversational AI Interface
 *
 * This version uses a conversational interface with AI consultant
 * to gather consultant practice information and setup workspace.
 *
 * Based on OnboardingWizardV2 pattern with consultant-specific stages.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { OnboardingSidebar } from '@/components/onboarding/OnboardingSidebar';
import { ConversationInterface } from '@/components/onboarding/ConversationInterfaceV2';
import { SummaryModal, type StageSummaryData } from '@/components/onboarding/SummaryModal';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { trackOnboardingEvent } from '@/lib/analytics';
import { CONSULTANT_STAGES_CONFIG } from '@/lib/onboarding/consultant-stages-config';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ConsultantOnboardingWizardProps {
  userId: string;
  userEmail: string;
}

interface OnboardingSession {
  sessionId: string;
  currentStage: number;
  totalStages: number;
  overallProgress: number;
  stageProgress: number;
  agentPersonality: any;
  isActive: boolean;
}

interface StageInfo {
  stage: number;
  name: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

// ============================================================================
// Main ConsultantOnboardingWizard Component
// ============================================================================

export function ConsultantOnboardingWizardV2({ userId, userEmail }: ConsultantOnboardingWizardProps) {
  const router = useRouter();

  // State management
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [messages, setMessages] = useState<Array<{ role: string; content: string; timestamp: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showStartNewDialog, setShowStartNewDialog] = useState(false);
  const [input, setInput] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Summary Modal state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryStageData, setSummaryStageData] = useState<StageSummaryData[]>([]);
  const [isSummarySubmitting, setIsSummarySubmitting] = useState(false);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // Initialize consultant-specific stages
  const initializeStages = useCallback((currentStage: number = 1) => {
    const stageNames = [
      'Welcome & Practice Overview',
      'Practice Size & Structure',
      'Industries & Services',
      'Current Tools & Workflow',
      'Client Management',
      'Pain Points & Challenges',
      'Goals & White-Label Setup',
    ];

    const stageDescriptions = [
      'Getting to know you and your consulting practice',
      'Understanding your team size and structure',
      'Exploring the industries and services you focus on',
      'Learning about your current tools and processes',
      'Understanding how you manage client relationships',
      'Identifying the biggest challenges in your practice',
      'Setting goals and exploring white-label options',
    ];

    return stageNames.map((name, index) => ({
      stage: index + 1,
      name,
      description: stageDescriptions[index],
      isComplete: index + 1 < currentStage,
      isActive: index + 1 === currentStage,
    }));
  }, []);

  // Transform consultant stage data to SummaryModal format
  const transformConsultantDataToSummary = useCallback((briefData: Record<string, unknown>): StageSummaryData[] => {
    return CONSULTANT_STAGES_CONFIG.map(stageConfig => {
      const stageDataFields: Record<string, string | string[] | undefined> = {};

      for (const field of stageConfig.dataToCollect) {
        const value = briefData[field];
        if (value !== undefined) {
          stageDataFields[field] = value as string | string[];
        }
      }

      return {
        stage: stageConfig.stage,
        stageName: stageConfig.name,
        data: stageDataFields,
      };
    });
  }, []);

  // Refetch session status
  const refetchSessionStatus = useCallback(async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/consultant/onboarding/status?sessionId=${session.sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Track stage advancement
          if (session.currentStage !== data.currentStage) {
            trackOnboardingEvent.stageAdvanced(
              session.sessionId,
              session.currentStage,
              data.currentStage
            );
          }

          setSession(prev => prev ? {
            ...prev,
            currentStage: data.currentStage,
            overallProgress: data.overallProgress,
            stageProgress: data.stageProgress,
          } : null);

          setStages(initializeStages(data.currentStage));

          console.log('[ConsultantOnboarding] Session status updated:', {
            stage: data.currentStage,
            progress: data.overallProgress,
            completed: data.completed,
          });

          // Check if onboarding is complete - show SummaryModal
          if (data.completed && data.briefData) {
            const summaryData = transformConsultantDataToSummary(data.briefData);
            setSummaryStageData(summaryData);
            setShowSummaryModal(true);
            console.log('[ConsultantOnboarding] Practice setup complete, showing summary modal');
          }
        }
      }
    } catch (error) {
      console.error('[ConsultantOnboarding] Failed to refetch session status:', error);
    }
  }, [session, initializeStages, transformConsultantDataToSummary]);

  // Handle form submit - stream AI response
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isAILoading || !session) return;

    const userMessage = input.trim();
    setInput('');
    setIsAILoading(true);

    // Add user message
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Track message sent
    trackOnboardingEvent.messageSent(
      session.sessionId,
      session.currentStage,
      userMessage.length
    );

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/consultant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map(m => ({ role: m.role, content: m.content })),
          sessionId: session.sessionId,
          userId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response (SSE format)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            // SSE format: lines starting with '0:' contain text deltas
            if (line.trim().startsWith('0:')) {
              const jsonStr = line.trim().slice(2);
              try {
                const parsed = JSON.parse(jsonStr);
                if (typeof parsed === 'string') {
                  accumulatedText += parsed;
                  // Update AI message in real-time
                  setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage?.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        { ...lastMessage, content: accumulatedText },
                      ];
                    } else {
                      return [
                        ...prev,
                        {
                          role: 'assistant',
                          content: accumulatedText,
                          timestamp: new Date().toISOString(),
                        },
                      ];
                    }
                  });
                }
              } catch (e) {
                // Skip malformed JSON
              }
            }
          }
        }
      }

      // Update progress
      const progress = Math.min(95, Math.floor((messages.length + 2) / 30 * 100));
      setSession(prev => prev ? { ...prev, overallProgress: progress } : null);

      // Refetch session status
      await refetchSessionStatus();

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[ConsultantOnboarding] Chat error:', error);
        toast.error(`Failed to send message: ${error.message}`);
      }
    } finally {
      setIsAILoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isAILoading, session, messages, userId, refetchSessionStatus]);

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

  // Initialize onboarding session
  const initializeSession = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      console.log('[ConsultantOnboarding] Starting session for user:', userId);

      const response = await fetch('/api/consultant/onboarding/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userEmail,
        }),
      });

      console.log('[ConsultantOnboarding] Response status:', response.status);
      const data = await response.json();
      console.log('[ConsultantOnboarding] Response data:', data);

      if (!data.success) {
        const errorMsg = data.error?.message || 'Failed to start onboarding session';
        console.error('[ConsultantOnboarding] Start failed:', errorMsg);
        throw new Error(errorMsg);
      }

      const newSession: OnboardingSession = {
        sessionId: data.sessionId,
        currentStage: data.stageInfo?.currentStage || 1,
        totalStages: data.stageInfo?.totalStages || 7,
        overallProgress: data.overallProgress || 0,
        stageProgress: data.stageProgress || 0,
        agentPersonality: data.conversationContext?.agentPersonality || {
          name: 'Maya',
          role: 'Consulting Practice Specialist',
          tone: 'Professional and collaborative',
          expertise: 'consulting practice management',
        },
        isActive: true,
      };

      setSession(newSession);
      setStages(initializeStages(newSession.currentStage));

      // Track session started
      trackOnboardingEvent.sessionStarted(
        newSession.sessionId,
        newSession.currentStage,
        'consultant'
      );

      // Check if resuming existing session
      if (data.resuming && data.conversationHistory && data.conversationHistory.length > 0) {
        // Restore conversation history
        setMessages(data.conversationHistory);

        // Announce to screen readers
        const announcement = `Resuming onboarding session at stage ${newSession.currentStage}: ${data.stageInfo?.stageName}. Conversation history restored.`;
        announceToScreenReader(announcement);

        toast.success('Resuming your conversation with Maya...');
      } else {
        // Add initial AI greeting message for new session
        const initialMessage = data.agentIntroduction
          ? `${data.agentIntroduction}\n\n${data.firstQuestion || ''}`
          : `Hi! I'm Maya, your consulting practice specialist. I'm here to help you set up your workspace and optimize your client management workflow.\n\nTo get started, could you tell me about your consulting practice? What's the name of your firm or agency?`;

        setMessages([
          {
            role: 'assistant',
            content: initialMessage,
            timestamp: new Date().toISOString(),
          },
        ]);

        // Announce to screen readers
        const announcement = `Onboarding session started. You're now in Welcome & Practice Overview. ${initialMessage}`;
        announceToScreenReader(announcement);

        toast.success('Welcome! Let\'s set up your consulting workspace.');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start onboarding';
      setError(errorMessage);
      toast.error(errorMessage);

      announceToScreenReader(`Error starting onboarding: ${errorMessage}`);
    } finally {
      setIsInitializing(false);
      setIsLoading(false);
    }
  }, [userId, userEmail, initializeStages, announceToScreenReader]);

  // Handle onboarding completion
  const handleCompleteOnboarding = useCallback(async () => {
    if (!session) return;

    try {
      const response = await fetch('/api/consultant/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          userId,
          messages,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to complete onboarding');
      }

      // Track completion
      trackOnboardingEvent.completed(
        session.sessionId,
        0, // Duration not tracked in this component
        Boolean(data.workflowId)
      );

      // Log validation workflow if triggered
      if (data.workflowId) {
        console.log('[ConsultantOnboarding] Validation workflow started:', data.workflowId);
        toast.success('Onboarding complete! Validation analysis has been started.');
      } else {
        toast.success('Onboarding complete! Welcome to your consultant dashboard.');
      }

      // Redirect to consultant dashboard
      router.push('/consultant-dashboard');

    } catch (error: any) {
      console.error('[ConsultantOnboarding] Complete error:', error);
      toast.error(`Failed to complete onboarding: ${error.message}`);
    }
  }, [session, userId, messages, router]);

  // Handle SummaryModal approve - finalize consultant setup
  const handleSummaryApprove = useCallback(async () => {
    if (!session) return;

    setIsSummarySubmitting(true);
    console.log('[ConsultantOnboarding] Summary approved, finalizing practice setup');

    try {
      // Call the complete endpoint to finalize the setup
      await handleCompleteOnboarding();
    } catch (error: any) {
      console.error('[ConsultantOnboarding] Error finalizing practice setup:', error);
      toast.error(`Failed to complete setup: ${error.message}`);
    } finally {
      setIsSummarySubmitting(false);
      setShowSummaryModal(false);
    }
  }, [session, handleCompleteOnboarding]);

  // Handle SummaryModal revise - return to chat for corrections
  const handleSummaryRevise = useCallback(() => {
    setShowSummaryModal(false);
    console.log('[ConsultantOnboarding] User wants to revise, returning to chat');

    // Add Maya's revision prompt to the conversation
    const revisionMessage = {
      role: 'assistant',
      content: "I'd be happy to help you revise any of your practice information. What would you like to update or clarify? You can tell me which details need to be corrected, and I'll help you make those changes.",
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, revisionMessage]);

    toast.info('You can now revise your practice information. Just tell Maya what you\'d like to change.');
  }, []);

  // Handle exit
  const handleExitOnboarding = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const confirmExit = useCallback(() => {
    // Track early exit
    if (session) {
      trackOnboardingEvent.exitedEarly(
        session.sessionId,
        session.currentStage,
        session.overallProgress
      );
    }
    toast.info('Progress saved. You can resume anytime.');
    router.push('/consultant-dashboard');
  }, [router, session]);

  // Handle start new conversation
  const handleStartNew = useCallback(() => {
    setShowStartNewDialog(true);
  }, []);

  const confirmStartNew = useCallback(async () => {
    setShowStartNewDialog(false);
    setSession(null);
    setMessages([]);
    setStages([]);
    setIsLoading(true);
    await initializeSession();
  }, [initializeSession]);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Loading state
  if (isLoading || isInitializing) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Setting up your workspace...</h2>
          <p className="text-muted-foreground">This will only take a moment</p>
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
            <Button variant="outline" onClick={() => router.push('/consultant-dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-[100dvh] w-full overflow-hidden" data-testid="onboarding">
        {/* Sidebar with progress tracking */}
        <OnboardingSidebar
          stages={stages}
          currentStage={session?.currentStage || 1}
          overallProgress={session?.overallProgress || 0}
          agentPersonality={session?.agentPersonality}
          onExit={handleExitOnboarding}
          onStartNew={handleStartNew}
        />

        {/* Main conversation area */}
        <SidebarInset className="flex-1 overflow-hidden">
          {session && (
            <ConversationInterface
              session={session}
              messages={messages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isLoading={isAILoading}
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

      {/* Start new conversation dialog */}
      <AlertDialog open={showStartNewDialog} onOpenChange={setShowStartNewDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start New Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your current progress and start fresh. Your previous responses will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStartNew}>
              Start Fresh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Practice Setup Summary Modal */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        stageData={summaryStageData}
        onApprove={handleSummaryApprove}
        onRevise={handleSummaryRevise}
        isSubmitting={isSummarySubmitting}
        title="Practice Setup Summary"
        description="Review your practice information before finalizing your workspace setup. Maya has gathered this information to help customize your consultant experience."
        approveButtonText="Complete Setup"
        reviseButtonText="Make Changes"
        stagesConfig={CONSULTANT_STAGES_CONFIG}
      />
    </SidebarProvider>
  );
}
