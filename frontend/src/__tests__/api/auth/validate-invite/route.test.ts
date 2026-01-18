/**
 * Tests for /api/auth/validate-invite routes
 *
 * GET - Validate an invite token before signup
 * POST - Link account after signup
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
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockRpc = jest.fn();

const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
  }));

  mockSelect.mockReturnValue({
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
      rpc: mockRpc,
    })
  ),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

import { GET, POST } from '@/app/api/auth/validate-invite/route';

function createMockGetRequest(token?: string): Request {
  const url = token
    ? `http://localhost:3000/api/auth/validate-invite?token=${token}`
    : 'http://localhost:3000/api/auth/validate-invite';
  return new Request(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

function createMockPostRequest(body: object): Request {
  return new Request('http://localhost:3000/api/auth/validate-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/auth/validate-invite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  describe('GET - Validate Token', () => {
    describe('validation', () => {
      it('should return 400 if token is missing', async () => {
        const response = await GET(createMockGetRequest() as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Token is required');
      });
    });

    describe('invite lookup', () => {
      it('should return 404 if invite not found', async () => {
        mockSingle.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        });

        const response = await GET(createMockGetRequest('invalid-token') as any);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.valid).toBe(false);
        expect(data.error).toBe('Invite not found or already used');
      });
    });

    describe('status validation', () => {
      it('should return 400 if invite is already accepted', async () => {
        mockSingle.mockResolvedValue({
          data: {
            id: 'invite-123',
            consultant_id: 'consultant-123',
            invite_email: 'client@example.com',
            invite_expires_at: new Date(Date.now() + 86400000).toISOString(),
            client_name: 'Test Client',
            status: 'active',
          },
          error: null,
        });

        const response = await GET(createMockGetRequest('used-token') as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.valid).toBe(false);
        expect(data.error).toBe('This invite has already been accepted');
      });

      it('should return 400 if invite is archived', async () => {
        mockSingle.mockResolvedValue({
          data: {
            id: 'invite-123',
            consultant_id: 'consultant-123',
            invite_email: 'client@example.com',
            invite_expires_at: new Date(Date.now() + 86400000).toISOString(),
            client_name: 'Test Client',
            status: 'archived',
          },
          error: null,
        });

        const response = await GET(createMockGetRequest('archived-token') as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.valid).toBe(false);
        expect(data.error).toBe('This invite is no longer valid');
      });

      it('should return 400 if invite is expired', async () => {
        mockSingle.mockResolvedValue({
          data: {
            id: 'invite-123',
            consultant_id: 'consultant-123',
            invite_email: 'client@example.com',
            invite_expires_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            client_name: 'Test Client',
            status: 'invited',
          },
          error: null,
        });

        const response = await GET(createMockGetRequest('expired-token') as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.valid).toBe(false);
        expect(data.error).toBe('This invite has expired');
      });
    });

    describe('consultant lookup', () => {
      it('should return 404 if consultant not found', async () => {
        mockSingle
          .mockResolvedValueOnce({
            data: {
              id: 'invite-123',
              consultant_id: 'consultant-123',
              invite_email: 'client@example.com',
              invite_expires_at: new Date(Date.now() + 86400000).toISOString(),
              client_name: 'Test Client',
              status: 'invited',
            },
            error: null,
          })
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' },
          });

        const response = await GET(createMockGetRequest('valid-token') as any);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.valid).toBe(false);
        expect(data.error).toBe('Consultant not found');
      });
    });

    describe('successful validation', () => {
      it('should return valid invite details', async () => {
        const expiresAt = new Date(Date.now() + 86400000).toISOString();
        mockSingle
          .mockResolvedValueOnce({
            data: {
              id: 'invite-123',
              consultant_id: 'consultant-123',
              invite_email: 'client@example.com',
              invite_expires_at: expiresAt,
              client_name: 'Test Client',
              status: 'invited',
            },
            error: null,
          })
          .mockResolvedValueOnce({
            data: {
              id: 'consultant-123',
              full_name: 'Jane Consultant',
              company: 'Consulting Co',
            },
            error: null,
          });

        const response = await GET(createMockGetRequest('valid-token') as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.valid).toBe(true);
        expect(data.email).toBe('client@example.com');
        expect(data.clientName).toBe('Test Client');
        expect(data.consultantId).toBe('consultant-123');
        expect(data.consultantName).toBe('Jane Consultant');
        expect(data.consultantCompany).toBe('Consulting Co');
        expect(data.expiresAt).toBe(expiresAt);
      });
    });
  });

  describe('POST - Link Account', () => {
    describe('authentication', () => {
      it('should return 401 if user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        });

        const response = await POST(createMockPostRequest({ token: 'valid-token' }) as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('validation', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'client-123' } },
          error: null,
        });
      });

      it('should return 400 if token is missing', async () => {
        const response = await POST(createMockPostRequest({}) as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Token is required');
      });
    });

    describe('linking', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'client-123' } },
          error: null,
        });
      });

      it('should return 500 on RPC error', async () => {
        mockRpc.mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        });

        const response = await POST(createMockPostRequest({ token: 'valid-token' }) as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to link account');
      });

      it('should return 400 on function failure', async () => {
        mockRpc.mockResolvedValue({
          data: { success: false, error: 'Invite expired' },
          error: null,
        });

        const response = await POST(createMockPostRequest({ token: 'expired-token' }) as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invite expired');
      });

      it('should successfully link account', async () => {
        mockRpc.mockResolvedValue({
          data: {
            success: true,
            consultant_id: 'consultant-123',
            consultant_name: 'Jane Consultant',
          },
          error: null,
        });

        const response = await POST(createMockPostRequest({ token: 'valid-token' }) as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.consultantId).toBe('consultant-123');
        expect(data.consultantName).toBe('Jane Consultant');
        expect(data.message).toBe('Account linked to consultant successfully');
      });
    });
  });
});
