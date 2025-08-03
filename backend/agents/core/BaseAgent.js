import { EventEmitter } from 'events';

/**
 * Base Agent Framework for Strategyzer AI Platform
 * 
 * Provides core functionality for all AI agents including:
 * - OpenAI integration with cost tracking
 * - Quality assessment and validation
 * - Performance monitoring and metrics
 * - Error handling and resilience
 * - Configuration management
 */
export default class BaseAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Agent Identity
    this.name = config.name || 'BaseAgent';
    this.description = config.description || 'Base AI agent for Strategyzer platform';
    this.version = config.version || '1.0.0';
    this.type = config.type || 'base';
    
    // External Dependencies
    this.openai = config.openai;
    this.vectorStore = config.vectorStore;
    this.logger = config.logger || console;
    
    // AI Preferences with defaults
    this.preferences = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4000,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0,
      maxCostPerRequest: 0.10,
      qualityThreshold: 0.8,
      costOptimization: false,
      ...config.preferences
    };
    
    // Performance Metrics
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      totalResponseTime: 0,
      errorCount: 0,
      qualityScores: [],
      lastRequestTime: null,
      averageTokensPerRequest: 0,
      averageResponseTime: 0,
      averageQualityScore: 0
    };
    
    // Cost per 1K tokens for different models
    this.costTable = {
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01,
      'gpt-3.5-turbo': 0.002,
      'gpt-3.5-turbo-16k': 0.004
    };
    
    // Quality assessment weights
    this.qualityWeights = {
      completeness: 0.3,
      relevance: 0.25,
      specificity: 0.2,
      actionability: 0.15,
      clarity: 0.1
    };
    
    this.logger.info(`${this.name} agent initialized`, {
      version: this.version,
      model: this.preferences.model
    });
  }

  /**
   * Main request processing method
   * @param {Object} input - Input data for the agent
   * @param {Object} clientPreferences - Client-specific preferences
   * @returns {Object} Processed response with quality metrics
   */
  async processRequest(input, clientPreferences = {}) {
    const startTime = Date.now();
    
    try {
      // Merge client preferences with agent defaults
      const effectivePreferences = { ...this.preferences, ...clientPreferences };
      
      // Check budget constraints
      const estimatedCost = this.estimateCost(effectivePreferences.maxTokens);
      if (!this.isWithinBudget(estimatedCost)) {
        throw new Error(`Estimated cost ${estimatedCost} exceeds budget ${effectivePreferences.maxCostPerRequest}`);
      }
      
      // Generate prompt
      const prompt = this.generatePrompt(input);
      
      // Make OpenAI request
      const response = await this.makeOpenAIRequest(prompt, effectivePreferences);
      
      // Parse and validate response
      const parsedResponse = this.parseResponse(response);
      
      // Assess quality
      const qualityScore = this.assessQuality(parsedResponse);
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(response.usage, responseTime, qualityScore);
      
      // Store embedding if vector store available
      if (this.vectorStore && parsedResponse.analysis) {
        await this.storeEmbedding(parsedResponse);
      }
      
      // Emit success event
      this.emit('requestCompleted', {
        input,
        response: parsedResponse,
        metrics: {
          tokens: response.usage.total_tokens,
          cost: this.calculateCost(response.usage.total_tokens),
          responseTime,
          qualityScore
        }
      });
      
      return {
        ...parsedResponse,
        metadata: {
          agentId: this.name,
          version: this.version,
          qualityScore,
          tokensUsed: response.usage.total_tokens,
          cost: this.calculateCost(response.usage.total_tokens),
          responseTime,
          model: effectivePreferences.model,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      this.handleError(error, input);
      
      return {
        status: 'error',
        error: error.message,
        metadata: {
          agentId: this.name,
          version: this.version,
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Generate prompt for the AI model
   * @param {Object} input - Input data
   * @returns {Array} Messages array for OpenAI
   */
  generatePrompt(input) {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.formatUserInput(input);
    
    return [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ];
  }

  /**
   * Get system prompt for the agent
   * @returns {string} System prompt
   */
  getSystemPrompt() {
    return `You are ${this.name}, a strategic business consultant following Strategyzer methodologies.

Provide strategic analysis that contributes to business model development and validation.

IMPORTANT: Return ONLY valid JSON in this exact structure:
{
  "analysis": "your strategic analysis",
  "recommendations": ["actionable recommendations"],
  "nextSteps": ["specific next steps"],
  "insights": ["key strategic insights"],
  "strategicValue": "how this contributes to overall business model",
  "status": "completed"
}`;
  }

  /**
   * Format user input for the prompt
   * @param {Object} input - Raw input data
   * @returns {string} Formatted user prompt
   */
  formatUserInput(input) {
    return `Client Input: ${JSON.stringify(input, null, 2)}`;
  }

  /**
   * Make request to OpenAI API
   * @param {Array} messages - Messages for the API
   * @param {Object} preferences - AI preferences
   * @returns {Object} OpenAI response
   */
  async makeOpenAIRequest(messages, preferences) {
    if (!this.openai) {
      throw new Error('OpenAI client not configured');
    }

    const requestParams = {
      model: preferences.model,
      messages,
      temperature: preferences.temperature,
      max_tokens: preferences.maxTokens,
      top_p: preferences.topP,
      frequency_penalty: preferences.frequencyPenalty,
      presence_penalty: preferences.presencePenalty
    };

    this.logger.debug('Making OpenAI request', { 
      model: requestParams.model,
      messageCount: messages.length 
    });

    const response = await this.openai.chat.completions.create(requestParams);
    
    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices from OpenAI');
    }

    return response;
  }

  /**
   * Parse and validate OpenAI response
   * @param {Object} response - Raw OpenAI response
   * @returns {Object} Parsed response
   */
  parseResponse(response) {
    const content = response.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      
      // Validate required fields
      const requiredFields = ['analysis', 'recommendations', 'status'];
      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      return parsed;
      
    } catch (error) {
      this.logger.warn('Failed to parse JSON response', { content, error: error.message });
      
      // Fallback: return structured response with raw content
      return {
        analysis: content,
        recommendations: [],
        nextSteps: [],
        insights: [],
        strategicValue: '',
        status: 'completed',
        rawResponse: content
      };
    }
  }

  /**
   * Assess the quality of a response
   * @param {Object} response - Parsed response
   * @returns {number} Quality score (0-1)
   */
  assessQuality(response) {
    let score = 0;
    
    // Completeness: Check if all expected fields are present and non-empty
    const completeness = this.assessCompleteness(response);
    score += completeness * this.qualityWeights.completeness;
    
    // Relevance: Check if content is relevant to business strategy
    const relevance = this.assessRelevance(response);
    score += relevance * this.qualityWeights.relevance;
    
    // Specificity: Check if recommendations are specific and actionable
    const specificity = this.assessSpecificity(response);
    score += specificity * this.qualityWeights.specificity;
    
    // Actionability: Check if next steps are clear and actionable
    const actionability = this.assessActionability(response);
    score += actionability * this.qualityWeights.actionability;
    
    // Clarity: Check if the analysis is clear and well-structured
    const clarity = this.assessClarity(response);
    score += clarity * this.qualityWeights.clarity;
    
    return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
  }

  /**
   * Assess completeness of response
   * @param {Object} response - Response to assess
   * @returns {number} Completeness score (0-1)
   */
  assessCompleteness(response) {
    const expectedFields = ['analysis', 'recommendations', 'nextSteps', 'insights', 'strategicValue'];
    let filledFields = 0;
    
    for (const field of expectedFields) {
      if (response[field] && response[field].length > 0) {
        filledFields++;
      }
    }
    
    return filledFields / expectedFields.length;
  }

  /**
   * Assess relevance to business strategy
   * @param {Object} response - Response to assess
   * @returns {number} Relevance score (0-1)
   */
  assessRelevance(response) {
    const strategyKeywords = [
      'business model', 'value proposition', 'customer', 'market', 'revenue',
      'cost', 'strategy', 'competitive', 'opportunity', 'risk', 'growth'
    ];
    
    const text = (response.analysis || '').toLowerCase();
    const keywordMatches = strategyKeywords.filter(keyword => text.includes(keyword)).length;
    
    return Math.min(keywordMatches / 5, 1); // Max score when 5+ keywords found
  }

  /**
   * Assess specificity of recommendations
   * @param {Object} response - Response to assess
   * @returns {number} Specificity score (0-1)
   */
  assessSpecificity(response) {
    if (!response.recommendations || response.recommendations.length === 0) {
      return 0;
    }
    
    let specificitySum = 0;
    for (const rec of response.recommendations) {
      // Check for specific indicators: numbers, timeframes, concrete actions
      const specificIndicators = /\d+|within|by|implement|create|develop|analyze|measure/gi;
      const matches = (rec.match(specificIndicators) || []).length;
      specificitySum += Math.min(matches / 3, 1); // Max 1 per recommendation
    }
    
    return specificitySum / response.recommendations.length;
  }

  /**
   * Assess actionability of next steps
   * @param {Object} response - Response to assess
   * @returns {number} Actionability score (0-1)
   */
  assessActionability(response) {
    if (!response.nextSteps || response.nextSteps.length === 0) {
      return 0;
    }
    
    const actionVerbs = ['create', 'develop', 'implement', 'analyze', 'research', 'design', 'test', 'measure'];
    let actionableSteps = 0;
    
    for (const step of response.nextSteps) {
      const hasActionVerb = actionVerbs.some(verb => step.toLowerCase().includes(verb));
      if (hasActionVerb) {
        actionableSteps++;
      }
    }
    
    return actionableSteps / response.nextSteps.length;
  }

  /**
   * Assess clarity of analysis
   * @param {Object} response - Response to assess
   * @returns {number} Clarity score (0-1)
   */
  assessClarity(response) {
    if (!response.analysis) {
      return 0;
    }
    
    const text = response.analysis;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Penalize very short or very long sentences
    let clarityScore = 0;
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/).length;
      if (words >= 10 && words <= 30) {
        clarityScore += 1;
      } else if (words >= 5 && words <= 50) {
        clarityScore += 0.5;
      }
    }
    
    return Math.min(clarityScore / sentences.length, 1);
  }

  /**
   * Calculate cost for given number of tokens
   * @param {number} tokens - Number of tokens
   * @returns {number} Cost in USD
   */
  calculateCost(tokens) {
    const costPer1K = this.costTable[this.preferences.model] || 0.03;
    return (tokens / 1000) * costPer1K;
  }

  /**
   * Estimate cost for a request
   * @param {number} maxTokens - Maximum tokens for the request
   * @returns {number} Estimated cost in USD
   */
  estimateCost(maxTokens) {
    // Estimate prompt tokens (rough approximation)
    const estimatedPromptTokens = 200;
    const estimatedTotalTokens = estimatedPromptTokens + maxTokens;
    return this.calculateCost(estimatedTotalTokens);
  }

  /**
   * Check if cost is within budget
   * @param {number} cost - Cost to check
   * @returns {boolean} Whether cost is within budget
   */
  isWithinBudget(cost) {
    return cost <= this.preferences.maxCostPerRequest;
  }

  /**
   * Optimize preferences for cost efficiency
   * @returns {Object} Optimized preferences
   */
  optimizeForCost() {
    if (!this.preferences.costOptimization) {
      return this.preferences;
    }

    return {
      ...this.preferences,
      model: 'gpt-3.5-turbo', // Use cheaper model
      maxTokens: Math.min(this.preferences.maxTokens, 2000), // Reduce max tokens
      temperature: 0.5 // Lower temperature for more focused responses
    };
  }

  /**
   * Update performance metrics
   * @param {Object} usage - Token usage from OpenAI
   * @param {number} responseTime - Response time in milliseconds
   * @param {number} qualityScore - Quality score for the response
   */
  updateMetrics(usage, responseTime, qualityScore) {
    this.metrics.totalRequests++;
    this.metrics.totalTokens += usage.total_tokens;
    this.metrics.totalCost += this.calculateCost(usage.total_tokens);
    this.metrics.totalResponseTime += responseTime;
    this.metrics.qualityScores.push(qualityScore);
    this.metrics.lastRequestTime = new Date();
    
    // Update averages
    this.metrics.averageTokensPerRequest = this.metrics.totalTokens / this.metrics.totalRequests;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;
    this.metrics.averageQualityScore = this.metrics.qualityScores.reduce((a, b) => a + b, 0) / this.metrics.qualityScores.length;
  }

  /**
   * Handle errors and update error metrics
   * @param {Error} error - Error that occurred
   * @param {Object} input - Input that caused the error
   */
  handleError(error, input) {
    this.metrics.errorCount++;
    
    this.logger.error(`${this.name} agent error`, {
      error: error.message,
      input,
      stack: error.stack
    });
    
    this.emit('error', {
      agent: this.name,
      error: error.message,
      input,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Store embedding in vector store
   * @param {Object} response - Response to store
   */
  async storeEmbedding(response) {
    if (!this.vectorStore) {
      return;
    }

    try {
      const content = response.analysis || JSON.stringify(response);
      await this.vectorStore.storeEmbedding(
        `${this.name}-${Date.now()}`,
        content,
        {
          agentId: this.name,
          type: this.type,
          qualityScore: response.metadata?.qualityScore || 0,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      this.logger.warn('Failed to store embedding', { error: error.message });
    }
  }

  /**
   * Get AI preferences
   * @returns {Object} Current AI preferences
   */
  getAIPreferences() {
    return { ...this.preferences };
  }

  /**
   * Update AI preferences
   * @param {Object} newPreferences - New preferences to merge
   */
  updatePreferences(newPreferences) {
    // Validate preferences
    if (newPreferences.temperature !== undefined) {
      if (newPreferences.temperature < 0 || newPreferences.temperature > 2) {
        throw new Error('Temperature must be between 0 and 2');
      }
    }
    
    if (newPreferences.maxTokens !== undefined) {
      if (newPreferences.maxTokens < 1 || newPreferences.maxTokens > 8000) {
        throw new Error('Max tokens must be between 1 and 8000');
      }
    }
    
    this.preferences = { ...this.preferences, ...newPreferences };
    
    this.logger.info(`${this.name} preferences updated`, newPreferences);
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    return {
      totalRequests: this.metrics.totalRequests,
      totalTokens: this.metrics.totalTokens,
      totalCost: this.metrics.totalCost,
      errorCount: this.metrics.errorCount,
      averageTokensPerRequest: this.metrics.averageTokensPerRequest,
      averageCostPerRequest: this.metrics.totalRequests > 0 ? this.metrics.totalCost / this.metrics.totalRequests : 0,
      averageResponseTime: this.metrics.averageResponseTime,
      averageQualityScore: this.metrics.averageQualityScore,
      costEfficiency: this.metrics.totalTokens > 0 ? this.metrics.totalCost / this.metrics.totalTokens : 0,
      lastRequestTime: this.metrics.lastRequestTime
    };
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      totalResponseTime: 0,
      errorCount: 0,
      qualityScores: [],
      lastRequestTime: null,
      averageTokensPerRequest: 0,
      averageResponseTime: 0,
      averageQualityScore: 0
    };
    
    this.logger.info(`${this.name} metrics reset`);
  }
}
