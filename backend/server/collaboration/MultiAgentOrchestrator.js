/**
 * Multi-Agent Orchestrator - Coordinates collaborative multi-agent sessions
 * Enables true OpenAI-style multi-agent collaboration for Strategyzer consulting
 */

import { EventEmitter } from 'events';
import CanvasManager from './CanvasManager.js';
import { runAgent } from '../utils/agentRunner.js';

export class MultiAgentOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.canvasManager = new CanvasManager();
    this.activeSessions = new Map(); // sessionId -> session data
    this.agentRoles = new Map(); // agentId -> role definition
    this.communicationLog = new Map(); // sessionId -> communication history
    
    this.setupAgentRoles();
    this.setupCanvasManagerEvents();
  }

  /**
   * Define specialized agent roles for collaborative consulting
   */
  setupAgentRoles() {
    this.agentRoles.set('canvasManager', {
      name: 'Canvas Manager',
      responsibilities: ['Create and maintain canvas structure', 'Coordinate agent contributions'],
      expertise: ['Strategyzer frameworks', 'Canvas organization'],
      communicationStyle: 'structured'
    });

    this.agentRoles.set('customerDiscovery', {
      name: 'Customer Discovery Specialist',
      responsibilities: ['Customer research', 'Pain point identification', 'Gain mapping'],
      expertise: ['Customer interviews', 'Market research', 'Persona development'],
      communicationStyle: 'analytical'
    });

    this.agentRoles.set('valueProposition', {
      name: 'Value Proposition Designer',
      responsibilities: ['Value proposition design', 'Product-market fit analysis'],
      expertise: ['Value proposition canvas', 'Product design', 'Market validation'],
      communicationStyle: 'creative'
    });

    this.agentRoles.set('businessModel', {
      name: 'Business Model Architect',
      responsibilities: ['Business model design', 'Revenue stream optimization'],
      expertise: ['Business model canvas', 'Financial modeling', 'Strategic planning'],
      communicationStyle: 'strategic'
    });

    this.agentRoles.set('testingValidation', {
      name: 'Testing & Validation Expert',
      responsibilities: ['Hypothesis testing', 'Experiment design', 'Learning validation'],
      expertise: ['Testing business ideas', 'Lean startup', 'Validation methodology'],
      communicationStyle: 'empirical'
    });

    this.agentRoles.set('simulation', {
      name: 'Simulation Agent',
      responsibilities: ['Scenario modeling', 'Risk assessment', 'Outcome prediction'],
      expertise: ['Business simulation', 'Risk analysis', 'Predictive modeling'],
      communicationStyle: 'quantitative'
    });

    this.agentRoles.set('critique', {
      name: 'Critical Analysis Agent',
      responsibilities: ['Quality assurance', 'Challenge assumptions', 'Identify gaps'],
      expertise: ['Critical thinking', 'Business analysis', 'Strategic review'],
      communicationStyle: 'challenging'
    });
  }

  /**
   * Setup event listeners for canvas manager
   */
  setupCanvasManagerEvents() {
    this.canvasManager.on('canvasUpdated', (event) => {
      this.emit('canvasUpdated', event);
    });

    this.canvasManager.on('debateStarted', (event) => {
      this.emit('debateStarted', event);
    });

    this.canvasManager.on('simulationCompleted', (event) => {
      this.emit('simulationCompleted', event);
    });
  }

  /**
   * Start a collaborative multi-agent session
   */
  async startCollaborativeSession(clientId, frameworkType, objective, participatingAgents = []) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create collaborative canvas
    const canvas = this.canvasManager.createCanvas(frameworkType, clientId, {
      objective,
      sessionId
    });

    // Initialize session
    const session = {
      id: sessionId,
      canvasId: canvas.id,
      clientId,
      frameworkType,
      objective,
      participatingAgents: participatingAgents.length > 0 ? participatingAgents : this.getDefaultAgentTeam(frameworkType),
      status: 'active',
      startTime: new Date(),
      phases: [],
      currentPhase: 'initialization'
    };

    this.activeSessions.set(sessionId, session);
    this.communicationLog.set(sessionId, []);

    // Start collaborative workflow
    await this.executeCollaborativeWorkflow(sessionId);

    this.emit('sessionStarted', { sessionId, session });
    return session;
  }

  /**
   * Get default agent team based on framework type
   */
  getDefaultAgentTeam(frameworkType) {
    const baseTeam = ['canvasManager', 'critique', 'simulation'];
    
    switch (frameworkType) {
      case 'value_proposition':
        return [...baseTeam, 'customerDiscovery', 'valueProposition'];
      case 'business_model':
        return [...baseTeam, 'businessModel', 'valueProposition'];
      case 'testing_business_ideas':
        return [...baseTeam, 'testingValidation', 'customerDiscovery'];
      default:
        return baseTeam;
    }
  }

  /**
   * Execute collaborative workflow with multiple phases
   */
  async executeCollaborativeWorkflow(sessionId) {
    const session = this.activeSessions.get(sessionId);
    
    try {
      // Phase 1: Individual Analysis
      await this.executePhase(sessionId, 'individual_analysis', async () => {
        await this.conductIndividualAnalysis(sessionId);
      });

      // Phase 2: Collaborative Canvas Population
      await this.executePhase(sessionId, 'collaborative_population', async () => {
        await this.populateCanvasCollaboratively(sessionId);
      });

      // Phase 3: Agent Debates and Consensus
      await this.executePhase(sessionId, 'debate_consensus', async () => {
        await this.facilitateAgentDebates(sessionId);
      });

      // Phase 4: Simulation and Validation
      await this.executePhase(sessionId, 'simulation_validation', async () => {
        await this.runSimulationValidation(sessionId);
      });

      // Phase 5: Iterative Improvement
      await this.executePhase(sessionId, 'iterative_improvement', async () => {
        await this.conductIterativeImprovement(sessionId);
      });

      session.status = 'completed';
      session.endTime = new Date();

    } catch (error) {
      session.status = 'failed';
      session.error = error.message;
      this.emit('sessionFailed', { sessionId, error });
    }
  }

  /**
   * Execute a workflow phase
   */
  async executePhase(sessionId, phaseName, phaseFunction) {
    const session = this.activeSessions.get(sessionId);
    session.currentPhase = phaseName;
    
    const phaseStart = new Date();
    
    try {
      await phaseFunction();
      
      session.phases.push({
        name: phaseName,
        status: 'completed',
        startTime: phaseStart,
        endTime: new Date()
      });

      this.emit('phaseCompleted', { sessionId, phaseName });
      
    } catch (error) {
      session.phases.push({
        name: phaseName,
        status: 'failed',
        startTime: phaseStart,
        endTime: new Date(),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Phase 1: Individual Analysis
   */
  async conductIndividualAnalysis(sessionId) {
    const session = this.activeSessions.get(sessionId);
    const canvas = this.canvasManager.canvases.get(session.canvasId);
    
    const analysisPromises = session.participatingAgents.map(async (agentId) => {
      const role = this.agentRoles.get(agentId);
      const analysisPrompt = this.buildIndividualAnalysisPrompt(canvas, role, session.objective);
      
      const analysis = await runAgent(agentId, {
        prompt: analysisPrompt,
        canvasType: session.frameworkType,
        objective: session.objective
      });

      await this.logAgentCommunication(sessionId, agentId, 'individual_analysis', analysis);
      return { agentId, analysis };
    });

    const analyses = await Promise.all(analysisPromises);
    
    // Store individual analyses for later reference
    session.individualAnalyses = analyses;
    
    return analyses;
  }

  /**
   * Phase 2: Collaborative Canvas Population
   */
  async populateCanvasCollaboratively(sessionId) {
    const session = this.activeSessions.get(sessionId);
    
    // Agents contribute to canvas sections based on their expertise
    for (const agentId of session.participatingAgents) {
      const role = this.agentRoles.get(agentId);
      const targetSections = this.getAgentTargetSections(agentId, session.frameworkType);
      
      for (const sectionPath of targetSections) {
        const contributionPrompt = this.buildContributionPrompt(session, agentId, sectionPath);
        
        const contribution = await runAgent(agentId, {
          prompt: contributionPrompt,
          canvasType: session.frameworkType,
          sectionPath
        });

        await this.canvasManager.contributeToCanvas(
          session.canvasId, 
          agentId, 
          sectionPath, 
          contribution.analysis || contribution.recommendations || contribution
        );

        await this.logAgentCommunication(sessionId, agentId, 'canvas_contribution', {
          sectionPath,
          contribution
        });
      }
    }
  }

  /**
   * Phase 3: Facilitate Agent Debates
   */
  async facilitateAgentDebates(sessionId) {
    const session = this.activeSessions.get(sessionId);
    const canvas = this.canvasManager.getCollaborativeCanvas(session.canvasId);
    
    // Identify potential debate topics from canvas contributions
    const debateTopics = this.identifyDebateTopics(canvas);
    
    for (const topic of debateTopics) {
      const debate = this.canvasManager.startDebate(
        session.canvasId,
        'critique', // Critique agent initiates debates
        topic.subject,
        topic.position
      );

      // Other agents respond to the debate
      for (const agentId of session.participatingAgents) {
        if (agentId !== 'critique') {
          const debateResponse = await this.generateDebateResponse(sessionId, agentId, debate);
          
          this.canvasManager.respondToDebate(
            session.canvasId,
            debate.id,
            agentId,
            debateResponse.position,
            debateResponse.evidence
          );
        }
      }

      // Calculate consensus
      const consensus = this.canvasManager.calculateDebateConsensus(session.canvasId, debate.id);
      
      if (consensus.hasConsensus) {
        debate.status = 'resolved';
        debate.resolution = consensus;
      }
    }
  }

  /**
   * Phase 4: Simulation and Validation
   */
  async runSimulationValidation(sessionId) {
    const session = this.activeSessions.get(sessionId);
    
    // Run multiple simulation scenarios
    const scenarios = this.generateSimulationScenarios(session.frameworkType);
    
    for (const scenario of scenarios) {
      const simulation = await this.canvasManager.simulateAgentIteration(
        session.canvasId,
        'simulation',
        scenario
      );

      await this.logAgentCommunication(sessionId, 'simulation', 'simulation_result', simulation);
    }
  }

  /**
   * Phase 5: Iterative Improvement
   */
  async conductIterativeImprovement(sessionId) {
    const session = this.activeSessions.get(sessionId);
    const canvas = this.canvasManager.getCollaborativeCanvas(session.canvasId);
    
    // Each agent suggests improvements based on debates and simulations
    for (const agentId of session.participatingAgents) {
      const improvementPrompt = this.buildImprovementPrompt(session, agentId, canvas);
      
      const improvements = await runAgent(agentId, {
        prompt: improvementPrompt,
        canvasData: canvas,
        sessionHistory: this.communicationLog.get(sessionId)
      });

      await this.logAgentCommunication(sessionId, agentId, 'improvement_suggestions', improvements);
    }
  }

  /**
   * Build individual analysis prompt for an agent
   */
  buildIndividualAnalysisPrompt(canvas, role, objective) {
    return `You are a ${role.name} participating in a collaborative Strategyzer consulting session.

OBJECTIVE: ${objective}
CANVAS TYPE: ${canvas.type}
YOUR EXPERTISE: ${role.expertise.join(', ')}
YOUR RESPONSIBILITIES: ${role.responsibilities.join(', ')}

Provide your individual analysis focusing on your area of expertise. Consider:
1. Key insights from your perspective
2. Potential challenges or opportunities
3. Recommendations for canvas development
4. Areas where you can contribute most value

Return your analysis in JSON format with structured insights.`;
  }

  /**
   * Build contribution prompt for canvas section
   */
  buildContributionPrompt(session, agentId, sectionPath) {
    const role = this.agentRoles.get(agentId);
    
    return `As a ${role.name}, contribute to the ${sectionPath} section of the ${session.frameworkType} canvas.

OBJECTIVE: ${session.objective}
SECTION: ${sectionPath}
YOUR EXPERTISE: ${role.expertise.join(', ')}

Provide specific, actionable content for this canvas section based on your expertise.
Focus on quality over quantity - provide 3-5 well-researched items.

Return your contribution in JSON format.`;
  }

  /**
   * Get target canvas sections for an agent based on their role
   */
  getAgentTargetSections(agentId, frameworkType) {
    const sectionMap = {
      'value_proposition': {
        'customerDiscovery': ['customerProfile.customerJobs', 'customerProfile.pains', 'customerProfile.gains'],
        'valueProposition': ['valueMap.products', 'valueMap.painRelievers', 'valueMap.gainCreators'],
        'canvasManager': ['customerProfile', 'valueMap'],
        'critique': ['customerProfile', 'valueMap'],
        'simulation': ['customerProfile', 'valueMap']
      },
      'business_model': {
        'businessModel': ['valuePropositions', 'customerSegments', 'revenueStreams', 'costStructure'],
        'customerDiscovery': ['customerSegments', 'customerRelationships'],
        'valueProposition': ['valuePropositions', 'channels'],
        'canvasManager': ['keyPartners', 'keyActivities', 'keyResources'],
        'critique': ['keyPartners', 'keyActivities', 'keyResources', 'valuePropositions'],
        'simulation': ['revenueStreams', 'costStructure']
      },
      'testing_business_ideas': {
        'testingValidation': ['hypotheses', 'experiments', 'learnings'],
        'customerDiscovery': ['hypotheses', 'learnings'],
        'canvasManager': ['experiments', 'pivots'],
        'critique': ['hypotheses', 'experiments', 'learnings'],
        'simulation': ['experiments', 'learnings', 'pivots']
      }
    };

    return sectionMap[frameworkType]?.[agentId] || ['analysis'];
  }

  /**
   * Log agent communication for session history
   */
  async logAgentCommunication(sessionId, agentId, messageType, content) {
    const log = this.communicationLog.get(sessionId);
    const role = this.agentRoles.get(agentId);
    
    const message = {
      timestamp: new Date(),
      agentId,
      agentName: role?.name || agentId,
      messageType,
      content,
      sessionId
    };

    log.push(message);
    
    this.emit('agentCommunication', { sessionId, message });
    return message;
  }

  /**
   * Get session status and results
   */
  getSessionResults(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const canvas = this.canvasManager.getCollaborativeCanvas(session.canvasId);
    const communications = this.communicationLog.get(sessionId);

    return {
      session,
      canvas,
      communications,
      summary: this.generateSessionSummary(session, canvas, communications)
    };
  }

  /**
   * Generate session summary
   */
  generateSessionSummary(session, canvas, communications) {
    const metrics = canvas.collaborationMetrics;
    
    return {
      sessionDuration: session.endTime ? 
        (session.endTime - session.startTime) / 1000 / 60 : null, // minutes
      phasesCompleted: session.phases.filter(p => p.status === 'completed').length,
      totalAgentContributions: metrics.totalContributions,
      debatesResolved: metrics.resolvedDebates,
      collaborationScore: metrics.collaborationScore,
      keyInsights: this.extractKeyInsights(communications),
      recommendations: this.extractRecommendations(communications)
    };
  }

  /**
   * Extract key insights from communications
   */
  extractKeyInsights(communications) {
    return communications
      .filter(c => c.messageType === 'individual_analysis' || c.messageType === 'improvement_suggestions')
      .map(c => c.content.insights || c.content.analysis)
      .flat()
      .filter(Boolean)
      .slice(0, 10); // Top 10 insights
  }

  /**
   * Extract recommendations from communications
   */
  extractRecommendations(communications) {
    return communications
      .filter(c => c.content.recommendations)
      .map(c => c.content.recommendations)
      .flat()
      .filter(Boolean)
      .slice(0, 10); // Top 10 recommendations
  }

  // Additional helper methods for debate facilitation, simulation scenarios, etc.
  identifyDebateTopics(canvas) {
    // Simplified implementation - in real scenario, this would use AI to identify contentious areas
    return [
      {
        subject: 'Value Proposition Prioritization',
        position: 'Focus on primary value proposition first'
      },
      {
        subject: 'Customer Segment Validation',
        position: 'Need stronger customer validation data'
      }
    ];
  }

  async generateDebateResponse(sessionId, agentId, debate) {
    const role = this.agentRoles.get(agentId);
    
    // Simplified implementation - would use AI to generate contextual responses
    return {
      position: `${role.name} perspective on ${debate.topic}`,
      evidence: [`Evidence from ${role.expertise[0]}`, `Supporting data from ${role.expertise[1] || 'analysis'}`]
    };
  }

  generateSimulationScenarios(frameworkType) {
    const scenarios = {
      'value_proposition': [
        { name: 'Market Entry', parameters: { competition: 'high', demand: 'medium' } },
        { name: 'Product Launch', parameters: { timing: 'early', resources: 'limited' } }
      ],
      'business_model': [
        { name: 'Revenue Optimization', parameters: { pricing: 'premium', volume: 'low' } },
        { name: 'Scale Scenario', parameters: { growth: 'rapid', costs: 'increasing' } }
      ],
      'testing_business_ideas': [
        { name: 'Hypothesis Validation', parameters: { confidence: 'medium', sample: 'small' } },
        { name: 'Pivot Analysis', parameters: { risk: 'high', opportunity: 'significant' } }
      ]
    };

    return scenarios[frameworkType] || scenarios['value_proposition'];
  }

  buildImprovementPrompt(session, agentId, canvas) {
    const role = this.agentRoles.get(agentId);
    
    return `As a ${role.name}, review the collaborative canvas and suggest improvements.

CANVAS DATA: ${JSON.stringify(canvas.canvas.sections, null, 2)}
COLLABORATION METRICS: ${JSON.stringify(canvas.collaborationMetrics, null, 2)}
DEBATE OUTCOMES: ${canvas.debates.length} debates conducted

Based on the collaborative work and your expertise, suggest specific improvements:
1. Areas that need strengthening
2. Missing elements or perspectives
3. Optimization opportunities
4. Next steps for validation

Return structured improvement suggestions in JSON format.`;
  }
}

export default MultiAgentOrchestrator;
