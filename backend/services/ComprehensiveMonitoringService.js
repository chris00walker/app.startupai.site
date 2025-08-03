/**
 * Comprehensive Monitoring Service
 * 
 * Implements Epic 4.3 Story 4.3.1: Comprehensive Monitoring
 * - Application performance monitoring (APM)
 * - AI workflow success rate tracking
 * - Cost and usage analytics
 * - Error tracking and alerting
 * - Business metrics dashboard
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import mongoose from 'mongoose';

export default class ComprehensiveMonitoringService extends EventEmitter {
  constructor() {
    super();
    
    this.metrics = new Map();
    this.alerts = new Map();
    this.performanceData = new Map();
    this.businessMetrics = new Map();
    
    // Monitoring configuration
    this.config = {
      // Performance thresholds
      apiResponseTimeThreshold: 3000,      // 3 seconds
      dbQueryTimeThreshold: 100,           // 100ms
      canvasGenerationTimeThreshold: 30000, // 30 seconds
      
      // Quality thresholds
      agentQualityThreshold: 0.85,         // 85%
      canvasCompletionThreshold: 0.95,     // 95%
      errorRateThreshold: 0.01,            // 1%
      
      // Cost thresholds
      workflowCostThreshold: 2.00,         // $2 per canvas
      dailyBudgetThreshold: 100.00,        // $100 daily
      monthlyBudgetThreshold: 2000.00,     // $2000 monthly
      
      // Business thresholds
      clientSatisfactionThreshold: 4.5,    // 4.5/5
      timeToFirstCanvasThreshold: 300000,  // 5 minutes
      featureAdoptionThreshold: 0.80,      // 80%
      
      // Alerting configuration
      alertCooldownMs: 300000,             // 5 minutes
      criticalAlertCooldownMs: 60000,      // 1 minute
      maxAlertsPerHour: 10
    };
    
    this.initializeMonitoring();
  }

  /**
   * Initialize comprehensive monitoring
   */
  initializeMonitoring() {
    console.log('📊 Initializing Comprehensive Monitoring Service...');
    
    // Set up metric collection intervals
    this.setupMetricCollection();
    
    // Initialize alert handlers
    this.setupAlertHandlers();
    
    // Set up business metric tracking
    this.setupBusinessMetrics();
    
    console.log('✅ Comprehensive Monitoring Service initialized');
  }

  /**
   * Set up metric collection intervals
   */
  setupMetricCollection() {
    // Collect system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);
    
    // Collect business metrics every 5 minutes
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 300000);
    
    // Collect performance metrics every 30 seconds
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 30000);
  }

  /**
   * Set up alert handlers
   */
  setupAlertHandlers() {
    this.on('performance-alert', this.handlePerformanceAlert.bind(this));
    this.on('cost-alert', this.handleCostAlert.bind(this));
    this.on('quality-alert', this.handleQualityAlert.bind(this));
    this.on('business-alert', this.handleBusinessAlert.bind(this));
    this.on('error-alert', this.handleErrorAlert.bind(this));
  }

  /**
   * Set up business metrics tracking
   */
  setupBusinessMetrics() {
    // Initialize business metrics with default values
    this.businessMetrics.set('total-clients', {
      type: 'total-clients',
      values: [],
      recentValues: []
    });
    
    this.businessMetrics.set('active-clients', {
      type: 'active-clients',
      values: [],
      recentValues: []
    });
    
    this.businessMetrics.set('client-satisfaction', {
      type: 'client-satisfaction',
      values: [],
      recentValues: []
    });
    
    this.businessMetrics.set('canvas-completion-rate', {
      type: 'canvas-completion-rate',
      values: [],
      recentValues: []
    });
    
    this.businessMetrics.set('canvas-quality', {
      type: 'canvas-quality',
      values: [],
      recentValues: []
    });
    
    console.log('📊 Business metrics tracking initialized');
  }

  /**
   * Track API performance
   */
  trackAPIPerformance(endpoint, method, duration, statusCode, error = null) {
    // Add null checks for error handling
    if (!endpoint || !method) {
      console.warn('Invalid API performance tracking data:', { endpoint, method });
      return;
    }
    
    const timestamp = Date.now();
    const metricKey = `api_${method}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    if (!this.performanceData.has(metricKey)) {
      this.performanceData.set(metricKey, {
        endpoint,
        method,
        totalRequests: 0,
        totalDuration: 0,
        errorCount: 0,
        statusCodes: new Map(),
        recentRequests: []
      });
    }
    
    const data = this.performanceData.get(metricKey);
    data.totalRequests++;
    data.totalDuration += duration;
    
    // Track status codes
    const statusKey = Math.floor(statusCode / 100) * 100; // Group by 2xx, 4xx, 5xx
    data.statusCodes.set(statusKey, (data.statusCodes.get(statusKey) || 0) + 1);
    
    // Track errors
    if (error || statusCode >= 400) {
      data.errorCount++;
    }
    
    // Keep recent requests for analysis
    data.recentRequests.push({
      timestamp,
      duration,
      statusCode,
      error: error?.message || null
    });
    
    // Keep only last 100 requests
    if (data.recentRequests.length > 100) {
      data.recentRequests.shift();
    }
    
    // Check performance thresholds
    if (duration > this.config.apiResponseTimeThreshold) {
      this.emit('performance-alert', {
        type: 'slow-api-response',
        endpoint,
        method,
        duration,
        threshold: this.config.apiResponseTimeThreshold
      });
    }
    
    // Check error rate
    const errorRate = data.errorCount / data.totalRequests;
    if (errorRate > this.config.errorRateThreshold && data.totalRequests > 10) {
      this.emit('quality-alert', {
        type: 'high-error-rate',
        endpoint,
        method,
        errorRate,
        threshold: this.config.errorRateThreshold
      });
    }
  }

  /**
   * Track AI workflow performance
   */
  trackAIWorkflow(workflowId, agentType, clientId, metrics) {
    const timestamp = Date.now();
    const workflowKey = `workflow_${agentType}`;
    
    if (!this.metrics.has(workflowKey)) {
      this.metrics.set(workflowKey, {
        agentType,
        totalExecutions: 0,
        successfulExecutions: 0,
        totalDuration: 0,
        totalCost: 0,
        qualityScores: [],
        recentExecutions: []
      });
    }
    
    const data = this.metrics.get(workflowKey);
    data.totalExecutions++;
    
    if (metrics.success) {
      data.successfulExecutions++;
    }
    
    data.totalDuration += metrics.duration || 0;
    data.totalCost += metrics.cost || 0;
    
    if (metrics.qualityScore) {
      data.qualityScores.push(metrics.qualityScore);
      // Keep only last 100 quality scores
      if (data.qualityScores.length > 100) {
        data.qualityScores.shift();
      }
    }
    
    // Track recent executions
    data.recentExecutions.push({
      workflowId,
      clientId,
      timestamp,
      success: metrics.success,
      duration: metrics.duration,
      cost: metrics.cost,
      qualityScore: metrics.qualityScore,
      error: metrics.error
    });
    
    // Keep only last 50 executions
    if (data.recentExecutions.length > 50) {
      data.recentExecutions.shift();
    }
    
    // Check quality thresholds
    if (metrics.qualityScore && metrics.qualityScore < this.config.agentQualityThreshold) {
      this.emit('quality-alert', {
        type: 'low-quality-output',
        workflowId,
        agentType,
        qualityScore: metrics.qualityScore,
        threshold: this.config.agentQualityThreshold
      });
    }
    
    // Check cost thresholds
    if (metrics.cost && metrics.cost > this.config.workflowCostThreshold) {
      this.emit('cost-alert', {
        type: 'high-workflow-cost',
        workflowId,
        agentType,
        cost: metrics.cost,
        threshold: this.config.workflowCostThreshold
      });
    }
    
    // Check duration thresholds
    if (agentType.includes('canvas') && metrics.duration > this.config.canvasGenerationTimeThreshold) {
      this.emit('performance-alert', {
        type: 'slow-canvas-generation',
        workflowId,
        agentType,
        duration: metrics.duration,
        threshold: this.config.canvasGenerationTimeThreshold
      });
    }
  }

  /**
   * Track database performance
   */
  trackDatabasePerformance(collection, operation, duration, recordCount = 0) {
    const timestamp = Date.now();
    const dbKey = `db_${collection}_${operation}`;
    
    if (!this.performanceData.has(dbKey)) {
      this.performanceData.set(dbKey, {
        collection,
        operation,
        totalQueries: 0,
        totalDuration: 0,
        totalRecords: 0,
        recentQueries: []
      });
    }
    
    const data = this.performanceData.get(dbKey);
    data.totalQueries++;
    data.totalDuration += duration;
    data.totalRecords += recordCount;
    
    data.recentQueries.push({
      timestamp,
      duration,
      recordCount
    });
    
    // Keep only last 50 queries
    if (data.recentQueries.length > 50) {
      data.recentQueries.shift();
    }
    
    // Check database performance thresholds
    if (duration > this.config.dbQueryTimeThreshold) {
      this.emit('performance-alert', {
        type: 'slow-database-query',
        collection,
        operation,
        duration,
        threshold: this.config.dbQueryTimeThreshold
      });
    }
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(metricType, value, metadata = {}) {
    const timestamp = Date.now();
    
    if (!this.businessMetrics.has(metricType)) {
      this.businessMetrics.set(metricType, {
        type: metricType,
        values: [],
        recentValues: []
      });
    }
    
    const data = this.businessMetrics.get(metricType);
    data.values.push({ timestamp, value, metadata });
    data.recentValues.push({ timestamp, value, metadata });
    
    // Keep only last 1000 values
    if (data.values.length > 1000) {
      data.values.shift();
    }
    
    // Keep only last 100 recent values
    if (data.recentValues.length > 100) {
      data.recentValues.shift();
    }
    
    // Check business metric thresholds
    this.checkBusinessThresholds(metricType, value, metadata);
  }

  /**
   * Check business metric thresholds
   */
  checkBusinessThresholds(metricType, value, metadata) {
    switch (metricType) {
      case 'client-satisfaction':
        if (value < this.config.clientSatisfactionThreshold) {
          this.emit('business-alert', {
            type: 'low-client-satisfaction',
            value,
            threshold: this.config.clientSatisfactionThreshold,
            metadata
          });
        }
        break;
        
      case 'time-to-first-canvas':
        if (value > this.config.timeToFirstCanvasThreshold) {
          this.emit('business-alert', {
            type: 'slow-time-to-first-canvas',
            value,
            threshold: this.config.timeToFirstCanvasThreshold,
            metadata
          });
        }
        break;
        
      case 'feature-adoption':
        if (value < this.config.featureAdoptionThreshold) {
          this.emit('business-alert', {
            type: 'low-feature-adoption',
            value,
            threshold: this.config.featureAdoptionThreshold,
            metadata
          });
        }
        break;
    }
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    try {
      const systemMetrics = {
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      };
      
      // Database connection status
      systemMetrics.database = {
        connected: mongoose.connection.readyState === 1,
        collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections).length : 0
      };
      
      this.trackBusinessMetric('system-health', systemMetrics);
      
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }
  }

  /**
   * Collect business metrics
   */
  async collectBusinessMetrics() {
    try {
      // Get database models
      const Client = mongoose.model('Client');
      const Canvas = mongoose.model('Canvas');
      const Task = mongoose.model('Task');
      
      // Collect client metrics
      const clientMetrics = await Client.aggregate([
        {
          $group: {
            _id: null,
            totalClients: { $sum: 1 },
            activeClients: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            avgSatisfaction: { $avg: '$metrics.satisfactionScore' }
          }
        }
      ]);
      
      // Collect canvas metrics
      const canvasMetrics = await Canvas.aggregate([
        {
          $group: {
            _id: null,
            totalCanvases: { $sum: 1 },
            completedCanvases: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            avgQuality: { $avg: '$metadata.qualityScore' }
          }
        }
      ]);
      
      // Collect task metrics
      const taskMetrics = await Task.aggregate([
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
            }
          }
        }
      ]);
      
      // Track business metrics
      if (clientMetrics[0]) {
        this.trackBusinessMetric('total-clients', clientMetrics[0].totalClients);
        this.trackBusinessMetric('active-clients', clientMetrics[0].activeClients);
        if (clientMetrics[0].avgSatisfaction) {
          this.trackBusinessMetric('client-satisfaction', clientMetrics[0].avgSatisfaction);
        }
      }
      
      if (canvasMetrics[0]) {
        this.trackBusinessMetric('total-canvases', canvasMetrics[0].totalCanvases);
        this.trackBusinessMetric('completed-canvases', canvasMetrics[0].completedCanvases);
        if (canvasMetrics[0].avgQuality) {
          this.trackBusinessMetric('canvas-quality', canvasMetrics[0].avgQuality);
        }
        
        // Calculate completion rate
        const completionRate = canvasMetrics[0].totalCanvases > 0 ? 
          canvasMetrics[0].completedCanvases / canvasMetrics[0].totalCanvases : 0;
        this.trackBusinessMetric('canvas-completion-rate', completionRate);
      }
      
      if (taskMetrics[0]) {
        this.trackBusinessMetric('total-tasks', taskMetrics[0].totalTasks);
        this.trackBusinessMetric('completed-tasks', taskMetrics[0].completedTasks);
      }
      
    } catch (error) {
      console.error('Failed to collect business metrics:', error);
    }
  }

  /**
   * Collect performance metrics
   */
  collectPerformanceMetrics() {
    const performanceSummary = {
      timestamp: Date.now(),
      apiMetrics: {},
      workflowMetrics: {},
      databaseMetrics: {}
    };
    
    // Summarize API performance
    for (const [key, data] of this.performanceData.entries()) {
      if (key.startsWith('api_')) {
        const avgDuration = data.totalRequests > 0 ? data.totalDuration / data.totalRequests : 0;
        const errorRate = data.totalRequests > 0 ? data.errorCount / data.totalRequests : 0;
        
        performanceSummary.apiMetrics[key] = {
          avgDuration,
          errorRate,
          totalRequests: data.totalRequests
        };
      }
    }
    
    // Summarize workflow performance
    for (const [key, data] of this.metrics.entries()) {
      if (key.startsWith('workflow_')) {
        const successRate = data.totalExecutions > 0 ? data.successfulExecutions / data.totalExecutions : 0;
        const avgDuration = data.totalExecutions > 0 ? data.totalDuration / data.totalExecutions : 0;
        const avgCost = data.totalExecutions > 0 ? data.totalCost / data.totalExecutions : 0;
        const avgQuality = data.qualityScores.length > 0 ? 
          data.qualityScores.reduce((sum, score) => sum + score, 0) / data.qualityScores.length : 0;
        
        performanceSummary.workflowMetrics[key] = {
          successRate,
          avgDuration,
          avgCost,
          avgQuality,
          totalExecutions: data.totalExecutions
        };
      }
    }
    
    // Summarize database performance
    for (const [key, data] of this.performanceData.entries()) {
      if (key.startsWith('db_')) {
        const avgDuration = data.totalQueries > 0 ? data.totalDuration / data.totalQueries : 0;
        
        performanceSummary.databaseMetrics[key] = {
          avgDuration,
          totalQueries: data.totalQueries,
          totalRecords: data.totalRecords
        };
      }
    }
    
    this.trackBusinessMetric('performance-summary', performanceSummary);
  }

  /**
   * Get comprehensive dashboard data
   */
  getDashboardData() {
    const dashboard = {
      timestamp: new Date().toISOString(),
      performance: this.getPerformanceMetrics(),
      workflows: this.getWorkflowMetrics(),
      business: this.getBusinessMetrics(),
      alerts: this.getRecentAlerts(),
      system: this.getSystemHealth()
    };
    
    return dashboard;
  }

  /**
   * Get performance metrics summary
   */
  getPerformanceMetrics() {
    const metrics = {
      api: {},
      database: {},
      overall: {}
    };
    
    // API metrics
    for (const [key, data] of this.performanceData.entries()) {
      if (key.startsWith('api_')) {
        const avgDuration = data.totalRequests > 0 ? data.totalDuration / data.totalRequests : 0;
        const errorRate = data.totalRequests > 0 ? data.errorCount / data.totalRequests : 0;
        
        metrics.api[key] = {
          endpoint: data.endpoint,
          method: data.method,
          avgDuration: Math.round(avgDuration),
          errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
          totalRequests: data.totalRequests,
          status: avgDuration < this.config.apiResponseTimeThreshold ? 'healthy' : 'warning'
        };
      }
    }
    
    // Database metrics
    for (const [key, data] of this.performanceData.entries()) {
      if (key.startsWith('db_')) {
        const avgDuration = data.totalQueries > 0 ? data.totalDuration / data.totalQueries : 0;
        
        metrics.database[key] = {
          collection: data.collection,
          operation: data.operation,
          avgDuration: Math.round(avgDuration * 100) / 100,
          totalQueries: data.totalQueries,
          status: avgDuration < this.config.dbQueryTimeThreshold ? 'healthy' : 'warning'
        };
      }
    }
    
    return metrics;
  }

  /**
   * Get workflow metrics summary
   */
  getWorkflowMetrics() {
    const metrics = {};
    
    for (const [key, data] of this.metrics.entries()) {
      if (key.startsWith('workflow_')) {
        const successRate = data.totalExecutions > 0 ? data.successfulExecutions / data.totalExecutions : 0;
        const avgDuration = data.totalExecutions > 0 ? data.totalDuration / data.totalExecutions : 0;
        const avgCost = data.totalExecutions > 0 ? data.totalCost / data.totalExecutions : 0;
        const avgQuality = data.qualityScores.length > 0 ? 
          data.qualityScores.reduce((sum, score) => sum + score, 0) / data.qualityScores.length : 0;
        
        metrics[key] = {
          agentType: data.agentType,
          successRate: Math.round(successRate * 10000) / 100,
          avgDuration: Math.round(avgDuration),
          avgCost: Math.round(avgCost * 10000) / 10000,
          avgQuality: Math.round(avgQuality * 1000) / 1000,
          totalExecutions: data.totalExecutions,
          status: this.getWorkflowStatus(successRate, avgQuality, avgCost)
        };
      }
    }
    
    return metrics;
  }

  /**
   * Get workflow status based on metrics
   */
  getWorkflowStatus(successRate, avgQuality, avgCost) {
    if (successRate < 0.9 || avgQuality < this.config.agentQualityThreshold) {
      return 'critical';
    }
    if (avgCost > this.config.workflowCostThreshold) {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * Get business metrics summary
   */
  getBusinessMetrics() {
    const metrics = {};
    
    for (const [type, data] of this.businessMetrics.entries()) {
      if (data.recentValues.length > 0) {
        const latestValue = data.recentValues[data.recentValues.length - 1];
        metrics[type] = {
          currentValue: latestValue.value,
          timestamp: latestValue.timestamp,
          trend: this.calculateTrend(data.recentValues),
          status: this.getBusinessMetricStatus(type, latestValue.value)
        };
      }
    }
    
    return metrics;
  }

  /**
   * Calculate trend for business metrics
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-5); // Last 5 values
    const older = values.slice(-10, -5); // Previous 5 values
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, v) => sum + (typeof v.value === 'number' ? v.value : 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + (typeof v.value === 'number' ? v.value : 0), 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  /**
   * Get business metric status
   */
  getBusinessMetricStatus(type, value) {
    switch (type) {
      case 'client-satisfaction':
        return value >= this.config.clientSatisfactionThreshold ? 'healthy' : 'warning';
      case 'canvas-completion-rate':
        return value >= this.config.canvasCompletionThreshold ? 'healthy' : 'warning';
      case 'canvas-quality':
        return value >= this.config.agentQualityThreshold ? 'healthy' : 'warning';
      default:
        return 'healthy';
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts() {
    const recentAlerts = [];
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.timestamp > oneDayAgo) {
        recentAlerts.push(alert);
      }
    }
    
    return recentAlerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get system health status
   */
  getSystemHealth() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: Date.now()
    };
  }

  /**
   * Alert handlers
   */
  handlePerformanceAlert(alert) {
    this.createAlert('performance', alert, 'warning');
    console.warn(`🚨 Performance Alert: ${alert.type}`, alert);
  }

  handleCostAlert(alert) {
    this.createAlert('cost', alert, 'warning');
    console.warn(`💰 Cost Alert: ${alert.type}`, alert);
  }

  handleQualityAlert(alert) {
    this.createAlert('quality', alert, 'critical');
    console.error(`⚠️ Quality Alert: ${alert.type}`, alert);
  }

  handleBusinessAlert(alert) {
    this.createAlert('business', alert, 'warning');
    console.warn(`📊 Business Alert: ${alert.type}`, alert);
  }

  handleErrorAlert(alert) {
    this.createAlert('error', alert, 'critical');
    console.error(`🔥 Error Alert: ${alert.type}`, alert);
  }

  /**
   * Create alert with cooldown logic
   */
  createAlert(category, alertData, severity) {
    const alertKey = `${category}_${alertData.type}`;
    const now = Date.now();
    
    // Check cooldown
    if (this.alerts.has(alertKey)) {
      const lastAlert = this.alerts.get(alertKey);
      const cooldown = severity === 'critical' ? 
        this.config.criticalAlertCooldownMs : 
        this.config.alertCooldownMs;
      
      if (now - lastAlert.timestamp < cooldown) {
        return; // Skip alert due to cooldown
      }
    }
    
    const alert = {
      id: alertKey,
      category,
      severity,
      timestamp: now,
      ...alertData
    };
    
    this.alerts.set(alertKey, alert);
    
    // Emit alert for external handlers
    this.emit('alert-created', alert);
  }

  /**
   * Health check for monitoring service
   */
  healthCheck() {
    return {
      status: 'healthy',
      metricsCollected: this.metrics.size,
      performanceDataPoints: this.performanceData.size,
      businessMetrics: this.businessMetrics.size,
      recentAlerts: this.getRecentAlerts().length,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}
