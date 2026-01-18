/**
 * Tests for /api/onboarding/complete route
 *
 * POST - Completes onboarding session and triggers CrewAI analysis
 */

// Mock NextResponse.json and constructor
jest.mock('next/server', () => {
  const MockNextResponse = class extends Response {
    constructor(body: BodyInit | null, init?: ResponseInit) {
      super(body, init);
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
    NextRequest: jest.fn(),
    NextResponse: MockNextResponse,
  };
});

// Mock Supabase clients
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockUpsert = jest.fn();
const mockInsert = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    update: mockUpdate,
    upsert: mockUpsert,
    insert: mockInsert,
  }));

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockUpsert.mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: mockSingle,
    }),
  });

  mockInsert.mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: mockSingle,
    }),
  });

  mockUpdate.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    eq: mockEq,
    select: jest.fn().mockReturnValue({
      single: mockSingle,
    }),
  });
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
        getSession: mockGetSession,
      },
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
  buildFounderValidationInputs: jest.fn(
    (briefData, projectId, userId, sessionId, transcript, userType) => ({
      entrepreneur_input: JSON.stringify(briefData),
      project_id: projectId,
      user_id: userId,
      session_id: sessionId,
      conversation_transcript: transcript,
      user_type: userType,
    })
  ),
}));

import { POST, OPTIONS } from '@/app/api/onboarding/complete/route';

function createMockRequest(body: object): Request {
  return new Request('http://localhost:3000/api/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createOptionsRequest(): Request {
  return new Request('http://localhost:3000/api/onboarding/complete', {
    method: 'OPTIONS',
  });
}

describe('POST /api/onboarding/complete', () => {
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
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });

      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {},
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_SESSION');
    });

    it('should return 401 if access token is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });

      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {},
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_SESSION');
      expect(data.error.message).toBe('Authentication token missing');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token-123' } },
      });
    });

    it('should return 400 if sessionId is missing', async () => {
      const response = await POST(
        createMockRequest({
          finalConfirmation: true,
          entrepreneurBrief: {},
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_REQUEST');
    });

    it('should return 400 if finalConfirmation is missing', async () => {
      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          entrepreneurBrief: {},
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_REQUEST');
    });
  });

  describe('session validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token-123' } },
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
          finalConfirmation: true,
          entrepreneurBrief: {},
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_SESSION');
    });

    it('should return 404 if session is already completed', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          status: 'completed',
        },
        error: null,
      });

      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {},
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_SESSION');
      expect(data.error.message).toContain('already completed');
    });

    it('should return 404 if session belongs to different user', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'different-user-456',
          status: 'active',
        },
        error: null,
      });

      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {},
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_SESSION');
    });
  });

  describe('successful completion', () => {
    const mockSession = {
      session_id: 'session-123',
      user_id: 'user-123',
      status: 'active',
      stage_data: {
        brief: {
          problem_description: 'Test problem',
          solution_description: 'Test solution',
        },
      },
      conversation_history: [{ role: 'user', content: 'Hello' }],
    };

    const mockBrief = {
      id: 'brief-123',
      session_id: 'session-123',
      overall_quality_score: 75,
    };

    const mockProject = {
      id: 'proj-123',
      name: 'Test Project',
      metadata: {},
    };

    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token-123' } },
      });

      // Chain of calls: session lookup, brief upsert, project insert, project update, session update
      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Session lookup
          return Promise.resolve({ data: mockSession, error: null });
        } else if (callCount === 2) {
          // Brief upsert
          return Promise.resolve({ data: mockBrief, error: null });
        } else if (callCount === 3) {
          // Project insert
          return Promise.resolve({ data: mockProject, error: null });
        } else {
          // Session update
          return Promise.resolve({ data: { ...mockSession, status: 'completed' }, error: null });
        }
      });

      mockKickoff.mockResolvedValue({ run_id: 'wf-123' });
    });

    it('should complete onboarding and trigger Modal workflow', async () => {
      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {
            problem_description: 'Final problem',
            solution_description: 'Final solution',
          },
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.workflowTriggered).toBe(true);
      expect(data.workflowId).toBe('wf-123');
      expect(data.projectCreated.projectId).toBe('proj-123');
      expect(data.dashboardRedirect).toBe('/project/proj-123/gate');
    });

    it('should include next steps in response', async () => {
      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {
            problem_description: 'Test problem',
            business_stage: 'idea',
          },
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.nextSteps).toBeDefined();
      expect(Array.isArray(data.nextSteps)).toBe(true);
      expect(data.nextSteps.length).toBeGreaterThan(0);
    });

    it('should save user feedback if provided', async () => {
      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {},
          userFeedback: {
            conversationRating: 5,
            clarityRating: 4,
            helpfulnessRating: 5,
            comments: 'Great experience!',
          },
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Modal kickoff failure', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token-123' } },
      });

      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              session_id: 'session-123',
              user_id: 'user-123',
              status: 'active',
              stage_data: { brief: {} },
            },
            error: null,
          });
        } else if (callCount === 2) {
          return Promise.resolve({
            data: { id: 'brief-123', overall_quality_score: 70 },
            error: null,
          });
        } else if (callCount === 3) {
          return Promise.resolve({
            data: { id: 'proj-123', name: 'Test', metadata: {} },
            error: null,
          });
        }
        return Promise.resolve({ data: {}, error: null });
      });
    });

    it('should still succeed but mark workflow not triggered', async () => {
      mockKickoff.mockRejectedValue(new Error('Modal service unavailable'));

      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {},
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.workflowTriggered).toBe(false);
      expect(data.analysisMetadata?.error).toContain('Modal service unavailable');
    });
  });

  describe('project creation failure', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token-123' } },
      });

      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              session_id: 'session-123',
              user_id: 'user-123',
              status: 'active',
              stage_data: { brief: {} },
            },
            error: null,
          });
        } else if (callCount === 2) {
          return Promise.resolve({
            data: { id: 'brief-123', overall_quality_score: 70 },
            error: null,
          });
        } else if (callCount === 3) {
          // Project insert fails
          return Promise.resolve({
            data: null,
            error: { message: 'Failed to create project' },
          });
        }
        return Promise.resolve({ data: {}, error: null });
      });
    });

    it('should return 500 if project creation fails', async () => {
      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {},
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PROJECT_CREATION_FAILED');
      expect(data.error.retryable).toBe(true);
    });
  });

  describe('brief creation failure', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token-123' } },
      });

      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              session_id: 'session-123',
              user_id: 'user-123',
              status: 'active',
              stage_data: { brief: {} },
            },
            error: null,
          });
        } else if (callCount === 2) {
          // Brief upsert fails
          return Promise.resolve({
            data: null,
            error: { message: 'Failed to create entrepreneur brief' },
          });
        }
        return Promise.resolve({ data: {}, error: null });
      });
    });

    it('should return 500 if brief creation fails', async () => {
      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {},
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('WORKFLOW_TRIGGER_FAILED');
    });
  });

  describe('quality score calculation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token-123' } },
      });
    });

    it('should calculate quality scores from brief data', async () => {
      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: {
              session_id: 'session-123',
              user_id: 'user-123',
              status: 'active',
              stage_data: {},
            },
            error: null,
          });
        } else if (callCount === 2) {
          return Promise.resolve({
            data: { id: 'brief-123', overall_quality_score: 80 },
            error: null,
          });
        } else if (callCount === 3) {
          return Promise.resolve({
            data: { id: 'proj-123', name: 'Test', metadata: {} },
            error: null,
          });
        }
        return Promise.resolve({ data: {}, error: null });
      });
      mockKickoff.mockResolvedValue({ run_id: 'wf-123' });

      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {
            problem_description: 'A detailed problem description that is more than 100 characters for high clarity scoring',
            solution_description: 'A comprehensive solution that addresses the problem effectively with many details',
            business_stage: 'validation',
            customer_segments: ['Segment A', 'Segment B'],
            budget_range: '$10,000-$50,000',
          },
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockGetUser.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const response = await POST(
        createMockRequest({
          sessionId: 'session-123',
          finalConfirmation: true,
          entrepreneurBrief: {},
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PROCESSING_ERROR');
      expect(data.error.retryable).toBe(true);
    });
  });
});

describe('OPTIONS /api/onboarding/complete', () => {
  it('should return CORS headers', async () => {
    const response = await OPTIONS(createOptionsRequest() as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
      'Content-Type, Authorization'
    );
  });
});
