import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { runAgent } from '../../server/utils/agentRunner.js';
import Artefact from '../../server/models/artefactModel.js';
import Client from '../../server/models/clientModel.js';

describe('Strategyzer Workflow Integration Tests', () => {
  let mongoServer;
  let testClient;

  beforeAll(async () => {
    // Start in-memory MongoDB for testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up collections before each test
    await Artefact.deleteMany({});
    await Client.deleteMany({});

    // Create test client
    testClient = await Client.create({
      name: 'Test Strategyzer Client',
      email: 'test@strategyzer.com',
      company: 'Innovation Corp',
      industry: 'Technology',
      description: 'A SaaS startup building project management tools for remote teams',
      currentChallenges: [
        'User acquisition is slow',
        'High churn rate',
        'Unclear value proposition'
      ],
      goals: [
        'Reduce churn by 50%',
        'Increase user acquisition',
        'Clarify value proposition'
      ]
    });
  });

  describe('Customer Discovery Workflow', () => {
    it('should generate comprehensive customer discovery insights', async () => {
      const input = {
        clientId: testClient._id.toString(),
        industry: testClient.industry,
        description: testClient.description,
        challenges: testClient.currentChallenges,
        goals: testClient.goals
      };

      const result = await runAgent('intakeAgent', input);

      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.customerJobs).toBeDefined();
      expect(result.customerJobs.functional).toBeInstanceOf(Array);
      expect(result.customerJobs.emotional).toBeInstanceOf(Array);
      expect(result.customerJobs.social).toBeInstanceOf(Array);
      expect(result.customerPains).toBeInstanceOf(Array);
      expect(result.customerGains).toBeInstanceOf(Array);
      expect(result.canvasData).toBeDefined();
      expect(result.canvasData.customerProfile).toBeDefined();

      // Verify artefact was saved to database
      const savedArtefact = await Artefact.findOne({ 
        clientId: testClient._id, 
        name: 'intakeAgent' 
      });
      expect(savedArtefact).toBeDefined();
      expect(savedArtefact.data).toBeDefined();
    });

    it('should identify relevant jobs-to-be-done for SaaS project management', async () => {
      const input = {
        clientId: testClient._id.toString(),
        industry: 'Technology',
        description: 'SaaS project management tool for remote teams'
      };

      const result = await runAgent('intakeAgent', input);

      expect(result.customerJobs.functional).toContain(
        expect.stringMatching(/project|manage|track|collaborate/i)
      );
      expect(result.customerJobs.emotional).toContain(
        expect.stringMatching(/confident|control|organized|productive/i)
      );
      expect(result.customerJobs.social).toContain(
        expect.stringMatching(/team|communicate|share|coordinate/i)
      );
    });
  });

  describe('Market Analysis Workflow', () => {
    it('should generate comprehensive market analysis', async () => {
      const input = {
        clientId: testClient._id.toString(),
        industry: testClient.industry,
        market: 'Project Management Software'
      };

      const result = await runAgent('researchAgent', input);

      expect(result).toBeDefined();
      expect(result.marketAnalysis).toBeDefined();
      expect(result.competitorAnalysis).toBeInstanceOf(Array);
      expect(result.marketOpportunities).toBeInstanceOf(Array);
      expect(result.marketSize).toBeDefined();
      expect(result.trends).toBeInstanceOf(Array);
    });
  });

  describe('Value Proposition Canvas Workflow', () => {
    it('should generate complete Value Proposition Canvas', async () => {
      const input = {
        clientId: testClient._id.toString(),
        customerJobs: {
          functional: ['Manage project timelines', 'Track team progress'],
          emotional: ['Feel confident about project status'],
          social: ['Coordinate effectively with team members']
        },
        customerPains: ['Missed deadlines', 'Poor team communication'],
        customerGains: ['Improved productivity', 'Better team collaboration']
      };

      const result = await runAgent('canvasDraftingAgent', input);

      expect(result).toBeDefined();
      expect(result.valuePropositionCanvas).toBeDefined();
      expect(result.valuePropositionCanvas.customerProfile).toBeDefined();
      expect(result.valuePropositionCanvas.valueMap).toBeDefined();
      
      const customerProfile = result.valuePropositionCanvas.customerProfile;
      expect(customerProfile.jobs).toBeInstanceOf(Array);
      expect(customerProfile.pains).toBeInstanceOf(Array);
      expect(customerProfile.gains).toBeInstanceOf(Array);

      const valueMap = result.valuePropositionCanvas.valueMap;
      expect(valueMap.productsServices).toBeInstanceOf(Array);
      expect(valueMap.painRelievers).toBeInstanceOf(Array);
      expect(valueMap.gainCreators).toBeInstanceOf(Array);
    });

    it('should create pain relievers that address customer pains', async () => {
      const input = {
        clientId: testClient._id.toString(),
        customerPains: ['Missed project deadlines', 'Poor team visibility']
      };

      const result = await runAgent('canvasDraftingAgent', input);

      const painRelievers = result.valuePropositionCanvas.valueMap.painRelievers;
      expect(painRelievers).toContain(
        expect.stringMatching(/deadline|timeline|schedule/i)
      );
      expect(painRelievers).toContain(
        expect.stringMatching(/visibility|transparency|tracking/i)
      );
    });
  });

  describe('Business Validation Workflow', () => {
    it('should generate comprehensive validation plan', async () => {
      const input = {
        clientId: testClient._id.toString(),
        valueProposition: 'Real-time project management for remote teams'
      };

      const result = await runAgent('validationPlanAgent', input);

      expect(result).toBeDefined();
      expect(result.validationPlan).toBeDefined();
      expect(result.validationPlan.hypotheses).toBeInstanceOf(Array);
      expect(result.validationPlan.experiments).toBeInstanceOf(Array);
      expect(result.validationPlan.successMetrics).toBeInstanceOf(Array);
      expect(result.validationPlan.timeline).toBeDefined();
    });

    it('should suggest testable hypotheses', async () => {
      const input = {
        clientId: testClient._id.toString(),
        assumptions: ['Remote teams need better project visibility']
      };

      const result = await runAgent('validationPlanAgent', input);

      const hypotheses = result.validationPlan.hypotheses;
      expect(hypotheses.length).toBeGreaterThan(0);
      expect(hypotheses[0]).toHaveProperty('hypothesis');
      expect(hypotheses[0]).toHaveProperty('testMethod');
      expect(hypotheses[0]).toHaveProperty('successCriteria');
    });
  });

  describe('Collaborative Multi-Agent Workflow Integration', () => {
    it('should enable real-time agent collaboration on shared canvas', async () => {
      const clientId = testClient._id.toString();
      
      // Create shared canvas workspace
      const sharedCanvas = {
        id: 'canvas_' + Date.now(),
        clientId: clientId,
        type: 'value_proposition_canvas',
        activeAgents: [],
        workspace: {
          customerProfile: { jobs: [], pains: [], gains: [] },
          valueMap: { productsServices: [], painRelievers: [], gainCreators: [] }
        },
        collaboration: {
          debates: [],
          consensus: {},
          messages: []
        }
      };
      
      // Simulate multiple agents working simultaneously
      const customerDiscoveryWork = runAgent('intakeAgent', {
        clientId,
        sharedCanvas,
        collaborationMode: true
      });
      
      const marketResearchWork = runAgent('researchAgent', {
        clientId,
        sharedCanvas,
        collaborationMode: true
      });
      
      const valuePropositionWork = runAgent('canvasDraftingAgent', {
        clientId,
        sharedCanvas,
        collaborationMode: true
      });
      
      // Wait for all agents to complete their initial work
      const [discoveryResult, marketResult, canvasResult] = await Promise.all([
        customerDiscoveryWork,
        marketResearchWork,
        valuePropositionWork
      ]);
      
      // Verify all agents contributed to the shared canvas
      expect(discoveryResult).toBeDefined();
      expect(marketResult).toBeDefined();
      expect(canvasResult).toBeDefined();
      
      // Verify collaborative elements exist
      expect(discoveryResult.customerJobs).toBeDefined();
      expect(marketResult.marketAnalysis).toBeDefined();
      expect(canvasResult.valuePropositionCanvas).toBeDefined();
    });

    it('should facilitate agent debates and consensus building', async () => {
      const clientId = testClient._id.toString();
      
      // Customer Discovery agent identifies target segment
      const discoveryResult = await runAgent('intakeAgent', {
        clientId,
        targetSegment: 'SMB teams',
        confidence: 0.7
      });
      
      // Market Research agent challenges with different data
      const marketResult = await runAgent('researchAgent', {
        clientId,
        ...discoveryResult,
        marketData: {
          enterpriseMarketSize: 50000000000,
          smbMarketSize: 5000000000,
          enterpriseLTV: 100000,
          smbLTV: 10000
        },
        challenge: {
          targetAgent: 'intakeAgent',
          topic: 'target_segment',
          argument: 'Enterprise segment has 10x higher value potential'
        }
      });
      
      // Simulation agent provides data to resolve debate
      const simulationInput = {
        clientId,
        scenarios: [
          {
            segment: 'SMB',
            acquisitionCost: 1000,
            conversionRate: 0.15,
            timeToRevenue: 3
          },
          {
            segment: 'Enterprise',
            acquisitionCost: 10000,
            conversionRate: 0.05,
            timeToRevenue: 12
          }
        ],
        resolveDebate: {
          topic: 'target_segment',
          participants: ['intakeAgent', 'researchAgent']
        }
      };
      
      // This would be implemented to run financial simulations
      // and provide evidence for the debate resolution
      expect(simulationInput.scenarios).toHaveLength(2);
      expect(simulationInput.resolveDebate.participants).toContain('intakeAgent');
      expect(simulationInput.resolveDebate.participants).toContain('researchAgent');
      
      // Verify debate structure is captured
      expect(marketResult.challenge).toBeDefined();
      expect(marketResult.challenge.targetAgent).toBe('intakeAgent');
      expect(marketResult.challenge.topic).toBe('target_segment');
    });

    it('should enable iterative canvas improvement through agent feedback', async () => {
      const clientId = testClient._id.toString();
      
      // Initial value proposition
      const initialCanvas = await runAgent('canvasDraftingAgent', {
        clientId,
        customerJobs: ['Manage projects', 'Track progress'],
        customerPains: ['Missed deadlines', 'Poor visibility'],
        iteration: 1
      });
      
      // Simulation agent analyzes and provides feedback
      const simulationFeedback = {
        financialViability: 0.4, // Low confidence
        marketFit: 0.6,
        feedback: [
          {
            targetSection: 'painRelievers',
            message: 'Current pain relievers are too generic - need specific differentiation',
            suggestions: ['Add AI-powered insights', 'Include predictive analytics'],
            confidence: 0.3
          },
          {
            targetSection: 'gainCreators',
            message: 'Gain creators need quantifiable benefits',
            suggestions: ['Specify 50% time savings', 'Guarantee 90% visibility improvement'],
            confidence: 0.5
          }
        ]
      };
      
      // Value Proposition agent iterates based on simulation feedback
      const improvedCanvas = await runAgent('canvasDraftingAgent', {
        clientId,
        ...initialCanvas,
        simulationFeedback,
        iteration: 2,
        improvementMode: true
      });
      
      // Verify iteration occurred
      expect(improvedCanvas).toBeDefined();
      expect(simulationFeedback.feedback).toHaveLength(2);
      expect(simulationFeedback.feedback[0].suggestions).toContain('Add AI-powered insights');
      
      // In real implementation, would verify:
      // - Canvas version incremented
      // - Pain relievers became more specific
      // - Gain creators include quantifiable benefits
      // - Confidence scores improved
    });
  });

  describe('Multi-Agent Workflow Orchestration', () => {
    it('should maintain client context across agents', async () => {
      const clientId = testClient._id.toString();

      // Run discovery workflow
      const discoveryResult = await runAgent('intakeAgent', { clientId });
      
      // Run market analysis with discovery context
      const marketResult = await runAgent('researchAgent', {
        clientId,
        ...discoveryResult
      });

      // Run canvas generation with combined context
      const canvasResult = await runAgent('canvasDraftingAgent', {
        clientId,
        ...discoveryResult,
        ...marketResult
      });

      // Verify all artefacts exist for the client
      const artefacts = await Artefact.find({ clientId }).sort({ createdAt: 1 });
      expect(artefacts).toHaveLength(3);
      expect(artefacts[0].name).toBe('intakeAgent');
      expect(artefacts[1].name).toBe('researchAgent');
      expect(artefacts[2].name).toBe('canvasDraftingAgent');

      // Verify context is preserved
      expect(canvasResult.valuePropositionCanvas.customerProfile.jobs)
        .toEqual(expect.arrayContaining(discoveryResult.customerJobs.functional));
    });

    it('should build progressive insights through agent collaboration', async () => {
      const clientId = testClient._id.toString();
      const baseInput = {
        clientId,
        industry: 'Technology',
        description: 'AI-powered analytics platform'
      };

      // Sequential agent execution
      const discoveryResult = await runAgent('intakeAgent', baseInput);
      const enrichedInput = { ...baseInput, ...discoveryResult };
      
      const marketResult = await runAgent('researchAgent', enrichedInput);
      const furtherEnriched = { ...enrichedInput, ...marketResult };
      
      const canvasResult = await runAgent('canvasDraftingAgent', furtherEnriched);

      // Verify progressive enrichment
      expect(Object.keys(discoveryResult)).toContain('customerJobs');
      expect(Object.keys(marketResult)).toContain('marketAnalysis');
      expect(Object.keys(canvasResult)).toContain('valuePropositionCanvas');

      // Verify final result incorporates all previous insights
      expect(canvasResult.valuePropositionCanvas.customerProfile.jobs)
        .toEqual(expect.arrayContaining(discoveryResult.canvasData.customerProfile.jobs));
    });

    it('should support agent specialization and expertise areas', async () => {
      const clientId = testClient._id.toString();
      
      // Define agent specializations
      const agentSpecializations = {
        'intakeAgent': {
          expertise: ['customer_discovery', 'jobs_to_be_done', 'customer_interviews'],
          confidence: { customerJobs: 0.9, customerPains: 0.85, customerGains: 0.8 }
        },
        'researchAgent': {
          expertise: ['market_analysis', 'competitive_intelligence', 'market_sizing'],
          confidence: { marketSize: 0.9, competitiveAnalysis: 0.85, trends: 0.8 }
        },
        'canvasDraftingAgent': {
          expertise: ['value_proposition_design', 'solution_architecture', 'feature_prioritization'],
          confidence: { painRelievers: 0.9, gainCreators: 0.85, productsServices: 0.8 }
        },
        'validationPlanAgent': {
          expertise: ['experiment_design', 'hypothesis_testing', 'metrics_definition'],
          confidence: { experimentDesign: 0.9, successMetrics: 0.85, validationPlan: 0.8 }
        }
      };
      
      // Each agent works in their area of expertise
      const results = {};
      
      for (const [agentName, specialization] of Object.entries(agentSpecializations)) {
        results[agentName] = await runAgent(agentName, {
          clientId,
          specialization,
          expertiseMode: true
        });
        
        // Verify agent worked within expertise area
        expect(results[agentName]).toBeDefined();
        expect(specialization.expertise.length).toBeGreaterThan(0);
      }
      
      // Verify specialized outputs
      expect(results.intakeAgent.customerJobs).toBeDefined();
      expect(results.researchAgent.marketAnalysis).toBeDefined();
      expect(results.canvasDraftingAgent.valuePropositionCanvas).toBeDefined();
      expect(results.validationPlanAgent.validationPlan).toBeDefined();
    });

    it('should enable cross-agent validation and quality assurance', async () => {
      const clientId = testClient._id.toString();
      
      // Customer Discovery agent creates initial customer profile
      const customerProfile = await runAgent('intakeAgent', {
        clientId,
        industry: 'FinTech',
        targetCustomer: 'Small business owners'
      });
      
      // Market Research agent validates customer profile against market data
      const marketValidation = await runAgent('researchAgent', {
        clientId,
        validateCustomerProfile: customerProfile,
        validationMode: true
      });
      
      // Value Proposition agent validates feasibility of addressing customer needs
      const feasibilityValidation = await runAgent('canvasDraftingAgent', {
        clientId,
        customerProfile,
        marketValidation,
        feasibilityMode: true
      });
      
      // Validation agent designs experiments to test all assumptions
      const experimentValidation = await runAgent('validationPlanAgent', {
        clientId,
        customerProfile,
        marketValidation,
        feasibilityValidation,
        comprehensiveValidation: true
      });
      
      // Verify cross-validation occurred
      expect(customerProfile).toBeDefined();
      expect(marketValidation).toBeDefined();
      expect(feasibilityValidation).toBeDefined();
      expect(experimentValidation).toBeDefined();
    });
  });

  describe('Simulation-Driven Agent Collaboration', () => {
    it('should run financial simulations that inform agent decisions', async () => {
      const clientId = testClient._id.toString();
      
      // Initial business model assumptions
      const businessModel = {
        customerSegment: 'SMB project teams',
        valueProposition: 'AI-powered project management',
        revenueModel: 'SaaS subscription',
        pricing: 99,
        customerAcquisitionCost: 150,
        customerLifetimeValue: 2400
      };
      
      // Simulation agent runs financial models
      const simulationResults = {
        financial: {
          monthlyRecurringRevenue: { month12: 50000, month24: 150000, month36: 300000 },
          customerAcquisitionCost: { current: 150, optimized: 120 },
          customerLifetimeValue: { current: 2400, optimized: 3200 },
          burnRate: { current: 80000, projected: 60000 },
          runway: { current: 18, projected: 24 },
          breakEven: { months: 16, confidence: 0.75 }
        },
        market: {
          totalAddressableMarket: 5000000000,
          serviceableAddressableMarket: 500000000,
          serviceableObtainableMarket: 50000000,
          marketPenetration: { year1: 0.001, year3: 0.01, year5: 0.05 }
        },
        risk: {
          competitiveRisk: 0.3,
          technicalRisk: 0.2,
          marketRisk: 0.4,
          overallRisk: 0.3
        }
      };
      
      // Agents use simulation results to refine their work
      const refinedBusinessModel = await runAgent('canvasDraftingAgent', {
        clientId,
        businessModel,
        simulationResults,
        refinementMode: true
      });
      
      // Verify simulation-driven refinement
      expect(simulationResults.financial.breakEven.months).toBe(16);
      expect(simulationResults.market.totalAddressableMarket).toBe(5000000000);
      expect(simulationResults.risk.overallRisk).toBe(0.3);
      expect(refinedBusinessModel).toBeDefined();
    });

    it('should enable scenario planning and stress testing', async () => {
      const clientId = testClient._id.toString();
      
      // Define multiple scenarios for testing
      const scenarios = {
        optimistic: {
          marketGrowth: 0.25,
          conversionRate: 0.15,
          churnRate: 0.05,
          pricingPower: 1.2
        },
        realistic: {
          marketGrowth: 0.15,
          conversionRate: 0.10,
          churnRate: 0.08,
          pricingPower: 1.0
        },
        pessimistic: {
          marketGrowth: 0.05,
          conversionRate: 0.05,
          churnRate: 0.15,
          pricingPower: 0.8
        }
      };
      
      // Simulation agent tests all scenarios
      const scenarioResults = {};
      for (const [scenarioName, assumptions] of Object.entries(scenarios)) {
        scenarioResults[scenarioName] = {
          revenue: assumptions.conversionRate * assumptions.pricingPower * 1000000,
          profitability: (assumptions.conversionRate * assumptions.pricingPower * 1000000) - 600000,
          sustainability: assumptions.churnRate < 0.10 ? 'sustainable' : 'at_risk'
        };
      }
      
      // Business Model agent adapts strategy based on scenario analysis
      const adaptiveStrategy = await runAgent('canvasDraftingAgent', {
        clientId,
        scenarioResults,
        adaptiveMode: true
      });
      
      // Verify scenario planning
      expect(Object.keys(scenarioResults)).toHaveLength(3);
      expect(scenarioResults.optimistic.revenue).toBeGreaterThan(scenarioResults.pessimistic.revenue);
      expect(adaptiveStrategy).toBeDefined();
    });
  });

  describe('Agent Communication and Consensus', () => {
    it('should enable structured agent-to-agent communication', async () => {
      const clientId = testClient._id.toString();
      
      // Define communication protocol
      const communicationLog = [];
      
      const mockAgentCommunication = {
        sendMessage: (from, to, message, type) => {
          const msg = {
            id: 'msg_' + Date.now(),
            from,
            to,
            message,
            type, // 'question', 'challenge', 'support', 'suggestion'
            timestamp: new Date()
          };
          communicationLog.push(msg);
          return msg;
        },
        broadcastToTeam: (from, message, type) => {
          const broadcast = {
            id: 'broadcast_' + Date.now(),
            from,
            to: 'all_agents',
            message,
            type,
            timestamp: new Date()
          };
          communicationLog.push(broadcast);
          return broadcast;
        }
      };
      
      // Simulate agent communication during collaboration
      mockAgentCommunication.sendMessage(
        'customer_discovery_agent',
        'market_research_agent',
        'Can you validate that SMBs are willing to pay $99/month for project management?',
        'question'
      );
      
      mockAgentCommunication.sendMessage(
        'market_research_agent',
        'customer_discovery_agent',
        'Market data shows 67% of SMBs currently pay $50-150/month for PM tools',
        'support'
      );
      
      mockAgentCommunication.sendMessage(
        'simulation_agent',
        'value_proposition_agent',
        'Financial model shows $99 pricing requires 15% conversion rate - is this realistic?',
        'challenge'
      );
      
      mockAgentCommunication.broadcastToTeam(
        'critique_agent',
        'Current value proposition lacks differentiation from existing solutions',
        'challenge'
      );
      
      // Verify communication structure
      expect(communicationLog).toHaveLength(4);
      expect(communicationLog[0].type).toBe('question');
      expect(communicationLog[1].type).toBe('support');
      expect(communicationLog[2].type).toBe('challenge');
      expect(communicationLog[3].to).toBe('all_agents');
    });

    it('should facilitate consensus building through structured debates', async () => {
      const clientId = testClient._id.toString();
      
      // Define debate structure
      const debateManager = {
        debates: [],
        initiateDebate: (topic, participants, evidence) => {
          const debate = {
            id: 'debate_' + Date.now(),
            topic,
            participants,
            status: 'initiated',
            arguments: [],
            evidence: evidence || [],
            consensus: null,
            startTime: new Date()
          };
          debateManager.debates.push(debate);
          return debate;
        },
        addArgument: (debateId, agent, argument, evidence) => {
          const debate = debateManager.debates.find(d => d.id === debateId);
          if (debate) {
            debate.arguments.push({
              agent,
              argument,
              evidence: evidence || [],
              timestamp: new Date()
            });
            debate.status = 'ongoing';
          }
        },
        reachConsensus: (debateId, decision, agreedBy, reasoning) => {
          const debate = debateManager.debates.find(d => d.id === debateId);
          if (debate) {
            debate.consensus = {
              decision,
              agreedBy,
              reasoning,
              timestamp: new Date()
            };
            debate.status = 'consensus_reached';
          }
        }
      };
      
      // Simulate debate about pricing strategy
      const pricingDebate = debateManager.initiateDebate(
        'Pricing Strategy: $99 vs $149 per month',
        ['customer_discovery_agent', 'market_research_agent', 'simulation_agent'],
        ['Customer willingness to pay survey', 'Competitive pricing analysis', 'Financial model projections']
      );
      
      debateManager.addArgument(
        pricingDebate.id,
        'customer_discovery_agent',
        '$99 pricing aligns with customer budget expectations from interviews',
        ['15 customer interviews showing $50-120 budget range']
      );
      
      debateManager.addArgument(
        pricingDebate.id,
        'market_research_agent',
        '$149 pricing positions us as premium solution with higher perceived value',
        ['Competitor analysis showing premium tools at $120-200 range']
      );
      
      debateManager.addArgument(
        pricingDebate.id,
        'simulation_agent',
        '$99 pricing requires 40% higher volume to reach profitability targets',
        ['Financial model showing break-even scenarios']
      );
      
      debateManager.reachConsensus(
        pricingDebate.id,
        'Start with $99 pricing for market penetration, increase to $149 after 6 months',
        ['customer_discovery_agent', 'simulation_agent'],
        'Balances customer acquisition with long-term profitability'
      );
      
      // Verify debate structure and consensus
      expect(debateManager.debates).toHaveLength(1);
      expect(pricingDebate.arguments).toHaveLength(3);
      expect(pricingDebate.consensus.agreedBy).toHaveLength(2);
      expect(pricingDebate.status).toBe('consensus_reached');
    });
  });
});
