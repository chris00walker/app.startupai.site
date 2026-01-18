/**
 * Tests for /api/consultant/onboarding route
 *
 * POST - Creates consultant profile from onboarding data
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
const mockUpdate = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  }));

  mockSelect.mockReturnValue({
    eq: mockEq,
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

import { POST } from '@/app/api/consultant/onboarding/route';

function createMockRequest(body: object): Request {
  return new Request('http://localhost:3000/api/consultant/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/consultant/onboarding', () => {
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
          profile: { companyName: 'Test Co' },
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if userId does not match authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const response = await POST(
        createMockRequest({
          userId: 'different-user-456',
          profile: { companyName: 'Test Co' },
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('profile creation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 500 if profile insert fails', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const response = await POST(
        createMockRequest({
          userId: 'user-123',
          profile: {
            companyName: 'Test Consulting',
            practiceSize: 'solo',
          },
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save consultant profile');
    });

    it('should create profile successfully', async () => {
      const mockProfile = {
        id: 'user-123',
        company_name: 'Test Consulting',
        practice_size: 'solo',
        onboarding_completed: true,
      };

      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      // Mock user_profiles update
      mockEq.mockResolvedValue({ error: null });

      const response = await POST(
        createMockRequest({
          userId: 'user-123',
          profile: {
            companyName: 'Test Consulting',
            practiceSize: 'solo',
            currentClients: 5,
            industries: ['Technology', 'Healthcare'],
            services: ['Strategy', 'Marketing'],
            toolsUsed: ['Slack', 'Notion'],
            painPoints: 'Managing multiple clients',
            whiteLabelInterest: true,
          },
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile).toEqual(mockProfile);
      expect(data.message).toBe('Consultant profile created successfully');
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
          profile: { companyName: 'Test' },
        }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
