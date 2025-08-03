const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const Artefact = require('../../models/optimizedArtefactModel');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Enhanced Agent Runner optimized for MongoDB AI workflows
 * Leverages MongoDB's vector search, aggregation pipelines, and AI-optimized schemas
 */
class OptimizedAgentRunner {
  constructor() {
    this.modelConfig = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    };
  }

  /**
   * Run an AI agent with enhanced MongoDB integration
   */
  async runAgent(agentName, input, options = {}) {
    const startTime = Date.now();
    
    try {
      // Extract context from input
      const context = this.extractContext(input);
      const { clientId, workflowId, workflowStage } = context;

      console.log(`[${agentName}] Starting agent execution for client: ${clientId}`);

      // Get relevant context from previous artefacts using MongoDB aggregation
      const contextArtefacts = await this.getRelevantContext(clientId, agentName, workflowStage);
      
      // Build enhanced prompt with context
      const enhancedPrompt = this.buildContextualPrompt(agentName, input, contextArtefacts);
      
      // Execute OpenAI request with optimized parameters
      const aiResponse = await this.executeAIRequest(enhancedPrompt, agentName);
      
      // Process and validate AI response
      const processedResponse = this.processAIResponse(aiResponse, agentName);
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(processedResponse, contextArtefacts);
      
      // Create optimized artefact with enhanced metadata
      const artefact = await this.createOptimizedArtefact({
        clientId,
        workflowId,
        workflowStage,
        agentName,
        aiResponse: processedResponse,
        context: contextArtefacts,
        qualityMetrics,
        processingTime: Date.now() - startTime
      });

      // Update workflow dependencies
      await this.updateWorkflowDependencies(artefact, contextArtefacts);

      console.log(`[${agentName}] Successfully created optimized artefact: ${artefact.id}`);
      
      return {
        status: 'completed',
        result: processedResponse,
        artefactId: artefact.id,
        qualityScore: qualityMetrics.overall_score,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error(`[${agentName}] Agent execution failed:`, error);
      
      // Create failure artefact for debugging
      await this.createFailureArtefact(agentName, input, error);
      
      throw new Error(`Agent ${agentName} execution failed: ${error.message}`);
    }
  }

  /**
   * Extract context from various input formats
   */
  extractContext(input) {
    let clientId, workflowId, workflowStage;
    
    if (typeof input === 'object') {
      clientId = input.clientId || input.id;
      workflowId = input.workflowId || `workflow_${Date.now()}`;
      workflowStage = input.workflowStage || 'discovery';
    } else if (typeof input === 'string') {
      clientId = input;
      workflowId = `workflow_${Date.now()}`;
      workflowStage = 'discovery';
    }

    if (!clientId) {
      throw new Error('ClientId is required for agent execution');
    }

    return { clientId, workflowId, workflowStage };
  }

  /**
   * Get relevant context using MongoDB aggregation pipeline
   */
  async getRelevantContext(clientId, agentName, workflowStage) {
    try {
      // Use MongoDB aggregation to get contextually relevant artefacts
      const pipeline = [
        { $match: { clientId } },
        { 
          $addFields: {
            relevanceScore: {
              $switch: {
                branches: [
                  // Same workflow stage gets highest relevance
                  { case: { $eq: ['$workflowStage', workflowStage] }, then: 3 },
                  // Previous stages get medium relevance
                  { case: { $in: ['$workflowStage', ['discovery', 'validation']] }, then: 2 },
                  // Other stages get low relevance
                  { case: true, then: 1 }
                ]
              }
            }
          }
        },
        { $sort: { relevanceScore: -1, createdAt: -1 } },
        { $limit: 5 },
        {
          $project: {
            id: 1,
            agentType: 1,
            workflowStage: 1,
            'content.structured': 1,
            relevanceScore: 1,
            createdAt: 1
          }
        }
      ];

      const contextArtefacts = await Artefact.aggregate(pipeline);
      
      console.log(`[${agentName}] Found ${contextArtefacts.length} relevant context artefacts`);
      return contextArtefacts;
      
    } catch (error) {
      console.warn(`[${agentName}] Failed to get context artefacts:`, error);
      return [];
    }
  }

  /**
   * Build contextual prompt with previous artefact insights
   */
  buildContextualPrompt(agentName, input, contextArtefacts) {
    const basePrompt = this.getAgentPrompt(agentName);
    
    let contextSection = '';
    if (contextArtefacts.length > 0) {
      contextSection = '\n\nPREVIOUS ANALYSIS CONTEXT:\n';
      contextArtefacts.forEach((artefact, index) => {
        const structured = artefact.content?.structured || {};
        contextSection += `\n${index + 1}. From ${artefact.agentType} (${artefact.workflowStage}):\n`;
        if (structured.analysis) contextSection += `   Analysis: ${structured.analysis.substring(0, 200)}...\n`;
        if (structured.insights) contextSection += `   Key Insights: ${structured.insights.slice(0, 2).join(', ')}\n`;
      });
      contextSection += '\nPlease build upon these previous insights in your analysis.\n';
    }

    return `${basePrompt}${contextSection}\n\nINPUT: ${JSON.stringify(input)}\n\nProvide your response as a valid JSON object with the structure: {"analysis": "...", "recommendations": [...], "nextSteps": [...], "insights": [...], "confidence": 0.0-1.0, "reasoning": "..."}`;
  }

  /**
   * Get agent-specific prompts
   */
  getAgentPrompt(agentName) {
    const prompts = {
      intakeAgent: "You are an expert business intake specialist. Analyze the client information and provide comprehensive insights about their business context, challenges, and opportunities.",
      researchAgent: "You are a strategic research analyst. Conduct thorough analysis of the client's industry, market position, and competitive landscape.",
      canvasDraftingAgent: "You are a business model expert. Create strategic frameworks and canvases that map the client's business model and value propositions.",
      validationPlanAgent: "You are a validation strategy expert. Design comprehensive plans to test and validate business hypotheses and strategies.",
      scaleAgent: "You are a growth strategy consultant. Develop scalable strategies and implementation roadmaps for business expansion."
    };
    
    return prompts[agentName] || "You are an AI business consultant. Provide strategic analysis and recommendations.";
  }

  /**
   * Execute AI request with error handling and retries
   */
  async executeAIRequest(prompt, agentName, retries = 2) {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        console.log(`[${agentName}] Executing OpenAI request (attempt ${attempt})`);
        
        const response = await openai.chat.completions.create({
          ...this.modelConfig,
          messages: [
            {
              role: 'system',
              content: 'You are a professional business consultant. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        return {
          content,
          usage: response.usage,
          model: response.model
        };

      } catch (error) {
        console.warn(`[${agentName}] Attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries + 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Process and validate AI response
   */
  processAIResponse(aiResponse, agentName) {
    try {
      const parsed = JSON.parse(aiResponse.content);
      
      // Validate required fields
      const required = ['analysis', 'recommendations', 'nextSteps', 'insights'];
      const missing = required.filter(field => !parsed[field]);
      
      if (missing.length > 0) {
        console.warn(`[${agentName}] Missing fields: ${missing.join(', ')}`);
        // Fill missing fields with defaults
        missing.forEach(field => {
          parsed[field] = field === 'analysis' ? 'Analysis pending' : [];
        });
      }

      // Ensure arrays are arrays
      ['recommendations', 'nextSteps', 'insights'].forEach(field => {
        if (parsed[field] && !Array.isArray(parsed[field])) {
          parsed[field] = [parsed[field]];
        }
      });

      // Add confidence score if missing
      if (typeof parsed.confidence !== 'number') {
        parsed.confidence = 0.8; // Default confidence
      }

      return parsed;

    } catch (error) {
      console.warn(`[${agentName}] Failed to parse JSON, creating fallback structure`);
      
      // Fallback structure
      return {
        analysis: aiResponse.content || 'Analysis could not be parsed',
        recommendations: ['Review and refine analysis'],
        nextSteps: ['Manual review required'],
        insights: ['Parsing error occurred'],
        confidence: 0.3,
        reasoning: 'Fallback due to JSON parsing error'
      };
    }
  }

  /**
   * Calculate quality metrics for the AI response
   */
  calculateQualityMetrics(response, contextArtefacts) {
    let score = 0.5; // Base score
    
    // Content completeness
    if (response.analysis && response.analysis.length > 50) score += 0.1;
    if (response.recommendations && response.recommendations.length > 0) score += 0.1;
    if (response.nextSteps && response.nextSteps.length > 0) score += 0.1;
    if (response.insights && response.insights.length > 0) score += 0.1;
    
    // Content quality indicators
    if (response.confidence && response.confidence > 0.7) score += 0.1;
    if (response.reasoning && response.reasoning.length > 20) score += 0.1;
    
    // Context utilization
    if (contextArtefacts.length > 0 && response.analysis.length > 100) score += 0.1;
    
    return {
      overall_score: Math.min(1.0, score),
      completeness: (response.analysis ? 0.25 : 0) + 
                   (response.recommendations?.length > 0 ? 0.25 : 0) +
                   (response.nextSteps?.length > 0 ? 0.25 : 0) +
                   (response.insights?.length > 0 ? 0.25 : 0),
      confidence: response.confidence || 0.5,
      context_utilization: contextArtefacts.length > 0 ? 0.8 : 0.3
    };
  }

  /**
   * Create optimized artefact with enhanced metadata
   */
  async createOptimizedArtefact({
    clientId,
    workflowId,
    workflowStage,
    agentName,
    aiResponse,
    context,
    qualityMetrics,
    processingTime
  }) {
    const artefactId = uuidv4();
    
    const artefact = new Artefact({
      id: artefactId,
      clientId,
      agentId: agentName,
      agentType: agentName,
      workflowId,
      workflowStage,
      name: `${agentName}_result`,
      type: 'ai_analysis',
      status: 'completed',
      content: {
        raw: aiResponse,
        structured: aiResponse,
        metadata: {
          model_used: this.modelConfig.model,
          processing_time: processingTime,
          quality_score: qualityMetrics.overall_score,
          context_count: context.length
        }
      },
      execution: {
        input_context: { workflowStage, agentName },
        dependencies: context.map(c => c.id),
        agent_state: { completed: true }
      },
      validation: {
        is_validated: qualityMetrics.overall_score > 0.7,
        validation_score: qualityMetrics.overall_score
      },
      version: 1
    });

    await artefact.save();
    return artefact;
  }

  /**
   * Update workflow dependencies
   */
  async updateWorkflowDependencies(newArtefact, contextArtefacts) {
    try {
      // Update dependents in context artefacts
      const updatePromises = contextArtefacts.map(context => 
        Artefact.findByIdAndUpdate(
          context._id,
          { $addToSet: { 'execution.dependents': newArtefact.id } }
        )
      );
      
      await Promise.all(updatePromises);
      console.log(`Updated ${contextArtefacts.length} dependency relationships`);
      
    } catch (error) {
      console.warn('Failed to update workflow dependencies:', error);
    }
  }

  /**
   * Create failure artefact for debugging
   */
  async createFailureArtefact(agentName, input, error) {
    try {
      const context = this.extractContext(input);
      
      const failureArtefact = new Artefact({
        id: uuidv4(),
        clientId: context.clientId,
        agentId: agentName,
        agentType: agentName,
        workflowId: context.workflowId,
        workflowStage: context.workflowStage,
        name: `${agentName}_failure`,
        type: 'error_log',
        status: 'failed',
        content: {
          raw: { error: error.message, input },
          structured: {
            analysis: `Agent ${agentName} failed to execute`,
            recommendations: ['Review error logs', 'Check input format', 'Retry with different parameters'],
            nextSteps: ['Debug agent execution', 'Fix underlying issue'],
            insights: ['Agent execution failure occurred'],
            confidence: 0.0,
            reasoning: error.message
          }
        }
      });

      await failureArtefact.save();
      console.log(`Created failure artefact for debugging: ${failureArtefact.id}`);
      
    } catch (saveError) {
      console.error('Failed to save failure artefact:', saveError);
    }
  }
}

module.exports = new OptimizedAgentRunner();
