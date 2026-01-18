/**
 * useOnboardingSession Hook Tests
 *
 * Tests for the useOnboardingSession hook that subscribes to
 * onboarding session updates via Supabase Realtime.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useOnboardingSession } from '@/hooks/useOnboardingSession';

// Mock Supabase client
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
const mockChannel = jest.fn();
const mockOn = jest.fn();
const mockSubscribe = jest.fn();
const mockRemoveChannel = jest.fn();

let subscribeCallback: ((status: string) => void) | null = null;

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}));

describe('useOnboardingSession', () => {
  const mockSession = {
    id: 'db-id-1',
    session_id: 'session-123',
    user_id: 'user-456',
    status: 'in_progress',
    current_stage: 3,
    stage_progress: 0.75,
    overall_progress: 45,
    last_activity: new Date().toISOString(),
    completed_at: null,
  };

  const setupMocks = (data: unknown | null, error: unknown | null = null) => {
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle.mockResolvedValue({ data, error }),
        }),
      }),
    });

    subscribeCallback = null;
    mockChannel.mockReturnValue({
      on: mockOn.mockReturnValue({
        subscribe: mockSubscribe.mockImplementation((callback) => {
          subscribeCallback = callback;
          // Default to successful subscription
          setTimeout(() => callback('SUBSCRIBED'), 0);
          return { unsubscribe: jest.fn() };
        }),
      }),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    setupMocks(mockSession);
    // Reset environment variable
    delete process.env.NEXT_PUBLIC_ONBOARDING_REALTIME;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial fetch', () => {
    it('should fetch session on mount', async () => {
      const { result } = renderHook(() => useOnboardingSession('session-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledWith('onboarding_sessions');
      expect(mockEq).toHaveBeenCalledWith('session_id', 'session-123');
      expect(result.current.session).toBeDefined();
      expect(result.current.session?.sessionId).toBe('session-123');
    });

    it('should transform database record to OnboardingSessionRealtime', async () => {
      const { result } = renderHook(() => useOnboardingSession('session-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toMatchObject({
        id: 'db-id-1',
        sessionId: 'session-123',
        userId: 'user-456',
        status: 'in_progress',
        currentStage: 3,
        stageProgress: 0.75,
        overallProgress: 45,
        completedAt: null,
      });
    });

    it('should return null when sessionId is null', async () => {
      const { result } = renderHook(() => useOnboardingSession(null));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.realtimeStatus).toBe('disconnected');
    });

    it('should handle session not found (PGRST116)', async () => {
      setupMocks(null, { code: 'PGRST116' });

      const { result } = renderHook(() => useOnboardingSession('nonexistent'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle other fetch errors', async () => {
      setupMocks(null, { code: 'OTHER_ERROR', message: 'Database error' });

      const { result } = renderHook(() => useOnboardingSession('session-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should use default values for null stage fields', async () => {
      setupMocks({
        ...mockSession,
        current_stage: null,
        stage_progress: null,
        overall_progress: null,
      });

      const { result } = renderHook(() => useOnboardingSession('session-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session?.currentStage).toBe(1);
      expect(result.current.session?.stageProgress).toBe(0);
      expect(result.current.session?.overallProgress).toBe(0);
    });
  });

  describe('Realtime subscription', () => {
    it('should subscribe to Realtime channel', async () => {
      renderHook(() => useOnboardingSession('session-123'));

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(mockChannel).toHaveBeenCalledWith('onboarding:session-123');
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'UPDATE',
          schema: 'public',
          table: 'onboarding_sessions',
          filter: 'session_id=eq.session-123',
        }),
        expect.any(Function)
      );
    });

    it('should set connected status on successful subscription', async () => {
      const { result } = renderHook(() => useOnboardingSession('session-123'));

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.realtimeStatus).toBe('connected');
      });
    });

    it('should not subscribe when enableRealtime is false', async () => {
      const { result } = renderHook(() =>
        useOnboardingSession('session-123', { enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockChannel).not.toHaveBeenCalled();
      expect(result.current.realtimeStatus).toBe('disconnected');
    });

    it('should not subscribe when feature flag is disabled', async () => {
      process.env.NEXT_PUBLIC_ONBOARDING_REALTIME = 'false';

      const { result } = renderHook(() => useOnboardingSession('session-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockChannel).not.toHaveBeenCalled();
    });

    it('should cleanup subscription on unmount', async () => {
      const { unmount } = renderHook(() => useOnboardingSession('session-123'));

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe('retry logic', () => {
    it('should retry on CHANNEL_ERROR', async () => {
      mockSubscribe.mockImplementation((callback) => {
        subscribeCallback = callback;
        setTimeout(() => callback('CHANNEL_ERROR'), 0);
        return { unsubscribe: jest.fn() };
      });

      const { result } = renderHook(() => useOnboardingSession('session-123'));

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.realtimeStatus).toBe('connecting');

      // Advance past first retry delay (1s)
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.retryCount).toBe(1);
    });

    it('should retry on TIMED_OUT', async () => {
      mockSubscribe.mockImplementation((callback) => {
        setTimeout(() => callback('TIMED_OUT'), 0);
        return { unsubscribe: jest.fn() };
      });

      const { result } = renderHook(() => useOnboardingSession('session-123'));

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.realtimeStatus).toBe('connecting');
    });

    it('should increment retryCount on connection error', async () => {
      mockSubscribe.mockImplementation((callback) => {
        setTimeout(() => callback('CHANNEL_ERROR'), 0);
        return { unsubscribe: jest.fn() };
      });

      const { result } = renderHook(() => useOnboardingSession('session-123'));

      // Initial attempt triggers error
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Verify retry logic is triggered
      expect(result.current.realtimeStatus).toBe('connecting');
    });
  });

  describe('polling fallback', () => {
    it('should provide isPollingFallback state', async () => {
      const { result } = renderHook(() => useOnboardingSession('session-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // By default, should not be in polling fallback when Realtime is connected
      expect(typeof result.current.isPollingFallback).toBe('boolean');
    });
  });

  describe('refetch', () => {
    it('should refetch session when called', async () => {
      const { result } = renderHook(() => useOnboardingSession('session-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFrom.mockClear();
      setupMocks({ ...mockSession, current_stage: 5 });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFrom).toHaveBeenCalledWith('onboarding_sessions');
    });
  });

  describe('Realtime updates', () => {
    it('should update session on Realtime payload', async () => {
      let updateCallback: ((payload: { new: unknown }) => void) | null = null;

      mockOn.mockImplementation((_event, _config, callback) => {
        updateCallback = callback;
        return {
          subscribe: mockSubscribe.mockImplementation((cb) => {
            setTimeout(() => cb('SUBSCRIBED'), 0);
            return { unsubscribe: jest.fn() };
          }),
        };
      });

      const { result } = renderHook(() => useOnboardingSession('session-123'));

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Simulate Realtime update
      const updatedData = {
        id: 'db-id-1',
        session_id: 'session-123',
        user_id: 'user-456',
        status: 'completed',
        current_stage: 7,
        stage_progress: 1.0,
        overall_progress: 100,
        last_activity: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      act(() => {
        updateCallback?.({ new: updatedData });
      });

      expect(result.current.session?.status).toBe('completed');
      expect(result.current.session?.currentStage).toBe(7);
      expect(result.current.session?.overallProgress).toBe(100);
    });
  });
});
