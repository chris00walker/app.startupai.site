/**
 * Mock Data Module
 *
 * Provides mock data generation for trial users.
 * @story US-CT01, US-CT02
 */

export { createMockClientsForTrial, handleMockClientsOnUpgrade } from './create-mock-clients';
export { MOCK_CLIENTS, MOCK_CLIENT_1, MOCK_CLIENT_2 } from './consultant-trial-clients';
export type { MockClientData } from './consultant-trial-clients';
