/**
 * Tests for /api/consultant/invites routes
 *
 * POST - Create a new client invite
 * GET - List all invites and linked clients
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
const mockInsert = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockSingle = jest.fn();
const mockMaybeSingle = jest.fn();
const mockOrder = jest.fn();

// Setup Supabase chain mocks
const setupSupabaseMock = () => {
  mockFrom.mockImplementation((table: string) => ({
    select: mockSelect,
    insert: mockInsert,
  }));

  mockSelect.mockReturnValue({
    eq: mockEq,
    in: mockIn,
    order: mockOrder,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    eq: mockEq,
    in: mockIn,
    maybeSingle: mockMaybeSingle,
    order: mockOrder,
  });

  mockIn.mockReturnValue({
    maybeSingle: mockMaybeSingle,
    order: mockOrder,
  });

  mockOrder.mockResolvedValue({ data: [], error: null });

  mockInsert.mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: mockSingle,
    }),
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
    toString: () => 'mock-invite-token-123456',
  })),
}));

import { GET, POST } from '@/app/api/consultant/invites/route';

function createMockRequest(options: {
  method: 'GET' | 'POST';
  body?: object;
  url?: string;
}): Request {
  const url = options.url || 'http://localhost:3000/api/consultant/invites';
  return new Request(url, {
    method: options.method,
    headers: { 'Content-Type': 'application/json' },
    ...(options.body && { body: JSON.stringify(options.body) }),
  });
}

describe('/api/consultant/invites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  describe('POST - Create Invite', () => {
    describe('authentication', () => {
      it('should return 401 if user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        });

        const req = createMockRequest({
          method: 'POST',
          body: { email: 'client@example.com' },
        });

        const response = await POST(req as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('authorization', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        });
      });

      it('should return 404 if profile not found', async () => {
        mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

        const req = createMockRequest({
          method: 'POST',
          body: { email: 'client@example.com' },
        });

        const response = await POST(req as any);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Profile not found');
      });

      it('should return 403 if user is not a consultant', async () => {
        mockSingle.mockResolvedValue({
          data: { id: 'user-123', role: 'founder', full_name: 'Test User' },
          error: null,
        });

        const req = createMockRequest({
          method: 'POST',
          body: { email: 'client@example.com' },
        });

        const response = await POST(req as any);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Only consultants can send invites');
      });
    });

    describe('validation', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'consultant-123', email: 'consultant@example.com' } },
          error: null,
        });
        mockSingle.mockResolvedValue({
          data: { id: 'consultant-123', role: 'consultant', full_name: 'Test Consultant' },
          error: null,
        });
      });

      it('should return 400 for invalid email', async () => {
        const req = createMockRequest({
          method: 'POST',
          body: { email: 'not-an-email' },
        });

        const response = await POST(req as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid request');
      });

      it('should return 400 for missing email', async () => {
        const req = createMockRequest({
          method: 'POST',
          body: {},
        });

        const response = await POST(req as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid request');
      });
    });

    describe('duplicate handling', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'consultant-123', email: 'consultant@example.com' } },
          error: null,
        });
        mockSingle.mockResolvedValueOnce({
          data: { id: 'consultant-123', role: 'consultant', full_name: 'Test Consultant' },
          error: null,
        });
      });

      it('should return 409 if invite already exists', async () => {
        mockMaybeSingle.mockResolvedValueOnce({
          data: { id: 'existing-invite', status: 'invited' },
          error: null,
        });

        const req = createMockRequest({
          method: 'POST',
          body: { email: 'client@example.com' },
        });

        const response = await POST(req as any);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe('An invite has already been sent to this email');
      });

      it('should return 409 if client is already linked', async () => {
        mockMaybeSingle.mockResolvedValueOnce({
          data: { id: 'existing-client', status: 'active' },
          error: null,
        });

        const req = createMockRequest({
          method: 'POST',
          body: { email: 'client@example.com' },
        });

        const response = await POST(req as any);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe('This client is already linked to your account');
      });

      it('should return 409 if email is linked to another consultant', async () => {
        // First check for same consultant - no existing
        mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
        // Second check for other consultants - existing found
        mockMaybeSingle.mockResolvedValueOnce({
          data: { id: 'other-relation', consultant_id: 'other-consultant' },
          error: null,
        });

        const req = createMockRequest({
          method: 'POST',
          body: { email: 'client@example.com' },
        });

        const response = await POST(req as any);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe('This email is already linked to another consultant');
      });
    });

    describe('successful creation', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'consultant-123', email: 'consultant@example.com' } },
          error: null,
        });
        mockSingle
          .mockResolvedValueOnce({
            data: { id: 'consultant-123', role: 'consultant', full_name: 'Test Consultant' },
            error: null,
          })
          .mockResolvedValueOnce({
            data: {
              id: 'new-invite-id',
              consultant_id: 'consultant-123',
              invite_email: 'newclient@example.com',
              invite_token: 'mock-invite-token-123456',
            },
            error: null,
          });
        mockMaybeSingle
          .mockResolvedValueOnce({ data: null, error: null }) // No existing for same consultant
          .mockResolvedValueOnce({ data: null, error: null }); // No existing for other consultants
      });

      it('should create invite and return 200', async () => {
        const req = createMockRequest({
          method: 'POST',
          body: { email: 'newclient@example.com', name: 'New Client' },
        });

        const response = await POST(req as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.invite).toBeDefined();
        expect(data.invite.email).toBe('newclient@example.com');
        expect(data.invite.inviteToken).toBeDefined();
        expect(data.invite.inviteUrl).toContain('signup?invite=');
      });

      it('should normalize email to lowercase', async () => {
        const req = createMockRequest({
          method: 'POST',
          body: { email: 'NewClient@Example.COM' },
        });

        const response = await POST(req as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.invite.email).toBe('newclient@example.com');
      });
    });
  });

  describe('GET - List Invites', () => {
    describe('authentication', () => {
      it('should return 401 if user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        });

        const req = createMockRequest({ method: 'GET' });

        const response = await GET(req as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('authorization', () => {
      it('should return 403 if user is not a consultant', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        });
        mockSingle.mockResolvedValue({
          data: { role: 'founder' },
          error: null,
        });

        const req = createMockRequest({ method: 'GET' });

        const response = await GET(req as any);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Only consultants can view invites');
      });
    });

    describe('successful listing', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'consultant-123', email: 'consultant@example.com' } },
          error: null,
        });
        mockSingle.mockResolvedValue({
          data: { role: 'consultant' },
          error: null,
        });
      });

      it('should return empty lists when no invites or clients', async () => {
        mockOrder.mockResolvedValue({ data: [], error: null });

        const req = createMockRequest({ method: 'GET' });

        const response = await GET(req as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.invites).toEqual([]);
        expect(data.clients).toEqual([]);
        expect(data.archived).toEqual([]);
        expect(data.counts).toEqual({ pending: 0, active: 0, archived: 0 });
      });

      it('should separate invites, clients, and archived', async () => {
        const mockRecords = [
          {
            id: 'inv-1',
            consultant_id: 'consultant-123',
            client_id: null,
            invite_email: 'pending@example.com',
            invite_token: 'token1',
            invite_expires_at: new Date(Date.now() + 86400000).toISOString(),
            client_name: 'Pending Client',
            status: 'invited',
            invited_at: new Date().toISOString(),
          },
          {
            id: 'cli-1',
            consultant_id: 'consultant-123',
            client_id: 'client-user-123',
            invite_email: 'active@example.com',
            invite_token: null,
            invite_expires_at: null,
            client_name: 'Active Client',
            status: 'active',
            linked_at: new Date().toISOString(),
          },
          {
            id: 'arch-1',
            consultant_id: 'consultant-123',
            client_id: 'archived-user-123',
            invite_email: 'archived@example.com',
            invite_token: null,
            invite_expires_at: null,
            client_name: 'Archived Client',
            status: 'archived',
            archived_at: new Date().toISOString(),
            archived_by: 'consultant',
          },
        ];

        mockOrder.mockResolvedValue({ data: mockRecords, error: null });

        const req = createMockRequest({ method: 'GET' });

        const response = await GET(req as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.invites).toHaveLength(1);
        expect(data.clients).toHaveLength(1);
        expect(data.archived).toHaveLength(1);
        expect(data.counts).toEqual({ pending: 1, active: 1, archived: 1 });
      });

      it('should mark expired invites', async () => {
        const expiredDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
        const mockRecords = [
          {
            id: 'exp-1',
            consultant_id: 'consultant-123',
            invite_email: 'expired@example.com',
            invite_token: 'expired-token',
            invite_expires_at: expiredDate,
            client_name: 'Expired Invite',
            status: 'invited',
            invited_at: new Date().toISOString(),
          },
        ];

        mockOrder.mockResolvedValue({ data: mockRecords, error: null });

        const req = createMockRequest({ method: 'GET' });

        const response = await GET(req as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.invites[0].isExpired).toBe(true);
      });

      it('should allow admin users to view invites', async () => {
        mockSingle.mockReset();
        mockSingle.mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        });
        mockOrder.mockResolvedValue({ data: [], error: null });

        const req = createMockRequest({ method: 'GET' });

        const response = await GET(req as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'consultant-123', email: 'consultant@example.com' } },
          error: null,
        });
        mockSingle.mockResolvedValue({
          data: { role: 'consultant' },
          error: null,
        });
      });

      it('should return 500 on database error', async () => {
        mockOrder.mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        });

        const req = createMockRequest({ method: 'GET' });

        const response = await GET(req as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch invites');
      });
    });
  });
});
