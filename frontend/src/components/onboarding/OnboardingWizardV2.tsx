/**
 * OnboardingWizard V2 - Vercel AI SDK Integration
 *
 * This version uses Vercel AI SDK's useChat hook for streaming conversations
 * with the AI consultant, replacing the custom message handling logic.
 *
 * Key changes from V1:
 * - Uses useChat() instead of manual fetch calls
 * - Streaming responses from AI
 * - Automatic state management
 * - Optimistic UI updates
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
// Sidebar primitives no longer needed - using custom sidebar component
import { OnboardingSidebar } from '@/components/onboarding/OnboardingSidebar';
import { ConversationInterface } from '@/components/onboarding/ConversationInterfaceV2';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { trackOnboardingEvent, trackCrewAIEvent } from '@/lib/analytics';

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
// Main OnboardingWizard Component
// ============================================================================

export function OnboardingWizard({ userId, planType, userEmail }: OnboardingWizardProps) {
  const router = useRouter();

  // Demo mode check - controlled by environment variable
  // Set NEXT_PUBLIC_DEMO_MODE=true to enable demo responses without API calls
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

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
  const [isResuming, setIsResuming] = useState(false);
  const [input, setInput] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Analysis state
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
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

  // Poll CrewAI analysis status
  const startAnalysisPolling = useCallback((wid: string, pid: string) => {
    // Clear any existing interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/crewai/status?run_id=${wid}`);
        if (response.ok) {
          const data = await response.json();

          console.log('[OnboardingWizard] Analysis status:', {
            state: data.state,
            progress: data.progress,
          });

          setAnalysisProgress(data.progress || 0);

          if (data.state === 'COMPLETED') {
            setAnalysisStatus('completed');
            if (analysisIntervalRef.current) {
              clearInterval(analysisIntervalRef.current);
              analysisIntervalRef.current = null;
            }

            // Track CrewAI analysis completed
            trackCrewAIEvent.completed(pid, data.duration || 0, true);

            toast.success('Analysis complete! Redirecting to your project...');

            // Redirect based on user type after short delay
            setTimeout(() => {
              // Consultants go to their client dashboard, founders to project view
              const dashboardRoute = planType === 'sprint'
                ? '/clients'
                : `/dashboard/project/${pid}`;
              router.push(dashboardRoute);
            }, 2000);
          } else if (data.state === 'FAILED') {
            setAnalysisStatus('failed');
            if (analysisIntervalRef.current) {
              clearInterval(analysisIntervalRef.current);
              analysisIntervalRef.current = null;
            }

            // Track CrewAI analysis failed
            trackCrewAIEvent.failed(pid, data.error || 'Unknown error', data.duration || 0);

            toast.error('Analysis failed. Redirecting to dashboard...');

            setTimeout(() => {
              // Consultants go to clients page, founders to founder dashboard
              const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';
              router.push(dashboardRoute);
            }, 2000);
          }
        }
      } catch (error) {
        console.error('[OnboardingWizard] Failed to poll analysis status:', error);
        // Defensive cleanup on error to prevent orphaned intervals
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current);
          analysisIntervalRef.current = null;
        }
      }
    };

    // Poll immediately, then every 5 seconds
    pollStatus();
    analysisIntervalRef.current = setInterval(pollStatus, 5000);
  }, [router]);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  // Refetch session status to get updated stage
  const refetchSessionStatus = useCallback(async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/onboarding/status?sessionId=${session.sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Track stage advancement if stage changed
          if (session.currentStage !== data.currentStage) {
            trackOnboardingEvent.stageAdvanced(session.sessionId, session.currentStage, data.currentStage);
          }

          // Update session state with new stage and progress
          setSession(prev => prev ? {
            ...prev,
            currentStage: data.currentStage,
            overallProgress: data.overallProgress,
            stageProgress: data.stageProgress,
          } : null);

          // Update stages UI
          setStages(initializeStages(data.currentStage));

          console.log('[OnboardingWizard] Session status updated:', {
            stage: data.currentStage,
            progress: data.overallProgress,
          });

          // Check for completion with CrewAI integration
          if (data.status === 'completed' && data.completion) {
            const { projectId: pid, workflowId: wid } = data.completion;
            if (pid && wid) {
              console.log('[OnboardingWizard] Onboarding completed, starting analysis monitoring:', {
                projectId: pid,
                workflowId: wid,
              });
              setProjectId(pid);
              setWorkflowId(wid);
              setShowAnalysisModal(true);
              setAnalysisStatus('running');
              startAnalysisPolling(wid, pid);
            }
          }
        }
      }
    } catch (error) {
      console.error('[OnboardingWizard] Failed to refetch session status:', error);
    }
  }, [session, initializeStages, startAnalysisPolling]);

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
    trackOnboardingEvent.messageSent(session.sessionId, session.currentStage, userMessage.length);

    // Demo mode - use mock responses
    if (isDemoMode) {
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockResponses = [
        "That's a really interesting problem! I can see how that would be valuable. Let me ask you this: Have you talked to any potential customers about this problem yet? What did they say?",
        "Great insight! It sounds like you're on to something. Now, can you tell me more about who specifically experiences this problem the most? Try to be as specific as possible about this customer segment.",
        "Excellent! I'm starting to get a clear picture. What have you learned about how these customers currently try to solve this problem? What workarounds or alternatives are they using today?",
        "That makes sense. Based on what you've shared, what do you think is the biggest pain point for them? What makes this problem urgent or important enough that they'd pay to solve it?",
        "Perfect! You're making great progress. Let's shift gears a bit - how does your solution actually solve this problem? Walk me through the core mechanism or approach.",
      ];

      const mockResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: mockResponse,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Update progress
      const progress = Math.min(95, Math.floor((messages.length + 2) / 30 * 100));
      setSession(prev => prev ? { ...prev, overallProgress: progress } : null);

      setIsAILoading(false);
      return;
    }

    // Real mode - call API
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map(m => ({ role: m.role, content: m.content })),
          sessionId: session.sessionId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response - parse SSE format
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // Remove 'data: ' prefix

              // Skip metadata events, only process text deltas
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'text-delta' && parsed.delta) {
                  accumulatedText += parsed.delta;
                }
              } catch (e) {
                // Ignore parse errors for non-JSON lines
              }
            }
          }

          // Update AI message in real-time
          if (accumulatedText) {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.role === 'assistant') {
                // Update existing assistant message
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: accumulatedText },
                ];
              } else {
                // Add new assistant message
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
        }
      }

      // Update progress
      const progress = Math.min(95, Math.floor((messages.length + 2) / 30 * 100));
      setSession(prev => prev ? { ...prev, overallProgress: progress } : null);

      // Refetch session status to get updated stage (if AI advanced stages)
      await refetchSessionStatus();

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[OnboardingWizard] Chat error:', error);
        toast.error(`Failed to send message: ${error.message}`);
      }
    } finally {
      setIsAILoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isAILoading, session, messages, isDemoMode, refetchSessionStatus]);

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
  const initializeSession = useCallback(async (forceNew = false) => {
    setIsInitializing(true);
    setError(null);

    try {
      // Demo mode - use mock data
      if (isDemoMode) {
        const mockSession: OnboardingSession = {
          sessionId: 'demo-session-' + Date.now(),
          currentStage: 1,
          totalStages: 7,
          overallProgress: 0,
          stageProgress: 0,
          agentPersonality: {
            name: 'Alex',
            role: 'Strategic Business Consultant',
            tone: 'friendly, encouraging, professionally direct',
            expertise: 'Lean Startup, Customer Development, Business Model Design',
          },
          isActive: true,
        };

        setSession(mockSession);
        setStages(initializeStages(1));

        // Add initial demo messages
        setMessages([
          {
            role: 'assistant',
            content: `Hi there! I'm Alex, and I'm excited to help you think through your business idea using proven validation methods.

Over the next 15-20 minutes, I'll ask you questions about your customers, the problem you're solving, your solution approach, and your goals. This isn't a pitch session - it's a strategic conversation to help you identify what assumptions you need to test and what experiments you should run first.

There are no wrong answers here. In fact, "I don't know yet" is often the most honest and valuable response because it helps us identify what you need to learn.

Ready to dive in? Let's start with the most important question:

**What business idea are you most excited about right now?**`,
            timestamp: new Date().toISOString(),
          },
        ]);

        toast.success('Demo mode: UI preview loaded successfully!');
        return;
      }

      // Real mode - call API
      console.log('📡 Calling /api/onboarding/start with:', { userId, planType });
      const response = await fetch('/api/onboarding/start/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planType,
          forceNew,
          userContext: {
            referralSource: 'direct',
            previousExperience: 'first_time',
            timeAvailable: 30,
          },
        }),
        credentials: 'include', // Ensure cookies are sent
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📡 Response data:', data);

      if (!data.success) {
        const errorMsg = data.error?.message || 'Failed to start onboarding session';
        console.error('❌ Onboarding start failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Track session started
      trackOnboardingEvent.sessionStarted(data.sessionId, data.stageInfo.currentStage, planType);

      const newSession: OnboardingSession = {
        sessionId: data.sessionId,
        currentStage: data.stageInfo.currentStage,
        totalStages: data.stageInfo.totalStages,
        overallProgress: data.overallProgress || 0,
        stageProgress: data.stageProgress || 0,
        agentPersonality: data.conversationContext.agentPersonality,
        isActive: true,
      };

      setSession(newSession);
      setStages(initializeStages(data.stageInfo.currentStage));

      // Check if resuming existing session
      if (data.resuming && data.conversationHistory && data.conversationHistory.length > 0) {
        // Restore conversation history
        setMessages(data.conversationHistory);
        setIsResuming(true);

        // Announce to screen readers
        const announcement = `Resuming onboarding session at stage ${newSession.currentStage}: ${data.stageInfo.stageName}. Conversation history restored.`;
        announceToScreenReader(announcement);

        toast.success('Resuming your conversation with Alex...');
      } else {
        setIsResuming(false);
        // Add initial AI greeting message for new or empty session
        // The API always returns agentIntroduction and firstQuestion
        const initialMessage = `${data.agentIntroduction}\n\n${data.firstQuestion}`;

        setMessages([
          {
            role: 'assistant',
            content: initialMessage,
            timestamp: new Date().toISOString(),
          },
        ]);

        // Announce to screen readers
        const announcement = `Onboarding session started. You're now in ${data.stageInfo.stageName}. ${initialMessage.substring(0, 100)}...`;
        announceToScreenReader(announcement);

        toast.success('Onboarding session started successfully!');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start onboarding';
      setError(errorMessage);
      toast.error(errorMessage);

      // Announce error to screen readers
      announceToScreenReader(`Error starting onboarding: ${errorMessage}`);
    } finally {
      setIsInitializing(false);
    }
  }, [userId, planType, initializeStages, announceToScreenReader, isDemoMode]);

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

      // Track onboarding completed
      // Note: We don't have session start time stored, so using 0 for now
      trackOnboardingEvent.completed(session.sessionId, 0, data.workflowTriggered || false);

      // Track CrewAI analysis started if workflow was triggered
      if (data.workflowTriggered && data.projectId) {
        trackCrewAIEvent.started(data.projectId, 'founder_validation');
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

  // Handle exit onboarding
  const handleExitOnboarding = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const confirmExit = useCallback(() => {
    // Track exit early
    if (session) {
      const progressPercent = Math.round((session.currentStage / session.totalStages) * 100);
      trackOnboardingEvent.exitedEarly(session.sessionId, session.currentStage, progressPercent);
    }

    toast.info('Onboarding session saved. You can resume anytime.');

    // Redirect to the appropriate dashboard based on plan type
    // Consultants go to /clients to manage their client portfolio
    const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';
    router.push(dashboardRoute);
  }, [router, planType, session]);

  // Handle start new conversation
  const handleStartNew = useCallback(() => {
    setShowStartNewDialog(true);
  }, []);

  const confirmStartNew = useCallback(async () => {
    if (!session) {
      // No session to abandon, just reinitialize with forceNew
      setShowStartNewDialog(false);
      await initializeSession(true);
      return;
    }

    try {
      // Abandon current session (for cleanup/analytics)
      await fetch('/api/onboarding/abandon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
    } catch (e) {
      // Silent fail - forceNew will ensure we get a fresh session anyway
      console.warn('[OnboardingWizard] Failed to abandon session:', e);
    }

    // Reset local state
    setSession(null);
    setMessages([]);
    setStages(initializeStages(1));
    setIsResuming(false);
    setShowStartNewDialog(false);

    // Reinitialize with fresh session (forceNew bypasses resumption)
    toast.success('Starting fresh conversation with Alex...');
    await initializeSession(true);
  }, [session, initializeSession, initializeStages]);

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
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-border" />
            <div className="absolute inset-0 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isInitializing ? 'Starting your AI consultation' : 'Loading'}
            </p>
            <p className="text-xs text-muted-foreground">This will just take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-destructive text-xl">!</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Unable to Start Onboarding</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button size="sm" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';
                router.push(dashboardRoute);
              }}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
        {/* Sidebar with progress tracking */}
        <div className="hidden md:flex w-[320px] flex-shrink-0">
          <OnboardingSidebar
            stages={stages}
            currentStage={session?.currentStage || 1}
            overallProgress={session?.overallProgress || 0}
            agentPersonality={session?.agentPersonality}
            onExit={handleExitOnboarding}
            onStartNew={handleStartNew}
            isResuming={isResuming}
          />
        </div>

        {/* Main conversation area */}
        <main className="flex-1 overflow-hidden">
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
        </main>
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

      {/* Start New Conversation confirmation dialog */}
      <AlertDialog open={showStartNewDialog} onOpenChange={setShowStartNewDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start New Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end your current conversation and start fresh with Alex.
              Your previous conversation will be saved but you&apos;ll begin from the beginning.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Current</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStartNew}>
              Start Fresh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Analysis Running Modal */}
      <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Analyzing Your Business Idea</DialogTitle>
            <DialogDescription>
              Our AI team is analyzing your responses and creating a comprehensive
              value proposition and validation roadmap. This typically takes 3-5 minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <Progress value={analysisProgress} />
            <p className="text-sm text-muted-foreground text-center">
              {analysisStatus === 'running' && `${Math.round(analysisProgress)}% complete`}
              {analysisStatus === 'completed' && 'Analysis complete! Redirecting...'}
              {analysisStatus === 'failed' && 'Analysis encountered an error.'}
            </p>

            {analysisStatus === 'running' && (
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>✓ Business concept validated</p>
                <p>⟳ Customer profile analysis in progress...</p>
                <p className="opacity-50">○ Competitive positioning</p>
                <p className="opacity-50">○ Value proposition design</p>
                <p className="opacity-50">○ Validation roadmap</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
