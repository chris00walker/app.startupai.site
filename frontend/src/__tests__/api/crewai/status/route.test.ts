/**
 * Tests for CrewAI status polling endpoint
 */

// Mock NextResponse.json since it doesn't work in Jest's Node.js environment
jest.mock('next/server', () => {
  return {
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
  };
});

// Mock Supabase client
const mockGetUser = jest.fn();
const mockFrom = jest.fn(() => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn(),
    })),
  })),
  insert: jest.fn(),
  update: jest.fn(() => ({
    eq: jest.fn(),
  })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    })
  ),
}));

// Mock Modal client
const mockGetModalStatus = jest.fn();
jest.mock('@/lib/crewai/modal-client', () => {
  const actual = jest.requireActual('@/lib/crewai/modal-client');
  return {
    ...actual,
    createModalClient: () => ({
      getStatus: (...args: unknown[]) => mockGetModalStatus(...args),
    }),
  };
});

// Import after mocks are set up
import { GET } from '@/app/api/crewai/status/route';

// Helper to create mock Request
function createMockRequest(url: string): Request {
  return new Request(url);
}

describe('GET /api/crewai/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if run_id is missing', async () => {
    const req = createMockRequest('http://localhost:3000/api/crewai/status');

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('run_id required');
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const req = createMockRequest(
      'http://localhost:3000/api/crewai/status?run_id=test-123'
    );

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return status for valid authenticated request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockGetModalStatus.mockResolvedValue({
      run_id: 'test-123',
      status: 'running',
      current_phase: 1,
      phase_name: 'VPC Discovery',
      progress: {
        crew: 'Discovery',
        progress_pct: 40,
      },
    });

    const req = createMockRequest(
      'http://localhost:3000/api/crewai/status?run_id=test-123'
    );

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.state).toBe('RUNNING');
    expect(data.progress).toBeGreaterThan(0);
  });

  it('should calculate progress correctly for completed state', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockGetModalStatus.mockResolvedValue({
      run_id: 'test-123',
      status: 'completed',
      current_phase: 4,
      phase_name: 'Viability',
      progress: {
        crew: 'Viability',
        progress_pct: 100,
      },
    });

    const req = createMockRequest(
      'http://localhost:3000/api/crewai/status?run_id=test-123'
    );

    const response = await GET(req as any);
    const data = await response.json();

    expect(data.progress).toBe(100);
  });
});
