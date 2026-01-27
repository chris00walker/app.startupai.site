/**
 * Auth Hooks Tests
 *
 * Tests for the authentication hooks including:
 * - useUser: Current user state
 * - useSession: Current session state
 * - useAuth: Combined auth state
 * - useRoleInfo: Role-based permissions
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useUser, useSession, useAuth, useRoleInfo } from '@/lib/auth/hooks';

// Mock user and session
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: { role: 'founder' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
};

const mockSession = {
  user: mockUser,
  access_token: 'test-token',
  refresh_token: 'test-refresh',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
};

// Mock Supabase client
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  }),
}));

describe('useUser', () => {
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    });
  });

  it('should fetch user on mount', async () => {
    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetUser).toHaveBeenCalled();
    expect(result.current.user).toMatchObject({
      id: 'user-123',
      email: 'test@example.com',
    });
  });

  it('should handle no user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it('should update on auth state change', async () => {
    let authCallback: ((event: string, session: any) => void) | null = null;

    mockOnAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      };
    });

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate sign out
    act(() => {
      authCallback?.('SIGNED_OUT', null);
    });

    expect(result.current.user).toBeNull();

    // Simulate sign in
    act(() => {
      authCallback?.('SIGNED_IN', mockSession);
    });

    expect(result.current.user).toMatchObject({ id: 'user-123' });
  });

  it('should unsubscribe on unmount', async () => {
    const { unmount } = renderHook(() => useUser());

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

describe('useSession', () => {
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    });
  });

  it('should fetch session on mount', async () => {
    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetSession).toHaveBeenCalled();
    expect(result.current.session).toBeDefined();
    expect(result.current.session?.access_token).toBe('test-token');
  });

  it('should handle no session', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toBeNull();
  });

  it('should update on auth state change', async () => {
    let authCallback: ((event: string, session: any) => void) | null = null;

    mockOnAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      };
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate session refresh
    const newSession = { ...mockSession, access_token: 'new-token' };
    act(() => {
      authCallback?.('TOKEN_REFRESHED', newSession);
    });

    expect(result.current.session?.access_token).toBe('new-token');
  });
});

describe('useAuth', () => {
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    });
  });

  it('should return combined auth state', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.session).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should return isAuthenticated false when no user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should combine loading states', async () => {
    // Create a delayed response for user
    let resolveUser: () => void;
    const userPromise = new Promise<void>((resolve) => {
      resolveUser = resolve;
    });

    mockGetUser.mockImplementation(async () => {
      await userPromise;
      return { data: { user: mockUser }, error: null };
    });

    const { result } = renderHook(() => useAuth());

    // Should be loading initially
    expect(result.current.loading).toBe(true);

    // Resolve user fetch
    await act(async () => {
      resolveUser!();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

describe('useRoleInfo', () => {
  let mockUnsubscribe: jest.Mock;

  const mockProfile = {
    role: 'founder',
    plan_status: 'active',
    subscription_status: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: mockProfile, error: null }),
        }),
      }),
    });

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    });
  });

  it('should resolve role from profile', async () => {
    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.role).toBe('founder');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should return planStatus', async () => {
    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.planStatus).toBe('active');
  });

  it('should return canAccessFounder for founder role', async () => {
    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.canAccessFounder).toBe(true);
    expect(result.current.canAccessConsultant).toBe(false);
  });

  it('should return canAccessConsultant for consultant role', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { role: 'consultant', plan_status: 'active' },
              error: null,
            }),
        }),
      }),
    });

    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.canAccessConsultant).toBe(true);
    expect(result.current.canAccessFounder).toBe(false);
  });

  it('should return both permissions for admin role', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { role: 'admin', plan_status: 'active' },
              error: null,
            }),
        }),
      }),
    });

    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.canAccessFounder).toBe(true);
    expect(result.current.canAccessConsultant).toBe(true);
  });

  it('should return trialReadonly for trialing status', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { role: 'trial', plan_status: 'trialing' },
              error: null,
            }),
        }),
      }),
    });

    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.trialReadonly).toBe(true);
    expect(result.current.isTrial).toBe(true);
  });

  it('should not be trialReadonly for active status', async () => {
    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.trialReadonly).toBe(false);
  });

  it('should handle no user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.role).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
  });

  it('should handle no profile', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should fall back to app_metadata role
    expect(result.current.role).toBe('founder');
  });

  it('should derive role from app_metadata when profile role is missing', async () => {
    const userWithAppRole = {
      ...mockUser,
      app_metadata: { role: 'consultant' },
    };

    mockGetUser.mockResolvedValue({
      data: { user: userWithAppRole },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { role: null, plan_status: 'active' },
              error: null,
            }),
        }),
      }),
    });

    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.role).toBe('consultant');
  });

  it('should return trial for invalid role', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { role: 'invalid_role', plan_status: 'active' },
              error: null,
            }),
        }),
      }),
    });

    const userNoRole = {
      ...mockUser,
      app_metadata: {},
    };

    mockGetUser.mockResolvedValue({
      data: { user: userNoRole },
      error: null,
    });

    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Default role when none specified is 'founder_trial'
    expect(result.current.role).toBe('founder_trial');
  });

  it('should include userId', async () => {
    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.userId).toBe('user-123');
  });

  it('should subscribe to auth state changes', async () => {
    const { result } = renderHook(() => useRoleInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify onAuthStateChange was called (hook subscribes to auth changes)
    expect(mockOnAuthStateChange).toHaveBeenCalled();
    expect(result.current.role).toBe('founder');
  });
});
