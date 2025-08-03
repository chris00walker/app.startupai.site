import BaseAgent from '../core/BaseAgent.js';
import EnhancedClient from '../../models/enhancedClientModel.js';
import Canvas from '../../models/canvasModel.js';

/**
 * Value Proposition Canvas Agent
 * 
 * Specialized agent for generating Strategyzer Value Proposition Canvases.
 * Focuses on understanding customer jobs, pains, and gains, then mapping
 * products, pain relievers, and gain creators to achieve product-market fit.
 */
export default class ValuePropositionAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      name: 'ValuePropositionAgent',
      description: 'Specialized agent for generating Value Proposition Canvas using Strategyzer methodology',
      version: '1.0.0',
      type: 'valueProposition',
      ...config
    });

    // VPC-specific quality weights
    this.vpcQualityWeights = {
      customerJobsQuality: 0.25,
      painsQuality: 0.20,
      gainsQuality: 0.20,
      productsQuality: 0.15,
      painRelieverFit: 0.10,
      gainCreatorFit: 0.10
    };

    this.logger.info('Value Proposition Canvas Agent initialized');
  }

  /**
   * Generate a complete Value Proposition Canvas
   * @param {Object} input - Input data for canvas generation
   * @returns {Object} Generated canvas with fit assessment
   */
  async generateCanvas(input) {
    const startTime = Date.now();

    try {
      // Validate and get client
      const client = await this.getClient(input.clientId);
      if (!client) {
        throw new Error(`Client not found: ${input.clientId}`);
      }

      // Update workflow status to in-progress
      await client.updateWorkflowStatus('valueProposition', 'in-progress', {
        agentId: this.name,
        startTime: new Date()
      });

      // Generate the canvas using AI
      const canvasData = await this.processRequest(input, client.getAIPreferences());

      // Validate the generated canvas
      if (!this.validateVPCStructure(canvasData)) {
        throw new Error('Generated canvas does not meet VPC structure requirements');
      }

      // Assess product-market fit
      const fitAssessment = this.generateFitAssessment(
        canvasData.customerProfile,
        canvasData.valueMap
      );

      // Assess overall quality
      const qualityScore = this.assessVPCQuality(canvasData);

      // Create canvas object for database
      const canvas = new Canvas({
        clientId: input.clientId,
        type: 'valueProposition',
        title: `Value Proposition Canvas - ${client.company}`,
        description: `Generated for ${client.company} in ${client.industry} industry`,
        data: {
          customerProfile: canvasData.customerProfile,
          valueMap: canvasData.valueMap
        },
        metadata: {
          agentId: this.name,
          version: this.version,
          qualityScore,
          tokensUsed: canvasData.metadata?.tokensUsed || 0,
          generationCost: canvasData.metadata?.cost || 0,
          processingTime: Date.now() - startTime,
          aiModel: canvasData.metadata?.model || this.preferences.model,
          prompt: this.formatUserInput(input),
          rawResponse: JSON.stringify(canvasData)
        }
      });

      // Save canvas to database
      await canvas.save();

      // Update client workflow status to completed
      await client.updateWorkflowStatus('valueProposition', 'completed', {
        canvasId: canvas._id,
        qualityScore,
        fitAssessment,
        completedAt: new Date()
      });

      // Update client AI metrics
      await client.updateAIMetrics(
        canvasData.metadata?.tokensUsed || 0,
        canvasData.metadata?.cost || 0,
        canvasData.metadata?.model || this.preferences.model
      );

      // Store Strategyzer profile data in client
      client.strategyzerProfiles.valueProposition = {
        customerJobs: canvasData.customerProfile.customerJobs,
        customerPains: canvasData.customerProfile.pains,
        customerGains: canvasData.customerProfile.gains,
        products: canvasData.valueMap.products,
        painRelievers: canvasData.valueMap.painRelievers,
        gainCreators: canvasData.valueMap.gainCreators
      };
      await client.save();

      this.logger.info('Value Proposition Canvas generated successfully', {
        clientId: input.clientId,
        canvasId: canvas._id,
        qualityScore,
        fitScore: fitAssessment.score
      });

      return {
        ...canvasData,
        fitAssessment,
        canvasId: canvas._id,
        metadata: {
          ...canvasData.metadata,
          qualityScore,
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      this.logger.error('Failed to generate Value Proposition Canvas', {
        error: error.message,
        clientId: input.clientId
      });

      // Update workflow status to failed
      if (input.clientId) {
        try {
          const client = await EnhancedClient.findById(input.clientId);
          if (client) {
            await client.updateWorkflowStatus('valueProposition', 'failed', {
              error: error.message,
              failedAt: new Date()
            });
          }
        } catch (updateError) {
          this.logger.error('Failed to update workflow status', { error: updateError.message });
        }
      }

      return {
        status: 'error',
        error: error.message,
        metadata: {
          agentId: this.name,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Get system prompt for VPC generation
   * @returns {string} VPC-specific system prompt
   */
  getSystemPrompt() {
    return `You are the Value Proposition Canvas Agent, an expert in Strategyzer's Value Proposition Design methodology.

Your role is to analyze business information and generate a comprehensive Value Proposition Canvas that maps customer needs to value propositions.

METHODOLOGY:
1. Customer Profile (right side of canvas):
   - Customer Jobs: What customers are trying to get done (functional, emotional, social)
   - Pains: Bad outcomes, risks, and obstacles customers experience
   - Gains: Benefits customers want, expect, desire, or would be surprised by

2. Value Map (left side of canvas):
   - Products & Services: List of products and services your value proposition is built around
   - Pain Relievers: How your products and services alleviate customer pains
   - Gain Creators: How your products and services create customer gains

3. Fit Assessment: Evaluate how well the value map addresses the customer profile

IMPORTANT: Return ONLY valid JSON in this exact structure:
{
  "customerProfile": {
    "customerJobs": ["specific customer jobs with context"],
    "pains": ["specific customer pains with details"],
    "gains": ["specific customer gains with context"]
  },
  "valueMap": {
    "products": ["specific products/services"],
    "painRelievers": ["how products relieve specific pains"],
    "gainCreators": ["how products create specific gains"]
  },
  "analysis": "comprehensive analysis of the value proposition",
  "recommendations": ["actionable recommendations for improvement"],
  "fitAssessment": {
    "score": 0.85,
    "strengths": ["areas of strong fit"],
    "improvements": ["areas for improvement"]
  },
  "status": "completed"
}

Focus on:
- Specific, actionable insights
- Clear pain-reliever and gain-creator alignment
- Realistic and achievable value propositions
- Industry-specific considerations
- Measurable outcomes where possible`;
  }

  /**
   * Format user input for VPC generation
   * @param {Object} input - Raw input data
   * @returns {string} Formatted prompt
   */
  formatUserInput(input) {
    return `Generate a Value Proposition Canvas for the following business:

Business Description: ${input.businessDescription || 'Not provided'}
Target Customers: ${input.targetCustomers || 'Not specified'}
Industry Context: ${input.industry || 'General'}
Current Challenges: ${input.currentChallenges || 'Not specified'}
Existing Solutions: ${input.existingSolutions || 'None specified'}
Competitive Landscape: ${input.competitiveLandscape || 'Not analyzed'}
Success Metrics: ${input.successMetrics || 'Not defined'}

Additional Context: ${JSON.stringify(input, null, 2)}

Please analyze this information and create a comprehensive Value Proposition Canvas that clearly identifies customer jobs, pains, and gains, then maps appropriate products, pain relievers, and gain creators.`;
  }

  /**
   * Validate VPC structure
   * @param {Object} vpc - Value Proposition Canvas data
   * @returns {boolean} Whether structure is valid
   */
  validateVPCStructure(vpc) {
    try {
      // Check required top-level structure
      if (!vpc.customerProfile || !vpc.valueMap) {
        return false;
      }

      // Check customer profile structure
      const cp = vpc.customerProfile;
      if (!Array.isArray(cp.customerJobs) || cp.customerJobs.length === 0) {
        return false;
      }
      if (!Array.isArray(cp.pains) || cp.pains.length === 0) {
        return false;
      }
      if (!Array.isArray(cp.gains) || cp.gains.length === 0) {
        return false;
      }

      // Check value map structure
      const vm = vpc.valueMap;
      if (!Array.isArray(vm.products) || vm.products.length === 0) {
        return false;
      }
      if (!Array.isArray(vm.painRelievers) || vm.painRelievers.length === 0) {
        return false;
      }
      if (!Array.isArray(vm.gainCreators) || vm.gainCreators.length === 0) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn('VPC structure validation failed', { error: error.message });
      return false;
    }
  }

  /**
   * Assess VPC quality
   * @param {Object} vpc - Value Proposition Canvas data
   * @returns {number} Quality score (0-1)
   */
  assessVPCQuality(vpc) {
    let totalScore = 0;

    // Customer Jobs Quality (0.25)
    const jobsScore = this.assessCustomerJobsQuality(vpc.customerProfile?.customerJobs || []);
    totalScore += jobsScore * this.vpcQualityWeights.customerJobsQuality;

    // Pains Quality (0.20)
    const painsScore = this.assessPainsQuality(vpc.customerProfile?.pains || []);
    totalScore += painsScore * this.vpcQualityWeights.painsQuality;

    // Gains Quality (0.20)
    const gainsScore = this.assessGainsQuality(vpc.customerProfile?.gains || []);
    totalScore += gainsScore * this.vpcQualityWeights.gainsQuality;

    // Products Quality (0.15)
    const productsScore = this.assessProductsQuality(vpc.valueMap?.products || []);
    totalScore += productsScore * this.vpcQualityWeights.productsQuality;

    // Pain Reliever Fit (0.10)
    const painRelieverFit = this.assessPainRelieverFit(
      vpc.customerProfile?.pains || [],
      vpc.valueMap?.painRelievers || []
    );
    totalScore += painRelieverFit * this.vpcQualityWeights.painRelieverFit;

    // Gain Creator Fit (0.10)
    const gainCreatorFit = this.assessGainCreatorFit(
      vpc.customerProfile?.gains || [],
      vpc.valueMap?.gainCreators || []
    );
    totalScore += gainCreatorFit * this.vpcQualityWeights.gainCreatorFit;

    return Math.min(Math.max(totalScore, 0), 1);
  }

  /**
   * Assess customer jobs quality
   * @param {Array} jobs - Customer jobs array
   * @returns {number} Quality score (0-1)
   */
  assessCustomerJobsQuality(jobs) {
    if (!jobs || jobs.length === 0) return 0;

    let score = 0;
    const jobTypes = ['functional', 'emotional', 'social'];
    
    for (const job of jobs) {
      // Check specificity (length and detail)
      if (job.length > 20) score += 0.3;
      
      // Check for action words
      const actionWords = ['increase', 'reduce', 'improve', 'achieve', 'maintain', 'eliminate'];
      if (actionWords.some(word => job.toLowerCase().includes(word))) {
        score += 0.2;
      }
      
      // Check for measurable elements
      if (/\d+|percent|%|times|hours|days/.test(job)) {
        score += 0.2;
      }
    }

    return Math.min(score / jobs.length, 1);
  }

  /**
   * Assess pains quality
   * @param {Array} pains - Customer pains array
   * @returns {number} Quality score (0-1)
   */
  assessPainsQuality(pains) {
    if (!pains || pains.length === 0) return 0;

    let score = 0;
    const painIndicators = ['time-consuming', 'expensive', 'difficult', 'frustrating', 'risky', 'complex'];
    
    for (const pain of pains) {
      // Check for pain indicators
      if (painIndicators.some(indicator => pain.toLowerCase().includes(indicator))) {
        score += 0.4;
      }
      
      // Check specificity
      if (pain.length > 15) score += 0.3;
      
      // Check for impact description
      if (/cost|time|quality|efficiency|productivity/.test(pain.toLowerCase())) {
        score += 0.3;
      }
    }

    return Math.min(score / pains.length, 1);
  }

  /**
   * Assess gains quality
   * @param {Array} gains - Customer gains array
   * @returns {number} Quality score (0-1)
   */
  assessGainsQuality(gains) {
    if (!gains || gains.length === 0) return 0;

    let score = 0;
    const gainIndicators = ['faster', 'cheaper', 'easier', 'better', 'automated', 'improved'];
    
    for (const gain of gains) {
      // Check for gain indicators
      if (gainIndicators.some(indicator => gain.toLowerCase().includes(indicator))) {
        score += 0.4;
      }
      
      // Check specificity
      if (gain.length > 15) score += 0.3;
      
      // Check for measurable benefits
      if (/save|increase|reduce|improve/.test(gain.toLowerCase())) {
        score += 0.3;
      }
    }

    return Math.min(score / gains.length, 1);
  }

  /**
   * Assess products quality
   * @param {Array} products - Products array
   * @returns {number} Quality score (0-1)
   */
  assessProductsQuality(products) {
    if (!products || products.length === 0) return 0;

    let score = 0;
    
    for (const product of products) {
      // Check specificity
      if (product.length > 10) score += 0.4;
      
      // Check for technology/solution indicators
      const techIndicators = ['platform', 'system', 'service', 'tool', 'solution', 'software'];
      if (techIndicators.some(indicator => product.toLowerCase().includes(indicator))) {
        score += 0.3;
      }
      
      // Check for descriptive elements
      if (product.split(' ').length >= 3) score += 0.3;
    }

    return Math.min(score / products.length, 1);
  }

  /**
   * Assess pain reliever fit
   * @param {Array} pains - Customer pains
   * @param {Array} painRelievers - Pain relievers
   * @returns {number} Fit score (0-1)
   */
  assessPainRelieverFit(pains, painRelievers) {
    if (!pains.length || !painRelievers.length) return 0;

    let alignmentScore = 0;
    
    for (const reliever of painRelievers) {
      for (const pain of pains) {
        // Simple keyword matching for alignment
        const relieverWords = reliever.toLowerCase().split(' ');
        const painWords = pain.toLowerCase().split(' ');
        
        const commonWords = relieverWords.filter(word => 
          painWords.some(painWord => painWord.includes(word) || word.includes(painWord))
        );
        
        if (commonWords.length > 0) {
          alignmentScore += commonWords.length / Math.max(relieverWords.length, painWords.length);
        }
      }
    }

    return Math.min(alignmentScore / (pains.length * painRelievers.length), 1);
  }

  /**
   * Assess gain creator fit
   * @param {Array} gains - Customer gains
   * @param {Array} gainCreators - Gain creators
   * @returns {number} Fit score (0-1)
   */
  assessGainCreatorFit(gains, gainCreators) {
    if (!gains.length || !gainCreators.length) return 0;

    let alignmentScore = 0;
    
    for (const creator of gainCreators) {
      for (const gain of gains) {
        // Simple keyword matching for alignment
        const creatorWords = creator.toLowerCase().split(' ');
        const gainWords = gain.toLowerCase().split(' ');
        
        const commonWords = creatorWords.filter(word => 
          gainWords.some(gainWord => gainWord.includes(word) || word.includes(gainWord))
        );
        
        if (commonWords.length > 0) {
          alignmentScore += commonWords.length / Math.max(creatorWords.length, gainWords.length);
        }
      }
    }

    return Math.min(alignmentScore / (gains.length * gainCreators.length), 1);
  }

  /**
   * Generate comprehensive fit assessment
   * @param {Object} customerProfile - Customer profile data
   * @param {Object} valueMap - Value map data
   * @returns {Object} Fit assessment with score and insights
   */
  generateFitAssessment(customerProfile, valueMap) {
    const painRelieverFit = this.assessPainRelieverFit(
      customerProfile.pains,
      valueMap.painRelievers
    );
    
    const gainCreatorFit = this.assessGainCreatorFit(
      customerProfile.gains,
      valueMap.gainCreators
    );

    // Overall fit score (weighted average)
    const overallFit = (painRelieverFit * 0.6) + (gainCreatorFit * 0.4);

    const strengths = [];
    const improvements = [];

    // Analyze strengths
    if (painRelieverFit > 0.7) {
      strengths.push('Strong pain-reliever alignment');
    }
    if (gainCreatorFit > 0.7) {
      strengths.push('Excellent gain-creator mapping');
    }
    if (customerProfile.customerJobs.length >= 3) {
      strengths.push('Comprehensive customer job identification');
    }

    // Analyze improvements
    if (painRelieverFit < 0.5) {
      improvements.push('Improve pain-reliever alignment');
    }
    if (gainCreatorFit < 0.5) {
      improvements.push('Strengthen gain-creator connections');
    }
    if (valueMap.products.length < 3) {
      improvements.push('Expand product/service portfolio');
    }

    return {
      score: overallFit,
      painRelieverFit,
      gainCreatorFit,
      strengths,
      improvements,
      recommendation: this.getFitRecommendation(overallFit)
    };
  }

  /**
   * Get fit recommendation based on score
   * @param {number} fitScore - Overall fit score
   * @returns {string} Recommendation text
   */
  getFitRecommendation(fitScore) {
    if (fitScore >= 0.8) {
      return 'Excellent product-market fit. Focus on execution and scaling.';
    } else if (fitScore >= 0.6) {
      return 'Good fit with room for improvement. Refine value propositions and test with customers.';
    } else if (fitScore >= 0.4) {
      return 'Moderate fit. Significant improvements needed in pain-reliever and gain-creator alignment.';
    } else {
      return 'Poor fit. Fundamental rethinking of value proposition required.';
    }
  }

  /**
   * Assess overall fit between customer profile and value map
   * @param {Object} customerProfile - Customer profile
   * @param {Object} valueMap - Value map
   * @returns {number} Fit score (0-1)
   */
  assessFit(customerProfile, valueMap) {
    const assessment = this.generateFitAssessment(customerProfile, valueMap);
    return assessment.score;
  }

  /**
   * Get client by ID
   * @param {string} clientId - Client ID
   * @returns {Object} Client document
   */
  async getClient(clientId) {
    try {
      return await EnhancedClient.findById(clientId);
    } catch (error) {
      this.logger.error('Failed to get client', { clientId, error: error.message });
      return null;
    }
  }
}
