/**
 * useApprovals Hook Tests
 *
 * Tests for the useApprovals and useApproval hooks that manage
 * approval requests from CrewAI validation processes.
 * @story US-H01, US-H02, US-H04, US-H05, US-H06, US-H07, US-H08, US-H09
*/

import { renderHook, waitFor, act } from '@testing-library/react';
import { useApprovals, useApproval } from '@/hooks/useApprovals';

// Mock Supabase client for Realtime
const mockChannel = jest.fn();
const mockOn = jest.fn();
const mockSubscribe = jest.fn();
const mockRemoveChannel = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}));

// Mock useAuth
const mockUser = { id: 'user-123', email: 'test@example.com' };
let mockAuthLoading = false;
let mockAuthUser: typeof mockUser | null = mockUser;

jest.mock('@/lib/auth/hooks', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: mockAuthLoading,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('useApprovals', () => {
  const mockApproval = {
    id: 'approval-1',
    project_id: 'project-1',
    user_id: 'user-123',
    checkpoint_type: 'hypothesis_approval',
    status: 'pending',
    title: 'Test Approval',
    description: 'Approve this hypothesis',
    evidence_summary: { key_findings: ['Finding 1'] },
    recommendations: ['Recommendation 1'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockClientApproval = {
    ...mockApproval,
    id: 'client-approval-1',
    user_id: 'client-456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = mockUser;
    mockAuthLoading = false;

    // Setup Realtime channel mocks
    mockChannel.mockReturnValue({
      on: mockOn.mockReturnValue({
        subscribe: mockSubscribe.mockImplementation((callback) => {
          callback('SUBSCRIBED');
          return { unsubscribe: jest.fn() };
        }),
      }),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        approvals: [mockApproval],
        client_approvals: [mockClientApproval],
      }),
    });
  });

  describe('data fetching', () => {
    it('should fetch approvals on mount', async () => {
      const { result } = renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/approvals?status=pending');
      expect(result.current.approvals).toHaveLength(1);
      expect(result.current.clientApprovals).toHaveLength(1);
    });

    it('should return empty arrays when no user', async () => {
      mockAuthUser = null;

      const { result } = renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.approvals).toEqual([]);
      expect(result.current.clientApprovals).toEqual([]);
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('500');
    });

    it('should handle loading state correctly', async () => {
      mockAuthLoading = true;

      const { result } = renderHook(() => useApprovals('pending'));

      expect(result.current.isLoading).toBe(true);
    });

    it('should fetch all approvals when status is "all"', async () => {
      const { result } = renderHook(() => useApprovals('all'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/approvals?status=all');
    });
  });

  describe('pendingCount', () => {
    it('should calculate pending count from both approvals and clientApprovals', async () => {
      const { result } = renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pendingCount).toBe(2); // 1 approval + 1 client approval
    });

    it('should not count non-pending approvals', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          approvals: [{ ...mockApproval, status: 'approved' }],
          client_approvals: [mockClientApproval],
        }),
      });

      const { result } = renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pendingCount).toBe(1); // Only the pending client approval
    });
  });

  describe('approve action', () => {
    it('should call approve API', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ approvals: [mockApproval], client_approvals: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ approvals: [], client_approvals: [] }),
        });

      const { result } = renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = false;
      await act(async () => {
        success = await result.current.approve('approval-1', 'approved', 'Looks good');
      });

      expect(success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/approvals/approval-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          decision: 'approved',
          feedback: 'Looks good',
        }),
      });
    });

    it('should return false on approve error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ approvals: [mockApproval], client_approvals: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      const { result } = renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = true;
      await act(async () => {
        success = await result.current.approve('approval-1');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('reject action', () => {
    it('should call reject API', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ approvals: [mockApproval], client_approvals: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ approvals: [], client_approvals: [] }),
        });

      const { result } = renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = false;
      await act(async () => {
        success = await result.current.reject('approval-1', 'Not ready');
      });

      expect(success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/approvals/approval-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          feedback: 'Not ready',
          decision: 'rejected',
        }),
      });
    });

    it('should return false on reject error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ approvals: [mockApproval], client_approvals: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
        });

      const { result } = renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = true;
      await act(async () => {
        success = await result.current.reject('approval-1');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('refetch', () => {
    it('should refetch approvals when called', async () => {
      const { result } = renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ approvals: [], client_approvals: [] }),
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/approvals?status=pending');
    });
  });

  describe('Realtime subscription', () => {
    it('should subscribe to Realtime channel by default', async () => {
      renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(mockChannel).toHaveBeenCalledWith('approval-changes');
      });

      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'approval_requests',
        }),
        expect.any(Function)
      );
    });

    it('should not subscribe when enableRealtime is false', async () => {
      renderHook(() => useApprovals('pending', { enableRealtime: false }));

      await waitFor(() => {
        expect(mockChannel).not.toHaveBeenCalled();
      });
    });

    it('should cleanup subscription on unmount', async () => {
      const { unmount } = renderHook(() => useApprovals('pending'));

      await waitFor(() => {
        expect(mockChannel).toHaveBeenCalled();
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });
});

describe('useApproval', () => {
  const mockApproval = {
    id: 'approval-1',
    project_id: 'project-1',
    user_id: 'user-123',
    checkpoint_type: 'hypothesis_approval',
    status: 'pending',
    title: 'Test Approval',
    description: 'Approve this hypothesis',
    evidence_summary: { key_findings: ['Finding 1'] },
    recommendations: ['Recommendation 1'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = { id: 'user-123', email: 'test@example.com' };
    mockAuthLoading = false;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApproval),
    });
  });

  it('should fetch single approval by id', async () => {
    const { result } = renderHook(() => useApproval('approval-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/approvals/approval-1');
    expect(result.current.approval).toMatchObject({
      id: 'approval-1',
      title: 'Test Approval',
    });
  });

  it('should return null when id is null', async () => {
    const { result } = renderHook(() => useApproval(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.approval).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should return null when no user', async () => {
    mockAuthUser = null;

    const { result } = renderHook(() => useApproval('approval-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.approval).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useApproval('approval-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.approval).toBeNull();
  });

  it('should handle loading state correctly', async () => {
    mockAuthLoading = true;

    const { result } = renderHook(() => useApproval('approval-1'));

    expect(result.current.isLoading).toBe(true);
  });
});
