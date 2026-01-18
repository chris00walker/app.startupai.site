/**
 * Tests for /api/consultant/onboarding/status route
 *
 * GET - Gets consultant onboarding session status
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

import { GET } from '@/app/api/consultant/onboarding/status/route';

function createMockRequest(sessionId?: string): any {
  const url = sessionId
    ? `http://localhost:3000/api/consultant/onboarding/status?sessionId=${sessionId}`
    : 'http://localhost:3000/api/consultant/onboarding/status';

  // Create a mock NextRequest with nextUrl property
  const urlObj = new URL(url);
  return {
    method: 'GET',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    nextUrl: urlObj,
  };
}

describe('GET /api/consultant/onboarding/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  describe('validation', () => {
    it('should return 400 if sessionId is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const response = await GET(createMockRequest() as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Session ID required');
    });
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = await GET(createMockRequest('session-123') as any);
      const data = await response.json();

      expect(response.status).toBe(401);
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

      const response = await GET(createMockRequest('non-existent') as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });
  });

  describe('successful status retrieval', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return session status', async () => {
      mockSingle.mockResolvedValue({
        data: {
          current_stage: 3,
          overall_progress: 45,
          stage_progress: 60,
          status: 'active',
          stage_data: { brief: { company_name: 'Test Co' } },
        },
        error: null,
      });

      const response = await GET(createMockRequest('session-123') as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.currentStage).toBe(3);
      expect(data.overallProgress).toBe(45);
      expect(data.stageProgress).toBe(60);
      expect(data.status).toBe('active');
      expect(data.completed).toBe(false);
    });

    it('should detect completed session from status field', async () => {
      mockSingle.mockResolvedValue({
        data: {
          current_stage: 7,
          overall_progress: 100,
          stage_progress: 100,
          status: 'completed',
          stage_data: { brief: {} },
        },
        error: null,
      });

      const response = await GET(createMockRequest('session-123') as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completed).toBe(true);
    });

    it('should detect completed session from stage_data.completion', async () => {
      mockSingle.mockResolvedValue({
        data: {
          current_stage: 7,
          overall_progress: 100,
          stage_progress: 100,
          status: 'active',
          stage_data: {
            brief: {},
            completion: { readinessScore: 85 },
          },
        },
        error: null,
      });

      const response = await GET(createMockRequest('session-123') as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completed).toBe(true);
    });

    it('should return briefData for sidebar tracking', async () => {
      mockSingle.mockResolvedValue({
        data: {
          current_stage: 2,
          overall_progress: 20,
          stage_progress: 30,
          status: 'active',
          stage_data: {
            brief: {
              company_name: 'Consulting Co',
              industries: ['Tech', 'Finance'],
            },
          },
        },
        error: null,
      });

      const response = await GET(createMockRequest('session-123') as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.briefData).toEqual({
        company_name: 'Consulting Co',
        industries: ['Tech', 'Finance'],
      });
    });
  });

  describe('error handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockGetUser.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await GET(createMockRequest('session-123') as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
