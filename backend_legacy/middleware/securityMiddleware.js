/**
 * Security Middleware
 * 
 * Implements Epic 4.3 Story 4.3.2: Security & Compliance
 * - JWT authentication middleware
 * - API key validation middleware
 * - Rate limiting middleware
 * - PII detection and handling middleware
 * - Audit logging middleware
 * - Security headers middleware
 */

import SecurityService from '../services/SecurityService.js';
import PIIHandlingService from '../services/PIIHandlingService.js';
import AuditLoggingService from '../services/AuditLoggingService.js';
import EncryptionService from '../services/EncryptionService.js';

// Initialize services
const securityService = new SecurityService();
const piiService = new PIIHandlingService();
const auditService = new AuditLoggingService();
const encryptionService = new EncryptionService();

/**
 * JWT Authentication Middleware
 */
export const authenticateJWT = (options = {}) => {
  return async (req, res, next) => {
    const correlationId = auditService.generateCorrelationId();
    req.correlationId = correlationId;
    
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
      
      if (!token) {
        auditService.logAuditEvent('authentication', 'warn', 'missing_token', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        }, correlationId);
        
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'No token provided'
        });
      }
      
      // Verify token
      const verification = securityService.verifyToken(token);
      
      if (!verification.valid) {
        auditService.logAuditEvent('authentication', 'warn', 'invalid_token', {
          error: verification.error,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        }, correlationId);
        
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: verification.error
        });
      }
      
      // Add user info to request
      req.user = verification.payload;
      req.userId = verification.payload.userId;
      req.userRole = verification.payload.role;
      
      // Log successful authentication
      auditService.logAuditEvent('authentication', 'info', 'token_verified', {
        userId: req.userId,
        role: req.userRole,
        ip: req.ip,
        endpoint: req.path,
        method: req.method
      }, correlationId);
      
      next();
      
    } catch (error) {
      auditService.logAuditEvent('authentication', 'error', 'auth_error', {
        error: error.message,
        ip: req.ip,
        endpoint: req.path,
        method: req.method
      }, correlationId);
      
      res.status(500).json({
        success: false,
        error: 'Authentication error',
        message: 'Internal server error'
      });
    }
  };
};

/**
 * API Key Authentication Middleware
 */
export const authenticateAPIKey = (options = {}) => {
  return async (req, res, next) => {
    const correlationId = req.correlationId || auditService.generateCorrelationId();
    req.correlationId = correlationId;
    
    try {
      // Extract API key from header
      const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
      
      if (!apiKey) {
        auditService.logAuditEvent('authentication', 'warn', 'missing_api_key', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        }, correlationId);
        
        return res.status(401).json({
          success: false,
          error: 'API key required',
          message: 'No API key provided'
        });
      }
      
      // Validate API key
      const validation = securityService.validateApiKey(apiKey);
      
      if (!validation.valid) {
        auditService.logAuditEvent('authentication', 'warn', 'invalid_api_key', {
          error: validation.error,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        }, correlationId);
        
        return res.status(401).json({
          success: false,
          error: 'Invalid API key',
          message: validation.error
        });
      }
      
      // Add API key info to request
      req.apiKey = {
        keyId: validation.keyId,
        role: validation.role,
        permissions: validation.permissions
      };
      req.userRole = validation.role;
      
      // Log successful API key authentication
      auditService.logAuditEvent('authentication', 'info', 'api_key_verified', {
        keyId: validation.keyId,
        role: validation.role,
        ip: req.ip,
        endpoint: req.path,
        method: req.method
      }, correlationId);
      
      next();
      
    } catch (error) {
      auditService.logAuditEvent('authentication', 'error', 'api_key_auth_error', {
        error: error.message,
        ip: req.ip,
        endpoint: req.path,
        method: req.method
      }, correlationId);
      
      res.status(500).json({
        success: false,
        error: 'Authentication error',
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Authorization Middleware - Check permissions
 */
export const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    const correlationId = req.correlationId || auditService.generateCorrelationId();
    req.correlationId = correlationId;
    
    try {
      const userRole = req.userRole;
      
      if (!userRole) {
        auditService.logAuditEvent('authorization', 'warn', 'missing_role', {
          requiredPermission,
          ip: req.ip,
          endpoint: req.path,
          method: req.method
        }, correlationId);
        
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User role not found'
        });
      }
      
      // Check permission
      const hasPermission = securityService.hasPermission(userRole, requiredPermission);
      
      if (!hasPermission) {
        auditService.logAuditEvent('authorization', 'warn', 'permission_denied', {
          userId: req.userId,
          role: userRole,
          requiredPermission,
          ip: req.ip,
          endpoint: req.path,
          method: req.method
        }, correlationId);
        
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `Required permission: ${requiredPermission}`
        });
      }
      
      // Log successful authorization
      auditService.logAuditEvent('authorization', 'info', 'permission_granted', {
        userId: req.userId,
        role: userRole,
        requiredPermission,
        ip: req.ip,
        endpoint: req.path,
        method: req.method
      }, correlationId);
      
      next();
      
    } catch (error) {
      auditService.logAuditEvent('authorization', 'error', 'authz_error', {
        error: error.message,
        requiredPermission,
        ip: req.ip,
        endpoint: req.path,
        method: req.method
      }, correlationId);
      
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Rate Limiting Middleware
 */
export const rateLimiter = (options = {}) => {
  const limiter = securityService.createRateLimiter(options);
  
  return (req, res, next) => {
    const correlationId = req.correlationId || auditService.generateCorrelationId();
    req.correlationId = correlationId;
    
    // Add audit logging to rate limiter
    const originalHandler = limiter.handler;
    limiter.handler = (req, res) => {
      auditService.logAuditEvent('security', 'warn', 'rate_limit_exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
        userId: req.userId
      }, correlationId);
      
      return originalHandler(req, res);
    };
    
    return limiter(req, res, next);
  };
};

/**
 * PII Detection and Handling Middleware
 */
export const piiHandler = (options = {}) => {
  return async (req, res, next) => {
    const correlationId = req.correlationId || auditService.generateCorrelationId();
    req.correlationId = correlationId;
    
    try {
      // Detect PII in request body
      if (req.body && typeof req.body === 'object') {
        const detectedPII = piiService.detectPII(req.body, {
          endpoint: req.path,
          method: req.method,
          userId: req.userId
        });
        
        if (detectedPII.length > 0) {
          // Log PII detection
          auditService.logAuditEvent('compliance', 'info', 'pii_detected', {
            piiTypes: [...new Set(detectedPII.map(pii => pii.type))],
            piiCount: detectedPII.length,
            endpoint: req.path,
            method: req.method,
            userId: req.userId
          }, correlationId);
          
          // Check consent if required
          const classification = piiService.classifyData(req.body);
          if (classification.requiresConsent && req.userId) {
            const hasConsent = piiService.hasValidConsent(req.userId, 'data_processing');
            
            if (!hasConsent) {
              auditService.logAuditEvent('compliance', 'warn', 'consent_required', {
                userId: req.userId,
                classification: classification.classification,
                endpoint: req.path,
                method: req.method
              }, correlationId);
              
              return res.status(403).json({
                success: false,
                error: 'Consent required',
                message: 'Data processing consent is required for this operation',
                classification
              });
            }
          }
          
          // Add PII info to request
          req.piiDetected = detectedPII;
          req.dataClassification = classification;
        }
      }
      
      next();
      
    } catch (error) {
      auditService.logAuditEvent('compliance', 'error', 'pii_handler_error', {
        error: error.message,
        endpoint: req.path,
        method: req.method,
        userId: req.userId
      }, correlationId);
      
      res.status(500).json({
        success: false,
        error: 'PII handling error',
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Data Encryption Middleware for responses
 */
export const encryptResponse = (options = {}) => {
  return async (req, res, next) => {
    const correlationId = req.correlationId || auditService.generateCorrelationId();
    
    // Override res.json to encrypt sensitive data
    const originalJson = res.json;
    
    res.json = function(data) {
      try {
        let processedData = data;
        
        // Encrypt PII fields if detected
        if (req.piiDetected && req.piiDetected.length > 0) {
          processedData = encryptionService.encryptPIIFields(data);
          
          auditService.logAuditEvent('security', 'info', 'response_encrypted', {
            piiFields: req.piiDetected.length,
            endpoint: req.path,
            method: req.method,
            userId: req.userId
          }, correlationId);
        }
        
        return originalJson.call(this, processedData);
        
      } catch (error) {
        auditService.logAuditEvent('security', 'error', 'encryption_error', {
          error: error.message,
          endpoint: req.path,
          method: req.method,
          userId: req.userId
        }, correlationId);
        
        // Return original data if encryption fails
        return originalJson.call(this, data);
      }
    };
    
    next();
  };
};

/**
 * Audit Logging Middleware
 */
export const auditLogger = (options = {}) => {
  return async (req, res, next) => {
    const correlationId = req.correlationId || auditService.generateCorrelationId();
    req.correlationId = correlationId;
    
    const startTime = Date.now();
    
    // Log request
    auditService.logAuditEvent('system', 'info', 'request_received', {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.userId,
      contentLength: req.get('Content-Length')
    }, correlationId);
    
    // Override res.end to log response
    const originalEnd = res.end;
    
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      
      auditService.logAuditEvent('system', 'info', 'request_completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        responseSize: res.get('Content-Length'),
        userId: req.userId
      }, correlationId);
      
      // End correlation
      auditService.endCorrelation(correlationId, {
        statusCode: res.statusCode,
        duration
      });
      
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

/**
 * Security Headers Middleware
 */
export const securityHeaders = (options = {}) => {
  return (req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    const csp = options.contentSecurityPolicy || 
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
    res.setHeader('Content-Security-Policy', csp);
    
    next();
  };
};

/**
 * Input Sanitization Middleware
 */
export const sanitizeInput = (options = {}) => {
  return (req, res, next) => {
    const correlationId = req.correlationId || auditService.generateCorrelationId();
    
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
      }
      
      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
      }
      
      next();
      
    } catch (error) {
      auditService.logAuditEvent('security', 'error', 'sanitization_error', {
        error: error.message,
        endpoint: req.path,
        method: req.method
      }, correlationId);
      
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Input sanitization failed'
      });
    }
  };
};

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeValue(key);
    sanitized[sanitizedKey] = sanitizeObject(value);
  }
  
  return sanitized;
}

/**
 * Sanitize individual value
 */
function sanitizeValue(value) {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Remove potentially dangerous characters
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Error Handling Middleware for Security
 */
export const securityErrorHandler = (error, req, res, next) => {
  const correlationId = req.correlationId || auditService.generateCorrelationId();
  
  // Log security error
  auditService.logAuditEvent('security', 'error', 'security_error', {
    error: error.message,
    stack: error.stack,
    endpoint: req.path,
    method: req.method,
    userId: req.userId,
    ip: req.ip
  }, correlationId);
  
  // Don't expose internal error details
  res.status(500).json({
    success: false,
    error: 'Security error',
    message: 'An internal security error occurred',
    correlationId
  });
};

// Export services for use in routes
export {
  securityService,
  piiService,
  auditService,
  encryptionService
};
