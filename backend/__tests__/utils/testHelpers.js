// Backend test utilities and helpers
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { vi } from 'vitest';


// Database test utilities
export class DatabaseTestHelper {
  constructor() {
    this.mongoServer = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Use external MongoDB in CI, memory server locally
      if (process.env.USE_EXTERNAL_MONGO === '1') {
        await mongoose.connect(process.env.MONGODB_URI);
        this.isConnected = true;
        return;
      }
      
      // CI Environment - always use external MongoDB Atlas
      if (process.env.NODE_ENV === 'test' || process.env.CI) {
        await mongoose.connect(process.env.MONGODB_URI);
        this.isConnected = true;
        return;
      }
      
      // Local development - use memory server
      this.mongoServer = await MongoMemoryServer.create();
      const uri = this.mongoServer.getUri();
      await mongoose.connect(uri);
      this.isConnected = true;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.isConnected && mongoose.connection.readyState === 1) {
        // Use safe cleanup approach
        const db = mongoose.connection.db;
        if (db) {
          try {
            await db.dropDatabase();
          } catch (dbError) {
            console.warn('Database cleanup warning:', dbError.message);
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

  async clearDatabase() {
    try {
      // Check if connection is active before clearing
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
      }
      
      // Clear Mongoose connection state to force fresh model registration
      mongoose.connection.models = {};
      
      // Clear any cached model schemas safely
      Object.keys(mongoose.models).forEach(modelName => {
        try {
          delete mongoose.models[modelName];
        } catch (error) {
          console.warn('Model cleanup warning:', error.message);
        }
      });
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

// Database helper instance
export const dbHelper = new DatabaseTestHelper();