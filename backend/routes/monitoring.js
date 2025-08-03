/**
 * Monitoring Dashboard Routes
 * 
 * API endpoints for Epic 4.3 Story 4.3.1: Comprehensive Monitoring
 * Provides real-time monitoring data, metrics, and alerts
 */

import express from 'express';
import ComprehensiveMonitoringService from '../services/ComprehensiveMonitoringService.js';
import APMIntegrationService from '../services/APMIntegrationService.js';

const router = express.Router();

// Initialize monitoring services
const monitoringService = new ComprehensiveMonitoringService();
const apmService = new APMIntegrationService({
  provider: process.env.APM_PROVIDER || 'prometheus',
  prometheus: {
    enabled: true,
    port: process.env.PROMETHEUS_PORT || 9090
  }
});

/**
 * GET /api/monitoring/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', async (req, res) => {
  const startTime = performance.now();
  
  try {
    const dashboardData = monitoringService.getDashboardData();
    
    const duration = performance.now() - startTime;
    
    // Track this API call
    monitoringService.trackAPIPerformance('/api/monitoring/dashboard', 'GET', duration, 200);
    apmService.trackHTTPRequest('GET', '/api/monitoring/dashboard', 200, duration);
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      responseTime: Math.round(duration)
    });
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('Dashboard data error:', error);
    
    // Track error
    monitoringService.trackAPIPerformance('/api/monitoring/dashboard', 'GET', duration, 500, error);
    apmService.trackHTTPRequest('GET', '/api/monitoring/dashboard', 500, duration, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/monitoring/performance
 * Get performance metrics
 */
router.get('/performance', async (req, res) => {
  const startTime = performance.now();
  
  try {
    const performanceMetrics = monitoringService.getPerformanceMetrics();
    
    const duration = performance.now() - startTime;
    
    // Track this API call
    monitoringService.trackAPIPerformance('/api/monitoring/performance', 'GET', duration, 200);
    apmService.trackHTTPRequest('GET', '/api/monitoring/performance', 200, duration);
    
    res.json({
      success: true,
      data: performanceMetrics,
      timestamp: new Date().toISOString(),
      responseTime: Math.round(duration)
    });
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('Performance metrics error:', error);
    
    // Track error
    monitoringService.trackAPIPerformance('/api/monitoring/performance', 'GET', duration, 500, error);
    apmService.trackHTTPRequest('GET', '/api/monitoring/performance', 500, duration, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/monitoring/workflows
 * Get AI workflow metrics
 */
router.get('/workflows', async (req, res) => {
  const startTime = performance.now();
  
  try {
    const workflowMetrics = monitoringService.getWorkflowMetrics();
    
    const duration = performance.now() - startTime;
    
    // Track this API call
    monitoringService.trackAPIPerformance('/api/monitoring/workflows', 'GET', duration, 200);
    apmService.trackHTTPRequest('GET', '/api/monitoring/workflows', 200, duration);
    
    res.json({
      success: true,
      data: workflowMetrics,
      timestamp: new Date().toISOString(),
      responseTime: Math.round(duration)
    });
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('Workflow metrics error:', error);
    
    // Track error
    monitoringService.trackAPIPerformance('/api/monitoring/workflows', 'GET', duration, 500, error);
    apmService.trackHTTPRequest('GET', '/api/monitoring/workflows', 500, duration, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workflow metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/monitoring/business
 * Get business metrics
 */
router.get('/business', async (req, res) => {
  const startTime = performance.now();
  
  try {
    const businessMetrics = monitoringService.getBusinessMetrics();
    
    const duration = performance.now() - startTime;
    
    // Track this API call
    monitoringService.trackAPIPerformance('/api/monitoring/business', 'GET', duration, 200);
    apmService.trackHTTPRequest('GET', '/api/monitoring/business', 200, duration);
    
    res.json({
      success: true,
      data: businessMetrics,
      timestamp: new Date().toISOString(),
      responseTime: Math.round(duration)
    });
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('Business metrics error:', error);
    
    // Track error
    monitoringService.trackAPIPerformance('/api/monitoring/business', 'GET', duration, 500, error);
    apmService.trackHTTPRequest('GET', '/api/monitoring/business', 500, duration, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve business metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/monitoring/alerts
 * Get recent alerts
 */
router.get('/alerts', async (req, res) => {
  const startTime = performance.now();
  
  try {
    const { limit = 50, severity, category } = req.query;
    
    let alerts = monitoringService.getRecentAlerts();
    
    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    // Filter by category if specified
    if (category) {
      alerts = alerts.filter(alert => alert.category === category);
    }
    
    // Limit results
    alerts = alerts.slice(0, parseInt(limit));
    
    const duration = performance.now() - startTime;
    
    // Track this API call
    monitoringService.trackAPIPerformance('/api/monitoring/alerts', 'GET', duration, 200);
    apmService.trackHTTPRequest('GET', '/api/monitoring/alerts', 200, duration);
    
    res.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
        filters: { severity, category, limit }
      },
      timestamp: new Date().toISOString(),
      responseTime: Math.round(duration)
    });
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('Alerts retrieval error:', error);
    
    // Track error
    monitoringService.trackAPIPerformance('/api/monitoring/alerts', 'GET', duration, 500, error);
    apmService.trackHTTPRequest('GET', '/api/monitoring/alerts', 500, duration, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/monitoring/health
 * Get system health status
 */
router.get('/health', async (req, res) => {
  const startTime = performance.now();
  
  try {
    const systemHealth = monitoringService.getSystemHealth();
    const monitoringHealth = monitoringService.healthCheck();
    const apmHealth = apmService.healthCheck();
    
    const overallHealth = {
      status: 'healthy',
      services: {
        monitoring: monitoringHealth,
        apm: apmHealth,
        system: systemHealth
      },
      timestamp: new Date().toISOString()
    };
    
    // Determine overall status
    if (monitoringHealth.status !== 'healthy' || apmHealth.status !== 'healthy') {
      overallHealth.status = 'degraded';
    }
    
    const duration = performance.now() - startTime;
    
    // Track this API call
    monitoringService.trackAPIPerformance('/api/monitoring/health', 'GET', duration, 200);
    apmService.trackHTTPRequest('GET', '/api/monitoring/health', 200, duration);
    
    res.json({
      success: true,
      data: overallHealth,
      responseTime: Math.round(duration)
    });
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('Health check error:', error);
    
    // Track error
    monitoringService.trackAPIPerformance('/api/monitoring/health', 'GET', duration, 500, error);
    apmService.trackHTTPRequest('GET', '/api/monitoring/health', 500, duration, error);
    
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/monitoring/metrics/prometheus
 * Prometheus metrics endpoint
 */
router.get('/metrics/prometheus', async (req, res) => {
  const startTime = performance.now();
  
  try {
    const prometheusMetrics = apmService.generatePrometheusMetrics();
    
    const duration = performance.now() - startTime;
    
    // Track this API call
    monitoringService.trackAPIPerformance('/api/monitoring/metrics/prometheus', 'GET', duration, 200);
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(prometheusMetrics);
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('Prometheus metrics error:', error);
    
    // Track error
    monitoringService.trackAPIPerformance('/api/monitoring/metrics/prometheus', 'GET', duration, 500, error);
    
    res.status(500).send('# Error generating metrics\n');
  }
});

/**
 * POST /api/monitoring/track/workflow
 * Track AI workflow execution
 */
router.post('/track/workflow', async (req, res) => {
  const startTime = performance.now();
  
  try {
    const {
      workflowId,
      agentType,
      clientId,
      duration,
      cost,
      qualityScore,
      success,
      error: workflowError
    } = req.body;
    
    // Validate required fields
    if (!workflowId || !agentType) {
      return res.status(400).json({
        success: false,
        error: 'workflowId and agentType are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Track workflow metrics
    monitoringService.trackAIWorkflow(workflowId, agentType, clientId, {
      duration,
      cost,
      qualityScore,
      success: success !== false, // Default to true if not specified
      error: workflowError
    });
    
    apmService.trackAIWorkflow(agentType, duration, cost, qualityScore, success, workflowError);
    
    const responseDuration = performance.now() - startTime;
    
    // Track this API call
    monitoringService.trackAPIPerformance('/api/monitoring/track/workflow', 'POST', responseDuration, 200);
    apmService.trackHTTPRequest('POST', '/api/monitoring/track/workflow', 200, responseDuration);
    
    res.json({
      success: true,
      message: 'Workflow metrics tracked successfully',
      timestamp: new Date().toISOString(),
      responseTime: Math.round(responseDuration)
    });
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('Workflow tracking error:', error);
    
    // Track error
    monitoringService.trackAPIPerformance('/api/monitoring/track/workflow', 'POST', duration, 500, error);
    apmService.trackHTTPRequest('POST', '/api/monitoring/track/workflow', 500, duration, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to track workflow metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/monitoring/track/business
 * Track business metric
 */
router.post('/track/business', async (req, res) => {
  const startTime = performance.now();
  
  try {
    const { metricType, value, metadata = {} } = req.body;
    
    // Validate required fields
    if (!metricType || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'metricType and value are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Track business metric
    monitoringService.trackBusinessMetric(metricType, value, metadata);
    apmService.trackBusinessMetric(metricType, value, metadata);
    
    const duration = performance.now() - startTime;
    
    // Track this API call
    monitoringService.trackAPIPerformance('/api/monitoring/track/business', 'POST', duration, 200);
    apmService.trackHTTPRequest('POST', '/api/monitoring/track/business', 200, duration);
    
    res.json({
      success: true,
      message: 'Business metric tracked successfully',
      timestamp: new Date().toISOString(),
      responseTime: Math.round(duration)
    });
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('Business metric tracking error:', error);
    
    // Track error
    monitoringService.trackAPIPerformance('/api/monitoring/track/business', 'POST', duration, 500, error);
    apmService.trackHTTPRequest('POST', '/api/monitoring/track/business', 500, duration, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to track business metric',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/monitoring/reports/performance
 * Generate performance report
 */
router.get('/reports/performance', async (req, res) => {
  const startTime = performance.now();
  
  try {
    const { timeRange = '24h', format = 'json' } = req.query;
    
    const performanceMetrics = monitoringService.getPerformanceMetrics();
    const workflowMetrics = monitoringService.getWorkflowMetrics();
    
    const report = {
      timeRange,
      generatedAt: new Date().toISOString(),
      summary: {
        totalAPIRequests: Object.values(performanceMetrics.api).reduce((sum, api) => sum + api.totalRequests, 0),
        avgAPIResponseTime: Object.values(performanceMetrics.api).reduce((sum, api) => sum + api.avgDuration, 0) / Object.keys(performanceMetrics.api).length || 0,
        totalWorkflows: Object.values(workflowMetrics).reduce((sum, wf) => sum + wf.totalExecutions, 0),
        avgWorkflowSuccessRate: Object.values(workflowMetrics).reduce((sum, wf) => sum + wf.successRate, 0) / Object.keys(workflowMetrics).length || 0,
        avgQualityScore: Object.values(workflowMetrics).reduce((sum, wf) => sum + wf.avgQuality, 0) / Object.keys(workflowMetrics).length || 0
      },
      details: {
        api: performanceMetrics.api,
        database: performanceMetrics.database,
        workflows: workflowMetrics
      }
    };
    
    const duration = performance.now() - startTime;
    
    // Track this API call
    monitoringService.trackAPIPerformance('/api/monitoring/reports/performance', 'GET', duration, 200);
    apmService.trackHTTPRequest('GET', '/api/monitoring/reports/performance', 200, duration);
    
    if (format === 'csv') {
      // Generate CSV format (simplified)
      const csv = generatePerformanceCSV(report);
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', `attachment; filename="performance-report-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: report,
        responseTime: Math.round(duration)
      });
    }
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('Performance report error:', error);
    
    // Track error
    monitoringService.trackAPIPerformance('/api/monitoring/reports/performance', 'GET', duration, 500, error);
    apmService.trackHTTPRequest('GET', '/api/monitoring/reports/performance', 500, duration, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance report',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generate CSV format for performance report
 */
function generatePerformanceCSV(report) {
  let csv = 'Metric,Value,Category\n';
  
  // Summary metrics
  csv += `Total API Requests,${report.summary.totalAPIRequests},Summary\n`;
  csv += `Avg API Response Time,${Math.round(report.summary.avgAPIResponseTime)},Summary\n`;
  csv += `Total Workflows,${report.summary.totalWorkflows},Summary\n`;
  csv += `Avg Success Rate,${Math.round(report.summary.avgWorkflowSuccessRate)}%,Summary\n`;
  csv += `Avg Quality Score,${Math.round(report.summary.avgQualityScore * 100)}%,Summary\n`;
  
  // API details
  for (const [key, api] of Object.entries(report.details.api)) {
    csv += `${api.endpoint} (${api.method}),${api.avgDuration}ms,API Response Time\n`;
    csv += `${api.endpoint} (${api.method}),${api.errorRate}%,API Error Rate\n`;
  }
  
  // Workflow details
  for (const [key, workflow] of Object.entries(report.details.workflows)) {
    csv += `${workflow.agentType},${workflow.successRate}%,Workflow Success Rate\n`;
    csv += `${workflow.agentType},${workflow.avgQuality * 100}%,Workflow Quality\n`;
    csv += `${workflow.agentType},$${workflow.avgCost},Workflow Cost\n`;
  }
  
  return csv;
}

// Export monitoring services for use in other modules
export { monitoringService, apmService };

export default router;
