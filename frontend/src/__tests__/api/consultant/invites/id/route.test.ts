/**
 * Tests for /api/consultant/invites/[id] routes
 *
 * DELETE - Revoke a pending invite
 * @story US-C02
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
const mockDelete = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    delete: mockDelete,
  }));

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    eq: mockEq,
  });

  mockDelete.mockReturnValue({
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

import { DELETE } from '@/app/api/consultant/invites/[id]/route';

function createMockRequest(): Request {
  return new Request('http://localhost:3000/api/consultant/invites/invite-123', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
}

function createMockContext(id: string = 'invite-123') {
  return {
    params: Promise.resolve({ id }),
  };
}

describe('DELETE /api/consultant/invites/[id]', () => {
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

      const response = await DELETE(createMockRequest() as any, createMockContext());
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

      const response = await DELETE(createMockRequest() as any, createMockContext());
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
        },
        error: null,
      });

      const response = await DELETE(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You do not have permission to revoke this invite');
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
        },
        error: null,
      });

      const response = await DELETE(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Only pending invites can be revoked');
    });

    it('should return 400 if invite is archived', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'invite-123',
          consultant_id: 'consultant-123',
          status: 'archived',
          invite_email: 'client@example.com',
        },
        error: null,
      });

      const response = await DELETE(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Only pending invites can be revoked');
    });
  });

  describe('successful deletion', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'consultant-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: {
          id: 'invite-123',
          consultant_id: 'consultant-123',
          status: 'invited',
          invite_email: 'client@example.com',
        },
        error: null,
      });
    });

    it('should delete invite and return 200', async () => {
      const response = await DELETE(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Invite revoked successfully');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'consultant-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: {
          id: 'invite-123',
          consultant_id: 'consultant-123',
          status: 'invited',
          invite_email: 'client@example.com',
        },
        error: null,
      });
    });

    it('should return 500 on delete error', async () => {
      mockDelete.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      });

      const response = await DELETE(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to revoke invite');
    });
  });
});
