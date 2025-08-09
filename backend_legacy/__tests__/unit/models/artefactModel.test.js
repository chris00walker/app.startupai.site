// Unit tests for artefactModel

import mongoose from 'mongoose';
import DatabaseTestHelper from '../../utils/testHelpers.js';

// Import the model we're testing
let ArtefactModel;

describe('ArtefactModel Unit Tests', () => {
  beforeAll(async () => {
    await DatabaseTestHelper.connect();
    
    // Import the model after database connection
    const { default: importedModel } = await import('../../../models/artefactModel.js');
    ArtefactModel = importedModel;
    await ArtefactModel.init();
  });

  afterAll(async () => {
    await DatabaseTestHelper.disconnect();
  });

  beforeEach(async () => {
    await DatabaseTestHelper.clearDatabase();
    // Ensure indexes are rebuilt after clearing database
    await ArtefactModel.init();
  });

  describe('Schema Validation', () => {
    it('should create artefact with required fields', async () => {
      const artefactData = {
        id: 'artefact-test-vpc',
        name: 'Test VPC',
        agentId: new mongoose.Types.ObjectId().toString(),
        clientId: new mongoose.Types.ObjectId().toString(),
        type: 'vpc',
        title: 'Test VPC',
        content: { customerSegments: ['segment1'] },
        metadata: { version: '1.0' },
        tags: ['test', 'vpc'],
        status: 'draft',
        createdBy: new mongoose.Types.ObjectId(),
        projectId: new mongoose.Types.ObjectId()
      };

      const artefact = new ArtefactModel(artefactData);
      const savedArtefact = await artefact.save();

      expect(savedArtefact._id).toBeDefined();
      expect(savedArtefact.type).toBe('vpc');
      expect(savedArtefact.title).toBe('Test VPC');
    });

    it('should enforce unique constraints correctly', async () => {
      const artefact1 = new ArtefactModel({
        id: 'unique-artefact-1',
        name: 'Duplicate Title Artefact 1',
        agentId: new mongoose.Types.ObjectId().toString(),
        clientId: new mongoose.Types.ObjectId().toString(),
        type: 'vpc',
        title: 'Unique Test',
        createdBy: new mongoose.Types.ObjectId()
      });
      
      await artefact1.save();

      const artefact2 = new ArtefactModel({
        id: 'unique-artefact-2',
        name: 'Duplicate Title Artefact 2',
        agentId: new mongoose.Types.ObjectId().toString(),
        clientId: new mongoose.Types.ObjectId().toString(),
        type: 'vpc',
        title: 'Unique Test',
        createdBy: new mongoose.Types.ObjectId()
      });

      // This should not throw - titles don't need to be unique
      await expect(artefact2.save()).resolves.toBeDefined();
    });

    it('should validate required fields', async () => {
      const artefact = new ArtefactModel({});
      
      await expect(artefact.save()).rejects.toThrow();
    });
  });

  describe('Business Logic', () => {
    it('should handle complex content structures', async () => {
      const artefact = new ArtefactModel({
        id: 'artefact-bmc-1',
        name: 'Business Model Canvas',
        type: 'bmc',
        agentId: new mongoose.Types.ObjectId().toString(),
        clientId: new mongoose.Types.ObjectId().toString(),
        title: 'Business Model Canvas',
        content: {
          keyPartners: ['Partner1', 'Partner2'],
          keyActivities: ['Activity1'],
          keyResources: ['Resource1'],
          valuePropositions: ['Value1'],
          customerRelationships: ['Relationship1'],
          channels: ['Channel1'],
          customerSegments: ['Segment1'],
          costStructure: ['Cost1'],
          revenueStreams: ['Revenue1']
        },
        createdBy: new mongoose.Types.ObjectId(),
        projectId: new mongoose.Types.ObjectId()
      });

      const savedArtefact = await artefact.save();
      expect(savedArtefact.content.keyPartners).toHaveLength(2);
    });

    it('should handle metadata and versioning', async () => {
      const artefact = new ArtefactModel({
        id: 'artefact-vpc-1',
        name: 'Versioned VPC',
        type: 'vpc',
        title: 'Versioned VPC',
        agentId: new mongoose.Types.ObjectId().toString(),
        clientId: new mongoose.Types.ObjectId().toString(),
        content: { customerSegments: ['segment1'] },
        metadata: {
          version: '1.0',
          createdBy: 'test-user',
          source: 'ai-generated'
        },
        tags: ['vpc', 'ai-generated'],
        status: 'published',
        createdBy: new mongoose.Types.ObjectId(),
        projectId: new mongoose.Types.ObjectId()
      });

      const savedArtefact = await artefact.save();
      expect(savedArtefact.metadata.version).toBe('1.0');
      expect(savedArtefact.tags).toContain('vpc');
    });
  });
});