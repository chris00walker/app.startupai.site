/**
 * Tests for /api/consultant/onboarding/start route
 *
 * POST - Starts or resumes consultant onboarding session
 * @story US-C01
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
const mockInsert = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();

const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    insert: mockInsert,
  }));

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    in: mockIn,
    eq: mockEq,
  });

  mockIn.mockReturnValue({
    order: mockOrder,
  });

  mockOrder.mockReturnValue({
    limit: mockLimit,
  });

  mockInsert.mockResolvedValue({ error: null });
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

import { POST } from '@/app/api/consultant/onboarding/start/route';

function createMockRequest(body: object): Request {
  return new Request('http://localhost:3000/api/consultant/onboarding/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/consultant/onboarding/start', () => {
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

      const response = await POST(
        createMockRequest({
          userId: 'user-123',
          userEmail: 'test@example.com',
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if userId does not match', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const response = await POST(
        createMockRequest({
          userId: 'different-user-456',
          userEmail: 'test@example.com',
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('resume existing session', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should resume existing active session', async () => {
      const existingSession = {
        session_id: 'consultant-user-123-existing',
        user_id: 'user-123',
        current_stage: 3,
        overall_progress: 40,
        stage_progress: 50,
        conversation_history: [{ role: 'assistant', content: 'Hello!' }],
      };

      mockLimit.mockResolvedValue({
        data: [existingSession],
        error: null,
      });

      const response = await POST(
        createMockRequest({
          userId: 'user-123',
          userEmail: 'test@example.com',
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resuming).toBe(true);
      expect(data.sessionId).toBe('consultant-user-123-existing');
      expect(data.stageInfo.currentStage).toBe(3);
      expect(data.conversationHistory).toEqual(existingSession.conversation_history);
    });
  });

  describe('create new session', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });
    });

    it('should create new session when none exists', async () => {
      const response = await POST(
        createMockRequest({
          userId: 'user-123',
          userEmail: 'test@example.com',
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resuming).toBe(false);
      expect(data.sessionId).toMatch(/^consultant-user-123-/);
      expect(data.stageInfo.currentStage).toBe(1);
      expect(data.stageInfo.totalStages).toBe(7);
      expect(data.agentIntroduction).toContain('Maya');
      expect(data.firstQuestion).toBeDefined();
    });

    it('should return conversation context for new session', async () => {
      const response = await POST(
        createMockRequest({
          userId: 'user-123',
          userEmail: 'test@example.com',
        }) as any
      );
      const data = await response.json();

      expect(data.conversationContext).toBeDefined();
      expect(data.conversationContext.agentPersonality.name).toBe('Maya');
      expect(data.conversationContext.userRole).toBe('consultant');
      expect(data.conversationContext.planType).toBe('consultant');
    });

    it('should return 500 if session creation fails', async () => {
      mockInsert.mockResolvedValue({
        error: { message: 'Database error' },
      });

      const response = await POST(
        createMockRequest({
          userId: 'user-123',
          userEmail: 'test@example.com',
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create session');
    });
  });

  describe('error handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockGetUser.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await POST(
        createMockRequest({
          userId: 'user-123',
          userEmail: 'test@example.com',
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
