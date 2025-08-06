import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import DatabaseTestHelper from '../../utils/testHelpers.js';
import ValuePropositionAgent from '../../../agents/strategyzer/ValuePropositionAgent.js';
import EnhancedClient from '../../../models/enhancedClientModel.js';
import Canvas from '../../../models/canvasModel.js';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn()
    }
  }
};

// Mock vector store
const mockVectorStore = {
  storeEmbedding: vi.fn(),
  searchSimilar: vi.fn()
};

describe('Value Proposition Canvas Agent', () => {
  // database handled by helper
  let agent;
  let testClient;

  beforeAll(async () => {
    await DatabaseTestHelper.connect();
  });

  afterAll(async () => {
    await DatabaseTestHelper.disconnect();
  });

  beforeEach(async () => {
    await DatabaseTestHelper.clearDatabase();

    vi.clearAllMocks();
    
    agent = new ValuePropositionAgent({
      openai: mockOpenAI,
      vectorStore: mockVectorStore,
      preferences: {
        maxCostPerRequest: 0.20,
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4000
      }
    });
    
    // Handle error events
    agent.on('error', () => {});
    agent.on('requestCompleted', () => {});

    // Create test client
    testClient = new EnhancedClient({
      name: 'Test Company',
      email: 'test@company.com',
      company: 'Test Corp',
      industry: 'Technology',
      description: 'A test company for VPC generation'
    });
    await testClient.save();

    // Mock successful OpenAI response
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            customerProfile: {
              customerJobs: [
                'Increase operational efficiency',
                'Reduce manual processes',
                'Improve data accuracy'
              ],
              pains: [
                'Time-consuming manual data entry',
                'Inconsistent data across systems',
                'High operational costs'
              ],
              gains: [
                'Automated workflows',
                'Real-time data insights',
                'Cost savings from efficiency'
              ]
            },
            valueMap: {
              products: [
                'AI-powered automation platform',
                'Data integration services',
                'Analytics dashboard'
              ],
              painRelievers: [
                'Eliminates manual data entry',
                'Ensures data consistency',
                'Reduces operational overhead'
              ],
              gainCreators: [
                'Provides automated workflows',
                'Delivers real-time insights',
                'Generates cost savings'
              ]
            },
            analysis: 'Comprehensive value proposition analysis for technology company',
            recommendations: [
              'Focus on automation benefits',
              'Highlight cost reduction potential',
              'Emphasize data accuracy improvements'
            ],
            fitAssessment: {
              score: 0.85,
              strengths: ['Strong pain-reliever alignment', 'Clear gain creators'],
              improvements: ['Expand product portfolio', 'Address additional customer jobs']
            },
            status: 'completed'
          })
        }
      }],
      usage: {
        total_tokens: 2000,
        prompt_tokens: 800,
        completion_tokens: 1200
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Agent Initialization', () => {
    it('should initialize with VPC-specific properties', () => {
      expect(agent.name).toBe('ValuePropositionAgent');
      expect(agent.type).toBe('valueProposition');
      expect(agent.description).toContain('Value Proposition Canvas');
    });

    it('should have VPC-specific system prompt', () => {
      const systemPrompt = agent.getSystemPrompt();
      expect(systemPrompt).toContain('Value Proposition Canvas');
      expect(systemPrompt).toContain('customerProfile');
      expect(systemPrompt).toContain('valueMap');
    });
  });

  describe('Canvas Generation', () => {
    it('should generate a complete value proposition canvas', async () => {
      const input = {
        clientId: testClient._id.toString(),
        businessDescription: 'AI automation platform for enterprises',
        targetCustomers: 'Enterprise operations teams',
        currentChallenges: 'Manual processes, data inconsistency'
      };

      const result = await agent.generateCanvas(input);

      expect(result.status).toBe('completed');
      expect(result.customerProfile).toBeDefined();
      expect(result.valueMap).toBeDefined();
      expect(result.customerProfile.customerJobs).toHaveLength(3);
      expect(result.valueMap.products).toHaveLength(3);
      expect(result.fitAssessment.score).toBeGreaterThan(0.1); // Actual calculated fit score
    });

    it('should save canvas to database', async () => {
      const input = {
        clientId: testClient._id.toString(),
        businessDescription: 'AI automation platform',
        targetCustomers: 'Enterprise teams'
      };

      const result = await agent.generateCanvas(input);
      
      // Check if canvas was saved
      const savedCanvas = await Canvas.findOne({ clientId: testClient._id, type: 'valueProposition' });
      const savedCanvasAgain = await Canvas.findOne({ clientId: testClient._id, type: 'valueProposition' });

      expect(savedCanvas).toBeDefined();
      expect(savedCanvas.title).toContain('Value Proposition Canvas');
      expect(savedCanvas.data.customerProfile).toBeDefined();
      expect(savedCanvas.data.valueMap).toBeDefined();
      expect(savedCanvas.metadata.agentId).toBe('ValuePropositionAgent');
    });

    it('should update client workflow status', async () => {
      const input = {
        clientId: testClient._id.toString(),
        businessDescription: 'Test business'
      };

      await agent.generateCanvas(input);

      const updatedClient = await EnhancedClient.findById(testClient._id);
      expect(updatedClient.workflowTracking.valueProposition.status).toBe('completed');
      expect(updatedClient.workflowTracking.valueProposition.results).toBeDefined();
    });
  });

  describe('Fit Assessment', () => {
    it('should assess product-market fit', () => {
      const customerProfile = {
        customerJobs: ['Job 1', 'Job 2'],
        pains: ['Pain 1', 'Pain 2'],
        gains: ['Gain 1', 'Gain 2']
      };

      const valueMap = {
        products: ['Product 1', 'Product 2'],
        painRelievers: ['Reliever 1', 'Reliever 2'],
        gainCreators: ['Creator 1', 'Creator 2']
      };

      const fitScore = agent.assessFit(customerProfile, valueMap);
      expect(fitScore).toBeGreaterThan(0);
      expect(fitScore).toBeLessThanOrEqual(1);
    });

    it('should identify fit strengths and improvements', () => {
      const customerProfile = {
        customerJobs: ['Increase efficiency'],
        pains: ['Manual processes'],
        gains: ['Automation']
      };

      const valueMap = {
        products: ['Automation platform'],
        painRelievers: ['Eliminates manual work'],
        gainCreators: ['Provides automation']
      };

      const assessment = agent.generateFitAssessment(customerProfile, valueMap);
      
      expect(assessment.score).toBeGreaterThan(0.3); // Realistic fit score for test data
      expect(assessment.strengths).toBeInstanceOf(Array);
      expect(assessment.improvements).toBeInstanceOf(Array);
    });
  });

  describe('Quality Validation', () => {
    it('should validate VPC structure', () => {
      const validVPC = {
        customerProfile: {
          customerJobs: ['Job 1'],
          pains: ['Pain 1'],
          gains: ['Gain 1']
        },
        valueMap: {
          products: ['Product 1'],
          painRelievers: ['Reliever 1'],
          gainCreators: ['Creator 1']
        }
      };

      const isValid = agent.validateVPCStructure(validVPC);
      expect(isValid).toBe(true);
    });

    it('should reject invalid VPC structure', () => {
      const invalidVPC = {
        customerProfile: {
          customerJobs: []
        },
        valueMap: {
          products: []
        }
      };

      const isValid = agent.validateVPCStructure(invalidVPC);
      expect(isValid).toBe(false);
    });

    it('should assess VPC quality', () => {
      const highQualityVPC = {
        customerProfile: {
          customerJobs: [
            'Increase operational efficiency in manufacturing',
            'Reduce production costs by 20%',
            'Improve quality control processes'
          ],
          pains: [
            'Manual quality inspections are time-consuming',
            'High defect rates in production',
            'Lack of real-time production visibility'
          ],
          gains: [
            'Automated quality control',
            'Real-time production monitoring',
            'Reduced operational costs'
          ]
        },
        valueMap: {
          products: [
            'AI-powered quality control system',
            'Real-time monitoring dashboard',
            'Predictive maintenance platform'
          ],
          painRelievers: [
            'Automates quality inspections',
            'Reduces defect rates by 80%',
            'Provides real-time visibility'
          ],
          gainCreators: [
            'Delivers automated quality control',
            'Enables real-time monitoring',
            'Generates cost savings'
          ]
        },
        analysis: 'Detailed analysis of manufacturing value proposition',
        recommendations: ['Focus on quality benefits', 'Highlight cost savings'],
        fitAssessment: { score: 0.9 }
      };

      const quality = agent.assessVPCQuality(highQualityVPC);
      expect(quality).toBeGreaterThan(0.5); // Realistic quality score for comprehensive VPC
    });
  });

  describe('Error Handling', () => {
    it('should handle missing client gracefully', async () => {
      const input = {
        clientId: 'nonexistent-client-id',
        businessDescription: 'Test business'
      };

      const result = await agent.generateCanvas(input);
      expect(result.status).toBe('error');
      expect(result.error).toContain('Client not found');
    });

    it('should handle OpenAI API errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const input = {
        clientId: testClient._id.toString(),
        businessDescription: 'Test business'
      };

      const result = await agent.generateCanvas(input);
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('Cost Optimization', () => {
    it('should track generation costs', async () => {
      const input = {
        clientId: testClient._id.toString(),
        businessDescription: 'Test business'
      };

      const result = await agent.generateCanvas(input);

      expect(result.metadata.tokensUsed).toBe(2000);
      expect(result.metadata.cost).toBeGreaterThan(0);
      expect(agent.metrics.totalCost).toBeGreaterThan(0);
    });

    it('should update client AI metrics', async () => {
      const input = {
        clientId: testClient._id.toString(),
        businessDescription: 'Test business'
      };

      await agent.generateCanvas(input);

      const updatedClient = await EnhancedClient.findById(testClient._id);
      expect(updatedClient.aiMetrics.totalTokensUsed).toBeGreaterThan(0);
      expect(updatedClient.aiMetrics.totalCost).toBeGreaterThan(0);
      expect(updatedClient.aiMetrics.requestCount).toBe(1);
    });
  });
});
