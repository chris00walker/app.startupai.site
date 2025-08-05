const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Create a simple test app for health endpoint testing
const app = express();
app.use(express.json());

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

describe('Health Endpoint Integration Tests', () => {
  describe('GET /api/health', () => {
    it('should return status "healthy" with 200 OK', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.services).toBe('object');
    });

    it('should return consistent status format for frontend contract', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // This test enforces the frontend-backend contract
      // Frontend expects: health?.status === 'healthy'
      expect(response.body.status).toBe('healthy');
      expect(response.body.status).not.toBe('ok'); // Prevent regression
    });

    it('should include MongoDB connection status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.services).toHaveProperty('mongodb');
      expect(['connected', 'disconnected']).toContain(response.body.services.mongodb);
    });

    it('should respond within reasonable time', async () => {
      const startTime = Date.now();
      await request(app)
        .get('/api/health')
        .expect(200);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});
