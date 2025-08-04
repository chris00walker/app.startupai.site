/**
 * PII Handling Service
 * 
 * Implements Epic 4.3 Story 4.3.2: Security & Compliance
 * - PII detection and classification
 * - Data anonymization and pseudonymization
 * - GDPR/CCPA compliance features
 * - Right to be forgotten implementation
 * - Data retention and consent management
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export default class PIIHandlingService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // PII Detection Configuration
      piiPatterns: {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
        ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        postalCode: /\b\d{5}(-\d{4})?\b/g,
        bankAccount: /\b\d{8,17}\b/g
      },
      
      // Data Classification
      sensitivityLevels: {
        public: 0,
        internal: 1,
        confidential: 2,
        restricted: 3,
        secret: 4
      },
      
      // Compliance Configuration
      gdprEnabled: config.gdprEnabled !== false,
      ccpaEnabled: config.ccpaEnabled !== false,
      dataRetentionDays: config.dataRetentionDays || 2555, // 7 years default
      consentExpiryDays: config.consentExpiryDays || 365,   // 1 year default
      
      // Anonymization Configuration
      anonymizationSalt: config.anonymizationSalt || process.env.ANONYMIZATION_SALT || this.generateSalt(),
      pseudonymizationKey: config.pseudonymizationKey || process.env.PSEUDONYMIZATION_KEY || this.generateKey(),
      
      // Masking Configuration
      maskingChar: config.maskingChar || '*',
      partialMaskingRatio: config.partialMaskingRatio || 0.7, // Mask 70% of characters
      
      // Processing Configuration
      autoDetectPII: config.autoDetectPII !== false,
      autoClassifyData: config.autoClassifyData !== false,
      requireExplicitConsent: config.requireExplicitConsent !== false
    };
    
    // PII tracking and management
    this.piiRegistry = new Map();
    this.consentRecords = new Map();
    this.dataProcessingActivities = [];
    this.anonymizationMappings = new Map();
    this.dataSubjects = new Map();
    
    // Statistics
    this.piiStats = {
      detectedInstances: 0,
      anonymizedRecords: 0,
      pseudonymizedRecords: 0,
      maskedFields: 0,
      consentRequests: 0,
      dataSubjectRequests: 0,
      deletionRequests: 0
    };
    
    this.initializePIIHandling();
  }

  /**
   * Initialize PII handling service
   */
  initializePIIHandling() {
    console.log('🛡️ Initializing PII Handling Service...');
    
    // Set up data retention cleanup
    this.setupDataRetentionCleanup();
    
    // Set up consent expiry monitoring
    this.setupConsentMonitoring();
    
    console.log('✅ PII Handling Service initialized');
  }

  /**
   * Generate secure salt for anonymization
   */
  generateSalt() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate secure key for pseudonymization
   */
  generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Set up automatic data retention cleanup
   */
  setupDataRetentionCleanup() {
    // Run cleanup daily
    setInterval(() => {
      this.cleanupExpiredData();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Set up consent expiry monitoring
   */
  setupConsentMonitoring() {
    // Check consent expiry daily
    setInterval(() => {
      this.checkConsentExpiry();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Detect PII in text or object
   */
  detectPII(data, context = {}) {
    const detectedPII = [];
    
    if (typeof data === 'string') {
      detectedPII.push(...this.detectPIIInText(data, context));
    } else if (typeof data === 'object' && data !== null) {
      detectedPII.push(...this.detectPIIInObject(data, context));
    }
    
    // Update statistics
    this.piiStats.detectedInstances += detectedPII.length;
    
    // Log detection event
    if (detectedPII.length > 0) {
      this.emit('pii-detected', {
        count: detectedPII.length,
        types: [...new Set(detectedPII.map(pii => pii.type))],
        context
      });
    }
    
    return detectedPII;
  }

  /**
   * Detect PII in text using regex patterns
   */
  detectPIIInText(text, context = {}) {
    const detected = [];
    
    for (const [type, pattern] of Object.entries(this.config.piiPatterns)) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          detected.push({
            type,
            value: match,
            position: text.indexOf(match),
            length: match.length,
            confidence: this.calculateConfidence(type, match),
            sensitivityLevel: this.getSensitivityLevel(type),
            context
          });
        }
      }
    }
    
    return detected;
  }

  /**
   * Detect PII in object fields
   */
  detectPIIInObject(obj, context = {}, path = '') {
    const detected = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        const textPII = this.detectPIIInText(value, { ...context, field: key, path: currentPath });
        detected.push(...textPII.map(pii => ({ ...pii, field: key, path: currentPath })));
      } else if (typeof value === 'object' && value !== null) {
        detected.push(...this.detectPIIInObject(value, context, currentPath));
      }
      
      // Check if field name suggests PII
      if (this.isFieldNamePII(key)) {
        detected.push({
          type: this.getFieldPIIType(key),
          value: value,
          field: key,
          path: currentPath,
          confidence: 0.9,
          sensitivityLevel: this.getSensitivityLevel(this.getFieldPIIType(key)),
          context: { ...context, detectionMethod: 'field-name' }
        });
      }
    }
    
    return detected;
  }

  /**
   * Check if field name suggests PII
   */
  isFieldNamePII(fieldName) {
    const piiFieldNames = [
      'email', 'mail', 'e_mail',
      'phone', 'telephone', 'mobile', 'cell',
      'ssn', 'social_security', 'social_security_number',
      'address', 'street', 'city', 'state', 'zip', 'postal',
      'name', 'first_name', 'last_name', 'full_name',
      'dob', 'date_of_birth', 'birthday',
      'credit_card', 'card_number', 'ccn',
      'bank_account', 'account_number',
      'passport', 'driver_license', 'license_number'
    ];
    
    const lowerField = fieldName.toLowerCase();
    return piiFieldNames.some(piiField => lowerField.includes(piiField));
  }

  /**
   * Get PII type from field name
   */
  getFieldPIIType(fieldName) {
    const lowerField = fieldName.toLowerCase();
    
    if (lowerField.includes('email') || lowerField.includes('mail')) return 'email';
    if (lowerField.includes('phone') || lowerField.includes('mobile')) return 'phone';
    if (lowerField.includes('ssn') || lowerField.includes('social')) return 'ssn';
    if (lowerField.includes('address') || lowerField.includes('street')) return 'address';
    if (lowerField.includes('credit') || lowerField.includes('card')) return 'creditCard';
    if (lowerField.includes('bank') || lowerField.includes('account')) return 'bankAccount';
    
    return 'personal_data';
  }

  /**
   * Calculate confidence score for PII detection
   */
  calculateConfidence(type, value) {
    // Base confidence scores by type
    const baseConfidence = {
      email: 0.95,
      phone: 0.85,
      ssn: 0.9,
      creditCard: 0.8,
      ipAddress: 0.7,
      postalCode: 0.6,
      bankAccount: 0.7
    };
    
    let confidence = baseConfidence[type] || 0.5;
    
    // Adjust based on value characteristics
    if (type === 'email' && value.includes('@')) confidence = Math.min(confidence + 0.05, 1.0);
    if (type === 'phone' && value.length >= 10) confidence = Math.min(confidence + 0.1, 1.0);
    
    return confidence;
  }

  /**
   * Get sensitivity level for PII type
   */
  getSensitivityLevel(type) {
    const sensitivityMap = {
      email: this.config.sensitivityLevels.confidential,
      phone: this.config.sensitivityLevels.confidential,
      ssn: this.config.sensitivityLevels.secret,
      creditCard: this.config.sensitivityLevels.secret,
      bankAccount: this.config.sensitivityLevels.secret,
      address: this.config.sensitivityLevels.confidential,
      ipAddress: this.config.sensitivityLevels.internal,
      postalCode: this.config.sensitivityLevels.internal,
      personal_data: this.config.sensitivityLevels.confidential
    };
    
    return sensitivityMap[type] || this.config.sensitivityLevels.internal;
  }

  /**
   * Classify data based on PII content
   */
  classifyData(data, context = {}) {
    const detectedPII = this.detectPII(data, context);
    
    if (detectedPII.length === 0) {
      return {
        classification: 'public',
        sensitivityLevel: this.config.sensitivityLevels.public,
        requiresConsent: false,
        retentionPeriod: null,
        piiTypes: []
      };
    }
    
    // Determine highest sensitivity level
    const maxSensitivity = Math.max(...detectedPII.map(pii => pii.sensitivityLevel));
    const piiTypes = [...new Set(detectedPII.map(pii => pii.type))];
    
    let classification = 'internal';
    if (maxSensitivity >= this.config.sensitivityLevels.secret) classification = 'secret';
    else if (maxSensitivity >= this.config.sensitivityLevels.restricted) classification = 'restricted';
    else if (maxSensitivity >= this.config.sensitivityLevels.confidential) classification = 'confidential';
    
    return {
      classification,
      sensitivityLevel: maxSensitivity,
      requiresConsent: this.config.requireExplicitConsent && maxSensitivity >= this.config.sensitivityLevels.confidential,
      retentionPeriod: this.config.dataRetentionDays,
      piiTypes,
      detectedPII: detectedPII.length,
      riskScore: this.calculateRiskScore(detectedPII)
    };
  }

  /**
   * Calculate risk score based on detected PII
   */
  calculateRiskScore(detectedPII) {
    if (detectedPII.length === 0) return 0;
    
    const typeWeights = {
      ssn: 10,
      creditCard: 10,
      bankAccount: 9,
      email: 5,
      phone: 5,
      address: 6,
      ipAddress: 3,
      postalCode: 2
    };
    
    let totalWeight = 0;
    
    for (const pii of detectedPII) {
      const weight = typeWeights[pii.type] || 1;
      totalWeight += weight * pii.confidence;
    }
    
    // Normalize to 0-100 scale
    const riskScore = Math.min((totalWeight / detectedPII.length) * 10, 100);
    
    return Math.round(riskScore);
  }

  /**
   * Mask PII data for display
   */
  maskPII(data, options = {}) {
    const maskingOptions = {
      maskingChar: options.maskingChar || this.config.maskingChar,
      partialMaskingRatio: options.partialMaskingRatio || this.config.partialMaskingRatio,
      preserveFormat: options.preserveFormat !== false,
      ...options
    };
    
    if (typeof data === 'string') {
      return this.maskPIIInText(data, maskingOptions);
    } else if (typeof data === 'object' && data !== null) {
      return this.maskPIIInObject(data, maskingOptions);
    }
    
    return data;
  }

  /**
   * Mask PII in text
   */
  maskPIIInText(text, options) {
    let maskedText = text;
    
    for (const [type, pattern] of Object.entries(this.config.piiPatterns)) {
      maskedText = maskedText.replace(pattern, (match) => {
        return this.maskValue(match, type, options);
      });
    }
    
    this.piiStats.maskedFields++;
    return maskedText;
  }

  /**
   * Mask PII in object
   */
  maskPIIInObject(obj, options) {
    const masked = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        masked[key] = this.maskPIIInText(value, options);
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskPIIInObject(value, options);
      } else {
        masked[key] = value;
      }
      
      // Mask field if name suggests PII
      if (this.isFieldNamePII(key) && typeof value === 'string') {
        const piiType = this.getFieldPIIType(key);
        masked[key] = this.maskValue(value, piiType, options);
      }
    }
    
    return masked;
  }

  /**
   * Mask individual value based on type
   */
  maskValue(value, type, options) {
    const { maskingChar, partialMaskingRatio } = options;
    
    if (!value || typeof value !== 'string') return value;
    
    // Type-specific masking
    switch (type) {
      case 'email':
        return this.maskEmail(value, maskingChar);
      case 'phone':
        return this.maskPhone(value, maskingChar);
      case 'creditCard':
        return this.maskCreditCard(value, maskingChar);
      case 'ssn':
        return this.maskSSN(value, maskingChar);
      default:
        return this.maskGeneric(value, maskingChar, partialMaskingRatio);
    }
  }

  /**
   * Mask email address
   */
  maskEmail(email, maskingChar) {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    
    const maskedLocal = local.length > 2 ? 
      local[0] + maskingChar.repeat(local.length - 2) + local[local.length - 1] :
      maskingChar.repeat(local.length);
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone number
   */
  maskPhone(phone, maskingChar) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return phone.replace(/\d/g, (digit, index) => {
        const digitIndex = phone.substring(0, index + 1).replace(/\D/g, '').length - 1;
        return digitIndex >= 3 && digitIndex < digits.length - 4 ? maskingChar : digit;
      });
    }
    return phone.replace(/\d/g, maskingChar);
  }

  /**
   * Mask credit card number
   */
  maskCreditCard(cardNumber, maskingChar) {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length >= 13) {
      return cardNumber.replace(/\d/g, (digit, index) => {
        const digitIndex = cardNumber.substring(0, index + 1).replace(/\D/g, '').length - 1;
        return digitIndex < digits.length - 4 ? maskingChar : digit;
      });
    }
    return cardNumber.replace(/\d/g, maskingChar);
  }

  /**
   * Mask SSN
   */
  maskSSN(ssn, maskingChar) {
    return ssn.replace(/\d/g, (digit, index) => {
      // Show only last 4 digits
      const digits = ssn.replace(/\D/g, '');
      const digitIndex = ssn.substring(0, index + 1).replace(/\D/g, '').length - 1;
      return digitIndex < digits.length - 4 ? maskingChar : digit;
    });
  }

  /**
   * Generic masking for unknown PII types
   */
  maskGeneric(value, maskingChar, partialMaskingRatio) {
    if (value.length <= 2) return maskingChar.repeat(value.length);
    
    const charsToMask = Math.floor(value.length * partialMaskingRatio);
    const startVisible = Math.floor((value.length - charsToMask) / 2);
    const endVisible = value.length - charsToMask - startVisible;
    
    return value.substring(0, startVisible) + 
           maskingChar.repeat(charsToMask) + 
           value.substring(value.length - endVisible);
  }

  /**
   * Record consent for data processing
   */
  recordConsent(dataSubjectId, purposes, metadata = {}) {
    const consentId = crypto.randomUUID();
    const consent = {
      id: consentId,
      dataSubjectId,
      purposes,
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.consentExpiryDays * 24 * 60 * 60 * 1000),
      metadata,
      active: true,
      withdrawnAt: null
    };
    
    this.consentRecords.set(consentId, consent);
    this.piiStats.consentRequests++;
    
    this.emit('consent-recorded', {
      consentId,
      dataSubjectId,
      purposes
    });
    
    return consentId;
  }

  /**
   * Check if consent is valid for purpose
   */
  hasValidConsent(dataSubjectId, purpose) {
    const now = new Date();
    
    for (const consent of this.consentRecords.values()) {
      if (consent.dataSubjectId === dataSubjectId && 
          consent.active && 
          consent.expiresAt > now &&
          consent.purposes.includes(purpose)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Handle right to be forgotten request (GDPR Article 17)
   */
  handleRightToBeForgottenRequest(dataSubjectId, reason = 'user_request') {
    this.piiStats.deletionRequests++;
    
    const deletionRecord = {
      dataSubjectId,
      requestedAt: new Date(),
      reason,
      status: 'completed',
      deletedData: []
    };
    
    // Remove from data subjects
    if (this.dataSubjects.has(dataSubjectId)) {
      deletionRecord.deletedData.push('personal_data');
      this.dataSubjects.delete(dataSubjectId);
    }
    
    // Withdraw all consents
    for (const consent of this.consentRecords.values()) {
      if (consent.dataSubjectId === dataSubjectId && consent.active) {
        consent.active = false;
        consent.withdrawnAt = new Date();
        deletionRecord.deletedData.push(`consent_${consent.id}`);
      }
    }
    
    this.emit('right-to-be-forgotten', {
      dataSubjectId,
      deletionRecord
    });
    
    return deletionRecord;
  }

  /**
   * Check consent expiry
   */
  checkConsentExpiry() {
    const now = new Date();
    let expiredCount = 0;
    
    for (const consent of this.consentRecords.values()) {
      if (consent.active && consent.expiresAt <= now) {
        consent.active = false;
        consent.expiredAt = now;
        expiredCount++;
        
        this.emit('consent-expired', {
          consentId: consent.id,
          dataSubjectId: consent.dataSubjectId
        });
      }
    }
    
    if (expiredCount > 0) {
      console.log(`⏰ Expired ${expiredCount} consent records`);
    }
  }

  /**
   * Clean up expired data
   */
  cleanupExpiredData() {
    const cutoff = new Date(Date.now() - this.config.dataRetentionDays * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    // Clean up old processing activities
    this.dataProcessingActivities = this.dataProcessingActivities.filter(activity => {
      if (activity.timestamp < cutoff) {
        cleanedCount++;
        return false;
      }
      return true;
    });
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired data records`);
      this.emit('data-cleaned', { count: cleanedCount });
    }
  }

  /**
   * Get PII handling statistics
   */
  getPIIStats() {
    return {
      ...this.piiStats,
      activeConsents: Array.from(this.consentRecords.values()).filter(c => c.active).length,
      totalConsents: this.consentRecords.size,
      dataSubjects: this.dataSubjects.size,
      processingActivities: this.dataProcessingActivities.length
    };
  }

  /**
   * Health check for PII handling service
   */
  healthCheck() {
    const stats = this.getPIIStats();
    
    return {
      status: 'healthy',
      stats,
      compliance: {
        gdpr: this.config.gdprEnabled,
        ccpa: this.config.ccpaEnabled,
        dataRetentionDays: this.config.dataRetentionDays,
        consentExpiryDays: this.config.consentExpiryDays
      },
      timestamp: new Date().toISOString()
    };
  }
}
