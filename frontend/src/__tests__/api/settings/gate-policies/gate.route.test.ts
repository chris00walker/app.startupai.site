/**
 * Tests for /api/settings/gate-policies/[gate] routes
 *
 * GET - Get specific gate policy
 * PUT - Create or update gate policy
 * DELETE - Reset gate policy to defaults
 *
 * @story US-AD10, US-ADB05, US-AFB03, US-AVB03
 */

import { NextRequest } from 'next/server';

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
const mockUpsert = jest.fn();
const mockDelete = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();

// Setup Supabase chain mocks
const setupSupabaseMock = () => {
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    upsert: mockUpsert,
    delete: mockDelete,
  }));

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
  });

  mockUpsert.mockReturnValue({
    select: mockSelect,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
  });

  mockDelete.mockReturnValue({
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

import { GET, PUT, DELETE } from '@/app/api/settings/gate-policies/[gate]/route';

function createMockRequest(options: {
  method: 'GET' | 'PUT' | 'DELETE';
  body?: object;
}): NextRequest {
  const url = 'http://localhost:3000/api/settings/gate-policies/desirability';
  const init: RequestInit = {
    method: options.method,
  };

  if (options.body) {
    init.body = JSON.stringify(options.body);
    init.headers = {
      'Content-Type': 'application/json',
    };
  }

  return new Request(url, init) as unknown as NextRequest;
}

describe('GET /api/settings/gate-policies/[gate]', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockParams = Promise.resolve({ gate: 'desirability' });

  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = createMockRequest({ method: 'GET' });
    const response = await GET(request, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid gate type', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = createMockRequest({ method: 'GET' });
    const invalidParams = Promise.resolve({ gate: 'invalid' });
    const response = await GET(request, { params: invalidParams });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Invalid gate');
  });

  it('should return default policy when no custom policy exists', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const request = createMockRequest({ method: 'GET' });
    const response = await GET(request, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.policy.gate).toBe('DESIRABILITY');
    expect(json.policy.isCustom).toBe(false);
    expect(json.defaults).toBeDefined();
  });

  it('should return custom policy when it exists', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'policy-1',
        user_id: 'user-123',
        gate: 'DESIRABILITY',
        min_experiments: 5,
        required_fit_types: ['Desirability'],
        min_weak_evidence: 1,
        min_medium_evidence: 2,
        min_strong_evidence: 2,
        thresholds: { fit_score: 80 },
        override_roles: ['admin'],
        requires_approval: true,
      },
      error: null,
    });

    const request = createMockRequest({ method: 'GET' });
    const response = await GET(request, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.policy.isCustom).toBe(true);
    expect(json.policy.minExperiments).toBe(5);
  });
});

describe('PUT /api/settings/gate-policies/[gate]', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockParams = Promise.resolve({ gate: 'desirability' });

  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = createMockRequest({
      method: 'PUT',
      body: { minExperiments: 5 },
    });
    const response = await PUT(request, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid request body', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = createMockRequest({
      method: 'PUT',
      body: { minExperiments: 100 }, // exceeds max of 10
    });
    const response = await PUT(request, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid request body');
  });

  it('should upsert gate policy successfully', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: {
        id: 'policy-1',
        user_id: 'user-123',
        gate: 'DESIRABILITY',
        min_experiments: 5,
        required_fit_types: ['Desirability'],
        min_weak_evidence: 0,
        min_medium_evidence: 1,
        min_strong_evidence: 1,
        thresholds: { fit_score: 70, ctr: 0.02 },
        override_roles: ['admin', 'senior_consultant'],
        requires_approval: true,
      },
      error: null,
    });

    const request = createMockRequest({
      method: 'PUT',
      body: { minExperiments: 5 },
    });
    const response = await PUT(request, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.policy.isCustom).toBe(true);
    expect(json.message).toBe('Gate policy saved successfully');
  });
});

describe('DELETE /api/settings/gate-policies/[gate]', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockParams = Promise.resolve({ gate: 'desirability' });

  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMock();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = createMockRequest({ method: 'DELETE' });
    const response = await DELETE(request, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('should reset policy to defaults successfully', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockEq.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const request = createMockRequest({ method: 'DELETE' });
    const response = await DELETE(request, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.policy.isCustom).toBe(false);
    expect(json.message).toBe('Gate policy reset to defaults');
  });
});
