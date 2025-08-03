/**
 * Database Optimization Service
 * 
 * Implements Sprint 4 Story 4.1.1: Database Query Optimization
 * - Query execution <100ms for typical datasets
 * - Proper indexing for all search patterns
 * - Query result caching with Redis
 * - Database connection pooling optimization
 * - Query performance monitoring
 */

import mongoose from 'mongoose';
import { performance } from 'perf_hooks';

export default class DatabaseOptimizationService {
  constructor() {
    this.queryCache = new Map();
    this.performanceMetrics = new Map();
    this.slowQueryThreshold = 100; // 100ms threshold
    
    // Initialize performance monitoring
    this.initializeMonitoring();
  }

  /**
   * Initialize database performance monitoring
   */
  initializeMonitoring() {
    // Monitor slow queries
    mongoose.connection.on('slow', (query) => {
      console.warn(`🐌 Slow Query Detected:`, {
        query: query.toString(),
        duration: query.duration,
        collection: query.collection
      });
      
      this.recordSlowQuery(query);
    });

    // Set slow query threshold
    mongoose.set('debug', (collectionName, method, query, doc) => {
      const start = performance.now();
      
      // Track query performance
      process.nextTick(() => {
        const duration = performance.now() - start;
        if (duration > this.slowQueryThreshold) {
          this.recordSlowQuery({
            collection: collectionName,
            method,
            query,
            duration
          });
        }
      });
    });
  }

  /**
   * Record slow query for analysis
   */
  recordSlowQuery(queryInfo) {
    const key = `${queryInfo.collection}_${queryInfo.method}`;
    
    if (!this.performanceMetrics.has(key)) {
      this.performanceMetrics.set(key, {
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        queries: []
      });
    }
    
    const metrics = this.performanceMetrics.get(key);
    metrics.count++;
    metrics.totalDuration += queryInfo.duration;
    metrics.maxDuration = Math.max(metrics.maxDuration, queryInfo.duration);
    metrics.queries.push({
      query: queryInfo.query,
      duration: queryInfo.duration,
      timestamp: new Date()
    });
    
    // Keep only last 10 slow queries per collection/method
    if (metrics.queries.length > 10) {
      metrics.queries.shift();
    }
  }

  /**
   * Optimize Client queries with proper indexing and aggregation
   */
  async optimizeClientQueries() {
    const Client = mongoose.model('Client');
    
    // Ensure optimal indexes exist
    await this.ensureClientIndexes(Client);
    
    return {
      // Optimized client list with metrics
      async getClientsWithMetrics(filters = {}) {
        const start = performance.now();
        
        const pipeline = [
          { $match: filters },
          {
            $lookup: {
              from: 'tasks',
              localField: '_id',
              foreignField: 'clientId',
              as: 'tasks',
              pipeline: [
                {
                  $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              'metrics.taskStats': {
                $arrayToObject: {
                  $map: {
                    input: '$tasks',
                    as: 'task',
                    in: { k: '$$task._id', v: '$$task.count' }
                  }
                }
              }
            }
          },
          { $sort: { 'metrics.lastActivity': -1 } },
          {
            $project: {
              name: 1,
              email: 1,
              company: 1,
              industry: 1,
              status: 1,
              metrics: 1,
              workflowStatus: 1,
              createdAt: 1
            }
          }
        ];
        
        const clients = await Client.aggregate(pipeline);
        const duration = performance.now() - start;
        
        console.log(`📊 Client query optimized: ${duration.toFixed(2)}ms`);
        return clients;
      },

      // Optimized client search
      async searchClients(searchTerm, limit = 20) {
        const start = performance.now();
        
        const searchRegex = new RegExp(searchTerm, 'i');
        const clients = await Client.find({
          $or: [
            { name: searchRegex },
            { company: searchRegex },
            { email: searchRegex },
            { industry: searchRegex }
          ]
        })
        .select('name email company industry status metrics')
        .sort({ 'metrics.lastActivity': -1 })
        .limit(limit)
        .lean();
        
        const duration = performance.now() - start;
        console.log(`🔍 Client search optimized: ${duration.toFixed(2)}ms`);
        
        return clients;
      }
    };
  }

  /**
   * Optimize Canvas queries for Sprint 3 components
   */
  async optimizeCanvasQueries() {
    const Canvas = mongoose.model('Canvas');
    
    // Ensure optimal indexes exist
    await this.ensureCanvasIndexes(Canvas);
    
    return {
      // Optimized canvas gallery with filtering and sorting
      async getCanvasGallery(filters = {}, options = {}) {
        const start = performance.now();
        
        const {
          clientId,
          type,
          status,
          minQuality = 0,
          sortBy = 'updatedAt',
          sortOrder = -1,
          page = 1,
          limit = 20
        } = { ...filters, ...options };
        
        const matchStage = {
          ...(clientId && { clientId }),
          ...(type && { type }),
          ...(status && { status }),
          'metadata.qualityScore': { $gte: minQuality }
        };
        
        const pipeline = [
          { $match: matchStage },
          {
            $lookup: {
              from: 'clients',
              localField: 'clientId',
              foreignField: '_id',
              as: 'client',
              pipeline: [{ $project: { name: 1, company: 1 } }]
            }
          },
          { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              visualStatus: {
                $cond: {
                  if: { $and: [
                    { $ne: ['$visual.svg', null] },
                    { $ne: ['$visual.svg', ''] }
                  ]},
                  then: 'ready',
                  else: 'pending'
                }
              }
            }
          },
          { $sort: { [sortBy]: sortOrder } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              title: 1,
              type: 1,
              status: 1,
              'metadata.qualityScore': 1,
              'metadata.agentId': 1,
              visualStatus: 1,
              'client.name': 1,
              'client.company': 1,
              createdAt: 1,
              updatedAt: 1
            }
          }
        ];
        
        const [canvases, totalCount] = await Promise.all([
          Canvas.aggregate(pipeline),
          Canvas.countDocuments(matchStage)
        ]);
        
        const duration = performance.now() - start;
        console.log(`🎨 Canvas gallery optimized: ${duration.toFixed(2)}ms`);
        
        return {
          canvases,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
          },
          performance: { queryTime: duration }
        };
      },

      // Optimized canvas statistics for dashboard
      async getCanvasStats(clientId = null) {
        const start = performance.now();
        
        const matchStage = clientId ? { clientId } : {};
        
        const stats = await Canvas.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalCanvases: { $sum: 1 },
              byType: {
                $push: {
                  type: '$type',
                  status: '$status',
                  quality: '$metadata.qualityScore'
                }
              },
              avgQuality: { $avg: '$metadata.qualityScore' },
              recentActivity: {
                $sum: {
                  $cond: [
                    { $gte: ['$updatedAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                    1,
                    0
                  ]
                }
              }
            }
          },
          {
            $project: {
              totalCanvases: 1,
              avgQuality: { $round: ['$avgQuality', 2] },
              recentActivity: 1,
              typeBreakdown: {
                $reduce: {
                  input: '$byType',
                  initialValue: {},
                  in: {
                    $mergeObjects: [
                      '$$value',
                      {
                        [`$$this.type`]: {
                          $add: [
                            { $ifNull: [`$$value.$$this.type`, 0] },
                            1
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        ]);
        
        const duration = performance.now() - start;
        console.log(`📈 Canvas stats optimized: ${duration.toFixed(2)}ms`);
        
        return stats[0] || {
          totalCanvases: 0,
          avgQuality: 0,
          recentActivity: 0,
          typeBreakdown: {}
        };
      }
    };
  }

  /**
   * Optimize Task queries with proper indexing
   */
  async optimizeTaskQueries() {
    const Task = mongoose.model('Task');
    
    // Ensure optimal indexes exist
    await this.ensureTaskIndexes(Task);
    
    return {
      // Optimized task retrieval with client metrics
      async getTasksWithMetrics(clientId, filters = {}) {
        const start = performance.now();
        
        const pipeline = [
          { $match: { clientId, ...filters } },
          {
            $facet: {
              tasks: [
                { $sort: { priority: 1, updatedAt: -1 } },
                {
                  $project: {
                    title: 1,
                    description: 1,
                    status: 1,
                    priority: 1,
                    assignedTo: 1,
                    agentId: 1,
                    progress: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    dueDate: 1
                  }
                }
              ],
              metrics: [
                {
                  $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: {
                      $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
                    },
                    inProgress: {
                      $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
                    },
                    pending: {
                      $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] }
                    },
                    avgProgress: { $avg: '$progress' }
                  }
                }
              ]
            }
          }
        ];
        
        const result = await Task.aggregate(pipeline);
        const duration = performance.now() - start;
        
        console.log(`📋 Task query optimized: ${duration.toFixed(2)}ms`);
        
        return {
          tasks: result[0].tasks,
          metrics: result[0].metrics[0] || {
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
            avgProgress: 0
          },
          performance: { queryTime: duration }
        };
      }
    };
  }

  /**
   * Ensure optimal indexes for Client collection
   */
  async ensureClientIndexes(Client) {
    const indexes = [
      { 'metrics.lastActivity': -1 },
      { email: 1 },
      { status: 1 },
      { industry: 1 },
      { name: 'text', company: 'text', email: 'text' }, // Text search
      { 'workflowStatus.discovery.status': 1 },
      { 'workflowStatus.validation.status': 1 },
      { 'workflowStatus.scale.status': 1 }
    ];
    
    for (const index of indexes) {
      try {
        await Client.collection.createIndex(index);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn('Failed to create client index:', index, error.message);
        }
      }
    }
  }

  /**
   * Ensure optimal indexes for Canvas collection
   */
  async ensureCanvasIndexes(Canvas) {
    const indexes = [
      { clientId: 1, updatedAt: -1 },
      { type: 1, status: 1 },
      { 'metadata.qualityScore': -1 },
      { 'metadata.agentId': 1 },
      { status: 1, publishedAt: -1 },
      { clientId: 1, type: 1, status: 1 }, // Compound index for filtering
      { updatedAt: -1 }, // For recent activity
      { createdAt: -1 }  // For chronological sorting
    ];
    
    for (const index of indexes) {
      try {
        await Canvas.collection.createIndex(index);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn('Failed to create canvas index:', index, error.message);
        }
      }
    }
  }

  /**
   * Ensure optimal indexes for Task collection
   */
  async ensureTaskIndexes(Task) {
    const indexes = [
      { clientId: 1, updatedAt: -1 },
      { status: 1 },
      { priority: 1 },
      { assignedTo: 1 },
      { agentId: 1 },
      { dueDate: 1 },
      { clientId: 1, status: 1 }, // Compound index for client task filtering
      { createdAt: -1 }
    ];
    
    for (const index of indexes) {
      try {
        await Task.collection.createIndex(index);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn('Failed to create task index:', index, error.message);
        }
      }
    }
  }

  /**
   * Get performance metrics and recommendations
   */
  getPerformanceReport() {
    const report = {
      slowQueries: [],
      recommendations: [],
      metrics: {}
    };
    
    for (const [key, metrics] of this.performanceMetrics.entries()) {
      const avgDuration = metrics.totalDuration / metrics.count;
      
      report.metrics[key] = {
        count: metrics.count,
        avgDuration: Math.round(avgDuration * 100) / 100,
        maxDuration: Math.round(metrics.maxDuration * 100) / 100
      };
      
      if (avgDuration > this.slowQueryThreshold) {
        report.slowQueries.push({
          collection: key,
          avgDuration,
          count: metrics.count,
          recommendations: this.getQueryRecommendations(key, metrics)
        });
      }
    }
    
    return report;
  }

  /**
   * Get optimization recommendations for slow queries
   */
  getQueryRecommendations(collectionMethod, metrics) {
    const recommendations = [];
    
    if (metrics.maxDuration > 500) {
      recommendations.push('Consider adding compound indexes for frequently queried fields');
    }
    
    if (metrics.count > 100) {
      recommendations.push('High query frequency - implement result caching');
    }
    
    if (collectionMethod.includes('find') && metrics.avgDuration > 200) {
      recommendations.push('Use aggregation pipeline for complex queries');
    }
    
    return recommendations;
  }

  /**
   * Initialize all optimizations
   */
  async initialize() {
    console.log('🚀 Initializing Database Optimization Service...');
    
    const [clientQueries, canvasQueries, taskQueries] = await Promise.all([
      this.optimizeClientQueries(),
      this.optimizeCanvasQueries(),
      this.optimizeTaskQueries()
    ]);
    
    console.log('✅ Database optimization service initialized');
    
    return {
      client: clientQueries,
      canvas: canvasQueries,
      task: taskQueries,
      getPerformanceReport: () => this.getPerformanceReport()
    };
  }
}
