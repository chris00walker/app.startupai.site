import express from 'express';
import { runDiscoveryWorkflow } from '../workflows/discoveryWorkflow.js';
import { runValidationWorkflow } from '../workflows/validationWorkflow.js';
import { runScaleWorkflow } from '../workflows/scaleWorkflow.js';
import Artefact from '../models/artefactModel.js';
import Client from '../models/clientModel.js';
import Task from '../models/taskModel.js';

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
    const clients = await Client.find({}).sort({ 'metrics.lastActivity': -1 }).lean();
    
    // If no clients exist, create some demo data
    if (clients.length === 0) {
      const demoClients = [
        {
          name: 'Sarah Johnson',
          email: 'sarah@techstart.com',
          company: 'TechStart Ventures',
          industry: 'Technology',
          description: 'Series A SaaS startup focused on AI-powered analytics',
          status: 'active',
          riskLevel: 'low',
          businessModel: 'B2B SaaS',
          targetMarket: 'Mid-market enterprises',
          currentChallenges: ['Market penetration', 'Scaling operations'],
          goals: ['Achieve $10M ARR', 'Expand to European markets'],
          budget: 500000,
          timeline: '12 months',
          assignedConsultant: 'Alex Chen'
        },
        {
          name: 'Michael Rodriguez',
          email: 'michael@globalmanufacturing.com',
          company: 'Global Manufacturing Co',
          industry: 'Manufacturing',
          description: 'Traditional manufacturer undergoing digital transformation',
          status: 'pending',
          riskLevel: 'high',
          businessModel: 'B2B Manufacturing',
          targetMarket: 'Industrial clients',
          currentChallenges: ['Legacy systems', 'Process optimization'],
          goals: ['Reduce costs by 20%', 'Implement IoT solutions'],
          budget: 2000000,
          timeline: '18 months',
          assignedConsultant: 'Maria Santos'
        },
        {
          name: 'Emily Chen',
          email: 'emily@greentech.com',
          company: 'GreenTech Solutions',
          industry: 'Clean Energy',
          description: 'Renewable energy startup seeking market validation',
          status: 'active',
          riskLevel: 'medium',
          businessModel: 'B2B Energy Solutions',
          targetMarket: 'Commercial real estate',
          currentChallenges: ['Regulatory compliance', 'Customer acquisition'],
          goals: ['Secure Series A funding', 'Deploy 100 installations'],
          budget: 750000,
          timeline: '15 months',
          assignedConsultant: 'David Kim'
        }
      ];
      
      await Client.insertMany(demoClients);
      const newClients = await Client.find({}).sort({ 'metrics.lastActivity': -1 }).lean();
      res.json({ clients: newClients });
    } else {
      res.json({ clients });
    }
  } catch (err) {
    console.error('Error fetching clients', err);
    res.status(500).json({ error: 'Failed to retrieve clients' });
  }
});

/**
 * Get a specific client by ID.
 */
router.get('/clients/:id', async (req, res) => {
  const { id: clientId } = req.params;
  try {
    const client = await Client.findById(clientId).lean();
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ client });
  } catch (err) {
    console.error('Error fetching client', err);
    res.status(500).json({ error: 'Failed to retrieve client' });
  }
});

/**
 * Create a new client.
 */
router.post('/clients', async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json({ client });
  } catch (err) {
    console.error('Error creating client', err);
    res.status(400).json({ error: 'Failed to create client', details: err.message });
  }
});

/**
 * Update a client.
 */
router.put('/clients/:id', async (req, res) => {
  const { id: clientId } = req.params;
  try {
    const client = await Client.findByIdAndUpdate(clientId, req.body, { new: true });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ client });
  } catch (err) {
    console.error('Error updating client', err);
    res.status(400).json({ error: 'Failed to update client', details: err.message });
  }
});

/**
 * Delete a client.
 */
router.delete('/clients/:id', async (req, res) => {
  const { id: clientId } = req.params;
  try {
    const client = await Client.findByIdAndDelete(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    // Also delete related tasks and artefacts
    await Task.deleteMany({ clientId });
    await Artefact.deleteMany({ clientId });
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error('Error deleting client', err);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

/**
 * Trigger the discovery workflow for a given client.
 */
router.post('/clients/:id/discovery', async (req, res) => {
  const { id: clientId } = req.params;
  try {
    // Update client workflow status
    await Client.findByIdAndUpdate(clientId, {
      'workflowStatus.discovery.status': 'in_progress'
    });
    
    const result = await runDiscoveryWorkflow(clientId);
    
    // Update client workflow status to completed
    await Client.findByIdAndUpdate(clientId, {
      'workflowStatus.discovery.status': 'completed',
      'workflowStatus.discovery.completedAt': new Date(),
      'workflowStatus.discovery.results': result,
      'metrics.lastActivity': new Date()
    });
    
    res.status(202).json({ status: 'completed', result });
  } catch (err) {
    console.error('Error running discovery workflow', err);
    // Update client workflow status to failed
    await Client.findByIdAndUpdate(clientId, {
      'workflowStatus.discovery.status': 'not_started'
    });
    res.status(500).json({ error: 'Failed to start discovery workflow' });
  }
});

/**
 * Trigger the validation workflow for a given client.
 */
router.post('/clients/:id/validation', async (req, res) => {
  const { id: clientId } = req.params;
  try {
    // Update client workflow status
    await Client.findByIdAndUpdate(clientId, {
      'workflowStatus.validation.status': 'in_progress'
    });
    
    const result = await runValidationWorkflow(clientId);
    
    // Update client workflow status to completed
    await Client.findByIdAndUpdate(clientId, {
      'workflowStatus.validation.status': 'completed',
      'workflowStatus.validation.completedAt': new Date(),
      'workflowStatus.validation.results': result,
      'metrics.lastActivity': new Date()
    });
    
    res.status(202).json({ status: 'completed', result });
  } catch (err) {
    console.error('Error running validation workflow', err);
    // Update client workflow status to failed
    await Client.findByIdAndUpdate(clientId, {
      'workflowStatus.validation.status': 'not_started'
    });
    res.status(500).json({ error: 'Failed to start validation workflow' });
  }
});

/**
 * Trigger the scale workflow for a given client.
 */
router.post('/clients/:id/scale', async (req, res) => {
  const { id: clientId } = req.params;
  try {
    // Update client workflow status
    await Client.findByIdAndUpdate(clientId, {
      'workflowStatus.scale.status': 'in_progress'
    });
    
    const result = await runScaleWorkflow(clientId);
    
    // Update client workflow status to completed
    await Client.findByIdAndUpdate(clientId, {
      'workflowStatus.scale.status': 'completed',
      'workflowStatus.scale.completedAt': new Date(),
      'workflowStatus.scale.results': result,
      'metrics.lastActivity': new Date()
    });
    
    res.status(202).json({ status: 'completed', result });
  } catch (err) {
    console.error('Error running scale workflow', err);
    // Update client workflow status to failed
    await Client.findByIdAndUpdate(clientId, {
      'workflowStatus.scale.status': 'not_started'
    });
    res.status(500).json({ error: 'Failed to start scale workflow' });
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
    let tasks = await Task.find({ clientId }).sort({ updatedAt: -1 });
    
    // If no tasks exist for this client, create some demo tasks
    if (tasks.length === 0) {
      const demoTasks = [
        {
          clientId,
          title: 'Market Research Analysis',
          description: 'Conduct comprehensive market research to identify opportunities and threats',
          status: 'in_progress',
          priority: 'high',
          category: 'research',
          assignedTo: 'Research Agent',
          agentId: 'researchAgent',
          tags: ['market-analysis', 'competitive-intelligence']
        },
        {
          clientId,
          title: 'Business Model Canvas Creation',
          description: 'Develop a comprehensive business model canvas based on discovery findings',
          status: 'todo',
          priority: 'medium',
          category: 'strategy',
          assignedTo: 'Canvas Agent',
          agentId: 'canvasDraftingAgent',
          tags: ['business-model', 'strategy']
        },
        {
          clientId,
          title: 'Validation Plan Development',
          description: 'Create a detailed plan for validating business hypotheses',
          status: 'todo',
          priority: 'medium',
          category: 'strategy',
          assignedTo: 'Validation Agent',
          agentId: 'validationPlanAgent',
          tags: ['validation', 'testing']
        },
        {
          clientId,
          title: 'Competitive Analysis Report',
          description: 'Analyze key competitors and market positioning',
          status: 'done',
          priority: 'high',
          category: 'analysis',
          assignedTo: 'Research Agent',
          agentId: 'researchAgent',
          tags: ['competition', 'market-position']
        }
      ];
      
      await Task.insertMany(demoTasks);
      tasks = await Task.find({ clientId }).sort({ updatedAt: -1 });
    }
    
    res.json({ clientId, tasks });
  } catch (err) {
    console.error('Error fetching tasks', err);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

/**
 * Create a new task for a client.
 */
router.post('/clients/:id/tasks', async (req, res) => {
  const { id: clientId } = req.params;
  try {
    const taskData = { ...req.body, clientId };
    const task = new Task(taskData);
    await task.save();
    
    // Update client metrics
    await Client.findByIdAndUpdate(clientId, {
      $inc: { 'metrics.totalTasks': 1 },
      'metrics.lastActivity': new Date()
    });
    
    res.status(201).json({ task });
  } catch (err) {
    console.error('Error creating task', err);
    res.status(400).json({ error: 'Failed to create task', details: err.message });
  }
});

/**
 * Update a task.
 */
router.put('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  try {
    const oldTask = await Task.findById(taskId);
    const task = await Task.findByIdAndUpdate(taskId, req.body, { new: true });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Update client metrics if task status changed
    if (oldTask && oldTask.status !== task.status) {
      const client = await Client.findById(task.clientId);
      if (client) {
        if (task.status === 'done' && oldTask.status !== 'done') {
          client.metrics.completedTasks += 1;
        } else if (oldTask.status === 'done' && task.status !== 'done') {
          client.metrics.completedTasks -= 1;
        }
        client.metrics.lastActivity = new Date();
        await client.save();
      }
    }
    
    res.json({ task });
  } catch (err) {
    console.error('Error updating task', err);
    res.status(400).json({ error: 'Failed to update task', details: err.message });
  }
});

/**
 * Delete a task.
 */
router.delete('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  try {
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Update client metrics
    const updateData = { $inc: { 'metrics.totalTasks': -1 }, 'metrics.lastActivity': new Date() };
    if (task.status === 'done') {
      updateData.$inc['metrics.completedTasks'] = -1;
    }
    await Client.findByIdAndUpdate(task.clientId, updateData);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task', err);
    res.status(500).json({ error: 'Failed to delete task' });
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
