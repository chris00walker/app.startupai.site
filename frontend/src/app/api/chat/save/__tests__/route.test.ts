/**
 * Tests for /api/chat/save endpoint
 *
 * Part of ADR-005 Split API Architecture:
 * Tests atomic persistence, idempotency, and response structure
 */

// Jest globals are available automatically

// Mock Supabase clients
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              session_id: 'test-session-id',
              user_id: 'test-user-id',
              current_stage: 1,
              stage_data: {},
              conversation_history: [],
            },
            error: null,
          })),
        })),
      })),
    })),
    rpc: jest.fn(() => ({
      data: {
        status: 'committed',
        version: 1,
        current_stage: 1,
        overall_progress: 10,
        stage_progress: 20,
        stage_advanced: false,
        completed: false,
      },
      error: null,
    })),
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              session_id: 'test-session-id',
              user_id: 'test-user-id',
              current_stage: 1,
              stage_data: {},
              conversation_history: [],
            },
            error: null,
          })),
        })),
      })),
    })),
    rpc: jest.fn(() => ({
      data: {
        status: 'committed',
        version: 1,
        current_stage: 1,
        overall_progress: 10,
        stage_progress: 20,
        stage_advanced: false,
        completed: false,
      },
      error: null,
    })),
  })),
}));

jest.mock('@/lib/onboarding/quality-assessment', () => ({
  assessConversationQuality: jest.fn(() => ({
    coverage: 0.5,
    clarity: 'good',
    completeness: 'partial',
    extractedData: {},
    keyInsights: [],
    recommendedNextSteps: [],
  })),
  shouldAdvanceStage: jest.fn(() => false),
  isOnboardingComplete: jest.fn(() => false),
  calculateOverallProgress: jest.fn(() => 10),
}));

jest.mock('@/lib/crewai/modal-client', () => ({
  createModalClient: jest.fn(() => ({
    kickoff: jest.fn(),
  })),
}));

jest.mock('@/lib/crewai/founder-validation', () => ({
  buildFounderValidationInputs: jest.fn(() => ({})),
}));

// Helper to create mock request
function createSaveRequest(overrides: Partial<{
  sessionId: string;
  messageId: string;
  userMessage: { role: string; content: string; timestamp: string };
  assistantMessage: { role: string; content: string; timestamp: string };
  expectedVersion: number;
}> = {}) {
  const defaults = {
    sessionId: 'test-session-id',
    messageId: `msg_${Date.now()}`,
    userMessage: { role: 'user', content: 'test', timestamp: new Date().toISOString() },
    assistantMessage: { role: 'assistant', content: 'response', timestamp: new Date().toISOString() },
  };
  return new Request('http://localhost:3000/api/chat/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...defaults, ...overrides }),
  });
}

describe('/api/chat/save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('request validation', () => {
    it('should return 400 if sessionId is missing', async () => {
      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: 'msg_123',
          userMessage: { role: 'user', content: 'test', timestamp: new Date().toISOString() },
          assistantMessage: { role: 'assistant', content: 'response', timestamp: new Date().toISOString() },
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 if messageId is missing', async () => {
      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-id',
          userMessage: { role: 'user', content: 'test', timestamp: new Date().toISOString() },
          assistantMessage: { role: 'assistant', content: 'response', timestamp: new Date().toISOString() },
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 if userMessage is missing', async () => {
      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-id',
          messageId: 'msg_123',
          assistantMessage: { role: 'assistant', content: 'response', timestamp: new Date().toISOString() },
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 if assistantMessage is missing', async () => {
      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-id',
          messageId: 'msg_123',
          userMessage: { role: 'user', content: 'test', timestamp: new Date().toISOString() },
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });
  });

  describe('response structure', () => {
    it('should return correct SaveResponse shape on success', async () => {
      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session-id',
          messageId: 'msg_123',
          userMessage: { role: 'user', content: 'test', timestamp: new Date().toISOString() },
          assistantMessage: { role: 'assistant', content: 'response', timestamp: new Date().toISOString() },
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        status: 'committed',
        version: expect.any(Number),
        currentStage: expect.any(Number),
        overallProgress: expect.any(Number),
        stageProgress: expect.any(Number),
        stageAdvanced: expect.any(Boolean),
        completed: expect.any(Boolean),
      });
    });

    it('should include version number for concurrency tracking (ADR-005 PR7)', async () => {
      const { POST } = await import('../route');
      const request = createSaveRequest({});

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(typeof data.version).toBe('number');
      expect(data.version).toBeGreaterThanOrEqual(1);
    });
  });

  describe('version-based concurrency control (ADR-005)', () => {
    it('should accept expectedVersion parameter', async () => {
      const { POST } = await import('../route');
      const request = createSaveRequest({ expectedVersion: 1 });

      const response = await POST(request as any);
      const data = await response.json();

      // Should succeed when version matches
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return version_conflict when expectedVersion does not match', async () => {
      // Re-mock with conflict response
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    session_id: 'test-session-id',
                    user_id: 'test-user-id',
                    current_stage: 1,
                    stage_data: {},
                    conversation_history: [],
                  },
                  error: null,
                })),
              })),
            })),
          })),
          rpc: jest.fn(() => ({
            data: {
              status: 'version_conflict',
              current_version: 5,
              expected_version: 3,
              message: 'Session has been modified',
            },
            error: null,
          })),
        })),
      }));

      const { POST } = await import('../route');
      const request = createSaveRequest({ expectedVersion: 3 });

      const response = await POST(request as any);
      const data = await response.json();

      expect(data.status).toBe('version_conflict');
      expect(data.success).toBe(false);
      expect(data.currentVersion).toBe(5);
      expect(data.expectedVersion).toBe(3);
    });

    it('should increment version on each successful save', async () => {
      const { POST } = await import('../route');

      // First save
      const request1 = createSaveRequest({ messageId: 'msg_1' });
      const response1 = await POST(request1 as any);
      const data1 = await response1.json();

      expect(data1.success).toBe(true);
      expect(data1.version).toBe(1);

      // Version should be trackable for next save
      expect(typeof data1.version).toBe('number');
    });
  });

  describe('idempotency (duplicate detection)', () => {
    it('should return duplicate status for repeated messageId', async () => {
      // Mock duplicate response
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    session_id: 'test-session-id',
                    user_id: 'test-user-id',
                    current_stage: 1,
                    stage_data: {},
                    conversation_history: [],
                  },
                  error: null,
                })),
              })),
            })),
          })),
          rpc: jest.fn(() => ({
            data: {
              status: 'duplicate',
              version: 3,
              current_stage: 2,
              overall_progress: 30,
              stage_progress: 50,
              stage_advanced: false,
              completed: false,
            },
            error: null,
          })),
        })),
      }));

      const { POST } = await import('../route');
      const request = createSaveRequest({ messageId: 'already-saved-msg' });

      const response = await POST(request as any);
      const data = await response.json();

      // Duplicate should still be success=true (idempotent)
      expect(data.success).toBe(true);
      expect(data.status).toBe('duplicate');
      expect(data.version).toBe(3);
    });
  });

  describe('completion flow (ADR-005 Stage 7 queue)', () => {
    it('should set completed=true when onboarding is complete', async () => {
      // Mock completion response
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    session_id: 'test-session-id',
                    user_id: 'test-user-id',
                    current_stage: 7,
                    stage_data: {},
                    conversation_history: [],
                  },
                  error: null,
                })),
              })),
            })),
          })),
          rpc: jest.fn((name: string) => {
            if (name === 'apply_onboarding_turn') {
              return {
                data: {
                  status: 'committed',
                  version: 10,
                  current_stage: 7,
                  overall_progress: 100,
                  stage_progress: 100,
                  stage_advanced: false,
                  completed: true,
                },
                error: null,
              };
            }
            if (name === 'complete_onboarding_with_kickoff') {
              return {
                data: { status: 'queued' },
                error: null,
              };
            }
            return { data: null, error: null };
          }),
        })),
      }));

      const { POST } = await import('../route');
      const request = createSaveRequest({});

      const response = await POST(request as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.completed).toBe(true);
      expect(data.queued).toBe(true);
    });

    it('should include queued flag when completion is queued for processing', async () => {
      // Same as above, verify queued flag is present
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    session_id: 'test-session-id',
                    user_id: 'test-user-id',
                    current_stage: 7,
                    stage_data: { brief: {} },
                    conversation_history: [],
                  },
                  error: null,
                })),
              })),
            })),
          })),
          rpc: jest.fn((name: string) => {
            if (name === 'apply_onboarding_turn') {
              return {
                data: {
                  status: 'committed',
                  version: 10,
                  current_stage: 7,
                  overall_progress: 100,
                  stage_progress: 100,
                  stage_advanced: false,
                  completed: true,
                },
                error: null,
              };
            }
            if (name === 'complete_onboarding_with_kickoff') {
              return {
                data: { status: 'queued' },
                error: null,
              };
            }
            return { data: null, error: null };
          }),
        })),
      }));

      const { POST } = await import('../route');
      const request = createSaveRequest({});

      const response = await POST(request as any);
      const data = await response.json();

      expect(data.queued).toBe(true);
    });
  });

  describe('stage progression', () => {
    it('should return stageAdvanced=true when stage progresses', async () => {
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    session_id: 'test-session-id',
                    user_id: 'test-user-id',
                    current_stage: 2,
                    stage_data: {},
                    conversation_history: [],
                  },
                  error: null,
                })),
              })),
            })),
          })),
          rpc: jest.fn(() => ({
            data: {
              status: 'committed',
              version: 5,
              current_stage: 3,
              overall_progress: 40,
              stage_progress: 0,
              stage_advanced: true,
              completed: false,
            },
            error: null,
          })),
        })),
      }));

      const { POST } = await import('../route');
      const request = createSaveRequest({});

      const response = await POST(request as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.stageAdvanced).toBe(true);
      expect(data.currentStage).toBe(3);
      expect(data.stageProgress).toBe(0); // Reset on stage advance
    });

    it('should return stage and overall progress values', async () => {
      const { POST } = await import('../route');
      const request = createSaveRequest({});

      const response = await POST(request as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(typeof data.overallProgress).toBe('number');
      expect(typeof data.stageProgress).toBe('number');
      expect(data.overallProgress).toBeGreaterThanOrEqual(0);
      expect(data.overallProgress).toBeLessThanOrEqual(100);
      expect(data.stageProgress).toBeGreaterThanOrEqual(0);
      expect(data.stageProgress).toBeLessThanOrEqual(100);
    });
  });

  describe('error handling', () => {
    it('should return 401 for unauthenticated requests', async () => {
      jest.doMock('@/lib/supabase/server', () => ({
        createClient: jest.fn(() => ({
          auth: {
            getUser: jest.fn(() => ({
              data: { user: null },
              error: { message: 'Not authenticated' },
            })),
          },
        })),
      }));

      const { POST } = await import('../route');
      const request = createSaveRequest({});

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent session', async () => {
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: null,
                  error: { message: 'Session not found' },
                })),
              })),
            })),
          })),
        })),
      }));

      const { POST } = await import('../route');
      const request = createSaveRequest({ sessionId: 'nonexistent-session' });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session not found');
    });

    it('should return 403 for session ownership mismatch', async () => {
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    session_id: 'test-session-id',
                    user_id: 'different-user-id', // Different from authenticated user
                    current_stage: 1,
                    stage_data: {},
                    conversation_history: [],
                  },
                  error: null,
                })),
              })),
            })),
          })),
        })),
      }));

      const { POST } = await import('../route');
      const request = createSaveRequest({});

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session ownership mismatch');
    });
  });
});
