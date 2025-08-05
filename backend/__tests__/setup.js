// Global test setup for Vitest
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DatabaseTestHelper } from './utils/testHelpers.js';

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  try {
    const dotenv = await import('dotenv');
    dotenv.config({ path: '../.env.test' });
  } catch (error) {
    console.log('No .env.test file found, using environment variables');
  }
}

// Validate critical environment variables
console.log('Test environment validation:');
console.log('- USE_EXTERNAL_MONGO:', process.env.USE_EXTERNAL_MONGO);
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '***configured***' : '***missing***');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- CI environment:', !!process.env.CI);

// Validate MongoDB URI format
if (process.env.USE_EXTERNAL_MONGO === '1' && !process.env.MONGODB_URI) {
  console.error('ERROR: USE_EXTERNAL_MONGO=1 but MONGODB_URI is not provided');
  throw new Error('MONGODB_URI required for external MongoDB');
}

// Global test setup
beforeAll(async () => {
  console.log('Starting global test setup...');
  try {
    await DatabaseTestHelper.connect();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
});

afterAll(async () => {
  console.log('Starting global test teardown...');
  try {
    await DatabaseTestHelper.disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
  }
});

beforeEach(async () => {
  try {
    await DatabaseTestHelper.clearDatabase();
    console.log('✅ Database cleared for test');
  } catch (error) {
    console.error('❌ Database clear failed:', error.message);
  }
});

// Global error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock external services globally
vi.mock('../services/externalServices.js', () => ({
  sendNotification: vi.fn(),
  logEvent: vi.fn(),
  trackMetric: vi.fn()
}));

// Ensure all async operations complete
global.afterEach(async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
});