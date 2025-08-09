/**
 * Security Service
 * 
 * Implements Epic 4.3 Story 4.3.2: Security & Compliance
 * - API rate limiting and authentication
 * - JWT-based authentication with role-based access control
 * - API key management and validation
 * - Security event logging and monitoring
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { EventEmitter } from 'events';
import crypto from 'crypto';

export default class SecurityService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // JWT Configuration
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET || this.generateSecureSecret(),
      jwtExpiresIn: config.jwtExpiresIn || '24h',
      jwtIssuer: config.jwtIssuer || 'strategyzer-ai',
      
      // Rate Limiting Configuration
      rateLimiting: {
        windowMs: config.rateLimiting?.windowMs || 15 * 60 * 1000, // 15 minutes
        maxRequests: config.rateLimiting?.maxRequests || 100, // 100 requests per window
        skipSuccessfulRequests: config.rateLimiting?.skipSuccessfulRequests || false,
        skipFailedRequests: config.rateLimiting?.skipFailedRequests || false,
        standardHeaders: config.rateLimiting?.standardHeaders !== false,
        legacyHeaders: config.rateLimiting?.legacyHeaders !== false
      },
      
      // API Key Configuration
      apiKeyLength: config.apiKeyLength || 32,
      apiKeyPrefix: config.apiKeyPrefix || 'sk_',
      
      // Security Configuration
      bcryptRounds: config.bcryptRounds || 12,
      maxLoginAttempts: config.maxLoginAttempts || 5,
      lockoutDuration: config.lockoutDuration || 30 * 60 * 1000, // 30 minutes
      
      // Session Configuration
      sessionTimeout: config.sessionTimeout || 24 * 60 * 60 * 1000, // 24 hours
      maxConcurrentSessions: config.maxConcurrentSessions || 3
    };
    
    // In-memory stores (in production, use Redis)
    this.rateLimitStore = new Map();
    this.apiKeys = new Map();
    this.activeSessions = new Map();
    this.loginAttempts = new Map();
    this.securityEvents = [];
    
    // User roles and permissions
    this.roles = {
      admin: {
        permissions: ['*'], // All permissions
        description: 'Full system access'
      },
      user: {
        permissions: [
          'read:own_data',
          'write:own_data',
          'read:canvases',
          'write:canvases',
          'read:monitoring:basic'
        ],
        description: 'Standard user access'
      },
      viewer: {
        permissions: [
          'read:own_data',
          'read:canvases',
          'read:monitoring:basic'
        ],
        description: 'Read-only access'
      },
      api: {
        permissions: [
          'read:data',
          'write:data',
          'read:monitoring',
          'write:monitoring'
        ],
        description: 'API access for integrations'
      }
    };
    
    this.initializeSecurity();
  }

  /**
   * Initialize security service
   */
  initializeSecurity() {
    console.log('🔒 Initializing Security Service...');
    
    // Set up cleanup intervals
    this.setupCleanupIntervals();
    
    // Initialize default API keys if needed
    this.initializeDefaultApiKeys();
    
    console.log('✅ Security Service initialized');
  }

  /**
   * Generate secure secret for JWT
   */
  generateSecureSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Set up cleanup intervals for expired data
   */
  setupCleanupIntervals() {
    // Clean up expired rate limit entries every 5 minutes
    setInterval(() => {
      this.cleanupRateLimitStore();
    }, 5 * 60 * 1000);
    
    // Clean up expired sessions every hour
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
    
    // Clean up old security events every day
    setInterval(() => {
      this.cleanupSecurityEvents();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Initialize default API keys for development
   */
  initializeDefaultApiKeys() {
    if (process.env.NODE_ENV === 'development') {
      const defaultApiKey = this.generateApiKey('admin', 'Development Admin Key');
      console.log(`🔑 Development API Key: ${defaultApiKey}`);
    }
  }

  /**
   * Create rate limiting middleware
   */
  createRateLimiter(options = {}) {
    const config = {
      ...this.config.rateLimiting,
      ...options
    };
    
    return rateLimit({
      windowMs: config.windowMs,
      max: config.maxRequests,
      skipSuccessfulRequests: config.skipSuccessfulRequests,
      skipFailedRequests: config.skipFailedRequests,
      standardHeaders: config.standardHeaders,
      legacyHeaders: config.legacyHeaders,
      handler: (req, res) => {
        this.logSecurityEvent('rate_limit_exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        });
        
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.round(config.windowMs / 1000)
        });
      },
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health';
      }
    });
  }

  /**
   * Generate JWT token
   */
  generateToken(payload, options = {}) {
    const tokenPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID() // JWT ID for token tracking
    };
    
    const tokenOptions = {
      expiresIn: options.expiresIn || this.config.jwtExpiresIn,
      issuer: this.config.jwtIssuer,
      ...options
    };
    
    const token = jwt.sign(tokenPayload, this.config.jwtSecret, tokenOptions);
    
    // Track active session
    if (payload.userId) {
      this.trackSession(payload.userId, tokenPayload.jti, token);
    }
    
    this.logSecurityEvent('token_generated', {
      userId: payload.userId,
      role: payload.role,
      jti: tokenPayload.jti
    });
    
    return token;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        issuer: this.config.jwtIssuer
      });
      
      // Check if session is still active
      if (decoded.userId && decoded.jti) {
        const session = this.getSession(decoded.userId, decoded.jti);
        if (!session) {
          throw new Error('Session not found or expired');
        }
      }
      
      return {
        valid: true,
        payload: decoded
      };
    } catch (error) {
      this.logSecurityEvent('token_verification_failed', {
        error: error.message,
        token: token.substring(0, 20) + '...'
      });
      
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Generate API key
   */
  generateApiKey(role = 'api', description = '') {
    const keyId = crypto.randomUUID();
    const keySecret = crypto.randomBytes(this.config.apiKeyLength).toString('hex');
    const apiKey = `${this.config.apiKeyPrefix}${keySecret}`;
    
    const keyData = {
      id: keyId,
      key: apiKey,
      hashedKey: this.hashApiKey(apiKey),
      role,
      description,
      createdAt: new Date(),
      lastUsed: null,
      usageCount: 0,
      active: true
    };
    
    this.apiKeys.set(keyId, keyData);
    
    this.logSecurityEvent('api_key_generated', {
      keyId,
      role,
      description
    });
    
    return apiKey;
  }

  /**
   * Hash API key for secure storage
   */
  hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Validate API key
   */
  validateApiKey(apiKey) {
    if (!apiKey || !apiKey.startsWith(this.config.apiKeyPrefix)) {
      return { valid: false, error: 'Invalid API key format' };
    }
    
    const hashedKey = this.hashApiKey(apiKey);
    
    for (const [keyId, keyData] of this.apiKeys.entries()) {
      if (keyData.hashedKey === hashedKey && keyData.active) {
        // Update usage statistics
        keyData.lastUsed = new Date();
        keyData.usageCount++;
        
        this.logSecurityEvent('api_key_used', {
          keyId,
          role: keyData.role
        });
        
        return {
          valid: true,
          keyId,
          role: keyData.role,
          permissions: this.roles[keyData.role]?.permissions || []
        };
      }
    }
    
    this.logSecurityEvent('api_key_validation_failed', {
      apiKey: apiKey.substring(0, 10) + '...'
    });
    
    return { valid: false, error: 'Invalid or inactive API key' };
  }

  /**
   * Revoke API key
   */
  revokeApiKey(keyId) {
    const keyData = this.apiKeys.get(keyId);
    if (keyData) {
      keyData.active = false;
      keyData.revokedAt = new Date();
      
      this.logSecurityEvent('api_key_revoked', {
        keyId,
        role: keyData.role
      });
      
      return true;
    }
    return false;
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, this.config.bcryptRounds);
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Check user permissions
   */
  hasPermission(userRole, requiredPermission) {
    const role = this.roles[userRole];
    if (!role) return false;
    
    // Admin has all permissions
    if (role.permissions.includes('*')) return true;
    
    // Check specific permission
    return role.permissions.includes(requiredPermission);
  }

  /**
   * Track user session
   */
  trackSession(userId, jti, token) {
    if (!this.activeSessions.has(userId)) {
      this.activeSessions.set(userId, new Map());
    }
    
    const userSessions = this.activeSessions.get(userId);
    
    // Limit concurrent sessions
    if (userSessions.size >= this.config.maxConcurrentSessions) {
      // Remove oldest session
      const oldestSession = Array.from(userSessions.entries())[0];
      userSessions.delete(oldestSession[0]);
      
      this.logSecurityEvent('session_limit_exceeded', {
        userId,
        removedSession: oldestSession[0]
      });
    }
    
    userSessions.set(jti, {
      token,
      createdAt: new Date(),
      lastActivity: new Date(),
      userAgent: null, // Will be set by middleware
      ipAddress: null  // Will be set by middleware
    });
  }

  /**
   * Get user session
   */
  getSession(userId, jti) {
    const userSessions = this.activeSessions.get(userId);
    if (!userSessions) return null;
    
    const session = userSessions.get(jti);
    if (!session) return null;
    
    // Check if session is expired
    const now = new Date();
    const sessionAge = now - session.createdAt;
    
    if (sessionAge > this.config.sessionTimeout) {
      userSessions.delete(jti);
      this.logSecurityEvent('session_expired', { userId, jti });
      return null;
    }
    
    // Update last activity
    session.lastActivity = now;
    
    return session;
  }

  /**
   * Revoke user session
   */
  revokeSession(userId, jti) {
    const userSessions = this.activeSessions.get(userId);
    if (userSessions && userSessions.has(jti)) {
      userSessions.delete(jti);
      
      this.logSecurityEvent('session_revoked', { userId, jti });
      return true;
    }
    return false;
  }

  /**
   * Revoke all user sessions
   */
  revokeAllUserSessions(userId) {
    const userSessions = this.activeSessions.get(userId);
    if (userSessions) {
      const sessionCount = userSessions.size;
      userSessions.clear();
      
      this.logSecurityEvent('all_sessions_revoked', { userId, sessionCount });
      return sessionCount;
    }
    return 0;
  }

  /**
   * Track login attempts
   */
  trackLoginAttempt(identifier, success, metadata = {}) {
    if (!this.loginAttempts.has(identifier)) {
      this.loginAttempts.set(identifier, {
        attempts: 0,
        lastAttempt: null,
        lockedUntil: null
      });
    }
    
    const attempts = this.loginAttempts.get(identifier);
    attempts.lastAttempt = new Date();
    
    if (success) {
      // Reset attempts on successful login
      attempts.attempts = 0;
      attempts.lockedUntil = null;
      
      this.logSecurityEvent('login_success', {
        identifier,
        ...metadata
      });
    } else {
      attempts.attempts++;
      
      // Lock account if max attempts reached
      if (attempts.attempts >= this.config.maxLoginAttempts) {
        attempts.lockedUntil = new Date(Date.now() + this.config.lockoutDuration);
        
        this.logSecurityEvent('account_locked', {
          identifier,
          attempts: attempts.attempts,
          lockedUntil: attempts.lockedUntil
        });
      } else {
        this.logSecurityEvent('login_failed', {
          identifier,
          attempts: attempts.attempts,
          ...metadata
        });
      }
    }
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(identifier) {
    const attempts = this.loginAttempts.get(identifier);
    if (!attempts || !attempts.lockedUntil) return false;
    
    if (new Date() > attempts.lockedUntil) {
      // Lock expired, reset attempts
      attempts.attempts = 0;
      attempts.lockedUntil = null;
      return false;
    }
    
    return true;
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, data = {}) {
    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date(),
      data,
      severity: this.getEventSeverity(eventType)
    };
    
    this.securityEvents.push(event);
    
    // Emit event for monitoring integration
    this.emit('security-event', event);
    
    // Log critical events immediately
    if (event.severity === 'critical') {
      console.error('🚨 Critical Security Event:', event);
    } else if (event.severity === 'warning') {
      console.warn('⚠️ Security Warning:', event);
    }
  }

  /**
   * Get event severity level
   */
  getEventSeverity(eventType) {
    const criticalEvents = [
      'account_locked',
      'multiple_failed_logins',
      'suspicious_activity',
      'unauthorized_access_attempt'
    ];
    
    const warningEvents = [
      'rate_limit_exceeded',
      'token_verification_failed',
      'api_key_validation_failed',
      'login_failed',
      'session_limit_exceeded'
    ];
    
    if (criticalEvents.includes(eventType)) return 'critical';
    if (warningEvents.includes(eventType)) return 'warning';
    return 'info';
  }

  /**
   * Get security events
   */
  getSecurityEvents(filters = {}) {
    let events = [...this.securityEvents];
    
    // Apply filters
    if (filters.type) {
      events = events.filter(event => event.type === filters.type);
    }
    
    if (filters.severity) {
      events = events.filter(event => event.severity === filters.severity);
    }
    
    if (filters.since) {
      const since = new Date(filters.since);
      events = events.filter(event => event.timestamp >= since);
    }
    
    if (filters.limit) {
      events = events.slice(-filters.limit);
    }
    
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Cleanup expired rate limit entries
   */
  cleanupRateLimitStore() {
    const now = Date.now();
    for (const [key, data] of this.rateLimitStore.entries()) {
      if (now - data.resetTime > this.config.rateLimiting.windowMs) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    let cleanedSessions = 0;
    
    for (const [userId, userSessions] of this.activeSessions.entries()) {
      for (const [jti, session] of userSessions.entries()) {
        const sessionAge = now - session.createdAt;
        if (sessionAge > this.config.sessionTimeout) {
          userSessions.delete(jti);
          cleanedSessions++;
        }
      }
      
      // Remove user entry if no sessions
      if (userSessions.size === 0) {
        this.activeSessions.delete(userId);
      }
    }
    
    if (cleanedSessions > 0) {
      this.logSecurityEvent('sessions_cleaned', { count: cleanedSessions });
    }
  }

  /**
   * Cleanup old security events
   */
  cleanupSecurityEvents() {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const cutoff = new Date(Date.now() - maxAge);
    
    const originalCount = this.securityEvents.length;
    this.securityEvents = this.securityEvents.filter(event => event.timestamp >= cutoff);
    
    const cleanedCount = originalCount - this.securityEvents.length;
    if (cleanedCount > 0) {
      this.logSecurityEvent('security_events_cleaned', { count: cleanedCount });
    }
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const now = new Date();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    const recentEvents = this.securityEvents.filter(event => event.timestamp >= last24Hours);
    const weeklyEvents = this.securityEvents.filter(event => event.timestamp >= last7Days);
    
    return {
      totalApiKeys: this.apiKeys.size,
      activeApiKeys: Array.from(this.apiKeys.values()).filter(key => key.active).length,
      activeSessions: Array.from(this.activeSessions.values()).reduce((total, sessions) => total + sessions.size, 0),
      totalUsers: this.activeSessions.size,
      securityEvents: {
        total: this.securityEvents.length,
        last24Hours: recentEvents.length,
        last7Days: weeklyEvents.length,
        critical: recentEvents.filter(event => event.severity === 'critical').length,
        warnings: recentEvents.filter(event => event.severity === 'warning').length
      },
      loginAttempts: {
        total: this.loginAttempts.size,
        locked: Array.from(this.loginAttempts.values()).filter(attempt => 
          attempt.lockedUntil && new Date() < attempt.lockedUntil
        ).length
      }
    };
  }

  /**
   * Health check for security service
   */
  healthCheck() {
    const stats = this.getSecurityStats();
    const recentCriticalEvents = this.getSecurityEvents({
      severity: 'critical',
      since: new Date(Date.now() - 60 * 60 * 1000) // Last hour
    });
    
    return {
      status: recentCriticalEvents.length === 0 ? 'healthy' : 'warning',
      stats,
      recentCriticalEvents: recentCriticalEvents.length,
      timestamp: new Date().toISOString()
    };
  }
}
