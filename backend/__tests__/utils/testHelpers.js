// Backend test utilities and helpers
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { vi } from 'vitest';


// Database test utilities
export class DatabaseTestHelper {
  constructor() {
    this.mongoServer = null;
  }

  async connect() {
    if (process.env.USE_EXTERNAL_MONGO === '1') {
      await mongoose.connect(process.env.MONGODB_URI);
      return;
    }
    try {
      this.mongoServer = await MongoMemoryServer.create();
      const uri = this.mongoServer.getUri();
      await mongoose.connect(uri);
    } catch (e) {
      console.warn('MongoMemoryServer failed, falling back to MONGODB_URI', e);
      if (!process.env.MONGODB_URI) throw e;
      await mongoose.connect(process.env.MONGODB_URI);
    }
  }

  async disconnect() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (this.mongoServer) {
      await this.mongoServer.stop();
    }
  }

  async clearDatabase() {
    // Complete database reset for maximum test isolation
    try {
      await mongoose.connection.db.dropDatabase();
      // Database will be automatically recreated on next operation
      
      // Clear Mongoose connection state to force fresh model registration
      mongoose.connection.models = {};
      
      // Clear any cached model schemas
      Object.keys(mongoose.models).forEach(modelName => {
        delete mongoose.models[modelName];
      });
      
    } catch (e) {
      // Fallback to collection-level cleanup if dropDatabase fails
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
        // Drop indexes to ensure clean state between tests
        try {
          await collection.dropIndexes();
        } catch (indexError) {
          // Ignore errors if indexes don't exist
        }
      }
    }
  }
}

// Mock OpenAI API responses
export const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn(() => Promise.resolve({
        choices: [{
          message: {
            content: 'Mock AI response for testing'
          }
        }]
      }))
    }
  }
};

// Mock Milvus vector database
export const mockMilvus = {
  connect: vi.fn(() => Promise.resolve()),
  disconnect: vi.fn(() => Promise.resolve()),
  insert: vi.fn(() => Promise.resolve({ status: 'success' })),
  search: vi.fn(() => Promise.resolve({ results: [] })),
  createCollection: vi.fn(() => Promise.resolve()),
  dropCollection: vi.fn(() => Promise.resolve())
};

// Mock Express request/response objects
export const mockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  headers: {},
  user: { id: 'test-user' },
  ...overrides
});

export const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res;
};

// Mock agent workflow data
export const mockWorkflowData = {
  clientId: 'test-client-123',
  workflowType: 'discovery',
  input: {
    name: 'Test Client',
    email: 'test@example.com',
    projectDescription: 'Test project for agent processing'
  },
  expectedOutput: {
    analysis: 'Mock analysis result',
    recommendations: ['Mock recommendation 1', 'Mock recommendation 2'],
    nextSteps: ['Mock next step 1', 'Mock next step 2']
  }
};

// Test data generators
export const generateTestClient = (overrides = {}) => ({
  id: 'test-client-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Client',
  email: 'test@example.com',
  status: 'active',
  createdAt: new Date(),
  ...overrides
});

export const generateTestTask = (overrides = {}) => ({
  id: 'task-' + Math.random().toString(36).substr(2, 9),
  title: 'Test Task',
  status: 'todo',
  assignedTo: 'TestAgent',
  clientId: 'test-client-123',
  createdAt: new Date(),
  ...overrides
});

export const generateTestArtefact = (overrides = {}) => ({
  id: 'test-artefact-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Artefact',
  type: 'Analysis',
  status: 'completed',
  clientId: 'test-client-123',
  agentId: 'TestAgent',
  content: 'Test artefact content',
  createdAt: new Date(),
  ...overrides
});

// Async test helpers
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const retryUntil = async (condition, maxAttempts = 10, delay = 100) => {
  for (let i = 0; i < maxAttempts; i++) {
    if (await condition()) {
      return true;
    }
    await waitFor(delay);
  }
  throw new Error(`Condition not met after ${maxAttempts} attempts`);
};
