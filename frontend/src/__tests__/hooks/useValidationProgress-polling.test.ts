/**
 * useValidationProgress Polling Fallback Tests
 *
 * Tests that the hook activates polling for active run statuses
 * (running, paused) and does not poll for terminal statuses (completed).
 *
 * @story US-F08, US-F09
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useValidationProgress } from '@/hooks/useValidationProgress';

// --- Supabase mock infrastructure ---

const mockFrom = jest.fn();
const mockChannel = jest.fn();
const mockRemoveChannel = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}));

function setupMockForStatus(status: string) {
  const mockRun = {
    id: 'db-id-1',
    run_id: 'run-poll-test',
    project_id: 'project-456',
    status,
    current_phase: 1,
    started_at: '2026-01-18T10:00:00Z',
    completed_at: status === 'completed' ? '2026-01-18T11:00:00Z' : null,
    error_message: null,
  };

  mockFrom.mockImplementation((table: string) => {
    if (table === 'validation_runs') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockRun, error: null }),
          }),
        }),
      };
    }
    if (table === 'validation_progress') {
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      };
    }
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    };
  });

  // Realtime channel mock (no-op subscription)
  mockChannel.mockReturnValue({
    on: jest.fn().mockReturnValue({
      subscribe: jest.fn().mockImplementation((cb) => {
        setTimeout(() => cb('SUBSCRIBED'), 0);
        return { unsubscribe: jest.fn() };
      }),
    }),
  });
}

describe('useValidationProgress - polling fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('activates polling for running status', async () => {
    setupMockForStatus('running');

    const { result } = renderHook(() =>
      useValidationProgress('run-poll-test')
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callsAfterInit = mockFrom.mock.calls.length;

    // Advance past default 5s poll interval
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    // Should have polled (called from() again for validation_runs + validation_progress)
    expect(mockFrom.mock.calls.length).toBeGreaterThan(callsAfterInit);
  });

  it('activates polling for paused status', async () => {
    setupMockForStatus('paused');

    const { result } = renderHook(() =>
      useValidationProgress('run-poll-test')
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callsAfterInit = mockFrom.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockFrom.mock.calls.length).toBeGreaterThan(callsAfterInit);
  });

  it('does not poll for completed status', async () => {
    setupMockForStatus('completed');

    const { result } = renderHook(() =>
      useValidationProgress('run-poll-test')
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callsAfterInit = mockFrom.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    // No additional calls should have been made
    expect(mockFrom.mock.calls.length).toBe(callsAfterInit);
  });
});
