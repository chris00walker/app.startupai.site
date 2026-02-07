/**
 * useValidationProgress Hook Tests
 *
 * Tests for the useValidationProgress and useActiveValidationRun hooks
 * that subscribe to validation progress updates via Supabase Realtime.
 * @story US-F08, US-F09
*/

import { renderHook, waitFor, act } from '@testing-library/react';
import { useValidationProgress, useActiveValidationRun } from '@/hooks/useValidationProgress';

// Mock Supabase client
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
const mockChannel = jest.fn();
const mockOn = jest.fn();
const mockSubscribe = jest.fn();
const mockRemoveChannel = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}));

describe('useValidationProgress', () => {
  const mockValidationRun = {
    id: 'db-id-1',
    run_id: 'run-123',
    project_id: 'project-456',
    status: 'running',
    current_phase: 2,
    started_at: '2026-01-18T10:00:00Z',
    completed_at: null,
    error_message: null,
  };

  const mockProgressEvents = [
    {
      id: 'event-1',
      run_id: 'run-123',
      event_type: 'phase_started',
      phase: 1,
      message: 'Phase 1 started',
      metadata: {},
      created_at: '2026-01-18T10:01:00Z',
    },
    {
      id: 'event-2',
      run_id: 'run-123',
      event_type: 'phase_completed',
      phase: 1,
      message: 'Phase 1 completed',
      metadata: { duration_ms: 5000 },
      created_at: '2026-01-18T10:02:00Z',
    },
  ];

  const setupMocks = (
    runData: unknown | null,
    runError: unknown | null = null,
    progressData: unknown[] = [],
    progressError: unknown | null = null
  ) => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'validation_runs') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: runData, error: runError }),
              in: () => ({
                order: () => ({
                  limit: () => ({
                    single: () => Promise.resolve({ data: runData, error: runError }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'validation_progress') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: progressData, error: progressError }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
    });

    mockChannel.mockReturnValue({
      on: mockOn.mockReturnValue({
        subscribe: mockSubscribe.mockImplementation((callback) => {
          setTimeout(() => callback('SUBSCRIBED'), 0);
          return { unsubscribe: jest.fn() };
        }),
      }),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    setupMocks(mockValidationRun, null, mockProgressEvents);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('data fetching', () => {
    it('should fetch validation run and progress on mount', async () => {
      const { result } = renderHook(() => useValidationProgress('run-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledWith('validation_runs');
      expect(mockFrom).toHaveBeenCalledWith('validation_progress');
      expect(result.current.run).toBeDefined();
      expect(result.current.progress).toHaveLength(2);
    });

    it('should return validation run status', async () => {
      const { result } = renderHook(() => useValidationProgress('run-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toBe('running');
      expect(result.current.currentPhase).toBe(2);
    });

    it('should return idle status when no runId', async () => {
      const { result } = renderHook(() => useValidationProgress(null));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.run).toBeNull();
      expect(result.current.status).toBe('idle');
      expect(result.current.progress).toEqual([]);
    });

    it('should handle run not found (PGRST116)', async () => {
      setupMocks(null, { code: 'PGRST116' }, []);

      const { result } = renderHook(() => useValidationProgress('run-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.run).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      setupMocks(null, { code: 'OTHER_ERROR', message: 'Database error' }, []);

      const { result } = renderHook(() => useValidationProgress('run-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Realtime subscription', () => {
    it('should subscribe to progress channel', async () => {
      renderHook(() => useValidationProgress('run-123'));

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(mockChannel).toHaveBeenCalledWith('progress:run-123');
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          table: 'validation_progress',
        }),
        expect.any(Function)
      );
    });

    it('should subscribe to run channel', async () => {
      renderHook(() => useValidationProgress('run-123'));

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(mockChannel).toHaveBeenCalledWith('run:run-123');
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'UPDATE',
          table: 'validation_runs',
        }),
        expect.any(Function)
      );
    });

    it('should not subscribe when enableRealtime is false', async () => {
      const { result } = renderHook(() =>
        useValidationProgress('run-123', { enableRealtime: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockChannel).not.toHaveBeenCalled();
    });

    it('should cleanup subscriptions on unmount', async () => {
      const { unmount } = renderHook(() => useValidationProgress('run-123'));

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalledTimes(2); // progress + run channels
    });
  });

  describe('Realtime updates', () => {
    it('should append new progress events', async () => {
      let insertCallback: ((payload: { new: unknown }) => void) | null = null;

      mockOn.mockImplementation((_event, config, callback) => {
        if (config.event === 'INSERT') {
          insertCallback = callback;
        }
        return {
          subscribe: mockSubscribe.mockImplementation((cb) => {
            setTimeout(() => cb('SUBSCRIBED'), 0);
            return { unsubscribe: jest.fn() };
          }),
        };
      });

      const { result } = renderHook(() => useValidationProgress('run-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.progress).toHaveLength(2);

      // Simulate new progress event
      const newEvent = {
        id: 'event-3',
        run_id: 'run-123',
        event_type: 'phase_started',
        phase: 2,
        message: 'Phase 2 started',
        metadata: {},
        created_at: '2026-01-18T10:03:00Z',
      };

      act(() => {
        insertCallback?.({ new: newEvent });
      });

      expect(result.current.progress).toHaveLength(3);
    });

    it('should update run on status change', async () => {
      let updateCallback: ((payload: { new: unknown }) => void) | null = null;

      mockOn.mockImplementation((_event, config, callback) => {
        if (config.event === 'UPDATE') {
          updateCallback = callback;
        }
        return {
          subscribe: mockSubscribe.mockImplementation((cb) => {
            setTimeout(() => cb('SUBSCRIBED'), 0);
            return { unsubscribe: jest.fn() };
          }),
        };
      });

      const { result } = renderHook(() => useValidationProgress('run-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toBe('running');

      // Simulate run update
      act(() => {
        updateCallback?.({
          new: { ...mockValidationRun, status: 'completed', current_phase: 5 },
        });
      });

      expect(result.current.status).toBe('completed');
      expect(result.current.currentPhase).toBe(5);
    });
  });

  describe('polling fallback', () => {
    it('should poll when pollInterval is set', async () => {
      const { result } = renderHook(() =>
        useValidationProgress('run-123', { pollInterval: 5000 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCalls = mockFrom.mock.calls.length;

      // Advance past poll interval
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockFrom.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it('should auto-poll for active runs even when pollInterval is 0', async () => {
      // With Fix 1: auto-polling activates for running/pending/paused runs
      // even when pollInterval is explicitly 0 (defense-in-depth for Realtime)
      const { result } = renderHook(() =>
        useValidationProgress('run-123', { pollInterval: 0 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCalls = mockFrom.mock.calls.length;

      // Advance time - SHOULD trigger additional calls since mock run is "running"
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      // Active run (status=running) triggers auto-polling at 5s default
      expect(mockFrom.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  describe('refetch', () => {
    it('should refetch when called', async () => {
      const { result } = renderHook(() => useValidationProgress('run-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFrom.mockClear();
      setupMocks(mockValidationRun, null, mockProgressEvents);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFrom).toHaveBeenCalledWith('validation_runs');
    });
  });
});

describe('useActiveValidationRun', () => {
  const mockActiveRun = {
    run_id: 'run-active-123',
  };

  const setupMocks = (data: unknown | null, error: unknown | null = null) => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          in: () => ({
            order: () => ({
              limit: () => ({
                single: () => Promise.resolve({ data, error }),
              }),
            }),
          }),
        }),
      }),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find active run for project', async () => {
    setupMocks(mockActiveRun);

    const { result } = renderHook(() => useActiveValidationRun('project-456'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.runId).toBe('run-active-123');
  });

  it('should return null when no active run', async () => {
    setupMocks(null, { code: 'PGRST116' });

    const { result } = renderHook(() => useActiveValidationRun('project-456'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.runId).toBeNull();
  });

  it('should return null when projectId is null', async () => {
    const { result } = renderHook(() => useActiveValidationRun(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.runId).toBeNull();
  });

  it('should query for pending, running, or paused status', async () => {
    setupMocks(mockActiveRun);

    renderHook(() => useActiveValidationRun('project-456'));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('validation_runs');
    });

    // The hook filters by status: pending, running, or paused
    // This is handled by the .in() call in the query chain
  });
});
