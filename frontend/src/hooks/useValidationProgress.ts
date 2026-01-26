/**
 * useValidationProgress Hook
 *
 * Subscribes to validation progress updates via Supabase Realtime.
 * Provides live updates for the ValidationProgressTimeline component.
 *
 * Pattern follows: hooks/useApprovals.ts
 * Reference: startupai-crew/docs/features/state-persistence.md
 *
 * @story US-F08, US-F09
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  ValidationRun,
  ValidationProgressEvent,
  ValidationRunStatus,
} from '@/types/validation-progress';

export interface UseValidationProgressOptions {
  enableRealtime?: boolean;
  pollInterval?: number;  // Fallback polling interval in ms
}

export interface UseValidationProgressResult {
  run: ValidationRun | null;
  progress: ValidationProgressEvent[];
  status: ValidationRunStatus | 'idle';
  currentPhase: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useValidationProgress(
  runId: string | null,
  options?: UseValidationProgressOptions
): UseValidationProgressResult {
  const [run, setRun] = useState<ValidationRun | null>(null);
  const [progress, setProgress] = useState<ValidationProgressEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const enableRealtime = options?.enableRealtime ?? true;
  const pollInterval = options?.pollInterval ?? 0;  // 0 = no polling

  const fetchRun = useCallback(async () => {
    if (!runId) {
      setRun(null);
      setProgress([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();

      // Fetch validation run
      const { data: runData, error: runError } = await supabase
        .from('validation_runs')
        .select('*')
        .eq('run_id', runId)
        .single();

      if (runError) {
        // If not found, might not be created yet - not an error
        if (runError.code === 'PGRST116') {
          console.log('[useValidationProgress] Run not found yet:', runId);
          setRun(null);
        } else {
          throw runError;
        }
      } else {
        setRun(runData as ValidationRun);
      }

      // Fetch progress events (append-only, ordered by created_at)
      const { data: progressData, error: progressError } = await supabase
        .from('validation_progress')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: true });

      if (progressError) {
        throw progressError;
      }

      setProgress((progressData || []) as ValidationProgressEvent[]);
      setError(null);
    } catch (err) {
      console.error('[useValidationProgress] Error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [runId]);

  // Initial fetch
  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!enableRealtime || !runId) return;

    const supabase = createClient();

    // Subscribe to validation_progress INSERTs (append-only table)
    const progressChannel = supabase
      .channel(`progress:${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'validation_progress',
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          console.log('[useValidationProgress] Progress event:', payload.new);
          const newEvent = payload.new as ValidationProgressEvent;
          setProgress((prev) => [...prev, newEvent]);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useValidationProgress] Progress subscription active');
        }
      });

    // Subscribe to validation_runs UPDATEs (status changes)
    const runChannel = supabase
      .channel(`run:${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'validation_runs',
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          console.log('[useValidationProgress] Run update:', payload.new);
          setRun(payload.new as ValidationRun);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useValidationProgress] Run subscription active');
        }
      });

    return () => {
      console.log('[useValidationProgress] Cleaning up subscriptions');
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(runChannel);
    };
  }, [runId, enableRealtime]);

  // Optional fallback polling (if Realtime fails)
  useEffect(() => {
    if (!pollInterval || !runId) return;

    const interval = setInterval(() => {
      fetchRun();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [runId, pollInterval, fetchRun]);

  return {
    run,
    progress,
    status: run?.status ?? 'idle',
    currentPhase: run?.current_phase ?? 0,
    isLoading,
    error,
    refetch: fetchRun,
  };
}

/**
 * Hook to find active validation run for a project
 */
export function useActiveValidationRun(projectId: string | null) {
  const [runId, setRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveRun = useCallback(async () => {
    if (!projectId) {
      setRunId(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('validation_runs')
        .select('run_id')
        .eq('project_id', projectId)
        .in('status', ['pending', 'running', 'paused'])
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No active run found is not an error
        if (error.code === 'PGRST116') {
          setRunId(null);
        } else {
          console.error('[useActiveValidationRun] Error:', error);
        }
      } else {
        setRunId(data?.run_id || null);
      }
    } catch (err) {
      console.error('[useActiveValidationRun] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchActiveRun();
  }, [fetchActiveRun]);

  return { runId, isLoading, refresh: fetchActiveRun };
}
