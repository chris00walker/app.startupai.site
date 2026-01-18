/**
 * Tests for /api/onboarding/pause route
 *
 * POST - Pauses an onboarding session
 */

// Mock NextResponse.json
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => {
      return new Response(JSON.stringify(body), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init?.headers,
        },
      });
    },
  },
}));

// Mock Supabase clients
const mockGetUser = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    update: mockUpdate,
  }));

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    eq: mockEq,
  });

  mockUpdate.mockReturnValue({
    eq: jest.fn().mockResolvedValue({ error: null }),
  });
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

import { POST } from '@/app/api/onboarding/pause/route';

function createMockRequest(body: object): Request {
  return new Request('http://localhost:3000/api/onboarding/pause', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/onboarding/pause', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  describe('validation', () => {
    it('should return 400 if sessionId is missing', async () => {
      const response = await POST(createMockRequest({}) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session ID required');
    });
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('session lookup', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 404 if session not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const response = await POST(createMockRequest({ sessionId: 'non-existent' }) as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session not found');
    });
  });

  describe('authorization', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 403 if session belongs to different user', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'different-user-456',
          status: 'active',
        },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session does not belong to user');
    });
  });

  describe('status validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 400 if session is completed', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          status: 'completed',
        },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Cannot pause completed session');
    });

    it('should return 400 if session is abandoned', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          status: 'abandoned',
        },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Cannot pause abandoned session');
    });

    it('should return success if session is already paused (idempotent)', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          status: 'paused',
        },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Session already paused');
    });
  });

  describe('successful pause', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          status: 'active',
        },
        error: null,
      });
    });

    it('should pause session and return 200', async () => {
      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Session paused successfully');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          status: 'active',
        },
        error: null,
      });
    });

    it('should return 500 on update error', async () => {
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to pause session');
    });
  });
});
