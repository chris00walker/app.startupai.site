/**
 * Tests for /api/consultant/onboarding/complete route
 *
 * POST - Completes consultant onboarding and creates profile
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
const mockUpsert = jest.fn();
const mockUpdate = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    upsert: mockUpsert,
    update: mockUpdate,
  }));

  // select().eq().single() chain
  mockSelect.mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: mockSingle,
    }),
  });

  // upsert().select().single() chain
  mockUpsert.mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: mockSingle,
    }),
  });

  // update().eq() chain
  mockUpdate.mockReturnValue({
    eq: jest.fn().mockResolvedValue({ error: null }),
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
    project_id: 'session-123',
    user_id: 'user-123',
    session_id: 'session-123',
    conversation_transcript: '[]',
    user_type: 'consultant',
  })),
}));

import { POST } from '@/app/api/consultant/onboarding/complete/route';

function createMockRequest(body: object): Request {
  return new Request('http://localhost:3000/api/consultant/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/consultant/onboarding/complete', () => {
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
          sessionId: 'session-123',
          userId: 'user-123',
          messages: [],
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
          sessionId: 'session-123',
          userId: 'different-user-456',
          messages: [],
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
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

      const response = await POST(
        createMockRequest({
          sessionId: 'non-existent',
          userId: 'user-123',
          messages: [],
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });
  });

  describe('successful completion', () => {
    const mockSession = {
      session_id: 'session-123',
      user_id: 'user-123',
      practice_info: { company_name: 'Test Consulting' },
      industries: ['Technology'],
      services: ['Strategy'],
      tools_used: ['Slack'],
      pain_points: ['Managing clients'],
      goals: { white_label_interest: true },
      client_management: { client_count: 10 },
      conversation_history: [],
      ai_context: {},
    };

    const mockProfile = {
      id: 'user-123',
      company_name: 'Test Consulting',
      onboarding_completed: true,
    };

    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Chain: session lookup, user_profiles upsert, consultant_profiles upsert, session update, user_profiles update
      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Session lookup
          return Promise.resolve({ data: mockSession, error: null });
        } else if (callCount === 2) {
          // Consultant profile upsert
          return Promise.resolve({ data: mockProfile, error: null });
        }
        return Promise.resolve({ data: {}, error: null });
      });

      // Mock other operations
      mockEq.mockResolvedValue({ error: null });
      mockKickoff.mockResolvedValue({ run_id: 'wf-123' });
    });

    it('should complete onboarding and create profile', async () => {
      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          userId: 'user-123',
          messages: [],
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile).toEqual(mockProfile);
    });

    it('should trigger Modal workflow on completion', async () => {
      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          userId: 'user-123',
          messages: [],
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflowTriggered).toBe(true);
      expect(data.workflowId).toBe('wf-123');
    });

    it('should still succeed if Modal kickoff fails', async () => {
      mockKickoff.mockRejectedValue(new Error('Modal unavailable'));

      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          userId: 'user-123',
          messages: [],
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.workflowTriggered).toBe(false);
      expect(data.modalError).toContain('Modal unavailable');
    });
  });

  describe('profile save failure', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              session_id: 'session-123',
              user_id: 'user-123',
              practice_info: {},
            },
            error: null,
          });
        } else if (callCount === 2) {
          return Promise.resolve({
            data: null,
            error: { message: 'Database error' },
          });
        }
        return Promise.resolve({ data: {}, error: null });
      });
    });

    it('should return 500 if profile save fails', async () => {
      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          userId: 'user-123',
          messages: [],
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save profile');
    });
  });

  describe('error handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockGetUser.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          userId: 'user-123',
          messages: [],
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
