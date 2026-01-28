/**
 * Client Dashboard Component Integration Test
 *
 * SKIPPED: Complex components with many nested dependencies and
 * Supabase subscriptions are better tested via E2E tests (Playwright).
 *
 * The ClientPage component involves:
 * - Multiple data fetching hooks (useQuery)
 * - Many child components (KanbanBoard, AgentStatus, etc.)
 * - Complex Supabase Realtime subscriptions
 * - Router state and navigation
 *
 * Jest/jsdom limitations make this brittle to test:
 * - NextRequest doesn't work in jsdom environment
 * - Module-level mock hoisting causes initialization errors
 * - Subscription cleanup is difficult to verify
 *
 * E2E tests (Playwright) provide more reliable coverage by testing
 * the full stack with mocked API responses.
 *
 * See: tests/e2e/client-dashboard.spec.ts
 *
 * @story US-F03, US-F04
 */

describe.skip('Client Dashboard Component', () => {
  it('complex components tested via E2E - see tests/e2e/client-dashboard.spec.ts', () => {
    // This file documents WHY we use E2E for complex components.
    // The actual tests are in Playwright - run: pnpm test:e2e
    expect(true).toBe(true);
  });
});
