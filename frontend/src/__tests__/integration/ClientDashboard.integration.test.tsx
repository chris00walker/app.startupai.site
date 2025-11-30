/**
 * ClientDashboard Integration Tests
 *
 * SKIPPED: This test needs refactoring to properly mock Supabase client.
 *
 * Current issue: The test mocks the `api` service, but ClientPage uses
 * Supabase client directly via hooks (useProjectReports, useFitData, etc.).
 * These hooks call createClient() from @/lib/supabase/client.
 *
 * To fix:
 * 1. Mock @/lib/supabase/client at module level (see src/__tests__/api/crewai/status/route.test.ts for pattern)
 * 2. Configure mock responses for all hooks the component uses
 * 3. Or refactor component to use api service instead of direct Supabase calls
 *
 * Related: GH Issue #189 (Specification-driven test refresh)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ClientPage from '../../pages/client/[id]';
import api from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: 'test-client-123' },
    push: jest.fn(),
    pathname: '/client/test-client-123'
  })
}));

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 0 },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe.skip('Client Dashboard Integration Tests', () => {
  const mockClientData = {
    client: {
      id: 'test-client-123',
      name: 'TechStart Ventures',
      description: 'Series A SaaS Startup - Strategic Growth & Market Expansion',
      status: 'active',
      lastActivity: '2024-01-15T10:30:00Z'
    }
  };

  const mockMetrics = {
    totalProjects: 15,
    activeAgents: 8,
    completionRate: 92,
    avgResponseTime: 1.2
  };

  const mockTasks = {
    tasks: [
      {
        _id: '1',
        title: 'Discovery Analysis',
        status: 'complete',
        assignedAgent: 'DiscoveryAgent'
      },
      {
        _id: '2',
        title: 'Market Validation',
        status: 'in_progress',
        assignedAgent: 'ValidationAgent'
      },
      {
        _id: '3',
        title: 'Scale Planning',
        status: 'pending',
        assignedAgent: 'ScaleAgent'
      },
      {
        _id: '4',
        title: 'Risk Assessment',
        status: 'exception',
        assignedAgent: 'RiskAgent'
      }
    ]
  };

  const defaultApiGetResponse = (url: string) => {
    if (url.includes('clients/') && url.includes('artefacts')) {
      return Promise.resolve({ data: { artefacts: [] } });
    }
    if (url.includes('clients/') && url.includes('tasks')) {
      return Promise.resolve({ data: { tasks: [] } });
    }
    if (url.includes('agents/status')) {
      return Promise.resolve({ data: { agents: [] } });
    }
    if (url.includes('metrics/tasks')) {
      return Promise.resolve({
        data: {
          counts: {
            pending: 0,
            in_progress: 0,
            complete: 0,
            exception: 0,
          },
        },
      });
    }
    if (url.includes('clients/')) {
      return Promise.resolve({ data: mockClientData });
    }
    return Promise.resolve({ data: {} });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.get.mockImplementation(defaultApiGetResponse);
  });

  describe('Data Loading Integration', () => {
    it('should load and display client data from API', async () => {
      renderWithProviders(<ClientPage />);

      // Wait for all queries to resolve and demo data to load
      await waitFor(() => {
        expect(screen.getByText('TechStart Ventures')).toBeInTheDocument();
      });
      
      // Wait for tasks to load (should show demo data since we return empty array)
      await waitFor(() => {
        expect(screen.getByText('Demo Mode: Showing sample tasks (backend not connected)')).toBeInTheDocument();
      });

      // Verify all data sections are rendered
      expect(screen.getByText('Series A SaaS Startup - Strategic Growth & Market Expansion')).toBeInTheDocument();
      expect(screen.getByText('TechStart Ventures')).toBeInTheDocument(); // Client name
      expect(screen.getByText('Active')).toBeInTheDocument(); // Status badge
      // Check for specific task elements in the kanban board
      const scalePlanningElements = screen.getAllByText('Scale Planning');
      expect(scalePlanningElements.length).toBeGreaterThan(0);
      
      const riskAssessmentElements = screen.getAllByText('Risk Assessment');
      expect(riskAssessmentElements.length).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully and show fallback content', async () => {
      mockedApi.get.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<ClientPage />);

      // Should show demo content when API fails
      await waitFor(() => {
        expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
      });

      // Should still render the page structure
      expect(screen.getByText('Project Tasks & Milestones')).toBeInTheDocument();
    });
  });

  describe('Real-time Data Updates', () => {
    it('should refresh data when client status changes', async () => {
      let callCount = 0;
      mockedApi.get.mockImplementation((url) => {
        if (url.includes('clients/test-client-123')) {
          callCount++;
          return Promise.resolve({
            data: {
              client: {
                ...mockClientData.client,
                status: callCount === 1 ? 'active' : 'inactive',
              },
            },
          });
        }
        return defaultApiGetResponse(url);
      });

      renderWithProviders(<ClientPage />);

      await waitFor(() => {
        expect(screen.getByText('TechStart Ventures')).toBeInTheDocument();
      });

      // Simulate data refresh (would happen via polling or websocket)
      // This tests the component's ability to handle data updates
      expect(mockedApi.get).toHaveBeenCalledWith('/clients/test-client-123');
    });
  });

  describe('Agent Status Integration', () => {
    it('should display agent statuses and handle agent interactions', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'DiscoveryAgent',
          status: 'running',
          tasks: 3,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'agent-2',
          name: 'ValidationAgent',
          status: 'idle',
          tasks: 1,
          lastUpdated: new Date().toISOString(),
        },
      ];

      mockedApi.get.mockImplementation((url) => {
        if (url.includes('agents')) {
          return Promise.resolve({ data: { agents: mockAgents } });
        }
        return defaultApiGetResponse(url);
      });

      renderWithProviders(<ClientPage />);

      await waitFor(() => {
        expect(screen.getByText('ValidationAgent')).toBeInTheDocument();
      });

      expect(screen.getByText('DiscoveryAgent')).toBeInTheDocument();
      // Check for specific task count in context
      expect(screen.getByText('Demo Mode: Showing sample tasks (backend not connected)')).toBeInTheDocument();
    });
  });

  describe('Kanban Board Integration', () => {
    it('should load and display tasks in kanban format', async () => {
      mockedApi.get.mockImplementation((url) => {
        if (url.includes('tasks')) {
          return Promise.resolve({ data: mockTasks });
        }
        return defaultApiGetResponse(url);
      });

      renderWithProviders(<ClientPage />);

      await waitFor(() => {
        expect(screen.getByText('Market Validation')).toBeInTheDocument();
      });

      // Verify task statuses are displayed correctly in badges
      const statusBadges = screen.getAllByText('in_progress');
      expect(statusBadges.length).toBeGreaterThan(0);
      
      const completeBadges = screen.getAllByText('complete');
      expect(completeBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle component errors gracefully', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error in the component
      mockedApi.get.mockImplementation(() => {
        throw new Error('Component Error');
      });

      renderWithProviders(<ClientPage />);

      // Should show fallback UI instead of crashing
      await waitFor(() => {
        expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});
