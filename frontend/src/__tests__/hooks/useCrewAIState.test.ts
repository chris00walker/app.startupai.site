/**
 * useCrewAIState Hook Tests
 *
 * Tests for the CrewAI state hooks including:
 * - useCrewAIState: Main hook for validation state
 * - useInnovationSignals: Signal-focused hook
 * - useVPCData: VPC visualization data hook
 * - useCrewAIKickoff: Analysis kickoff hook
 * - Helper functions: getOverallHealth, getRecommendedAction
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useCrewAIState,
  useInnovationSignals,
  useVPCData,
  useCrewAIKickoff,
  getOverallHealth,
  getRecommendedAction,
  type InnovationPhysicsSignals,
} from '@/hooks/useCrewAIState';

// Mock Supabase client
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

// Mock fetch for kickoff operations
global.fetch = jest.fn();

describe('useCrewAIState', () => {
  const mockValidationState = {
    id: 'state-1',
    project_id: 'project-1',
    session_id: 'session-1',
    kickoff_id: 'kickoff-1',
    iteration: 2,
    phase: 'desirability',
    current_risk_axis: 'desirability',
    problem_fit: 'fit',
    current_segment: 'early_adopters',
    current_value_prop: 'AI-powered validation',
    desirability_signal: 'strong_commitment',
    feasibility_signal: 'green',
    viability_signal: 'profitable',
    last_pivot_type: 'none',
    pending_pivot_type: 'none',
    human_approval_status: 'approved',
    human_input_required: false,
    customer_profiles: { early_adopters: { jobs: ['validate ideas'] } },
    value_maps: { early_adopters: { products: ['AI assistant'] } },
    assumptions: [{ id: 'a1', description: 'Test assumption' }],
    synthesis_confidence: 0.85,
    final_recommendation: 'Proceed to scale',
    next_steps: ['Step 1', 'Step 2'],
    ad_spend: 1000,
    campaign_spend_usd: 500,
    cac: 50,
    ltv: 500,
    ltv_cac_ratio: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const setupMocks = (data: unknown | null, error: unknown | null = null) => {
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder.mockReturnValue({
            limit: mockLimit.mockReturnValue({
              single: mockSingle.mockResolvedValue({ data, error }),
            }),
          }),
        }),
      }),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('data fetching', () => {
    it('should fetch validation state for project', async () => {
      setupMocks(mockValidationState);

      const { result } = renderHook(() => useCrewAIState({ projectId: 'project-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledWith('crewai_validation_states');
      expect(mockEq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(result.current.validationState).toBeDefined();
      expect(result.current.validationState?.project_id).toBe('project-1');
    });

    it('should return null when no projectId', async () => {
      const { result } = renderHook(() => useCrewAIState({}));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.validationState).toBeNull();
      expect(result.current.signals).toBeNull();
    });

    it('should handle not found (PGRST116) gracefully', async () => {
      setupMocks(null, { code: 'PGRST116' });

      const { result } = renderHook(() => useCrewAIState({ projectId: 'project-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.validationState).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle other errors', async () => {
      setupMocks(null, { code: 'OTHER_ERROR', message: 'Database error' });

      const { result } = renderHook(() => useCrewAIState({ projectId: 'project-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('signals derivation', () => {
    it('should derive signals from validation state', async () => {
      setupMocks(mockValidationState);

      const { result } = renderHook(() => useCrewAIState({ projectId: 'project-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.signals).toMatchObject({
        desirability: 'strong_commitment',
        feasibility: 'green',
        viability: 'profitable',
        phase: 'desirability',
        pivotRecommendation: 'none',
      });
    });

    it('should return default signals when no state', async () => {
      setupMocks(null, { code: 'PGRST116' });

      const { result } = renderHook(() => useCrewAIState({ projectId: 'project-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.signals).toBeNull();
    });

    it('should use pending_pivot_type over last_pivot_type', async () => {
      setupMocks({
        ...mockValidationState,
        last_pivot_type: 'segment_pivot',
        pending_pivot_type: 'value_pivot',
      });

      const { result } = renderHook(() => useCrewAIState({ projectId: 'project-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.signals?.pivotRecommendation).toBe('value_pivot');
    });
  });

  describe('auto-refresh', () => {
    it('should not auto-refresh by default', async () => {
      setupMocks(mockValidationState);

      renderHook(() => useCrewAIState({ projectId: 'project-1' }));

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledTimes(1);
      });

      // Advance timers
      jest.advanceTimersByTime(60000);

      // Should still only have been called once
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('should auto-refresh when enabled', async () => {
      setupMocks(mockValidationState);

      renderHook(() => useCrewAIState({
        projectId: 'project-1',
        autoRefresh: true,
        refreshIntervalMs: 10000,
      }));

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledTimes(1);
      });

      // Advance timers past refresh interval
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('refetch', () => {
    it('should refetch when called', async () => {
      setupMocks(mockValidationState);

      const { result } = renderHook(() => useCrewAIState({ projectId: 'project-1' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFrom).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useInnovationSignals', () => {
  const mockValidationState = {
    id: 'state-1',
    project_id: 'project-1',
    desirability_signal: 'strong_commitment',
    feasibility_signal: 'green',
    viability_signal: 'profitable',
    phase: 'viability',
    desirability_evidence: { experiments: [] },
    feasibility_evidence: { tech_assessment: {} },
    viability_evidence: { unit_economics: {} },
  };

  const setupMocks = (data: unknown | null) => {
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder.mockReturnValue({
            limit: mockLimit.mockReturnValue({
              single: mockSingle.mockResolvedValue({ data, error: null }),
            }),
          }),
        }),
      }),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return signals and evidence', async () => {
    setupMocks(mockValidationState);

    const { result } = renderHook(() => useInnovationSignals('project-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.signals).toBeDefined();
    expect(result.current.desirabilityEvidence).toBeDefined();
    expect(result.current.feasibilityEvidence).toBeDefined();
    expect(result.current.viabilityEvidence).toBeDefined();
  });

  it('should return null evidence when not available', async () => {
    setupMocks({ ...mockValidationState, desirability_evidence: null });

    const { result } = renderHook(() => useInnovationSignals('project-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.desirabilityEvidence).toBeNull();
  });
});

describe('useVPCData', () => {
  const mockValidationState = {
    id: 'state-1',
    project_id: 'project-1',
    customer_profiles: {
      early_adopters: {
        jobs: ['validate ideas'],
        pains: ['wasted money'],
        gains: ['faster validation'],
      },
    },
    value_maps: {
      early_adopters: {
        products: ['AI assistant'],
        pain_relievers: ['reduce risk'],
        gain_creators: ['speed'],
      },
    },
    current_segment: 'early_adopters',
    current_value_prop: 'AI-powered validation',
    problem_fit: 'fit',
  };

  const setupMocks = (data: unknown | null) => {
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder.mockReturnValue({
            limit: mockLimit.mockReturnValue({
              single: mockSingle.mockResolvedValue({ data, error: null }),
            }),
          }),
        }),
      }),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return VPC data', async () => {
    setupMocks(mockValidationState);

    const { result } = renderHook(() => useVPCData('project-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.customerProfiles).toHaveProperty('early_adopters');
    expect(result.current.valueMaps).toHaveProperty('early_adopters');
    expect(result.current.currentSegment).toBe('early_adopters');
    expect(result.current.problemFit).toBe('fit');
    expect(result.current.hasData).toBe(true);
    expect(result.current.segments).toContain('early_adopters');
  });

  it('should return empty data when no state', async () => {
    setupMocks(null);

    const { result } = renderHook(() => useVPCData('project-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.customerProfiles).toEqual({});
    expect(result.current.valueMaps).toEqual({});
    expect(result.current.hasData).toBe(false);
    expect(result.current.segments).toHaveLength(0);
  });
});

describe('useCrewAIKickoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start with idle status', () => {
    const { result } = renderHook(() => useCrewAIKickoff('project-1'));

    expect(result.current.status).toBe('idle');
    expect(result.current.kickoffId).toBeNull();
    expect(result.current.progress).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should set error when no projectId', async () => {
    const { result } = renderHook(() => useCrewAIKickoff(undefined));

    await act(async () => {
      await result.current.kickoff({ entrepreneur_input: 'test' });
    });

    expect(result.current.error?.message).toContain('Project ID is required');
  });

  it('should initiate kickoff successfully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ kickoff_id: 'kickoff-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ state: 'COMPLETED', result: { success: true } }),
      });

    const { result } = renderHook(() => useCrewAIKickoff('project-1'));

    await act(async () => {
      await result.current.kickoff({ entrepreneur_input: 'test idea' });
    });

    // With mocks resolving immediately, status goes through to completed
    expect(result.current.status).toBe('completed');
    expect(result.current.kickoffId).toBe('kickoff-123');
    expect(result.current.result).toEqual({ success: true });

    expect(global.fetch).toHaveBeenCalledWith('/api/crewai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'project-1',
        inputs: { entrepreneur_input: 'test idea' },
      }),
    });
  });

  it('should handle kickoff API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Rate limited' }),
    });

    const { result } = renderHook(() => useCrewAIKickoff('project-1'));

    await act(async () => {
      await result.current.kickoff({ entrepreneur_input: 'test' });
    });

    expect(result.current.status).toBe('failed');
    expect(result.current.error?.message).toBe('Rate limited');
  });

  it('should reset state', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Error' }),
    });

    const { result } = renderHook(() => useCrewAIKickoff('project-1'));

    await act(async () => {
      await result.current.kickoff({ entrepreneur_input: 'test' });
    });

    expect(result.current.status).toBe('failed');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.kickoffId).toBeNull();
  });
});

describe('getOverallHealth', () => {
  it('should return "healthy" when all signals are positive', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'strong_commitment',
      feasibility: 'green',
      viability: 'profitable',
      phase: 'viability',
      pivotRecommendation: 'none',
    };

    expect(getOverallHealth(signals)).toBe('healthy');
  });

  it('should return "critical" for no_interest', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'no_interest',
      feasibility: 'green',
      viability: 'profitable',
      phase: 'desirability',
      pivotRecommendation: 'none',
    };

    expect(getOverallHealth(signals)).toBe('critical');
  });

  it('should return "critical" for red_impossible feasibility', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'strong_commitment',
      feasibility: 'red_impossible',
      viability: 'profitable',
      phase: 'feasibility',
      pivotRecommendation: 'none',
    };

    expect(getOverallHealth(signals)).toBe('critical');
  });

  it('should return "critical" for underwater viability', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'strong_commitment',
      feasibility: 'green',
      viability: 'underwater',
      phase: 'viability',
      pivotRecommendation: 'none',
    };

    expect(getOverallHealth(signals)).toBe('critical');
  });

  it('should return "warning" for weak_interest', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'weak_interest',
      feasibility: 'green',
      viability: 'profitable',
      phase: 'desirability',
      pivotRecommendation: 'none',
    };

    expect(getOverallHealth(signals)).toBe('warning');
  });

  it('should return "warning" for orange_constrained feasibility', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'strong_commitment',
      feasibility: 'orange_constrained',
      viability: 'profitable',
      phase: 'feasibility',
      pivotRecommendation: 'none',
    };

    expect(getOverallHealth(signals)).toBe('warning');
  });

  it('should return "warning" for marginal viability', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'strong_commitment',
      feasibility: 'green',
      viability: 'marginal',
      phase: 'viability',
      pivotRecommendation: 'none',
    };

    expect(getOverallHealth(signals)).toBe('warning');
  });

  it('should return "unknown" for mixed signals', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'no_signal',
      feasibility: 'unknown',
      viability: 'unknown',
      phase: 'ideation',
      pivotRecommendation: 'none',
    };

    expect(getOverallHealth(signals)).toBe('unknown');
  });
});

describe('getRecommendedAction', () => {
  it('should recommend pivot when pivot is pending', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'strong_commitment',
      feasibility: 'green',
      viability: 'profitable',
      phase: 'viability',
      pivotRecommendation: 'segment_pivot',
    };

    expect(getRecommendedAction(signals)).toContain('segment');
  });

  it('should recommend experiment for no_signal', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'no_signal',
      feasibility: 'unknown',
      viability: 'unknown',
      phase: 'desirability',
      pivotRecommendation: 'none',
    };

    expect(getRecommendedAction(signals)).toContain('desirability experiment');
  });

  it('should recommend segment pivot for no_interest', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'no_interest',
      feasibility: 'unknown',
      viability: 'unknown',
      phase: 'desirability',
      pivotRecommendation: 'none',
    };

    expect(getRecommendedAction(signals)).toContain('segment pivot');
  });

  it('should recommend feasibility validation after desirability', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'strong_commitment',
      feasibility: 'unknown',
      viability: 'unknown',
      phase: 'desirability',
      pivotRecommendation: 'none',
    };

    expect(getRecommendedAction(signals)).toContain('feasibility');
  });

  it('should recommend viability validation after feasibility', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'strong_commitment',
      feasibility: 'green',
      viability: 'unknown',
      phase: 'feasibility',
      pivotRecommendation: 'none',
    };

    expect(getRecommendedAction(signals)).toContain('unit economics');
  });

  it('should recommend scaling when all signals green', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'strong_commitment',
      feasibility: 'green',
      viability: 'profitable',
      phase: 'viability',
      pivotRecommendation: 'none',
    };

    expect(getRecommendedAction(signals)).toContain('scale');
  });

  it('should recommend kill when pivot is kill', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'no_interest',
      feasibility: 'red_impossible',
      viability: 'underwater',
      phase: 'viability',
      pivotRecommendation: 'kill',
    };

    expect(getRecommendedAction(signals)).toContain('ending this project');
  });

  it('should recommend identifying assumptions in ideation phase', () => {
    const signals: InnovationPhysicsSignals = {
      desirability: 'no_signal',
      feasibility: 'unknown',
      viability: 'unknown',
      phase: 'ideation',
      pivotRecommendation: 'none',
    };

    expect(getRecommendedAction(signals)).toContain('assumptions');
  });
});
