/**
 * Tests for useIntegrations hook
 *
 * @story US-I01, US-I02, US-I03, US-I04, US-I05, US-I06
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useIntegrations } from '@/hooks/useIntegrations';

// Mock useAuth hook
jest.mock('@/lib/auth/hooks', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    loading: false,
  }),
}));

// Mock fetch - will be configured in each test
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock window.open for OAuth popup
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true });

describe('useIntegrations', () => {
  const mockIntegrations = [
    {
      id: 'int-1',
      userId: 'test-user-id',
      integrationType: 'slack',
      status: 'active',
      providerAccountId: 'U123',
      providerAccountName: 'Test User',
      providerAccountEmail: 'test@example.com',
      connectedAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
      preferences: { defaultChannel: '#general' },
    },
    {
      id: 'int-2',
      userId: 'test-user-id',
      integrationType: 'notion',
      status: 'expired',
      providerAccountId: 'N456',
      providerAccountName: 'Workspace',
      connectedAt: '2026-01-10T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
      tokenExpiresAt: '2026-01-14T00:00:00Z',
      preferences: {},
    },
  ];

  // Helper to create a successful fetch response
  const createFetchResponse = (data: unknown) => ({
    ok: true,
    json: () => Promise.resolve(data),
  });

  // Helper to create an error fetch response
  const createErrorResponse = (status: number, data?: unknown) => ({
    ok: false,
    status,
    json: () => Promise.resolve(data || { error: 'Error' }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    mockWindowOpen.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchIntegrations', () => {
    it('should fetch integrations on mount', async () => {
      // Use mockResolvedValue (not Once) to handle any number of calls
      mockFetch.mockResolvedValue(
        createFetchResponse({ integrations: mockIntegrations })
      );

      const { result } = renderHook(() => useIntegrations());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/integrations');
      expect(result.current.integrations).toHaveLength(2);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValue(createErrorResponse(500));

      const { result } = renderHook(() => useIntegrations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.integrations).toHaveLength(0);
    });

    it('should refetch when refetch is called', async () => {
      // Start with integrations, then return updated list on refetch
      mockFetch.mockResolvedValue(
        createFetchResponse({ integrations: mockIntegrations })
      );

      const { result } = renderHook(() => useIntegrations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.integrations).toHaveLength(2);

      // Clear calls to track the refetch
      mockFetch.mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      // Verify refetch was called
      expect(mockFetch).toHaveBeenCalledWith('/api/integrations');
      expect(result.current.integrations).toHaveLength(2);
    });
  });

  describe('connect', () => {
    it('should open OAuth popup', async () => {
      mockFetch.mockResolvedValue(
        createFetchResponse({ integrations: [] })
      );
      mockWindowOpen.mockReturnValue({ closed: false });

      const { result } = renderHook(() => useIntegrations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.connect('slack');
      });

      expect(mockWindowOpen).toHaveBeenCalledWith(
        '/api/integrations/slack/connect',
        'oauth_slack',
        'width=600,height=700,left=100,top=100'
      );
    });
  });

  describe('disconnect', () => {
    it('should call DELETE and refetch', async () => {
      let callCount = 0;
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        callCount++;
        // Initial fetch
        if (url === '/api/integrations' && !options) {
          return Promise.resolve(createFetchResponse({ integrations: mockIntegrations }));
        }
        // DELETE call
        if (options?.method === 'DELETE') {
          return Promise.resolve(createFetchResponse({ success: true }));
        }
        // Refetch after delete
        return Promise.resolve(createFetchResponse({ integrations: [mockIntegrations[1]] }));
      });

      const { result } = renderHook(() => useIntegrations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.disconnect('slack');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/integrations/slack', {
        method: 'DELETE',
      });
    });

    it('should throw error on disconnect failure', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        // Initial fetch
        if (url === '/api/integrations' && !options) {
          return Promise.resolve(createFetchResponse({ integrations: mockIntegrations }));
        }
        // DELETE call - fails
        if (options?.method === 'DELETE') {
          return Promise.resolve(createErrorResponse(400, { error: 'Failed to disconnect' }));
        }
        return Promise.resolve(createFetchResponse({ integrations: mockIntegrations }));
      });

      const { result } = renderHook(() => useIntegrations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.disconnect('slack');
        })
      ).rejects.toThrow('Failed to disconnect');
    });
  });

  describe('updatePreferences', () => {
    it('should call PATCH and refetch', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        // Initial fetch
        if (url === '/api/integrations' && !options) {
          return Promise.resolve(createFetchResponse({ integrations: mockIntegrations }));
        }
        // PATCH call
        if (options?.method === 'PATCH') {
          return Promise.resolve(createFetchResponse({ success: true }));
        }
        return Promise.resolve(createFetchResponse({ integrations: mockIntegrations }));
      });

      const { result } = renderHook(() => useIntegrations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newPrefs = { defaultChannel: '#new-channel' };

      await act(async () => {
        await result.current.updatePreferences('slack', newPrefs);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/integrations/slack', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      });
    });

    it('should throw error on update failure', async () => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        // Initial fetch
        if (url === '/api/integrations' && !options) {
          return Promise.resolve(createFetchResponse({ integrations: mockIntegrations }));
        }
        // PATCH call - fails
        if (options?.method === 'PATCH') {
          return Promise.resolve(createErrorResponse(400, { error: 'Invalid preferences' }));
        }
        return Promise.resolve(createFetchResponse({ integrations: mockIntegrations }));
      });

      const { result } = renderHook(() => useIntegrations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updatePreferences('slack', {});
        })
      ).rejects.toThrow('Invalid preferences');
    });
  });

  describe('getIntegration', () => {
    it('should return integration by type', async () => {
      mockFetch.mockResolvedValue(
        createFetchResponse({ integrations: mockIntegrations })
      );

      const { result } = renderHook(() => useIntegrations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const slack = result.current.getIntegration('slack');
      expect(slack).toBeDefined();
      expect(slack?.integrationType).toBe('slack');
      expect(slack?.status).toBe('active');

      const github = result.current.getIntegration('github');
      expect(github).toBeUndefined();
    });
  });

  describe('isConnected', () => {
    it('should return true for active integrations', async () => {
      mockFetch.mockResolvedValue(
        createFetchResponse({ integrations: mockIntegrations })
      );

      const { result } = renderHook(() => useIntegrations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected('slack')).toBe(true);
      expect(result.current.isConnected('notion')).toBe(false); // expired
      expect(result.current.isConnected('github')).toBe(false); // not connected
    });
  });

  describe('OAuth message handler', () => {
    it('should refetch on successful OAuth callback message', async () => {
      mockFetch.mockResolvedValue(
        createFetchResponse({ integrations: mockIntegrations })
      );

      const { result } = renderHook(() => useIntegrations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear calls to track the refetch
      mockFetch.mockClear();

      // Simulate OAuth callback message
      await act(async () => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'oauth_callback',
              integrationType: 'slack',
              success: true,
            },
          })
        );
      });

      // Should have triggered a refetch
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/integrations');
      });
    });

    it('should log error on failed OAuth callback message', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockResolvedValue(
        createFetchResponse({ integrations: [] })
      );

      const { result } = renderHook(() => useIntegrations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate failed OAuth callback message
      await act(async () => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'oauth_callback',
              integrationType: 'slack',
              success: false,
              error: 'User denied access',
            },
          })
        );
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[useIntegrations] OAuth error:',
        'User denied access'
      );

      consoleSpy.mockRestore();
    });
  });
});
