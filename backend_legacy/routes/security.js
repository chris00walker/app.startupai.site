/**
 * Security API Routes
 * 
 * Implements Epic 4.3 Story 4.3.2: Security & Compliance
 * - Authentication and authorization endpoints
 * - API key management
 * - Security monitoring and audit logs
 * - PII handling and compliance endpoints
 * - Security health checks and statistics
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { 
  authenticateJWT, 
  authenticateAPIKey, 
  authorize, 
  rateLimiter,
  piiHandler,
  auditLogger,
  securityHeaders,
  sanitizeInput,
  securityService,
  piiService,
  auditService,
  encryptionService
} from '../middleware/securityMiddleware.js';

const router = express.Router();

// Apply security middleware to all routes
router.use(securityHeaders());
router.use(sanitizeInput());
router.use(auditLogger());
router.use(rateLimiter({ maxRequests: 100, windowMs: 15 * 60 * 1000 })); // 100 requests per 15 minutes

/**
 * Authentication Routes
 */

// User login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, clientId } = req.body;
    
    if (!email || !password) {
      auditService.logAuditEvent('authentication', 'warn', 'login_missing_credentials', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }, req.correlationId);
      
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }
    
    // Check if account is locked
    if (securityService.isAccountLocked(email)) {
      auditService.logAuditEvent('authentication', 'warn', 'login_account_locked', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }, req.correlationId);
      
      return res.status(423).json({
        success: false,
        error: 'Account locked',
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }
    
    // TODO: Integrate with user database
    // For now, use mock user validation
    const mockUser = {
      id: 'user_123',
      email: 'admin@strategyzer.ai',
      passwordHash: await bcrypt.hash('admin123', 12),
      role: 'admin',
      clientId: 'client_123'
    };
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, mockUser.passwordHash);
    
    if (!isValidPassword) {
      // Track failed login attempt
      securityService.trackLoginAttempt(email, false, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
    
    // Generate JWT token
    const token = securityService.generateToken({
      userId: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      clientId: mockUser.clientId
    });
    
    // Track successful login
    securityService.trackLoginAttempt(email, true, {
      userId: mockUser.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    auditService.logAuditEvent('authentication', 'info', 'login_success', {
      userId: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, req.correlationId);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          clientId: mockUser.clientId
        },
        expiresIn: '24h'
      }
    });
    
  } catch (error) {
    auditService.logAuditEvent('authentication', 'error', 'login_error', {
      error: error.message,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'Internal server error'
    });
  }
});

// Token refresh
router.post('/auth/refresh', authenticateJWT(), async (req, res) => {
  try {
    const { userId, email, role, clientId } = req.user;
    
    // Generate new token
    const newToken = securityService.generateToken({
      userId,
      email,
      role,
      clientId
    });
    
    auditService.logAuditEvent('authentication', 'info', 'token_refreshed', {
      userId,
      ip: req.ip
    }, req.correlationId);
    
    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: '24h'
      }
    });
    
  } catch (error) {
    auditService.logAuditEvent('authentication', 'error', 'token_refresh_error', {
      error: error.message,
      userId: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: 'Internal server error'
    });
  }
});

// Logout
router.post('/auth/logout', authenticateJWT(), async (req, res) => {
  try {
    const { userId, jti } = req.user;
    
    // Revoke session
    securityService.revokeSession(userId, jti);
    
    auditService.logAuditEvent('authentication', 'info', 'logout', {
      userId,
      ip: req.ip
    }, req.correlationId);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    auditService.logAuditEvent('authentication', 'error', 'logout_error', {
      error: error.message,
      userId: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'Internal server error'
    });
  }
});

/**
 * API Key Management Routes
 */

// Generate API key
router.post('/api-keys', authenticateJWT(), authorize('admin'), async (req, res) => {
  try {
    const { role = 'api', description = '' } = req.body;
    
    const apiKey = securityService.generateApiKey(role, description);
    
    auditService.logAuditEvent('security', 'info', 'api_key_generated', {
      role,
      description,
      generatedBy: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.json({
      success: true,
      data: {
        apiKey,
        role,
        description,
        createdAt: new Date().toISOString()
      },
      message: 'API key generated successfully. Store it securely - it will not be shown again.'
    });
    
  } catch (error) {
    auditService.logAuditEvent('security', 'error', 'api_key_generation_error', {
      error: error.message,
      userId: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'API key generation failed',
      message: 'Internal server error'
    });
  }
});

// Revoke API key
router.delete('/api-keys/:keyId', authenticateJWT(), authorize('admin'), async (req, res) => {
  try {
    const { keyId } = req.params;
    
    const revoked = securityService.revokeApiKey(keyId);
    
    if (!revoked) {
      return res.status(404).json({
        success: false,
        error: 'API key not found',
        message: 'The specified API key does not exist'
      });
    }
    
    auditService.logAuditEvent('security', 'info', 'api_key_revoked', {
      keyId,
      revokedBy: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
    
  } catch (error) {
    auditService.logAuditEvent('security', 'error', 'api_key_revocation_error', {
      error: error.message,
      keyId: req.params.keyId,
      userId: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'API key revocation failed',
      message: 'Internal server error'
    });
  }
});

/**
 * PII and Compliance Routes
 */

// Record consent
router.post('/compliance/consent', piiHandler(), async (req, res) => {
  try {
    const { dataSubjectId, purposes, metadata = {} } = req.body;
    
    if (!dataSubjectId || !purposes || !Array.isArray(purposes)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'dataSubjectId and purposes array are required'
      });
    }
    
    const consentId = piiService.recordConsent(dataSubjectId, purposes, {
      ...metadata,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      recordedBy: req.userId
    });
    
    auditService.logAuditEvent('compliance', 'info', 'consent_recorded', {
      consentId,
      dataSubjectId,
      purposes,
      recordedBy: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.json({
      success: true,
      data: {
        consentId,
        dataSubjectId,
        purposes,
        grantedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    auditService.logAuditEvent('compliance', 'error', 'consent_recording_error', {
      error: error.message,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'Consent recording failed',
      message: 'Internal server error'
    });
  }
});

// Data subject access request (GDPR Article 15)
router.get('/compliance/data-subject/:dataSubjectId', authenticateJWT(), authorize('admin'), async (req, res) => {
  try {
    const { dataSubjectId } = req.params;
    
    const accessResponse = piiService.handleDataSubjectAccessRequest(dataSubjectId);
    
    auditService.logAuditEvent('compliance', 'info', 'data_subject_access_request', {
      dataSubjectId,
      requestedBy: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.json({
      success: true,
      data: accessResponse
    });
    
  } catch (error) {
    auditService.logAuditEvent('compliance', 'error', 'data_subject_access_error', {
      error: error.message,
      dataSubjectId: req.params.dataSubjectId,
      userId: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'Data subject access request failed',
      message: 'Internal server error'
    });
  }
});

// Right to be forgotten (GDPR Article 17)
router.delete('/compliance/data-subject/:dataSubjectId', authenticateJWT(), authorize('admin'), async (req, res) => {
  try {
    const { dataSubjectId } = req.params;
    const { reason = 'admin_request' } = req.body;
    
    const deletionRecord = piiService.handleRightToBeForgottenRequest(dataSubjectId, reason);
    
    auditService.logAuditEvent('compliance', 'info', 'right_to_be_forgotten', {
      dataSubjectId,
      reason,
      deletedData: deletionRecord.deletedData,
      requestedBy: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.json({
      success: true,
      data: deletionRecord,
      message: 'Data deletion completed successfully'
    });
    
  } catch (error) {
    auditService.logAuditEvent('compliance', 'error', 'data_deletion_error', {
      error: error.message,
      dataSubjectId: req.params.dataSubjectId,
      userId: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'Data deletion failed',
      message: 'Internal server error'
    });
  }
});

// Detect PII in data
router.post('/compliance/detect-pii', authenticateJWT(), authorize('admin'), async (req, res) => {
  try {
    const { data, context = {} } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Data is required for PII detection'
      });
    }
    
    const detectedPII = piiService.detectPII(data, {
      ...context,
      detectedBy: req.userId,
      ip: req.ip
    });
    
    const classification = piiService.classifyData(data, context);
    
    auditService.logAuditEvent('compliance', 'info', 'pii_detection_requested', {
      piiCount: detectedPII.length,
      classification: classification.classification,
      requestedBy: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.json({
      success: true,
      data: {
        detectedPII,
        classification,
        riskScore: classification.riskScore,
        requiresConsent: classification.requiresConsent
      }
    });
    
  } catch (error) {
    auditService.logAuditEvent('compliance', 'error', 'pii_detection_error', {
      error: error.message,
      userId: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'PII detection failed',
      message: 'Internal server error'
    });
  }
});

/**
 * Audit and Monitoring Routes
 */

// Get audit logs
router.get('/audit/logs', authenticateJWT(), authorize('admin'), async (req, res) => {
  try {
    const {
      category,
      severity,
      action,
      userId,
      correlationId,
      startTime,
      endTime,
      limit = 100
    } = req.query;
    
    const criteria = {
      category,
      severity,
      action,
      userId,
      correlationId,
      startTime,
      endTime,
      limit: parseInt(limit)
    };
    
    const logs = auditService.searchLogs(criteria);
    
    auditService.logAuditEvent('system', 'info', 'audit_logs_accessed', {
      criteria,
      resultCount: logs.length,
      accessedBy: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        criteria
      }
    });
    
  } catch (error) {
    auditService.logAuditEvent('system', 'error', 'audit_logs_access_error', {
      error: error.message,
      userId: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'Audit logs access failed',
      message: 'Internal server error'
    });
  }
});

// Generate compliance report
router.post('/audit/compliance-report', authenticateJWT(), authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, regulations = [] } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'startDate and endDate are required'
      });
    }
    
    const report = auditService.generateComplianceReport(startDate, endDate, regulations);
    
    auditService.logAuditEvent('compliance', 'info', 'compliance_report_generated', {
      reportId: report.reportId,
      period: report.period,
      regulations,
      generatedBy: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    auditService.logAuditEvent('compliance', 'error', 'compliance_report_error', {
      error: error.message,
      userId: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'Compliance report generation failed',
      message: 'Internal server error'
    });
  }
});

/**
 * Security Statistics and Health Routes
 */

// Get security statistics
router.get('/stats', authenticateJWT(), authorize('admin'), async (req, res) => {
  try {
    const securityStats = securityService.getSecurityStats();
    const piiStats = piiService.getPIIStats();
    const auditStats = auditService.getAuditStats();
    const encryptionStats = encryptionService.getEncryptionStats();
    
    const stats = {
      security: securityStats,
      pii: piiStats,
      audit: auditStats,
      encryption: encryptionStats,
      timestamp: new Date().toISOString()
    };
    
    auditService.logAuditEvent('system', 'info', 'security_stats_accessed', {
      accessedBy: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    auditService.logAuditEvent('system', 'error', 'security_stats_error', {
      error: error.message,
      userId: req.userId,
      ip: req.ip
    }, req.correlationId);
    
    res.status(500).json({
      success: false,
      error: 'Security statistics access failed',
      message: 'Internal server error'
    });
  }
});

// Security health check
router.get('/health', async (req, res) => {
  try {
    const securityHealth = securityService.healthCheck();
    const piiHealth = piiService.healthCheck();
    const auditHealth = auditService.healthCheck();
    const encryptionHealth = encryptionService.healthCheck();
    
    const overallStatus = [securityHealth, piiHealth, auditHealth, encryptionHealth]
      .every(health => health.status === 'healthy') ? 'healthy' : 'warning';
    
    const health = {
      status: overallStatus,
      services: {
        security: securityHealth,
        pii: piiHealth,
        audit: auditHealth,
        encryption: encryptionHealth
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: health
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: 'Internal server error'
    });
  }
});

export default router;
