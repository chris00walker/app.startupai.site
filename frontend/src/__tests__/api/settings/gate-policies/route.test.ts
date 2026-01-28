/**
 * Tests for /api/settings/gate-policies routes
 *
 * GET - List all gate policies for the authenticated user
 *
 * @story US-AD10, US-ADB05, US-AFB03, US-AVB03
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

// Setup Supabase chain mocks
const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
  }));

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockResolvedValue({ data: [], error: null });
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

import { GET } from '@/app/api/settings/gate-policies/route';

describe('GET /api/settings/gate-policies', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockCustomPolicy = {
    id: 'policy-1',
    user_id: 'user-123',
    gate: 'DESIRABILITY',
    min_experiments: 5,
    required_fit_types: ['Desirability'],
    min_weak_evidence: 1,
    min_medium_evidence: 2,
    min_strong_evidence: 2,
    thresholds: { fit_score: 80, ctr: 0.03 },
    override_roles: ['admin'],
    requires_approval: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('should return all gate policies with defaults when no custom policies exist', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockEq.mockResolvedValue({ data: [], error: null });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.policies).toBeDefined();
    expect(json.policies.DESIRABILITY).toBeDefined();
    expect(json.policies.FEASIBILITY).toBeDefined();
    expect(json.policies.VIABILITY).toBeDefined();
    expect(json.policies.DESIRABILITY.isCustom).toBe(false);
  });

  it('should merge custom policies with defaults', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockEq.mockResolvedValue({
      data: [mockCustomPolicy],
      error: null,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.policies.DESIRABILITY.isCustom).toBe(true);
    expect(json.policies.DESIRABILITY.minExperiments).toBe(5);
    expect(json.policies.FEASIBILITY.isCustom).toBe(false);
  });

  it('should return 500 on database error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockEq.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to fetch gate policies');
  });

  it('should include defaults in response', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockEq.mockResolvedValue({ data: [], error: null });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.defaults).toBeDefined();
    expect(json.defaults.DESIRABILITY).toBeDefined();
    expect(json.defaults.DESIRABILITY.minExperiments).toBe(3);
  });
});
