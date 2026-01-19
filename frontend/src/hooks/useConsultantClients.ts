/**
 * useConsultantClients Hook
 *
 * Hook for managing consultant-client relationships via the consultant_clients table.
 * Provides invite management (create, resend, revoke) and archive functionality.
 *
 * This hook complements useClients which focuses on portfolio project display.
 * useConsultantClients focuses on relationship and invite management.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/hooks';

// Types for the consultant_clients API responses
export interface PendingInvite {
  id: string;
  email: string;
  name: string | null;
  inviteToken: string;
  expiresAt: string;
  invitedAt: string;
  isExpired: boolean;
}

export interface LinkedClient {
  id: string;
  clientId: string;
  email: string;
  name: string | null;
  company: string | null;
  linkedAt: string;
}

export interface ArchivedRelationship {
  id: string;
  clientId: string | null;
  email: string;
  name: string | null;
  archivedAt: string;
  archivedBy: 'consultant' | 'client' | 'system';
}

export interface InviteCounts {
  pending: number;
  active: number;
  archived: number;
}

export interface CreateInviteParams {
  email: string;
  name?: string;
}

export interface CreateInviteResult {
  success: boolean;
  invite?: {
    id: string;
    email: string;
    name: string | null;
    inviteToken: string;
    inviteUrl: string;
    expiresAt: string;
  };
  error?: string;
}

export interface ResendInviteResult {
  success: boolean;
  invite?: {
    id: string;
    email: string;
    name: string | null;
    inviteToken: string;
    inviteUrl: string;
    expiresAt: string;
  };
  error?: string;
}

interface UseConsultantClientsState {
  invites: PendingInvite[];
  clients: LinkedClient[];
  archived: ArchivedRelationship[];
  counts: InviteCounts;
  isLoading: boolean;
  error: Error | null;
}

export function useConsultantClients() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<UseConsultantClientsState>({
    invites: [],
    clients: [],
    archived: [],
    counts: { pending: 0, active: 0, archived: 0 },
    isLoading: true,
    error: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // Use stable user ID to prevent infinite loops from object reference changes
  const userId = user?.id;

  /**
   * Fetch all invites and clients from the API
   */
  const fetchData = useCallback(async () => {
    if (authLoading) return;

    if (!userId) {
      setState(prev => ({
        ...prev,
        invites: [],
        clients: [],
        archived: [],
        counts: { pending: 0, active: 0, archived: 0 },
        isLoading: false,
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch('/api/consultant/invites');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invites');
      }

      setState({
        invites: data.invites || [],
        clients: data.clients || [],
        archived: data.archived || [],
        counts: data.counts || { pending: 0, active: 0, archived: 0 },
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('[useConsultantClients] Error fetching data:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err as Error,
      }));
    }
  }, [userId, authLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Create a new invite
   */
  const createInvite = useCallback(
    async (params: CreateInviteParams): Promise<CreateInviteResult> => {
      setActionLoading(true);
      try {
        const response = await fetch('/api/consultant/invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error || 'Failed to create invite' };
        }

        // Refresh data after successful invite
        await fetchData();

        return { success: true, invite: data.invite };
      } catch (err) {
        console.error('[useConsultantClients] Error creating invite:', err);
        return { success: false, error: 'Failed to create invite' };
      } finally {
        setActionLoading(false);
      }
    },
    [fetchData]
  );

  /**
   * Resend an existing invite with a new token
   */
  const resendInvite = useCallback(
    async (inviteId: string): Promise<ResendInviteResult> => {
      setActionLoading(true);
      try {
        const response = await fetch(`/api/consultant/invites/${inviteId}/resend`, {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error || 'Failed to resend invite' };
        }

        // Refresh data after successful resend
        await fetchData();

        return { success: true, invite: data.invite };
      } catch (err) {
        console.error('[useConsultantClients] Error resending invite:', err);
        return { success: false, error: 'Failed to resend invite' };
      } finally {
        setActionLoading(false);
      }
    },
    [fetchData]
  );

  /**
   * Revoke a pending invite
   */
  const revokeInvite = useCallback(
    async (inviteId: string): Promise<{ success: boolean; error?: string }> => {
      setActionLoading(true);
      try {
        const response = await fetch(`/api/consultant/invites/${inviteId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error || 'Failed to revoke invite' };
        }

        // Refresh data after successful revocation
        await fetchData();

        return { success: true };
      } catch (err) {
        console.error('[useConsultantClients] Error revoking invite:', err);
        return { success: false, error: 'Failed to revoke invite' };
      } finally {
        setActionLoading(false);
      }
    },
    [fetchData]
  );

  /**
   * Archive a client relationship
   */
  const archiveClient = useCallback(
    async (relationshipId: string): Promise<{ success: boolean; error?: string }> => {
      setActionLoading(true);
      try {
        const response = await fetch(`/api/consultant/clients/${relationshipId}/archive`, {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error || 'Failed to archive client' };
        }

        // Refresh data after successful archive
        await fetchData();

        return { success: true };
      } catch (err) {
        console.error('[useConsultantClients] Error archiving client:', err);
        return { success: false, error: 'Failed to archive client' };
      } finally {
        setActionLoading(false);
      }
    },
    [fetchData]
  );

  /**
   * Get the invite URL for a given invite
   */
  const getInviteUrl = useCallback((inviteToken: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/signup?invite=${inviteToken}`;
  }, []);

  /**
   * Copy invite URL to clipboard
   */
  const copyInviteUrl = useCallback(
    async (inviteToken: string): Promise<boolean> => {
      try {
        const url = getInviteUrl(inviteToken);
        await navigator.clipboard.writeText(url);
        return true;
      } catch (err) {
        console.error('[useConsultantClients] Failed to copy to clipboard:', err);
        return false;
      }
    },
    [getInviteUrl]
  );

  return {
    // Data
    invites: state.invites,
    clients: state.clients,
    archived: state.archived,
    counts: state.counts,

    // Loading states
    isLoading: state.isLoading || authLoading,
    actionLoading,
    error: state.error,

    // Actions
    createInvite,
    resendInvite,
    revokeInvite,
    archiveClient,
    refetch: fetchData,

    // Utilities
    getInviteUrl,
    copyInviteUrl,
  };
}
