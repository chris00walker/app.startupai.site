/**
 * Tests for POST /api/onboarding/abandon endpoint
 *
 * This endpoint marks an onboarding session as abandoned,
 * allowing users to start fresh conversations.
 */

// Mock NextResponse.json since it doesn't work in Jest's Node.js environment
jest.mock('next/server', () => {
  return {
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
  };
});

// Mock Supabase clients
const mockGetUser = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const mockFrom = jest.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

mockSelect.mockReturnValue({
  eq: mockEq,
});

mockEq.mockReturnValue({
  single: mockSingle,
});

mockUpdate.mockReturnValue({
  eq: jest.fn().mockResolvedValue({ error: null }),
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    })
  ),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Import after mocks are set up
import { POST } from '@/app/api/onboarding/abandon/route';

// Helper to create mock Request with body
function createMockRequest(body: object): Request {
  return new Request('http://localhost:3000/api/onboarding/abandon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/onboarding/abandon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock chain
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('validation', () => {
    it('should return 400 if sessionId is missing', async () => {
      const req = createMockRequest({});

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session ID required');
    });

    it('should return 400 if sessionId is empty string', async () => {
      const req = createMockRequest({ sessionId: '' });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const req = createMockRequest({ sessionId: 'onb_12345' });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('session validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });
    });

    it('should return 404 if session not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const req = createMockRequest({ sessionId: 'onb_nonexistent' });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session not found');
    });

    it('should return 403 if session belongs to different user', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'onb_12345',
          user_id: 'different-user-456',
          status: 'active',
        },
        error: null,
      });

      const req = createMockRequest({ sessionId: 'onb_12345' });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session does not belong to user');
    });

    it('should return 400 if session is already completed', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'onb_12345',
          user_id: 'user-123',
          status: 'completed',
        },
        error: null,
      });

      const req = createMockRequest({ sessionId: 'onb_12345' });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Cannot abandon completed session');
    });
  });

  describe('successful abandonment', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });
    });

    it('should return 200 and mark active session as abandoned', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'onb_12345',
          user_id: 'user-123',
          status: 'active',
        },
        error: null,
      });

      const req = createMockRequest({ sessionId: 'onb_12345' });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Session abandoned successfully');

      // Verify update was called
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should return 200 for paused session', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'onb_12345',
          user_id: 'user-123',
          status: 'paused',
        },
        error: null,
      });

      const req = createMockRequest({ sessionId: 'onb_12345' });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('development mode test sessions', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      (process.env as { NODE_ENV: string }).NODE_ENV = 'development';
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });
    });

    afterEach(() => {
      (process.env as { NODE_ENV: string | undefined }).NODE_ENV = originalEnv;
    });

    it('should allow test sessions in development mode', async () => {
      const req = createMockRequest({ sessionId: 'test-session-123' });

      const response = await POST(req as any);
      const data = await response.json();

      // Test sessions in dev mode should succeed without auth
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should allow demo sessions in development mode', async () => {
      const req = createMockRequest({ sessionId: 'demo-onboarding-abc' });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
