// Unit tests for artefactModel

import mongoose from 'mongoose';
import { DatabaseTestHelper, generateTestArtefact } from '../../utils/testHelpers.js';

// Import the model we're testing
let ArtefactModel;

describe('ArtefactModel Unit Tests', () => {
  let dbHelper;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.connect();
    
    // Import the model after database connection
    const { default: importedModel } = await import('../../../models/artefactModel.js');
    ArtefactModel = importedModel;
    await ArtefactModel.init();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
    // Ensure indexes are rebuilt after clearing database
    await ArtefactModel.init();
  });

  describe('Schema Validation', () => {
    it('should create a valid artefact with required fields', async () => {
      const artefactData = generateTestArtefact({
        id: 'test-artefact-001',
        name: 'Market Analysis Report',
        type: 'Analysis',
        status: 'completed',
        clientId: 'client-123',
        content: 'Detailed market analysis content',
        metadata: { version: '1.0' }
      });

      const artefact = new ArtefactModel(artefactData);
      const savedArtefact = await artefact.save();

      expect(savedArtefact._id).toBeDefined();
      expect(savedArtefact.id).toBe('test-artefact-001');
      expect(savedArtefact.name).toBe('Market Analysis Report');
      expect(savedArtefact.type).toBe('Analysis');
      expect(savedArtefact.status).toBe('completed');
      expect(savedArtefact.clientId).toBe('client-123');
      expect(savedArtefact.content).toBe('Detailed market analysis content');
      expect(savedArtefact.createdAt).toBeDefined();
      expect(savedArtefact.updatedAt).toBeDefined();
    });

    it('should reject artefact without required fields', async () => {
      const artefact = new ArtefactModel({});
      
      await expect(artefact.save()).rejects.toThrow();
    });

    it('should reject artefact with invalid type', async () => {
      const artefactData = generateTestArtefact({
        type: 'InvalidType'
      });

      const artefact = new ArtefactModel(artefactData);
      
      await expect(artefact.save()).rejects.toThrow();
    });

    it('should reject artefact with invalid status', async () => {
      const artefactData = generateTestArtefact({
        status: 'invalid-status'
      });

      const artefact = new ArtefactModel(artefactData);
      
      await expect(artefact.save()).rejects.toThrow();
    });

    it('should enforce unique id constraint', async () => {
      // Ensure indexes are created before testing
      await ArtefactModel.collection.createIndex({ id: 1 }, { unique: true, name: 'artefact_id_unique' });
      
      const artefactData1 = generateTestArtefact({ id: 'duplicate-id' });
      const artefactData2 = generateTestArtefact({ id: 'duplicate-id' });

      const artefact1 = new ArtefactModel(artefactData1);
      await artefact1.save();

      const artefact2 = new ArtefactModel(artefactData2);
      
      await expect(artefact2.save()).rejects.toThrow();
    });
  });

  describe('Model Methods', () => {
    it('should find artefacts by clientId', async () => {
      const clientId = 'test-client-123';
      
      // Create multiple artefacts for the same client
      const artefact1 = new ArtefactModel(generateTestArtefact({ 
        id: 'artefact-1', 
        clientId,
        name: 'Analysis 1' 
      }));
      const artefact2 = new ArtefactModel(generateTestArtefact({ 
        id: 'artefact-2', 
        clientId,
        name: 'Analysis 2' 
      }));
      const artefact3 = new ArtefactModel(generateTestArtefact({ 
        id: 'artefact-3', 
        clientId: 'different-client',
        name: 'Analysis 3' 
      }));

      await Promise.all([artefact1.save(), artefact2.save(), artefact3.save()]);

      const clientArtefacts = await ArtefactModel.find({ clientId });
      
      expect(clientArtefacts).toHaveLength(2);
      expect(clientArtefacts.map(a => a.name)).toContain('Analysis 1');
      expect(clientArtefacts.map(a => a.name)).toContain('Analysis 2');
      expect(clientArtefacts.map(a => a.name)).not.toContain('Analysis 3');
    });

    it('should find artefacts by status', async () => {
      const artefact1 = new ArtefactModel(generateTestArtefact({ 
        id: 'artefact-1', 
        status: 'completed' 
      }));
      const artefact2 = new ArtefactModel(generateTestArtefact({ 
        id: 'artefact-2', 
        status: 'in-progress' 
      }));
      const artefact3 = new ArtefactModel(generateTestArtefact({ 
        id: 'artefact-3', 
        status: 'completed' 
      }));

      await Promise.all([artefact1.save(), artefact2.save(), artefact3.save()]);

      const completedArtefacts = await ArtefactModel.find({ status: 'completed' });
      
      expect(completedArtefacts).toHaveLength(2);
    });

    it('should update artefact status', async () => {
      const artefact = new ArtefactModel(generateTestArtefact({ 
        id: 'artefact-update-test',
        status: 'pending' 
      }));
      
      await artefact.save();
      
      const updatedArtefact = await ArtefactModel.findOneAndUpdate(
        { id: 'artefact-update-test' },
        { status: 'completed' },
        { new: true }
      );
      
      expect(updatedArtefact.status).toBe('completed');
    });
  });

  describe('Data Integrity', () => {
    it('should automatically set timestamps', async () => {
      const artefact = new ArtefactModel(generateTestArtefact());
      const savedArtefact = await artefact.save();

      expect(savedArtefact.createdAt).toBeInstanceOf(Date);
      expect(savedArtefact.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt timestamp on modification', async () => {
      const artefact = new ArtefactModel(generateTestArtefact());
      const savedArtefact = await artefact.save();
      const originalUpdatedAt = savedArtefact.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedArtefact.name = 'Updated Name';
      const updatedArtefact = await savedArtefact.save();

      expect(updatedArtefact.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
