/**
 * Security Services Test Suite
 * 
 * Tests for Epic 4.3 Story 4.3.2: Security & Compliance
 * - SecurityService tests
 * - EncryptionService tests
 * - PIIHandlingService tests
 * - AuditLoggingService tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SecurityService from '../../../services/SecurityService.js';
import EncryptionService from '../../../services/EncryptionService.js';
import PIIHandlingService from '../../../services/PIIHandlingService.js';
import AuditLoggingService from '../../../services/AuditLoggingService.js';

describe('SecurityService', () => {
  let securityService;

  beforeEach(() => {
    securityService = new SecurityService({
      jwtSecret: 'test-secret-key-for-testing-only',
      rateLimiting: {
        windowMs: 60000,
        maxRequests: 10
      }
    });
  });

  afterEach(() => {
    securityService.removeAllListeners();
  });

  describe('JWT Token Management', () => {
    it('should generate valid JWT token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      const token = securityService.generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify valid JWT token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      const token = securityService.generateToken(payload);
      const verification = securityService.verifyToken(token);

      expect(verification.valid).toBe(true);
      expect(verification.payload.userId).toBe(payload.userId);
      expect(verification.payload.email).toBe(payload.email);
      expect(verification.payload.role).toBe(payload.role);
    });

    it('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';
      const verification = securityService.verifyToken(invalidToken);

      expect(verification.valid).toBe(false);
      expect(verification.error).toBeDefined();
    });

    it('should reject expired JWT token', () => {
      const payload = { userId: 'user123', role: 'user' };
      const token = securityService.generateToken(payload, { expiresIn: '1ms' });

      // Wait for token to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          const verification = securityService.verifyToken(token);
          expect(verification.valid).toBe(false);
          expect(verification.error).toContain('expired');
          resolve();
        }, 10);
      });
    });
  });

  describe('API Key Management', () => {
    it('should generate API key with correct format', () => {
      const apiKey = securityService.generateApiKey('api', 'Test API Key');
      
      expect(apiKey).toBeDefined();
      expect(typeof apiKey).toBe('string');
      expect(apiKey.startsWith('sk_')).toBe(true);
      expect(apiKey.length).toBeGreaterThan(10);
    });

    it('should validate correct API key', () => {
      const apiKey = securityService.generateApiKey('api', 'Test API Key');
      const validation = securityService.validateApiKey(apiKey);

      expect(validation.valid).toBe(true);
      expect(validation.role).toBe('api');
      expect(validation.keyId).toBeDefined();
    });

    it('should reject invalid API key', () => {
      const invalidKey = 'invalid-key';
      const validation = securityService.validateApiKey(invalidKey);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBeDefined();
    });

    it('should revoke API key', () => {
      const apiKey = securityService.generateApiKey('api', 'Test API Key');
      const validation = securityService.validateApiKey(apiKey);
      
      expect(validation.valid).toBe(true);
      
      const revoked = securityService.revokeApiKey(validation.keyId);
      expect(revoked).toBe(true);
      
      const revalidation = securityService.validateApiKey(apiKey);
      expect(revalidation.valid).toBe(false);
    });
  });

  describe('Password Management', () => {
    it('should hash password securely', async () => {
      const password = 'testPassword123';
      const hash = await securityService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await securityService.hashPassword(password);
      const isValid = await securityService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await securityService.hashPassword(password);
      const isValid = await securityService.verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('Permission Management', () => {
    it('should grant admin all permissions', () => {
      const hasPermission = securityService.hasPermission('admin', 'any_permission');
      expect(hasPermission).toBe(true);
    });

    it('should check user permissions correctly', () => {
      const hasReadPermission = securityService.hasPermission('user', 'read:own_data');
      const hasAdminPermission = securityService.hasPermission('user', 'admin:all');

      expect(hasReadPermission).toBe(true);
      expect(hasAdminPermission).toBe(false);
    });

    it('should deny permissions for invalid role', () => {
      const hasPermission = securityService.hasPermission('invalid_role', 'read:data');
      expect(hasPermission).toBe(false);
    });
  });

  describe('Login Attempt Tracking', () => {
    it('should track failed login attempts', () => {
      const identifier = 'test@example.com';
      
      securityService.trackLoginAttempt(identifier, false);
      securityService.trackLoginAttempt(identifier, false);
      
      expect(securityService.isAccountLocked(identifier)).toBe(false);
      
      // Exceed max attempts
      for (let i = 0; i < 5; i++) {
        securityService.trackLoginAttempt(identifier, false);
      }
      
      expect(securityService.isAccountLocked(identifier)).toBe(true);
    });

    it('should reset attempts on successful login', () => {
      const identifier = 'test@example.com';
      
      // Multiple failed attempts
      for (let i = 0; i < 3; i++) {
        securityService.trackLoginAttempt(identifier, false);
      }
      
      // Successful login should reset
      securityService.trackLoginAttempt(identifier, true);
      
      expect(securityService.isAccountLocked(identifier)).toBe(false);
    });
  });

  describe('Security Events', () => {
    it('should log security events', () => {
      const eventsBefore = securityService.getSecurityEvents().length;
      
      securityService.logSecurityEvent('test_event', { test: 'data' });
      
      const eventsAfter = securityService.getSecurityEvents();
      expect(eventsAfter.length).toBe(eventsBefore + 1);
      expect(eventsAfter[0].type).toBe('test_event');
    });

    it('should filter security events', () => {
      securityService.logSecurityEvent('login_success', { userId: 'user1' });
      securityService.logSecurityEvent('login_failed', { userId: 'user2' });
      
      const successEvents = securityService.getSecurityEvents({ type: 'login_success' });
      const failedEvents = securityService.getSecurityEvents({ type: 'login_failed' });
      
      expect(successEvents.length).toBeGreaterThan(0);
      expect(failedEvents.length).toBeGreaterThan(0);
      expect(successEvents[0].type).toBe('login_success');
      expect(failedEvents[0].type).toBe('login_failed');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', () => {
      const health = securityService.healthCheck();
      
      expect(health.status).toBeDefined();
      expect(health.stats).toBeDefined();
      expect(health.timestamp).toBeDefined();
    });
  });
});

describe('EncryptionService', () => {
  let encryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService({
      masterKey: 'test-master-key-for-testing-only-32-chars',
      keyDerivationIterations: 1000 // Reduced for testing
    });
  });

  afterEach(() => {
    encryptionService.removeAllListeners();
  });

  describe('Data Encryption', () => {
    it('should encrypt and decrypt string data', () => {
      const plaintext = 'sensitive data to encrypt';
      
      const encrypted = encryptionService.encrypt(plaintext);
      expect(encrypted).toBeDefined();
      expect(encrypted.data).toBeDefined();
      expect(encrypted.keyId).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      
      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt object data', () => {
      const plaintext = { name: 'John Doe', email: 'john@example.com' };
      
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);
      
      expect(decrypted).toEqual(plaintext);
    });

    it('should handle null and undefined values', () => {
      expect(encryptionService.encrypt(null)).toBeNull();
      expect(encryptionService.encrypt(undefined)).toBeNull();
      expect(encryptionService.decrypt(null)).toBeNull();
    });

    it('should fail decryption with wrong key', () => {
      const plaintext = 'test data';
      const encrypted = encryptionService.encrypt(plaintext);
      
      // Modify the keyId to simulate wrong key
      encrypted.keyId = 'wrong-key-id';
      
      expect(() => {
        encryptionService.decrypt(encrypted);
      }).toThrow();
    });
  });

  describe('PII Field Encryption', () => {
    it('should encrypt PII fields in object', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        publicInfo: 'This is public'
      };
      
      const encrypted = encryptionService.encryptPIIFields(data);
      
      expect(encrypted.name).toBe('John Doe'); // Not a PII field in config
      expect(encrypted.publicInfo).toBe('This is public');
      expect(encrypted.email_encrypted).toBeDefined();
      expect(encrypted.email_metadata).toBeDefined();
      expect(encrypted.email).toBeUndefined();
      expect(encrypted.phone_encrypted).toBeDefined();
    });

    it('should decrypt PII fields in object', () => {
      const data = {
        email: 'john@example.com',
        phone: '555-1234'
      };
      
      const encrypted = encryptionService.encryptPIIFields(data);
      const decrypted = encryptionService.decryptPIIFields(encrypted);
      
      expect(decrypted.email).toBe('john@example.com');
      expect(decrypted.phone).toBe('555-1234');
      expect(decrypted.email_encrypted).toBeUndefined();
      expect(decrypted.email_metadata).toBeUndefined();
    });
  });

  describe('Key Management', () => {
    it('should generate data encryption key', () => {
      const keyId = encryptionService.generateDataKey();
      
      expect(keyId).toBeDefined();
      expect(typeof keyId).toBe('string');
    });

    it('should get active data key', () => {
      const { keyId, keyData } = encryptionService.getActiveDataKey();
      
      expect(keyId).toBeDefined();
      expect(keyData).toBeDefined();
      expect(keyData.active).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', () => {
      const health = encryptionService.healthCheck();
      
      expect(health.status).toBeDefined();
      expect(health.stats).toBeDefined();
      expect(health.validation).toBeDefined();
    });
  });
});

describe('PIIHandlingService', () => {
  let piiService;

  beforeEach(() => {
    piiService = new PIIHandlingService({
      gdprEnabled: true,
      ccpaEnabled: true,
      dataRetentionDays: 30, // Reduced for testing
      consentExpiryDays: 1    // Reduced for testing
    });
  });

  afterEach(() => {
    piiService.removeAllListeners();
  });

  describe('PII Detection', () => {
    it('should detect email addresses', () => {
      const text = 'Contact us at support@example.com for help';
      const detected = piiService.detectPII(text);
      
      expect(detected.length).toBeGreaterThan(0);
      expect(detected[0].type).toBe('email');
      expect(detected[0].value).toBe('support@example.com');
    });

    it('should detect phone numbers', () => {
      const text = 'Call us at (555) 123-4567';
      const detected = piiService.detectPII(text);
      
      expect(detected.length).toBeGreaterThan(0);
      expect(detected[0].type).toBe('phone');
    });

    it('should detect PII in objects', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        address: '123 Main St'
      };
      
      const detected = piiService.detectPII(data);
      
      expect(detected.length).toBeGreaterThan(0);
      const types = detected.map(pii => pii.type);
      expect(types).toContain('email');
    });

    it('should detect PII by field names', () => {
      const data = {
        user_email: 'test@example.com',
        phone_number: '555-1234'
      };
      
      const detected = piiService.detectPII(data);
      
      expect(detected.length).toBeGreaterThan(0);
    });
  });

  describe('Data Classification', () => {
    it('should classify public data', () => {
      const data = { title: 'Public Article', content: 'Public content' };
      const classification = piiService.classifyData(data);
      
      expect(classification.classification).toBe('public');
      expect(classification.requiresConsent).toBe(false);
    });

    it('should classify confidential data', () => {
      const data = { email: 'user@example.com', name: 'John Doe' };
      const classification = piiService.classifyData(data);
      
      expect(classification.classification).toBe('confidential');
      expect(classification.piiTypes.length).toBeGreaterThan(0);
    });

    it('should calculate risk score', () => {
      const data = { 
        email: 'user@example.com',
        phone: '555-1234',
        ssn: '123-45-6789'
      };
      const classification = piiService.classifyData(data);
      
      expect(classification.riskScore).toBeGreaterThan(0);
      expect(classification.riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Data Masking', () => {
    it('should mask email addresses', () => {
      const email = 'john.doe@example.com';
      const masked = piiService.maskPII(email);
      
      expect(masked).not.toBe(email);
      expect(masked).toContain('@example.com');
      expect(masked).toContain('*');
    });

    it('should mask phone numbers', () => {
      const phone = '(555) 123-4567';
      const masked = piiService.maskPII(phone);
      
      expect(masked).not.toBe(phone);
      expect(masked).toContain('*');
    });

    it('should mask credit card numbers', () => {
      const cc = '4532 1234 5678 9012';
      const masked = piiService.maskPII(cc);
      
      expect(masked).not.toBe(cc);
      expect(masked).toContain('9012'); // Last 4 digits should be visible
      expect(masked).toContain('*');
    });

    it('should mask objects with PII', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        publicInfo: 'Public data'
      };
      
      const masked = piiService.maskPII(data);
      
      expect(masked.name).not.toBe('John Doe'); // Name field is detected as PII by field name
      expect(masked.email).not.toBe('john@example.com');
      expect(masked.email).toContain('*');
      expect(masked.publicInfo).toBe('Public data');
    });
  });

  describe('Consent Management', () => {
    it('should record consent', () => {
      const dataSubjectId = 'user123';
      const purposes = ['data_processing', 'marketing'];
      
      const consentId = piiService.recordConsent(dataSubjectId, purposes);
      
      expect(consentId).toBeDefined();
      expect(typeof consentId).toBe('string');
    });

    it('should check valid consent', () => {
      const dataSubjectId = 'user123';
      const purposes = ['data_processing', 'marketing'];
      
      piiService.recordConsent(dataSubjectId, purposes);
      
      const hasConsent = piiService.hasValidConsent(dataSubjectId, 'data_processing');
      expect(hasConsent).toBe(true);
      
      const hasInvalidConsent = piiService.hasValidConsent(dataSubjectId, 'analytics');
      expect(hasInvalidConsent).toBe(false);
    });
  });

  describe('Right to be Forgotten', () => {
    it('should handle data deletion request', () => {
      const dataSubjectId = 'user123';
      
      // Record some consent first
      piiService.recordConsent(dataSubjectId, ['data_processing']);
      
      const deletionRecord = piiService.handleRightToBeForgottenRequest(dataSubjectId);
      
      expect(deletionRecord.status).toBe('completed');
      expect(deletionRecord.dataSubjectId).toBe(dataSubjectId);
      expect(deletionRecord.deletedData.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', () => {
      const health = piiService.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.stats).toBeDefined();
      expect(health.compliance).toBeDefined();
    });
  });
});

describe('AuditLoggingService', () => {
  let auditService;

  beforeEach(async () => {
    auditService = new AuditLoggingService({
      logDirectory: './test-logs',
      retentionDays: 1, // Reduced for testing
      asyncLogging: false // Synchronous for testing
    });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    auditService.removeAllListeners();
  });

  describe('Audit Logging', () => {
    it('should log audit events', () => {
      const eventsBefore = auditService.getAuditStats().totalLogs;
      
      auditService.logAuditEvent('system', 'info', 'test_action', {
        testData: 'test value'
      });
      
      const eventsAfter = auditService.getAuditStats().totalLogs;
      expect(eventsAfter).toBe(eventsBefore + 1);
    });

    it('should generate correlation IDs', () => {
      const correlationId = auditService.generateCorrelationId();
      
      expect(correlationId).toBeDefined();
      expect(typeof correlationId).toBe('string');
      expect(correlationId.length).toBeGreaterThan(10);
    });

    it('should track correlations', () => {
      const correlationId = auditService.startCorrelation();
      
      auditService.logAuditEvent('system', 'info', 'test_action', {
        testData: 'test'
      }, correlationId);
      
      auditService.endCorrelation(correlationId, { success: true });
      
      const stats = auditService.getAuditStats();
      expect(stats.totalCorrelations).toBeGreaterThan(0);
    });

    it('should sanitize sensitive data', () => {
      auditService.logAuditEvent('system', 'info', 'test_action', {
        password: 'secret123',
        token: 'bearer-token',
        publicData: 'safe data'
      });
      
      const logs = auditService.searchLogs({ action: 'test_action' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].data.password).toBe('[REDACTED]');
      expect(logs[0].data.token).toBe('[REDACTED]');
      expect(logs[0].data.publicData).toBe('safe data');
    });
  });

  describe('Log Search', () => {
    beforeEach(() => {
      // Add test logs
      auditService.logAuditEvent('security', 'warn', 'login_failed', { userId: 'user1' });
      auditService.logAuditEvent('system', 'info', 'user_action', { userId: 'user2' });
      auditService.logAuditEvent('security', 'error', 'auth_error', { userId: 'user1' });
    });

    it('should search logs by category', () => {
      const securityLogs = auditService.searchLogs({ category: 'security' });
      
      expect(securityLogs.length).toBeGreaterThan(0);
      securityLogs.forEach(log => {
        expect(log.category).toBe('security');
      });
    });

    it('should search logs by severity', () => {
      const errorLogs = auditService.searchLogs({ severity: 'error' });
      
      expect(errorLogs.length).toBeGreaterThan(0);
      errorLogs.forEach(log => {
        expect(log.severity).toBe('error');
      });
    });

    it('should search logs by user', () => {
      const userLogs = auditService.searchLogs({ userId: 'user1' });
      
      expect(userLogs.length).toBeGreaterThan(0);
      userLogs.forEach(log => {
        expect(log.userId).toBe('user1');
      });
    });

    it('should limit search results', () => {
      const limitedLogs = auditService.searchLogs({ limit: 1 });
      
      expect(limitedLogs.length).toBe(1);
    });
  });

  describe('Compliance Reporting', () => {
    beforeEach(() => {
      // Add test logs for compliance report
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      auditService.logAuditEvent('security', 'info', 'login_success', { 
        userId: 'user1',
        timestamp: yesterday.toISOString()
      });
      auditService.logAuditEvent('data', 'info', 'data_access', { 
        userId: 'user2',
        resource: 'client_data'
      });
    });

    it('should generate compliance report', () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();
      
      const report = auditService.generateComplianceReport(startDate, endDate, ['GDPR']);
      
      expect(report.reportId).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalEvents).toBeGreaterThan(0);
      expect(report.eventsByCategory).toBeDefined();
      expect(report.eventsBySeverity).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', () => {
      const health = auditService.healthCheck();
      
      expect(health.status).toBeDefined();
      expect(health.stats).toBeDefined();
      expect(health.timestamp).toBeDefined();
    });
  });
});

describe('Security Integration Tests', () => {
  let securityService;
  let piiService;
  let auditService;
  let encryptionService;

  beforeEach(async () => {
    securityService = new SecurityService({
      jwtSecret: 'test-secret-key-for-integration-testing'
    });
    piiService = new PIIHandlingService();
    auditService = new AuditLoggingService({
      logDirectory: './test-logs-integration',
      asyncLogging: false
    });
    encryptionService = new EncryptionService({
      masterKey: 'test-master-key-for-integration-testing-32'
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    securityService.removeAllListeners();
    piiService.removeAllListeners();
    auditService.removeAllListeners();
    encryptionService.removeAllListeners();
  });

  it('should integrate PII detection with encryption', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234'
    };
    
    // Detect PII
    const detectedPII = piiService.detectPII(data);
    expect(detectedPII.length).toBeGreaterThan(0);
    
    // Encrypt PII fields
    const encrypted = encryptionService.encryptPIIFields(data);
    expect(encrypted.email_encrypted).toBeDefined();
    
    // Decrypt and verify
    const decrypted = encryptionService.decryptPIIFields(encrypted);
    expect(decrypted.email).toBe('john@example.com');
  });

  it('should integrate authentication with audit logging', () => {
    const correlationId = auditService.generateCorrelationId();
    auditService.startCorrelation(correlationId);
    
    // Generate token
    const token = securityService.generateToken({
      userId: 'user123',
      role: 'user'
    });
    
    // Log authentication event
    auditService.logAuditEvent('authentication', 'info', 'token_generated', {
      userId: 'user123'
    }, correlationId);
    
    // Verify token
    const verification = securityService.verifyToken(token);
    expect(verification.valid).toBe(true);
    
    // Log verification event
    auditService.logAuditEvent('authentication', 'info', 'token_verified', {
      userId: 'user123'
    }, correlationId);
    
    auditService.endCorrelation(correlationId);
    
    // Check audit logs
    const logs = auditService.searchLogs({ correlationId });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should handle security workflow end-to-end', () => {
    // 1. User registration with PII
    const userData = {
      email: 'newuser@example.com',
      phone: '555-9876',
      name: 'Jane Smith'
    };
    
    // 2. Detect and classify PII
    const detectedPII = piiService.detectPII(userData);
    const classification = piiService.classifyData(userData);
    
    expect(detectedPII.length).toBeGreaterThan(0);
    expect(classification.requiresConsent).toBe(true);
    
    // 3. Record consent
    const consentId = piiService.recordConsent('user456', ['data_processing', 'marketing']);
    expect(consentId).toBeDefined();
    
    // 4. Encrypt sensitive data
    const encryptedData = encryptionService.encryptPIIFields(userData);
    expect(encryptedData.email_encrypted).toBeDefined();
    
    // 5. Generate authentication token
    const token = securityService.generateToken({
      userId: 'user456',
      email: userData.email,
      role: 'user'
    });
    
    // 6. Verify authentication
    const verification = securityService.verifyToken(token);
    expect(verification.valid).toBe(true);
    
    // 7. Check audit trail
    const auditStats = auditService.getAuditStats();
    expect(auditStats.totalLogs).toBeGreaterThan(0);
  });
});
