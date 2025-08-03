import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../server/index.js';
import Client from '../../server/models/clientModel.js';
import Artefact from '../../server/models/artefactModel.js';

describe('Strategyzer Consulting Scenarios E2E Tests', () => {
  let mongoServer;
  let testClient;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Client.deleteMany({});
    await Artefact.deleteMany({});
  });

  describe('Complete SaaS Startup Consulting Journey', () => {
    it('should guide a SaaS startup through complete Strategyzer methodology', async () => {
      // Step 1: Create client
      const clientData = {
        name: 'TechFlow Solutions',
        email: 'founder@techflow.com',
        company: 'TechFlow Solutions',
        industry: 'Technology',
        description: 'AI-powered workflow automation for small businesses',
        currentChallenges: [
          'Unclear target market',
          'Low customer retention',
          'Pricing strategy confusion'
        ],
        goals: [
          'Define clear value proposition',
          'Improve customer retention to 90%',
          'Establish product-market fit'
        ]
      };

      const clientResponse = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201);

      const clientId = clientResponse.body.client._id;

      // Step 2: Run discovery workflow
      const discoveryResponse = await request(app)
        .post('/api/workflows/discovery')
        .send({ clientId })
        .expect(200);

      expect(discoveryResponse.body.status).toBe('completed');
      expect(discoveryResponse.body.result).toBeDefined();

      // Verify discovery artifacts were created
      const discoveryArtefacts = await Artefact.find({ 
        clientId, 
        name: { $in: ['intakeAgent', 'researchAgent', 'canvasDraftingAgent', 'validationPlanAgent'] }
      });
      expect(discoveryArtefacts.length).toBeGreaterThan(0);

      // Step 3: Verify customer discovery insights
      const intakeArtefact = discoveryArtefacts.find(a => a.name === 'intakeAgent');
      expect(intakeArtefact).toBeDefined();
      
      const intakeData = typeof intakeArtefact.data === 'string' 
        ? JSON.parse(intakeArtefact.data) 
        : intakeArtefact.data;
      
      expect(intakeData.customerJobs).toBeDefined();
      expect(intakeData.customerJobs.functional).toBeInstanceOf(Array);
      expect(intakeData.customerPains).toBeInstanceOf(Array);
      expect(intakeData.customerGains).toBeInstanceOf(Array);

      // Step 4: Verify Value Proposition Canvas generation
      const canvasArtefact = discoveryArtefacts.find(a => a.name === 'canvasDraftingAgent');
      expect(canvasArtefact).toBeDefined();
      
      const canvasData = typeof canvasArtefact.data === 'string' 
        ? JSON.parse(canvasArtefact.data) 
        : canvasArtefact.data;
      
      expect(canvasData.valuePropositionCanvas).toBeDefined();
      expect(canvasData.valuePropositionCanvas.customerProfile).toBeDefined();
      expect(canvasData.valuePropositionCanvas.valueMap).toBeDefined();

      // Step 5: Verify validation plan
      const validationArtefact = discoveryArtefacts.find(a => a.name === 'validationPlanAgent');
      expect(validationArtefact).toBeDefined();
      
      const validationData = typeof validationArtefact.data === 'string' 
        ? JSON.parse(validationArtefact.data) 
        : validationArtefact.data;
      
      expect(validationData.validationPlan).toBeDefined();
      expect(validationData.validationPlan.hypotheses).toBeInstanceOf(Array);
      expect(validationData.validationPlan.experiments).toBeInstanceOf(Array);

      // Step 6: Retrieve client dashboard
      const dashboardResponse = await request(app)
        .get(`/api/clients/${clientId}`)
        .expect(200);

      expect(dashboardResponse.body.client).toBeDefined();
      expect(dashboardResponse.body.artefacts).toBeDefined();
      expect(dashboardResponse.body.artefacts.length).toBeGreaterThan(0);
    });
  });

  describe('E-commerce Business Model Design', () => {
    it('should design business model for e-commerce startup', async () => {
      // Create e-commerce client
      const clientData = {
        name: 'EcoMarket',
        email: 'founder@ecomarket.com',
        company: 'EcoMarket',
        industry: 'E-commerce',
        description: 'Sustainable products marketplace for environmentally conscious consumers',
        currentChallenges: [
          'Customer acquisition costs too high',
          'Supplier relationship management',
          'Inventory optimization'
        ],
        goals: [
          'Reduce CAC by 40%',
          'Build sustainable supply chain',
          'Achieve profitability'
        ]
      };

      const clientResponse = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201);

      const clientId = clientResponse.body.client._id;

      // Run complete discovery workflow
      const discoveryResponse = await request(app)
        .post('/api/workflows/discovery')
        .send({ clientId })
        .expect(200);

      // Verify e-commerce specific insights
      const artefacts = await Artefact.find({ clientId });
      expect(artefacts.length).toBeGreaterThan(0);

      // Check for e-commerce relevant customer jobs
      const intakeArtefact = artefacts.find(a => a.name === 'intakeAgent');
      const intakeData = typeof intakeArtefact.data === 'string' 
        ? JSON.parse(intakeArtefact.data) 
        : intakeArtefact.data;

      const allJobs = [
        ...intakeData.customerJobs.functional,
        ...intakeData.customerJobs.emotional,
        ...intakeData.customerJobs.social
      ].join(' ').toLowerCase();

      expect(allJobs).toMatch(/shop|buy|purchase|browse|discover/);
      expect(allJobs).toMatch(/sustainable|eco|environment|green/);
    });
  });

  describe('B2B SaaS Value Proposition Refinement', () => {
    it('should refine value proposition for B2B SaaS company', async () => {
      const clientData = {
        name: 'DataSync Pro',
        email: 'ceo@datasync.com',
        company: 'DataSync Pro',
        industry: 'Technology',
        description: 'Real-time data synchronization platform for enterprise applications',
        currentChallenges: [
          'Complex sales cycles',
          'High implementation costs',
          'Customer onboarding challenges'
        ],
        goals: [
          'Shorten sales cycle by 30%',
          'Improve customer onboarding experience',
          'Increase annual contract value'
        ]
      };

      const clientResponse = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201);

      const clientId = clientResponse.body.client._id;

      // Run discovery workflow
      await request(app)
        .post('/api/workflows/discovery')
        .send({ clientId })
        .expect(200);

      // Verify B2B specific insights
      const artefacts = await Artefact.find({ clientId });
      const canvasArtefact = artefacts.find(a => a.name === 'canvasDraftingAgent');
      
      expect(canvasArtefact).toBeDefined();
      
      const canvasData = typeof canvasArtefact.data === 'string' 
        ? JSON.parse(canvasArtefact.data) 
        : canvasArtefact.data;

      // Verify B2B value proposition elements
      const valueMap = canvasData.valuePropositionCanvas.valueMap;
      const allPainRelievers = valueMap.painRelievers.join(' ').toLowerCase();
      
      expect(allPainRelievers).toMatch(/integration|sync|real-time|enterprise/);
      expect(allPainRelievers).toMatch(/implementation|onboarding|setup/);
    });
  });

  describe('Testing Business Ideas Validation', () => {
    it('should generate comprehensive validation experiments', async () => {
      const clientData = {
        name: 'HealthTech Innovations',
        email: 'founder@healthtech.com',
        company: 'HealthTech Innovations',
        industry: 'Healthcare',
        description: 'Telemedicine platform for rural healthcare access',
        currentChallenges: [
          'Regulatory compliance complexity',
          'Doctor adoption resistance',
          'Patient technology barriers'
        ],
        goals: [
          'Achieve regulatory approval',
          'Onboard 100 healthcare providers',
          'Serve 10,000 patients'
        ]
      };

      const clientResponse = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201);

      const clientId = clientResponse.body.client._id;

      // Run discovery workflow
      await request(app)
        .post('/api/workflows/discovery')
        .send({ clientId })
        .expect(200);

      // Verify validation plan
      const artefacts = await Artefact.find({ clientId });
      const validationArtefact = artefacts.find(a => a.name === 'validationPlanAgent');
      
      expect(validationArtefact).toBeDefined();
      
      const validationData = typeof validationArtefact.data === 'string' 
        ? JSON.parse(validationArtefact.data) 
        : validationArtefact.data;

      const validationPlan = validationData.validationPlan;
      expect(validationPlan.hypotheses).toBeInstanceOf(Array);
      expect(validationPlan.experiments).toBeInstanceOf(Array);
      expect(validationPlan.successMetrics).toBeInstanceOf(Array);

      // Verify healthcare-specific validation elements
      const allExperiments = validationPlan.experiments.map(e => e.description || e).join(' ').toLowerCase();
      expect(allExperiments).toMatch(/pilot|trial|test|validate/);
      expect(allExperiments).toMatch(/doctor|physician|provider|patient/);
    });
  });

  describe('API Error Handling and Edge Cases', () => {
    it('should handle invalid client ID gracefully', async () => {
      const response = await request(app)
        .post('/api/workflows/discovery')
        .send({ clientId: 'invalid-id' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle missing client ID', async () => {
      const response = await request(app)
        .post('/api/workflows/discovery')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle workflow execution errors gracefully', async () => {
      // Create client but simulate OpenAI API failure
      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        company: 'Test Company',
        industry: 'Technology',
        description: 'Test description'
      };

      const clientResponse = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(201);

      const clientId = clientResponse.body.client._id;

      // Note: This would require mocking OpenAI API to simulate failure
      // For now, we verify the endpoint exists and handles the request structure
      const response = await request(app)
        .post('/api/workflows/discovery')
        .send({ clientId });

      // Should either succeed or fail gracefully with proper error structure
      expect([200, 500]).toContain(response.status);
      if (response.status === 500) {
        expect(response.body.error).toBeDefined();
      }
    });
  });
});
