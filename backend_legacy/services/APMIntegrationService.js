/**
 * APM Integration Service
 * 
 * Integrates with Application Performance Monitoring tools
 * Supports multiple APM providers: Datadog, New Relic, Prometheus
 * Part of Epic 4.3 Story 4.3.1: Comprehensive Monitoring
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import http from 'http';
import https from 'https';

export default class APMIntegrationService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // APM Provider configuration
      provider: config.provider || 'prometheus', // 'datadog', 'newrelic', 'prometheus'
      
      // Datadog configuration
      datadog: {
        apiKey: config.datadog?.apiKey || process.env.DATADOG_API_KEY,
        appKey: config.datadog?.appKey || process.env.DATADOG_APP_KEY,
        site: config.datadog?.site || 'datadoghq.com',
        service: config.datadog?.service || 'strategyzer-ai',
        version: config.datadog?.version || '1.0.0',
        env: config.datadog?.env || process.env.NODE_ENV || 'development'
      },
      
      // New Relic configuration
      newrelic: {
        licenseKey: config.newrelic?.licenseKey || process.env.NEW_RELIC_LICENSE_KEY,
        appName: config.newrelic?.appName || 'Strategyzer AI Platform',
        enabled: config.newrelic?.enabled !== false
      },
      
      // Prometheus configuration
      prometheus: {
        enabled: config.prometheus?.enabled !== false,
        port: config.prometheus?.port || 9090,
        endpoint: config.prometheus?.endpoint || '/metrics',
        labels: config.prometheus?.labels || {
          service: 'strategyzer-ai',
          version: '1.0.0'
        }
      },
      
      // Metrics collection
      collectInterval: config.collectInterval || 60000, // 1 minute
      batchSize: config.batchSize || 100,
      retryAttempts: config.retryAttempts || 3
    };
    
    this.metrics = new Map();
    this.metricQueue = [];
    this.isInitialized = false;
    
    this.initializeAPM();
  }

  /**
   * Initialize APM integration
   */
  async initializeAPM() {
    console.log(`📊 Initializing APM Integration (${this.config.provider})...`);
    
    try {
      switch (this.config.provider) {
        case 'datadog':
          await this.initializeDatadog();
          break;
        case 'newrelic':
          await this.initializeNewRelic();
          break;
        case 'prometheus':
          await this.initializePrometheus();
          break;
        default:
          console.warn(`Unknown APM provider: ${this.config.provider}`);
      }
      
      this.setupMetricCollection();
      this.isInitialized = true;
      
      console.log('✅ APM Integration initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize APM:', error);
      this.emit('apm-error', { type: 'initialization', error });
    }
  }

  /**
   * Initialize Datadog APM
   */
  async initializeDatadog() {
    if (!this.config.datadog.apiKey) {
      throw new Error('Datadog API key not configured');
    }
    
    // Datadog APM initialization would go here
    // For now, we'll simulate the integration
    console.log('🐕 Datadog APM configured');
    
    this.datadogClient = {
      apiKey: this.config.datadog.apiKey,
      baseUrl: `https://api.${this.config.datadog.site}`,
      service: this.config.datadog.service
    };
  }

  /**
   * Initialize New Relic APM
   */
  async initializeNewRelic() {
    if (!this.config.newrelic.licenseKey) {
      throw new Error('New Relic license key not configured');
    }
    
    // New Relic APM initialization would go here
    // For now, we'll simulate the integration
    console.log('🔍 New Relic APM configured');
    
    this.newrelicClient = {
      licenseKey: this.config.newrelic.licenseKey,
      appName: this.config.newrelic.appName
    };
  }

  /**
   * Initialize Prometheus metrics
   */
  async initializePrometheus() {
    console.log('📈 Prometheus metrics configured');
    
    // Initialize Prometheus metrics
    this.prometheusMetrics = {
      // Counter metrics
      httpRequestsTotal: this.createCounter('http_requests_total', 'Total HTTP requests'),
      aiWorkflowsTotal: this.createCounter('ai_workflows_total', 'Total AI workflows executed'),
      errorsTotal: this.createCounter('errors_total', 'Total errors'),
      
      // Histogram metrics
      httpRequestDuration: this.createHistogram('http_request_duration_seconds', 'HTTP request duration'),
      aiWorkflowDuration: this.createHistogram('ai_workflow_duration_seconds', 'AI workflow duration'),
      databaseQueryDuration: this.createHistogram('database_query_duration_seconds', 'Database query duration'),
      
      // Gauge metrics
      activeConnections: this.createGauge('active_connections', 'Active connections'),
      memoryUsage: this.createGauge('memory_usage_bytes', 'Memory usage in bytes'),
      cpuUsage: this.createGauge('cpu_usage_percent', 'CPU usage percentage'),
      
      // Business metrics
      clientsActive: this.createGauge('clients_active', 'Number of active clients'),
      canvasesGenerated: this.createCounter('canvases_generated_total', 'Total canvases generated'),
      qualityScore: this.createGauge('quality_score', 'Average quality score'),
      costPerWorkflow: this.createGauge('cost_per_workflow_dollars', 'Cost per workflow in dollars')
    };
  }

  /**
   * Create Prometheus counter
   */
  createCounter(name, help) {
    return {
      type: 'counter',
      name,
      help,
      value: 0,
      labels: new Map()
    };
  }

  /**
   * Create Prometheus histogram
   */
  createHistogram(name, help) {
    return {
      type: 'histogram',
      name,
      help,
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30, 60],
      observations: [],
      labels: new Map()
    };
  }

  /**
   * Create Prometheus gauge
   */
  createGauge(name, help) {
    return {
      type: 'gauge',
      name,
      help,
      value: 0,
      labels: new Map()
    };
  }

  /**
   * Setup metric collection intervals
   */
  setupMetricCollection() {
    // Collect system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.collectInterval);
    
    // Process metric queue every 30 seconds
    setInterval(() => {
      this.processMetricQueue();
    }, 30000);
  }

  /**
   * Track HTTP request metrics
   */
  trackHTTPRequest(method, route, statusCode, duration, error = null) {
    const labels = {
      method: method.toUpperCase(),
      route: this.normalizeRoute(route),
      status_code: statusCode.toString(),
      status_class: Math.floor(statusCode / 100) + 'xx'
    };
    
    switch (this.config.provider) {
      case 'datadog':
        this.sendDatadogMetric('http.requests', 1, 'count', labels);
        this.sendDatadogMetric('http.request.duration', duration, 'histogram', labels);
        if (error) {
          this.sendDatadogMetric('http.errors', 1, 'count', { ...labels, error_type: error.name });
        }
        break;
        
      case 'newrelic':
        this.sendNewRelicMetric('Custom/HTTP/Requests', 1, labels);
        this.sendNewRelicMetric('Custom/HTTP/Duration', duration, labels);
        if (error) {
          this.sendNewRelicMetric('Custom/HTTP/Errors', 1, { ...labels, error_type: error.name });
        }
        break;
        
      case 'prometheus':
        this.incrementCounter('httpRequestsTotal', labels);
        this.observeHistogram('httpRequestDuration', duration / 1000, labels); // Convert to seconds
        if (error) {
          this.incrementCounter('errorsTotal', { ...labels, error_type: error.name });
        }
        break;
    }
  }

  /**
   * Track AI workflow metrics
   */
  trackAIWorkflow(agentType, duration, cost, qualityScore, success, error = null) {
    const labels = {
      agent_type: agentType,
      success: success.toString()
    };
    
    switch (this.config.provider) {
      case 'datadog':
        this.sendDatadogMetric('ai.workflows', 1, 'count', labels);
        this.sendDatadogMetric('ai.workflow.duration', duration, 'histogram', labels);
        this.sendDatadogMetric('ai.workflow.cost', cost, 'gauge', labels);
        this.sendDatadogMetric('ai.workflow.quality', qualityScore, 'gauge', labels);
        if (error) {
          this.sendDatadogMetric('ai.workflow.errors', 1, 'count', { ...labels, error_type: error.name });
        }
        break;
        
      case 'newrelic':
        this.sendNewRelicMetric('Custom/AI/Workflows', 1, labels);
        this.sendNewRelicMetric('Custom/AI/Duration', duration, labels);
        this.sendNewRelicMetric('Custom/AI/Cost', cost, labels);
        this.sendNewRelicMetric('Custom/AI/Quality', qualityScore, labels);
        if (error) {
          this.sendNewRelicMetric('Custom/AI/Errors', 1, { ...labels, error_type: error.name });
        }
        break;
        
      case 'prometheus':
        this.incrementCounter('aiWorkflowsTotal', labels);
        this.observeHistogram('aiWorkflowDuration', duration / 1000, labels);
        this.setGauge('costPerWorkflow', cost, labels);
        this.setGauge('qualityScore', qualityScore, labels);
        if (error) {
          this.incrementCounter('errorsTotal', { ...labels, error_type: error.name, category: 'ai_workflow' });
        }
        break;
    }
  }

  /**
   * Track database metrics
   */
  trackDatabaseQuery(collection, operation, duration, recordCount = 0) {
    const labels = {
      collection,
      operation
    };
    
    switch (this.config.provider) {
      case 'datadog':
        this.sendDatadogMetric('database.queries', 1, 'count', labels);
        this.sendDatadogMetric('database.query.duration', duration, 'histogram', labels);
        this.sendDatadogMetric('database.records.processed', recordCount, 'count', labels);
        break;
        
      case 'newrelic':
        this.sendNewRelicMetric('Custom/Database/Queries', 1, labels);
        this.sendNewRelicMetric('Custom/Database/Duration', duration, labels);
        this.sendNewRelicMetric('Custom/Database/Records', recordCount, labels);
        break;
        
      case 'prometheus':
        this.observeHistogram('databaseQueryDuration', duration / 1000, labels);
        break;
    }
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(metricName, value, labels = {}) {
    switch (this.config.provider) {
      case 'datadog':
        this.sendDatadogMetric(`business.${metricName}`, value, 'gauge', labels);
        break;
        
      case 'newrelic':
        this.sendNewRelicMetric(`Custom/Business/${metricName}`, value, labels);
        break;
        
      case 'prometheus':
        // Map business metrics to Prometheus metrics
        switch (metricName) {
          case 'active_clients':
            this.setGauge('clientsActive', value, labels);
            break;
          case 'canvases_generated':
            this.incrementCounter('canvasesGenerated', labels, value);
            break;
          default:
            // Create dynamic gauge for other business metrics
            this.setGauge(`business_${metricName}`, value, labels);
        }
        break;
    }
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const labels = {
      service: this.config.prometheus.labels.service,
      version: this.config.prometheus.labels.version
    };
    
    switch (this.config.provider) {
      case 'datadog':
        this.sendDatadogMetric('system.memory.rss', memUsage.rss, 'gauge', labels);
        this.sendDatadogMetric('system.memory.heap_used', memUsage.heapUsed, 'gauge', labels);
        this.sendDatadogMetric('system.memory.heap_total', memUsage.heapTotal, 'gauge', labels);
        this.sendDatadogMetric('system.uptime', process.uptime(), 'gauge', labels);
        break;
        
      case 'newrelic':
        this.sendNewRelicMetric('Custom/System/Memory/RSS', memUsage.rss, labels);
        this.sendNewRelicMetric('Custom/System/Memory/HeapUsed', memUsage.heapUsed, labels);
        this.sendNewRelicMetric('Custom/System/Memory/HeapTotal', memUsage.heapTotal, labels);
        this.sendNewRelicMetric('Custom/System/Uptime', process.uptime(), labels);
        break;
        
      case 'prometheus':
        this.setGauge('memoryUsage', memUsage.rss, { ...labels, type: 'rss' });
        this.setGauge('memoryUsage', memUsage.heapUsed, { ...labels, type: 'heap_used' });
        this.setGauge('memoryUsage', memUsage.heapTotal, { ...labels, type: 'heap_total' });
        break;
    }
  }

  /**
   * Prometheus metric operations
   */
  incrementCounter(metricName, labels = {}, value = 1) {
    if (!this.prometheusMetrics[metricName]) return;
    
    const labelKey = JSON.stringify(labels);
    const currentValue = this.prometheusMetrics[metricName].labels.get(labelKey) || 0;
    this.prometheusMetrics[metricName].labels.set(labelKey, currentValue + value);
    this.prometheusMetrics[metricName].value += value;
  }

  observeHistogram(metricName, value, labels = {}) {
    if (!this.prometheusMetrics[metricName]) return;
    
    this.prometheusMetrics[metricName].observations.push({
      value,
      labels,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 observations
    if (this.prometheusMetrics[metricName].observations.length > 1000) {
      this.prometheusMetrics[metricName].observations.shift();
    }
  }

  setGauge(metricName, value, labels = {}) {
    if (!this.prometheusMetrics[metricName]) return;
    
    const labelKey = JSON.stringify(labels);
    this.prometheusMetrics[metricName].labels.set(labelKey, value);
    this.prometheusMetrics[metricName].value = value;
  }

  /**
   * Send metric to Datadog
   */
  sendDatadogMetric(metric, value, type, tags = {}) {
    if (!this.datadogClient || this.config.provider !== 'datadog') return;
    
    const payload = {
      series: [{
        metric,
        points: [[Math.floor(Date.now() / 1000), value]],
        type,
        tags: Object.entries(tags).map(([key, val]) => `${key}:${val}`)
      }]
    };
    
    this.metricQueue.push({
      provider: 'datadog',
      payload,
      timestamp: Date.now()
    });
  }

  /**
   * Send metric to New Relic
   */
  sendNewRelicMetric(metric, value, attributes = {}) {
    if (!this.newrelicClient || this.config.provider !== 'newrelic') return;
    
    const payload = {
      metric,
      value,
      timestamp: Date.now(),
      attributes
    };
    
    this.metricQueue.push({
      provider: 'newrelic',
      payload,
      timestamp: Date.now()
    });
  }

  /**
   * Process metric queue
   */
  async processMetricQueue() {
    if (this.metricQueue.length === 0) return;
    
    const batch = this.metricQueue.splice(0, this.config.batchSize);
    
    try {
      switch (this.config.provider) {
        case 'datadog':
          await this.sendDatadogBatch(batch.filter(m => m.provider === 'datadog'));
          break;
        case 'newrelic':
          await this.sendNewRelicBatch(batch.filter(m => m.provider === 'newrelic'));
          break;
        case 'prometheus':
          // Prometheus metrics are pulled, not pushed
          break;
      }
    } catch (error) {
      console.error('Failed to send metrics batch:', error);
      this.emit('apm-error', { type: 'batch-send', error });
    }
  }

  /**
   * Send batch to Datadog
   */
  async sendDatadogBatch(batch) {
    if (batch.length === 0) return;
    
    // Simulate sending to Datadog API
    console.log(`📊 Sending ${batch.length} metrics to Datadog`);
    
    // In real implementation, this would make HTTP request to Datadog API
    // const response = await fetch(`${this.datadogClient.baseUrl}/api/v1/series`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'DD-API-KEY': this.datadogClient.apiKey
    //   },
    //   body: JSON.stringify({ series: batch.map(b => b.payload.series).flat() })
    // });
  }

  /**
   * Send batch to New Relic
   */
  async sendNewRelicBatch(batch) {
    if (batch.length === 0) return;
    
    // Simulate sending to New Relic API
    console.log(`📊 Sending ${batch.length} metrics to New Relic`);
    
    // In real implementation, this would make HTTP request to New Relic API
  }

  /**
   * Generate Prometheus metrics output
   */
  generatePrometheusMetrics() {
    let output = '';
    
    for (const [name, metric] of Object.entries(this.prometheusMetrics)) {
      // Add help and type comments
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;
      
      if (metric.type === 'counter' || metric.type === 'gauge') {
        // Output labeled metrics
        for (const [labelKey, value] of metric.labels.entries()) {
          const labels = JSON.parse(labelKey);
          const labelStr = Object.entries(labels)
            .map(([key, val]) => `${key}="${val}"`)
            .join(',');
          
          output += `${metric.name}{${labelStr}} ${value}\n`;
        }
        
        // Output metric without labels if it has a value
        if (metric.value !== 0) {
          output += `${metric.name} ${metric.value}\n`;
        }
      } else if (metric.type === 'histogram') {
        // Output histogram buckets
        const bucketCounts = new Map();
        let totalCount = 0;
        let totalSum = 0;
        
        // Calculate bucket counts
        for (const obs of metric.observations) {
          totalCount++;
          totalSum += obs.value;
          
          for (const bucket of metric.buckets) {
            if (obs.value <= bucket) {
              bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
            }
          }
        }
        
        // Output buckets
        for (const bucket of metric.buckets) {
          const count = bucketCounts.get(bucket) || 0;
          output += `${metric.name}_bucket{le="${bucket}"} ${count}\n`;
        }
        
        // Output +Inf bucket
        output += `${metric.name}_bucket{le="+Inf"} ${totalCount}\n`;
        
        // Output count and sum
        output += `${metric.name}_count ${totalCount}\n`;
        output += `${metric.name}_sum ${totalSum}\n`;
      }
      
      output += '\n';
    }
    
    return output;
  }

  /**
   * Normalize route for consistent labeling
   */
  normalizeRoute(route) {
    // Add null check for error handling
    if (!route || typeof route !== 'string') {
      console.warn('Invalid route for normalization:', route);
      return '/unknown';
    }
    
    // Replace dynamic segments with placeholders
    return route
      .replace(/\/[0-9a-fA-F]{24}/g, '/:id')  // MongoDB ObjectIds
      .replace(/\/\d+/g, '/:id')              // Numeric IDs
      .replace(/\/[^\/]+\.(jpg|png|svg|pdf)/g, '/:file') // File extensions
      .toLowerCase();
  }

  /**
   * Get APM status
   */
  getStatus() {
    return {
      provider: this.config.provider,
      initialized: this.isInitialized,
      queueSize: this.metricQueue.length,
      metricsCollected: Object.keys(this.prometheusMetrics).length,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check
   */
  healthCheck() {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      provider: this.config.provider,
      queueSize: this.metricQueue.length,
      lastCollection: Date.now(),
      timestamp: new Date().toISOString()
    };
  }
}
