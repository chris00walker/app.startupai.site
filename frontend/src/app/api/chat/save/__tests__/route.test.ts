/**
 * Tests for /api/chat/save endpoint
 *
 * Part of ADR-005 Split API Architecture:
 * Tests atomic persistence, idempotency, and response structure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
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
    rpc: vi.fn(() => ({
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

vi.mock('@/lib/supabase/admin', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
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
    rpc: vi.fn(() => ({
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

vi.mock('@/lib/onboarding/quality-assessment', () => ({
  assessConversationQuality: vi.fn(() => ({
    coverage: 0.5,
    clarity: 'good',
    completeness: 'partial',
    extractedData: {},
    keyInsights: [],
    recommendedNextSteps: [],
  })),
  shouldAdvanceStage: vi.fn(() => false),
  isOnboardingComplete: vi.fn(() => false),
  calculateOverallProgress: vi.fn(() => 10),
}));

vi.mock('@/lib/crewai/modal-client', () => ({
  createModalClient: vi.fn(() => ({
    kickoff: vi.fn(),
  })),
}));

vi.mock('@/lib/crewai/founder-validation', () => ({
  buildFounderValidationInputs: vi.fn(() => ({})),
}));

describe('/api/chat/save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });
});
