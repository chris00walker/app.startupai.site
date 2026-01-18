/**
 * Tests for /api/onboarding/revise route
 *
 * POST - Reset session for revision
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
const mockRpc = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      rpc: mockRpc,
    })
  ),
}));

import { POST } from '@/app/api/onboarding/revise/route';

function createMockRequest(body: object): Request {
  return new Request('http://localhost:3000/api/onboarding/revise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/onboarding/revise', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validation', () => {
    it('should return 400 if sessionId is missing', async () => {
      const response = await POST(createMockRequest({}) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.status).toBe('error');
      expect(data.error).toBe('Missing sessionId');
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
      expect(data.status).toBe('error');
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('RPC execution', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 500 on RPC error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.status).toBe('error');
      expect(data.error).toBe('Database error');
    });

    it('should return success when session is reset', async () => {
      mockRpc.mockResolvedValue({
        data: { status: 'reset', queue_deleted: true },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('reset');
      expect(data.queueDeleted).toBe(true);
    });

    it('should return success with queueDeleted false when no queue row', async () => {
      mockRpc.mockResolvedValue({
        data: { status: 'reset', queue_deleted: false },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.queueDeleted).toBe(false);
    });

    it('should return cannot_revise when analysis in progress', async () => {
      mockRpc.mockResolvedValue({
        data: { status: 'cannot_revise', error: 'Analysis already in progress' },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.status).toBe('cannot_revise');
      expect(data.error).toBe('Analysis already in progress');
    });

    it('should return 400 on session not found', async () => {
      mockRpc.mockResolvedValue({
        data: { status: 'not_found', error: 'Session not found' },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.status).toBe('error');
      expect(data.error).toBe('Session not found');
    });

    it('should return 400 on unauthorized', async () => {
      mockRpc.mockResolvedValue({
        data: { status: 'unauthorized', error: 'Not your session' },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not your session');
    });
  });

  describe('error handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockGetUser.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.status).toBe('error');
      expect(data.error).toBe('Unexpected error');
    });
  });
});
