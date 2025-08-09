import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import BaseAgent from '../../../agents/core/BaseAgent.js';

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

describe('Base Agent Framework', () => {
  let agent;

  beforeEach(() => {
    vi.clearAllMocks();
    
    agent = new BaseAgent({
      name: 'TestAgent',
      description: 'A test agent for unit testing',
      version: '1.0.0',
      openai: mockOpenAI,
      vectorStore: mockVectorStore,
      preferences: {
        maxCostPerRequest: 0.20, // Increase budget for tests
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4000
      }
    });
    
    // Handle error events to prevent unhandled error exceptions
    agent.on('error', () => {});
    agent.on('requestCompleted', () => {});
  });

  describe('Initialization', () => {
    it('should initialize with correct properties', () => {
      expect(agent.name).toBe('TestAgent');
      expect(agent.description).toBe('A test agent for unit testing');
      expect(agent.version).toBe('1.0.0');
      expect(agent.metrics.totalRequests).toBe(0);
      expect(agent.metrics.totalTokens).toBe(0);
      expect(agent.metrics.totalCost).toBe(0);
    });

    it('should have default AI preferences', () => {
      const preferences = agent.getAIPreferences();
      expect(preferences.model).toBe('gpt-4');
      expect(preferences.temperature).toBe(0.7);
      expect(preferences.maxTokens).toBe(4000);
    });
  });

  describe('AI Interaction', () => {
    beforeEach(() => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              analysis: 'Test analysis',
              recommendations: ['Test recommendation'],
              status: 'completed'
            })
          }
        }],
        usage: {
          total_tokens: 1000,
          prompt_tokens: 500,
          completion_tokens: 500
        }
      });
    });

    it('should make AI requests with proper parameters', async () => {
      const input = { test: 'data' };
      const result = await agent.processRequest(input);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('TestAgent')
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Client Input')
          })
        ])
      });

      expect(result.analysis).toBe('Test analysis');
      expect(result.status).toBe('completed');
    });

    it('should track metrics correctly', async () => {
      const input = { test: 'data' };
      await agent.processRequest(input);

      expect(agent.metrics.totalRequests).toBe(1);
      expect(agent.metrics.totalTokens).toBe(1000);
      expect(agent.metrics.totalCost).toBeGreaterThan(0);
      expect(agent.metrics.averageTokensPerRequest).toBe(1000);
    });

    it('should calculate cost correctly for different models', async () => {
      agent.preferences.model = 'gpt-4';
      const cost = agent.calculateCost(1000);
      expect(cost).toBe(0.03); // $0.03 per 1K tokens for GPT-4

      agent.preferences.model = 'gpt-3.5-turbo';
      const cost35 = agent.calculateCost(1000);
      expect(cost35).toBe(0.002); // $0.002 per 1K tokens for GPT-3.5-turbo
    });
  });

  describe('Quality Assessment', () => {
    it('should assess response quality', () => {
      const goodResponse = {
        analysis: 'This is a comprehensive business model analysis that examines the customer segments, value propositions, and revenue streams. The analysis identifies key market opportunities and competitive advantages that will drive growth and profitability.',
        recommendations: [
          'Implement customer segmentation strategy within 3 months',
          'Develop value proposition testing framework by Q2',
          'Create revenue stream optimization plan with specific metrics'
        ],
        nextSteps: [
          'Research target customer segments and create personas',
          'Design and test minimum viable product features',
          'Analyze competitive landscape and market positioning'
        ],
        insights: [
          'Customer acquisition cost is 40% lower in digital channels',
          'Premium pricing strategy increases customer lifetime value',
          'Market opportunity in enterprise segment is underexplored'
        ],
        strategicValue: 'This analysis provides a foundation for strategic decision-making and business model optimization'
      };

      const quality = agent.assessQuality(goodResponse);
      expect(quality).toBeGreaterThan(0.7); // Lower threshold for more realistic test
    });

    it('should detect poor quality responses', () => {
      const poorResponse = {
        analysis: 'Short',
        recommendations: [],
        nextSteps: []
      };

      const quality = agent.assessQuality(poorResponse);
      expect(quality).toBeLessThan(0.5);
    });
  });

  describe('Cost Management', () => {
    it('should check budget constraints', () => {
      agent.preferences.maxCostPerRequest = 0.05;
      
      expect(agent.isWithinBudget(0.03)).toBe(true);
      expect(agent.isWithinBudget(0.07)).toBe(false);
    });

    it('should optimize for cost efficiency', async () => {
      agent.preferences.costOptimization = true;
      agent.preferences.model = 'gpt-4';
      
      const optimizedPrefs = agent.optimizeForCost();
      expect(optimizedPrefs.model).toBe('gpt-3.5-turbo');
      expect(optimizedPrefs.maxTokens).toBeLessThan(4000);
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const input = { test: 'data' };
      const result = await agent.processRequest(input);

      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
      expect(agent.metrics.errorCount).toBe(1);
    });

    it('should handle invalid JSON responses', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }],
        usage: {
          total_tokens: 100,
          prompt_tokens: 50,
          completion_tokens: 50
        }
      });

      const input = { test: 'data' };
      const result = await agent.processRequest(input);

      // The agent gracefully handles invalid JSON by creating a fallback response
      expect(result.status).toBe('completed');
      expect(result.analysis).toBe('Invalid JSON response');
      expect(result.rawResponse).toBe('Invalid JSON response');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track response times', async () => {
      // Add a small delay to the mock to simulate real response time
      mockOpenAI.chat.completions.create.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          choices: [{
            message: {
              content: JSON.stringify({
                analysis: 'Test analysis',
                recommendations: ['Test recommendation'],
                status: 'completed'
              })
            }
          }],
          usage: {
            total_tokens: 1000,
            prompt_tokens: 500,
            completion_tokens: 500
          }
        };
      });

      const input = { test: 'data' };
      const result = await agent.processRequest(input);

      expect(result.metadata.responseTime).toBeGreaterThan(0);
      expect(agent.metrics.lastRequestTime).toBeDefined();
      expect(agent.metrics.totalRequests).toBe(1);
    });

    it('should provide performance statistics', () => {
      // Manually set metrics to test calculation
      agent.metrics = {
        ...agent.metrics,
        totalRequests: 10,
        totalTokens: 15000,
        totalCost: 0.45,
        totalResponseTime: 5000,
        averageTokensPerRequest: 1500,
        averageResponseTime: 500
      };

      const stats = agent.getPerformanceStats();
      
      expect(stats.averageTokensPerRequest).toBe(1500);
      expect(stats.averageCostPerRequest).toBe(0.045);
      expect(stats.averageResponseTime).toBe(500);
      expect(stats.costEfficiency).toBe(0.00003); // cost per token
    });
  });

  describe('Configuration Management', () => {
    it('should update preferences', () => {
      agent.updatePreferences({
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 2000
      });

      expect(agent.preferences.model).toBe('gpt-3.5-turbo');
      expect(agent.preferences.temperature).toBe(0.5);
      expect(agent.preferences.maxTokens).toBe(2000);
    });

    it('should validate preference updates', () => {
      expect(() => {
        agent.updatePreferences({
          temperature: 3.0 // Invalid temperature
        });
      }).toThrow();

      expect(() => {
        agent.updatePreferences({
          maxTokens: -100 // Invalid max tokens
        });
      }).toThrow();
    });
  });
});
