/**
 * Vector Search Service
 * 
 * Implements Sprint 4 Story 4.2.1: Vector Search Implementation
 * - Semantic search across all artefacts
 * - Similar canvas discovery
 * - Context-aware agent recommendations
 * - Duplicate detection and consolidation
 * - Search performance <200ms
 */

import mongoose from 'mongoose';
import { performance } from 'perf_hooks';
import OpenAI from 'openai';

export default class VectorSearchService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.embeddingModel = 'text-embedding-3-small'; // Cost-effective embedding model
    this.embeddingCache = new Map();
    this.searchCache = new Map();
    
    // Vector search configuration
    this.config = {
      embeddingDimensions: 1536, // text-embedding-3-small dimensions
      similarityThreshold: 0.7,   // Minimum similarity for matches
      maxResults: 20,             // Maximum search results
      cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
      duplicateThreshold: 0.9     // Threshold for duplicate detection
    };
    
    this.initializeVectorSearch();
  }

  /**
   * Initialize vector search capabilities
   */
  async initializeVectorSearch() {
    console.log('🔍 Initializing Vector Search Service...');
    
    // Ensure vector indexes exist in MongoDB
    await this.ensureVectorIndexes();
    
    console.log('✅ Vector Search Service initialized');
  }

  /**
   * Generate embedding for text content
   */
  async generateEmbedding(text, cacheKey = null) {
    const start = performance.now();
    
    // Check cache first
    if (cacheKey && this.embeddingCache.has(cacheKey)) {
      const cached = this.embeddingCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheExpiry) {
        console.log('📋 Using cached embedding');
        return cached.embedding;
      }
    }
    
    try {
      // Clean and prepare text
      const cleanText = this.preprocessText(text);
      
      // Generate embedding using OpenAI
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: cleanText,
        encoding_format: 'float'
      });
      
      const embedding = response.data[0].embedding;
      const duration = performance.now() - start;
      
      // Cache the embedding
      if (cacheKey) {
        this.embeddingCache.set(cacheKey, {
          embedding,
          timestamp: Date.now()
        });
        
        // Limit cache size
        if (this.embeddingCache.size > 1000) {
          const oldestKey = this.embeddingCache.keys().next().value;
          this.embeddingCache.delete(oldestKey);
        }
      }
      
      console.log(`🧠 Generated embedding: ${duration.toFixed(2)}ms`);
      return embedding;
      
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Preprocess text for better embeddings
   */
  preprocessText(text) {
    if (typeof text !== 'string') {
      text = JSON.stringify(text);
    }
    
    return text
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '')   // Remove special characters
      .trim()
      .substring(0, 8000);            // Limit length for embedding model
  }

  /**
   * Semantic search across all artefacts
   */
  async semanticSearch(query, options = {}) {
    const start = performance.now();
    
    const {
      clientId = null,
      workflowStage = null,
      agentType = null,
      limit = this.config.maxResults,
      threshold = this.config.similarityThreshold
    } = options;
    
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query, `query_${query}`);
      
      // Build MongoDB aggregation pipeline for vector search
      const pipeline = [
        {
          $vectorSearch: {
            index: 'artefact_vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: limit * 3, // Search more candidates for better results
            limit: limit
          }
        },
        {
          $addFields: {
            similarityScore: { $meta: 'vectorSearchScore' }
          }
        }
      ];
      
      // Add filters if specified
      const matchFilters = {};
      if (clientId) matchFilters.clientId = clientId;
      if (workflowStage) matchFilters.workflowStage = workflowStage;
      if (agentType) matchFilters.agentType = agentType;
      if (threshold) matchFilters.similarityScore = { $gte: threshold };
      
      if (Object.keys(matchFilters).length > 0) {
        pipeline.push({ $match: matchFilters });
      }
      
      // Add result projection
      pipeline.push({
        $project: {
          id: 1,
          name: 1,
          agentType: 1,
          workflowStage: 1,
          'content.structured': 1,
          similarityScore: 1,
          createdAt: 1,
          relevantContent: {
            $substr: [
              { $toString: '$content.structured' },
              0,
              300
            ]
          }
        }
      });
      
      // Execute search
      const Artefact = mongoose.model('Artefact');
      const results = await Artefact.aggregate(pipeline);
      
      const duration = performance.now() - start;
      
      console.log(`🔍 Semantic search completed: ${results.length} results in ${duration.toFixed(2)}ms`);
      
      return {
        query,
        results,
        metadata: {
          searchTime: duration,
          resultCount: results.length,
          filters: { clientId, workflowStage, agentType }
        }
      };
      
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw new Error(`Semantic search failed: ${error.message}`);
    }
  }

  /**
   * Find similar canvases
   */
  async findSimilarCanvases(canvasId, options = {}) {
    const start = performance.now();
    
    const {
      limit = 10,
      threshold = this.config.similarityThreshold,
      includeMetadata = true
    } = options;
    
    try {
      const Canvas = mongoose.model('Canvas');
      
      // Get the source canvas
      const sourceCanvas = await Canvas.findById(canvasId);
      if (!sourceCanvas) {
        throw new Error('Canvas not found');
      }
      
      // Generate embedding for canvas content
      const canvasContent = this.extractCanvasContent(sourceCanvas);
      const canvasEmbedding = await this.generateEmbedding(canvasContent, `canvas_${canvasId}`);
      
      // Find similar canvases using vector search
      const pipeline = [
        {
          $vectorSearch: {
            index: 'canvas_vector_index',
            path: 'embedding',
            queryVector: canvasEmbedding,
            numCandidates: limit * 2,
            limit: limit + 1 // +1 to exclude the source canvas
          }
        },
        {
          $addFields: {
            similarityScore: { $meta: 'vectorSearchScore' }
          }
        },
        {
          $match: {
            _id: { $ne: mongoose.Types.ObjectId(canvasId) }, // Exclude source canvas
            similarityScore: { $gte: threshold }
          }
        },
        {
          $project: {
            title: 1,
            type: 1,
            clientId: 1,
            'metadata.qualityScore': 1,
            similarityScore: 1,
            createdAt: 1,
            ...(includeMetadata && {
              'client.name': 1,
              'client.company': 1
            })
          }
        }
      ];
      
      // Add client lookup if metadata requested
      if (includeMetadata) {
        pipeline.splice(-1, 0, {
          $lookup: {
            from: 'clients',
            localField: 'clientId',
            foreignField: '_id',
            as: 'client',
            pipeline: [{ $project: { name: 1, company: 1 } }]
          }
        });
        pipeline.splice(-1, 0, {
          $unwind: { path: '$client', preserveNullAndEmptyArrays: true }
        });
      }
      
      const similarCanvases = await Canvas.aggregate(pipeline);
      const duration = performance.now() - start;
      
      console.log(`🎨 Found ${similarCanvases.length} similar canvases in ${duration.toFixed(2)}ms`);
      
      return {
        sourceCanvas: {
          id: sourceCanvas._id,
          title: sourceCanvas.title,
          type: sourceCanvas.type
        },
        similarCanvases,
        metadata: {
          searchTime: duration,
          threshold,
          resultCount: similarCanvases.length
        }
      };
      
    } catch (error) {
      console.error('Similar canvas search failed:', error);
      throw new Error(`Similar canvas search failed: ${error.message}`);
    }
  }

  /**
   * Get context-aware agent recommendations
   */
  async getAgentRecommendations(clientId, currentContext = {}) {
    const start = performance.now();
    
    try {
      // Get client's workflow history and current state
      const Client = mongoose.model('Client');
      const Artefact = mongoose.model('Artefact');
      
      const client = await Client.findById(clientId);
      if (!client) {
        throw new Error('Client not found');
      }
      
      // Analyze client's current challenges and goals
      const contextText = this.buildContextText(client, currentContext);
      const contextEmbedding = await this.generateEmbedding(contextText, `context_${clientId}`);
      
      // Find relevant artefacts from similar clients/contexts
      const relevantArtefacts = await Artefact.aggregate([
        {
          $vectorSearch: {
            index: 'artefact_vector_index',
            path: 'embedding',
            queryVector: contextEmbedding,
            numCandidates: 50,
            limit: 20
          }
        },
        {
          $addFields: {
            similarityScore: { $meta: 'vectorSearchScore' }
          }
        },
        {
          $match: {
            clientId: { $ne: clientId }, // Exclude current client's artefacts
            similarityScore: { $gte: 0.6 }
          }
        },
        {
          $group: {
            _id: '$agentType',
            count: { $sum: 1 },
            avgQuality: { $avg: '$content.metadata.quality_score' },
            avgSimilarity: { $avg: '$similarityScore' },
            examples: { $push: {
              name: '$name',
              workflowStage: '$workflowStage',
              quality: '$content.metadata.quality_score'
            }}
          }
        },
        {
          $addFields: {
            recommendationScore: {
              $multiply: ['$avgQuality', '$avgSimilarity', '$count']
            }
          }
        },
        { $sort: { recommendationScore: -1 } },
        { $limit: 5 }
      ]);
      
      // Generate recommendations based on analysis
      const recommendations = relevantArtefacts.map(agent => ({
        agentType: agent._id,
        confidence: Math.min(agent.recommendationScore * 0.1, 1.0),
        reasoning: this.generateRecommendationReasoning(agent, client),
        expectedOutcome: this.getExpectedOutcome(agent._id),
        estimatedCost: this.estimateAgentCost(agent._id),
        examples: agent.examples.slice(0, 3)
      }));
      
      const duration = performance.now() - start;
      
      console.log(`🤖 Generated ${recommendations.length} agent recommendations in ${duration.toFixed(2)}ms`);
      
      return {
        clientId,
        recommendations,
        metadata: {
          analysisTime: duration,
          contextFactors: Object.keys(currentContext),
          basedOnArtefacts: relevantArtefacts.length
        }
      };
      
    } catch (error) {
      console.error('Agent recommendation failed:', error);
      throw new Error(`Agent recommendation failed: ${error.message}`);
    }
  }

  /**
   * Detect and consolidate duplicate artefacts
   */
  async detectDuplicates(clientId = null, options = {}) {
    const start = performance.now();
    
    const {
      threshold = this.config.duplicateThreshold,
      autoConsolidate = false
    } = options;
    
    try {
      const Artefact = mongoose.model('Artefact');
      
      // Get all artefacts for analysis
      const matchFilter = clientId ? { clientId } : {};
      const artefacts = await Artefact.find(matchFilter)
        .select('id name agentType workflowStage content embedding createdAt')
        .lean();
      
      const duplicateGroups = [];
      const processed = new Set();
      
      // Compare each artefact with others
      for (let i = 0; i < artefacts.length; i++) {
        if (processed.has(artefacts[i].id)) continue;
        
        const group = [artefacts[i]];
        processed.add(artefacts[i].id);
        
        for (let j = i + 1; j < artefacts.length; j++) {
          if (processed.has(artefacts[j].id)) continue;
          
          const similarity = await this.calculateSimilarity(
            artefacts[i].embedding,
            artefacts[j].embedding
          );
          
          if (similarity >= threshold) {
            group.push(artefacts[j]);
            processed.add(artefacts[j].id);
          }
        }
        
        if (group.length > 1) {
          duplicateGroups.push({
            duplicates: group,
            similarity: this.calculateGroupSimilarity(group),
            consolidationStrategy: this.suggestConsolidationStrategy(group)
          });
        }
      }
      
      // Auto-consolidate if requested
      if (autoConsolidate && duplicateGroups.length > 0) {
        await this.consolidateDuplicates(duplicateGroups);
      }
      
      const duration = performance.now() - start;
      
      console.log(`🔍 Duplicate detection completed: ${duplicateGroups.length} groups found in ${duration.toFixed(2)}ms`);
      
      return {
        duplicateGroups,
        metadata: {
          analysisTime: duration,
          totalArtefacts: artefacts.length,
          duplicateGroups: duplicateGroups.length,
          threshold,
          autoConsolidated: autoConsolidate
        }
      };
      
    } catch (error) {
      console.error('Duplicate detection failed:', error);
      throw new Error(`Duplicate detection failed: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  async calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return 0;
    
    // Calculate dot product
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    // Calculate cosine similarity
    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return Math.max(0, Math.min(1, similarity)); // Clamp between 0 and 1
  }

  /**
   * Extract searchable content from canvas
   */
  extractCanvasContent(canvas) {
    const content = [];
    
    content.push(canvas.title || '');
    content.push(canvas.description || '');
    
    if (canvas.data) {
      // Extract text from canvas data structure
      const extractText = (obj) => {
        if (typeof obj === 'string') return obj;
        if (Array.isArray(obj)) return obj.map(extractText).join(' ');
        if (typeof obj === 'object' && obj !== null) {
          return Object.values(obj).map(extractText).join(' ');
        }
        return '';
      };
      
      content.push(extractText(canvas.data));
    }
    
    return content.join(' ').trim();
  }

  /**
   * Build context text for agent recommendations
   */
  buildContextText(client, currentContext) {
    const context = [];
    
    context.push(`Company: ${client.company || ''}`);
    context.push(`Industry: ${client.industry || ''}`);
    context.push(`Description: ${client.description || ''}`);
    
    if (client.currentChallenges) {
      context.push(`Challenges: ${client.currentChallenges.join(', ')}`);
    }
    
    if (client.goals) {
      context.push(`Goals: ${client.goals.join(', ')}`);
    }
    
    if (currentContext.workflowStage) {
      context.push(`Current Stage: ${currentContext.workflowStage}`);
    }
    
    if (currentContext.recentArtefacts) {
      context.push(`Recent Work: ${currentContext.recentArtefacts.join(', ')}`);
    }
    
    return context.join(' ').trim();
  }

  /**
   * Generate reasoning for agent recommendation
   */
  generateRecommendationReasoning(agentData, client) {
    const reasons = [];
    
    if (agentData.avgQuality > 0.8) {
      reasons.push('High success rate in similar contexts');
    }
    
    if (agentData.count > 5) {
      reasons.push('Proven track record with multiple clients');
    }
    
    if (agentData.avgSimilarity > 0.7) {
      reasons.push('Strong relevance to your business context');
    }
    
    return reasons.join('; ') || 'Based on similar client outcomes';
  }

  /**
   * Get expected outcome for agent type
   */
  getExpectedOutcome(agentType) {
    const outcomes = {
      'value-proposition-canvas': 'Clear value proposition and customer insights',
      'business-model-canvas': 'Comprehensive business model framework',
      'canvas-generator': 'Professional visual canvas deliverables',
      'market-research': 'Market analysis and competitive intelligence',
      'validation-plan': 'Structured hypothesis testing framework'
    };
    
    return outcomes[agentType] || 'Strategic business insights and recommendations';
  }

  /**
   * Estimate cost for agent execution
   */
  estimateAgentCost(agentType) {
    const costs = {
      'value-proposition-canvas': 0.75,
      'business-model-canvas': 1.25,
      'canvas-generator': 0.50,
      'market-research': 1.50,
      'validation-plan': 1.00
    };
    
    return costs[agentType] || 1.00;
  }

  /**
   * Ensure vector indexes exist in MongoDB
   */
  async ensureVectorIndexes() {
    try {
      const db = mongoose.connection.db;
      
      // Create vector index for artefacts
      await db.collection('artefacts').createIndex(
        { embedding: 'vector' },
        {
          name: 'artefact_vector_index',
          vectorOptions: {
            type: 'knnVector',
            dimensions: this.config.embeddingDimensions,
            similarity: 'cosine'
          }
        }
      );
      
      // Create vector index for canvases
      await db.collection('canvases').createIndex(
        { embedding: 'vector' },
        {
          name: 'canvas_vector_index',
          vectorOptions: {
            type: 'knnVector',
            dimensions: this.config.embeddingDimensions,
            similarity: 'cosine'
          }
        }
      );
      
      console.log('✅ Vector indexes created successfully');
      
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('📋 Vector indexes already exist');
      } else {
        console.warn('⚠️ Failed to create vector indexes:', error.message);
      }
    }
  }

  /**
   * Get performance and usage statistics
   */
  getVectorSearchStats() {
    return {
      embeddingCache: {
        size: this.embeddingCache.size,
        hitRate: 0 // Would need to track hits vs misses
      },
      searchCache: {
        size: this.searchCache.size
      },
      config: this.config
    };
  }
}
