// Backend test utilities and helpers
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { vi } from 'vitest';


// Database test utilities
export class DatabaseTestHelper {
  static mongoServer = null;
  static isConnected = false;

  static async connect() {
    // Ensure each test file gets its **own isolated database** so that
    // documents created in one file can never bleed into another (or be
    // accidentally removed by another file’s cleanup).  We achieve this by
    // giving each connection a unique database name that includes the current
    // process id and a high-resolution timestamp.
    const uniqueDbName = `test_${process.pid}_${Date.now()}`;
    try {
      // Use external MongoDB in CI, memory server locally – but always append
      // a **unique database name** so that each test file can run completely
      // independently even when they share the same Atlas cluster.
      if (process.env.USE_EXTERNAL_MONGO === '1' || process.env.CI) {
        const baseUri = process.env.MONGODB_URI;
        if (!baseUri) {
          throw new Error('MONGODB_URI is required when USE_EXTERNAL_MONGO=1 or running in CI');
        }
        const uriWithDb = baseUri.replace(/(\/[\w-]+)(\?.*)?$/, '') + `/${uniqueDbName}`;
        await mongoose.connect(uriWithDb);
        this.isConnected = true;
        return;
      }
      
      // Local development - use memory server
      this.mongoServer = await MongoMemoryServer.create({ instance: { dbName: uniqueDbName }});
      const uri = this.mongoServer.getUri(uniqueDbName);
      await mongoose.connect(uri);
      this.isConnected = true;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      throw error;
    }
  }

  static async disconnect() {
    try {
      if (this.isConnected && mongoose.connection.readyState === 1) {
        // Use safe cleanup approach
        const collections = mongoose.connection.collections;
        for (const key of Object.keys(collections)) {
          try {
            await collections[key].deleteMany({});
          } catch (err) {
            console.warn(`Database cleanup warning [${key}]`, err.message);
          }
        }
        
        try {
          await mongoose.connection.close();
        } catch (closeError) {
          console.warn('Connection close warning:', closeError.message);
        }
      }
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    } finally {
      if (this.mongoServer) {
        try {
          await this.mongoServer.stop();
        } catch (error) {
          console.warn('Mongo server cleanup warning:', error.message);
        }
      }
      this.isConnected = false;
    }
  }

  static async clearDatabase() {
    try {
      if (mongoose.connection.readyState !== 1) return;

      // Delete documents from every collection individually — avoids the
      // asynchronous "DatabaseDropPending" state seen in CI.
      const collections = mongoose.connection.collections;
      for (const key of Object.keys(collections)) {
        try {
          await collections[key].deleteMany({});
        } catch (colErr) {
          console.warn(`Collection cleanup warning [${key}]:`, colErr.message);
        }
      }

      // Do NOT drop the whole database and do NOT purge model definitions.
      // Keeping schema cache intact preserves plugin-attached statics such as
      // Canvas.version() and avoids duplicate-index redefinition warnings.
    } catch (error) {
      console.warn('Database clear warning:', error.message);
    }
  }
}

// Mock utilities for testing
export const createMockResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
});

export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
});

// Test data generators
export const generateTestTask = (overrides = {}) => ({
  title: 'Test Task',
  description: 'Test description',
  status: 'todo',
  priority: 'medium',
  assignedTo: 'TestAgent',
  clientId: 'test-client',
  category: 'research',
  ...overrides,
});

export const generateTestCanvas = (overrides = {}) => ({
  type: 'value-proposition',
  title: 'Test Canvas',
  clientId: 'test-client',
  data: {},
  ...overrides,
});

// Export the DatabaseTestHelper class for static method access
export default DatabaseTestHelper;