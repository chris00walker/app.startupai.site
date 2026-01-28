/**
 * Tests for /api/onboarding/brief route
 *
 * GET - Fetches the entrepreneur brief for a project or session
 * @story US-F01, US-H01
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
const mockSingle = jest.fn();

const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
  }));

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    eq: mockEq,
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

import { GET } from '@/app/api/onboarding/brief/route';

function createMockRequest(params?: { projectId?: string; sessionId?: string }): Request {
  const searchParams = new URLSearchParams();
  if (params?.projectId) searchParams.set('projectId', params.projectId);
  if (params?.sessionId) searchParams.set('sessionId', params.sessionId);
  const url = `http://localhost:3000/api/onboarding/brief${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  return new Request(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/onboarding/brief', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  describe('validation', () => {
    it('should return 400 if neither projectId nor sessionId provided', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const response = await GET(createMockRequest() as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('projectId or sessionId required');
    });
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = await GET(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('project lookup', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 404 if project not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const response = await GET(createMockRequest({ projectId: 'proj-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Project not found');
    });

    it('should return 404 if project has no onboarding session', async () => {
      mockSingle.mockResolvedValue({
        data: { metadata: {} },
        error: null,
      });

      const response = await GET(createMockRequest({ projectId: 'proj-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No onboarding session associated with this project');
    });
  });

  describe('brief lookup', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 404 if brief not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const response = await GET(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Brief not found');
    });

    it('should return 403 if brief belongs to different user', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'brief-123',
          session_id: 'session-123',
          user_id: 'different-user-456',
          problem_description: 'Test problem',
        },
        error: null,
      });

      const response = await GET(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('successful retrieval', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return brief by sessionId', async () => {
      const mockBrief = {
        id: 'brief-123',
        session_id: 'session-123',
        user_id: 'user-123',
        problem_description: 'Test problem',
        solution_description: 'Test solution',
        customer_segments: ['Segment A', 'Segment B'],
      };

      mockSingle.mockResolvedValue({
        data: mockBrief,
        error: null,
      });

      const response = await GET(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.brief).toEqual(mockBrief);
    });

    it('should return brief by projectId', async () => {
      const mockBrief = {
        id: 'brief-123',
        session_id: 'session-456',
        user_id: 'user-123',
        problem_description: 'Test problem',
      };

      // First call: project lookup
      mockSingle
        .mockResolvedValueOnce({
          data: { metadata: { onboardingSessionId: 'session-456' } },
          error: null,
        })
        // Second call: brief lookup
        .mockResolvedValueOnce({
          data: mockBrief,
          error: null,
        });

      const response = await GET(createMockRequest({ projectId: 'proj-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.brief.session_id).toBe('session-456');
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

      const response = await GET(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch brief');
    });
  });
});
