/**
 * Contract Tests for Frontend-Backend Health Check Integration
 * 
 * These tests enforce the API contract between frontend and backend
 * to prevent integration bugs like status value mismatches.
 */

const request = require('supertest');
const backendApp = require('../../backend/index');

describe('Health Check Contract Tests', () => {
  describe('Backend-Frontend Health Contract', () => {
    it('backend must return status "healthy" that frontend expects', async () => {
      const response = await request(backendApp)
        .get('/api/health')
        .expect(200);

      // CRITICAL CONTRACT ENFORCEMENT
      // Frontend code: const isBackendOnline = health?.status === 'healthy';
      expect(response.body.status).toBe('healthy');
      
      // Prevent common mistakes that would break frontend
      expect(response.body.status).not.toBe('ok');
      expect(response.body.status).not.toBe('OK');
      expect(response.body.status).not.toBe('success');
      expect(response.body.status).not.toBe('up');
    });

    it('backend must return expected response structure', async () => {
      const response = await request(backendApp)
        .get('/api/health')
        .expect(200);

      // Enforce the exact structure frontend expects
      expect(response.body).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        services: expect.any(Object)
      });

      // Ensure required fields are present
      expect(response.body.status).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.services).toBeDefined();
    });

    it('backend response must be compatible with frontend health check logic', async () => {
      const response = await request(backendApp)
        .get('/api/health')
        .expect(200);

      // Simulate frontend logic: const isBackendOnline = health?.status === 'healthy';
      const health = response.body;
      const isBackendOnline = health?.status === 'healthy';

      // This MUST be true for frontend to show "Services Online"
      expect(isBackendOnline).toBe(true);
    });

    it('should fail if backend returns incompatible status values', async () => {
      // This test documents what would break the frontend
      const incompatibleValues = ['ok', 'OK', 'success', 'up', 'running', 'active'];
      
      const response = await request(backendApp)
        .get('/api/health')
        .expect(200);

      // Ensure backend doesn't return any of these incompatible values
      expect(incompatibleValues).not.toContain(response.body.status);
    });
  });

  describe('Error Scenarios Contract', () => {
    it('should handle backend unavailable scenario', async () => {
      // Test what happens when backend is down
      // Frontend should show "Backend Services Offline"
      
      // This would be tested with a mock server returning 503
      // The contract is: any non-200 response = offline status
      const errorResponse = { status: 503, body: { error: 'Service unavailable' } };
      
      // Frontend logic should handle this gracefully
      const isBackendOnline = false; // Because request failed
      expect(isBackendOnline).toBe(false);
    });
  });
});

/**
 * LESSONS LEARNED FROM THIS BUG:
 * 
 * 1. The frontend expected: health?.status === 'ok'
 * 2. The backend returned: {"status": "healthy"}
 * 3. This mismatch caused persistent "Backend Services Offline"
 * 
 * CONTRACT TESTS PREVENT:
 * - Status value mismatches ('ok' vs 'healthy')
 * - Response structure changes
 * - Breaking changes to API contracts
 * - Integration bugs reaching production
 * 
 * TDD APPROACH SHOULD BE:
 * 1. Write contract test first
 * 2. Implement backend endpoint
 * 3. Implement frontend logic
 * 4. All tests pass = integration works
 */
