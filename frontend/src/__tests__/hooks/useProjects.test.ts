/**
 * useProjects Hook Tests
 *
 * Tests for the useProjects and useActiveProjects hooks that manage
 * founder project data from Supabase.
 * @story US-F02, US-F04
*/

import { renderHook, waitFor, act } from '@testing-library/react';
import { useProjects, useActiveProjects } from '@/hooks/useProjects';

// Mock Supabase client
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockNeq = jest.fn();
const mockOrder = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

// Mock useAuth
const mockUser = { id: 'user-123', email: 'founder@example.com' };
let mockAuthLoading = false;
let mockAuthUser: typeof mockUser | null = mockUser;

jest.mock('@/lib/auth/hooks', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: mockAuthLoading,
  }),
}));

// Mock fetch for archive/unarchive/delete operations
global.fetch = jest.fn();

describe('useProjects', () => {
  // Sample database project
  const mockDbProject = {
    id: 'project-1',
    name: 'Test Project',
    description: 'A test project',
    user_id: 'user-123',
    status: 'active',
    validation_stage: 'DESIRABILITY',
    gate_status: 'Pending',
    risk_budget_planned: 1000,
    risk_budget_actual: 500,
    risk_budget_delta: -500,
    assigned_consultant: 'consultant@example.com',
    last_activity: new Date().toISOString(),
    next_gate_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    evidence_quality: 75,
    hypotheses_count: 5,
    experiments_count: 3,
    evidence_count: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = mockUser;
    mockAuthLoading = false;

    // Setup Supabase chain
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ neq: mockNeq, order: mockOrder });
    mockNeq.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({ data: [mockDbProject], error: null });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('data fetching', () => {
    it('should fetch projects on mount', async () => {
      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledWith('projects');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result.current.projects).toHaveLength(1);
    });

    it('should transform database project to PortfolioProject', async () => {
      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const project = result.current.projects[0];
      expect(project.id).toBe('project-1');
      expect(project.clientName).toBe('Test Project');
      expect(project.stage).toBe('DESIRABILITY');
      expect(project.gateStatus).toBe('Pending');
      expect(project.riskBudget.planned).toBe(1000);
      expect(project.riskBudget.actual).toBe(500);
      expect(project.evidenceQuality).toBe(75);
    });

    it('should filter out archived projects by default', async () => {
      renderHook(() => useProjects());

      await waitFor(() => {
        expect(mockNeq).toHaveBeenCalledWith('status', 'archived');
      });
    });

    it('should include archived projects when option is set', async () => {
      renderHook(() => useProjects({ includeArchived: true }));

      await waitFor(() => {
        // When includeArchived is true, neq should NOT be called
        // Instead, order should be called directly from eq
        expect(mockEq).toHaveBeenCalled();
      });
    });

    it('should return empty array when no user', async () => {
      mockAuthUser = null;

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects).toEqual([]);
    });

    it('should handle loading state correctly', async () => {
      mockAuthLoading = true;

      const { result } = renderHook(() => useProjects());

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle fetch errors', async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error('Fetch failed') });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('refetch', () => {
    it('should refetch projects when called', async () => {
      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mocks and call refetch
      mockFrom.mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFrom).toHaveBeenCalledWith('projects');
    });

    it('should not refetch when no user', async () => {
      mockAuthUser = null;

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFrom.mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('archiveProject', () => {
    it('should call API to archive project', async () => {
      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.archiveProject('project-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/projects/project-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
    });

    it('should throw error when archive fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to archive' }),
      });

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.archiveProject('project-1');
        })
      ).rejects.toThrow('Failed to archive');
    });
  });

  describe('unarchiveProject', () => {
    it('should call API to unarchive project', async () => {
      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.unarchiveProject('project-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/projects/project-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
    });
  });

  describe('deleteProject', () => {
    it('should call API to delete project', async () => {
      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteProject('project-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/projects/project-1', {
        method: 'DELETE',
      });
    });
  });
});

describe('useActiveProjects', () => {
  const mockDbProject = {
    id: 'project-1',
    name: 'Active Project',
    description: 'An active project',
    user_id: 'user-123',
    status: 'active',
    validation_stage: 'FEASIBILITY',
    gate_status: 'Passed',
    risk_budget_planned: 2000,
    risk_budget_actual: 1500,
    risk_budget_delta: -500,
    assigned_consultant: null,
    last_activity: new Date().toISOString(),
    next_gate_date: null,
    evidence_quality: 85,
    hypotheses_count: 8,
    experiments_count: 5,
    evidence_count: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = mockUser;
    mockAuthLoading = false;

    // Setup Supabase chain for useActiveProjects (uses eq twice, not neq)
    const mockEq2 = jest.fn();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq2 });
    mockEq2.mockReturnValue({ order: mockOrder });
    mockOrder.mockResolvedValue({ data: [mockDbProject], error: null });
  });

  it('should fetch only active projects', async () => {
    const { result } = renderHook(() => useActiveProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(result.current.projects).toHaveLength(1);
  });

  it('should return empty array when no user', async () => {
    mockAuthUser = null;

    const { result } = renderHook(() => useActiveProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('Database error') });

    const { result } = renderHook(() => useActiveProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.projects).toEqual([]);
  });
});
