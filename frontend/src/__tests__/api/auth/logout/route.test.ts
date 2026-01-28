/**
 * Tests for /api/auth/logout route
 *
 * GET - Signs out user and redirects to marketing site
 * @story US-AU03
*/

// Mock NextResponse
jest.mock('next/server', () => {
  const MockNextResponse = class {
    static redirect(url: string | URL) {
      const urlString = url instanceof URL ? url.toString() : url;
      return new Response(null, {
        status: 307,
        headers: {
          Location: urlString,
        },
      });
    }

    static json(body: unknown, init?: ResponseInit) {
      return new Response(JSON.stringify(body), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init?.headers,
        },
      });
    }
  };

  return {
    NextResponse: MockNextResponse,
  };
});

// Mock Supabase client
const mockSignOut = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { signOut: mockSignOut },
    })
  ),
}));

import { GET } from '@/app/api/auth/logout/route';

function createMockRequest(): Request {
  return new Request('http://localhost:3000/api/auth/logout', {
    method: 'GET',
  });
}

describe('GET /api/auth/logout', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sign out', () => {
    it('should call supabase.auth.signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      await GET(createMockRequest());

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('redirect', () => {
    it('should redirect to login page on same origin', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const response = await GET(createMockRequest());

      expect(response.status).toBe(307);
      // Route redirects to /login on the request origin
      expect(response.headers.get('Location')).toBe('http://localhost:3000/login');
    });
  });

  describe('sign out errors', () => {
    it('should still redirect even if signOut returns error', async () => {
      mockSignOut.mockResolvedValue({ error: new Error('Sign out failed') });

      const response = await GET(createMockRequest());

      // Should still redirect (the route doesn't check for signOut errors)
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('http://localhost:3000/login');
    });
  });
});
