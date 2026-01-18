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
import { StageReviewModal } from '@/components/onboarding/StageReviewModal';
import { SummaryModal, type StageSummaryData } from '@/components/onboarding/SummaryModal';
import { transformSessionToSummary } from '@/lib/onboarding/summary-helpers';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { trackOnboardingEvent, trackCrewAIEvent } from '@/lib/analytics';
import { useOnboardingSession } from '@/hooks/useOnboardingSession';
import { useOnboardingRecovery } from '@/hooks/useOnboardingRecovery';
import { ONBOARDING_STAGES_CONFIG, getStageName } from '@/lib/onboarding/stages-config';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface OnboardingWizardProps {
  userId: string;
  planType: 'trial' | 'sprint' | 'founder' | 'enterprise';
  userEmail: string;
  /** Mode for Alex: 'founder' (direct user) or 'client' (consultant's client) */
  mode?: 'founder' | 'client';
  /** Optional client project ID when in client mode */
  clientProjectId?: string;
}

interface OnboardingSession {
  sessionId: string;
  currentStage: number;
  totalStages: number;
  overallProgress: number;
  stageProgress: number;
  agentPersonality: any;
  isActive: boolean;
  // ADR-005: Track session status for completion check
  status?: 'active' | 'paused' | 'completed' | 'abandoned';
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

export function OnboardingWizard({ userId, planType, userEmail, mode = 'founder', clientProjectId }: OnboardingWizardProps) {
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
  const [isSaving, setIsSaving] = useState(false);
  const [savedVersion, setSavedVersion] = useState<number | null>(null);
  const [collectedTopics, setCollectedTopics] = useState<string[]>([]); // Bug B6: Track collected topics
  const abortControllerRef = useRef<AbortController | null>(null);

  // Realtime subscription for instant progress updates (replaces polling delay)
  const {
    session: realtimeSession,
    realtimeStatus,
    refetch: refetchRealtimeSession,
  } = useOnboardingSession(session?.sessionId || null);

  // Recovery hook for localStorage fallback (ADR-005)
  const { savePending, clearPending } = useOnboardingRecovery({
    sessionId: session?.sessionId || null,
    onRecovered: (version) => {
      setSavedVersion(version);
      toast.success(`Recovered unsaved message (v${version})`);
    },
    onRecoveryFailed: () => {
      toast.error('Some messages could not be recovered');
    },
  });

  // Stage review modal state
  const [showStageReview, setShowStageReview] = useState(false);
  const [reviewStage, setReviewStage] = useState<number | null>(null);

  // Summary modal state (shown after Stage 7 completion, before CrewAI)
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryStageData, setSummaryStageData] = useState<StageSummaryData[]>([]);
  const [isSummarySubmitting, setIsSummarySubmitting] = useState(false);
  // Store pending completion data until user approves
  const [pendingCompletion, setPendingCompletion] = useState<{
    queued?: boolean;
    projectId?: string;
    workflowId?: string;
  } | null>(null);

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

  // Initialize stages from shared config
  const initializeStages = useCallback((currentStage: number = 1) => {
    return ONBOARDING_STAGES_CONFIG.map((stageConfig) => ({
      stage: stageConfig.stage,
      name: stageConfig.name,
      description: stageConfig.description,
      isComplete: stageConfig.stage < currentStage,
      isActive: stageConfig.stage === currentStage,
    }));
  }, []);

  // Sync Realtime session updates to local state (instant progress updates)
  // Bug B7 fix: Only accept FORWARD progression to prevent stale data from reverting UI
  useEffect(() => {
    if (!realtimeSession || !session) return;

    // Check if stage or progress changed
    const stageChanged = realtimeSession.currentStage !== session.currentStage;
    const progressChanged = realtimeSession.overallProgress !== session.overallProgress;

    // Bug B7 fix: Ignore stale Realtime data that would revert progress
    // Only accept updates that move forward (higher stage or higher progress)
    const isForwardProgression =
      realtimeSession.currentStage > session.currentStage ||
      (realtimeSession.currentStage === session.currentStage &&
        realtimeSession.overallProgress > session.overallProgress);

    // Also accept if we're catching up from a stale local state (e.g., after refresh)
    const isCatchingUp = realtimeSession.currentStage >= session.currentStage;

    if ((stageChanged || progressChanged) && (isForwardProgression || isCatchingUp)) {
      console.log('[OnboardingWizard] Realtime update:', {
        oldStage: session.currentStage,
        newStage: realtimeSession.currentStage,
        oldProgress: session.overallProgress,
        newProgress: realtimeSession.overallProgress,
        isForwardProgression,
      });

      // Track and announce stage advancement
      if (stageChanged && realtimeSession.currentStage > session.currentStage) {
        trackOnboardingEvent.stageAdvanced(session.sessionId, session.currentStage, realtimeSession.currentStage);

        toast.success(
          `Stage complete! Moving to: ${getStageName(realtimeSession.currentStage)}`,
          { duration: 4000 }
        );
      }

      // Update local state with Realtime data
      setSession(prev => prev ? {
        ...prev,
        currentStage: realtimeSession.currentStage,
        overallProgress: realtimeSession.overallProgress,
        stageProgress: realtimeSession.stageProgress,
      } : null);

      // Update stages UI
      setStages(initializeStages(realtimeSession.currentStage));
    } else if (stageChanged || progressChanged) {
      console.log('[OnboardingWizard] Ignoring stale Realtime update:', {
        localStage: session.currentStage,
        realtimeStage: realtimeSession.currentStage,
        localProgress: session.overallProgress,
        realtimeProgress: realtimeSession.overallProgress,
      });
    }
  }, [realtimeSession, session, initializeStages]);

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
            toast.success(
              `Stage complete! Moving to: ${getStageName(data.currentStage)}`,
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

  // Helper: Retry with exponential backoff for save operations
  const retryWithBackoff = useCallback(async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`[OnboardingWizard] Save retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }, []);

  // Handle form submit - stream AI response (Split API: stream then save)
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isAILoading || !session) return;

    const userMessage = input.trim();
    setInput('');
    setIsAILoading(true);
    setSavedVersion(null); // Clear previous version while new message is being processed

    // Generate unique message ID for idempotency (ADR-005)
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Capture timestamp for user message
    const userTimestamp = new Date().toISOString();
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: userTimestamp,
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Track message sent
    trackOnboardingEvent.messageSent(session.sessionId, session.currentStage, userMessage.length);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    let assistantContent = '';
    let assistantTimestamp = '';

    try {
      // ====================================================================
      // STEP 1: Stream AI response from /api/chat/stream (stateless)
      // ====================================================================
      const streamResponse = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map(m => ({ role: m.role, content: m.content })),
          sessionId: session.sessionId,
        }),
        signal: abortControllerRef.current.signal,
        credentials: 'include', // Required for cookies on Netlify
      });

      if (!streamResponse.ok) {
        throw new Error(`Stream API error: ${streamResponse.status}`);
      }

      // Handle streaming response - parse SSE format
      const reader = streamResponse.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages from toUIMessageStreamResponse
          // Format: data: {"type": "text-delta", "delta": "..."}
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
                  assistantContent += parsed.delta;
                }
              } catch {
                // Ignore parse errors for non-JSON lines
              }
            }
          }

          // Update AI message in real-time
          if (assistantContent) {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.role === 'assistant') {
                // Update existing assistant message
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: assistantContent },
                ];
              } else {
                // Add new assistant message
                assistantTimestamp = new Date().toISOString();
                return [
                  ...prev,
                  {
                    role: 'assistant',
                    content: assistantContent,
                    timestamp: assistantTimestamp,
                  },
                ];
              }
            });
          }
        }

        console.log('[OnboardingWizard] Stream complete:', {
          messageId,
          accumulatedTextLength: assistantContent.length,
          accumulatedTextPreview: assistantContent.substring(0, 100),
        });

        // If no text was accumulated, something went wrong
        if (!assistantContent) {
          console.warn('[OnboardingWizard] No text accumulated from stream');
          toast.error('Alex is having trouble responding. Please try again.');
          return;
        }
      }

      // ====================================================================
      // STEP 2: Save to database via /api/chat/save (atomic persistence)
      // ====================================================================
      setIsSaving(true);
      setIsAILoading(false); // Stream complete, now saving

      // Ensure we have the assistant timestamp
      if (!assistantTimestamp) {
        assistantTimestamp = new Date().toISOString();
      }

      // Store in localStorage before attempting save (ADR-005 recovery fallback)
      savePending({
        sessionId: session.sessionId,
        messageId,
        userMessage: {
          role: 'user',
          content: userMessage,
          timestamp: userTimestamp,
        },
        assistantMessage: {
          role: 'assistant',
          content: assistantContent,
          timestamp: assistantTimestamp,
        },
      });

      const saveResult = await retryWithBackoff(async () => {
        const saveResponse = await fetch('/api/chat/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session.sessionId,
            messageId,
            userMessage: {
              role: 'user',
              content: userMessage,
              timestamp: userTimestamp,
            },
            assistantMessage: {
              role: 'assistant',
              content: assistantContent,
              timestamp: assistantTimestamp,
            },
            // ADR-005: Send expected version for conflict detection
            expectedVersion: savedVersion ?? undefined,
          }),
          credentials: 'include', // Required for cookies on Netlify
        });

        const result = await saveResponse.json();

        // Handle version conflict (ADR-005)
        if (result.status === 'version_conflict') {
          console.warn('[OnboardingWizard] Version conflict:', result);
          // Refresh session to get current version
          await refetchRealtimeSession();
          throw new Error('Session was modified in another tab. Please try again.');
        }

        if (!saveResponse.ok && result.status !== 'version_conflict') {
          throw new Error(result.error || `Save API error: ${saveResponse.status}`);
        }

        return result;
      });

      console.log('[OnboardingWizard] Save result:', saveResult);

      // Clear from localStorage after successful save (ADR-005 recovery)
      if (saveResult.success) {
        clearPending(messageId);
      }

      // Update version for "Saved v{X}" display and for next expectedVersion
      if (saveResult.success && saveResult.version) {
        setSavedVersion(saveResult.version);
      }

      // Bug B6 fix: Update collected topics for question counter
      if (saveResult.success && saveResult.collectedTopics) {
        setCollectedTopics(prev => {
          // Merge new topics with existing (dedupe)
          const merged = [...new Set([...prev, ...saveResult.collectedTopics])];
          console.log('[OnboardingWizard] Updated collectedTopics:', merged);
          return merged;
        });
      }

      // Handle stage advancement from save response
      if (saveResult.stageAdvanced && saveResult.currentStage) {
        trackOnboardingEvent.stageAdvanced(session.sessionId, session.currentStage, saveResult.currentStage);

        toast.success(
          `Stage complete! Moving to: ${getStageName(saveResult.currentStage)}`,
          { duration: 4000 }
        );

        setSession(prev => prev ? {
          ...prev,
          currentStage: saveResult.currentStage,
          overallProgress: saveResult.overallProgress ?? prev.overallProgress,
          stageProgress: saveResult.stageProgress ?? 0,
        } : null);

        setStages(initializeStages(saveResult.currentStage));

        // Bug B6: Reset collected topics for new stage
        setCollectedTopics([]);
      } else if (saveResult.overallProgress !== undefined) {
        // Update progress without stage change
        setSession(prev => prev ? {
          ...prev,
          overallProgress: saveResult.overallProgress,
          stageProgress: saveResult.stageProgress ?? prev.stageProgress,
        } : null);
      }

      // Handle onboarding completion - Show SummaryModal for Approve/Revise
      if (saveResult.completed) {
        // ADR-005 Fix: Update session status to 'completed' for completion check
        setSession(prev => prev ? {
          ...prev,
          status: 'completed',
          overallProgress: 100,
        } : null);
        console.log('[OnboardingWizard] Onboarding completed - showing summary for approval:', {
          queued: saveResult.queued,
          projectId: saveResult.projectId,
          workflowId: saveResult.workflowId,
        });

        // Store completion data for after user approval
        setPendingCompletion({
          queued: saveResult.queued,
          projectId: saveResult.projectId,
          workflowId: saveResult.workflowId,
        });

        // Fetch stage data and show summary modal
        try {
          const statusResponse = await fetch(
            `/api/onboarding/status?sessionId=${session.sessionId}`,
            { credentials: 'include' }
          );
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            const stageData = statusData.session?.stage_data || {};
            const summaryData = transformSessionToSummary(stageData, 7);
            setSummaryStageData(summaryData);
          }
        } catch (e) {
          console.warn('[OnboardingWizard] Failed to fetch stage data for summary:', e);
          // Fall back to empty summary if fetch fails
          setSummaryStageData([]);
        }

        // Show summary modal for Approve/Revise decision
        setShowSummaryModal(true);
        toast.success('Stage 7 complete! Please review your responses.');

        // NOTE: CrewAI is NOT triggered yet - waits for user to click Approve
        // This allows user to revise if they want to correct anything
        return; // Exit early - don't continue with immediate CrewAI trigger
      }

      // Legacy completion handling (direct CrewAI trigger) - kept for backwards compatibility
      // This path is only used if saveResult.completed is false but other conditions apply
      if (saveResult.projectId && saveResult.workflowId && !saveResult.completed) {
        // Legacy direct completion (fallback - shouldn't normally happen)
        setProjectId(saveResult.projectId);
        setWorkflowId(saveResult.workflowId);
        setAnalysisState('analyzing');
        setAnalysisStatus('running');
        setShowAnalysisModal(true);
        toast.success('Compiling your Founder\'s Brief...');
        startAnalysisPolling(saveResult.workflowId, saveResult.projectId);
      }

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.name !== 'AbortError') {
        console.error('[OnboardingWizard] Chat error:', err);
        toast.error(`Failed to send message: ${err.message}`);
      }
    } finally {
      setIsAILoading(false);
      setIsSaving(false);
      abortControllerRef.current = null;
    }
  }, [input, isAILoading, session, messages, retryWithBackoff, initializeStages, startAnalysisPolling, savePending, clearPending, planType, router]);

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
      console.log('📡 Calling /api/onboarding/start with:', { userId, planType, mode, clientProjectId });
      const response = await fetch('/api/onboarding/start/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planType,
          forceNew,
          mode, // 'founder' or 'client' - affects Alex's prompt framing
          clientProjectId, // When in client mode, associates data with client's project
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
        // ADR-005: Track status for completion check
        status: data.status || 'active',
      };

      setSession(newSession);
      setStages(initializeStages(data.stageInfo.currentStage));

      // Check if resuming existing session
      if (data.resuming && data.conversationHistory && data.conversationHistory.length > 0) {
        // Restore conversation history
        setMessages(data.conversationHistory);
        setIsResuming(true);
        // ADR-005 Fix: Initialize savedVersion from resume data for concurrency protection
        setSavedVersion(data.version ?? 0);

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

  // ========================================================================
  // Summary Modal Handlers (Approve/Revise flow after Stage 7)
  // ========================================================================

  /**
   * Handle approval from SummaryModal - triggers CrewAI analysis
   */
  const handleSummaryApprove = useCallback(async () => {
    if (!session || !pendingCompletion) {
      toast.error('Session data not available');
      return;
    }

    setIsSummarySubmitting(true);

    try {
      console.log('[OnboardingWizard] User approved summary, triggering CrewAI:', pendingCompletion);

      // Close summary modal and show analysis modal
      setShowSummaryModal(false);
      setAnalysisState('analyzing');
      setAnalysisStatus('running');
      setShowAnalysisModal(true);

      if (pendingCompletion.queued) {
        // Queue-based completion (ADR-005)
        toast.success('Processing your Founder\'s Brief...');

        // Poll the session status to get projectId/workflowId once worker processes
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes (5s intervals)

        const poll = async () => {
          attempts++;
          try {
            const statusResponse = await fetch(
              `/api/onboarding/status?sessionId=${session.sessionId}`,
              { credentials: 'include' }
            );

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.success && statusData.completion) {
                const { projectId: pid, workflowId: wid } = statusData.completion;
                if (pid && wid) {
                  console.log('[OnboardingWizard] Worker completed, starting polling:', { pid, wid });
                  setProjectId(pid);
                  setWorkflowId(wid);
                  startAnalysisPolling(wid, pid);
                  return;
                }
              }
            }
          } catch (e) {
            console.warn('[OnboardingWizard] Status poll error:', e);
          }

          if (attempts < maxAttempts) {
            setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            console.error('[OnboardingWizard] Timeout waiting for worker');
            toast.error('Processing is taking longer than expected. Check your dashboard.');
            const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';
            router.push(dashboardRoute);
          }
        };

        // Start polling after short delay (give worker time to start)
        setTimeout(poll, 3000);
      } else if (pendingCompletion.projectId && pendingCompletion.workflowId) {
        // Direct completion (legacy)
        setProjectId(pendingCompletion.projectId);
        setWorkflowId(pendingCompletion.workflowId);
        toast.success('Compiling your Founder\'s Brief...');
        startAnalysisPolling(pendingCompletion.workflowId, pendingCompletion.projectId);
      } else {
        // No workflow data - use handleCompleteOnboarding as fallback
        console.log('[OnboardingWizard] No pending workflow data, using complete endpoint');
        await handleCompleteOnboarding();
      }
    } catch (error) {
      console.error('[OnboardingWizard] Error during approval:', error);
      toast.error('Failed to start analysis. Please try again.');
    } finally {
      setIsSummarySubmitting(false);
      setPendingCompletion(null);
    }
  }, [session, pendingCompletion, planType, router, startAnalysisPolling]);

  /**
   * Handle revision from SummaryModal - returns to chat for corrections
   */
  const handleSummaryRevise = useCallback(() => {
    console.log('[OnboardingWizard] User chose to revise - returning to chat');

    // Reset completion state
    setPendingCompletion(null);
    setSession(prev => prev ? {
      ...prev,
      status: 'active', // Back to active status
      overallProgress: 95, // Stay at high progress
    } : null);

    // Add a message prompting the user to clarify
    const revisionPrompt: { role: string; content: string; timestamp: string } = {
      role: 'assistant',
      content: "I understand you'd like to make some changes. What would you like to revise? You can clarify any of the information we discussed, and I'll update the summary accordingly.",
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, revisionPrompt]);

    toast.info('Please provide any corrections or additional details.');
  }, []);

  // Handle onboarding completion (used as fallback if no pending workflow)
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
        credentials: 'include', // Required for cookies on Netlify
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

      // Actually pause the session in the database - WITH RESPONSE CHECKING
      // Fix: Don't redirect if pause fails (data loss prevention)
      try {
        const response = await fetch('/api/onboarding/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.sessionId }),
          credentials: 'include', // Required for cookies on Netlify
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error('[OnboardingWizard] Pause failed:', data);
          toast.error('Failed to save session. Please try again.');
          return; // Block redirect on failure
        }
      } catch (e) {
        console.error('[OnboardingWizard] Pause error:', e);
        toast.error('Failed to save session. Please try again.');
        return; // Block redirect on failure
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
        credentials: 'include', // Required for cookies on Netlify
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

  // Handle stage click for review
  const handleStageClick = useCallback((stageNumber: number) => {
    setReviewStage(stageNumber);
    setShowStageReview(true);
  }, []);

  // Get messages for a specific stage (approximation based on message index)
  // In a real implementation, this would be filtered by stage markers in the messages
  const getMessagesForStage = useCallback((stageNumber: number) => {
    // Simple approximation: divide messages by stages
    // Each stage gets roughly (totalMessages / currentStage) messages
    if (!messages.length || !session) return [];

    const completedStages = session.currentStage - 1;
    if (stageNumber > completedStages) return [];

    // Estimate messages per stage
    const avgMessagesPerStage = Math.ceil(messages.length / Math.max(completedStages, 1));
    const startIndex = (stageNumber - 1) * avgMessagesPerStage;
    const endIndex = stageNumber * avgMessagesPerStage;

    return messages.slice(startIndex, endIndex);
  }, [messages, session]);

  // Get stage name for review modal
  const getStageNameForReview = useCallback((stageNumber: number) => {
    return getStageName(stageNumber);
  }, []);

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
          credentials: 'include', // Required for cookies on Netlify
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
      <div className="flex h-[100dvh] w-full overflow-hidden bg-background flex-col">
        {/* Connection Status Banner (Realtime disconnected) */}
        {realtimeStatus === 'disconnected' && session && (
          <div className="bg-yellow-50 dark:bg-yellow-950/50 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Live updates disconnected. Progress may not update instantly.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchRealtimeSession}
              className="text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900"
            >
              Reconnect
            </Button>
          </div>
        )}

        <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar with progress tracking */}
        <div className="hidden md:flex w-[320px] flex-shrink-0">
          <OnboardingSidebar
            stages={stages}
            currentStage={session?.currentStage || 1}
            overallProgress={session?.overallProgress || 0}
            agentPersonality={session?.agentPersonality}
            stageProgressData={{
              collectedTopics, // Bug B6 fix: Now populated from save response
              stageProgress: session?.stageProgress || 0,
            }}
            onExit={handleExitOnboarding}
            onStartNew={handleStartNew}
            onStageClick={handleStageClick}
            isResuming={isResuming}
          />
        </div>

        {/* Main conversation area */}
        <main className="flex-1 flex flex-col min-h-0">
          {session && (
            <ConversationInterface
              session={session}
              messages={messages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isLoading={isAILoading}
              isSaving={isSaving}
              savedVersion={savedVersion}
              onComplete={handleCompleteOnboarding}
            />
          )}
        </main>
        </div>
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

      {/* Summary Modal - Shown after Stage 7 completion for Approve/Revise */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => {
          // Don't allow closing during submission
          if (!isSummarySubmitting) {
            setShowSummaryModal(false);
          }
        }}
        stageData={summaryStageData}
        onApprove={handleSummaryApprove}
        onRevise={handleSummaryRevise}
        isSubmitting={isSummarySubmitting}
      />

      {/* Stage Review Modal */}
      {reviewStage !== null && (
        <StageReviewModal
          isOpen={showStageReview}
          onClose={() => {
            setShowStageReview(false);
            setReviewStage(null);
          }}
          stageNumber={reviewStage}
          stageName={getStageNameForReview(reviewStage)}
          messages={getMessagesForStage(reviewStage)}
        />
      )}
    </>
  );
}
