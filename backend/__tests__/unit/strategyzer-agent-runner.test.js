import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  buildStrategyzerPrompt,
  buildCustomerDiscoveryPrompt,
  buildMarketAnalysisPrompt,
  buildValuePropositionPrompt,
  buildTestingBusinessIdeasPrompt,
  getFrameworkType,
  isCanvasGenerationCapable
} from '../../server/utils/agentRunner.js';

describe('Strategyzer Agent Runner', () => {
  describe('buildStrategyzerPrompt', () => {
    it('should generate customer discovery prompt for intakeAgent', () => {
      const input = { clientId: 'test123', industry: 'Technology' };
      const prompt = buildStrategyzerPrompt('intakeAgent', input);
      
      expect(prompt).toContain('Customer Discovery specialist');
      expect(prompt).toContain('Alex Osterwalder');
      expect(prompt).toContain('Jobs-to-be-done');
      expect(prompt).toContain('Customer Pains');
      expect(prompt).toContain('Customer Gains');
      expect(prompt).toContain('ONLY valid JSON');
      expect(prompt).toContain('customerJobs');
      expect(prompt).toContain('customerPains');
      expect(prompt).toContain('customerGains');
    });

    it('should generate market analysis prompt for researchAgent', () => {
      const input = { clientId: 'test123', market: 'SaaS' };
      const prompt = buildStrategyzerPrompt('researchAgent', input);
      
      expect(prompt).toContain('Market Research specialist');
      expect(prompt).toContain('Strategyzer business model analysis');
      expect(prompt).toContain('competitive landscape');
      expect(prompt).toContain('marketAnalysis');
      expect(prompt).toContain('competitorAnalysis');
      expect(prompt).toContain('marketOpportunities');
    });

    it('should generate value proposition prompt for canvasDraftingAgent', () => {
      const input = { clientId: 'test123' };
      const prompt = buildStrategyzerPrompt('canvasDraftingAgent', input);
      
      expect(prompt).toContain('Value Proposition Design specialist');
      expect(prompt).toContain('Alex Osterwalder');
      expect(prompt).toContain('Value Proposition Canvas');
      expect(prompt).toContain('valuePropositionCanvas');
      expect(prompt).toContain('customerProfile');
      expect(prompt).toContain('valueMap');
    });

    it('should generate testing business ideas prompt for validationPlanAgent', () => {
      const input = { clientId: 'test123' };
      const prompt = buildStrategyzerPrompt('validationPlanAgent', input);
      
      expect(prompt).toContain('Business Validation specialist');
      expect(prompt).toContain('Testing Business Ideas');
      expect(prompt).toContain('validation plan');
      expect(prompt).toContain('hypotheses');
      expect(prompt).toContain('experiments');
      expect(prompt).toContain('validationPlan');
    });

    it('should generate generic Strategyzer prompt for unknown agents', () => {
      const input = { clientId: 'test123' };
      const prompt = buildStrategyzerPrompt('unknownAgent', input);
      
      expect(prompt).toContain('strategic business consultant');
      expect(prompt).toContain('Strategyzer methodologies');
      expect(prompt).toContain('business model development');
    });
  });

  describe('buildCustomerDiscoveryPrompt', () => {
    it('should create comprehensive customer discovery prompt', () => {
      const input = { 
        clientId: 'test123',
        industry: 'FinTech',
        targetMarket: 'Small businesses'
      };
      const prompt = buildCustomerDiscoveryPrompt(input);
      
      expect(prompt).toContain('Customer Discovery specialist');
      expect(prompt).toContain('functional, emotional, social');
      expect(prompt).toContain('undesired outcomes, obstacles, risks');
      expect(prompt).toContain('required, expected, desired, unexpected');
      expect(prompt).toContain('customerJobs');
      expect(prompt).toContain('functional');
      expect(prompt).toContain('emotional');
      expect(prompt).toContain('social');
      expect(prompt).toContain('customerPains');
      expect(prompt).toContain('customerGains');
      expect(prompt).toContain('canvasData');
      expect(prompt).toContain('customerProfile');
    });

    it('should include client input in the prompt', () => {
      const input = { 
        clientId: 'test123',
        industry: 'Healthcare',
        description: 'Medical device startup'
      };
      const prompt = buildCustomerDiscoveryPrompt(input);
      
      expect(prompt).toContain('Healthcare');
      expect(prompt).toContain('Medical device startup');
    });
  });

  describe('buildValuePropositionPrompt', () => {
    it('should create comprehensive value proposition prompt', () => {
      const input = { clientId: 'test123' };
      const prompt = buildValuePropositionPrompt(input);
      
      expect(prompt).toContain('Value Proposition Design specialist');
      expect(prompt).toContain('Value Proposition Canvas');
      expect(prompt).toContain('Customer Profile');
      expect(prompt).toContain('Value Map');
      expect(prompt).toContain('Products & Services');
      expect(prompt).toContain('Pain Relievers');
      expect(prompt).toContain('Gain Creators');
      expect(prompt).toContain('valuePropositionCanvas');
      expect(prompt).toContain('customerProfile');
      expect(prompt).toContain('valueMap');
      expect(prompt).toContain('productsServices');
      expect(prompt).toContain('painRelievers');
      expect(prompt).toContain('gainCreators');
    });
  });

  describe('buildTestingBusinessIdeasPrompt', () => {
    it('should create comprehensive testing business ideas prompt', () => {
      const input = { clientId: 'test123' };
      const prompt = buildTestingBusinessIdeasPrompt(input);
      
      expect(prompt).toContain('Business Validation specialist');
      expect(prompt).toContain('Testing Business Ideas');
      expect(prompt).toContain('testing and validation plan');
      expect(prompt).toContain('Hypotheses');
      expect(prompt).toContain('Experiments');
      expect(prompt).toContain('Success Metrics');
      expect(prompt).toContain('validationPlan');
      expect(prompt).toContain('hypotheses');
      expect(prompt).toContain('experiments');
      expect(prompt).toContain('successMetrics');
    });
  });

  describe('getFrameworkType', () => {
    it('should return correct framework types for known agents', () => {
      expect(getFrameworkType('intakeAgent')).toBe('customer_discovery');
      expect(getFrameworkType('researchAgent')).toBe('market_analysis');
      expect(getFrameworkType('canvasDraftingAgent')).toBe('value_proposition');
      expect(getFrameworkType('validationPlanAgent')).toBe('testing_business_ideas');
    });

    it('should return generic for unknown agents', () => {
      expect(getFrameworkType('unknownAgent')).toBe('generic_strategyzer');
    });
  });

  describe('Collaborative Multi-Agent System - TDD Design', () => {
    describe('Shared Canvas Workspace', () => {
      it('should allow multiple agents to work on the same canvas simultaneously', async () => {
        // Test that multiple agents can access and modify the same canvas
        const mockCanvas = {
          activeAgents: [],
          addAgent: vi.fn((agentName) => {
            mockCanvas.activeAgents.push(agentName);
          }),
          getActiveAgents: vi.fn(() => mockCanvas.activeAgents)
        };
        
        // Multiple agents join the workspace
        mockCanvas.addAgent('customer_discovery_agent');
        mockCanvas.addAgent('market_research_agent');
        mockCanvas.addAgent('value_proposition_agent');
        
        expect(mockCanvas.getActiveAgents()).toHaveLength(3);
        expect(mockCanvas.getActiveAgents()).toContain('customer_discovery_agent');
        expect(mockCanvas.getActiveAgents()).toContain('market_research_agent');
        expect(mockCanvas.getActiveAgents()).toContain('value_proposition_agent');
      });

      it('should track which agent made which changes with timestamps', async () => {
        const mockCanvas = {
          customerJobs: [],
          marketInsights: [],
          addCustomerJob: vi.fn((job) => {
            const jobWithId = { ...job, id: 'job_' + Date.now(), timestamp: new Date() };
            mockCanvas.customerJobs.push(jobWithId);
            return jobWithId.id;
          }),
          addMarketInsight: vi.fn((insight) => {
            const insightWithId = { ...insight, id: 'insight_' + Date.now(), timestamp: new Date() };
            mockCanvas.marketInsights.push(insightWithId);
            return insightWithId.id;
          }),
          getCustomerJobs: vi.fn(() => mockCanvas.customerJobs),
          getMarketInsights: vi.fn(() => mockCanvas.marketInsights)
        };
        
        // Customer Discovery agent adds a job
        await mockCanvas.addCustomerJob({
          type: 'functional',
          content: 'Manage project timelines efficiently',
          addedBy: 'customer_discovery_agent'
        });
        
        // Market Research agent adds market context
        await mockCanvas.addMarketInsight({
          content: 'Project management market growing 10% annually',
          addedBy: 'market_research_agent'
        });
        
        const jobs = mockCanvas.getCustomerJobs();
        const insights = mockCanvas.getMarketInsights();
        
        expect(jobs[0].addedBy).toBe('customer_discovery_agent');
        expect(insights[0].addedBy).toBe('market_research_agent');
        expect(jobs[0].timestamp).toBeInstanceOf(Date);
      });

      it('should enable agent-to-agent comments and debates', async () => {
        const mockCanvas = {
          customerPains: [],
          debates: [],
          addCustomerPain: vi.fn((pain) => {
            const painWithId = { ...pain, id: 'pain_' + Date.now(), comments: [] };
            mockCanvas.customerPains.push(painWithId);
            return painWithId.id;
          }),
          addComment: vi.fn((itemId, comment) => {
            const item = mockCanvas.customerPains.find(p => p.id === itemId);
            if (item) {
              item.comments.push({ ...comment, timestamp: new Date() });
            }
          }),
          initiateDebate: vi.fn((debateConfig) => {
            const debate = {
              ...debateConfig,
              id: 'debate_' + Date.now(),
              status: 'ongoing',
              arguments: [],
              addArgument: vi.fn((arg) => debate.arguments.push(arg)),
              reachConsensus: vi.fn((consensus) => {
                debate.status = 'consensus_reached';
                debate.consensus = consensus;
              }),
              getStatus: vi.fn(() => debate.status),
              getArguments: vi.fn(() => debate.arguments)
            };
            mockCanvas.debates.push(debate);
            return debate;
          }),
          getCustomerPain: vi.fn((id) => mockCanvas.customerPains.find(p => p.id === id))
        };
        
        // Customer Discovery adds a pain point
        const painId = await mockCanvas.addCustomerPain({
          content: 'Difficulty tracking project progress',
          addedBy: 'customer_discovery_agent'
        });
        
        // Market Research agent comments on it
        await mockCanvas.addComment(painId, {
          agent: 'market_research_agent',
          comment: 'This aligns with our survey data showing 78% of teams struggle with visibility',
          type: 'support'
        });
        
        // Value Proposition agent challenges it
        await mockCanvas.addComment(painId, {
          agent: 'value_proposition_agent',
          comment: 'Is this pain severe enough to pay for a solution?',
          type: 'challenge'
        });
        
        const pain = mockCanvas.getCustomerPain(painId);
        expect(pain.comments).toHaveLength(2);
        expect(pain.comments[0].type).toBe('support');
        expect(pain.comments[1].type).toBe('challenge');
      });

      it('should enable structured debates with consensus reaching', async () => {
        const mockCanvas = {
          debates: [],
          initiateDebate: vi.fn((debateConfig) => {
            const debate = {
              ...debateConfig,
              id: 'debate_' + Date.now(),
              status: 'ongoing',
              arguments: [],
              addArgument: vi.fn((arg) => debate.arguments.push({ ...arg, timestamp: new Date() })),
              addCounterArgument: vi.fn((arg) => debate.arguments.push({ ...arg, type: 'counter', timestamp: new Date() })),
              reachConsensus: vi.fn((consensus) => {
                debate.status = 'consensus_reached';
                debate.consensus = consensus;
              }),
              getStatus: vi.fn(() => debate.status),
              getArguments: vi.fn(() => debate.arguments),
              getConsensus: vi.fn(() => debate.consensus)
            };
            mockCanvas.debates.push(debate);
            return debate;
          })
        };
        
        // Start a debate about target customer segment
        const debate = await mockCanvas.initiateDebate({
          topic: 'Primary customer segment: SMB vs Enterprise',
          initiatedBy: 'customer_discovery_agent',
          participants: ['customer_discovery_agent', 'market_research_agent', 'business_model_agent']
        });
        
        // Agents present their arguments
        await debate.addArgument({
          agent: 'customer_discovery_agent',
          argument: 'SMBs have simpler needs and faster decision cycles',
          evidence: ['Interview data from 20 SMB owners', 'Average sales cycle: 2 weeks']
        });
        
        await debate.addCounterArgument({
          agent: 'market_research_agent',
          argument: 'Enterprise has 10x higher LTV and market size',
          evidence: ['Market research: Enterprise segment $50B vs SMB $5B', 'Average contract value: $100K vs $10K']
        });
        
        // Reach consensus
        await debate.reachConsensus({
          decision: 'Focus on SMB initially, then expand to Enterprise',
          agreedBy: ['customer_discovery_agent', 'market_research_agent'],
          reasoning: 'SMB provides faster validation and cash flow'
        });
        
        expect(debate.getArguments()).toHaveLength(2);
        expect(debate.getStatus()).toBe('consensus_reached');
        expect(debate.getConsensus().agreedBy).toHaveLength(2);
      });
    });

    describe('Simulation Agent Integration', () => {
      it('should run simulations on canvas data and provide agent feedback', async () => {
        const mockSimulationAgent = {
          runFinancialSimulation: vi.fn((canvasData) => {
            return {
              revenue: { projection: 1000000, confidence: 0.75 },
              costs: { projection: 600000, confidence: 0.8 },
              profitability: { breakEven: 18, roi: 0.67 },
              feedback: [
                {
                  toAgent: 'value_proposition_agent',
                  message: 'Pain reliever effectiveness needs validation - low confidence in revenue projection',
                  type: 'challenge'
                },
                {
                  toAgent: 'business_model_agent',
                  message: 'Cost structure looks realistic based on similar SaaS models',
                  type: 'support'
                }
              ]
            };
          }),
          runMarketSimulation: vi.fn((canvasData) => {
            return {
              penetration: { projection: 0.05, confidence: 0.6 },
              timeToMarket: { projection: 12, confidence: 0.8 },
              competitivePosition: { score: 7.2, confidence: 0.7 },
              feedback: [
                {
                  toAgent: 'market_research_agent',
                  message: 'Market penetration assumption seems optimistic - suggest A/B testing',
                  type: 'question'
                }
              ]
            };
          })
        };
        
        const canvasData = {
          valueProposition: {
            productsServices: ['Project management SaaS platform'],
            painRelievers: ['Real-time progress tracking', 'Automated reporting'],
            gainCreators: ['50% time savings', '90% visibility improvement']
          },
          marketAssumptions: {
            targetMarket: 'SMB project teams',
            marketSize: 10000000,
            pricing: 99
          }
        };
        
        const financialResults = await mockSimulationAgent.runFinancialSimulation(canvasData);
        const marketResults = await mockSimulationAgent.runMarketSimulation(canvasData);
        
        expect(financialResults.revenue.projection).toBe(1000000);
        expect(financialResults.feedback).toHaveLength(2);
        expect(financialResults.feedback[0].toAgent).toBe('value_proposition_agent');
        expect(financialResults.feedback[0].type).toBe('challenge');
        
        expect(marketResults.penetration.projection).toBe(0.05);
        expect(marketResults.feedback[0].type).toBe('question');
      });

      it('should enable iterative improvement through simulation feedback', async () => {
        const mockCanvas = {
          valuePropositions: [],
          simulationResults: [],
          updateValueProposition: vi.fn((id, updates) => {
            const vp = mockCanvas.valuePropositions.find(v => v.id === id);
            if (vp) {
              Object.assign(vp, updates);
              vp.version += 1;
              vp.lastUpdated = new Date();
            }
          }),
          addSimulationResult: vi.fn((result) => {
            mockCanvas.simulationResults.push({ ...result, timestamp: new Date() });
          }),
          getLatestSimulation: vi.fn(() => {
            return mockCanvas.simulationResults[mockCanvas.simulationResults.length - 1];
          })
        };
        
        // Initial value proposition
        const vpId = 'vp_1';
        mockCanvas.valuePropositions.push({
          id: vpId,
          painRelievers: ['Basic progress tracking'],
          confidence: 0.6,
          version: 1
        });
        
        // Simulation provides feedback
        await mockCanvas.addSimulationResult({
          type: 'financial',
          confidence: 0.4,
          feedback: 'Basic tracking insufficient for premium pricing',
          suggestions: ['Add real-time notifications', 'Include predictive analytics']
        });
        
        // Value Proposition agent iterates based on feedback
        await mockCanvas.updateValueProposition(vpId, {
          painRelievers: ['Real-time progress tracking', 'Predictive analytics', 'Smart notifications'],
          confidence: 0.8,
          updatedBy: 'value_proposition_agent',
          iterationReason: 'Incorporated simulation feedback for premium positioning'
        });
        
        const updatedVP = mockCanvas.valuePropositions.find(v => v.id === vpId);
        expect(updatedVP.version).toBe(2);
        expect(updatedVP.confidence).toBe(0.8);
        expect(updatedVP.painRelievers).toHaveLength(3);
        expect(updatedVP.iterationReason).toContain('simulation feedback');
      });
    });
  });

  describe('isCanvasGenerationCapable', () => {
    it('should return true for value proposition canvas data', () => {
      const responseData = {
        valuePropositionCanvas: {
          customerProfile: { jobs: [], pains: [], gains: [] },
          valueMap: { productsServices: [], painRelievers: [], gainCreators: [] }
        }
      };
      expect(isCanvasGenerationCapable(responseData)).toBe(true);
    });

    it('should return true for business model elements', () => {
      const responseData = {
        businessModelElements: {
          customerSegments: [],
          valuePropositions: [],
          channels: []
        }
      };
      expect(isCanvasGenerationCapable(responseData)).toBe(true);
    });

    it('should return true for customer profile data', () => {
      const responseData = {
        customerProfile: {
          jobs: ['functional job'],
          pains: ['pain point'],
          gains: ['desired gain']
        }
      };
      expect(isCanvasGenerationCapable(responseData)).toBe(true);
    });

    it('should return false for non-canvas data', () => {
      const responseData = {
        analysis: 'Some analysis',
        recommendations: ['recommendation 1']
      };
      expect(isCanvasGenerationCapable(responseData)).toBe(false);
    });

    it('should return false for empty data', () => {
      expect(isCanvasGenerationCapable({})).toBe(false);
      expect(isCanvasGenerationCapable(null)).toBe(false);
      expect(isCanvasGenerationCapable(undefined)).toBe(false);
    });
  });

  describe('Multi-Agent Orchestration Requirements', () => {
    it('should define agent roles and responsibilities', () => {
      const agentRoles = {
        'canvas_manager': {
          responsibilities: ['maintain_canvas_integrity', 'resolve_conflicts', 'version_control'],
          collaboratesWith: ['all']
        },
        'customer_discovery': {
          responsibilities: ['jobs_to_be_done', 'pain_points', 'customer_gains'],
          collaboratesWith: ['market_research', 'value_proposition', 'validation']
        },
        'market_research': {
          responsibilities: ['market_analysis', 'competitive_intelligence', 'market_sizing'],
          collaboratesWith: ['customer_discovery', 'business_model', 'simulation']
        },
        'value_proposition': {
          responsibilities: ['pain_relievers', 'gain_creators', 'products_services'],
          collaboratesWith: ['customer_discovery', 'business_model', 'simulation']
        },
        'simulation': {
          responsibilities: ['financial_modeling', 'market_simulations', 'risk_analysis'],
          collaboratesWith: ['all']
        },
        'validation': {
          responsibilities: ['hypothesis_design', 'experiment_planning', 'success_metrics'],
          collaboratesWith: ['all']
        },
        'critique': {
          responsibilities: ['quality_assurance', 'challenge_assumptions', 'devil_advocate'],
          collaboratesWith: ['all']
        }
      };
      
      expect(Object.keys(agentRoles)).toHaveLength(7);
      expect(agentRoles.customer_discovery.responsibilities).toContain('jobs_to_be_done');
      expect(agentRoles.simulation.collaboratesWith).toContain('all');
    });

    it('should support agent communication protocols', () => {
      const communicationTypes = [
        'comment',
        'challenge', 
        'support',
        'question',
        'debate_argument',
        'consensus_proposal',
        'simulation_feedback',
        'validation_request'
      ];
      
      const mockMessage = {
        from: 'customer_discovery_agent',
        to: 'value_proposition_agent',
        type: 'challenge',
        content: 'Is this pain reliever technically feasible?',
        references: ['pain_reliever_id_123'],
        timestamp: new Date()
      };
      
      expect(communicationTypes).toContain(mockMessage.type);
      expect(mockMessage.from).toBeDefined();
      expect(mockMessage.to).toBeDefined();
      expect(mockMessage.references).toBeInstanceOf(Array);
    });

    it('should enable consensus-building mechanisms', () => {
      const consensusProcess = {
        initiate: vi.fn((topic, participants) => ({
          topic,
          participants,
          status: 'initiated',
          votes: {},
          arguments: []
        })),
        addArgument: vi.fn(),
        vote: vi.fn(),
        calculateConsensus: vi.fn((votes) => {
          const totalVotes = Object.keys(votes).length;
          const agreeVotes = Object.values(votes).filter(v => v === 'agree').length;
          return agreeVotes / totalVotes >= 0.66; // 2/3 majority (66.67%)
        })
      };
      
      const consensus = consensusProcess.initiate(
        'Target customer segment',
        ['customer_discovery', 'market_research', 'business_model']
      );
      
      expect(consensus.status).toBe('initiated');
      expect(consensus.participants).toHaveLength(3);
      
      // Test consensus calculation
      const votes = {
        'customer_discovery': 'agree',
        'market_research': 'agree', 
        'business_model': 'disagree'
      };
      
      const hasConsensus = consensusProcess.calculateConsensus(votes);
      expect(hasConsensus).toBe(true); // 2/3 majority
    });
  });
});
