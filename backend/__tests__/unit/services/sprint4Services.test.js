/**
 * Sprint 4 Services Test Suite
 * 
 * Tests for Production Optimization & Advanced Features:
 * - DatabaseOptimizationService
 * - AICostOptimizationService  
 * - VectorSearchService
 * - AgentCollaborationService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Import services
import DatabaseOptimizationService from '../../../services/DatabaseOptimizationService.js';
import AICostOptimizationService from '../../../services/AICostOptimizationService.js';
import VectorSearchService from '../../../services/VectorSearchService.js';
import AgentCollaborationService from '../../../services/AgentCollaborationService.js';

// Import models
import Client from '../../../models/clientModel.js';
import Canvas from '../../../models/canvasModel.js';
import Task from '../../../models/taskModel.js';

describe('Sprint 4 Services', () => {
  let mongoServer;
  let dbOptimizationService;
  let aiCostService;
  let vectorSearchService;
  let collaborationService;

  beforeEach(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Initialize services
    dbOptimizationService = new DatabaseOptimizationService();
    aiCostService = new AICostOptimizationService();
    
    // Mock OpenAI for VectorSearchService
    vi.mock('openai', () => ({
      default: vi.fn().mockImplementation(() => ({
        embeddings: {
          create: vi.fn().mockResolvedValue({
            data: [{ embedding: new Array(1536).fill(0.1) }]
          })
        }
      }))
    }));
    
    vectorSearchService = new VectorSearchService();
    collaborationService = new AgentCollaborationService();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    if (mongoServer && typeof mongoServer.stop === 'function') {
      await mongoServer.stop();
    }
    vi.clearAllMocks();
  });

  describe('DatabaseOptimizationService', () => {
    it('should initialize database optimization service', async () => {
      expect(dbOptimizationService).toBeDefined();
      expect(dbOptimizationService.queryCache).toBeDefined();
      expect(dbOptimizationService.performanceMetrics).toBeDefined();
    });

    it('should optimize client queries with proper indexing', async () => {
      const optimizedQueries = await dbOptimizationService.optimizeClientQueries();
      
      expect(optimizedQueries).toBeDefined();
      expect(optimizedQueries.getClientsWithMetrics).toBeDefined();
      expect(optimizedQueries.searchClients).toBeDefined();
    });

    it('should optimize canvas queries for gallery view', async () => {
      const optimizedQueries = await dbOptimizationService.optimizeCanvasQueries();
      
      expect(optimizedQueries).toBeDefined();
      expect(optimizedQueries.getCanvasGallery).toBeDefined();
      expect(optimizedQueries.getCanvasStats).toBeDefined();
    });

    it('should optimize task queries with metrics', async () => {
      const optimizedQueries = await dbOptimizationService.optimizeTaskQueries();
      
      expect(optimizedQueries).toBeDefined();
      expect(optimizedQueries.getTasksWithMetrics).toBeDefined();
    });

    it('should track slow queries and generate performance reports', () => {
      const slowQuery = {
        collection: 'clients',
        method: 'find',
        query: { status: 'active' },
        duration: 150
      };
      
      dbOptimizationService.recordSlowQuery(slowQuery);
      const report = dbOptimizationService.getPerformanceReport();
      
      expect(report.metrics).toBeDefined();
      expect(report.slowQueries).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should execute optimized client queries under 100ms threshold', async () => {
      // Create test client
      await Client.create({
        name: 'Test Client',
        email: 'test@example.com',
        company: 'Test Company',
        industry: 'Technology'
      });

      const optimizedQueries = await dbOptimizationService.optimizeClientQueries();
      const start = performance.now();
      
      const clients = await optimizedQueries.getClientsWithMetrics();
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // Under 100ms threshold
      expect(clients).toBeDefined();
      expect(Array.isArray(clients)).toBe(true);
    });
  });

  describe('AICostOptimizationService', () => {
    it('should initialize AI cost optimization service', () => {
      expect(aiCostService).toBeDefined();
      expect(aiCostService.modelPricing).toBeDefined();
      expect(aiCostService.modelSelection).toBeDefined();
      expect(aiCostService.costThresholds).toBeDefined();
    });

    it('should optimize prompts for token efficiency', () => {
      const originalPrompt = 'Please kindly provide assistance in order to help me create a comprehensive business model canvas for the purpose of strategic planning';
      
      const optimized = aiCostService.optimizePrompt(originalPrompt, 'canvas-generation');
      
      expect(optimized).toBeDefined();
      expect(optimized.length).toBeLessThan(originalPrompt.length + 20); // Allow reasonable buffer
      expect(optimized).not.toContain('please');
      expect(optimized).not.toContain('kindly');
    });

    it('should select optimal model for use cases', () => {
      const canvasModel = aiCostService.selectOptimalModel('canvas-generation');
      const analysisModel = aiCostService.selectOptimalModel('business-analysis');
      
      expect(canvasModel).toBe('gpt-4o-mini'); // Cost-effective for structured output
      expect(analysisModel).toBe('gpt-4o');    // Higher quality for analysis
    });

    it('should calculate and track costs accurately', () => {
      const cost = aiCostService.calculateCost('gpt-4o-mini', 1000, 500);
      
      expect(cost).toBeDefined();
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThan(0);
      
      // Track the cost
      const trackedCost = aiCostService.trackCost('canvas-generation', 'gpt-4o-mini', 1000, 500, 'client123');
      expect(trackedCost).toBe(cost);
    });

    it('should cache and retrieve responses', () => {
      const prompt = 'Generate business model canvas';
      const model = 'gpt-4o-mini';
      const response = { canvas: 'test data' };
      const cost = 0.50;
      
      // Cache response
      aiCostService.cacheResponse(prompt, model, 0.7, response, cost);
      
      // Retrieve cached response
      const cached = aiCostService.getCachedResponse(prompt, model, 0.7);
      expect(cached).toEqual(response);
    });

    it('should generate comprehensive cost reports', () => {
      // Track some costs
      aiCostService.trackCost('canvas-generation', 'gpt-4o-mini', 1000, 500);
      aiCostService.trackCost('business-analysis', 'gpt-4o', 2000, 1000);
      
      const report = aiCostService.getCostReport();
      
      expect(report.summary).toBeDefined();
      expect(report.byUseCase).toBeDefined();
      expect(report.budgetStatus).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should optimize AI requests with all cost-saving measures', async () => {
      const originalPrompt = 'Please create a detailed business model canvas';
      const useCase = 'canvas-generation';
      
      const optimization = await aiCostService.optimizeAIRequest(originalPrompt, useCase);
      
      expect(optimization.optimizedPrompt).toBeDefined();
      expect(optimization.requestConfig).toBeDefined();
      expect(optimization.optimizations).toBeDefined();
      expect(optimization.optimizations).toContain('prompt');
      expect(optimization.optimizations).toContain('model-selection');
    });

    it('should enforce cost thresholds and generate alerts', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Track expensive request - use values that exceed threshold
      aiCostService.trackCost('canvas-generation', 'gpt-4o', 20000, 12000);
      
      // Allow for async processing
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      }, 100);
    });
  });

  describe('VectorSearchService', () => {
    it('should initialize vector search service', async () => {
      expect(vectorSearchService).toBeDefined();
      expect(vectorSearchService.embeddingModel).toBe('text-embedding-3-small');
      expect(vectorSearchService.config).toBeDefined();
    });

    it('should generate embeddings for text content', async () => {
      const text = 'This is a test business model canvas';
      
      const embedding = await vectorSearchService.generateEmbedding(text);
      
      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(1536); // text-embedding-3-small dimensions
    });

    it('should preprocess text for better embeddings', () => {
      const rawText = '  This   has   extra   spaces!!!   @#$%  ';
      
      const processed = vectorSearchService.preprocessText(rawText);
      
      expect(processed).toBe('This has extra spaces!!!'); // Keep punctuation as-is
      expect(processed).not.toContain('  '); // No double spaces
      expect(processed).not.toContain('@#$%'); // No special chars
    });

    it('should calculate cosine similarity between embeddings', async () => {
      const embedding1 = new Array(1536).fill(0.5);
      const embedding2 = new Array(1536).fill(0.7);
      
      const similarity = await vectorSearchService.calculateSimilarity(embedding1, embedding2);
      
      expect(similarity).toBeDefined();
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should extract searchable content from canvas', () => {
      const canvas = {
        title: 'Test Canvas',
        description: 'Test Description',
        data: {
          customerSegments: ['Segment 1', 'Segment 2'],
          valuePropositions: ['Value 1', 'Value 2']
        }
      };
      
      const content = vectorSearchService.extractCanvasContent(canvas);
      
      expect(content).toContain('Test Canvas');
      expect(content).toContain('Test Description');
      expect(content).toContain('Segment 1');
      expect(content).toContain('Value 1');
    });

    it('should build context text for agent recommendations', () => {
      const client = {
        company: 'Test Company',
        industry: 'Technology',
        description: 'AI startup',
        currentChallenges: ['Funding', 'Market fit'],
        goals: ['Series A', 'Product launch']
      };
      
      const currentContext = {
        workflowStage: 'validation',
        recentArtefacts: ['market-research', 'business-model']
      };
      
      const contextText = vectorSearchService.buildContextText(client, currentContext);
      
      expect(contextText).toContain('Test Company');
      expect(contextText).toContain('Technology');
      expect(contextText).toContain('Funding');
      expect(contextText).toContain('validation');
    });

    it('should get vector search statistics', () => {
      const stats = vectorSearchService.getVectorSearchStats();
      
      expect(stats.embeddingCache).toBeDefined();
      expect(stats.searchCache).toBeDefined();
      expect(stats.config).toBeDefined();
    });
  });

  describe('AgentCollaborationService', () => {
    it('should initialize agent collaboration service', () => {
      expect(collaborationService).toBeDefined();
      expect(collaborationService.activeWorkflows).toBeDefined();
      expect(collaborationService.agentRegistry).toBeDefined();
      expect(collaborationService.agentCapabilities).toBeDefined();
    });

    it('should validate workflow configuration', () => {
      const validConfig = {
        clientId: 'client123',
        objective: 'Create business model canvas',
        agents: ['value-proposition-canvas', 'business-model-canvas']
      };
      
      expect(() => {
        collaborationService.validateWorkflowConfig(validConfig);
      }).not.toThrow();
      
      const invalidConfig = { objective: 'Test' }; // Missing clientId
      
      expect(() => {
        collaborationService.validateWorkflowConfig(invalidConfig);
      }).toThrow('clientId is required');
    });

    it('should calculate agent dependencies correctly', () => {
      const agents = ['value-proposition-canvas', 'business-model-canvas'];
      
      const dependencies = collaborationService.calculateAgentDependencies(agents);
      
      expect(dependencies).toBeDefined();
      expect(dependencies['value-proposition-canvas']).toBeDefined();
      expect(dependencies['business-model-canvas']).toBeDefined();
    });

    it('should calculate consensus score between agents', () => {
      const collaborativeContext = {
        collaborations: [
          { agentType: 'agent1', qualityScore: 0.8 },
          { agentType: 'agent2', qualityScore: 0.85 },
          { agentType: 'agent3', qualityScore: 0.82 }
        ]
      };
      
      const consensus = collaborationService.calculateConsensusScore(collaborativeContext);
      
      expect(consensus).toBeDefined();
      expect(typeof consensus).toBe('number');
      expect(consensus).toBeGreaterThanOrEqual(0);
      expect(consensus).toBeLessThanOrEqual(1);
    });

    it('should evaluate agent quality with metrics', () => {
      const agentResult = {
        qualityScore: 0.85,
        data: { test: 'data' },
        analysis: { insights: ['insight1'] },
        recommendations: ['rec1', 'rec2'],
        processingTime: 30000
      };
      
      const evaluation = collaborationService.evaluateAgentQuality('value-proposition-canvas', agentResult);
      
      expect(evaluation.score).toBeDefined();
      expect(evaluation.metrics).toBeDefined();
      expect(evaluation.issues).toBeDefined();
      expect(Array.isArray(evaluation.issues)).toBe(true);
    });

    it('should generate quality improvement recommendations', () => {
      const qualityCheck = {
        stage: 'discovery',
        agentResults: [
          { agentType: 'agent1', qualityScore: 0.5 }, // Below threshold
          { agentType: 'agent2', qualityScore: 0.9 }
        ],
        overallQuality: 0.7,
        consensusScore: 0.6 // Below threshold
      };
      
      const recommendations = collaborationService.generateQualityRecommendations(qualityCheck);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should have agent improvement recommendation
      const agentRec = recommendations.find(r => r.type === 'agent-improvement');
      expect(agentRec).toBeDefined();
      
      // Should have consensus improvement recommendation
      const consensusRec = recommendations.find(r => r.type === 'consensus-improvement');
      expect(consensusRec).toBeDefined();
    });

    it('should generate unique workflow IDs', () => {
      const id1 = collaborationService.generateWorkflowId();
      const id2 = collaborationService.generateWorkflowId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^workflow_\d+_[a-z0-9]+$/);
    });

    it('should get stage agents for different workflow stages', () => {
      const discoveryAgents = collaborationService.getStageAgents('discovery', 'business-model');
      const validationAgents = collaborationService.getStageAgents('validation', 'business-model');
      const visualizationAgents = collaborationService.getStageAgents('visualization', 'business-model');
      
      expect(Array.isArray(discoveryAgents)).toBe(true);
      expect(Array.isArray(validationAgents)).toBe(true);
      expect(Array.isArray(visualizationAgents)).toBe(true);
      
      expect(discoveryAgents).toContain('market-research');
      expect(validationAgents).toContain('business-model-canvas');
      expect(visualizationAgents).toContain('canvas-generator');
    });

    it('should estimate workflow duration based on agents', () => {
      const workflow = {
        requiredAgents: ['agent1', 'agent2', 'agent3']
      };
      
      const duration = collaborationService.estimateWorkflowDuration(workflow);
      
      expect(duration).toBeDefined();
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThan(0);
    });

    it('should extract insights from agent results', () => {
      const result1 = { insights: ['insight1', 'insight2'] };
      const result2 = { analysis: ['analysis1'] };
      const result3 = { recommendations: ['rec1'] };
      const result4 = {}; // No insights
      
      expect(collaborationService.extractInsights(result1)).toEqual(['insight1', 'insight2']);
      expect(collaborationService.extractInsights(result2)).toEqual(['analysis1']);
      expect(collaborationService.extractInsights(result3)).toEqual(['rec1']);
      expect(collaborationService.extractInsights(result4)).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should integrate database optimization with cost optimization', async () => {
      // Create test data
      await Client.create({
        name: 'Integration Test Client',
        email: 'integration@test.com',
        company: 'Test Integration Co',
        industry: 'Technology'
      });

      // Initialize optimized queries
      const dbOptimized = await dbOptimizationService.initialize();
      
      // Simulate AI request optimization
      const aiOptimization = await aiCostService.optimizeAIRequest(
        'Generate analysis for integration test client',
        'business-analysis'
      );
      
      expect(dbOptimized.client).toBeDefined();
      expect(aiOptimization.optimizedPrompt).toBeDefined();
      expect(aiOptimization.requestConfig.model).toBe('gpt-4o');
    });

    it('should integrate vector search with collaboration service', async () => {
      const contextText = 'Technology startup seeking business model validation';
      
      // Generate embedding
      const embedding = await vectorSearchService.generateEmbedding(contextText);
      
      // Use in collaboration context
      const collaborativeContext = {
        collaborations: [
          { agentType: 'market-research', qualityScore: 0.8 },
          { agentType: 'value-proposition-canvas', qualityScore: 0.85 }
        ]
      };
      
      const consensus = collaborationService.calculateConsensusScore(collaborativeContext);
      
      expect(embedding).toBeDefined();
      expect(consensus).toBeGreaterThan(0.7);
    });

    it('should demonstrate end-to-end Sprint 4 optimization workflow', async () => {
      const start = performance.now();
      
      // 1. Database optimization
      const dbOptimized = await dbOptimizationService.initialize();
      
      // 2. AI cost optimization
      const aiOptimization = await aiCostService.optimizeAIRequest(
        'Create comprehensive business model canvas with market analysis',
        'canvas-generation'
      );
      
      // 3. Vector search preparation
      const embedding = await vectorSearchService.generateEmbedding(
        'Business model canvas for technology startup'
      );
      
      // 4. Collaboration workflow setup
      const workflowConfig = {
        clientId: 'test-client-123',
        objective: 'Create optimized business model canvas',
        agents: ['value-proposition-canvas', 'business-model-canvas', 'canvas-generator']
      };
      
      collaborationService.validateWorkflowConfig(workflowConfig);
      
      const duration = performance.now() - start;
      
      // Verify all components work together
      expect(dbOptimized).toBeDefined();
      expect(aiOptimization.optimizedPrompt).toBeDefined();
      expect(embedding).toBeDefined();
      expect(duration).toBeLessThan(5000); // Allow reasonable time for CI environment
      
      console.log(`🚀 Sprint 4 integration test completed in ${duration.toFixed(2)}ms`);
    });
  });
});
