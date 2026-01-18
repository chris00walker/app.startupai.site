/**
 * useClients Hook Tests
 *
 * Tests for the useClients hook that manages consultant client data from Supabase.
 * This hook fetches user_profiles with consultant_id set and transforms them
 * into PortfolioProject format.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useClients } from '@/hooks/useClients';

// Mock Supabase client
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockOrder = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

// Mock useAuth
const mockUser = { id: 'consultant-123', email: 'consultant@example.com' };
let mockAuthLoading = false;
let mockAuthUser: typeof mockUser | null = mockUser;

jest.mock('@/lib/auth/hooks', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: mockAuthLoading,
  }),
}));

// Mock fetch for archive/unarchive operations
global.fetch = jest.fn();

describe('useClients', () => {
  // Sample database client (user_profiles with consultant_id)
  const mockDbClient = {
    id: 'client-1',
    email: 'founder@example.com',
    full_name: 'John Founder',
    company: 'StartupCo',
    role: 'founder',
    consultant_id: 'consultant-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Sample database project
  const mockDbProject = {
    id: 'project-1',
    user_id: 'client-1',
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Sample validation state
  const mockValidationState = {
    id: 'state-1',
    project_id: 'project-1',
    phase: 'desirability',
    desirability_signal: 'strong_commitment',
    feasibility_signal: 'unknown',
    viability_signal: 'unknown',
    human_approval_status: 'not_required',
    ad_spend: 100,
    campaign_spend_usd: 50,
    synthesis_confidence: 0.75,
    updated_at: new Date().toISOString(),
  };

  const setupMocks = (clientData: unknown[], projectData: unknown[], validationData: unknown[], archivedData: unknown[] = []) => {
    // Setup the Supabase query chain
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: clientData, error: null }),
            }),
          }),
        };
      }
      if (table === 'archived_clients') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: archivedData, error: null }),
          }),
        };
      }
      if (table === 'projects') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: projectData, error: null }),
          }),
        };
      }
      if (table === 'crewai_validation_states') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: validationData, error: null }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      };
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = mockUser;
    mockAuthLoading = false;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('data fetching', () => {
    it('should fetch clients and their projects on mount', async () => {
      setupMocks([mockDbClient], [mockDbProject], [mockValidationState]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(result.current.projects).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it('should transform data to PortfolioProject format', async () => {
      setupMocks([mockDbClient], [mockDbProject], [mockValidationState]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const project = result.current.projects[0];
      expect(project.id).toBe('project-1');
      expect(project.clientName).toContain('StartupCo');
      expect(project.clientName).toContain('Test Project');
      expect(project.stage).toBe('DESIRABILITY');
      expect(project.gateStatus).toBe('Passed'); // strong_commitment = Passed
      expect(project.evidenceQuality).toBe(75); // 0.75 * 100
    });

    it('should return empty array when no user', async () => {
      mockAuthUser = null;

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects).toEqual([]);
      expect(result.current.clients).toEqual([]);
    });

    it('should return empty array when user has no clients', async () => {
      setupMocks([], [], []);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects).toEqual([]);
    });

    it('should handle loading state correctly', async () => {
      mockAuthLoading = true;

      const { result } = renderHook(() => useClients());

      expect(result.current.isLoading).toBe(true);
    });

    it('should create placeholder for clients without projects', async () => {
      const clientWithoutProjects = { ...mockDbClient, id: 'client-no-project' };
      setupMocks([clientWithoutProjects], [], []);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects).toHaveLength(1);
      const placeholder = result.current.projects[0];
      expect(placeholder.id).toBe('client-no-project');
      expect(placeholder.stage).toBe('DESIRABILITY');
      expect(placeholder.gateStatus).toBe('Pending');
      expect(placeholder.evidenceQuality).toBe(0);
    });
  });

  describe('archive filtering', () => {
    it('should exclude archived clients by default', async () => {
      const archivedClient = { ...mockDbClient, id: 'archived-client' };
      const activeClient = { ...mockDbClient, id: 'active-client' };
      const archivedData = [{ client_id: 'archived-client' }];

      setupMocks([archivedClient, activeClient], [], [], archivedData);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only have 1 project (active client placeholder)
      expect(result.current.projects).toHaveLength(1);
      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0].isArchived).toBe(false);
    });

    it('should include archived clients when option is set', async () => {
      const archivedClient = { ...mockDbClient, id: 'archived-client' };
      const activeClient = { ...mockDbClient, id: 'active-client' };
      const archivedData = [{ client_id: 'archived-client' }];

      setupMocks([archivedClient, activeClient], [], [], archivedData);

      const { result } = renderHook(() => useClients({ includeArchived: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have 2 clients (both active and archived)
      expect(result.current.clients).toHaveLength(2);
      expect(result.current.clients.find(c => c.id === 'archived-client')?.isArchived).toBe(true);
      expect(result.current.clients.find(c => c.id === 'active-client')?.isArchived).toBe(false);
    });
  });

  describe('signal mapping', () => {
    it('should map strong_commitment to Passed gate status', async () => {
      const state = { ...mockValidationState, desirability_signal: 'strong_commitment' };
      setupMocks([mockDbClient], [mockDbProject], [state]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects[0].gateStatus).toBe('Passed');
    });

    it('should map no_interest to At Risk gate status', async () => {
      const state = { ...mockValidationState, desirability_signal: 'no_interest' };
      setupMocks([mockDbClient], [mockDbProject], [state]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects[0].gateStatus).toBe('At Risk');
    });

    it('should map pending human approval to Pending gate status', async () => {
      const state = { ...mockValidationState, human_approval_status: 'pending' };
      setupMocks([mockDbClient], [mockDbProject], [state]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects[0].gateStatus).toBe('Pending');
    });

    it('should map viability signals to VIABILITY stage', async () => {
      const state = {
        ...mockValidationState,
        viability_signal: 'profitable',
      };
      setupMocks([mockDbClient], [mockDbProject], [state]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects[0].stage).toBe('VIABILITY');
    });

    it('should map feasibility signals to FEASIBILITY stage', async () => {
      const state = {
        ...mockValidationState,
        desirability_signal: 'strong_commitment',
        feasibility_signal: 'green',
        viability_signal: 'unknown',
      };
      setupMocks([mockDbClient], [mockDbProject], [state]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.projects[0].stage).toBe('FEASIBILITY');
    });
  });

  describe('archiveClient', () => {
    it('should call API to archive client', async () => {
      setupMocks([mockDbClient], [mockDbProject], [mockValidationState]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.archiveClient('client-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/clients/client-1/archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });
    });

    it('should throw error when archive fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to archive' }),
      });

      setupMocks([mockDbClient], [mockDbProject], [mockValidationState]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.archiveClient('client-1');
        })
      ).rejects.toThrow('Failed to archive');
    });
  });

  describe('unarchiveClient', () => {
    it('should call API to unarchive client', async () => {
      setupMocks([mockDbClient], [mockDbProject], [mockValidationState]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.unarchiveClient('client-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/clients/client-1/archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      });
    });
  });

  describe('refetch', () => {
    it('should refetch clients when called', async () => {
      setupMocks([mockDbClient], [mockDbProject], [mockValidationState]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mocks and call refetch
      mockFrom.mockClear();
      setupMocks([mockDbClient], [mockDbProject], [mockValidationState]);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
    });
  });

  describe('client list', () => {
    it('should populate clients array with ClientInfo', async () => {
      setupMocks([mockDbClient], [mockDbProject], [mockValidationState]);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0]).toMatchObject({
        id: 'client-1',
        name: 'John Founder',
        company: 'StartupCo',
        email: 'founder@example.com',
        isArchived: false,
      });
    });

    it('should use email as name when full_name is null', async () => {
      const clientWithoutName = { ...mockDbClient, full_name: null };
      setupMocks([clientWithoutName], [], []);

      const { result } = renderHook(() => useClients());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.clients[0].name).toBe('founder@example.com');
    });
  });
});
