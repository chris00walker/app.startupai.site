/**
 * AI Cost Optimization Service
 * 
 * Implements Sprint 4 Story 4.1.2: AI Cost Optimization
 * - Workflow execution cost <$2 per complete canvas
 * - Intelligent prompt optimization for token efficiency
 * - Response caching for similar inputs
 * - Model selection optimization by use case
 * - Cost monitoring and alerting
 */

import crypto from 'crypto';
import { performance } from 'perf_hooks';

export default class AICostOptimizationService {
  constructor() {
    this.responseCache = new Map();
    this.costMetrics = new Map();
    this.promptTemplates = new Map();
    
    // Cost tracking per model (prices per 1K tokens as of 2024)
    this.modelPricing = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.000150, output: 0.0006 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    };
    
    // Model selection rules by use case
    this.modelSelection = {
      'canvas-generation': 'gpt-4o-mini', // Cost-effective for structured output
      'business-analysis': 'gpt-4o',      // Higher quality for complex analysis
      'quick-validation': 'gpt-4o-mini',  // Fast and cheap for validation
      'creative-content': 'gpt-4o',       // Better creativity for content
      'data-extraction': 'gpt-4o-mini',   // Efficient for structured extraction
      'complex-reasoning': 'gpt-4o'       // Best for complex business logic
    };
    
    // Cost thresholds and alerts
    this.costThresholds = {
      perCanvas: 2.00,        // $2 per canvas maximum
      dailyBudget: 100.00,    // $100 daily budget
      monthlyBudget: 2000.00  // $2000 monthly budget
    };
    
    this.initializeCostTracking();
  }

  /**
   * Initialize cost tracking and monitoring
   */
  initializeCostTracking() {
    // Reset daily costs at midnight
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.resetDailyCosts();
      }
    }, 60000); // Check every minute
  }

  /**
   * Optimize prompt for token efficiency
   */
  optimizePrompt(originalPrompt, useCase = 'general') {
    const start = performance.now();
    
    // Get or create optimized template
    const templateKey = `${useCase}_${this.hashString(originalPrompt)}`;
    
    if (this.promptTemplates.has(templateKey)) {
      const cached = this.promptTemplates.get(templateKey);
      console.log(`📋 Using cached optimized prompt (${cached.tokenSavings}% savings)`);
      return cached.optimized;
    }
    
    // Apply optimization rules
    let optimized = originalPrompt;
    
    // 1. Remove redundant phrases
    const redundantPhrases = [
      /please\s+/gi,
      /kindly\s+/gi,
      /if you would\s+/gi,
      /could you\s+/gi,
      /\s+and\s+also\s+/gi
    ];
    
    redundantPhrases.forEach(phrase => {
      optimized = optimized.replace(phrase, ' ');
    });
    
    // 2. Use more concise language
    const replacements = {
      'in order to': 'to',
      'due to the fact that': 'because',
      'at this point in time': 'now',
      'for the purpose of': 'for',
      'in the event that': 'if',
      'make use of': 'use',
      'take into consideration': 'consider',
      'provide assistance': 'help'
    };
    
    Object.entries(replacements).forEach(([verbose, concise]) => {
      const regex = new RegExp(verbose, 'gi');
      optimized = optimized.replace(regex, concise);
    });
    
    // 3. Remove excessive whitespace
    optimized = optimized.replace(/\s+/g, ' ').trim();
    
    // 4. Use structured format for better parsing
    if (useCase.includes('canvas') || useCase.includes('structured')) {
      optimized = this.addStructuredFormat(optimized);
    }
    
    // Calculate token savings (approximate)
    const originalTokens = this.estimateTokens(originalPrompt);
    const optimizedTokens = this.estimateTokens(optimized);
    const tokenSavings = Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100);
    
    // Cache the optimization
    this.promptTemplates.set(templateKey, {
      original: originalPrompt,
      optimized,
      tokenSavings,
      createdAt: new Date()
    });
    
    const duration = performance.now() - start;
    console.log(`⚡ Prompt optimized: ${tokenSavings}% token reduction (${duration.toFixed(2)}ms)`);
    
    return optimized;
  }

  /**
   * Add structured format to prompt for better AI parsing
   */
  addStructuredFormat(prompt) {
    if (!prompt.includes('JSON') && !prompt.includes('format')) {
      return `${prompt}\n\nProvide response in structured JSON format for efficient processing.`;
    }
    return prompt;
  }

  /**
   * Select optimal model for use case
   */
  selectOptimalModel(useCase, complexityLevel = 'medium') {
    let selectedModel = this.modelSelection[useCase] || 'gpt-4o-mini';
    
    // Upgrade model for high complexity tasks
    if (complexityLevel === 'high' && selectedModel === 'gpt-4o-mini') {
      selectedModel = 'gpt-4o';
    }
    
    // Check cost constraints
    const currentDailyCost = this.getDailyCost();
    if (currentDailyCost > this.costThresholds.dailyBudget * 0.8) {
      // Switch to cheaper model if approaching budget limit
      selectedModel = 'gpt-4o-mini';
      console.log('💰 Switching to cost-efficient model due to budget constraints');
    }
    
    console.log(`🤖 Selected model: ${selectedModel} for use case: ${useCase}`);
    return selectedModel;
  }

  /**
   * Check cache for similar requests
   */
  getCachedResponse(prompt, model, temperature = 0.7) {
    const cacheKey = this.generateCacheKey(prompt, model, temperature);
    
    if (this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey);
      
      // Check if cache is still valid (24 hours)
      const ageHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
      if (ageHours < 24) {
        console.log('🎯 Using cached AI response (cost savings: $' + cached.cost.toFixed(4) + ')');
        return cached.response;
      } else {
        // Remove expired cache
        this.responseCache.delete(cacheKey);
      }
    }
    
    return null;
  }

  /**
   * Cache AI response for future use
   */
  cacheResponse(prompt, model, temperature, response, cost) {
    const cacheKey = this.generateCacheKey(prompt, model, temperature);
    
    this.responseCache.set(cacheKey, {
      response,
      cost,
      timestamp: Date.now(),
      model,
      tokenCount: this.estimateTokens(JSON.stringify(response))
    });
    
    // Limit cache size to prevent memory issues
    if (this.responseCache.size > 1000) {
      const oldestKey = this.responseCache.keys().next().value;
      this.responseCache.delete(oldestKey);
    }
  }

  /**
   * Calculate cost for AI request
   */
  calculateCost(model, inputTokens, outputTokens) {
    const pricing = this.modelPricing[model];
    if (!pricing) {
      console.warn(`Unknown model pricing: ${model}`);
      return 0;
    }
    
    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    const totalCost = inputCost + outputCost;
    
    return totalCost;
  }

  /**
   * Track cost for monitoring and alerting
   */
  trackCost(useCase, model, inputTokens, outputTokens, clientId = null) {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    const timestamp = new Date();
    
    // Track by use case
    if (!this.costMetrics.has(useCase)) {
      this.costMetrics.set(useCase, {
        totalCost: 0,
        requestCount: 0,
        avgCost: 0,
        dailyCost: 0,
        lastReset: timestamp
      });
    }
    
    const metrics = this.costMetrics.get(useCase);
    metrics.totalCost += cost;
    metrics.requestCount++;
    metrics.avgCost = metrics.totalCost / metrics.requestCount;
    
    // Reset daily cost if new day
    if (this.isNewDay(metrics.lastReset, timestamp)) {
      metrics.dailyCost = 0;
      metrics.lastReset = timestamp;
    }
    
    metrics.dailyCost += cost;
    
    // Check for cost alerts
    this.checkCostAlerts(useCase, cost, clientId);
    
    console.log(`💰 Cost tracked: $${cost.toFixed(4)} for ${useCase} (${model})`);
    
    return cost;
  }

  /**
   * Check for cost threshold alerts
   */
  checkCostAlerts(useCase, cost, clientId) {
    const dailyCost = this.getDailyCost();
    const monthlyCost = this.getMonthlyCost();
    
    // Alert if single request is expensive
    if (cost > 0.50) {
      console.warn(`🚨 High cost request: $${cost.toFixed(4)} for ${useCase}`);
    }
    
    // Alert if approaching daily budget
    if (dailyCost > this.costThresholds.dailyBudget * 0.8) {
      console.warn(`🚨 Approaching daily budget: $${dailyCost.toFixed(2)}/${this.costThresholds.dailyBudget}`);
    }
    
    // Alert if approaching monthly budget
    if (monthlyCost > this.costThresholds.monthlyBudget * 0.8) {
      console.warn(`🚨 Approaching monthly budget: $${monthlyCost.toFixed(2)}/${this.costThresholds.monthlyBudget}`);
    }
    
    // Canvas-specific cost check
    if (useCase.includes('canvas') && cost > this.costThresholds.perCanvas) {
      console.warn(`🚨 Canvas cost exceeded threshold: $${cost.toFixed(4)} > $${this.costThresholds.perCanvas}`);
    }
  }

  /**
   * Get current daily cost across all use cases
   */
  getDailyCost() {
    let totalDailyCost = 0;
    
    for (const metrics of this.costMetrics.values()) {
      totalDailyCost += metrics.dailyCost || 0;
    }
    
    return totalDailyCost;
  }

  /**
   * Get current monthly cost (approximate)
   */
  getMonthlyCost() {
    const dailyCost = this.getDailyCost();
    const daysInMonth = new Date().getDate();
    return dailyCost * daysInMonth;
  }

  /**
   * Generate cache key for response caching
   */
  generateCacheKey(prompt, model, temperature) {
    const content = `${prompt}_${model}_${temperature}`;
    return this.hashString(content);
  }

  /**
   * Hash string for consistent keys
   */
  hashString(str) {
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Estimate token count (approximate)
   */
  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if timestamp is from a new day
   */
  isNewDay(lastDate, currentDate) {
    return lastDate.toDateString() !== currentDate.toDateString();
  }

  /**
   * Reset daily cost counters
   */
  resetDailyCosts() {
    for (const metrics of this.costMetrics.values()) {
      metrics.dailyCost = 0;
      metrics.lastReset = new Date();
    }
    console.log('📅 Daily cost counters reset');
  }

  /**
   * Get comprehensive cost report
   */
  getCostReport() {
    const report = {
      summary: {
        dailyCost: this.getDailyCost(),
        monthlyCost: this.getMonthlyCost(),
        totalRequests: 0,
        avgCostPerRequest: 0
      },
      byUseCase: {},
      cacheStats: {
        size: this.responseCache.size,
        hitRate: 0 // Would need to track cache hits vs misses
      },
      budgetStatus: {
        dailyBudgetUsed: (this.getDailyCost() / this.costThresholds.dailyBudget) * 100,
        monthlyBudgetUsed: (this.getMonthlyCost() / this.costThresholds.monthlyBudget) * 100
      },
      recommendations: []
    };
    
    let totalCost = 0;
    let totalRequests = 0;
    
    for (const [useCase, metrics] of this.costMetrics.entries()) {
      report.byUseCase[useCase] = {
        totalCost: metrics.totalCost,
        requestCount: metrics.requestCount,
        avgCost: metrics.avgCost,
        dailyCost: metrics.dailyCost
      };
      
      totalCost += metrics.totalCost;
      totalRequests += metrics.requestCount;
    }
    
    report.summary.totalRequests = totalRequests;
    report.summary.avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    
    // Generate recommendations
    if (report.summary.dailyCost > this.costThresholds.dailyBudget * 0.7) {
      report.recommendations.push('Consider using more cost-efficient models for non-critical tasks');
    }
    
    if (report.cacheStats.size < 100) {
      report.recommendations.push('Increase response caching to reduce duplicate AI requests');
    }
    
    return report;
  }

  /**
   * Optimize AI request with all cost-saving measures
   */
  async optimizeAIRequest(originalPrompt, useCase, options = {}) {
    const start = performance.now();
    
    // 1. Optimize prompt for token efficiency
    const optimizedPrompt = this.optimizePrompt(originalPrompt, useCase);
    
    // 2. Select optimal model
    const model = this.selectOptimalModel(useCase, options.complexity);
    
    // 3. Check cache first
    const temperature = options.temperature || 0.7;
    const cachedResponse = this.getCachedResponse(optimizedPrompt, model, temperature);
    
    if (cachedResponse) {
      return {
        response: cachedResponse,
        fromCache: true,
        cost: 0,
        model,
        optimizations: ['prompt', 'cache']
      };
    }
    
    // 4. Prepare optimized request configuration
    const requestConfig = {
      model,
      temperature,
      max_tokens: options.maxTokens || 2000,
      response_format: { type: "json_object" }
    };
    
    const duration = performance.now() - start;
    
    return {
      optimizedPrompt,
      requestConfig,
      fromCache: false,
      optimizations: ['prompt', 'model-selection'],
      optimizationTime: duration
    };
  }
}
