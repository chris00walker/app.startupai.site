import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import DatabaseTestHelper from '../../utils/testHelpers.js';
import mongoose from 'mongoose';
import EnhancedClient from '../../../models/enhancedClientModel.js';

describe('Enhanced Client Model', () => {
  beforeEach(async () => {
    await DatabaseTestHelper.connect();
  });

  afterEach(async () => {
    await DatabaseTestHelper.disconnect();
  });

  describe('Schema Validation', () => {
    it('should create a client with enhanced AI features', async () => {
      const clientData = {
        name: 'Test Company',
        email: 'test@company.com',
        company: 'Test Corp',
        industry: 'Technology',
        description: 'A test company for AI consulting',
        preferences: {
          aiModel: 'gpt-4',
          maxTokensPerRequest: 4000,
          temperature: 0.7,
          costBudget: 100.00
        },
        strategyzerProfiles: {
          valueProposition: {
            customerJobs: ['Increase efficiency', 'Reduce costs'],
            customerPains: ['Manual processes', 'High operational costs'],
            customerGains: ['Automation', 'Cost savings']
          },
          businessModel: {
            keyPartners: ['Tech vendors', 'Consultants'],
            keyActivities: ['Software development', 'Consulting'],
            valuePropositions: ['AI automation', 'Process optimization']
          }
        }
      };

      const client = new EnhancedClient(clientData);
      const savedClient = await client.save();

      expect(savedClient._id).toBeDefined();
      expect(savedClient.name).toBe('Test Company');
      expect(savedClient.preferences.aiModel).toBe('gpt-4');
      expect(savedClient.strategyzerProfiles.valueProposition.customerJobs).toHaveLength(2);
      expect(savedClient.aiMetrics.totalTokensUsed).toBe(0);
      expect(savedClient.aiMetrics.totalCost).toBe(0);
    });

    it('should validate required fields', async () => {
      const client = new EnhancedClient({});
      
      await expect(client.save()).rejects.toThrow();
    });

    it('should track AI usage metrics', async () => {
      const client = new EnhancedClient({
        name: 'Metrics Test',
        email: 'metrics@test.com',
        company: 'Metrics Corp',
        industry: 'Testing'
      });

      await client.save();

      // Test updateAIMetrics method
      await client.updateAIMetrics(1000, 0.02, 'gpt-4');
      
      expect(client.aiMetrics.totalTokensUsed).toBe(1000);
      expect(client.aiMetrics.totalCost).toBe(0.02);
      expect(client.aiMetrics.requestCount).toBe(1);
      expect(client.aiMetrics.averageTokensPerRequest).toBe(1000);
    });

    it('should manage workflow tracking', async () => {
      const client = new EnhancedClient({
        name: 'Workflow Test',
        email: 'workflow@test.com',
        company: 'Workflow Corp',
        industry: 'Testing'
      });

      await client.save();

      // Test workflow status update
      await client.updateWorkflowStatus('valueProposition', 'in-progress', {
        agentId: 'vpc-agent-001',
        startTime: new Date()
      });

      expect(client.workflowTracking.valueProposition.status).toBe('in-progress');
      expect(client.workflowTracking.valueProposition.results.agentId).toBe('vpc-agent-001');
    });
  });

  describe('Business Logic Methods', () => {
    let client;

    beforeEach(async () => {
      client = new EnhancedClient({
        name: 'Business Logic Test',
        email: 'business@test.com',
        company: 'Business Corp',
        industry: 'Testing',
        preferences: {
          costBudget: 50.00
        }
      });
      await client.save();
    });

    it('should check if within cost budget', () => {
      expect(client.isWithinCostBudget(25.00)).toBe(true);
      expect(client.isWithinCostBudget(75.00)).toBe(false);
    });

    it('should get AI preferences with defaults', () => {
      const preferences = client.getAIPreferences();
      expect(preferences.aiModel).toBe('gpt-4');
      expect(preferences.temperature).toBe(0.7);
      expect(preferences.maxTokensPerRequest).toBe(4000);
    });

    it('should calculate cost efficiency', async () => {
      await client.updateAIMetrics(2000, 0.04, 'gpt-4');
      await client.updateAIMetrics(1500, 0.03, 'gpt-4');
      
      const efficiency = client.calculateCostEfficiency();
      expect(efficiency.averageCostPerToken).toBeCloseTo(0.00002);
      expect(efficiency.totalRequests).toBe(2);
    });
  });
});
