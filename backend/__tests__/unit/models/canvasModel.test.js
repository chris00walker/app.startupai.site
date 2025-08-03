import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Canvas from '../../../models/canvasModel.js';

describe('Canvas Model', () => {
  let mongoServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Value Proposition Canvas', () => {
    it('should create a value proposition canvas', async () => {
      const canvasData = {
        clientId: 'test-client-123',
        type: 'valueProposition',
        title: 'Test VPC',
        data: {
          customerProfile: {
            customerJobs: ['Increase efficiency', 'Reduce costs'],
            pains: ['Manual processes', 'High operational costs'],
            gains: ['Automation', 'Cost savings']
          },
          valueMap: {
            products: ['AI Platform', 'Consulting Services'],
            painRelievers: ['Process automation', 'Cost optimization'],
            gainCreators: ['Efficiency tools', 'Strategic insights']
          }
        },
        metadata: {
          agentId: 'vpc-agent-001',
          version: '1.0',
          qualityScore: 0.85
        }
      };

      const canvas = new Canvas(canvasData);
      const savedCanvas = await canvas.save();

      expect(savedCanvas._id).toBeDefined();
      expect(savedCanvas.type).toBe('valueProposition');
      expect(savedCanvas.data.customerProfile.customerJobs).toHaveLength(2);
      expect(savedCanvas.metadata.qualityScore).toBe(0.85);
      expect(savedCanvas.status).toBe('draft');
    });

    it('should validate value proposition canvas structure', async () => {
      const invalidCanvas = new Canvas({
        clientId: 'test-client-123',
        type: 'valueProposition',
        title: 'Invalid VPC',
        data: {
          // Missing required customerProfile and valueMap
        }
      });

      await expect(invalidCanvas.save()).rejects.toThrow();
    });
  });

  describe('Business Model Canvas', () => {
    it('should create a business model canvas', async () => {
      const canvasData = {
        clientId: 'test-client-456',
        type: 'businessModel',
        title: 'Test BMC',
        data: {
          keyPartners: ['Tech vendors', 'Consultants'],
          keyActivities: ['Software development', 'Consulting'],
          keyResources: ['AI technology', 'Expert team'],
          valuePropositions: ['AI automation', 'Process optimization'],
          customerRelationships: ['Personal assistance', 'Self-service'],
          channels: ['Direct sales', 'Online platform'],
          customerSegments: ['SMEs', 'Enterprise'],
          costStructure: ['Development costs', 'Operational costs'],
          revenueStreams: ['Subscription fees', 'Consulting revenue']
        },
        metadata: {
          agentId: 'bmc-agent-001',
          version: '1.0',
          qualityScore: 0.90
        }
      };

      const canvas = new Canvas(canvasData);
      const savedCanvas = await canvas.save();

      expect(savedCanvas.type).toBe('businessModel');
      expect(savedCanvas.data.keyPartners).toHaveLength(2);
      expect(savedCanvas.data.valuePropositions).toHaveLength(2);
      expect(savedCanvas.metadata.qualityScore).toBe(0.90);
    });
  });

  describe('Testing Business Ideas Canvas', () => {
    it('should create a testing business ideas canvas', async () => {
      const canvasData = {
        clientId: 'test-client-789',
        type: 'testingBusinessIdeas',
        title: 'Test TBI',
        data: {
          hypotheses: [
            {
              statement: 'Customers will pay for AI automation',
              priority: 'high',
              evidence: ['Market research', 'Customer interviews']
            }
          ],
          experiments: [
            {
              name: 'MVP Test',
              method: 'A/B Testing',
              metrics: ['Conversion rate', 'User engagement'],
              status: 'planned'
            }
          ]
        },
        metadata: {
          agentId: 'tbi-agent-001',
          version: '1.0',
          qualityScore: 0.80
        }
      };

      const canvas = new Canvas(canvasData);
      const savedCanvas = await canvas.save();

      expect(savedCanvas.type).toBe('testingBusinessIdeas');
      expect(savedCanvas.data.hypotheses).toHaveLength(1);
      expect(savedCanvas.data.experiments).toHaveLength(1);
      expect(savedCanvas.data.hypotheses[0].priority).toBe('high');
    });
  });

  describe('Canvas Methods', () => {
    let canvas;

    beforeEach(async () => {
      canvas = new Canvas({
        clientId: 'test-client-methods',
        type: 'valueProposition',
        title: 'Methods Test Canvas',
        data: {
          customerProfile: {
            customerJobs: ['Test job'],
            pains: ['Test pain'],
            gains: ['Test gain']
          },
          valueMap: {
            products: ['Test product'],
            painRelievers: ['Test reliever'],
            gainCreators: ['Test creator']
          }
        },
        metadata: {
          agentId: 'test-agent-001'
        }
      });
      await canvas.save();
    });

    it('should update quality score', async () => {
      await canvas.updateQualityScore(0.95);
      expect(canvas.metadata.qualityScore).toBe(0.95);
    });

    it('should publish canvas', async () => {
      await canvas.publish();
      expect(canvas.status).toBe('published');
      expect(canvas.publishedAt).toBeDefined();
    });

    it('should archive canvas', async () => {
      await canvas.archive();
      expect(canvas.status).toBe('archived');
    });

    it('should generate export data', () => {
      const exportData = canvas.generateExportData();
      expect(exportData.title).toBe('Methods Test Canvas');
      expect(exportData.type).toBe('valueProposition');
      expect(exportData.data).toBeDefined();
      expect(exportData.metadata).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test canvases
      await Canvas.create([
        {
          clientId: 'client-1',
          type: 'valueProposition',
          title: 'VPC 1',
          status: 'published',
          data: { customerProfile: {}, valueMap: {} },
          metadata: { agentId: 'vpc-agent-001' }
        },
        {
          clientId: 'client-1',
          type: 'businessModel',
          title: 'BMC 1',
          status: 'draft',
          data: {
            keyPartners: [], keyActivities: [], keyResources: [], valuePropositions: [],
            customerRelationships: [], channels: [], customerSegments: [], costStructure: [], revenueStreams: []
          },
          metadata: { agentId: 'bmc-agent-001' }
        },
        {
          clientId: 'client-2',
          type: 'valueProposition',
          title: 'VPC 2',
          status: 'published',
          data: { customerProfile: {}, valueMap: {} },
          metadata: { agentId: 'vpc-agent-002' }
        }
      ]);
    });

    it('should find canvases by client', async () => {
      const clientCanvases = await Canvas.findByClient('client-1');
      expect(clientCanvases).toHaveLength(2);
    });

    it('should find canvases by type', async () => {
      const vpcCanvases = await Canvas.findByType('valueProposition');
      expect(vpcCanvases).toHaveLength(2);
    });

    it('should find published canvases', async () => {
      const publishedCanvases = await Canvas.findPublished();
      expect(publishedCanvases).toHaveLength(2);
    });
  });
});
