/**
 * Tests for /api/onboarding/recover route
 *
 * POST - Manually triggers CrewAI analysis for stuck sessions
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
const mockRpc = jest.fn();

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
    rpc: mockRpc,
  })),
}));

// Mock Modal client
const mockKickoff = jest.fn();
jest.mock('@/lib/crewai/modal-client', () => ({
  createModalClient: jest.fn(() => ({
    kickoff: mockKickoff,
  })),
}));

// Mock founder validation inputs builder
jest.mock('@/lib/crewai/founder-validation', () => ({
  buildFounderValidationInputs: jest.fn(() => ({
    entrepreneur_input: 'Test input',
    project_id: 'proj-123',
    user_id: 'user-123',
    session_id: 'session-123',
  })),
}));

import { POST } from '@/app/api/onboarding/recover/route';

function createMockRequest(body: object): Request {
  return new Request('http://localhost:3000/api/onboarding/recover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/onboarding/recover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  describe('validation', () => {
    it('should return 400 if sessionId is missing', async () => {
      const response = await POST(createMockRequest({}) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('sessionId required');
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
          stage_data: { brief: {} },
        },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Not authorized for this session');
    });
  });

  describe('data validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 400 if no brief data in session', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          stage_data: {},
        },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Insufficient data to recover');
      expect(data.canRecover).toBe(false);
    });

    it('should return 400 if stage_data is null', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          stage_data: null,
        },
        error: null,
      });

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Insufficient data to recover');
    });
  });

  describe('project creation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          current_stage: 7,
          overall_progress: 95,
          stage_data: {
            brief: {
              problem_description: 'Test problem',
              solution_description: 'Test solution',
            },
          },
        },
        error: null,
      });
    });

    it('should return 500 if project creation fails', async () => {
      mockRpc
        .mockResolvedValueOnce({ data: null, error: null }) // upsert_entrepreneur_brief
        .mockResolvedValueOnce({ data: null, error: { message: 'Project creation failed' } }); // create_project_from_onboarding

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create project');
    });
  });

  describe('successful recovery', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          current_stage: 7,
          overall_progress: 95,
          stage_data: {
            brief: {
              problem_description: 'Test problem',
              solution_description: 'Test solution',
            },
          },
        },
        error: null,
      });
      mockRpc
        .mockResolvedValueOnce({ data: { id: 'brief-123' }, error: null }) // upsert_entrepreneur_brief
        .mockResolvedValueOnce({ data: 'proj-123', error: null }); // create_project_from_onboarding
      mockKickoff.mockResolvedValue({ run_id: 'wf-123' });
    });

    it('should recover session and return success', async () => {
      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.projectId).toBe('proj-123');
      expect(data.workflowId).toBe('wf-123');
      expect(data.message).toContain('recovered successfully');
    });
  });

  describe('Modal kickoff failure', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          stage_data: {
            brief: { problem_description: 'Test' },
          },
        },
        error: null,
      });
      mockRpc
        .mockResolvedValueOnce({ data: { id: 'brief-123' }, error: null })
        .mockResolvedValueOnce({ data: 'proj-123', error: null });
    });

    it('should return 500 if Modal kickoff fails', async () => {
      mockKickoff.mockRejectedValue(new Error('Modal service unavailable'));

      const response = await POST(createMockRequest({ sessionId: 'session-123' }) as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to start analysis');
      expect(data.projectId).toBe('proj-123'); // Should still return projectId
    });
  });
});
