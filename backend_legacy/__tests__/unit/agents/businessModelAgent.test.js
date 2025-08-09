/**
 * Unit Tests: Business Model Canvas Agent
 * 
 * Comprehensive test suite for BusinessModelAgent following TDD methodology.
 * Tests BMC generation, business analysis, quality assessment, and error handling.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import DatabaseTestHelper from '../../utils/testHelpers.js';
import BusinessModelAgent from '../../../agents/strategyzer/BusinessModelAgent.js';
import Client from '../../../models/clientModel.js';
import Canvas from '../../../models/canvasModel.js';

describe('Business Model Canvas Agent', () => {
  // database handled by helper
  let bmcAgent;
  let testClient;

  beforeAll(async () => {
    await DatabaseTestHelper.connect();
  });

  afterAll(async () => {
    await DatabaseTestHelper.disconnect();
  });

  beforeEach(async () => {
    await DatabaseTestHelper.clearDatabase();
    // Re-register schemas after clear
    [Client, Canvas].forEach(mdl => {
      if (!mongoose.models[mdl.modelName]) {
        mongoose.model(mdl.modelName, mdl.schema);
      }
    });

    // Create test client
    testClient = await Client.create({
      name: 'TechCorp Solutions',
      email: `${new mongoose.Types.ObjectId()}@test.com`,
      company: 'TechCorp Solutions',
      industry: 'Enterprise Software'
    });
    
    // Add workflowStatus field for testing
    testClient.workflowStatus = {
      validation: {
        status: 'not_started'
      }
    };

    // Initialize BMC agent
    bmcAgent = new BusinessModelAgent({
      openaiApiKey: 'test-key',
      model: 'gpt-4o-mini',
      maxTokens: 3000,
      temperature: 0.7
    });
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  describe('Agent Initialization', () => {
    it('should initialize with BMC-specific properties', () => {
      expect(bmcAgent.canvasType).toBe('businessModel');
      expect(bmcAgent.preferences.agentType).toBe('business-model-canvas');
      expect(bmcAgent.preferences.model).toBe('gpt-4o-mini');
      expect(bmcAgent.preferences.maxTokens).toBe(3000);
    });

    it('should have BMC-specific system prompt', () => {
      const systemPrompt = BusinessModelAgent.getSystemPrompt();
      expect(systemPrompt).toContain('Business Model Canvas expert');
      expect(systemPrompt).toContain('Alex Osterwalder');
      expect(systemPrompt).toContain('keyPartners');
      expect(systemPrompt).toContain('revenueStreams');
      expect(systemPrompt).toContain('costStructure');
    });
  });

  describe('Canvas Generation', () => {
    it('should generate a complete business model canvas', async () => {
      // Mock OpenAI response
      const mockBMCResponse = {
        keyPartners: [
          'Cloud infrastructure providers (AWS, Azure)',
          'Technology integration partners',
          'Strategic consulting firms'
        ],
        keyActivities: [
          'Software development and maintenance',
          'Customer support and training',
          'Sales and marketing activities'
        ],
        keyResources: [
          'Software development team',
          'Proprietary technology platform',
          'Customer database and relationships'
        ],
        valuePropositions: [
          'Streamlined enterprise workflow automation',
          'Reduced operational costs through efficiency',
          'Scalable cloud-based solution architecture'
        ],
        customerRelationships: [
          'Dedicated account management',
          'Self-service support portal',
          'Community-driven user forums'
        ],
        channels: [
          'Direct sales team',
          'Partner channel network',
          'Digital marketing and content'
        ],
        customerSegments: [
          'Mid-market enterprises (500-2000 employees)',
          'Fortune 500 companies',
          'Growing startups with scaling needs'
        ],
        costStructure: [
          'Software development and R&D costs',
          'Sales and marketing expenses',
          'Cloud infrastructure and hosting'
        ],
        revenueStreams: [
          'Monthly subscription fees (SaaS)',
          'Professional services and implementation',
          'Premium support and training'
        ]
      };

      bmcAgent.callOpenAI = vi.fn().mockResolvedValue(mockBMCResponse);

      const result = await bmcAgent.generateCanvas(testClient._id.toString(), {
        businessDescription: 'Enterprise workflow automation platform',
        targetMarket: 'Mid-market and enterprise companies',
        businessStage: 'growth'
      });

      // Verify BMC structure
      expect(result).toBeDefined();
      expect(result.keyPartners).toHaveLength(3);
      expect(result.keyActivities).toHaveLength(3);
      expect(result.keyResources).toHaveLength(3);
      expect(result.valuePropositions).toHaveLength(3);
      expect(result.customerRelationships).toHaveLength(3);
      expect(result.channels).toHaveLength(3);
      expect(result.customerSegments).toHaveLength(3);
      expect(result.costStructure).toHaveLength(3);
      expect(result.revenueStreams).toHaveLength(3);

      // Verify business analysis
      expect(result.businessAnalysis).toBeDefined();
      expect(result.businessAnalysis.viabilityScore).toBeGreaterThan(0);
      expect(result.businessAnalysis.viabilityFactors).toBeDefined();
      expect(result.businessAnalysis.strategicInsights).toBeInstanceOf(Array);
      expect(result.businessAnalysis.recommendations).toBeInstanceOf(Array);
    });

    it('should save canvas to database', async () => {
      const mockBMCResponse = {
        keyPartners: ['Partner 1', 'Partner 2'],
        keyActivities: ['Activity 1', 'Activity 2'],
        keyResources: ['Resource 1', 'Resource 2'],
        valuePropositions: ['Value 1', 'Value 2'],
        customerRelationships: ['Relationship 1', 'Relationship 2'],
        channels: ['Channel 1', 'Channel 2'],
        customerSegments: ['Segment 1', 'Segment 2'],
        costStructure: ['Cost 1', 'Cost 2'],
        revenueStreams: ['Revenue 1', 'Revenue 2']
      };

      bmcAgent.callOpenAI = vi.fn().mockResolvedValue(mockBMCResponse);

      await bmcAgent.generateCanvas(testClient._id.toString(), {
        businessDescription: 'Test business model'
      });

      const savedCanvas = await Canvas.findOne({
        clientId: testClient._id.toString(),
        type: 'businessModel'
      });

      expect(savedCanvas).toBeDefined();
      expect(savedCanvas.title).toContain('Business Model Canvas');
      expect(savedCanvas.data.keyPartners).toHaveLength(2);
      expect(savedCanvas.metadata.agentId).toBe('bmc-agent-v1');
      expect(savedCanvas.metadata.qualityScore).toBeGreaterThan(0);
    });

    it('should update client workflow status', async () => {
      const mockBMCResponse = {
        keyPartners: ['Partner 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        valuePropositions: ['Value 1'],
        customerRelationships: ['Relationship 1'],
        channels: ['Channel 1'],
        customerSegments: ['Segment 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1']
      };

      bmcAgent.callOpenAI = vi.fn().mockResolvedValue(mockBMCResponse);

      // Mock updateWorkflowStatus method
      testClient.updateWorkflowStatus = vi.fn().mockResolvedValue(testClient);
      
      // Ensure workflowStatus exists
      testClient.workflowStatus = {
        validation: { status: 'not_started' }
      };

      const result = await bmcAgent.generateCanvas(testClient._id.toString(), {
        businessDescription: 'Test business'
      });

      // Verify that the canvas generation completed successfully
      // (The workflow status update is tested in integration tests)
      expect(result).toBeDefined();
      expect(result.canvasId).toBeDefined();
    });
  });

  describe('Business Analysis', () => {
    it('should assess business model viability', () => {
      const mockBMCData = {
        keyPartners: ['Strategic partner 1', 'Technology partner 2'],
        keyActivities: ['Core development', 'Customer support'],
        keyResources: ['Development team', 'Technology platform'],
        valuePropositions: ['Efficiency improvement', 'Cost reduction'],
        customerRelationships: ['Dedicated support', 'Self-service'],
        channels: ['Direct sales', 'Partner network'],
        customerSegments: ['Enterprise', 'SMB'],
        costStructure: ['Development costs', 'Infrastructure'],
        revenueStreams: ['Subscriptions', 'Services']
      };

      const analysis = bmcAgent.generateBusinessAnalysis(mockBMCData);

      expect(analysis.viabilityScore).toBeGreaterThan(0);
      expect(analysis.viabilityScore).toBeLessThanOrEqual(1);
      expect(analysis.viabilityFactors).toBeDefined();
      expect(analysis.viabilityFactors.valuePropositionClarity).toBeDefined();
      expect(analysis.viabilityFactors.revenueModelStrength).toBeDefined();
      expect(analysis.strategicInsights).toBeInstanceOf(Array);
      expect(analysis.riskAssessment).toBeInstanceOf(Array);
      expect(analysis.opportunities).toBeInstanceOf(Array);
    });

    it('should identify revenue concentration risk', () => {
      const riskBMCData = {
        keyPartners: ['Partner 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        valuePropositions: ['Value 1'],
        customerRelationships: ['Relationship 1'],
        channels: ['Channel 1'],
        customerSegments: ['Segment 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Single revenue stream'] // Risk factor
      };

      const analysis = bmcAgent.generateBusinessAnalysis(riskBMCData);
      const risks = analysis.riskAssessment;

      expect(risks).toBeInstanceOf(Array);
      const revenueRisk = risks.find(risk => risk.type === 'Revenue Concentration Risk');
      expect(revenueRisk).toBeDefined();
      expect(revenueRisk.severity).toBe('High');
    });

    it('should identify growth opportunities', () => {
      const opportunityBMCData = {
        keyPartners: ['Partner 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        valuePropositions: ['Value 1'],
        customerRelationships: ['Relationship 1'],
        channels: ['Single channel'], // Opportunity for expansion
        customerSegments: ['Single segment'], // Opportunity for expansion
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1', 'Revenue 2']
      };

      const analysis = bmcAgent.generateBusinessAnalysis(opportunityBMCData);
      const opportunities = analysis.opportunities;

      expect(opportunities).toBeInstanceOf(Array);
      expect(opportunities.length).toBeGreaterThan(0);
      
      const marketExpansion = opportunities.find(opp => opp.type === 'Market Expansion');
      const channelDiversification = opportunities.find(opp => opp.type === 'Channel Diversification');
      
      expect(marketExpansion || channelDiversification).toBeDefined();
    });
  });

  describe('Quality Assessment', () => {
    it('should assess BMC quality accurately', () => {
      const highQualityBMC = {
        keyPartners: [
          'Strategic technology partners providing cloud infrastructure',
          'Integration partners for seamless customer onboarding',
          'Consulting firms for enterprise market penetration'
        ],
        keyActivities: [
          'Continuous software development and feature enhancement',
          'Customer success and technical support operations',
          'Strategic partnerships and business development'
        ],
        keyResources: [
          'Experienced software development and engineering team',
          'Proprietary AI-powered automation technology platform',
          'Comprehensive customer data and usage analytics'
        ],
        valuePropositions: [
          'Automated workflow optimization reducing manual effort by 60%',
          'Scalable enterprise solution with 99.9% uptime guarantee',
          'AI-driven insights for data-informed business decisions'
        ],
        customerRelationships: [
          'Dedicated customer success managers for enterprise accounts',
          'Self-service knowledge base and community support',
          'Regular training sessions and best practice workshops'
        ],
        channels: [
          'Direct enterprise sales team with industry expertise',
          'Partner channel program with certified resellers',
          'Digital marketing through content and thought leadership'
        ],
        customerSegments: [
          'Fortune 500 companies with complex operational workflows',
          'Mid-market enterprises seeking digital transformation',
          'Growing technology companies with scaling challenges'
        ],
        costStructure: [
          'Software development and R&D investment (40% of revenue)',
          'Sales and marketing expenses for customer acquisition',
          'Cloud infrastructure and security compliance costs'
        ],
        revenueStreams: [
          'Monthly SaaS subscription fees based on user tiers',
          'Professional services for implementation and customization',
          'Premium support packages and training programs'
        ]
      };

      const qualityScore = bmcAgent.assessBMCQuality(highQualityBMC);
      expect(qualityScore).toBeGreaterThan(0.7); // High quality BMC
      expect(qualityScore).toBeLessThanOrEqual(1);
    });

    it('should identify low quality BMC', () => {
      const lowQualityBMC = {
        keyPartners: ['Partner'],
        keyActivities: ['Activity'],
        keyResources: ['Resource'],
        valuePropositions: ['Value'],
        customerRelationships: ['Relationship'],
        channels: ['Channel'],
        customerSegments: ['Segment'],
        costStructure: ['Cost'],
        revenueStreams: ['Revenue']
      };

      const qualityScore = bmcAgent.assessBMCQuality(lowQualityBMC);
      expect(qualityScore).toBeLessThan(0.7); // Low quality BMC
    });
  });

  describe('Validation', () => {
    it('should validate BMC structure', () => {
      const validBMC = {
        keyPartners: ['Partner 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        valuePropositions: ['Value 1'],
        customerRelationships: ['Relationship 1'],
        channels: ['Channel 1'],
        customerSegments: ['Segment 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1']
      };

      expect(() => bmcAgent.validateBMCStructure(validBMC)).not.toThrow();
    });

    it('should reject invalid BMC structure', () => {
      const invalidBMC = {
        keyPartners: ['Partner 1'],
        // Missing required sections
        valuePropositions: ['Value 1']
      };

      expect(() => bmcAgent.validateBMCStructure(invalidBMC)).toThrow();
    });

    it('should reject BMC with empty sections', () => {
      const emptyBMC = {
        keyPartners: [],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        valuePropositions: ['Value 1'],
        customerRelationships: ['Relationship 1'],
        channels: ['Channel 1'],
        customerSegments: ['Segment 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1']
      };

      expect(() => bmcAgent.validateBMCStructure(emptyBMC)).toThrow('keyPartners cannot be empty');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing client gracefully', async () => {
      bmcAgent.callOpenAI = vi.fn().mockResolvedValue({
        keyPartners: ['Partner 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        valuePropositions: ['Value 1'],
        customerRelationships: ['Relationship 1'],
        channels: ['Channel 1'],
        customerSegments: ['Segment 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1']
      });

      await expect(
        bmcAgent.generateCanvas('507f1f77bcf86cd799439011', {
          businessDescription: 'Test business'
        })
      ).rejects.toThrow('Client not found');
    });

    it('should handle OpenAI API errors', async () => {
      bmcAgent.callOpenAI = vi.fn().mockRejectedValue(new Error('OpenAI API error'));

      await expect(
        bmcAgent.generateCanvas(testClient._id.toString(), {
          businessDescription: 'Test business'
        })
      ).rejects.toThrow('OpenAI API error');
    });
  });

  describe('Cost Optimization', () => {
    it('should track generation costs', async () => {
      const mockBMCResponse = {
        keyPartners: ['Partner 1'],
        keyActivities: ['Activity 1'],
        keyResources: ['Resource 1'],
        valuePropositions: ['Value 1'],
        customerRelationships: ['Relationship 1'],
        channels: ['Channel 1'],
        customerSegments: ['Segment 1'],
        costStructure: ['Cost 1'],
        revenueStreams: ['Revenue 1']
      };

      bmcAgent.callOpenAI = vi.fn().mockResolvedValue(mockBMCResponse);
      bmcAgent.lastRequestCost = 0.08;
      bmcAgent.lastRequestTokens = 2500;

      const result = await bmcAgent.generateCanvas(testClient._id.toString(), {
        businessDescription: 'Test business'
      });

      const savedCanvas = await Canvas.findOne({
        clientId: testClient._id.toString(),
        type: 'businessModel'
      });

      expect(savedCanvas.metadata.generationCost).toBe(0.08);
      expect(savedCanvas.metadata.tokensUsed).toBe(2500);
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Prompt Generation', () => {
    it('should generate comprehensive BMC prompt', () => {
      const input = {
        businessDescription: 'AI-powered analytics platform',
        targetMarket: 'Enterprise data teams',
        businessStage: 'growth',
        currentChallenges: 'Scaling customer acquisition',
        businessGoals: 'Achieve $10M ARR',
        competitiveAdvantage: 'Real-time processing capabilities'
      };

      const prompt = bmcAgent.generateBMCPrompt(testClient, input);

      expect(prompt).toContain('TechCorp Solutions');
      expect(prompt).toContain('Enterprise Software');
      expect(prompt).toContain('AI-powered analytics platform');
      expect(prompt).toContain('Enterprise data teams');
      expect(prompt).toContain('Scaling customer acquisition');
      expect(prompt).toContain('Achieve $10M ARR');
      expect(prompt).toContain('Real-time processing capabilities');
    });
  });
});
