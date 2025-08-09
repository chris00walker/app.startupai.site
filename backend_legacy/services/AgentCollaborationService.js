/**
 * Agent Collaboration System
 * 
 * Implements Sprint 4 Story 4.2.2: Agent Collaboration System
 * - Multi-agent workflow orchestration
 * - Agent-to-agent communication protocols
 * - Collaborative canvas development
 * - Workflow state management
 * - Quality assurance through agent consensus
 */

import mongoose from 'mongoose';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

export default class AgentCollaborationService extends EventEmitter {
  constructor() {
    super();
    
    this.activeWorkflows = new Map();
    this.agentRegistry = new Map();
    this.collaborationHistory = new Map();
    
    // Collaboration configuration
    this.config = {
      maxConcurrentAgents: 5,
      consensusThreshold: 0.7,
      qualityGateThreshold: 0.8,
      timeoutMs: 300000, // 5 minutes
      retryAttempts: 3
    };
    
    // Agent capability matrix
    this.agentCapabilities = {
      'value-proposition-canvas': {
        inputs: ['client-profile', 'market-research'],
        outputs: ['customer-jobs', 'customer-pains', 'customer-gains', 'value-map'],
        collaboratesWith: ['business-model-canvas', 'market-research'],
        qualityMetrics: ['completeness', 'market-fit', 'clarity']
      },
      'business-model-canvas': {
        inputs: ['value-proposition-canvas', 'market-research', 'financial-analysis'],
        outputs: ['business-model', 'revenue-streams', 'cost-structure'],
        collaboratesWith: ['value-proposition-canvas', 'validation-plan'],
        qualityMetrics: ['viability', 'scalability', 'coherence']
      },
      'canvas-generator': {
        inputs: ['value-proposition-canvas', 'business-model-canvas'],
        outputs: ['visual-canvas', 'presentation-materials'],
        collaboratesWith: ['all'],
        qualityMetrics: ['visual-quality', 'accuracy', 'professionalism']
      },
      'market-research': {
        inputs: ['client-profile', 'industry-data'],
        outputs: ['market-analysis', 'competitive-landscape', 'opportunities'],
        collaboratesWith: ['value-proposition-canvas', 'validation-plan'],
        qualityMetrics: ['depth', 'accuracy', 'relevance']
      },
      'validation-plan': {
        inputs: ['business-model-canvas', 'market-research'],
        outputs: ['test-hypotheses', 'validation-methods', 'success-metrics'],
        collaboratesWith: ['business-model-canvas', 'market-research'],
        qualityMetrics: ['testability', 'feasibility', 'coverage']
      }
    };
    
    this.initializeCollaboration();
  }

  /**
   * Initialize collaboration service
   */
  initializeCollaboration() {
    console.log('🤝 Initializing Agent Collaboration Service...');
    
    // Set up event handlers
    this.on('workflow-started', this.handleWorkflowStarted.bind(this));
    this.on('agent-completed', this.handleAgentCompleted.bind(this));
    this.on('collaboration-needed', this.handleCollaborationNeeded.bind(this));
    this.on('quality-gate', this.handleQualityGate.bind(this));
    
    console.log('✅ Agent Collaboration Service initialized');
  }

  /**
   * Start a collaborative workflow
   */
  async startCollaborativeWorkflow(workflowConfig) {
    const start = performance.now();
    const workflowId = this.generateWorkflowId();
    
    console.log(`🚀 Starting collaborative workflow: ${workflowId}`);
    
    try {
      // Validate workflow configuration
      this.validateWorkflowConfig(workflowConfig);
      
      // Create workflow state
      const workflow = {
        id: workflowId,
        clientId: workflowConfig.clientId,
        objective: workflowConfig.objective,
        requiredAgents: workflowConfig.agents || [],
        currentStage: 'initialization',
        agentStates: new Map(),
        sharedContext: new Map(),
        results: new Map(),
        qualityGates: [],
        startTime: Date.now(),
        status: 'active'
      };
      
      this.activeWorkflows.set(workflowId, workflow);
      
      // Initialize agents
      await this.initializeWorkflowAgents(workflow);
      
      // Start execution
      await this.executeWorkflowStage(workflow, 'discovery');
      
      const duration = performance.now() - start;
      console.log(`🎯 Collaborative workflow started: ${duration.toFixed(2)}ms`);
      
      this.emit('workflow-started', { workflowId, workflow });
      
      return {
        workflowId,
        status: 'started',
        estimatedDuration: this.estimateWorkflowDuration(workflow),
        initialAgents: workflow.requiredAgents
      };
      
    } catch (error) {
      console.error('Failed to start collaborative workflow:', error);
      throw new Error(`Workflow initialization failed: ${error.message}`);
    }
  }

  /**
   * Execute a specific workflow stage with agent collaboration
   */
  async executeWorkflowStage(workflow, stage) {
    const start = performance.now();
    
    console.log(`📋 Executing workflow stage: ${stage} for ${workflow.id}`);
    
    try {
      workflow.currentStage = stage;
      
      // Determine required agents for this stage
      const stageAgents = this.getStageAgents(stage, workflow.objective);
      
      // Execute agents in parallel where possible
      const agentPromises = [];
      const dependencies = this.calculateAgentDependencies(stageAgents);
      
      // Execute independent agents first
      const independentAgents = stageAgents.filter(agent => 
        dependencies[agent].length === 0
      );
      
      for (const agentType of independentAgents) {
        agentPromises.push(this.executeCollaborativeAgent(workflow, agentType));
      }
      
      // Wait for independent agents to complete
      await Promise.all(agentPromises);
      
      // Execute dependent agents in order
      const dependentAgents = stageAgents.filter(agent => 
        dependencies[agent].length > 0
      );
      
      for (const agentType of dependentAgents) {
        await this.executeCollaborativeAgent(workflow, agentType);
      }
      
      // Quality gate check
      const qualityCheck = await this.performQualityGate(workflow, stage);
      workflow.qualityGates.push(qualityCheck);
      
      const duration = performance.now() - start;
      console.log(`✅ Stage ${stage} completed: ${duration.toFixed(2)}ms`);
      
      return qualityCheck;
      
    } catch (error) {
      console.error(`Stage ${stage} execution failed:`, error);
      workflow.status = 'error';
      throw error;
    }
  }

  /**
   * Execute an agent with collaborative context
   */
  async executeCollaborativeAgent(workflow, agentType) {
    const start = performance.now();
    
    console.log(`🤖 Executing collaborative agent: ${agentType}`);
    
    try {
      // Get agent capabilities and requirements
      const capabilities = this.agentCapabilities[agentType];
      if (!capabilities) {
        throw new Error(`Unknown agent type: ${agentType}`);
      }
      
      // Gather collaborative context
      const collaborativeContext = await this.gatherCollaborativeContext(
        workflow, 
        agentType, 
        capabilities
      );
      
      // Prepare agent input with collaboration data
      const agentInput = {
        clientId: workflow.clientId,
        workflowId: workflow.id,
        stage: workflow.currentStage,
        objective: workflow.objective,
        collaborativeContext,
        sharedContext: Object.fromEntries(workflow.sharedContext),
        previousResults: this.getPreviousResults(workflow, capabilities.inputs)
      };
      
      // Execute agent with collaboration awareness
      const agentResult = await this.runCollaborativeAgent(agentType, agentInput);
      
      // Store results and update shared context
      workflow.results.set(agentType, agentResult);
      this.updateSharedContext(workflow, agentType, agentResult);
      
      // Update agent state
      workflow.agentStates.set(agentType, {
        status: 'completed',
        result: agentResult,
        completedAt: Date.now(),
        collaborations: collaborativeContext.collaborations || []
      });
      
      const duration = performance.now() - start;
      console.log(`✅ Agent ${agentType} completed: ${duration.toFixed(2)}ms`);
      
      this.emit('agent-completed', { 
        workflowId: workflow.id, 
        agentType, 
        result: agentResult 
      });
      
      return agentResult;
      
    } catch (error) {
      console.error(`Agent ${agentType} execution failed:`, error);
      
      workflow.agentStates.set(agentType, {
        status: 'error',
        error: error.message,
        failedAt: Date.now()
      });
      
      throw error;
    }
  }

  /**
   * Gather collaborative context for an agent
   */
  async gatherCollaborativeContext(workflow, agentType, capabilities) {
    const context = {
      collaborations: [],
      dependencies: [],
      sharedInsights: [],
      qualityFeedback: []
    };
    
    // Find agents this agent should collaborate with
    const collaborators = capabilities.collaboratesWith.filter(collab => 
      collab === 'all' || workflow.agentStates.has(collab)
    );
    
    for (const collaboratorType of collaborators) {
      if (collaboratorType === 'all') {
        // Collaborate with all completed agents
        for (const [completedType, state] of workflow.agentStates.entries()) {
          if (state.status === 'completed') {
            context.collaborations.push({
              agentType: completedType,
              insights: this.extractInsights(state.result),
              qualityScore: state.result.qualityScore || 0
            });
          }
        }
      } else if (workflow.agentStates.has(collaboratorType)) {
        const collaboratorState = workflow.agentStates.get(collaboratorType);
        if (collaboratorState.status === 'completed') {
          context.collaborations.push({
            agentType: collaboratorType,
            insights: this.extractInsights(collaboratorState.result),
            qualityScore: collaboratorState.result.qualityScore || 0
          });
        }
      }
    }
    
    // Get shared insights from workflow context
    if (workflow.sharedContext.has('insights')) {
      context.sharedInsights = workflow.sharedContext.get('insights');
    }
    
    // Get quality feedback from previous quality gates
    context.qualityFeedback = workflow.qualityGates
      .filter(gate => gate.recommendations)
      .map(gate => gate.recommendations)
      .flat();
    
    return context;
  }

  /**
   * Run agent with collaborative awareness
   */
  async runCollaborativeAgent(agentType, input) {
    // Import the appropriate agent class
    const agentModules = {
      'value-proposition-canvas': () => import('../agents/strategyzer/ValuePropositionAgent.js'),
      'business-model-canvas': () => import('../agents/strategyzer/BusinessModelAgent.js'),
      'canvas-generator': () => import('../agents/canvas/CanvasGeneratorAgent.js')
    };
    
    if (!agentModules[agentType]) {
      throw new Error(`Agent module not found: ${agentType}`);
    }
    
    try {
      const AgentClass = (await agentModules[agentType]()).default;
      const agent = new AgentClass({
        collaborationMode: true,
        qualityThreshold: this.config.qualityGateThreshold
      });
      
      // Execute agent with collaborative input
      const result = await agent.execute(input);
      
      // Enhance result with collaboration metadata
      return {
        ...result,
        collaborationMetadata: {
          agentType,
          workflowId: input.workflowId,
          collaborators: input.collaborativeContext.collaborations.map(c => c.agentType),
          consensusScore: this.calculateConsensusScore(input.collaborativeContext),
          executedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error(`Collaborative agent execution failed: ${agentType}`, error);
      throw error;
    }
  }

  /**
   * Perform quality gate check for workflow stage
   */
  async performQualityGate(workflow, stage) {
    const start = performance.now();
    
    console.log(`🔍 Performing quality gate for stage: ${stage}`);
    
    try {
      const qualityCheck = {
        stage,
        timestamp: Date.now(),
        agentResults: [],
        overallQuality: 0,
        consensusScore: 0,
        passed: false,
        recommendations: []
      };
      
      // Evaluate each agent's output
      for (const [agentType, result] of workflow.results.entries()) {
        const agentQuality = this.evaluateAgentQuality(agentType, result);
        qualityCheck.agentResults.push({
          agentType,
          qualityScore: agentQuality.score,
          metrics: agentQuality.metrics,
          issues: agentQuality.issues
        });
      }
      
      // Calculate overall quality
      const qualityScores = qualityCheck.agentResults.map(r => r.qualityScore);
      qualityCheck.overallQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
      
      // Calculate consensus score
      qualityCheck.consensusScore = this.calculateStageConsensus(workflow, stage);
      
      // Determine if quality gate passes
      qualityCheck.passed = 
        qualityCheck.overallQuality >= this.config.qualityGateThreshold &&
        qualityCheck.consensusScore >= this.config.consensusThreshold;
      
      // Generate recommendations if quality gate fails
      if (!qualityCheck.passed) {
        qualityCheck.recommendations = this.generateQualityRecommendations(qualityCheck);
      }
      
      const duration = performance.now() - start;
      console.log(`🎯 Quality gate ${qualityCheck.passed ? 'PASSED' : 'FAILED'}: ${duration.toFixed(2)}ms`);
      
      this.emit('quality-gate', { 
        workflowId: workflow.id, 
        stage, 
        qualityCheck 
      });
      
      return qualityCheck;
      
    } catch (error) {
      console.error('Quality gate evaluation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate consensus score between agents
   */
  calculateConsensusScore(collaborativeContext) {
    if (!collaborativeContext.collaborations || collaborativeContext.collaborations.length < 2) {
      return 1.0; // Single agent, perfect consensus
    }
    
    const qualityScores = collaborativeContext.collaborations.map(c => c.qualityScore);
    const mean = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    // Calculate standard deviation
    const variance = qualityScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / qualityScores.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consensus score (lower deviation = higher consensus)
    return Math.max(0, 1 - (stdDev / mean));
  }

  /**
   * Calculate stage consensus across all agents
   */
  calculateStageConsensus(workflow, stage) {
    const stageResults = Array.from(workflow.results.values());
    if (stageResults.length < 2) return 1.0;
    
    const qualityScores = stageResults.map(result => result.qualityScore || 0);
    const mean = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    const variance = qualityScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / qualityScores.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 1 - (stdDev / mean));
  }

  /**
   * Evaluate agent output quality
   */
  evaluateAgentQuality(agentType, result) {
    const capabilities = this.agentCapabilities[agentType];
    const evaluation = {
      score: result.qualityScore || 0,
      metrics: {},
      issues: []
    };
    
    // Evaluate based on agent-specific quality metrics
    if (capabilities && capabilities.qualityMetrics) {
      for (const metric of capabilities.qualityMetrics) {
        evaluation.metrics[metric] = this.evaluateQualityMetric(metric, result);
      }
      
      // Calculate overall score from metrics
      const metricScores = Object.values(evaluation.metrics);
      evaluation.score = metricScores.reduce((sum, score) => sum + score, 0) / metricScores.length;
    }
    
    // Identify quality issues
    if (evaluation.score < 0.6) {
      evaluation.issues.push('Below minimum quality threshold');
    }
    
    if (result.processingTime && result.processingTime > 60000) {
      evaluation.issues.push('Excessive processing time');
    }
    
    return evaluation;
  }

  /**
   * Evaluate specific quality metric
   */
  evaluateQualityMetric(metric, result) {
    // Implement metric-specific evaluation logic
    const metricEvaluators = {
      'completeness': (result) => {
        const requiredFields = ['data', 'analysis', 'recommendations'];
        const presentFields = requiredFields.filter(field => result[field]);
        return presentFields.length / requiredFields.length;
      },
      'accuracy': (result) => result.qualityScore || 0.7,
      'clarity': (result) => result.qualityScore || 0.7,
      'viability': (result) => result.qualityScore || 0.7,
      'scalability': (result) => result.qualityScore || 0.7,
      'coherence': (result) => result.qualityScore || 0.7
    };
    
    const evaluator = metricEvaluators[metric];
    return evaluator ? evaluator(result) : 0.7;
  }

  /**
   * Generate quality improvement recommendations
   */
  generateQualityRecommendations(qualityCheck) {
    const recommendations = [];
    
    // Agent-specific recommendations
    for (const agentResult of qualityCheck.agentResults) {
      if (agentResult.qualityScore < this.config.qualityGateThreshold) {
        recommendations.push({
          type: 'agent-improvement',
          agentType: agentResult.agentType,
          suggestion: `Improve ${agentResult.agentType} output quality`,
          priority: 'high'
        });
      }
    }
    
    // Consensus recommendations
    if (qualityCheck.consensusScore < this.config.consensusThreshold) {
      recommendations.push({
        type: 'consensus-improvement',
        suggestion: 'Improve agent collaboration and alignment',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Get workflow status and progress
   */
  getWorkflowStatus(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }
    
    const completedAgents = Array.from(workflow.agentStates.values())
      .filter(state => state.status === 'completed').length;
    
    const totalAgents = workflow.requiredAgents.length;
    const progress = totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0;
    
    return {
      workflowId,
      status: workflow.status,
      currentStage: workflow.currentStage,
      progress: Math.round(progress),
      completedAgents,
      totalAgents,
      qualityGates: workflow.qualityGates.length,
      elapsedTime: Date.now() - workflow.startTime,
      agentStates: Object.fromEntries(workflow.agentStates)
    };
  }

  /**
   * Helper methods
   */
  generateWorkflowId() {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateWorkflowConfig(config) {
    if (!config.clientId) throw new Error('clientId is required');
    if (!config.objective) throw new Error('objective is required');
  }

  getStageAgents(stage, objective) {
    const stageAgentMap = {
      'discovery': ['market-research', 'value-proposition-canvas'],
      'validation': ['business-model-canvas', 'validation-plan'],
      'visualization': ['canvas-generator']
    };
    
    return stageAgentMap[stage] || [];
  }

  calculateAgentDependencies(agents) {
    const dependencies = {};
    
    for (const agent of agents) {
      const capabilities = this.agentCapabilities[agent];
      dependencies[agent] = capabilities ? 
        capabilities.inputs.filter(input => agents.includes(input)) : [];
    }
    
    return dependencies;
  }

  extractInsights(result) {
    return result.insights || result.analysis || result.recommendations || [];
  }

  updateSharedContext(workflow, agentType, result) {
    // Update shared insights
    if (result.insights) {
      const existingInsights = workflow.sharedContext.get('insights') || [];
      workflow.sharedContext.set('insights', [...existingInsights, ...result.insights]);
    }
    
    // Update shared data
    if (result.data) {
      workflow.sharedContext.set(`${agentType}_data`, result.data);
    }
  }

  getPreviousResults(workflow, requiredInputs) {
    const results = {};
    
    for (const input of requiredInputs) {
      if (workflow.results.has(input)) {
        results[input] = workflow.results.get(input);
      }
    }
    
    return results;
  }

  estimateWorkflowDuration(workflow) {
    const baseTime = 60000; // 1 minute base
    const agentTime = workflow.requiredAgents.length * 30000; // 30 seconds per agent
    return baseTime + agentTime;
  }

  async initializeWorkflowAgents(workflow) {
    // Initialize agent states
    for (const agentType of workflow.requiredAgents) {
      workflow.agentStates.set(agentType, {
        status: 'pending',
        initializedAt: Date.now()
      });
    }
  }

  // Event handlers
  handleWorkflowStarted(event) {
    console.log(`📋 Workflow started: ${event.workflowId}`);
  }

  handleAgentCompleted(event) {
    console.log(`✅ Agent completed: ${event.agentType} in workflow ${event.workflowId}`);
  }

  handleCollaborationNeeded(event) {
    console.log(`🤝 Collaboration needed: ${event.details}`);
  }

  handleQualityGate(event) {
    const status = event.qualityCheck.passed ? 'PASSED' : 'FAILED';
    console.log(`🎯 Quality gate ${status}: ${event.stage} in workflow ${event.workflowId}`);
  }
}
