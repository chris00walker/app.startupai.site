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
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
// Sidebar primitives no longer needed - using custom sidebar component
import { OnboardingSidebar } from '@/components/onboarding/OnboardingSidebar';
import { ConversationInterface } from '@/components/onboarding/ConversationInterfaceV2';
import { FoundersBriefReview, EntrepreneurBrief } from '@/components/onboarding/FoundersBriefReview';
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
  const searchParams = useSearchParams();
  const forceNewFromUrl = searchParams?.get('forceNew') === 'true';

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

  // HITL approval state
  const [analysisState, setAnalysisState] = useState<
    'idle' | 'analyzing' | 'awaiting_approval' | 'completed' | 'failed'
  >('idle');
  const [hitlCheckpoint, setHitlCheckpoint] = useState<{
    name: string;
    approval_id: string | null;
    run_id: string;
  } | null>(null);
  const [entrepreneurBrief, setEntrepreneurBrief] = useState<Partial<EntrepreneurBrief> | null>(null);
  const [isApprovingBrief, setIsApprovingBrief] = useState(false);

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
            hitl_checkpoint: data.hitl_checkpoint,
            approval_id: data.approval_id,
          });

          setAnalysisProgress(data.progress || 0);

          // Handle PAUSED state with HITL checkpoint
          // Note: hitl_checkpoint is an object { checkpoint, title, description, options, ... }
          const hitlData = data.hitl_checkpoint;
          const checkpointName = typeof hitlData === 'string' ? hitlData : hitlData?.checkpoint;

          if (data.state === 'PAUSED' && checkpointName) {
            // Stop polling - we're waiting for human input
            if (analysisIntervalRef.current) {
              clearInterval(analysisIntervalRef.current);
              analysisIntervalRef.current = null;
            }

            console.log('[OnboardingWizard] HITL checkpoint detected:', checkpointName);

            // Store checkpoint info for the approval UI
            setHitlCheckpoint({
              name: checkpointName,
              approval_id: data.approval_id || null,
              run_id: wid,
            });

            // Fetch the Founder's Brief for display
            // Priority: 1) Approval request task_output (AI-compiled), 2) entrepreneur_briefs table (user input)
            try {
              let briefFound = false;

              // Try to get Brief from approval request's task_output (contains AI-compiled Founder's Brief)
              if (data.approval_id) {
                const approvalResponse = await fetch(`/api/approvals/${data.approval_id}`);
                if (approvalResponse.ok) {
                  // API returns approval object directly, not wrapped in { approval: ... }
                  const approvalData = await approvalResponse.json();
                  const taskOutput = approvalData.task_output;
                  if (taskOutput?.founders_brief) {
                    // AI-compiled Brief from Modal
                    setEntrepreneurBrief(taskOutput.founders_brief);
                    briefFound = true;
                    console.log('[OnboardingWizard] Using AI-compiled Brief from approval request');
                  }
                }
              }

              // Fallback: fetch from entrepreneur_briefs table (user's original input)
              if (!briefFound) {
                const briefResponse = await fetch(`/api/onboarding/brief?projectId=${pid}`);
                if (briefResponse.ok) {
                  const briefData = await briefResponse.json();
                  if (briefData.brief) {
                    setEntrepreneurBrief(briefData.brief);
                    console.log('[OnboardingWizard] Using Brief from entrepreneur_briefs table');
                  }
                }
              }
            } catch (briefError) {
              console.warn('[OnboardingWizard] Could not fetch brief:', briefError);
              // Continue without brief data - will show what we have
            }

            // Switch to approval UI
            setAnalysisState('awaiting_approval');
            setShowAnalysisModal(false);
            return;
          }

          if (data.state === 'COMPLETED') {
            setAnalysisStatus('completed');
            setAnalysisState('completed');
            if (analysisIntervalRef.current) {
              clearInterval(analysisIntervalRef.current);
              analysisIntervalRef.current = null;
            }

            // Track CrewAI analysis completed
            trackCrewAIEvent.completed(pid, data.duration || 0, true);

            toast.success('Analysis complete! Redirecting to your results...');

            // Redirect to the gate page to see full results
            setTimeout(() => {
              const dashboardRoute = planType === 'sprint'
                ? '/clients'
                : `/project/${pid}/gate`;
              router.push(dashboardRoute);
            }, 2000);
          } else if (data.state === 'FAILED') {
            setAnalysisStatus('failed');
            setAnalysisState('failed');
            if (analysisIntervalRef.current) {
              clearInterval(analysisIntervalRef.current);
              analysisIntervalRef.current = null;
            }

            // Track CrewAI analysis failed
            trackCrewAIEvent.failed(pid, data.error || 'Unknown error', data.duration || 0);

            toast.error('Analysis failed. Redirecting to dashboard...');

            setTimeout(() => {
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
  }, [router, planType]);

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
          // Track and announce stage advancement if stage changed
          if (session.currentStage !== data.currentStage && data.currentStage > session.currentStage) {
            trackOnboardingEvent.stageAdvanced(session.sessionId, session.currentStage, data.currentStage);

            // Show toast notification for stage completion
            const stageNames = [
              'Welcome & Introduction', 'Customer Discovery', 'Problem Definition',
              'Solution Validation', 'Competitive Analysis', 'Resources & Constraints', 'Goals & Next Steps'
            ];
            toast.success(
              `Stage complete! Moving to: ${stageNames[data.currentStage - 1]}`,
              { duration: 4000 }
            );
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

      // Wait for onFinish callback to complete DB write before refetching
      // This fixes the race condition where refetchSessionStatus() reads stale data
      await new Promise(resolve => setTimeout(resolve, 800));

      // Refetch session status to get updated stage and progress from database
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
  }, [input, isAILoading, session, messages, refetchSessionStatus]);

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
  }, [userId, planType, initializeStages, announceToScreenReader]);

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
      trackOnboardingEvent.completed(session.sessionId, 0, data.workflowTriggered || false);

      // Track CrewAI analysis started if workflow was triggered
      if (data.workflowTriggered && data.projectCreated?.projectId) {
        trackCrewAIEvent.started(data.projectCreated.projectId, 'founder_validation');
      }

      // Store deliverables for later use
      if (data.deliverables) {
        try {
          sessionStorage.setItem('startupai:lastAnalysis', JSON.stringify(data.deliverables));
        } catch (storageError) {
          console.warn('Unable to persist analysis summary to sessionStorage:', storageError);
        }
      }

      announceToScreenReader('Onboarding completed. Compiling your Founder\'s Brief...');

      // If workflow was triggered, show analysis modal and start polling
      // Do NOT redirect immediately - wait for HITL checkpoint or completion
      if (data.workflowTriggered && data.workflowId && data.projectCreated?.projectId) {
        const wid = data.workflowId;
        const pid = data.projectCreated.projectId;

        console.log('[OnboardingWizard] Starting analysis workflow:', { wid, pid });

        // Set up analysis state
        setWorkflowId(wid);
        setProjectId(pid);
        setAnalysisState('analyzing');
        setAnalysisStatus('running');
        setShowAnalysisModal(true);

        toast.success('Compiling your Founder\'s Brief...');

        // Start polling - will handle HITL checkpoint or completion
        startAnalysisPolling(wid, pid);
      } else {
        // No workflow triggered - redirect to dashboard
        toast.info('Onboarding completed. Redirecting to dashboard...');
        setTimeout(() => {
          const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';
          router.push(dashboardRoute);
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding';
      toast.error(errorMessage);
      announceToScreenReader(`Error completing onboarding: ${errorMessage}`);
    }
  }, [session, router, announceToScreenReader, startAnalysisPolling, planType]);

  // Handle exit onboarding
  const handleExitOnboarding = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const confirmExit = useCallback(async () => {
    // Track exit early
    if (session) {
      const progressPercent = Math.round((session.currentStage / session.totalStages) * 100);
      trackOnboardingEvent.exitedEarly(session.sessionId, session.currentStage, progressPercent);

      // Actually pause the session in the database
      try {
        await fetch('/api/onboarding/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.sessionId }),
        });
      } catch (e) {
        console.warn('[OnboardingWizard] Failed to pause session:', e);
        // Continue with exit even if pause fails
      }
    }

    toast.info('Session saved. You can resume anytime from the dashboard.');

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

  // Handle HITL Brief approval
  const handleApproveFoundersBrief = useCallback(async () => {
    if (!hitlCheckpoint || !workflowId || !projectId) {
      console.error('[OnboardingWizard] Missing required data for approval');
      return;
    }

    setIsApprovingBrief(true);

    try {
      if (hitlCheckpoint.approval_id) {
        // Use existing approval API
        const response = await fetch(`/api/approvals/${hitlCheckpoint.approval_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve',
            decision: 'approved',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to approve brief');
        }
      } else {
        // No approval_id - call resume directly via API
        const response = await fetch('/api/crewai/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            run_id: hitlCheckpoint.run_id,
            checkpoint: hitlCheckpoint.name,
            decision: 'approved',
            feedback: null,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to resume workflow');
        }
      }

      console.log('[OnboardingWizard] Brief approved, redirecting to analysis page');
      toast.success('Brief approved! Redirecting to validation progress...');

      // Reset HITL state
      setHitlCheckpoint(null);
      setAnalysisState('analyzing');

      // Redirect to analysis page where user can see Phase 1-4 progress
      // The analysis page has ValidationProgressTimeline for real-time updates
      setTimeout(() => {
        const analysisRoute = planType === 'sprint'
          ? '/clients'
          : `/project/${projectId}/analysis`;
        router.push(analysisRoute);
      }, 1500);
    } catch (error) {
      console.error('[OnboardingWizard] Failed to approve brief:', error);
      toast.error('Failed to approve brief. Please try again.');
    } finally {
      setIsApprovingBrief(false);
    }
  }, [hitlCheckpoint, workflowId, projectId, planType, router]);

  // Handle HITL Brief change request
  const handleRequestBriefChanges = useCallback(async (feedback: string) => {
    if (!hitlCheckpoint?.approval_id) {
      // For MVP, show a message about contacting support
      toast.info('Change requests require support assistance. Please contact support@startupai.com with your feedback.');
      return;
    }

    try {
      const response = await fetch(`/api/approvals/${hitlCheckpoint.approval_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          decision: 'changes_requested',
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast.info('Feedback submitted. Our team will review and help make adjustments.');

      // For MVP, redirect to dashboard - complex to re-enter chat
      setTimeout(() => {
        const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';
        router.push(dashboardRoute);
      }, 2000);
    } catch (error) {
      console.error('[OnboardingWizard] Failed to submit change request:', error);
      toast.error('Failed to submit feedback. Please try again.');
    }
  }, [hitlCheckpoint, planType, router]);

  // Initialize on mount (pass forceNew from URL if present)
  // Ensure minimum 500ms loading display to prevent flash
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const startTime = Date.now();

      await initializeSession(forceNewFromUrl);

      // Ensure minimum 500ms loading to prevent jarring flash
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 500 - elapsed);
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      setIsLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- forceNewFromUrl should only apply on initial mount
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
              {session ? (
                <>
                  You&apos;ve completed {Math.round(session.overallProgress)}% of onboarding with {messages.length} messages exchanged.
                  Starting fresh will archive this progress. Your previous conversation will be saved but you&apos;ll begin from the beginning.
                </>
              ) : (
                <>
                  This will end your current conversation and start fresh with Alex.
                  Your previous conversation will be saved but you&apos;ll begin from the beginning.
                </>
              )}
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
            <DialogTitle>Compiling Your Founder's Brief</DialogTitle>
            <DialogDescription>
              Our AI team is analyzing your responses and compiling your strategic brief.
              This typically takes 30-60 seconds.
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
                <p>✓ Interview responses captured</p>
                <p>⟳ Compiling strategic brief...</p>
                <p className="opacity-50">○ Identifying key assumptions</p>
                <p className="opacity-50">○ Preparing for your review</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Founder's Brief Review Modal - HITL Checkpoint */}
      <Dialog
        open={analysisState === 'awaiting_approval' && hitlCheckpoint !== null}
        onOpenChange={() => {}}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Review Your Founder's Brief</DialogTitle>
            <DialogDescription>
              Our AI team has compiled your responses into a strategic brief.
              Please review and approve to continue with the validation analysis.
            </DialogDescription>
          </DialogHeader>

          {hitlCheckpoint && (
            <FoundersBriefReview
              briefData={entrepreneurBrief || {}}
              approvalId={hitlCheckpoint.approval_id || undefined}
              runId={hitlCheckpoint.run_id}
              onApprove={handleApproveFoundersBrief}
              onRequestChanges={handleRequestBriefChanges}
              isApproving={isApprovingBrief}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
