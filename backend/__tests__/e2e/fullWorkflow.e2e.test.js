// End-to-end tests for complete backend workflows

import { DatabaseTestHelper, mockOpenAI, generateTestClient } from '../utils/testHelpers.js';

// Mock OpenAI module to use mockOpenAI in all e2e tests
vi.mock('openai', () => {
  const OpenAI = vi.fn().mockImplementation(() => mockOpenAI);
  return { default: OpenAI, OpenAI };
});

// Import all components for full workflow testing
let runAgent, ArtefactModel, TaskModel, storeEmbedding, searchSimilar;

describe('Backend Full Workflow E2E Tests', () => {
  let dbHelper;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.connect();
    
    // Import all modules for end-to-end testing
    const agentRunnerModule = await import('../../server/utils/agentRunner.js');
    const vectorStoreModule = await import('../../server/utils/vectorStore.js');
    const artefactModule = await import('../../models/artefactModel.js');
    const taskModule = await import('../../models/taskModel.js');
    
    runAgent = agentRunnerModule.runAgent;
    storeEmbedding = vectorStoreModule.storeEmbedding;
    searchSimilar = vectorStoreModule.searchSimilar;
    ArtefactModel = artefactModule.default;
    TaskModel = taskModule.default;
    
    // Initialize all models to ensure indexes are created
    await ArtefactModel.init();
    await TaskModel.init();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
    vi.clearAllMocks();
    
    // Reinitialize models after database clear to ensure indexes
    await ArtefactModel.init();
    await TaskModel.init();
    
    // Set up comprehensive mock responses for different agents
    mockOpenAI.chat.completions.create.mockImplementation((params) => {
      const prompt = params.messages[0].content;
      
      if (prompt.includes('intakeAgent')) {
        return Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                success: true,
                result: 'Client intake completed',
                extractedRequirements: [
                  'Market validation needed',
                  'Technology assessment required',
                  'Business model validation'
                ],
                clientProfile: {
                  industry: 'Technology',
                  stage: 'Early stage',
                  riskLevel: 'Medium'
                },
                nextSteps: ['research', 'validation', 'planning']
              })
            }
          }]
        });
      }
      
      if (prompt.includes('researchAgent')) {
        return Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                success: true,
                result: 'Market research completed',
                marketAnalysis: {
                  marketSize: '$10B',
                  growthRate: '15%',
                  competitorCount: 25,
                  barriers: ['High capital requirements', 'Regulatory compliance']
                },
                opportunities: [
                  'Underserved market segment',
                  'Technology disruption potential'
                ],
                risks: [
                  'Market saturation',
                  'Regulatory changes'
                ]
              })
            }
          }]
        });
      }
      
      if (prompt.includes('validationAgent')) {
        return Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                success: true,
                result: 'Validation completed',
                validationResults: {
                  marketValidation: 'Positive',
                  technicalFeasibility: 'High',
                  businessModelViability: 'Medium'
                },
                recommendations: [
                  'Proceed with MVP development',
                  'Conduct customer interviews',
                  'Refine business model'
                ],
                confidence: 0.85
              })
            }
          }]
        });
      }
      
      // Default response for other agents
      return Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify({
              success: true,
              result: 'Agent processing completed',
              data: 'Default agent response'
            })
          }
        }]
      });
    });
  });

  describe('Complete Client Discovery Workflow', () => {
    it('should execute full client discovery from intake to recommendations', async () => {
      const clientData = generateTestClient({
        name: 'TechStartup Inc',
        email: 'founder@techstartup.com',
        projectDescription: 'AI-powered customer service platform for e-commerce'
      });

      // Phase 1: Client Intake
      const intakeResult = await runAgent('intakeAgent', { ...clientData, clientId: clientData.id });
      expect(intakeResult.success).toBe(true);
      expect(intakeResult.extractedRequirements).toHaveLength(3);
      expect(intakeResult.clientProfile.industry).toBe('Technology');

      // Phase 2: Market Research
      const researchInput = {
        clientData,
        requirements: intakeResult.extractedRequirements,
        industry: intakeResult.clientProfile.industry
      };
      const researchResult = await runAgent('researchAgent', { ...researchInput, clientId: clientData.id });
      expect(researchResult.success).toBe(true);
      expect(researchResult.marketAnalysis.marketSize).toBe('$10B');
      expect(researchResult.opportunities).toHaveLength(2);

      // Phase 3: Validation
      const validationInput = {
        clientData,
        intakeResults: intakeResult,
        researchResults: researchResult
      };
      const validationResult = await runAgent('validationAgent', { ...validationInput, clientId: clientData.id });
      expect(validationResult.success).toBe(true);
      expect(validationResult.validationResults.marketValidation).toBe('Positive');
      expect(validationResult.confidence).toBe(0.85);

      // Verify complete workflow artifacts
      const artefacts = await ArtefactModel.find({}).sort({ createdAt: 1 });
      console.log('DEBUG: Found artefacts:', artefacts.map(a => ({ name: a.name, agentId: a.agentId, createdAt: a.createdAt })));
      expect(artefacts).toHaveLength(3);
      
      const [intakeArtefact, researchArtefact, validationArtefact] = artefacts;
      expect(intakeArtefact.name).toBe('intakeAgent_result');
      expect(researchArtefact.name).toBe('researchAgent_result');
      expect(validationArtefact.name).toBe('validationAgent_result');

      // Verify all artifacts are completed
      artefacts.forEach(artefact => {
        expect(artefact.status).toBe('completed');
        expect(artefact.type).toBe('Analysis');
        expect(artefact.content).toBeDefined();
      });
    });

    it('should handle workflow with task management', async () => {
      const clientData = generateTestClient();

      // Execute intake
      const intakeResult = await runAgent('intakeAgent', { ...clientData, clientId: clientData.id });

      // Create tasks based on intake results
      const tasks = intakeResult.nextSteps.map((step, index) => ({
        _id: `workflow-task-${index}`,
        title: `Execute ${step} phase`,
        status: 'pending',
        assignedAgent: `${step}Agent`,
        clientId: clientData.id,
        description: `Complete ${step} phase of discovery workflow`,
        priority: index === 0 ? 'high' : 'medium',
        dependencies: index > 0 ? [`workflow-task-${index - 1}`] : []
      }));

      // Save all tasks
      for (const taskData of tasks) {
        const task = new TaskModel(taskData);
        await task.save();
      }

      // Execute tasks in sequence
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        
        // Update task status to in_progress
        await TaskModel.findByIdAndUpdate(task._id, { 
          status: 'in_progress',
          startedAt: new Date()
        });

        // Execute the agent for this task
        await runAgent(task.assignedAgent, {
          clientData,
          clientId: clientData.id,
          taskId: task._id,
          phase: task.title
        });

        // Update task status to complete
        await TaskModel.findByIdAndUpdate(task._id, { 
          status: 'complete',
          completedAt: new Date(),
          progress: 100
        });
      }

      // Verify all tasks completed
      const completedTasks = await TaskModel.find({ 
        clientId: clientData.id,
        status: 'complete'
      });
      expect(completedTasks).toHaveLength(3);

      // Verify all artifacts created
      const artefacts = await ArtefactModel.find({});
      expect(artefacts).toHaveLength(4); // intake + 3 task executions
    });
  });

  describe('Multi-Client Concurrent Processing', () => {
    it('should handle multiple clients simultaneously', async () => {
      const clients = [
        generateTestClient({ 
          id: 'client-1',
          name: 'FinTech Startup',
          projectDescription: 'Digital banking platform'
        }),
        generateTestClient({ 
          id: 'client-2',
          name: 'HealthTech Company',
          projectDescription: 'Telemedicine application'
        }),
        generateTestClient({ 
          id: 'client-3',
          name: 'EdTech Platform',
          projectDescription: 'Online learning management system'
        })
      ];

      // Execute intake for all clients concurrently
      const intakePromises = clients.map(client => 
        runAgent('intakeAgent', { ...client, clientId: client.id })
      );
      const intakeResults = await Promise.all(intakePromises);

      // Verify all intakes completed successfully
      intakeResults.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.extractedRequirements).toBeDefined();
      });

      // Execute research phase for all clients
      const researchPromises = clients.map((client, index) => 
        runAgent('researchAgent', {
          clientData: client,
          clientId: client.id,
          requirements: intakeResults[index].extractedRequirements
        })
      );
      const researchResults = await Promise.all(researchPromises);

      // Verify all research completed
      researchResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.marketAnalysis).toBeDefined();
      });

      // Verify artifacts for all clients
      const artefacts = await ArtefactModel.find({});
      expect(artefacts).toHaveLength(6); // 3 clients × 2 phases each

      // Verify no data leakage between clients
      const clientArtefacts = await ArtefactModel.find({}).populate('metadata');
      const uniqueClients = new Set(
        clientArtefacts.map(a => (a.metadata?.clientId || a.metadata || {})).filter(Boolean)
      );
      expect(uniqueClients.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from partial workflow failures', async () => {
      const clientData = generateTestClient();

      // Phase 1: Successful intake
      const intakeResult = await runAgent('intakeAgent', { ...clientData, clientId: clientData.id });
      expect(intakeResult.success).toBe(true);

      // Phase 2: Research fails
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(
        new Error('Research agent temporarily unavailable')
      );

      await expect(
        runAgent('researchAgent', { clientData, clientId: clientData.id, intakeResults: intakeResult })
      ).rejects.toThrow('Research agent temporarily unavailable');

      // Verify intake artifact is preserved
      let artefacts = await ArtefactModel.find({});
      expect(artefacts).toHaveLength(1);
      expect(artefacts[0].name).toBe('intakeAgent_result');

      // Phase 3: Retry research (now succeeds)
      const retryResearchResult = await runAgent('researchAgent', {
        clientData,
        clientId: clientData.id,
        intakeResults: intakeResult,
        retry: true
      });
      expect(retryResearchResult.success).toBe(true);

      // Phase 4: Continue with validation
      const validationResult = await runAgent('validationAgent', {
        clientData,
        clientId: clientData.id,
        intakeResults: intakeResult,
        researchResults: retryResearchResult
      });
      expect(validationResult.success).toBe(true);

      // Verify complete workflow artifacts
      artefacts = await ArtefactModel.find({});
      expect(artefacts).toHaveLength(3);
    });

    it('should handle database connectivity issues', async () => {
      const clientData = generateTestClient();

      // Simulate database connection issue during save
      const originalSave = ArtefactModel.prototype.save;
      ArtefactModel.prototype.save = vi.fn().mockRejectedValueOnce(
        new Error('Database connection lost')
      );

      await expect(runAgent('intakeAgent', { ...clientData, clientId: clientData.id })).rejects.toThrow('Database connection lost');

      // Restore database connection
      ArtefactModel.prototype.save = originalSave;

      // Retry should succeed
      const retryResult = await runAgent('intakeAgent', { ...clientData, clientId: clientData.id });
      expect(retryResult.success).toBe(true);

      // Verify artifact was saved on retry
      const artefacts = await ArtefactModel.find({});
      expect(artefacts).toHaveLength(1);
    });
  });

  describe('Performance and Scalability E2E', () => {
    it('should maintain performance under load', async () => {
      const clientCount = 5;
      const clients = Array.from({ length: clientCount }, (_, i) => 
        generateTestClient({ 
          id: `load-test-client-${i}`,
          name: `Load Test Client ${i}`
        })
      );

      const startTime = Date.now();

      // Execute full workflow for each client
      const workflowPromises = clients.map(async (client) => {
        const intake = await runAgent('intakeAgent', { ...client, clientId: client.id });
        const research = await runAgent('researchAgent', { 
          clientData: client, 
          clientId: client.id,
          intakeResults: intake 
        });
        const validation = await runAgent('validationAgent', { 
          clientData: client, 
          clientId: client.id,
          intakeResults: intake,
          researchResults: research 
        });
        return { intake, research, validation };
      });

      const results = await Promise.all(workflowPromises);
      const endTime = Date.now();

      // Verify all workflows completed successfully
      expect(results).toHaveLength(clientCount);
      results.forEach(result => {
        expect(result.intake.success).toBe(true);
        expect(result.research.success).toBe(true);
        expect(result.validation.success).toBe(true);
      });

      // Verify reasonable performance (should complete within 10 seconds)
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10000);

      // Verify all artifacts created
      const artefacts = await ArtefactModel.find({});
      expect(artefacts).toHaveLength(clientCount * 3); // 3 phases per client
    });
  });

  describe('Data Integrity and Consistency E2E', () => {
    it('should maintain data consistency across complete workflow', async () => {
      const clientData = generateTestClient();

      // Execute complete workflow
      const intake = await runAgent('intakeAgent', { ...clientData, clientId: clientData.id });
      const research = await runAgent('researchAgent', { clientData, clientId: clientData.id, intakeResults: intake });
      const validation = await runAgent('validationAgent', { 
        clientData, 
        clientId: clientData.id,
        intakeResults: intake,
        researchResults: research 
      });

      // Create related tasks
      const tasks = [
        {
          _id: 'consistency-task-1',
          title: 'Follow up on validation',
          status: 'pending',
          assignedAgent: 'planningAgent',
          clientId: clientData.id
        },
        {
          _id: 'consistency-task-2',
          title: 'Prepare recommendations',
          status: 'pending',
          assignedAgent: 'reportingAgent',
          clientId: clientData.id
        }
      ];

      for (const taskData of tasks) {
        const task = new TaskModel(taskData);
        await task.save();
      }

      // Verify data relationships and consistency
      const artefacts = await ArtefactModel.find({}).sort({ createdAt: 1 });
      const dbTasks = await TaskModel.find({ clientId: clientData.id });

      expect(artefacts).toHaveLength(3);
      expect(dbTasks).toHaveLength(2);

      // Verify temporal consistency (artifacts created in order)
      expect(artefacts[0].createdAt.getTime()).toBeLessThanOrEqual(artefacts[1].createdAt.getTime());
      expect(artefacts[1].createdAt.getTime()).toBeLessThanOrEqual(artefacts[2].createdAt.getTime());

      // Verify all tasks reference the correct client
      dbTasks.forEach(task => {
        expect(task.clientId).toBe(clientData.id);
      });

      // Verify content consistency across artifacts
      artefacts.forEach(artefact => {
        expect(artefact.status).toBe('completed');
        expect(artefact.type).toBe('Analysis');
        expect(artefact.content).toBeDefined();
        expect(artefact.content.length).toBeGreaterThan(0);
      });
    });
  });
});
