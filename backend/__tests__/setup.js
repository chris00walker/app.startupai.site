import { config } from 'dotenv';
import { vi } from 'vitest';

// Load environment variables for testing
config({ path: '.env.test' });

// Set CI environment variables
if (process.env.CI) {
  process.env.NODE_ENV = 'test';
  process.env.USE_EXTERNAL_MONGO = '1';
  process.env.MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_TEST_URI;
}

// Global test setup
beforeAll(async () => {
  // Increase timeout for CI environment
  if (process.env.CI) {
    console.log('Running in CI environment - using external MongoDB');
  }
});

afterAll(async () => {
  // Cleanup handled by individual test files
});

// Mock external services for unit tests
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

// Global error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});