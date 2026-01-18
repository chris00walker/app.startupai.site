/**
 * Tests for /api/onboarding/status route
 *
 * GET - Returns the current state of an onboarding session
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
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockSingle = jest.fn();

const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
  }));

  mockSelect.mockReturnValue({
    eq: mockEq,
    in: mockIn,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    in: mockIn,
    eq: mockEq,
    order: mockOrder,
  });

  mockIn.mockReturnValue({
    order: mockOrder,
  });

  mockOrder.mockReturnValue({
    limit: mockLimit,
  });

  mockLimit.mockReturnValue({
    single: mockSingle,
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

import { GET } from '@/app/api/onboarding/status/route';

function createMockRequest(sessionId?: string): Request {
  const url = sessionId
    ? `http://localhost:3000/api/onboarding/status?sessionId=${sessionId}`
    : 'http://localhost:3000/api/onboarding/status';
  return new Request(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/onboarding/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = await GET(createMockRequest() as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('specific session lookup', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 404 if specific session not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const response = await GET(createMockRequest('non-existent-session') as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });

    it('should return session data when found by sessionId', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'onb_12345',
          current_stage: 3,
          overall_progress: 45,
          stage_progress: 60,
          status: 'active',
          conversation_history: [{ role: 'assistant', content: 'Hello' }, { role: 'user', content: 'Hi' }],
          last_activity: '2026-01-18T10:00:00Z',
          stage_data: {},
        },
        error: null,
      });

      const response = await GET(createMockRequest('onb_12345') as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe('onb_12345');
      expect(data.currentStage).toBe(3);
      expect(data.totalStages).toBe(7);
      expect(data.overallProgress).toBe(45);
      expect(data.stageProgress).toBe(60);
      expect(data.messageCount).toBe(2);
      expect(data.status).toBe('active');
    });
  });

  describe('auto-find session', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return null sessionId when no active session exists', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const response = await GET(createMockRequest() as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeNull();
      expect(data.status).toBeNull();
    });

    it('should return most recent active/paused session', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'onb_recent',
          current_stage: 5,
          overall_progress: 70,
          stage_progress: 50,
          status: 'paused',
          conversation_history: [],
          last_activity: '2026-01-18T12:00:00Z',
          stage_data: {},
        },
        error: null,
      });

      const response = await GET(createMockRequest() as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe('onb_recent');
      expect(data.currentStage).toBe(5);
      expect(data.status).toBe('paused');
    });
  });

  describe('completed session with completion data', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should include completion data for completed sessions', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'onb_completed',
          current_stage: 7,
          overall_progress: 100,
          stage_progress: 100,
          status: 'completed',
          conversation_history: [],
          last_activity: '2026-01-18T14:00:00Z',
          stage_data: {
            completion: {
              projectId: 'proj-123',
              briefId: 'brief-456',
            },
          },
        },
        error: null,
      });

      const response = await GET(createMockRequest('onb_completed') as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('completed');
      expect(data.completion).toBeDefined();
      expect(data.completion.projectId).toBe('proj-123');
    });
  });

  describe('default values', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should use default values for null fields', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'onb_minimal',
          current_stage: null,
          overall_progress: null,
          stage_progress: null,
          status: null,
          conversation_history: null,
          last_activity: null,
          stage_data: null,
        },
        error: null,
      });

      const response = await GET(createMockRequest('onb_minimal') as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.currentStage).toBe(1);
      expect(data.overallProgress).toBe(0);
      expect(data.stageProgress).toBe(0);
      expect(data.messageCount).toBe(0);
      expect(data.status).toBe('active');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 500 on unexpected error', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await GET(createMockRequest('onb_12345') as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch session status');
    });
  });
});
