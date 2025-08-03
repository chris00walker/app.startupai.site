/**
 * Test-Driven Development Suite for Strategyzer AI Architecture
 * 
 * This test suite validates the implementation of the Strategyzer AI Architecture
 * as defined in docs/STRATEGYZER_AI_ARCHITECTURE.md
 * 
 * Test Categories:
 * 1. System Connectivity & Health
 * 2. Multi-Agent Workflow Execution
 * 3. Strategyzer Framework Implementation
 * 4. MongoDB AI-Enhanced Schema
 * 5. Visual Canvas Generation
 */

const axios = require('axios');

const BASE_URL = 'http://34.27.49.185:4000/api';
const FRONTEND_URL = 'http://34.27.49.185:3000';

describe('Strategyzer AI Architecture - TDD Suite', () => {
  
  // Test 1: System Health & Connectivity
  describe('System Health & Connectivity', () => {
    test('Backend API should be healthy', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.services.mongodb).toBe('connected');
      expect(response.data.services.milvus).toBe('connected');
    });

    test('Frontend should be accessible', async () => {
      const response = await axios.get(FRONTEND_URL);
      expect(response.status).toBe(200);
    });

    test('API endpoints should be accessible from frontend', async () => {
      const response = await axios.get(`${BASE_URL}/clients`);
      expect(response.status).toBe(200);
      expect(response.data.clients).toBeDefined();
    });
  });

  // Test 2: Multi-Agent Workflow Execution
  describe('Multi-Agent Workflow Execution', () => {
    let testClientId;

    beforeAll(async () => {
      // Create a test client for workflow testing
      const clientData = {
        name: 'TDD Test Client',
        email: 'tdd@test.com',
        company: 'TDD Test Company',
        industry: 'Technology',
        description: 'Test client for TDD validation',
        businessModel: 'B2B SaaS',
        targetMarket: 'Enterprise',
        currentChallenges: ['Market validation', 'Product-market fit'],
        goals: ['Validate business model', 'Scale operations']
      };

      const response = await axios.post(`${BASE_URL}/clients`, clientData);
      testClientId = response.data.client._id;
    });

    test('Discovery workflow should execute successfully', async () => {
      const response = await axios.post(`${BASE_URL}/clients/${testClientId}/discovery`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('completed');
      expect(response.data.result).toBeDefined();
      
      // Validate Strategyzer framework elements
      const result = response.data.result;
      expect(result.analysis).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.nextSteps).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    test('Validation workflow should execute successfully', async () => {
      const response = await axios.post(`${BASE_URL}/clients/${testClientId}/validation`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('completed');
      expect(response.data.result).toBeDefined();
    });

    test('Scale workflow should execute successfully', async () => {
      const response = await axios.post(`${BASE_URL}/clients/${testClientId}/scale`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('completed');
      expect(response.data.result).toBeDefined();
    });

    afterAll(async () => {
      // Clean up test client
      if (testClientId) {
        await axios.delete(`${BASE_URL}/clients/${testClientId}`);
      }
    });
  });

  // Test 3: Strategyzer Framework Implementation
  describe('Strategyzer Framework Implementation', () => {
    test('Discovery workflow should implement Value Proposition Design framework', async () => {
      const clientData = {
        name: 'Strategyzer Test Client',
        email: 'strategyzer@test.com',
        company: 'Strategyzer Test Co',
        industry: 'Technology',
        description: 'Testing Strategyzer framework implementation'
      };

      const clientResponse = await axios.post(`${BASE_URL}/clients`, clientData);
      const clientId = clientResponse.data.client._id;

      const workflowResponse = await axios.post(`${BASE_URL}/clients/${clientId}/discovery`);
      const result = workflowResponse.data.result;

      // Validate Strategyzer elements are present
      expect(result.analysis).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.nextSteps).toBeInstanceOf(Array);
      expect(result.insights).toBeInstanceOf(Array);

      // Clean up
      await axios.delete(`${BASE_URL}/clients/${clientId}`);
    });

    test('Artefacts should be stored with AI-enhanced metadata', async () => {
      const clients = await axios.get(`${BASE_URL}/clients`);
      const clientWithArtefacts = clients.data.clients.find(c => 
        c.workflowStatus?.discovery?.status === 'completed'
      );

      if (clientWithArtefacts) {
        const artefactsResponse = await axios.get(`${BASE_URL}/clients/${clientWithArtefacts._id}/artefacts`);
        
        expect(artefactsResponse.status).toBe(200);
        expect(artefactsResponse.data.artefacts).toBeInstanceOf(Array);
        
        if (artefactsResponse.data.artefacts.length > 0) {
          const artefact = artefactsResponse.data.artefacts[0];
          expect(artefact.metadata).toBeDefined();
          expect(artefact.content).toBeDefined();
          expect(artefact.agentId).toBeDefined();
          expect(artefact.type).toBeDefined();
        }
      }
    });
  });

  // Test 4: MongoDB AI-Enhanced Schema
  describe('MongoDB AI-Enhanced Schema', () => {
    test('Client schema should support AI workflow tracking', async () => {
      const response = await axios.get(`${BASE_URL}/clients`);
      const clients = response.data.clients;
      
      expect(clients).toBeInstanceOf(Array);
      
      if (clients.length > 0) {
        const client = clients[0];
        
        // Validate AI-enhanced schema fields
        expect(client.workflowStatus).toBeDefined();
        expect(client.workflowStatus.discovery).toBeDefined();
        expect(client.workflowStatus.validation).toBeDefined();
        expect(client.workflowStatus.scale).toBeDefined();
        
        expect(client.metrics).toBeDefined();
        expect(client.metrics.totalTasks).toBeDefined();
        expect(client.metrics.completedTasks).toBeDefined();
        expect(client.metrics.lastActivity).toBeDefined();
      }
    });

    test('Artefacts should use AI-optimized schema', async () => {
      const clients = await axios.get(`${BASE_URL}/clients`);
      const clientWithArtefacts = clients.data.clients.find(c => 
        c.workflowStatus?.discovery?.status === 'completed'
      );

      if (clientWithArtefacts) {
        const artefactsResponse = await axios.get(`${BASE_URL}/clients/${clientWithArtefacts._id}/artefacts`);
        
        if (artefactsResponse.data.artefacts.length > 0) {
          const artefact = artefactsResponse.data.artefacts[0];
          
          // Validate AI-optimized schema
          expect(artefact.agentId).toBeDefined();
          expect(artefact.type).toBeDefined();
          expect(artefact.status).toBeDefined();
          expect(artefact.metadata).toBeDefined();
          expect(artefact.createdBy).toBeDefined();
          expect(artefact.createdAt).toBeDefined();
        }
      }
    });
  });

  // Test 5: System Performance & Reliability
  describe('System Performance & Reliability', () => {
    test('API response times should be acceptable', async () => {
      const start = Date.now();
      await axios.get(`${BASE_URL}/health`);
      const responseTime = Date.now() - start;
      
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });

    test('System should handle concurrent requests', async () => {
      const promises = Array(5).fill().map(() => 
        axios.get(`${BASE_URL}/health`)
      );
      
      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.status).toBe('healthy');
      });
    });
  });
});

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
