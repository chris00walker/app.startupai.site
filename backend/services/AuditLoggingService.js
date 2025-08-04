/**
 * Audit Logging Service
 * 
 * Implements Epic 4.3 Story 4.3.2: Security & Compliance
 * - Comprehensive audit logging for all operations
 * - Structured logging with correlation IDs
 * - Compliance audit trails for regulatory requirements
 * - Log retention and archival policies
 * - Security event tracking and analysis
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export default class AuditLoggingService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Logging Configuration
      logLevel: config.logLevel || 'info',
      logFormat: config.logFormat || 'json',
      includeStackTrace: config.includeStackTrace !== false,
      
      // Storage Configuration
      logDirectory: config.logDirectory || './logs/audit',
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 100MB
      maxFiles: config.maxFiles || 30, // 30 days
      compressionEnabled: config.compressionEnabled !== false,
      
      // Retention Configuration
      retentionDays: config.retentionDays || 2555, // 7 years for compliance
      archiveAfterDays: config.archiveAfterDays || 90,
      
      // Security Configuration
      encryptLogs: config.encryptLogs !== false,
      signLogs: config.signLogs !== false,
      logIntegrityChecks: config.logIntegrityChecks !== false,
      
      // Compliance Configuration
      gdprCompliant: config.gdprCompliant !== false,
      soxCompliant: config.soxCompliant !== false,
      hipaaCompliant: config.hipaaCompliant || false,
      
      // Performance Configuration
      bufferSize: config.bufferSize || 1000,
      flushInterval: config.flushInterval || 5000, // 5 seconds
      asyncLogging: config.asyncLogging !== false
    };
    
    // Audit log storage
    this.auditLogs = [];
    this.logBuffer = [];
    this.correlationMap = new Map();
    this.sessionMap = new Map();
    
    // Log categories and severity levels
    this.logCategories = {
      authentication: 'auth',
      authorization: 'authz',
      dataAccess: 'data',
      dataModification: 'data_mod',
      systemAccess: 'system',
      configuration: 'config',
      security: 'security',
      compliance: 'compliance',
      performance: 'perf',
      error: 'error'
    };
    
    this.severityLevels = {
      trace: 0,
      debug: 1,
      info: 2,
      warn: 3,
      error: 4,
      fatal: 5
    };
    
    // Statistics
    this.auditStats = {
      totalLogs: 0,
      logsByCategory: {},
      logsBySeverity: {},
      securityEvents: 0,
      complianceEvents: 0,
      dataAccessEvents: 0,
      authenticationEvents: 0,
      errors: 0
    };
    
    this.initializeAuditLogging();
  }

  /**
   * Initialize audit logging service
   */
  async initializeAuditLogging() {
    console.log('📋 Initializing Audit Logging Service...');
    
    try {
      // Create log directory
      await this.ensureLogDirectory();
      
      // Set up log rotation and cleanup
      this.setupLogRotation();
      
      // Set up buffer flushing
      this.setupBufferFlushing();
      
      // Initialize statistics
      this.initializeStatistics();
      
      // Log service initialization
      this.logAuditEvent('system', 'info', 'audit_service_initialized', {
        config: this.sanitizeConfig(),
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Audit Logging Service initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Audit Logging Service:', error);
      throw error;
    }
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.config.logDirectory, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw new Error(`Failed to create log directory: ${error.message}`);
      }
    }
  }

  /**
   * Set up log rotation and cleanup
   */
  setupLogRotation() {
    // Rotate logs daily
    setInterval(() => {
      this.rotateLogs();
    }, 24 * 60 * 60 * 1000);
    
    // Clean up old logs weekly
    setInterval(() => {
      this.cleanupOldLogs();
    }, 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Set up buffer flushing
   */
  setupBufferFlushing() {
    if (this.config.asyncLogging) {
      setInterval(() => {
        this.flushLogBuffer();
      }, this.config.flushInterval);
    }
  }

  /**
   * Initialize statistics tracking
   */
  initializeStatistics() {
    for (const category of Object.values(this.logCategories)) {
      this.auditStats.logsByCategory[category] = 0;
    }
    
    for (const severity of Object.keys(this.severityLevels)) {
      this.auditStats.logsBySeverity[severity] = 0;
    }
  }

  /**
   * Sanitize configuration for logging (remove sensitive data)
   */
  sanitizeConfig() {
    const sanitized = { ...this.config };
    // Remove any sensitive configuration values
    delete sanitized.encryptionKey;
    delete sanitized.signingKey;
    return sanitized;
  }

  /**
   * Generate correlation ID for request tracking
   */
  generateCorrelationId() {
    return crypto.randomUUID();
  }

  /**
   * Start correlation context for request tracking
   */
  startCorrelation(correlationId = null, metadata = {}) {
    const id = correlationId || this.generateCorrelationId();
    
    const correlation = {
      id,
      startTime: new Date(),
      metadata,
      events: [],
      active: true
    };
    
    this.correlationMap.set(id, correlation);
    
    this.logAuditEvent('system', 'debug', 'correlation_started', {
      correlationId: id,
      metadata
    });
    
    return id;
  }

  /**
   * End correlation context
   */
  endCorrelation(correlationId, result = null) {
    const correlation = this.correlationMap.get(correlationId);
    if (correlation) {
      correlation.active = false;
      correlation.endTime = new Date();
      correlation.duration = correlation.endTime - correlation.startTime;
      correlation.result = result;
      
      this.logAuditEvent('system', 'debug', 'correlation_ended', {
        correlationId,
        duration: correlation.duration,
        eventCount: correlation.events.length,
        result
      });
    }
  }

  /**
   * Log audit event
   */
  logAuditEvent(category, severity, action, data = {}, correlationId = null) {
    try {
      // Validate parameters
      if (!this.logCategories[category] && !Object.values(this.logCategories).includes(category)) {
        category = 'system';
      }
      
      if (!this.severityLevels[severity]) {
        severity = 'info';
      }
      
      // Create audit log entry
      const logEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        category: this.logCategories[category] || category,
        severity,
        action,
        data: this.sanitizeLogData(data),
        correlationId,
        sessionId: this.getCurrentSessionId(),
        userId: data.userId || null,
        clientId: data.clientId || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        source: data.source || 'audit-service',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
      };
      
      // Add to correlation if exists
      if (correlationId) {
        const correlation = this.correlationMap.get(correlationId);
        if (correlation && correlation.active) {
          correlation.events.push(logEntry);
        }
      }
      
      // Update statistics
      this.updateStatistics(logEntry);
      
      // Add to buffer or log immediately
      if (this.config.asyncLogging) {
        this.logBuffer.push(logEntry);
        
        // Flush buffer if it's full
        if (this.logBuffer.length >= this.config.bufferSize) {
          this.flushLogBuffer();
        }
      } else {
        this.writeLogEntry(logEntry);
      }
      
      // Emit event for monitoring integration
      this.emit('audit-logged', logEntry);
      
      // Check for security events that need immediate attention
      if (category === 'security' && ['warn', 'error', 'fatal'].includes(severity)) {
        this.emit('security-alert', logEntry);
      }
      
    } catch (error) {
      console.error('Failed to log audit event:', error);
      this.auditStats.errors++;
    }
  }

  /**
   * Sanitize log data to remove sensitive information
   */
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sanitized = { ...data };
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'apiKey',
      'authorization', 'cookie', 'session', 'ssn',
      'creditCard', 'bankAccount', 'privateKey'
    ];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Recursively sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeLogData(value);
      }
    }
    
    return sanitized;
  }

  /**
   * Get current session ID from context
   */
  getCurrentSessionId() {
    // This would typically come from request context
    // For now, return null - to be integrated with session management
    return null;
  }

  /**
   * Update audit statistics
   */
  updateStatistics(logEntry) {
    this.auditStats.totalLogs++;
    this.auditStats.logsByCategory[logEntry.category] = 
      (this.auditStats.logsByCategory[logEntry.category] || 0) + 1;
    this.auditStats.logsBySeverity[logEntry.severity] = 
      (this.auditStats.logsBySeverity[logEntry.severity] || 0) + 1;
    
    // Update specific event counters
    switch (logEntry.category) {
      case 'security':
        this.auditStats.securityEvents++;
        break;
      case 'compliance':
        this.auditStats.complianceEvents++;
        break;
      case 'data':
      case 'data_mod':
        this.auditStats.dataAccessEvents++;
        break;
      case 'auth':
        this.auditStats.authenticationEvents++;
        break;
    }
    
    if (['error', 'fatal'].includes(logEntry.severity)) {
      this.auditStats.errors++;
    }
  }

  /**
   * Write log entry to storage
   */
  async writeLogEntry(logEntry) {
    try {
      this.auditLogs.push(logEntry);
      
      // Write to file if configured
      if (this.config.logDirectory) {
        await this.writeToFile(logEntry);
      }
      
    } catch (error) {
      console.error('Failed to write log entry:', error);
      this.auditStats.errors++;
    }
  }

  /**
   * Write log entry to file
   */
  async writeToFile(logEntry) {
    const date = new Date().toISOString().split('T')[0];
    const filename = `audit-${date}.log`;
    const filepath = path.join(this.config.logDirectory, filename);
    
    const logLine = this.config.logFormat === 'json' ? 
      JSON.stringify(logEntry) + '\n' :
      this.formatLogLine(logEntry) + '\n';
    
    try {
      await fs.appendFile(filepath, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
      throw error;
    }
  }

  /**
   * Format log line for non-JSON output
   */
  formatLogLine(logEntry) {
    return `${logEntry.timestamp} [${logEntry.severity.toUpperCase()}] ${logEntry.category}:${logEntry.action} - ${JSON.stringify(logEntry.data)}`;
  }

  /**
   * Flush log buffer to storage
   */
  async flushLogBuffer() {
    if (this.logBuffer.length === 0) return;
    
    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      for (const logEntry of logsToFlush) {
        await this.writeLogEntry(logEntry);
      }
    } catch (error) {
      console.error('Failed to flush log buffer:', error);
      // Re-add failed logs to buffer
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  /**
   * Rotate log files
   */
  async rotateLogs() {
    try {
      const files = await fs.readdir(this.config.logDirectory);
      const logFiles = files.filter(file => file.startsWith('audit-') && file.endsWith('.log'));
      
      for (const file of logFiles) {
        const filepath = path.join(this.config.logDirectory, file);
        const stats = await fs.stat(filepath);
        
        // Rotate if file is too large
        if (stats.size > this.config.maxFileSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedName = file.replace('.log', `-${timestamp}.log`);
          const rotatedPath = path.join(this.config.logDirectory, rotatedName);
          
          await fs.rename(filepath, rotatedPath);
          
          this.logAuditEvent('system', 'info', 'log_rotated', {
            originalFile: file,
            rotatedFile: rotatedName,
            fileSize: stats.size
          });
        }
      }
      
    } catch (error) {
      console.error('Failed to rotate logs:', error);
    }
  }

  /**
   * Clean up old log files
   */
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.config.logDirectory);
      const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
      let cleanedCount = 0;
      
      for (const file of files) {
        if (file.startsWith('audit-') && file.endsWith('.log')) {
          const filepath = path.join(this.config.logDirectory, file);
          const stats = await fs.stat(filepath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filepath);
            cleanedCount++;
          }
        }
      }
      
      if (cleanedCount > 0) {
        this.logAuditEvent('system', 'info', 'logs_cleaned', {
          cleanedFiles: cleanedCount,
          retentionDays: this.config.retentionDays
        });
      }
      
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * Search audit logs
   */
  searchLogs(criteria = {}) {
    let results = [...this.auditLogs];
    
    // Apply filters
    if (criteria.category) {
      results = results.filter(log => log.category === criteria.category);
    }
    
    if (criteria.severity) {
      results = results.filter(log => log.severity === criteria.severity);
    }
    
    if (criteria.action) {
      results = results.filter(log => log.action.includes(criteria.action));
    }
    
    if (criteria.userId) {
      results = results.filter(log => log.userId === criteria.userId);
    }
    
    if (criteria.correlationId) {
      results = results.filter(log => log.correlationId === criteria.correlationId);
    }
    
    if (criteria.startTime) {
      const startTime = new Date(criteria.startTime);
      results = results.filter(log => new Date(log.timestamp) >= startTime);
    }
    
    if (criteria.endTime) {
      const endTime = new Date(criteria.endTime);
      results = results.filter(log => new Date(log.timestamp) <= endTime);
    }
    
    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply limit
    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }
    
    return results;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(startDate, endDate, regulations = []) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const relevantLogs = this.auditLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= start && logDate <= end;
    });
    
    const report = {
      reportId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      regulations,
      summary: {
        totalEvents: relevantLogs.length,
        securityEvents: relevantLogs.filter(log => log.category === 'security').length,
        dataAccessEvents: relevantLogs.filter(log => log.category === 'data' || log.category === 'data_mod').length,
        authenticationEvents: relevantLogs.filter(log => log.category === 'auth').length,
        complianceEvents: relevantLogs.filter(log => log.category === 'compliance').length,
        errors: relevantLogs.filter(log => ['error', 'fatal'].includes(log.severity)).length
      },
      eventsByCategory: {},
      eventsBySeverity: {},
      topUsers: this.getTopUsers(relevantLogs),
      securityIncidents: relevantLogs.filter(log => 
        log.category === 'security' && ['warn', 'error', 'fatal'].includes(log.severity)
      ),
      dataAccessPatterns: this.analyzeDataAccessPatterns(relevantLogs)
    };
    
    // Calculate events by category and severity
    for (const log of relevantLogs) {
      report.eventsByCategory[log.category] = (report.eventsByCategory[log.category] || 0) + 1;
      report.eventsBySeverity[log.severity] = (report.eventsBySeverity[log.severity] || 0) + 1;
    }
    
    return report;
  }

  /**
   * Get top users by activity
   */
  getTopUsers(logs) {
    const userActivity = {};
    
    for (const log of logs) {
      if (log.userId) {
        userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;
      }
    }
    
    return Object.entries(userActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, eventCount: count }));
  }

  /**
   * Analyze data access patterns
   */
  analyzeDataAccessPatterns(logs) {
    const dataLogs = logs.filter(log => log.category === 'data' || log.category === 'data_mod');
    const patterns = {
      totalAccess: dataLogs.length,
      uniqueUsers: new Set(dataLogs.map(log => log.userId).filter(Boolean)).size,
      accessByHour: {},
      mostAccessedResources: {}
    };
    
    for (const log of dataLogs) {
      // Analyze access by hour
      const hour = new Date(log.timestamp).getHours();
      patterns.accessByHour[hour] = (patterns.accessByHour[hour] || 0) + 1;
      
      // Track resource access
      if (log.data.resource) {
        patterns.mostAccessedResources[log.data.resource] = 
          (patterns.mostAccessedResources[log.data.resource] || 0) + 1;
      }
    }
    
    return patterns;
  }

  /**
   * Get audit statistics
   */
  getAuditStats() {
    return {
      ...this.auditStats,
      bufferSize: this.logBuffer.length,
      activeCorrelations: Array.from(this.correlationMap.values()).filter(c => c.active).length,
      totalCorrelations: this.correlationMap.size,
      memoryUsage: this.auditLogs.length
    };
  }

  /**
   * Health check for audit logging service
   */
  healthCheck() {
    const stats = this.getAuditStats();
    const recentErrors = this.auditLogs
      .filter(log => ['error', 'fatal'].includes(log.severity))
      .filter(log => new Date() - new Date(log.timestamp) < 60 * 60 * 1000) // Last hour
      .length;
    
    return {
      status: recentErrors < 10 ? 'healthy' : 'warning',
      stats,
      recentErrors,
      bufferHealth: this.logBuffer.length < this.config.bufferSize * 0.8 ? 'good' : 'warning',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(format = 'json', criteria = {}) {
    const logs = this.searchLogs(criteria);
    
    switch (format) {
      case 'csv':
        return this.exportToCSV(logs);
      case 'xml':
        return this.exportToXML(logs);
      default:
        return JSON.stringify(logs, null, 2);
    }
  }

  /**
   * Export logs to CSV format
   */
  exportToCSV(logs) {
    if (logs.length === 0) return '';
    
    const headers = Object.keys(logs[0]).join(',');
    const rows = logs.map(log => 
      Object.values(log).map(value => 
        typeof value === 'object' ? JSON.stringify(value) : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }

  /**
   * Export logs to XML format
   */
  exportToXML(logs) {
    const xmlLogs = logs.map(log => {
      const entries = Object.entries(log).map(([key, value]) => 
        `<${key}>${typeof value === 'object' ? JSON.stringify(value) : value}</${key}>`
      ).join('');
      return `<log>${entries}</log>`;
    }).join('');
    
    return `<?xml version="1.0" encoding="UTF-8"?><auditLogs>${xmlLogs}</auditLogs>`;
  }
}
