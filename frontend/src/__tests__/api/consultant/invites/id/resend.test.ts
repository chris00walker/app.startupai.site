/**
 * Tests for /api/consultant/invites/[id]/resend route
 *
 * POST - Resend an invite with a new token
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
    select: jest.fn().mockReturnValue({
      single: mockSingle,
    }),
  });

  mockUpdate.mockReturnValue({
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

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: () => 'new-mock-token-456789',
  })),
}));

import { POST } from '@/app/api/consultant/invites/[id]/resend/route';

function createMockRequest(): Request {
  return new Request('http://localhost:3000/api/consultant/invites/invite-123/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

function createMockContext(id: string = 'invite-123') {
  return {
    params: Promise.resolve({ id }),
  };
}

describe('POST /api/consultant/invites/[id]/resend', () => {
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

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('invite lookup', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'consultant-123' } },
        error: null,
      });
    });

    it('should return 404 if invite not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Invite not found');
    });
  });

  describe('authorization', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'consultant-123' } },
        error: null,
      });
    });

    it('should return 403 if invite belongs to different consultant', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'invite-123',
          consultant_id: 'other-consultant-456',
          status: 'invited',
          invite_email: 'client@example.com',
          client_name: 'Test Client',
        },
        error: null,
      });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You do not have permission to resend this invite');
    });
  });

  describe('invite status validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'consultant-123' } },
        error: null,
      });
    });

    it('should return 400 if invite is already active (linked)', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'invite-123',
          consultant_id: 'consultant-123',
          status: 'active',
          invite_email: 'client@example.com',
          client_name: 'Test Client',
        },
        error: null,
      });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Only pending invites can be resent');
    });

    it('should return 400 if invite is archived', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'invite-123',
          consultant_id: 'consultant-123',
          status: 'archived',
          invite_email: 'client@example.com',
          client_name: 'Test Client',
        },
        error: null,
      });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Only pending invites can be resent');
    });
  });

  describe('successful resend', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'consultant-123' } },
        error: null,
      });
    });

    it('should update invite with new token and return 200', async () => {
      // First call: fetch invite
      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'invite-123',
            consultant_id: 'consultant-123',
            status: 'invited',
            invite_email: 'client@example.com',
            client_name: 'Test Client',
          },
          error: null,
        })
        // Second call: update result
        .mockResolvedValueOnce({
          data: {
            id: 'invite-123',
            invite_token: 'new-mock-token-456789',
          },
          error: null,
        });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Invite resent successfully');
      expect(data.invite).toBeDefined();
      expect(data.invite.inviteToken).toBe('new-mock-token-456789');
      expect(data.invite.inviteUrl).toContain('signup?invite=new-mock-token-456789');
      expect(data.invite.email).toBe('client@example.com');
    });

    it('should preserve client name in response', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'invite-123',
            consultant_id: 'consultant-123',
            status: 'invited',
            invite_email: 'client@example.com',
            client_name: 'John Doe',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'invite-123',
            invite_token: 'new-mock-token-456789',
          },
          error: null,
        });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invite.name).toBe('John Doe');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'consultant-123' } },
        error: null,
      });
    });

    it('should return 500 on update error', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'invite-123',
            consultant_id: 'consultant-123',
            status: 'invited',
            invite_email: 'client@example.com',
            client_name: 'Test Client',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to resend invite');
    });
  });
});
