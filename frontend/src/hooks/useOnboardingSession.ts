/**
 * useOnboardingSession Hook
 *
 * Subscribes to onboarding session updates via Supabase Realtime.
 * Provides instant updates when progress/stage changes, eliminating
 * the need for polling delays after sending messages.
 *
 * Pattern follows: hooks/useValidationProgress.ts
 * Plan: /home/chris/.claude/plans/snappy-hugging-lollipop.md
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface OnboardingSessionRealtime {
  id: string;
  sessionId: string;
  userId: string;
  status: string;
  currentStage: number;
  stageProgress: number;
  overallProgress: number;
  lastActivity: string;
  completedAt: string | null;
}

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

export interface UseOnboardingSessionOptions {
  enableRealtime?: boolean;
}

export interface UseOnboardingSessionResult {
  session: OnboardingSessionRealtime | null;
  isLoading: boolean;
  error: Error | null;
  realtimeStatus: RealtimeStatus;
  refetch: () => Promise<void>;
  isPollingFallback: boolean;
  retryCount: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useOnboardingSession(
  sessionId: string | null,
  options?: UseOnboardingSessionOptions
): UseOnboardingSessionResult {
  const [session, setSession] = useState<OnboardingSessionRealtime | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');

  // Retry state for resilient Realtime connections
  const [retryCount, setRetryCount] = useState(0);
  const [isPollingFallback, setIsPollingFallback] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Retry configuration
  const MAX_RETRIES = 3;
  const BASE_RETRY_DELAY_MS = 1000; // 1s, 2s, 4s exponential backoff
  const POLLING_INTERVAL_MS = 5000;
  const RECONNECT_ATTEMPT_INTERVAL_MS = 30000; // Try to reconnect every 30s while polling

  // Helper to clear pending retry timer (prevents race conditions)
  const clearRetryTimer = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Feature flag check - can be disabled via env var or options
  const featureFlagEnabled = process.env.NEXT_PUBLIC_ONBOARDING_REALTIME !== 'false';
  const enableRealtime = (options?.enableRealtime ?? true) && featureFlagEnabled;

  // Initial fetch (CRITICAL - don't rely only on Realtime)
  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setIsLoading(false);
      setRealtimeStatus('disconnected');
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();

      // Fetch only scalar columns (matching Realtime publication filter)
      const { data, error: fetchError } = await supabase
        .from('onboarding_sessions')
        .select('id, session_id, user_id, status, current_stage, stage_progress, overall_progress, last_activity, completed_at')
        .eq('session_id', sessionId)
        .single();

      if (fetchError) {
        // PGRST116 = not found - session may not exist yet
        if (fetchError.code === 'PGRST116') {
          console.log('[useOnboardingSession] Session not found:', sessionId);
          setSession(null);
        } else {
          throw fetchError;
        }
      } else if (data) {
        setSession({
          id: data.id,
          sessionId: data.session_id,
          userId: data.user_id,
          status: data.status,
          currentStage: data.current_stage ?? 1,
          stageProgress: data.stage_progress ?? 0,
          overallProgress: data.overall_progress ?? 0,
          lastActivity: data.last_activity,
          completedAt: data.completed_at,
        });
      }

      setError(null);
    } catch (err) {
      console.error('[useOnboardingSession] Fetch error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!enableRealtime || !sessionId) {
      setRealtimeStatus('disconnected');
      return;
    }

    const supabase = createClient();

    // Subscribe to onboarding_sessions UPDATEs (progress/stage changes)
    const channel = supabase
      .channel(`onboarding:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'onboarding_sessions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[useOnboardingSession] Session update:', payload.new);
          const updated = payload.new;
          setSession({
            id: updated.id,
            sessionId: updated.session_id,
            userId: updated.user_id,
            status: updated.status,
            currentStage: updated.current_stage ?? 1,
            stageProgress: updated.stage_progress ?? 0,
            overallProgress: updated.overall_progress ?? 0,
            lastActivity: updated.last_activity,
            completedAt: updated.completed_at,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useOnboardingSession] Realtime subscription active');
          // Clear any pending retry timer to prevent race condition
          clearRetryTimer();
          setRealtimeStatus('connected');
          setRetryCount(0);
          setIsPollingFallback(false);
          setError(null);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Handle all disconnection scenarios with retry logic
          console.error('[useOnboardingSession] Subscription failed:', status);

          // Clear any existing timer before scheduling new one
          clearRetryTimer();

          if (retryCount < MAX_RETRIES) {
            const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.log(`[useOnboardingSession] Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            setRealtimeStatus('connecting');

            retryTimeoutRef.current = setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, delay);
          } else {
            console.warn('[useOnboardingSession] Max retries exhausted, falling back to polling');
            setRealtimeStatus('disconnected');
            setIsPollingFallback(true);
            setError(new Error(`Realtime connection failed after ${MAX_RETRIES} retries. Using polling fallback.`));
          }
        }
      });

    return () => {
      console.log('[useOnboardingSession] Cleaning up subscription');
      supabase.removeChannel(channel);
      clearRetryTimer();
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    };
  }, [sessionId, enableRealtime, retryCount, clearRetryTimer]);

  // Fallback polling when Realtime fails
  useEffect(() => {
    if (!isPollingFallback || !sessionId) return;

    console.log('[useOnboardingSession] Starting polling fallback');

    // Poll immediately, then at interval
    fetchSession();
    const pollIntervalId = setInterval(fetchSession, POLLING_INTERVAL_MS);

    // Periodically attempt to reconnect to Realtime
    reconnectIntervalRef.current = setInterval(() => {
      console.log('[useOnboardingSession] Attempting to reconnect to Realtime...');
      setRetryCount(0); // Reset retry count to trigger reconnection attempt
      setIsPollingFallback(false);
    }, RECONNECT_ATTEMPT_INTERVAL_MS);

    return () => {
      console.log('[useOnboardingSession] Stopping polling fallback');
      clearInterval(pollIntervalId);
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    };
  }, [sessionId, isPollingFallback, fetchSession]);

  return {
    session,
    isLoading,
    error,
    realtimeStatus,
    refetch: fetchSession,
    isPollingFallback,
    retryCount,
  };
}
