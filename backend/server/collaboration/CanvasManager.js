/**
 * Canvas Manager - Core collaborative multi-agent canvas system
 * Enables real-time shared workspace for Strategyzer frameworks
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

export class CanvasManager extends EventEmitter {
  constructor() {
    super();
    this.canvases = new Map(); // canvasId -> canvas data
    this.agentContributions = new Map(); // canvasId -> agent contributions
    this.debates = new Map(); // canvasId -> debates
    this.versions = new Map(); // canvasId -> version history
  }

  /**
   * Create a new collaborative canvas workspace
   */
  createCanvas(type, clientId, metadata = {}) {
    const canvasId = uuidv4();
    const canvas = {
      id: canvasId,
      type, // 'value_proposition', 'business_model', 'testing_business_ideas'
      clientId,
      metadata,
      sections: this.initializeCanvasSections(type),
      status: 'active',
      createdAt: new Date(),
      lastModified: new Date(),
      version: 1
    };

    this.canvases.set(canvasId, canvas);
    this.agentContributions.set(canvasId, new Map());
    this.debates.set(canvasId, []);
    this.versions.set(canvasId, [{ ...canvas, version: 1 }]);

    this.emit('canvasCreated', { canvasId, canvas });
    return canvas;
  }

  /**
   * Initialize canvas sections based on Strategyzer framework type
   */
  initializeCanvasSections(type) {
    switch (type) {
      case 'value_proposition':
        return {
          customerProfile: {
            customerJobs: [],
            pains: [],
            gains: []
          },
          valueMap: {
            products: [],
            painRelievers: [],
            gainCreators: []
          }
        };
      
      case 'business_model':
        return {
          keyPartners: [],
          keyActivities: [],
          keyResources: [],
          valuePropositions: [],
          customerRelationships: [],
          channels: [],
          customerSegments: [],
          costStructure: [],
          revenueStreams: []
        };
      
      case 'testing_business_ideas':
        return {
          hypotheses: [],
          experiments: [],
          learnings: [],
          pivots: []
        };
      
      default:
        return {
          analysis: [],
          recommendations: [],
          insights: []
        };
    }
  }

  /**
   * Agent contributes to a canvas section
   */
  async contributeToCanvas(canvasId, agentId, sectionPath, contribution) {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) {
      throw new Error(`Canvas ${canvasId} not found`);
    }

    // Record agent contribution
    const contributions = this.agentContributions.get(canvasId);
    if (!contributions.has(agentId)) {
      contributions.set(agentId, []);
    }

    const contributionRecord = {
      id: uuidv4(),
      agentId,
      sectionPath,
      contribution,
      timestamp: new Date(),
      status: 'pending_review'
    };

    contributions.get(agentId).push(contributionRecord);

    // Update canvas section
    this.updateCanvasSection(canvas, sectionPath, contribution);
    
    // Increment version
    canvas.version += 1;
    canvas.lastModified = new Date();
    
    // Store version history
    const versions = this.versions.get(canvasId);
    versions.push({ ...canvas });

    this.emit('canvasUpdated', { 
      canvasId, 
      agentId, 
      sectionPath, 
      contribution: contributionRecord 
    });

    return contributionRecord;
  }

  /**
   * Update a specific canvas section
   */
  updateCanvasSection(canvas, sectionPath, contribution) {
    const pathParts = sectionPath.split('.');
    let current = canvas.sections;
    
    // Navigate to the target section
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    const finalKey = pathParts[pathParts.length - 1];
    
    // Add contribution to array or update value
    if (Array.isArray(current[finalKey])) {
      current[finalKey].push(contribution);
    } else {
      current[finalKey] = contribution;
    }
  }

  /**
   * Start an agent debate on a canvas element
   */
  startDebate(canvasId, initiatorAgentId, topic, position) {
    const debates = this.debates.get(canvasId);
    const debate = {
      id: uuidv4(),
      canvasId,
      topic,
      initiatorAgentId,
      positions: [{
        agentId: initiatorAgentId,
        position,
        timestamp: new Date(),
        evidence: []
      }],
      status: 'active',
      createdAt: new Date()
    };

    debates.push(debate);
    
    this.emit('debateStarted', { canvasId, debate });
    return debate;
  }

  /**
   * Agent responds to a debate
   */
  respondToDebate(canvasId, debateId, agentId, position, evidence = []) {
    const debates = this.debates.get(canvasId);
    const debate = debates.find(d => d.id === debateId);
    
    if (!debate) {
      throw new Error(`Debate ${debateId} not found`);
    }

    const response = {
      agentId,
      position,
      evidence,
      timestamp: new Date()
    };

    debate.positions.push(response);
    
    this.emit('debateResponse', { canvasId, debateId, response });
    return response;
  }

  /**
   * Calculate consensus on a debate
   */
  calculateDebateConsensus(canvasId, debateId) {
    const debates = this.debates.get(canvasId);
    const debate = debates.find(d => d.id === debateId);
    
    if (!debate) {
      throw new Error(`Debate ${debateId} not found`);
    }

    const positions = debate.positions;
    const positionCounts = {};
    
    positions.forEach(p => {
      positionCounts[p.position] = (positionCounts[p.position] || 0) + 1;
    });

    const totalPositions = positions.length;
    const majorityPosition = Object.keys(positionCounts)
      .reduce((a, b) => positionCounts[a] > positionCounts[b] ? a : b);
    
    const consensusRatio = positionCounts[majorityPosition] / totalPositions;
    const hasConsensus = consensusRatio >= 0.66; // 2/3 majority

    return {
      hasConsensus,
      consensusRatio,
      majorityPosition,
      positionCounts,
      totalParticipants: totalPositions
    };
  }

  /**
   * Get canvas with all agent contributions and debates
   */
  getCollaborativeCanvas(canvasId) {
    const canvas = this.canvases.get(canvasId);
    const contributions = this.agentContributions.get(canvasId);
    const debates = this.debates.get(canvasId);
    const versions = this.versions.get(canvasId);

    if (!canvas) {
      throw new Error(`Canvas ${canvasId} not found`);
    }

    return {
      canvas,
      agentContributions: Array.from(contributions.entries()),
      debates,
      versionHistory: versions,
      collaborationMetrics: this.getCollaborationMetrics(canvasId)
    };
  }

  /**
   * Get collaboration metrics for a canvas
   */
  getCollaborationMetrics(canvasId) {
    const contributions = this.agentContributions.get(canvasId);
    const debates = this.debates.get(canvasId);
    
    const totalContributions = Array.from(contributions.values())
      .reduce((sum, agentContribs) => sum + agentContribs.length, 0);
    
    const activeDebates = debates.filter(d => d.status === 'active').length;
    const resolvedDebates = debates.filter(d => d.status === 'resolved').length;
    
    const agentParticipation = Array.from(contributions.keys()).length;

    return {
      totalContributions,
      activeDebates,
      resolvedDebates,
      agentParticipation,
      collaborationScore: this.calculateCollaborationScore(
        totalContributions, 
        activeDebates, 
        resolvedDebates, 
        agentParticipation
      )
    };
  }

  /**
   * Calculate overall collaboration score
   */
  calculateCollaborationScore(contributions, activeDebates, resolvedDebates, participation) {
    // Weighted scoring: contributions (40%), resolved debates (30%), participation (30%)
    const contributionScore = Math.min(contributions / 10, 1) * 0.4;
    const debateScore = (resolvedDebates / Math.max(resolvedDebates + activeDebates, 1)) * 0.3;
    const participationScore = Math.min(participation / 5, 1) * 0.3;
    
    return Math.round((contributionScore + debateScore + participationScore) * 100);
  }

  /**
   * Simulate agent iteration on canvas
   */
  async simulateAgentIteration(canvasId, simulationAgentId, scenario) {
    const canvas = this.canvases.get(canvasId);
    if (!canvas) {
      throw new Error(`Canvas ${canvasId} not found`);
    }

    const simulation = {
      id: uuidv4(),
      canvasId,
      agentId: simulationAgentId,
      scenario,
      results: {},
      timestamp: new Date()
    };

    // Simulate different scenarios based on canvas type
    switch (canvas.type) {
      case 'value_proposition':
        simulation.results = await this.simulateValuePropositionScenario(canvas, scenario);
        break;
      case 'business_model':
        simulation.results = await this.simulateBusinessModelScenario(canvas, scenario);
        break;
      case 'testing_business_ideas':
        simulation.results = await this.simulateTestingScenario(canvas, scenario);
        break;
    }

    this.emit('simulationCompleted', { canvasId, simulation });
    return simulation;
  }

  /**
   * Simulate Value Proposition Canvas scenarios
   */
  async simulateValuePropositionScenario(canvas, scenario) {
    return {
      customerFitScore: Math.random() * 100,
      painReliefEffectiveness: Math.random() * 100,
      gainCreationPotential: Math.random() * 100,
      marketValidation: Math.random() > 0.3 ? 'positive' : 'negative',
      recommendedIterations: [
        'Refine pain relievers based on customer feedback',
        'Strengthen gain creators alignment',
        'Validate product-market fit assumptions'
      ]
    };
  }

  /**
   * Simulate Business Model Canvas scenarios
   */
  async simulateBusinessModelScenario(canvas, scenario) {
    return {
      viabilityScore: Math.random() * 100,
      scalabilityPotential: Math.random() * 100,
      competitiveAdvantage: Math.random() * 100,
      riskAssessment: Math.random() > 0.4 ? 'low' : 'medium',
      recommendedIterations: [
        'Optimize cost structure',
        'Diversify revenue streams',
        'Strengthen key partnerships'
      ]
    };
  }

  /**
   * Simulate Testing Business Ideas scenarios
   */
  async simulateTestingScenario(canvas, scenario) {
    return {
      hypothesisValidation: Math.random() > 0.5 ? 'validated' : 'invalidated',
      experimentSuccess: Math.random() * 100,
      learningQuality: Math.random() * 100,
      pivotRecommendation: Math.random() > 0.7 ? 'required' : 'not_required',
      recommendedIterations: [
        'Design follow-up experiments',
        'Refine hypotheses based on learnings',
        'Implement validated learnings'
      ]
    };
  }
}

export default CanvasManager;
