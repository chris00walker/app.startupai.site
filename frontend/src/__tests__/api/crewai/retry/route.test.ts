/**
 * Tests for /api/crewai/retry route
 *
 * @story US-E04
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

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateEq = jest.fn();
const mockInsert = jest.fn();

const setupAdminMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
  }));

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
  });

  mockUpdate.mockReturnValue({
    eq: mockUpdateEq,
  });

  mockUpdateEq.mockResolvedValue({ error: null });
  mockInsert.mockResolvedValue({ error: null });
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    })
  ),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

const mockKickoff = jest.fn();
jest.mock('@/lib/crewai/modal-client', () => {
  const actual = jest.requireActual('@/lib/crewai/modal-client');
  return {
    ...actual,
    createModalClient: () => ({
      kickoff: (...args: unknown[]) => mockKickoff(...args),
    }),
  };
});

import { POST } from '@/app/api/crewai/retry/route';

function createMockRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/crewai/retry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/crewai/retry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAdminMock();
  });

  it('returns 400 when run_id is missing', async () => {
    const response = await POST(createMockRequest({}) as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const response = await POST(createMockRequest({ run_id: 'run-123' }) as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when run is not found', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: null,
      error: new Error('Not found'),
    });

    const response = await POST(createMockRequest({ run_id: 'run-123' }) as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Validation run not found');
  });

  it('returns 403 when user does not own the run', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: {
        run_id: 'run-123',
        user_id: 'user-999',
      },
      error: null,
    });

    const response = await POST(createMockRequest({ run_id: 'run-123' }) as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns 400 when run is already completed', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: {
        run_id: 'run-123',
        user_id: 'user-123',
        status: 'completed',
      },
      error: null,
    });

    const response = await POST(createMockRequest({ run_id: 'run-123' }) as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Run already completed');
  });

  it('returns 400 when inputs are missing', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: {
        run_id: 'run-123',
        user_id: 'user-123',
        status: 'running',
        inputs: null,
      },
      error: null,
    });

    const response = await POST(createMockRequest({ run_id: 'run-123' }) as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing inputs needed to retry this run');
  });

  it('restarts the run and returns new run_id', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: {
        run_id: 'run-123',
        user_id: 'user-123',
        project_id: 'project-123',
        status: 'running',
        inputs: {
          entrepreneur_input: 'Test input',
        },
      },
      error: null,
    });

    mockKickoff.mockResolvedValue({
      run_id: 'run-456',
      status: 'started',
      message: 'Started',
    });

    const response = await POST(createMockRequest({ run_id: 'run-123' }) as any);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.run_id).toBe('run-456');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
  });
});
