/**
 * Tests for /api/consultant/clients/[id]/archive route
 *
 * POST - Archive a client relationship
 * @story US-C05
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

import { POST } from '@/app/api/consultant/clients/[id]/archive/route';

function createMockRequest(): Request {
  return new Request('http://localhost:3000/api/consultant/clients/rel-123/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

function createMockContext(id: string = 'rel-123') {
  return {
    params: Promise.resolve({ id }),
  };
}

describe('POST /api/consultant/clients/[id]/archive', () => {
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

  describe('relationship lookup', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'consultant-123' } },
        error: null,
      });
    });

    it('should return 404 if relationship not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Client relationship not found');
    });
  });

  describe('authorization', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'consultant-123' } },
        error: null,
      });
    });

    it('should return 403 if relationship belongs to different consultant', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'rel-123',
          consultant_id: 'other-consultant-456',
          client_id: 'client-789',
          status: 'active',
          invite_email: 'client@example.com',
        },
        error: null,
      });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You do not have permission to archive this client');
    });
  });

  describe('status validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'consultant-123' } },
        error: null,
      });
    });

    it('should return 400 if relationship is already archived', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'rel-123',
          consultant_id: 'consultant-123',
          client_id: 'client-789',
          status: 'archived',
          invite_email: 'client@example.com',
        },
        error: null,
      });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('This relationship is already archived');
    });
  });

  describe('successful archiving', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'consultant-123' } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: {
          id: 'rel-123',
          consultant_id: 'consultant-123',
          client_id: 'client-789',
          status: 'active',
          invite_email: 'client@example.com',
        },
        error: null,
      });
    });

    it('should archive relationship and return 200', async () => {
      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Client archived successfully');
    });

    it('should archive invited (pending) relationships', async () => {
      mockSingle.mockReset();
      mockSingle.mockResolvedValue({
        data: {
          id: 'rel-123',
          consultant_id: 'consultant-123',
          client_id: null,
          status: 'invited',
          invite_email: 'pending@example.com',
        },
        error: null,
      });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
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
          id: 'rel-123',
          consultant_id: 'consultant-123',
          client_id: 'client-789',
          status: 'active',
          invite_email: 'client@example.com',
        },
        error: null,
      });
    });

    it('should return 500 on update error', async () => {
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      });

      const response = await POST(createMockRequest() as any, createMockContext());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to archive client');
    });
  });
});
