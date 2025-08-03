/**
 * Business Model Canvas Agent
 * 
 * Specialized AI agent for generating Business Model Canvases following
 * Osterwalder's Business Model Generation methodology. Extends the base
 * agent framework with BMC-specific prompts, validation, and analysis.
 * 
 * @author Strategyzer AI Platform
 * @version 1.0.0
 */

import BaseAgent from '../core/BaseAgent.js';
import Client from '../../models/clientModel.js';
import Canvas from '../../models/canvasModel.js';

export default class BusinessModelAgent extends BaseAgent {
  constructor(options = {}) {
    super({
      systemPrompt: BusinessModelAgent.getSystemPrompt(),
      ...options
    });
    
    // Set agent-specific properties
    this.preferences.agentType = 'business-model-canvas';
    
    // Override preferences with constructor options
    if (options.model) this.preferences.model = options.model;
    if (options.maxTokens) this.preferences.maxTokens = options.maxTokens;
    if (options.temperature) this.preferences.temperature = options.temperature;

    this.canvasType = 'businessModel';
    
    // Setup logger with agent context
    if (this.logger && typeof this.logger.child === 'function') {
      this.logger = this.logger.child({ agent: 'BusinessModelAgent' });
    } else {
      // Fallback to console with prefixed messages
      this.logger = {
        info: (msg, data) => console.log(`[BusinessModelAgent] ${msg}`, data || ''),
        error: (msg, data) => console.error(`[BusinessModelAgent] ${msg}`, data || ''),
        warn: (msg, data) => console.warn(`[BusinessModelAgent] ${msg}`, data || ''),
        debug: (msg, data) => console.debug(`[BusinessModelAgent] ${msg}`, data || '')
      };
    }
  }

  /**
   * Generate system prompt for Business Model Canvas creation
   */
  static getSystemPrompt() {
    return `You are a Business Model Canvas expert following Alex Osterwalder's methodology.

Your role is to analyze business contexts and generate comprehensive Business Model Canvases that help organizations understand, design, and pivot their business models.

BUSINESS MODEL CANVAS STRUCTURE:
1. Key Partners - Strategic alliances and supplier relationships
2. Key Activities - Most important activities for business model success
3. Key Resources - Assets required to make business model work
4. Value Propositions - Products/services that create value for customers
5. Customer Relationships - Types of relationships with customer segments
6. Channels - How company communicates and delivers value
7. Customer Segments - Different groups of people/organizations to serve
8. Cost Structure - All costs incurred to operate business model
9. Revenue Streams - Cash generated from each customer segment

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "keyPartners": [
    "Strategic partner 1",
    "Strategic partner 2",
    "Strategic partner 3"
  ],
  "keyActivities": [
    "Core activity 1",
    "Core activity 2", 
    "Core activity 3"
  ],
  "keyResources": [
    "Essential resource 1",
    "Essential resource 2",
    "Essential resource 3"
  ],
  "valuePropositions": [
    "Value proposition 1",
    "Value proposition 2",
    "Value proposition 3"
  ],
  "customerRelationships": [
    "Relationship type 1",
    "Relationship type 2",
    "Relationship type 3"
  ],
  "channels": [
    "Distribution channel 1",
    "Distribution channel 2",
    "Distribution channel 3"
  ],
  "customerSegments": [
    "Customer segment 1",
    "Customer segment 2",
    "Customer segment 3"
  ],
  "costStructure": [
    "Major cost 1",
    "Major cost 2",
    "Major cost 3"
  ],
  "revenueStreams": [
    "Revenue stream 1",
    "Revenue stream 2",
    "Revenue stream 3"
  ]
}

QUALITY GUIDELINES:
- Each section should have 2-4 specific, actionable items
- Use business-appropriate language and terminology
- Ensure internal consistency across all 9 building blocks
- Focus on strategic value and competitive advantage
- Consider scalability and sustainability factors`;
  }

  /**
   * Generate Business Model Canvas for a client
   * @param {string} clientId - Client identifier
   * @param {Object} input - Business context and requirements
   * @returns {Object} Generated BMC with analysis
   */
  async generateCanvas(clientId, input) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting Business Model Canvas generation', {
        clientId,
        inputKeys: Object.keys(input)
      });

      // Get client information
      const client = await Client.findById(clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      // Generate enhanced prompt with business context
      const prompt = this.generateBMCPrompt(client, input);

      // Call OpenAI to generate BMC
      const bmcData = await this.callOpenAI(prompt);

      // Validate BMC structure
      this.validateBMCStructure(bmcData);

      // Generate business model analysis
      const businessAnalysis = this.generateBusinessAnalysis(bmcData);

      // Calculate quality score
      const qualityScore = this.assessBMCQuality(bmcData);

      // Save canvas to database
      const canvas = await Canvas.create({
        clientId: clientId,
        type: 'businessModel',
        title: `Business Model Canvas - ${client.name}`,
        description: `Generated BMC for ${input.businessDescription || client.company}`,
        data: bmcData,
        metadata: {
          agentId: 'bmc-agent-v1',
          qualityScore: qualityScore,
          tokensUsed: this.lastRequestTokens || 0,
          generationCost: this.lastRequestCost || 0,
          processingTime: Date.now() - startTime,
          aiModel: this.preferences.model
        },
        status: 'published'
      });

      // Update client workflow status (map to validation phase)
      if (typeof client.updateWorkflowStatus === 'function' && client.workflowStatus && client.workflowStatus.validation) {
        await client.updateWorkflowStatus('validation', 'completed', {
          canvasId: canvas._id,
          qualityScore,
          businessAnalysis,
          completedAt: new Date()
        });
      } else {
        // Update client activity as fallback
        if (typeof client.updateActivity === 'function') {
          await client.updateActivity();
        }
      }

      this.logger.info('Business Model Canvas generated successfully', {
        clientId: clientId,
        canvasId: canvas._id,
        qualityScore,
        analysisScore: businessAnalysis.viabilityScore
      });

      return {
        ...bmcData,
        businessAnalysis,
        canvasId: canvas._id,
        metadata: {
          qualityScore,
          viabilityScore: businessAnalysis.viabilityScore,
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      this.logger.error('Failed to generate Business Model Canvas', {
        error: error.message,
        clientId: clientId
      });

      throw error;
    }
  }

  /**
   * Generate enhanced prompt for BMC creation
   */
  generateBMCPrompt(client, input) {
    return `Generate a comprehensive Business Model Canvas for the following business:

BUSINESS CONTEXT:
- Company: ${client.company || client.name}
- Industry: ${client.industry || 'Not specified'}
- Business Description: ${input.businessDescription || 'Business model analysis'}
- Target Market: ${input.targetMarket || 'To be defined'}
- Business Stage: ${input.businessStage || 'Not specified'}

ADDITIONAL CONTEXT:
${input.currentChallenges ? `Current Challenges: ${input.currentChallenges}` : ''}
${input.businessGoals ? `Business Goals: ${input.businessGoals}` : ''}
${input.competitiveAdvantage ? `Competitive Advantage: ${input.competitiveAdvantage}` : ''}
${input.existingRevenue ? `Current Revenue Model: ${input.existingRevenue}` : ''}

Create a strategic Business Model Canvas that addresses the business context and provides actionable insights for business model optimization.`;
  }

  /**
   * Validate Business Model Canvas structure
   */
  validateBMCStructure(bmcData) {
    const requiredSections = [
      'keyPartners', 'keyActivities', 'keyResources', 'valuePropositions',
      'customerRelationships', 'channels', 'customerSegments', 
      'costStructure', 'revenueStreams'
    ];

    for (const section of requiredSections) {
      if (!bmcData[section] || !Array.isArray(bmcData[section])) {
        throw new Error(`Invalid BMC structure: missing or invalid ${section}`);
      }
      
      if (bmcData[section].length === 0) {
        throw new Error(`BMC section ${section} cannot be empty`);
      }
    }

    return true;
  }

  /**
   * Generate business model analysis and insights
   */
  generateBusinessAnalysis(bmcData) {
    // Calculate viability score based on BMC completeness and coherence
    const viabilityFactors = {
      valuePropositionClarity: this.assessValuePropositionClarity(bmcData.valuePropositions),
      revenueModelStrength: this.assessRevenueModelStrength(bmcData.revenueStreams, bmcData.costStructure),
      customerSegmentFocus: this.assessCustomerSegmentFocus(bmcData.customerSegments),
      operationalCoherence: this.assessOperationalCoherence(bmcData.keyActivities, bmcData.keyResources),
      channelEffectiveness: this.assessChannelEffectiveness(bmcData.channels, bmcData.customerSegments)
    };

    const viabilityScore = Object.values(viabilityFactors).reduce((sum, score) => sum + score, 0) / Object.keys(viabilityFactors).length;

    // Generate strategic insights
    const strategicInsights = this.generateStrategicInsights(bmcData, viabilityFactors);

    // Identify potential risks and opportunities
    const riskAssessment = this.assessBusinessModelRisks(bmcData);
    const opportunities = this.identifyGrowthOpportunities(bmcData);

    return {
      viabilityScore: Math.round(viabilityScore * 100) / 100,
      viabilityFactors,
      strategicInsights,
      riskAssessment,
      opportunities,
      recommendations: this.generateBMCRecommendations(bmcData, viabilityFactors)
    };
  }

  /**
   * Assess Business Model Canvas quality
   */
  assessBMCQuality(bmcData) {
    let qualityScore = 0;
    const maxScore = 100;

    // Completeness (30 points)
    const sections = Object.keys(bmcData);
    const completenessScore = (sections.length / 9) * 30;
    qualityScore += completenessScore;

    // Detail level (25 points)
    const totalItems = sections.reduce((sum, section) => {
      return sum + (Array.isArray(bmcData[section]) ? bmcData[section].length : 0);
    }, 0);
    const detailScore = Math.min((totalItems / 27) * 25, 25); // 3 items per section ideal
    qualityScore += detailScore;

    // Content quality (25 points)
    const avgContentLength = sections.reduce((sum, section) => {
      if (!Array.isArray(bmcData[section])) return sum;
      const sectionLength = bmcData[section].reduce((sSum, item) => sSum + item.length, 0);
      return sum + sectionLength;
    }, 0) / Math.max(totalItems, 1);
    
    const contentQualityScore = Math.min((avgContentLength / 50) * 25, 25); // 50 chars average ideal
    qualityScore += contentQualityScore;

    // Strategic coherence (20 points)
    const coherenceScore = this.assessStrategicCoherence(bmcData) * 20;
    qualityScore += coherenceScore;

    return Math.min(Math.round(qualityScore) / 100, 1);
  }

  /**
   * Helper methods for business analysis
   */
  assessValuePropositionClarity(valuePropositions) {
    if (!valuePropositions || valuePropositions.length === 0) return 0;
    
    const avgLength = valuePropositions.reduce((sum, vp) => sum + vp.length, 0) / valuePropositions.length;
    const clarityScore = Math.min(avgLength / 40, 1); // 40 chars minimum for clarity
    
    return clarityScore;
  }

  assessRevenueModelStrength(revenueStreams, costStructure) {
    if (!revenueStreams || !costStructure) return 0;
    
    const revenueComplexity = revenueStreams.length >= 2 ? 0.8 : 0.5; // Multiple streams better
    const costAwareness = costStructure.length >= 3 ? 0.8 : 0.5; // Cost consciousness
    
    return (revenueComplexity + costAwareness) / 2;
  }

  assessCustomerSegmentFocus(customerSegments) {
    if (!customerSegments || customerSegments.length === 0) return 0;
    
    // Sweet spot is 2-4 segments (focused but not too narrow)
    if (customerSegments.length >= 2 && customerSegments.length <= 4) {
      return 0.9;
    } else if (customerSegments.length === 1) {
      return 0.6; // Very focused but potentially risky
    } else {
      return 0.4; // Too many segments, lack of focus
    }
  }

  assessOperationalCoherence(keyActivities, keyResources) {
    if (!keyActivities || !keyResources) return 0;
    
    const activityResourceRatio = Math.min(keyActivities.length, keyResources.length) / 
                                 Math.max(keyActivities.length, keyResources.length);
    
    return activityResourceRatio * 0.8 + 0.2; // Base score + ratio bonus
  }

  assessChannelEffectiveness(channels, customerSegments) {
    if (!channels || !customerSegments) return 0;
    
    const channelSegmentRatio = channels.length / customerSegments.length;
    
    // Ideal ratio is 1-2 channels per segment
    if (channelSegmentRatio >= 1 && channelSegmentRatio <= 2) {
      return 0.9;
    } else if (channelSegmentRatio < 1) {
      return 0.6; // Insufficient channel coverage
    } else {
      return 0.5; // Too many channels, potential inefficiency
    }
  }

  assessStrategicCoherence(bmcData) {
    // Simple coherence check based on content overlap and consistency
    let coherenceScore = 0.5; // Base score
    
    // Check if value propositions align with customer segments
    if (bmcData.valuePropositions && bmcData.customerSegments) {
      coherenceScore += 0.2;
    }
    
    // Check if channels align with customer relationships
    if (bmcData.channels && bmcData.customerRelationships) {
      coherenceScore += 0.2;
    }
    
    // Check if key activities support value propositions
    if (bmcData.keyActivities && bmcData.valuePropositions) {
      coherenceScore += 0.1;
    }
    
    return Math.min(coherenceScore, 1);
  }

  generateStrategicInsights(bmcData, viabilityFactors) {
    const insights = [];
    
    if (viabilityFactors.valuePropositionClarity < 0.6) {
      insights.push("Value propositions need clearer articulation to improve market positioning");
    }
    
    if (viabilityFactors.revenueModelStrength < 0.7) {
      insights.push("Revenue model requires strengthening with diversified income streams");
    }
    
    if (viabilityFactors.customerSegmentFocus < 0.7) {
      insights.push("Customer segmentation strategy needs refinement for better market focus");
    }
    
    if (viabilityFactors.operationalCoherence < 0.6) {
      insights.push("Key activities and resources alignment needs improvement for operational efficiency");
    }
    
    return insights;
  }

  assessBusinessModelRisks(bmcData) {
    const risks = [];
    
    if (bmcData.revenueStreams && bmcData.revenueStreams.length === 1) {
      risks.push({
        type: "Revenue Concentration Risk",
        severity: "High",
        description: "Single revenue stream creates vulnerability to market changes"
      });
    }
    
    if (bmcData.keyPartners && bmcData.keyPartners.length > 5) {
      risks.push({
        type: "Partner Dependency Risk",
        severity: "Medium",
        description: "High number of key partners may create coordination complexity"
      });
    }
    
    return risks;
  }

  identifyGrowthOpportunities(bmcData) {
    const opportunities = [];
    
    if (bmcData.customerSegments && bmcData.customerSegments.length <= 2) {
      opportunities.push({
        type: "Market Expansion",
        potential: "High",
        description: "Consider expanding to adjacent customer segments"
      });
    }
    
    if (bmcData.channels && bmcData.channels.length <= 2) {
      opportunities.push({
        type: "Channel Diversification",
        potential: "Medium",
        description: "Explore additional distribution channels for market reach"
      });
    }
    
    return opportunities;
  }

  generateBMCRecommendations(bmcData, viabilityFactors) {
    const recommendations = [];
    
    // Priority recommendations based on lowest viability factors
    const sortedFactors = Object.entries(viabilityFactors)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 3);
    
    sortedFactors.forEach(([factor, score]) => {
      if (score < 0.7) {
        switch (factor) {
          case 'valuePropositionClarity':
            recommendations.push("Refine value propositions with specific customer benefits and differentiation");
            break;
          case 'revenueModelStrength':
            recommendations.push("Develop additional revenue streams and optimize cost structure");
            break;
          case 'customerSegmentFocus':
            recommendations.push("Narrow customer segments for better market penetration");
            break;
          case 'operationalCoherence':
            recommendations.push("Align key activities and resources for operational efficiency");
            break;
          case 'channelEffectiveness':
            recommendations.push("Optimize distribution channels for target customer segments");
            break;
        }
      }
    });
    
    return recommendations;
  }
}
