/**
 * Tests for /api/consultant/chat route
 *
 * POST - Streaming chat endpoint for consultant onboarding (Maya AI)
 */

// Mock NextRequest
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
}));

// Mock AI SDK - streamText
jest.mock('ai', () => ({
  streamText: jest.fn(() => ({
    toUIMessageStreamResponse: jest.fn(() => new Response('stream', { status: 200 })),
  })),
}));

// Mock OpenAI provider
jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(() => jest.fn()),
}));

// Mock Supabase clients
const mockGetUser = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockFrom = jest.fn();
const mockSingle = jest.fn();

const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    update: mockUpdate,
  }));

  mockSelect.mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: mockSingle,
    }),
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
  })),
}));

// Mock consultant config
jest.mock('@/lib/onboarding/consultant-stages-config', () => ({
  CONSULTANT_STAGES_CONFIG: {},
  CONSULTANT_TOTAL_STAGES: 7,
  getConsultantStageSystemContext: jest.fn(() => 'Stage context'),
}));

// Mock quality assessment
jest.mock('@/lib/onboarding/consultant-quality-assessment', () => ({
  assessConsultantConversation: jest.fn(),
  shouldConsultantAdvanceStage: jest.fn(() => false),
  isConsultantOnboardingComplete: jest.fn(() => false),
  mergeConsultantExtractedData: jest.fn((existing, extracted) => ({ ...existing, ...extracted })),
  calculateConsultantProgress: jest.fn(() => 50),
  hashConsultantMessage: jest.fn(() => 'hash-123'),
}));

// Mock Maya system prompt
jest.mock('@/lib/ai/consultant-onboarding-prompt', () => ({
  MAYA_SYSTEM_PROMPT: 'Maya system prompt',
}));

import { POST } from '@/app/api/consultant/chat/route';
import { streamText } from 'ai';

function createMockRequest(body: object): Request {
  return new Request('http://localhost:3000/api/consultant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/consultant/chat', () => {
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
          messages: [{ role: 'user', content: 'Hello' }],
          sessionId: 'session-123',
          userId: 'user-123',
        }) as any
      );

      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toBe('Unauthorized');
    });

    it('should return 403 if userId does not match authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const response = await POST(
        createMockRequest({
          messages: [{ role: 'user', content: 'Hello' }],
          sessionId: 'session-123',
          userId: 'different-user-456',
        }) as any
      );

      expect(response.status).toBe(403);
      const text = await response.text();
      expect(text).toBe('Forbidden');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 400 if sessionId is missing', async () => {
      const response = await POST(
        createMockRequest({
          messages: [{ role: 'user', content: 'Hello' }],
          userId: 'user-123',
        }) as any
      );

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe('Session ID required');
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
          messages: [{ role: 'user', content: 'Hello' }],
          sessionId: 'non-existent',
          userId: 'user-123',
        }) as any
      );

      expect(response.status).toBe(404);
      const text = await response.text();
      expect(text).toBe('Session not found');
    });

    it('should return 403 if session belongs to different user', async () => {
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'different-user-456',
          current_stage: 1,
          stage_data: {},
        },
        error: null,
      });

      const response = await POST(
        createMockRequest({
          messages: [{ role: 'user', content: 'Hello' }],
          sessionId: 'session-123',
          userId: 'user-123',
        }) as any
      );

      expect(response.status).toBe(403);
      const text = await response.text();
      expect(text).toBe('Session ownership mismatch');
    });
  });

  describe('successful chat', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: {
          session_id: 'session-123',
          user_id: 'user-123',
          current_stage: 1,
          stage_data: { brief: {} },
          conversation_history: [],
        },
        error: null,
      });
    });

    it('should return streaming response', async () => {
      const response = await POST(
        createMockRequest({
          messages: [{ role: 'user', content: 'Hello Maya' }],
          sessionId: 'session-123',
          userId: 'user-123',
        }) as any
      );

      expect(response.status).toBe(200);
      expect(streamText).toHaveBeenCalled();
    });

    it('should call streamText with messages', async () => {
      await POST(
        createMockRequest({
          messages: [{ role: 'user', content: 'Tell me about your services' }],
          sessionId: 'session-123',
          userId: 'user-123',
        }) as any
      );

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.any(Array),
          temperature: 0.7,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockGetUser.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await POST(
        createMockRequest({
          messages: [{ role: 'user', content: 'Hello' }],
          sessionId: 'session-123',
          userId: 'user-123',
        }) as any
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });
  });
});
