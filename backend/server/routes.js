import express from 'express';
import { runDiscoveryWorkflow } from '../workflows/discoveryWorkflow.js';
import { runValidationWorkflow } from '../workflows/validationWorkflow.js';
import Artefact from '../models/artefactModel.js';

const router = express.Router();

/**
 * Health check endpoint for frontend connectivity testing.
 */
router.get('/health', async (_req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'connected',
      milvus: 'connected'
    }
  });
});

/**
 * List all clients with basic information.
 */
router.get('/clients', async (_req, res) => {
  try {
    // For now, return mock client data since we don't have a Client model yet
    // In production, this would query the Client collection
    const mockClients = [
      {
        id: 'client-001',
        name: 'Acme Corporation',
        status: 'active',
        lastActivity: new Date().toISOString(),
        riskLevel: 'medium'
      },
      {
        id: 'client-002', 
        name: 'TechStart Inc',
        status: 'active',
        lastActivity: new Date().toISOString(),
        riskLevel: 'low'
      },
      {
        id: 'client-003',
        name: 'Global Enterprises',
        status: 'pending',
        lastActivity: new Date().toISOString(),
        riskLevel: 'high'
      }
    ];
    res.json({ clients: mockClients });
  } catch (err) {
    console.error('Error fetching clients', err);
    res.status(500).json({ error: 'Failed to retrieve clients' });
  }
});

/**
 * Trigger the discovery workflow for a given client.
 */
router.post('/clients/:id/discovery', async (req, res) => {
  const { id: clientId } = req.params;
  try {
    const result = await runDiscoveryWorkflow(clientId);
    res.status(202).json({ status: 'started', result });
  } catch (err) {
    console.error('Error running discovery workflow', err);
    res.status(500).json({ error: 'Failed to start discovery workflow' });
  }
});

/**
 * Trigger the validation workflow for a given client.
 */
router.post('/clients/:id/validation', async (req, res) => {
  const { id: clientId } = req.params;
  try {
    const result = await runValidationWorkflow(clientId);
    res.status(202).json({ status: 'started', result });
  } catch (err) {
    console.error('Error running validation workflow', err);
    res.status(500).json({ error: 'Failed to start validation workflow' });
  }
});

/**
 * Retrieve artefacts for a given client.
 */
router.get('/clients/:id/artefacts', async (req, res) => {
  const { id: clientId } = req.params;
  try {
    const artefacts = await Artefact.find({ clientId }).sort({ createdAt: -1 });
    res.json({ clientId, artefacts });
  } catch (err) {
    console.error('Error fetching artefacts', err);
    res.status(500).json({ error: 'Failed to retrieve artefacts' });
  }
});

/**
 * Retrieve tasks for a given client.
 */
router.get('/clients/:id/tasks', async (req, res) => {
  const { id: clientId } = req.params;
  try {
    const tasks = await import('../models/taskModel.js').then(m => m.default).
      then(Task => Task.find({ clientId }).sort({ updatedAt: -1 }));
    res.json({ clientId, tasks });
  } catch (err) {
    console.error('Error fetching tasks', err);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

/**
 * Retrieve aggregated task counts by status for metrics.
 */
router.get('/metrics/tasks', async (_req, res) => {
  try {
    const Task = (await import('../models/taskModel.js')).default;
    const agg = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const counts = agg.reduce((obj, item) => {
      obj[item._id] = item.count;
      return obj;
    }, {});
    res.json({ counts });
  } catch (err) {
    console.error('Error fetching task metrics', err);
    res.status(500).json({ error: 'Failed to retrieve task metrics' });
  }
});

/**
 * Return current status, logs, and metrics for each agent.
 */
router.get('/agents/status', async (_req, res) => {
  // TODO: integrate with agent orchestration to gather real status, logs, metrics
  res.json({ agents: [] });
});
export default router;
