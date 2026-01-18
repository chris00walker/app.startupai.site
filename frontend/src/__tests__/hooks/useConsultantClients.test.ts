/**
 * useConsultantClients Hook Tests
 *
 * Tests for the consultant clients management hook that handles
 * invites, clients, and archiving functionality.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useConsultantClients } from '@/hooks/useConsultantClients';

// Mock dependencies
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({})),
}));

jest.mock('@/lib/auth/hooks', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'consultant-123', email: 'consultant@example.com' },
    loading: false,
  })),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('useConsultantClients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Data Fetching', () => {
    it('fetches invites and clients on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [
              {
                id: 'invite-1',
                email: 'client@example.com',
                name: 'Test Client',
                inviteToken: 'token123',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                invitedAt: new Date().toISOString(),
                isExpired: false,
              },
            ],
            clients: [
              {
                id: 'client-1',
                clientId: 'user-123',
                email: 'active@example.com',
                name: 'Active Client',
                company: 'Test Corp',
                linkedAt: new Date().toISOString(),
              },
            ],
            archived: [],
            counts: { pending: 1, active: 1, archived: 0 },
          }),
      });

      const { result } = renderHook(() => useConsultantClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/consultant/invites');
      expect(result.current.invites).toHaveLength(1);
      expect(result.current.clients).toHaveLength(1);
      expect(result.current.counts.pending).toBe(1);
      expect(result.current.counts.active).toBe(1);
    });

    it('handles fetch error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const { result } = renderHook(() => useConsultantClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.invites).toHaveLength(0);
    });
  });

  describe('Create Invite', () => {
    it('creates an invite successfully', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [],
            clients: [],
            archived: [],
            counts: { pending: 0, active: 0, archived: 0 },
          }),
      });

      const { result } = renderHook(() => useConsultantClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create invite request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            invite: {
              id: 'new-invite',
              email: 'new@example.com',
              name: 'New Client',
              inviteToken: 'newtoken123',
              inviteUrl: 'http://localhost:3000/signup?invite=newtoken123',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
      });

      // Refetch after create
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [
              {
                id: 'new-invite',
                email: 'new@example.com',
                name: 'New Client',
                inviteToken: 'newtoken123',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                invitedAt: new Date().toISOString(),
                isExpired: false,
              },
            ],
            clients: [],
            archived: [],
            counts: { pending: 1, active: 0, archived: 0 },
          }),
      });

      let createResult: { success: boolean; error?: string };
      await act(async () => {
        createResult = await result.current.createInvite({
          email: 'new@example.com',
          name: 'New Client',
        });
      });

      expect(createResult!.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/consultant/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@example.com', name: 'New Client' }),
      });
    });

    it('handles create invite error', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [],
            clients: [],
            archived: [],
            counts: { pending: 0, active: 0, archived: 0 },
          }),
      });

      const { result } = renderHook(() => useConsultantClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create invite fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: 'An invite has already been sent to this email',
          }),
      });

      let createResult: { success: boolean; error?: string };
      await act(async () => {
        createResult = await result.current.createInvite({
          email: 'existing@example.com',
        });
      });

      expect(createResult!.success).toBe(false);
      expect(createResult!.error).toBe('An invite has already been sent to this email');
    });
  });

  describe('Resend Invite', () => {
    it('resends an invite successfully', async () => {
      // Initial fetch with existing invite
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [
              {
                id: 'invite-1',
                email: 'client@example.com',
                name: 'Test Client',
                inviteToken: 'oldtoken',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                invitedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
                isExpired: false,
              },
            ],
            clients: [],
            archived: [],
            counts: { pending: 1, active: 0, archived: 0 },
          }),
      });

      const { result } = renderHook(() => useConsultantClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Resend request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            invite: {
              id: 'invite-1',
              email: 'client@example.com',
              name: 'Test Client',
              inviteToken: 'newtoken',
              inviteUrl: 'http://localhost:3000/signup?invite=newtoken',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
      });

      // Refetch after resend
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [
              {
                id: 'invite-1',
                email: 'client@example.com',
                name: 'Test Client',
                inviteToken: 'newtoken',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                invitedAt: new Date().toISOString(),
                isExpired: false,
              },
            ],
            clients: [],
            archived: [],
            counts: { pending: 1, active: 0, archived: 0 },
          }),
      });

      let resendResult: { success: boolean; error?: string };
      await act(async () => {
        resendResult = await result.current.resendInvite('invite-1');
      });

      expect(resendResult!.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/consultant/invites/invite-1/resend', {
        method: 'POST',
      });
    });
  });

  describe('Revoke Invite', () => {
    it('revokes an invite successfully', async () => {
      // Initial fetch with existing invite
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [
              {
                id: 'invite-1',
                email: 'client@example.com',
                name: 'Test Client',
                inviteToken: 'token123',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                invitedAt: new Date().toISOString(),
                isExpired: false,
              },
            ],
            clients: [],
            archived: [],
            counts: { pending: 1, active: 0, archived: 0 },
          }),
      });

      const { result } = renderHook(() => useConsultantClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Revoke request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Refetch after revoke
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [],
            clients: [],
            archived: [],
            counts: { pending: 0, active: 0, archived: 0 },
          }),
      });

      let revokeResult: { success: boolean; error?: string };
      await act(async () => {
        revokeResult = await result.current.revokeInvite('invite-1');
      });

      expect(revokeResult!.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/consultant/invites/invite-1', {
        method: 'DELETE',
      });
    });
  });

  describe('Archive Client', () => {
    it('archives a client successfully', async () => {
      // Initial fetch with existing client
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [],
            clients: [
              {
                id: 'relationship-1',
                clientId: 'user-123',
                email: 'active@example.com',
                name: 'Active Client',
                company: 'Test Corp',
                linkedAt: new Date().toISOString(),
              },
            ],
            archived: [],
            counts: { pending: 0, active: 1, archived: 0 },
          }),
      });

      const { result } = renderHook(() => useConsultantClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Archive request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Refetch after archive
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [],
            clients: [],
            archived: [
              {
                id: 'relationship-1',
                clientId: 'user-123',
                email: 'active@example.com',
                name: 'Active Client',
                archivedAt: new Date().toISOString(),
                archivedBy: 'consultant',
              },
            ],
            counts: { pending: 0, active: 0, archived: 1 },
          }),
      });

      let archiveResult: { success: boolean; error?: string };
      await act(async () => {
        archiveResult = await result.current.archiveClient('relationship-1');
      });

      expect(archiveResult!.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/consultant/clients/relationship-1/archive', {
        method: 'POST',
      });
    });
  });

  describe('Utility Functions', () => {
    it('generates correct invite URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [],
            clients: [],
            archived: [],
            counts: { pending: 0, active: 0, archived: 0 },
          }),
      });

      const { result } = renderHook(() => useConsultantClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const url = result.current.getInviteUrl('abc123token');
      expect(url).toContain('/signup?invite=abc123token');
    });

    it('copies invite URL to clipboard', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            invites: [],
            clients: [],
            archived: [],
            counts: { pending: 0, active: 0, archived: 0 },
          }),
      });

      const { result } = renderHook(() => useConsultantClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.copyInviteUrl('abc123token');
      });

      expect(success!).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});
