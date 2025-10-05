/**
 * useGateEvaluation Hook
 * 
 * Hook for evaluating and monitoring gate status with real-time updates.
 * Automatically re-evaluates when evidence changes.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface GateEvaluationResult {
  status: 'Passed' | 'Failed' | 'Pending';
  reasons: string[];
  readiness_score: number;
  evidence_count: number;
  experiments_count: number;
  stage: string;
}

interface UseGateEvaluationOptions {
  projectId: string;
  stage: 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY' | 'SCALE';
  autoRefresh?: boolean; // Auto-refresh on evidence changes
}

export function useGateEvaluation({
  projectId,
  stage,
  autoRefresh = true,
}: UseGateEvaluationOptions) {
  const [result, setResult] = useState<GateEvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const evaluate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/gate-evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          stage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Gate evaluation failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error evaluating gate:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, stage]);

  // Initial evaluation
  useEffect(() => {
    evaluate();
  }, [evaluate]);

  // Subscribe to evidence changes if autoRefresh enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const channel = supabase
      .channel(`evidence-changes-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidence',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Evidence changed, re-evaluating gate:', payload);
          // Re-evaluate after a short delay to allow for batch changes
          setTimeout(evaluate, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, autoRefresh, evaluate, supabase]);

  return {
    result,
    isLoading,
    error,
    refetch: evaluate,
  };
}
