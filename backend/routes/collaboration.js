/**
 * Collaboration API Routes - Multi-Agent Collaborative Consulting
 * Exposes collaborative multi-agent orchestration for Strategyzer frameworks
 */

import express from 'express';
import MultiAgentOrchestrator from '../server/collaboration/MultiAgentOrchestrator.js';

const router = express.Router();
const orchestrator = new MultiAgentOrchestrator();

/**
 * Start a new collaborative multi-agent session
 * POST /api/collaboration/sessions
 */
router.post('/sessions', async (req, res) => {
  try {
    const { clientId, frameworkType, objective, participatingAgents } = req.body;

    if (!clientId || !frameworkType || !objective) {
      return res.status(400).json({
        error: 'Missing required fields: clientId, frameworkType, objective'
      });
    }

    const validFrameworks = ['value_proposition', 'business_model', 'testing_business_ideas'];
    if (!validFrameworks.includes(frameworkType)) {
      return res.status(400).json({
        error: `Invalid frameworkType. Must be one of: ${validFrameworks.join(', ')}`
      });
    }

    const session = await orchestrator.startCollaborativeSession(
      clientId,
      frameworkType,
      objective,
      participatingAgents
    );

    res.status(201).json({
      success: true,
      session,
      message: 'Collaborative session started successfully'
    });

  } catch (error) {
    console.error('Error starting collaborative session:', error);
    res.status(500).json({
      error: 'Failed to start collaborative session',
      details: error.message
    });
  }
});

/**
 * Get session status and results
 * GET /api/collaboration/sessions/:sessionId
 */
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const results = orchestrator.getSessionResults(sessionId);
    
    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error getting session results:', error);
    res.status(404).json({
      error: 'Session not found or failed to retrieve results',
      details: error.message
    });
  }
});

/**
 * Get collaborative canvas with agent contributions
 * GET /api/collaboration/canvas/:canvasId
 */
router.get('/canvas/:canvasId', async (req, res) => {
  try {
    const { canvasId } = req.params;
    
    const canvas = orchestrator.canvasManager.getCollaborativeCanvas(canvasId);
    
    res.json({
      success: true,
      canvas
    });

  } catch (error) {
    console.error('Error getting collaborative canvas:', error);
    res.status(404).json({
      error: 'Canvas not found',
      details: error.message
    });
  }
});

/**
 * Get agent communication log for a session
 * GET /api/collaboration/sessions/:sessionId/communications
 */
router.get('/sessions/:sessionId/communications', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { agentId, messageType, limit = 50 } = req.query;
    
    let communications = orchestrator.communicationLog.get(sessionId);
    
    if (!communications) {
      return res.status(404).json({
        error: 'Session communications not found'
      });
    }

    // Filter by agent if specified
    if (agentId) {
      communications = communications.filter(c => c.agentId === agentId);
    }

    // Filter by message type if specified
    if (messageType) {
      communications = communications.filter(c => c.messageType === messageType);
    }

    // Limit results
    communications = communications.slice(-parseInt(limit));

    res.json({
      success: true,
      communications,
      total: communications.length
    });

  } catch (error) {
    console.error('Error getting communications:', error);
    res.status(500).json({
      error: 'Failed to retrieve communications',
      details: error.message
    });
  }
});

/**
 * Get canvas debates and consensus information
 * GET /api/collaboration/canvas/:canvasId/debates
 */
router.get('/canvas/:canvasId/debates', async (req, res) => {
  try {
    const { canvasId } = req.params;
    
    const debates = orchestrator.canvasManager.debates.get(canvasId);
    
    if (!debates) {
      return res.status(404).json({
        error: 'Canvas debates not found'
      });
    }

    // Calculate consensus for each debate
    const debatesWithConsensus = debates.map(debate => {
      let consensus = null;
      try {
        consensus = orchestrator.canvasManager.calculateDebateConsensus(canvasId, debate.id);
      } catch (error) {
        console.warn('Could not calculate consensus for debate:', debate.id);
      }
      
      return {
        ...debate,
        consensus
      };
    });

    res.json({
      success: true,
      debates: debatesWithConsensus,
      summary: {
        total: debates.length,
        active: debates.filter(d => d.status === 'active').length,
        resolved: debates.filter(d => d.status === 'resolved').length
      }
    });

  } catch (error) {
    console.error('Error getting canvas debates:', error);
    res.status(500).json({
      error: 'Failed to retrieve debates',
      details: error.message
    });
  }
});

/**
 * Trigger manual agent contribution to canvas
 * POST /api/collaboration/canvas/:canvasId/contribute
 */
router.post('/canvas/:canvasId/contribute', async (req, res) => {
  try {
    const { canvasId } = req.params;
    const { agentId, sectionPath, contribution } = req.body;

    if (!agentId || !sectionPath || !contribution) {
      return res.status(400).json({
        error: 'Missing required fields: agentId, sectionPath, contribution'
      });
    }

    const contributionRecord = await orchestrator.canvasManager.contributeToCanvas(
      canvasId,
      agentId,
      sectionPath,
      contribution
    );

    res.status(201).json({
      success: true,
      contribution: contributionRecord,
      message: 'Agent contribution added successfully'
    });

  } catch (error) {
    console.error('Error adding agent contribution:', error);
    res.status(500).json({
      error: 'Failed to add contribution',
      details: error.message
    });
  }
});

/**
 * Start a debate on a canvas element
 * POST /api/collaboration/canvas/:canvasId/debates
 */
router.post('/canvas/:canvasId/debates', async (req, res) => {
  try {
    const { canvasId } = req.params;
    const { initiatorAgentId, topic, position } = req.body;

    if (!initiatorAgentId || !topic || !position) {
      return res.status(400).json({
        error: 'Missing required fields: initiatorAgentId, topic, position'
      });
    }

    const debate = orchestrator.canvasManager.startDebate(
      canvasId,
      initiatorAgentId,
      topic,
      position
    );

    res.status(201).json({
      success: true,
      debate,
      message: 'Debate started successfully'
    });

  } catch (error) {
    console.error('Error starting debate:', error);
    res.status(500).json({
      error: 'Failed to start debate',
      details: error.message
    });
  }
});

/**
 * Respond to an existing debate
 * POST /api/collaboration/canvas/:canvasId/debates/:debateId/respond
 */
router.post('/canvas/:canvasId/debates/:debateId/respond', async (req, res) => {
  try {
    const { canvasId, debateId } = req.params;
    const { agentId, position, evidence } = req.body;

    if (!agentId || !position) {
      return res.status(400).json({
        error: 'Missing required fields: agentId, position'
      });
    }

    const response = orchestrator.canvasManager.respondToDebate(
      canvasId,
      debateId,
      agentId,
      position,
      evidence || []
    );

    // Calculate updated consensus
    const consensus = orchestrator.canvasManager.calculateDebateConsensus(canvasId, debateId);

    res.status(201).json({
      success: true,
      response,
      consensus,
      message: 'Debate response added successfully'
    });

  } catch (error) {
    console.error('Error responding to debate:', error);
    res.status(500).json({
      error: 'Failed to respond to debate',
      details: error.message
    });
  }
});

/**
 * Run simulation on canvas
 * POST /api/collaboration/canvas/:canvasId/simulate
 */
router.post('/canvas/:canvasId/simulate', async (req, res) => {
  try {
    const { canvasId } = req.params;
    const { scenario, simulationAgentId = 'simulation' } = req.body;

    if (!scenario) {
      return res.status(400).json({
        error: 'Missing required field: scenario'
      });
    }

    const simulation = await orchestrator.canvasManager.simulateAgentIteration(
      canvasId,
      simulationAgentId,
      scenario
    );

    res.status(201).json({
      success: true,
      simulation,
      message: 'Simulation completed successfully'
    });

  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({
      error: 'Failed to run simulation',
      details: error.message
    });
  }
});

/**
 * Get collaboration metrics for a canvas
 * GET /api/collaboration/canvas/:canvasId/metrics
 */
router.get('/canvas/:canvasId/metrics', async (req, res) => {
  try {
    const { canvasId } = req.params;
    
    const metrics = orchestrator.canvasManager.getCollaborationMetrics(canvasId);
    
    res.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('Error getting collaboration metrics:', error);
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      details: error.message
    });
  }
});

/**
 * Get available agent roles and their capabilities
 * GET /api/collaboration/agents
 */
router.get('/agents', async (req, res) => {
  try {
    const agents = Array.from(orchestrator.agentRoles.entries()).map(([id, role]) => ({
      id,
      ...role
    }));

    res.json({
      success: true,
      agents,
      total: agents.length
    });

  } catch (error) {
    console.error('Error getting agent roles:', error);
    res.status(500).json({
      error: 'Failed to retrieve agent roles',
      details: error.message
    });
  }
});

/**
 * Get active sessions summary
 * GET /api/collaboration/sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    const { status, clientId } = req.query;
    
    let sessions = Array.from(orchestrator.activeSessions.values());
    
    // Filter by status if specified
    if (status) {
      sessions = sessions.filter(s => s.status === status);
    }
    
    // Filter by clientId if specified
    if (clientId) {
      sessions = sessions.filter(s => s.clientId === clientId);
    }

    const summary = sessions.map(session => ({
      id: session.id,
      clientId: session.clientId,
      frameworkType: session.frameworkType,
      objective: session.objective,
      status: session.status,
      currentPhase: session.currentPhase,
      startTime: session.startTime,
      endTime: session.endTime,
      participatingAgents: session.participatingAgents,
      phasesCompleted: session.phases?.filter(p => p.status === 'completed').length || 0
    }));

    res.json({
      success: true,
      sessions: summary,
      total: sessions.length
    });

  } catch (error) {
    console.error('Error getting sessions summary:', error);
    res.status(500).json({
      error: 'Failed to retrieve sessions',
      details: error.message
    });
  }
});

export default router;
