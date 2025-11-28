/**
 * useApprovals Hook
 *
 * Fetches pending approval requests for the current user.
 * Includes both own approvals and client approvals (for consultants).
 * Supports Supabase Realtime for live updates.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { createClient } from '@/lib/supabase/client';
import type { ApprovalRequest } from '@/types/crewai';

// Re-export the type for backward compatibility
export type { ApprovalRequest } from '@/types/crewai';

export interface UseApprovalsResult {
  approvals: ApprovalRequest[];
  clientApprovals: ApprovalRequest[];
  pendingCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  approve: (id: string, decision?: string, feedback?: string) => Promise<boolean>;
  reject: (id: string, feedback?: string) => Promise<boolean>;
}

export function useApprovals(
  status: 'pending' | 'all' = 'pending',
  options?: { enableRealtime?: boolean }
): UseApprovalsResult {
  const { user, loading: authLoading } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [clientApprovals, setClientApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const enableRealtime = options?.enableRealtime ?? true;

  const fetchApprovals = useCallback(async () => {
    if (authLoading || !user) {
      setApprovals([]);
      setClientApprovals([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/approvals?status=${status}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch approvals: ${response.status}`);
      }

      const data = await response.json();

      setApprovals(data.approvals || []);
      setClientApprovals(data.client_approvals || []);
      setError(null);

    } catch (err) {
      console.error('[useApprovals] Error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, status]);

  // Initial fetch
  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!enableRealtime || authLoading || !user) return;

    const supabase = createClient();

    const channel = supabase
      .channel('approval-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approval_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useApprovals] Realtime update:', payload.eventType);
          // Refetch on any change to ensure consistency
          fetchApprovals();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useApprovals] Realtime subscription active');
        }
      });

    return () => {
      console.log('[useApprovals] Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, enableRealtime, fetchApprovals]);

  const approve = async (
    id: string,
    decision?: string,
    feedback?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          decision,
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve: ${response.status}`);
      }

      // Refetch approvals
      await fetchApprovals();
      return true;

    } catch (err) {
      console.error('[useApprovals] Approve error:', err);
      setError(err as Error);
      return false;
    }
  };

  const reject = async (id: string, feedback?: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject: ${response.status}`);
      }

      // Refetch approvals
      await fetchApprovals();
      return true;

    } catch (err) {
      console.error('[useApprovals] Reject error:', err);
      setError(err as Error);
      return false;
    }
  };

  const pendingCount = approvals.filter(a => a.status === 'pending').length +
    clientApprovals.filter(a => a.status === 'pending').length;

  return {
    approvals,
    clientApprovals,
    pendingCount,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchApprovals,
    approve,
    reject,
  };
}

/**
 * Hook to fetch a single approval request.
 */
export function useApproval(id: string | null) {
  const { user, loading: authLoading } = useAuth();
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchApproval() {
      if (authLoading || !user || !id) {
        setApproval(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch(`/api/approvals/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch approval: ${response.status}`);
        }

        const data = await response.json();
        setApproval(data);
        setError(null);

      } catch (err) {
        console.error('[useApproval] Error:', err);
        setError(err as Error);
        setApproval(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchApproval();
  }, [user, authLoading, id]);

  return {
    approval,
    isLoading: isLoading || authLoading,
    error,
  };
}
