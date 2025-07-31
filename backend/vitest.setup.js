import { vi } from 'vitest';

// Expose vi and jest globals for compatibility
global.vi = vi;
global.jest = vi;
// Provide unstable_mockModule in jest global for ESM module mocking
global.jest.unstable_mockModule = vi.mock;
// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.USE_EXTERNAL_MONGO = '1';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.MILVUS_HOST = 'localhost';
process.env.MILVUS_PORT = '19530';

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock fetch for external API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Global test utilities
global.testUtils = {
  // Mock client data for testing
  mockClient: {
    id: 'test-client-123',
    name: 'Test Client',
    email: 'test@example.com',
    projectDescription: 'Test project description',
  },

  // Mock agent response
  mockAgentResponse: {
    success: true,
    result: 'Test agent result',
    metadata: { processed: true },
  },

  // Mock database document
  mockDocument: {
    _id: 'test-doc-123',
    title: 'Test Document',
    content: 'Test content',
    status: 'active',
  },
};
