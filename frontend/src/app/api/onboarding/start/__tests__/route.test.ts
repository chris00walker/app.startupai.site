/**
 * Tests for /api/onboarding/start endpoint
 *
 * Part of ADR-005 Split API Architecture:
 * Tests session creation, resumption, and version/status inclusion in resume response
 */

// Jest globals are available automatically

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      })),
      getSession: jest.fn(() => ({
        data: { session: { access_token: 'test-token' } },
        error: null,
      })),
    },
  })),
}));

// Mock Supabase admin client - this will be overridden in individual tests
jest.mock('@/lib/supabase/admin', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === 'onboarding_sessions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              in: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(() => ({
                    // Default: no existing sessions
                    data: [],
                    error: null,
                  })),
                })),
              })),
              gte: jest.fn(() => ({
                // Plan limits check - return empty sessions
                data: [],
                error: null,
              })),
            })),
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  session_id: 'onb_test_session',
                  user_id: 'test-user-id',
                  current_stage: 1,
                },
                error: null,
              })),
            })),
          })),
        };
      }
      return { select: jest.fn() };
    }),
  })),
}));

// Mock env
jest.mock('@/lib/env', () => ({
  BYPASS_LIMITS: true,
}));

describe('/api/onboarding/start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('new session creation', () => {
    it('should create new session with valid planType', async () => {
      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'trial',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeDefined();
      expect(data.sessionId).toContain('onb_');
    });

    it('should return 400 for invalid planType', async () => {
      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'invalid',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_PLAN');
    });

    it('should return agentIntroduction and firstQuestion for new session', async () => {
      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'trial',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.agentIntroduction).toBeDefined();
      expect(data.agentIntroduction).toContain('Alex');
      expect(data.firstQuestion).toBeDefined();
      expect(data.firstQuestion).toContain('business idea');
    });

    it('should return stageInfo starting at stage 1', async () => {
      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'trial',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stageInfo).toBeDefined();
      expect(data.stageInfo.currentStage).toBe(1);
      expect(data.stageInfo.totalStages).toBe(7);
      expect(data.stageInfo.stageName).toBeDefined();
    });
  });

  describe('session resumption (ADR-005)', () => {
    it('should resume existing active session for user', async () => {
      // Override mock to return existing session
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn((table: string) => {
            if (table === 'onboarding_sessions') {
              return {
                select: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    in: jest.fn(() => ({
                      order: jest.fn(() => ({
                        limit: jest.fn(() => ({
                          data: [
                            {
                              session_id: 'existing-session-123',
                              user_id: 'test-user-id',
                              current_stage: 3,
                              status: 'active',
                              plan_type: 'trial',
                              overall_progress: 35,
                              stage_progress: 50,
                              conversation_history: [
                                { role: 'assistant', content: 'Hello', timestamp: '2026-01-16T00:00:00Z' },
                                { role: 'user', content: 'Hi', timestamp: '2026-01-16T00:00:01Z' },
                              ],
                              stage_data: {},
                              ai_context: {
                                agentPersonality: { name: 'Alex' },
                              },
                              version: 5, // ADR-005: Version included
                            },
                          ],
                          error: null,
                        })),
                      })),
                    })),
                    gte: jest.fn(() => ({ data: [], error: null })),
                  })),
                })),
              };
            }
            return { select: jest.fn() };
          }),
        })),
      }));

      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'trial',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resuming).toBe(true);
      expect(data.sessionId).toBe('existing-session-123');
      expect(data.conversationHistory).toHaveLength(2);
    });

    it('should include version in resume response (ADR-005 PR7)', async () => {
      // Override mock to return session with version
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn((table: string) => {
            if (table === 'onboarding_sessions') {
              return {
                select: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    in: jest.fn(() => ({
                      order: jest.fn(() => ({
                        limit: jest.fn(() => ({
                          data: [
                            {
                              session_id: 'session-with-version',
                              user_id: 'test-user-id',
                              current_stage: 2,
                              status: 'active',
                              plan_type: 'trial',
                              overall_progress: 20,
                              stage_progress: 60,
                              conversation_history: [],
                              stage_data: {},
                              ai_context: {},
                              version: 7, // ADR-005: Version for concurrency
                            },
                          ],
                          error: null,
                        })),
                      })),
                    })),
                    gte: jest.fn(() => ({ data: [], error: null })),
                  })),
                })),
              };
            }
            return { select: jest.fn() };
          }),
        })),
      }));

      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'trial',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.resuming).toBe(true);
      // ADR-005 Critical: version must be included for concurrency protection
      expect(data.version).toBe(7);
    });

    it('should include status in resume response (ADR-005 PR4)', async () => {
      // Override mock to return session with status
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn((table: string) => {
            if (table === 'onboarding_sessions') {
              return {
                select: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    in: jest.fn(() => ({
                      order: jest.fn(() => ({
                        limit: jest.fn(() => ({
                          data: [
                            {
                              session_id: 'session-with-status',
                              user_id: 'test-user-id',
                              current_stage: 7,
                              status: 'completed', // ADR-005: Status for completion check
                              plan_type: 'trial',
                              overall_progress: 100,
                              stage_progress: 100,
                              conversation_history: [],
                              stage_data: {},
                              ai_context: {},
                              version: 15,
                            },
                          ],
                          error: null,
                        })),
                      })),
                    })),
                    gte: jest.fn(() => ({ data: [], error: null })),
                  })),
                })),
              };
            }
            return { select: jest.fn() };
          }),
        })),
      }));

      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'trial',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.resuming).toBe(true);
      // ADR-005 Critical: status must be included for completion check
      expect(data.status).toBe('completed');
    });

    it('should default version to 0 when not present in database', async () => {
      // Override mock to return session without version
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn((table: string) => {
            if (table === 'onboarding_sessions') {
              return {
                select: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    in: jest.fn(() => ({
                      order: jest.fn(() => ({
                        limit: jest.fn(() => ({
                          data: [
                            {
                              session_id: 'legacy-session',
                              user_id: 'test-user-id',
                              current_stage: 2,
                              status: 'active',
                              plan_type: 'trial',
                              overall_progress: 20,
                              stage_progress: 60,
                              conversation_history: [],
                              stage_data: {},
                              ai_context: {},
                              // No version field (legacy session)
                            },
                          ],
                          error: null,
                        })),
                      })),
                    })),
                    gte: jest.fn(() => ({ data: [], error: null })),
                  })),
                })),
              };
            }
            return { select: jest.fn() };
          }),
        })),
      }));

      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'trial',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.resuming).toBe(true);
      // Should default to 0 for legacy sessions without version
      expect(data.version).toBe(0);
    });

    it('should return overallProgress and stageProgress on resume', async () => {
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn((table: string) => {
            if (table === 'onboarding_sessions') {
              return {
                select: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    in: jest.fn(() => ({
                      order: jest.fn(() => ({
                        limit: jest.fn(() => ({
                          data: [
                            {
                              session_id: 'progress-session',
                              user_id: 'test-user-id',
                              current_stage: 4,
                              status: 'active',
                              plan_type: 'trial',
                              overall_progress: 55,
                              stage_progress: 75,
                              conversation_history: [],
                              stage_data: {},
                              ai_context: {},
                              version: 8,
                            },
                          ],
                          error: null,
                        })),
                      })),
                    })),
                    gte: jest.fn(() => ({ data: [], error: null })),
                  })),
                })),
              };
            }
            return { select: jest.fn() };
          }),
        })),
      }));

      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'trial',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.resuming).toBe(true);
      expect(data.overallProgress).toBe(55);
      expect(data.stageProgress).toBe(75);
    });
  });

  describe('forceNew flag', () => {
    it('should create new session when forceNew=true even if active session exists', async () => {
      // Mock would normally return existing session, but forceNew should skip it
      jest.doMock('@/lib/supabase/admin', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn((table: string) => {
            if (table === 'onboarding_sessions') {
              return {
                select: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    in: jest.fn(() => ({
                      order: jest.fn(() => ({
                        limit: jest.fn(() => ({
                          // This should NOT be called when forceNew=true
                          data: [{ session_id: 'should-not-resume' }],
                          error: null,
                        })),
                      })),
                    })),
                    gte: jest.fn(() => ({ data: [], error: null })),
                  })),
                })),
                insert: jest.fn(() => ({
                  select: jest.fn(() => ({
                    single: jest.fn(() => ({
                      data: {
                        session_id: 'new-forced-session',
                        user_id: 'test-user-id',
                        current_stage: 1,
                      },
                      error: null,
                    })),
                  })),
                })),
              };
            }
            return { select: jest.fn() };
          }),
        })),
      }));

      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'trial',
          forceNew: true,
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should NOT be resuming
      expect(data.resuming).toBeUndefined();
      // Should be a new session (starts with onb_)
      expect(data.sessionId).toContain('onb_');
      expect(data.sessionId).not.toBe('should-not-resume');
    });
  });

  describe('authentication', () => {
    it('should return 401 for unauthenticated users', async () => {
      // Override auth mock to return no user
      jest.doMock('@/lib/supabase/server', () => ({
        createClient: jest.fn(async () => ({
          auth: {
            getUser: jest.fn(() => ({
              data: { user: null },
              error: { message: 'Not authenticated' },
            })),
            getSession: jest.fn(() => ({
              data: { session: null },
              error: null,
            })),
          },
        })),
      }));

      const { POST } = await import('../route');

      const request = new Request('http://localhost:3000/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'trial',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('plan types', () => {
    it.each(['trial', 'sprint', 'founder', 'enterprise'])(
      'should accept planType: %s',
      async (planType) => {
        const { POST } = await import('../route');

        const request = new Request('http://localhost:3000/api/onboarding/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planType }),
        });

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    );
  });
});
