/**
 * useGatePolicies Hook Tests
 *
 * Tests for the useGatePolicies and useGatePolicy hooks that manage
 * configurable gate policies for phase transitions.
 *
 * @story US-AD10, US-ADB05, US-AFB03, US-AVB03
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useGatePolicies, useGatePolicy } from '@/hooks/useGatePolicies';

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

describe('useGatePolicies', () => {
  const mockPolicy = {
    id: 'policy-1',
    gate: 'DESIRABILITY',
    isCustom: true,
    minExperiments: 3,
    requiredFitTypes: ['Desirability'],
    minWeakEvidence: 0,
    minMediumEvidence: 1,
    minStrongEvidence: 1,
    thresholds: { fit_score: 70, ctr: 0.02 },
    overrideRoles: ['admin', 'senior_consultant'],
    requiresApproval: true,
  };

  const mockDefaults = {
    minExperiments: 3,
    requiredFitTypes: ['Desirability'],
    minWeakEvidence: 0,
    minMediumEvidence: 1,
    minStrongEvidence: 1,
    thresholds: { fit_score: 70, ctr: 0.02 },
    requiresApproval: true,
  };

  const mockApiResponse = {
    policies: {
      DESIRABILITY: mockPolicy,
      FEASIBILITY: { ...mockPolicy, gate: 'FEASIBILITY', id: 'policy-2' },
      VIABILITY: { ...mockPolicy, gate: 'VIABILITY', id: 'policy-3' },
    },
    defaults: {
      DESIRABILITY: mockDefaults,
      FEASIBILITY: { ...mockDefaults, minExperiments: 2 },
      VIABILITY: { ...mockDefaults, minExperiments: 2 },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = mockUser;
    mockAuthLoading = false;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });
  });

  describe('data fetching', () => {
    it('should fetch gate policies on mount', async () => {
      const { result } = renderHook(() => useGatePolicies());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/settings/gate-policies');
      expect(result.current.policies).toHaveProperty('DESIRABILITY');
      expect(result.current.policies).toHaveProperty('FEASIBILITY');
      expect(result.current.policies).toHaveProperty('VIABILITY');
    });

    it('should return null when no user', async () => {
      mockAuthUser = null;

      const { result } = renderHook(() => useGatePolicies());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.policies).toBeNull();
      expect(result.current.defaults).toBeNull();
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useGatePolicies());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('500');
    });

    it('should handle loading state correctly', async () => {
      mockAuthLoading = true;

      const { result } = renderHook(() => useGatePolicies());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('updatePolicy', () => {
    it('should call PUT API to update policy', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ policy: { ...mockPolicy, minExperiments: 5 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        });

      const { result } = renderHook(() => useGatePolicies());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = false;
      await act(async () => {
        success = await result.current.updatePolicy('DESIRABILITY', { minExperiments: 5 });
      });

      expect(success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/gate-policies/desirability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minExperiments: 5 }),
      });
    });

    it('should return false on update error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Invalid data' }),
        });

      const { result } = renderHook(() => useGatePolicies());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = true;
      await act(async () => {
        success = await result.current.updatePolicy('DESIRABILITY', { minExperiments: -1 });
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('resetPolicy', () => {
    it('should call DELETE API to reset policy', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ policy: { ...mockPolicy, isCustom: false } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        });

      const { result } = renderHook(() => useGatePolicies());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = false;
      await act(async () => {
        success = await result.current.resetPolicy('DESIRABILITY');
      });

      expect(success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/settings/gate-policies/desirability', {
        method: 'DELETE',
      });
    });

    it('should return false on reset error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' }),
        });

      const { result } = renderHook(() => useGatePolicies());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success = true;
      await act(async () => {
        success = await result.current.resetPolicy('DESIRABILITY');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('refetch', () => {
    it('should refetch policies when called', async () => {
      const { result } = renderHook(() => useGatePolicies());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/settings/gate-policies');
    });
  });
});

describe('useGatePolicy', () => {
  const mockPolicy = {
    id: 'policy-1',
    gate: 'DESIRABILITY',
    isCustom: true,
    minExperiments: 3,
    requiredFitTypes: ['Desirability'],
    minWeakEvidence: 0,
    minMediumEvidence: 1,
    minStrongEvidence: 1,
    thresholds: { fit_score: 70, ctr: 0.02 },
    overrideRoles: ['admin', 'senior_consultant'],
    requiresApproval: true,
  };

  const mockDefaults = {
    minExperiments: 3,
    requiredFitTypes: ['Desirability'],
    minWeakEvidence: 0,
    minMediumEvidence: 1,
    minStrongEvidence: 1,
    thresholds: { fit_score: 70, ctr: 0.02 },
    requiresApproval: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = { id: 'user-123', email: 'test@example.com' };
    mockAuthLoading = false;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ policy: mockPolicy, defaults: mockDefaults }),
    });
  });

  it('should fetch single gate policy by gate type', async () => {
    const { result } = renderHook(() => useGatePolicy('DESIRABILITY'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/settings/gate-policies/desirability');
    expect(result.current.policy).toMatchObject({
      gate: 'DESIRABILITY',
      minExperiments: 3,
    });
    expect(result.current.defaults).toMatchObject({
      minExperiments: 3,
    });
  });

  it('should return null when gate is null', async () => {
    const { result } = renderHook(() => useGatePolicy(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.policy).toBeNull();
    expect(result.current.defaults).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should return null when no user', async () => {
    mockAuthUser = null;

    const { result } = renderHook(() => useGatePolicy('DESIRABILITY'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.policy).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useGatePolicy('DESIRABILITY'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.policy).toBeNull();
  });

  it('should handle loading state correctly', async () => {
    mockAuthLoading = true;

    const { result } = renderHook(() => useGatePolicy('DESIRABILITY'));

    expect(result.current.isLoading).toBe(true);
  });
});
