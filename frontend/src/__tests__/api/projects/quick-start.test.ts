/**
 * Tests for Quick Start API endpoint - validation_runs creation (C4 fix)
 *
 * Verifies that when Modal kickoff succeeds, the product app UPDATEs
 * Modal's existing row instead of INSERTing a duplicate.
 * @story US-F01, US-F07
 */

import { NextRequest } from 'next/server';

// =============================================================================
// MOCKS
// =============================================================================

// Mock NextResponse.json
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
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

// Track Supabase calls per table
const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
const mockInsertSelectSingle = jest.fn().mockResolvedValue({
  data: { id: 'test-project-id' },
  error: null,
});
const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSelectSingle });
const mockInsert = jest.fn().mockReturnValue({
  select: mockInsertSelect,
});

const supabaseCalls: { table: string; method: string; args: any }[] = [];

const mockFrom = jest.fn().mockImplementation((table: string) => {
  return {
    insert: (...args: any[]) => {
      supabaseCalls.push({ table, method: 'insert', args });
      return mockInsert(...args);
    },
    update: (...args: any[]) => {
      supabaseCalls.push({ table, method: 'update', args });
      return mockUpdate(...args);
    },
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    upsert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
      }),
    }),
  };
});

const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'test-user-id' } },
  error: null,
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
    rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
  })),
}));

// Track Modal kickoff
let mockModalKickoffResult: { run_id: string; status: string; message: string } | null = null;
let mockModalKickoffError: Error | null = null;

jest.mock('@/lib/crewai/modal-client', () => ({
  createModalClient: jest.fn(() => ({
    kickoff: jest.fn().mockImplementation(async () => {
      if (mockModalKickoffError) throw mockModalKickoffError;
      return mockModalKickoffResult || { run_id: 'modal-run-id', status: 'started', message: 'OK' };
    }),
  })),
  mockQuickStartKickoff: jest.fn(async () => ({
    run_id: 'mock-run-id',
    status: 'started',
    message: 'Mock kickoff',
  })),
  isModalMockEnabled: jest.fn(() => false),
  isQuickStartRequest: jest.fn(() => true),
}));

// Import after mocks
import { POST } from '@/app/api/projects/quick-start/route';

// =============================================================================
// HELPERS
// =============================================================================

function createQuickStartRequest(body: Record<string, unknown>): NextRequest {
  return {
    url: 'http://localhost:3000/api/projects/quick-start',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => body,
  } as unknown as NextRequest;
}

// =============================================================================
// TESTS
// =============================================================================

describe('Quick Start - validation_runs creation (C4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabaseCalls.length = 0;
    mockModalKickoffResult = { run_id: 'modal-run-id', status: 'started', message: 'OK' };
    mockModalKickoffError = null;

    // Default: project insert succeeds
    mockInsertSelectSingle.mockResolvedValue({
      data: { id: 'test-project-id' },
      error: null,
    });
  });

  it('calls UPDATE on validation_runs when modalKickoffSucceeded', async () => {
    mockModalKickoffResult = { run_id: 'modal-run-id', status: 'started', message: 'OK' };
    mockModalKickoffError = null;

    const req = createQuickStartRequest({
      raw_idea: 'AI-powered logistics platform for small businesses',
    });

    await POST(req);

    // Find validation_runs calls
    const runsCalls = supabaseCalls.filter(c => c.table === 'validation_runs');

    // Should have an UPDATE, not an INSERT
    const updateCalls = runsCalls.filter(c => c.method === 'update');
    const insertCalls = runsCalls.filter(c => c.method === 'insert');

    expect(updateCalls.length).toBe(1);
    expect(insertCalls.length).toBe(0);
  });

  it('calls INSERT on validation_runs when modalKickoffSucceeded is false', async () => {
    mockModalKickoffError = new Error('Modal unavailable');

    const req = createQuickStartRequest({
      raw_idea: 'AI-powered logistics platform for small businesses',
    });

    await POST(req);

    // Find validation_runs calls
    const runsCalls = supabaseCalls.filter(c => c.table === 'validation_runs');

    // Should have an INSERT, not an UPDATE
    const updateCalls = runsCalls.filter(c => c.method === 'update');
    const insertCalls = runsCalls.filter(c => c.method === 'insert');

    expect(insertCalls.length).toBe(1);
    expect(updateCalls.length).toBe(0);
  });

  it('UPDATE targets .eq("id", runId) for Modal-created row', async () => {
    mockModalKickoffResult = { run_id: 'specific-modal-run-id', status: 'started', message: 'OK' };

    const req = createQuickStartRequest({
      raw_idea: 'AI-powered logistics platform for small businesses',
    });

    await POST(req);

    // Verify .eq was called with 'id' and the Modal run_id
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'specific-modal-run-id');
  });
});
