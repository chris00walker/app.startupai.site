/**
 * Sprint 4 Integration Service
 * 
 * Orchestrates all Sprint 4 optimization and advanced features:
 * - Database query optimization
 * - AI cost optimization
 * - Vector search capabilities
 * - Agent collaboration workflows
 * 
 * Provides unified interface for production-ready optimizations
 */

import DatabaseOptimizationService from './DatabaseOptimizationService.js';
import AICostOptimizationService from './AICostOptimizationService.js';
import VectorSearchService from './VectorSearchService.js';
import AgentCollaborationService from './AgentCollaborationService.js';
import { performance } from 'perf_hooks';

export default class Sprint4IntegrationService {
  constructor() {
    this.services = {};
    this.initialized = false;
    this.performanceMetrics = new Map();
    
    // Service configuration
    this.config = {
      enableDatabaseOptimization: true,
      enableAICostOptimization: true,
      enableVectorSearch: true,
      enableAgentCollaboration: true,
      performanceMonitoring: true,
      autoOptimization: true
    };
    
    this.initializationPromise = null;
  }

  /**
   * Initialize all Sprint 4 services
   */
  async initialize() {
    if (this.initialized) {
      return this.services;
    }
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  async _performInitialization() {
    const start = performance.now();
    
    console.log('🚀 Initializing Sprint 4 Integration Service...');
    
    try {
      // Initialize services in parallel where possible
      const initPromises = [];
      
      if (this.config.enableDatabaseOptimization) {
        initPromises.push(this._initializeDatabaseOptimization());
      }
      
      if (this.config.enableAICostOptimization) {
        initPromises.push(this._initializeAICostOptimization());
      }
      
      if (this.config.enableVectorSearch) {
        initPromises.push(this._initializeVectorSearch());
      }
      
      if (this.config.enableAgentCollaboration) {
        initPromises.push(this._initializeAgentCollaboration());
      }
      
      // Wait for all services to initialize
      await Promise.all(initPromises);
      
      // Set up service integrations
      await this._setupServiceIntegrations();
      
      this.initialized = true;
      const duration = performance.now() - start;
      
      console.log(`✅ Sprint 4 Integration Service initialized in ${duration.toFixed(2)}ms`);
      
      return this.services;
      
    } catch (error) {
      console.error('Failed to initialize Sprint 4 services:', error);
      throw new Error(`Sprint 4 initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize database optimization service
   */
  async _initializeDatabaseOptimization() {
    console.log('📊 Initializing Database Optimization...');
    
    this.services.database = new DatabaseOptimizationService();
    this.services.database.optimizedQueries = await this.services.database.initialize();
    
    console.log('✅ Database Optimization ready');
  }

  /**
   * Initialize AI cost optimization service
   */
  async _initializeAICostOptimization() {
    console.log('💰 Initializing AI Cost Optimization...');
    
    this.services.aiCost = new AICostOptimizationService();
    
    console.log('✅ AI Cost Optimization ready');
  }

  /**
   * Initialize vector search service
   */
  async _initializeVectorSearch() {
    console.log('🔍 Initializing Vector Search...');
    
    this.services.vectorSearch = new VectorSearchService();
    await this.services.vectorSearch.initializeVectorSearch();
    
    console.log('✅ Vector Search ready');
  }

  /**
   * Initialize agent collaboration service
   */
  async _initializeAgentCollaboration() {
    console.log('🤝 Initializing Agent Collaboration...');
    
    this.services.collaboration = new AgentCollaborationService();
    
    console.log('✅ Agent Collaboration ready');
  }

  /**
   * Set up integrations between services
   */
  async _setupServiceIntegrations() {
    console.log('🔗 Setting up service integrations...');
    
    // Integrate AI cost optimization with collaboration service
    if (this.services.aiCost && this.services.collaboration) {
      this.services.collaboration.on('agent-completed', (event) => {
        // Track AI costs for collaborative agents
        if (event.result.aiUsage) {
          this.services.aiCost.trackCost(
            event.agentType,
            event.result.aiUsage.model,
            event.result.aiUsage.inputTokens,
            event.result.aiUsage.outputTokens,
            event.result.clientId
          );
        }
      });
    }
    
    // Integrate vector search with collaboration for context-aware recommendations
    if (this.services.vectorSearch && this.services.collaboration) {
      this.services.collaboration.vectorSearch = this.services.vectorSearch;
    }
    
    // Integrate database optimization with all services
    if (this.services.database) {
      // Share optimized queries with other services
      Object.values(this.services).forEach(service => {
        if (service !== this.services.database && typeof service === 'object') {
          service.optimizedQueries = this.services.database.optimizedQueries;
        }
      });
    }
    
    console.log('✅ Service integrations configured');
  }

  /**
   * Execute optimized canvas workflow
   */
  async executeOptimizedCanvasWorkflow(clientId, canvasType, options = {}) {
    await this.initialize();
    
    const start = performance.now();
    const workflowId = `canvas_workflow_${Date.now()}`;
    
    console.log(`🎨 Starting optimized canvas workflow: ${workflowId}`);
    
    try {
      // 1. Database optimization - get client data efficiently
      const clientData = await this.services.database.optimizedQueries.client
        .getClientsWithMetrics({ _id: clientId });
      
      if (!clientData || clientData.length === 0) {
        throw new Error('Client not found');
      }
      
      const client = clientData[0];
      
      // 2. AI cost optimization - prepare cost-efficient requests
      const canvasPrompt = this._buildCanvasPrompt(client, canvasType);
      const aiOptimization = await this.services.aiCost.optimizeAIRequest(
        canvasPrompt,
        'canvas-generation',
        { complexity: options.complexity || 'medium' }
      );
      
      // 3. Vector search - find similar canvases for context
      const similarCanvases = await this._findSimilarCanvases(client, canvasType);
      
      // 4. Agent collaboration - execute collaborative canvas creation
      const collaborationConfig = {
        clientId,
        objective: `Create ${canvasType} canvas with optimization`,
        agents: this._getCanvasAgents(canvasType),
        context: {
          client,
          similarCanvases,
          aiOptimization,
          options
        }
      };
      
      const workflowResult = await this.services.collaboration
        .startCollaborativeWorkflow(collaborationConfig);
      
      // 5. Track performance and costs
      const duration = performance.now() - start;
      this._trackWorkflowMetrics(workflowId, {
        duration,
        canvasType,
        clientId,
        aiCost: aiOptimization.estimatedCost || 0,
        qualityScore: workflowResult.qualityScore || 0
      });
      
      console.log(`✅ Optimized canvas workflow completed: ${duration.toFixed(2)}ms`);
      
      return {
        workflowId,
        canvasType,
        clientId,
        result: workflowResult,
        optimization: {
          databaseQueryTime: clientData.performance?.queryTime || 0,
          aiCostSavings: aiOptimization.costSavings || 0,
          similarCanvasesFound: similarCanvases.length,
          totalDuration: duration
        }
      };
      
    } catch (error) {
      console.error(`Canvas workflow ${workflowId} failed:`, error);
      throw new Error(`Optimized canvas workflow failed: ${error.message}`);
    }
  }

  /**
   * Execute semantic search across all artefacts
   */
  async executeSemanticSearch(query, options = {}) {
    await this.initialize();
    
    const start = performance.now();
    
    console.log(`🔍 Executing semantic search: "${query}"`);
    
    try {
      // Use vector search service
      const searchResults = await this.services.vectorSearch.semanticSearch(query, options);
      
      // Enhance results with database optimization
      if (searchResults.results.length > 0 && this.services.database) {
        const artefactIds = searchResults.results.map(r => r.id);
        // Could add optimized queries to enrich results
      }
      
      const duration = performance.now() - start;
      
      console.log(`✅ Semantic search completed: ${searchResults.results.length} results in ${duration.toFixed(2)}ms`);
      
      return {
        ...searchResults,
        performance: {
          ...searchResults.metadata,
          totalDuration: duration
        }
      };
      
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw new Error(`Semantic search failed: ${error.message}`);
    }
  }

  /**
   * Get agent recommendations with full optimization
   */
  async getOptimizedAgentRecommendations(clientId, context = {}) {
    await this.initialize();
    
    const start = performance.now();
    
    console.log(`🤖 Getting optimized agent recommendations for client: ${clientId}`);
    
    try {
      // Get client data with database optimization
      const clientData = await this.services.database.optimizedQueries.client
        .getClientsWithMetrics({ _id: clientId });
      
      if (!clientData || clientData.length === 0) {
        throw new Error('Client not found');
      }
      
      const client = clientData[0];
      
      // Use vector search for context-aware recommendations
      const recommendations = await this.services.vectorSearch
        .getAgentRecommendations(clientId, context);
      
      // Enhance with cost optimization
      const enhancedRecommendations = recommendations.recommendations.map(rec => ({
        ...rec,
        optimizedCost: this.services.aiCost.selectOptimalModel(rec.agentType),
        estimatedSavings: this._calculateCostSavings(rec.agentType, rec.estimatedCost)
      }));
      
      const duration = performance.now() - start;
      
      console.log(`✅ Agent recommendations completed: ${enhancedRecommendations.length} recommendations in ${duration.toFixed(2)}ms`);
      
      return {
        clientId,
        recommendations: enhancedRecommendations,
        metadata: {
          ...recommendations.metadata,
          totalDuration: duration,
          optimizationsApplied: ['database', 'vector-search', 'cost-optimization']
        }
      };
      
    } catch (error) {
      console.error('Agent recommendations failed:', error);
      throw new Error(`Agent recommendations failed: ${error.message}`);
    }
  }

  /**
   * Get comprehensive performance dashboard
   */
  async getPerformanceDashboard() {
    await this.initialize();
    
    const dashboard = {
      timestamp: new Date().toISOString(),
      services: {},
      integrations: {},
      recommendations: []
    };
    
    // Database performance
    if (this.services.database) {
      dashboard.services.database = this.services.database.getPerformanceReport();
    }
    
    // AI cost performance
    if (this.services.aiCost) {
      dashboard.services.aiCost = this.services.aiCost.getCostReport();
    }
    
    // Vector search performance
    if (this.services.vectorSearch) {
      dashboard.services.vectorSearch = this.services.vectorSearch.getVectorSearchStats();
    }
    
    // Collaboration performance
    if (this.services.collaboration) {
      dashboard.services.collaboration = {
        activeWorkflows: this.services.collaboration.activeWorkflows.size,
        collaborationHistory: this.services.collaboration.collaborationHistory.size
      };
    }
    
    // Integration metrics
    dashboard.integrations = {
      totalWorkflows: this.performanceMetrics.size,
      avgWorkflowDuration: this._calculateAverageWorkflowDuration(),
      totalCostSavings: this._calculateTotalCostSavings()
    };
    
    // Generate recommendations
    dashboard.recommendations = this._generatePerformanceRecommendations(dashboard);
    
    return dashboard;
  }

  /**
   * Helper methods
   */
  _buildCanvasPrompt(client, canvasType) {
    const prompts = {
      'value-proposition': `Create Value Proposition Canvas for ${client.company} in ${client.industry}`,
      'business-model': `Create Business Model Canvas for ${client.company} focusing on ${client.description}`,
      'testing-business-ideas': `Create Testing Business Ideas framework for ${client.company}`
    };
    
    return prompts[canvasType] || `Create ${canvasType} canvas for ${client.company}`;
  }

  async _findSimilarCanvases(client, canvasType) {
    if (!this.services.vectorSearch) return [];
    
    try {
      // This would need actual canvas data to work properly
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.warn('Failed to find similar canvases:', error);
      return [];
    }
  }

  _getCanvasAgents(canvasType) {
    const agentMap = {
      'value-proposition': ['value-proposition-canvas', 'canvas-generator'],
      'business-model': ['business-model-canvas', 'canvas-generator'],
      'testing-business-ideas': ['validation-plan', 'canvas-generator']
    };
    
    return agentMap[canvasType] || ['canvas-generator'];
  }

  _trackWorkflowMetrics(workflowId, metrics) {
    this.performanceMetrics.set(workflowId, {
      ...metrics,
      timestamp: Date.now()
    });
    
    // Keep only last 100 workflow metrics
    if (this.performanceMetrics.size > 100) {
      const oldestKey = this.performanceMetrics.keys().next().value;
      this.performanceMetrics.delete(oldestKey);
    }
  }

  _calculateCostSavings(agentType, originalCost) {
    if (!this.services.aiCost) return 0;
    
    const optimizedModel = this.services.aiCost.selectOptimalModel(agentType);
    const originalModel = 'gpt-4o'; // Assume original was most expensive
    
    const optimizedCost = this.services.aiCost.modelPricing[optimizedModel]?.input || 0;
    const originalModelCost = this.services.aiCost.modelPricing[originalModel]?.input || 0;
    
    return Math.max(0, originalModelCost - optimizedCost);
  }

  _calculateAverageWorkflowDuration() {
    if (this.performanceMetrics.size === 0) return 0;
    
    const durations = Array.from(this.performanceMetrics.values())
      .map(m => m.duration);
    
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  _calculateTotalCostSavings() {
    if (!this.services.aiCost) return 0;
    
    const costReport = this.services.aiCost.getCostReport();
    return costReport.summary.totalSavings || 0;
  }

  _generatePerformanceRecommendations(dashboard) {
    const recommendations = [];
    
    // Database recommendations
    if (dashboard.services.database?.slowQueries?.length > 0) {
      recommendations.push({
        type: 'database',
        priority: 'high',
        message: 'Optimize slow database queries detected',
        action: 'Review and optimize query patterns'
      });
    }
    
    // AI cost recommendations
    if (dashboard.services.aiCost?.budgetStatus?.dailyBudgetUsed > 80) {
      recommendations.push({
        type: 'ai-cost',
        priority: 'medium',
        message: 'Approaching daily AI budget limit',
        action: 'Consider using more cost-efficient models'
      });
    }
    
    // Integration recommendations
    if (dashboard.integrations.avgWorkflowDuration > 60000) {
      recommendations.push({
        type: 'integration',
        priority: 'medium',
        message: 'Workflow duration above optimal threshold',
        action: 'Review agent collaboration efficiency'
      });
    }
    
    return recommendations;
  }

  /**
   * Health check for all services
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      services: {},
      timestamp: new Date().toISOString()
    };
    
    try {
      await this.initialize();
      
      // Check each service
      health.services.database = this.services.database ? 'healthy' : 'unavailable';
      health.services.aiCost = this.services.aiCost ? 'healthy' : 'unavailable';
      health.services.vectorSearch = this.services.vectorSearch ? 'healthy' : 'unavailable';
      health.services.collaboration = this.services.collaboration ? 'healthy' : 'unavailable';
      
      // Overall status
      const unhealthyServices = Object.values(health.services)
        .filter(status => status !== 'healthy');
      
      if (unhealthyServices.length > 0) {
        health.status = 'degraded';
      }
      
    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }
    
    return health;
  }
}
