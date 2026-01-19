/**
 * useFounderStatus Hook Tests
 *
 * Tests for the useFounderStatus hook that polls for AI founder status
 * using React Query.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFounderStatus, getFounderStatus, type FounderWithStatus } from '@/hooks/useFounderStatus';

// Mock fetch
global.fetch = jest.fn();

// Mock founder-mapping
jest.mock('@/lib/founders/founder-mapping', () => ({
  AI_FOUNDERS: {
    sage: { id: 'sage', name: 'Sage', title: 'Chief Strategy Officer' },
    forge: { id: 'forge', name: 'Forge', title: 'Chief Technology Officer' },
    pulse: { id: 'pulse', name: 'Pulse', title: 'Chief Marketing Officer' },
  },
  getAllFounders: () => [
    { id: 'sage', name: 'Sage', title: 'Chief Strategy Officer', role: 'strategy' },
    { id: 'forge', name: 'Forge', title: 'Chief Technology Officer', role: 'technology' },
    { id: 'pulse', name: 'Pulse', title: 'Chief Marketing Officer', role: 'marketing' },
  ],
}));

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useFounderStatus', () => {
  const mockAgentResponse = {
    success: true,
    data: {
      agents: [
        {
          id: 'sage',
          name: 'Sage',
          title: 'Chief Strategy Officer',
          role: 'strategy',
          status: 'running',
          lastUpdated: '2026-01-18T12:00:00Z',
          currentTask: 'Analyzing market trends',
        },
        {
          id: 'forge',
          name: 'Forge',
          title: 'Chief Technology Officer',
          role: 'technology',
          status: 'idle',
          lastUpdated: '2026-01-18T11:00:00Z',
        },
        {
          id: 'pulse',
          name: 'Pulse',
          title: 'Chief Marketing Officer',
          role: 'marketing',
          status: 'idle',
          lastUpdated: '2026-01-18T10:00:00Z',
        },
      ],
      timestamp: '2026-01-18T12:00:00Z',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAgentResponse),
    });
  });

  describe('data fetching', () => {
    it('should fetch founder status on mount', async () => {
      const { result } = renderHook(() => useFounderStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/agents/status');
      expect(result.current.founders).toHaveLength(3);
    });

    it('should merge agent status with founder definitions', async () => {
      const { result } = renderHook(() => useFounderStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const sage = result.current.founders.find(f => f.id === 'sage');
      expect(sage).toBeDefined();
      expect(sage?.status).toBe('running');
      expect(sage?.currentTask).toBe('Analyzing market trends');
    });

    it('should detect active founder', async () => {
      const { result } = renderHook(() => useFounderStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeFounder).toBeDefined();
      expect(result.current.activeFounder?.id).toBe('sage');
      expect(result.current.isAnalyzing).toBe(true);
    });

    it('should return null activeFounder when no one is running', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockAgentResponse,
          data: {
            ...mockAgentResponse.data,
            agents: mockAgentResponse.data.agents.map(a => ({ ...a, status: 'idle' })),
          },
        }),
      });

      const { result } = renderHook(() => useFounderStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeFounder).toBeNull();
      expect(result.current.isAnalyzing).toBe(false);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useFounderStatus(), {
        wrapper: createWrapper(),
      });

      // Wait for query to settle
      await waitFor(() => {
        // Query completed (not loading) or has error
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      // Hook should still return founder data from getAllFounders even with fetch error
      expect(result.current.founders).toHaveLength(3);
      // All founders have idle status when fetch fails
      result.current.founders.forEach(founder => {
        expect(founder.status).toBe('idle');
      });
    });
  });

  describe('default values', () => {
    it('should use idle status for founders not in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            agents: [], // No agent data
            timestamp: '2026-01-18T12:00:00Z',
          },
        }),
      });

      const { result } = renderHook(() => useFounderStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // All founders should have idle status
      result.current.founders.forEach(founder => {
        expect(founder.status).toBe('idle');
      });
    });

    it('should provide timestamp from response', async () => {
      const { result } = renderHook(() => useFounderStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.timestamp).toBe('2026-01-18T12:00:00Z');
    });
  });

  describe('options', () => {
    it('should not poll when enabled is false', async () => {
      (global.fetch as jest.Mock).mockClear();

      const { result } = renderHook(
        () => useFounderStatus({ enabled: false }),
        { wrapper: createWrapper() }
      );

      // Wait a tick for any potential fetch to occur
      await new Promise(resolve => setTimeout(resolve, 50));

      // When enabled is false, React Query doesn't execute the query
      // So fetch should not have been called
      expect(global.fetch).not.toHaveBeenCalled();

      // The hook returns default state when disabled
      expect(result.current.founders).toHaveLength(3); // From getAllFounders mock
    });

    it('should accept custom refetchInterval', async () => {
      const { result } = renderHook(
        () => useFounderStatus({ refetchInterval: 1000 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Hook should accept the option without error
      expect(result.current.founders).toHaveLength(3);
    });
  });
});

describe('getFounderStatus', () => {
  const mockFounders: FounderWithStatus[] = [
    {
      id: 'sage',
      name: 'Sage',
      title: 'Chief Strategy Officer',
      role: 'strategy',
      status: 'running',
      currentTask: 'Analyzing',
      lastUpdated: '2026-01-18T12:00:00Z',
      color: 'blue',
      crews: ['service', 'analysis'],
      icon: jest.fn() as any,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      ringColor: 'ring-blue-500',
    },
    {
      id: 'forge',
      name: 'Forge',
      title: 'Chief Technology Officer',
      role: 'technology',
      status: 'idle',
      lastUpdated: '2026-01-18T11:00:00Z',
      color: 'orange',
      crews: ['build'],
      icon: jest.fn() as any,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      ringColor: 'ring-orange-500',
    },
  ];

  it('should return founder by id', () => {
    const sage = getFounderStatus(mockFounders, 'sage');
    expect(sage?.id).toBe('sage');
    expect(sage?.status).toBe('running');
  });

  it('should return undefined for unknown id', () => {
    const unknown = getFounderStatus(mockFounders, 'unknown' as any);
    expect(unknown).toBeUndefined();
  });
});
