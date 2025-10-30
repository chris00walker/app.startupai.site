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
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { OnboardingSidebar } from '@/components/onboarding/OnboardingSidebar';
import { ConversationInterface } from '@/components/onboarding/ConversationInterfaceV2';
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

  // Demo mode check - if userId is 'test-user-id' AND no real API interaction requested, use demo mode
  // When OPENAI_API_KEY is configured, we want to test real AI even in dev mode
  const isDemoMode = false; // Disabled to test real AI with OpenAI API key

  // State management
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [messages, setMessages] = useState<Array<{ role: string; content: string; timestamp: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [input, setInput] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

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

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          // Update AI message in real-time
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

      // Update progress
      const progress = Math.min(95, Math.floor((messages.length + 2) / 30 * 100));
      setSession(prev => prev ? { ...prev, overallProgress: progress } : null);

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[OnboardingWizard] Chat error:', error);
        toast.error(`Failed to send message: ${error.message}`);
      }
    } finally {
      setIsAILoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isAILoading, session, messages, isDemoMode]);

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

      const newSession: OnboardingSession = {
        sessionId: data.sessionId,
        currentStage: data.stageInfo.currentStage,
        totalStages: data.stageInfo.totalStages,
        overallProgress: 0,
        stageProgress: 0,
        agentPersonality: data.conversationContext.agentPersonality,
        isActive: true,
      };

      setSession(newSession);
      setStages(initializeStages(data.stageInfo.currentStage));

      // Add initial AI greeting message
      const initialMessage = `${data.agentIntroduction}\n\n${data.firstQuestion}`;
      setMessages([
        {
          role: 'assistant',
          content: initialMessage,
          timestamp: new Date().toISOString(),
        },
      ]);

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
    </SidebarProvider>
  );
}
