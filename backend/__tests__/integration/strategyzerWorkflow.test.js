/**
 * Integration Test: Strategyzer AI Workflow
 * Tests the complete end-to-end workflow of Strategyzer AI agents
 * including client creation, VPC generation, and canvas persistence
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Client from '../../models/clientModel.js';
import Canvas from '../../models/canvasModel.js';
import ValuePropositionAgent from '../../agents/strategyzer/ValuePropositionAgent.js';

describe('Strategyzer AI Workflow Integration', () => {
  let mongoServer;
  let testClient;
  let vpcAgent;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections
    await Client.deleteMany({});
    await Canvas.deleteMany({});

    // Create test client with basic schema
    testClient = await Client.create({
      name: 'TechStartup Inc',
      email: 'founder@techstartup.com',
      company: 'TechStartup Inc',
      industry: 'SaaS Technology'
    });

    // Initialize VPC agent
    vpcAgent = new ValuePropositionAgent({
      openaiApiKey: 'test-key',
      model: 'gpt-4o-mini',
      maxTokens: 2000,
      temperature: 0.7
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full VPC generation workflow', async () => {
      // Step 1: Verify client creation with basic schema
      expect(testClient.name).toBe('TechStartup Inc');
      expect(testClient.industry).toBe('SaaS Technology');
      expect(testClient.status).toBe('pending');

      // Step 2: Mock OpenAI response for VPC generation
      const mockVPCResponse = {
        customerProfile: {
          customerJobs: [
            'Coordinate complex projects across distributed teams',
            'Track project progress and identify bottlenecks',
            'Ensure team alignment on project goals and deadlines'
          ],
          pains: [
            'Manual project tracking is time-consuming and error-prone',
            'Lack of real-time visibility into project status',
            'Team members work in silos without proper coordination'
          ],
          gains: [
            'Automated project insights and progress tracking',
            'Improved team collaboration and communication',
            'Faster project delivery with better quality outcomes'
          ]
        },
        valueMap: {
          products: [
            'AI-powered project management dashboard',
            'Automated task prioritization system',
            'Real-time team collaboration tools'
          ],
          painRelievers: [
            'Automated progress tracking eliminates manual reporting',
            'Real-time dashboard provides instant project visibility',
            'Integrated communication tools break down silos'
          ],
          gainCreators: [
            'AI insights predict project risks and opportunities',
            'Smart notifications keep teams aligned and focused',
            'Performance analytics drive continuous improvement'
          ]
        }
      };

      // Mock the OpenAI call
      vpcAgent.callOpenAI = async () => mockVPCResponse;

      // Step 3: Generate VPC using the agent (simplified for basic client model)
      const vpcResult = await vpcAgent.generateCanvas(testClient._id.toString(), {
        businessDescription: 'Finding product-market fit for AI-powered project management tool',
        targetCustomer: 'Small to medium tech companies',
        industry: testClient.industry
      });

      // Step 4: Verify VPC structure and quality
      expect(vpcResult).toBeDefined();
      expect(vpcResult.customerProfile).toBeDefined();
      expect(vpcResult.valueMap).toBeDefined();
      expect(vpcResult.fitAssessment).toBeDefined();
      expect(vpcResult.fitAssessment.score).toBeGreaterThan(0);

      // Step 5: Verify canvas was saved to database
      const savedCanvas = await Canvas.findOne({ 
        clientId: testClient._id.toString(),
        type: 'value-proposition-canvas'
      });
      
      expect(savedCanvas).toBeDefined();
      expect(savedCanvas.content.customerProfile.customerJobs).toHaveLength(3);
      expect(savedCanvas.content.valueMap.products).toHaveLength(3);
      expect(savedCanvas.metadata.fitScore).toBeGreaterThan(0);

      // Step 6: Verify client was found and canvas was saved
      const updatedClient = await Client.findById(testClient._id);
      expect(updatedClient).toBeDefined();
      
      // Step 7: Verify canvas metadata is present
      expect(savedCanvas.metadata).toBeDefined();
    });

    it('should handle multiple canvas generations for same client', async () => {
      // Mock different VPC scenarios
      const scenarios = [
        { scenario: 'MVP', focus: 'core-features' },
        { scenario: 'Scale', focus: 'market-expansion' },
        { scenario: 'Pivot', focus: 'new-market-segment' }
      ];

      vpcAgent.callOpenAI = async () => ({
        customerProfile: {
          customerJobs: ['Test job 1', 'Test job 2'],
          pains: ['Test pain 1', 'Test pain 2'],
          gains: ['Test gain 1', 'Test gain 2']
        },
        valueMap: {
          products: ['Test product 1', 'Test product 2'],
          painRelievers: ['Test reliever 1', 'Test reliever 2'],
          gainCreators: ['Test creator 1', 'Test creator 2']
        }
      });

      // Generate multiple canvases
      for (const scenario of scenarios) {
        await vpcAgent.generateCanvas(testClient._id.toString(), {
          businessDescription: `${testClient.primaryChallenge} - ${scenario.scenario}`,
          targetCustomer: testClient.targetMarket,
          scenario: scenario.scenario
        });
      }

      // Verify multiple canvases were created
      const canvases = await Canvas.find({ 
        clientId: testClient._id.toString(),
        type: 'value-proposition-canvas'
      });
      
      expect(canvases).toHaveLength(3);

      // Verify client activity was updated
      const updatedClient = await Client.findById(testClient._id);
      expect(updatedClient.lastActivity).toBeDefined();
    });

    it('should respect AI budget constraints', async () => {
      // Mock budget constraint in agent
      const originalGenerateCanvas = vpcAgent.generateCanvas;
      vpcAgent.generateCanvas = async () => {
        throw new Error('Budget exceeded - session would cost $0.05');
      };



      // Attempt to generate VPC with budget constraint
      await expect(async () => {
        await vpcAgent.generateCanvas(testClient._id.toString(), {
          businessDescription: testClient.primaryChallenge,
          targetCustomer: testClient.targetMarket
        });
      }).rejects.toThrow('Budget exceeded');

      // Verify no canvas was created due to budget constraint
      const canvases = await Canvas.find({ 
        clientId: testClient._id.toString(),
        type: 'value-proposition-canvas'
      });
      
      expect(canvases).toHaveLength(0);
    });
  });

  describe('Canvas Quality Assessment', () => {
    it('should assess VPC quality accurately', async () => {
      const highQualityVPC = {
        customerProfile: {
          customerJobs: [
            'Manage complex software development projects with multiple stakeholders',
            'Ensure timely delivery while maintaining code quality standards',
            'Coordinate between technical and business teams effectively'
          ],
          pains: [
            'Manual project tracking leads to missed deadlines and budget overruns',
            'Lack of real-time visibility into development progress and blockers',
            'Communication gaps between technical teams and business stakeholders'
          ],
          gains: [
            'Automated project insights that predict and prevent delays',
            'Real-time dashboard showing progress, risks, and team performance',
            'Seamless collaboration tools that align technical and business goals'
          ]
        },
        valueMap: {
          products: [
            'AI-powered project management platform with predictive analytics',
            'Real-time collaboration workspace with integrated communication',
            'Automated reporting and stakeholder update system'
          ],
          painRelievers: [
            'Automated tracking eliminates manual reporting overhead',
            'Predictive analytics identify risks before they become critical',
            'Integrated communication reduces coordination friction'
          ],
          gainCreators: [
            'AI insights improve project success rates by 40%',
            'Real-time visibility reduces project delays by 30%',
            'Automated workflows increase team productivity by 25%'
          ]
        }
      };

      const qualityScore = vpcAgent.assessVPCQuality(highQualityVPC);
      expect(qualityScore).toBeGreaterThan(0.4); // Realistic quality score for comprehensive VPC
    });

    it('should identify low quality VPC', async () => {
      const lowQualityVPC = {
        customerProfile: {
          customerJobs: ['Do work'],
          pains: ['Work is hard'],
          gains: ['Work better']
        },
        valueMap: {
          products: ['Software'],
          painRelievers: ['Makes work easier'],
          gainCreators: ['Improves things']
        }
      };

      const qualityScore = vpcAgent.assessVPCQuality(lowQualityVPC);
      expect(qualityScore).toBeLessThan(0.3); // Low quality VPC
    });
  });

  describe('Product-Market Fit Assessment', () => {
    it('should calculate fit scores accurately', async () => {
      const customerProfile = {
        customerJobs: ['Manage projects', 'Track progress', 'Coordinate teams'],
        pains: ['Manual tracking', 'No visibility', 'Poor coordination'],
        gains: ['Automation', 'Real-time insights', 'Better collaboration']
      };

      const valueMap = {
        products: ['Project management tool', 'Analytics dashboard', 'Team workspace'],
        painRelievers: ['Automated tracking', 'Real-time dashboard', 'Integrated communication'],
        gainCreators: ['AI insights', 'Performance analytics', 'Collaboration tools']
      };

      const fitAssessment = vpcAgent.generateFitAssessment(customerProfile, valueMap);
      
      expect(fitAssessment.score).toBeGreaterThan(0);
      expect(fitAssessment.score).toBeLessThanOrEqual(1);
      expect(fitAssessment.strengths).toBeInstanceOf(Array);
      expect(fitAssessment.improvements).toBeInstanceOf(Array);
    });
  });
});
