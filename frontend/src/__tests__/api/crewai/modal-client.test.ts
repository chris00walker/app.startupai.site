/**
 * Tests for Modal client field translation (C1 fix)
 *
 * Ensures QuickStartKickoffRequest fields are correctly translated
 * to Modal's KickoffRequest schema before sending.
 * @story US-F01, US-F07
 */

import {
  ModalClient,
  type QuickStartKickoffRequest,
  type LegacyKickoffRequest,
} from '@/lib/crewai/modal-client';

// =============================================================================
// SETUP
// =============================================================================

const mockFetch = jest.fn();
global.fetch = mockFetch;

function createClient() {
  return new ModalClient({
    kickoffUrl: 'https://modal.test/kickoff',
    statusUrl: 'https://modal.test/status',
    hitlApproveUrl: 'https://modal.test/hitl/approve',
    authToken: 'test-token',
  });
}

function mockSuccessResponse() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ run_id: 'test-run-id', status: 'started', message: 'OK' }),
  });
}

function getLastFetchBody(): Record<string, unknown> {
  const [, init] = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
  return JSON.parse(init.body);
}

// =============================================================================
// TESTS
// =============================================================================

describe('ModalClient.kickoff field translation', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('translates raw_idea to entrepreneur_input for QuickStartKickoffRequest', async () => {
    mockSuccessResponse();
    const client = createClient();

    const request: QuickStartKickoffRequest = {
      raw_idea: 'AI-powered logistics platform for small businesses',
      project_id: '12345678-1234-4234-8234-123456789012',
      user_id: '12345678-1234-4234-8234-123456789012',
    };

    await client.kickoff(request);

    const body = getLastFetchBody();
    expect(body.entrepreneur_input).toBe('AI-powered logistics platform for small businesses');
    expect(body).not.toHaveProperty('raw_idea');
  });

  it('passes entrepreneur_input through for LegacyKickoffRequest', async () => {
    mockSuccessResponse();
    const client = createClient();

    const request: LegacyKickoffRequest = {
      entrepreneur_input: 'AI-powered logistics platform',
      project_id: '12345678-1234-4234-8234-123456789012',
      user_id: '12345678-1234-4234-8234-123456789012',
    };

    await client.kickoff(request);

    const body = getLastFetchBody();
    expect(body.entrepreneur_input).toBe('AI-powered logistics platform');
  });

  it('concatenates hints and additional_context into conversation_transcript', async () => {
    mockSuccessResponse();
    const client = createClient();

    const request: QuickStartKickoffRequest = {
      raw_idea: 'AI-powered logistics platform for small businesses',
      project_id: '12345678-1234-4234-8234-123456789012',
      user_id: '12345678-1234-4234-8234-123456789012',
      hints: { industry: 'logistics', target_user: 'small businesses' },
      additional_context: 'Focused on last-mile delivery',
    };

    await client.kickoff(request);

    const body = getLastFetchBody();
    expect(body.conversation_transcript).toContain('Hints:');
    expect(body.conversation_transcript).toContain('logistics');
    expect(body.conversation_transcript).toContain('Context: Focused on last-mile delivery');
  });

  it('omits conversation_transcript when hints and additional_context are both absent', async () => {
    mockSuccessResponse();
    const client = createClient();

    const request: QuickStartKickoffRequest = {
      raw_idea: 'AI-powered logistics platform for small businesses',
      project_id: '12345678-1234-4234-8234-123456789012',
      user_id: '12345678-1234-4234-8234-123456789012',
    };

    await client.kickoff(request);

    const body = getLastFetchBody();
    expect(body.conversation_transcript).toBeNull();
  });

  it('sends user_type defaulting to "founder"', async () => {
    mockSuccessResponse();
    const client = createClient();

    const request: QuickStartKickoffRequest = {
      raw_idea: 'AI-powered logistics platform for small businesses',
      project_id: '12345678-1234-4234-8234-123456789012',
      user_id: '12345678-1234-4234-8234-123456789012',
    };

    await client.kickoff(request);

    const body = getLastFetchBody();
    expect(body.user_type).toBe('founder');
  });

  it('does not send client_id or idempotency_key to Modal', async () => {
    mockSuccessResponse();
    const client = createClient();

    const request: QuickStartKickoffRequest = {
      raw_idea: 'AI-powered logistics platform for small businesses',
      project_id: '12345678-1234-4234-8234-123456789012',
      user_id: '12345678-1234-4234-8234-123456789012',
      client_id: 'some-client-id',
    };

    await client.kickoff(request);

    const body = getLastFetchBody();
    expect(body).not.toHaveProperty('client_id');
  });
});
