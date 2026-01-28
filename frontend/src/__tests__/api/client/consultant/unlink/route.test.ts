/**
 * Tests for /api/client/consultant/unlink route
 *
 * GET - Get current consultant relationship status
 * POST - Client-initiated unlinking from consultant
 * @story US-E06
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
const mockMaybeSingle = jest.fn();

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
    maybeSingle: mockMaybeSingle,
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

import { GET, POST } from '@/app/api/client/consultant/unlink/route';

function createMockGetRequest(): Request {
  return new Request('http://localhost:3000/api/client/consultant/unlink', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

function createMockPostRequest(): Request {
  return new Request('http://localhost:3000/api/client/consultant/unlink', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/client/consultant/unlink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  describe('GET - Get Consultant Status', () => {
    describe('authentication', () => {
      it('should return 401 if user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        });

        const response = await GET(createMockGetRequest() as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('no consultant', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'client-123' } },
          error: null,
        });
      });

      it('should return hasConsultant false when no relationship', async () => {
        mockMaybeSingle.mockResolvedValue({
          data: null,
          error: null,
        });

        const response = await GET(createMockGetRequest() as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.hasConsultant).toBe(false);
        expect(data.consultant).toBeNull();
      });
    });

    describe('has consultant', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'client-123' } },
          error: null,
        });
      });

      it('should return consultant details when relationship exists', async () => {
        mockMaybeSingle.mockResolvedValue({
          data: {
            id: 'rel-123',
            consultant_id: 'consultant-456',
            status: 'active',
            linked_at: '2026-01-15T10:00:00Z',
          },
          error: null,
        });

        mockSingle.mockResolvedValue({
          data: {
            id: 'consultant-456',
            full_name: 'Jane Consultant',
            company: 'Consulting Co',
            email: 'jane@consulting.co',
          },
          error: null,
        });

        const response = await GET(createMockGetRequest() as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.hasConsultant).toBe(true);
        expect(data.consultant.name).toBe('Jane Consultant');
        expect(data.consultant.company).toBe('Consulting Co');
        expect(data.consultant.linkedAt).toBe('2026-01-15T10:00:00Z');
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'client-123' } },
          error: null,
        });
      });

      it('should return 500 on fetch error', async () => {
        mockMaybeSingle.mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        });

        const response = await GET(createMockGetRequest() as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch consultant relationship');
      });
    });
  });

  describe('POST - Unlink from Consultant', () => {
    describe('authentication', () => {
      it('should return 401 if user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        });

        const response = await POST(createMockPostRequest() as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('relationship lookup', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'client-123' } },
          error: null,
        });
      });

      it('should return 404 if no active relationship exists', async () => {
        mockSingle.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        });

        const response = await POST(createMockPostRequest() as any);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('No active consultant relationship found');
      });
    });

    describe('successful unlink', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'client-123' } },
          error: null,
        });
        mockSingle.mockResolvedValue({
          data: {
            id: 'rel-123',
            consultant_id: 'consultant-456',
            client_id: 'client-123',
            status: 'active',
          },
          error: null,
        });
      });

      it('should unlink and return 200', async () => {
        const response = await POST(createMockPostRequest() as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Successfully unlinked from consultant');
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'client-123' } },
          error: null,
        });
        mockSingle.mockResolvedValue({
          data: {
            id: 'rel-123',
            consultant_id: 'consultant-456',
            client_id: 'client-123',
            status: 'active',
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

        const response = await POST(createMockPostRequest() as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to unlink from consultant');
      });
    });
  });
});
