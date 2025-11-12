/**
 * Tests for CrewAI status polling endpoint
 */

import { GET } from '@/app/api/crewai/status/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}));

jest.mock('@/lib/crewai/client', () => ({
  getCrewAIStatus: jest.fn(),
}));

describe('GET /api/crewai/status', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return 400 if kickoff_id is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/crewai/status');

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('kickoff_id required');
  });

  it('should return 401 if user is not authenticated', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const mockSupabase = createClient();
    jest.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    } as any);

    const req = new NextRequest(
      'http://localhost:3000/api/crewai/status?kickoff_id=test-123'
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return status for valid authenticated request', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { getCrewAIStatus } = await import('@/lib/crewai/client');

    const mockSupabase = createClient();
    jest.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    jest.mocked(getCrewAIStatus).mockResolvedValue({
      state: 'RUNNING',
      status: 'Processing...',
      progress: 0.5,
    });

    const req = new NextRequest(
      'http://localhost:3000/api/crewai/status?kickoff_id=test-123'
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.state).toBe('RUNNING');
    expect(data.progress).toBeGreaterThan(0);
  });

  it('should calculate progress correctly for running state', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { getCrewAIStatus } = await import('@/lib/crewai/client');

    const mockSupabase = createClient();
    jest.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    jest.mocked(getCrewAIStatus).mockResolvedValue({
      state: 'COMPLETED',
      status: 'Done',
    });

    const req = new NextRequest(
      'http://localhost:3000/api/crewai/status?kickoff_id=test-123'
    );

    const response = await GET(req);
    const data = await response.json();

    expect(data.progress).toBe(100);
  });
});
