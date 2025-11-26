/**
 * useApprovals Hook
 *
 * Fetches pending approval requests for the current user.
 * Includes both own approvals and client approvals (for consultants).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/hooks';

export interface ApprovalRequest {
  id: string;
  execution_id: string;
  task_id: string;
  kickoff_id: string | null;
  user_id: string;
  project_id: string | null;
  approval_type: string;
  owner_role: string;
  title: string;
  description: string;
  task_output: Record<string, any>;
  evidence_summary: Record<string, any>;
  options: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  decision: string | null;
  human_feedback: string | null;
  decided_by: string | null;
  decided_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  projects?: {
    id: string;
    name: string;
    stage: string;
  } | null;
}

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

export function useApprovals(status: 'pending' | 'all' = 'pending'): UseApprovalsResult {
  const { user, loading: authLoading } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [clientApprovals, setClientApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

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
