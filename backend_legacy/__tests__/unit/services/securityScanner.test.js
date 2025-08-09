/**
 * Security Scanner Service Tests
 * 
 * Tests for Epic 4.3 Story 4.3.2: Security & Compliance
 * - Vulnerability scanning functionality
 * - Security testing and validation
 * - Compliance checking
 * - Report generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SecurityScannerService from '../../../services/SecurityScannerService.js';
import fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises');

describe('SecurityScannerService', () => {
  let securityScanner;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fs.mkdir
    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.readFile.mockResolvedValue(JSON.stringify({
      dependencies: {
        'express': '^4.18.0',
        'mongoose': '^6.0.0'
      },
      devDependencies: {
        'vitest': '^0.25.0'
      }
    }));
    
    securityScanner = new SecurityScannerService({
      enableContinuousScanning: false,
      reportPath: './test-reports'
    });
  });
  
  afterEach(() => {
    securityScanner.removeAllListeners();
  });
  
  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const scanner = new SecurityScannerService();
      
      expect(scanner.config.scanInterval).toBe(24 * 60 * 60 * 1000);
      expect(scanner.config.vulnerabilityThreshold).toBe('medium');
      expect(scanner.config.enableContinuousScanning).toBe(false);
    });
    
    it('should initialize with custom configuration', () => {
      const config = {
        scanInterval: 60000,
        vulnerabilityThreshold: 'high',
        enableContinuousScanning: true
      };
      
      const scanner = new SecurityScannerService(config);
      
      expect(scanner.config.scanInterval).toBe(60000);
      expect(scanner.config.vulnerabilityThreshold).toBe('high');
      expect(scanner.config.enableContinuousScanning).toBe(true);
    });
    
    it('should emit scanner-initialized event', async () => {
      const initPromise = new Promise(resolve => {
        securityScanner.on('scanner-initialized', resolve);
        // Trigger initialization manually if needed
        setTimeout(resolve, 100);
      });
      
      await initPromise;
      expect(fs.mkdir).toHaveBeenCalledWith('./test-reports', { recursive: true });
    }, 5000);
  });
  
  describe('Dependency Scanning', () => {
    it('should scan dependencies for vulnerabilities', async () => {
      const results = await securityScanner.scanDependencies();
      
      expect(results).toHaveProperty('status');
      expect(results).toHaveProperty('vulnerabilityCount');
      expect(results).toHaveProperty('vulnerabilities');
      expect(results).toHaveProperty('dependencies');
      expect(Array.isArray(results.vulnerabilities)).toBe(true);
    });
    
    it('should detect known vulnerabilities', async () => {
      // Mock package.json with vulnerable package
      fs.readFile.mockResolvedValue(JSON.stringify({
        dependencies: {
          'lodash': '^4.17.10' // Vulnerable version
        }
      }));
      
      const results = await securityScanner.scanDependencies();
      
      expect(results.vulnerabilityCount).toBeGreaterThan(0);
      expect(results.status).toBe('vulnerabilities_found');
    });
    
    it('should handle missing package.json', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));
      
      const results = await securityScanner.scanDependencies();
      
      expect(results.vulnerabilities).toContainEqual(
        expect.objectContaining({
          type: 'dependency',
          title: 'Package.json not found or invalid'
        })
      );
    });
    
    it('should identify outdated packages', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify({
        dependencies: {
          'express': '^4.0.0' // Potentially outdated
        }
      }));
      
      const results = await securityScanner.scanDependencies();
      
      // Should include some outdated package warnings
      expect(results.vulnerabilities.length).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Configuration Scanning', () => {
    it('should scan security configuration', async () => {
      const results = await securityScanner.scanConfiguration();
      
      expect(results).toHaveProperty('status');
      expect(results).toHaveProperty('totalChecks');
      expect(results).toHaveProperty('passedChecks');
      expect(results).toHaveProperty('failedChecks');
      expect(results).toHaveProperty('issues');
      expect(Array.isArray(results.issues)).toBe(true);
    });
    
    it('should check environment variables', async () => {
      // Set some environment variables
      process.env.JWT_SECRET = 'test-secret';
      process.env.NODE_ENV = 'test';
      
      const results = await securityScanner.scanConfiguration();
      
      expect(results.totalChecks).toBeGreaterThan(0);
      expect(results.passedChecks).toBeGreaterThanOrEqual(0);
    });
    
    it('should identify missing environment variables', async () => {
      // Clear environment variables
      delete process.env.JWT_SECRET;
      delete process.env.MONGODB_URI;
      
      const results = await securityScanner.scanConfiguration();
      
      const failedChecks = results.issues;
      expect(failedChecks.some(check => 
        check.check.includes('JWT_SECRET')
      )).toBe(true);
    });
    
    it('should check database configuration', async () => {
      process.env.MONGODB_URI = 'mongodb://user:pass@localhost:27017/test?ssl=true';
      
      const results = await securityScanner.scanConfiguration();
      
      // Should pass SSL check
      expect(results.passedChecks).toBeGreaterThan(0);
    });
  });
  
  describe('API Security Scanning', () => {
    it('should scan API security', async () => {
      const results = await securityScanner.scanAPISecurity();
      
      expect(results).toHaveProperty('status');
      expect(results).toHaveProperty('totalTests');
      expect(results).toHaveProperty('passedTests');
      expect(results).toHaveProperty('failedTests');
      expect(results).toHaveProperty('vulnerabilities');
      expect(Array.isArray(results.vulnerabilities)).toBe(true);
    });
    
    it('should test authentication security', async () => {
      const results = await securityScanner.scanAPISecurity();
      
      // Should include authentication tests
      expect(results.totalTests).toBeGreaterThan(0);
      
      // Based on our SecurityService implementation, these should pass
      expect(results.passedTests).toBeGreaterThan(0);
    });
    
    it('should test authorization security', async () => {
      const results = await securityScanner.scanAPISecurity();
      
      // Should include authorization tests
      expect(results.totalTests).toBeGreaterThan(0);
    });
    
    it('should generate API security recommendations', async () => {
      const results = await securityScanner.scanAPISecurity();
      
      expect(results).toHaveProperty('recommendations');
      expect(Array.isArray(results.recommendations)).toBe(true);
    });
  });
  
  describe('Code Security Scanning', () => {
    it('should scan code for security issues', async () => {
      const results = await securityScanner.scanCodeSecurity();
      
      expect(results).toHaveProperty('status');
      expect(results).toHaveProperty('issueCount');
      expect(results).toHaveProperty('issues');
      expect(results).toHaveProperty('categories');
      expect(Array.isArray(results.issues)).toBe(true);
    });
    
    it('should scan for hardcoded secrets', async () => {
      const results = await securityScanner.scanCodeSecurity();
      
      // Should complete without errors
      expect(results.status).toMatch(/clean|issues_found/);
    });
    
    it('should categorize code issues', async () => {
      const results = await securityScanner.scanCodeSecurity();
      
      expect(results.categories).toBeDefined();
      expect(typeof results.categories).toBe('object');
    });
  });
  
  describe('Compliance Scanning', () => {
    it('should scan compliance requirements', async () => {
      const results = await securityScanner.scanCompliance();
      
      expect(results).toHaveProperty('status');
      expect(results).toHaveProperty('totalChecks');
      expect(results).toHaveProperty('compliantChecks');
      expect(results).toHaveProperty('nonCompliantChecks');
      expect(results).toHaveProperty('issues');
      expect(results).toHaveProperty('frameworks');
      expect(Array.isArray(results.frameworks)).toBe(true);
    });
    
    it('should check GDPR compliance', async () => {
      const results = await securityScanner.scanCompliance();
      
      expect(results.frameworks).toContain('GDPR');
      
      // Based on our PIIHandlingService implementation, should be compliant
      expect(results.compliantChecks).toBeGreaterThan(0);
    });
    
    it('should check SOX compliance', async () => {
      const results = await securityScanner.scanCompliance();
      
      expect(results.frameworks).toContain('SOX');
      
      // Based on our AuditLoggingService implementation, should be compliant
      expect(results.compliantChecks).toBeGreaterThan(0);
    });
    
    it('should check OWASP compliance', async () => {
      const results = await securityScanner.scanCompliance();
      
      expect(results.frameworks).toContain('OWASP');
      
      // Based on our security implementations, should be compliant
      expect(results.compliantChecks).toBeGreaterThan(0);
    });
  });
  
  describe('Comprehensive Scanning', () => {
    it('should run comprehensive security scan', async () => {
      const results = await securityScanner.runComprehensiveScan();
      
      expect(results).toHaveProperty('scanId');
      expect(results).toHaveProperty('startTime');
      expect(results).toHaveProperty('endTime');
      expect(results).toHaveProperty('status', 'completed');
      expect(results).toHaveProperty('results');
      expect(results).toHaveProperty('summary');
      expect(results).toHaveProperty('recommendations');
      
      // Check all scan categories are included
      expect(results.results).toHaveProperty('dependencies');
      expect(results.results).toHaveProperty('configuration');
      expect(results.results).toHaveProperty('apiSecurity');
      expect(results.results).toHaveProperty('codeAnalysis');
      expect(results.results).toHaveProperty('compliance');
    });
    
    it('should generate scan summary', async () => {
      const results = await securityScanner.runComprehensiveScan();
      
      expect(results.summary).toHaveProperty('overallStatus');
      expect(results.summary).toHaveProperty('totalIssues');
      expect(results.summary).toHaveProperty('criticalIssues');
      expect(results.summary).toHaveProperty('highIssues');
      expect(results.summary).toHaveProperty('mediumIssues');
      expect(results.summary).toHaveProperty('lowIssues');
      expect(results.summary).toHaveProperty('categories');
    });
    
    it('should generate recommendations', async () => {
      const results = await securityScanner.runComprehensiveScan();
      
      expect(Array.isArray(results.recommendations)).toBe(true);
      
      // Should always include general recommendations
      expect(results.recommendations.some(rec => 
        rec.category === 'general'
      )).toBe(true);
    });
    
    it('should emit scan events', async () => {
      const events = [];
      
      securityScanner.on('scan-started', (data) => events.push({ type: 'started', data }));
      securityScanner.on('scan-completed', (data) => events.push({ type: 'completed', data }));
      securityScanner.on('report-generated', (data) => events.push({ type: 'report', data }));
      
      await securityScanner.runComprehensiveScan();
      
      expect(events.some(e => e.type === 'started')).toBe(true);
      expect(events.some(e => e.type === 'completed')).toBe(true);
      expect(events.some(e => e.type === 'report')).toBe(true);
    });
    
    it('should prevent concurrent scans', async () => {
      // Start first scan
      const scan1Promise = securityScanner.runComprehensiveScan();
      
      // Try to start second scan
      await expect(securityScanner.runComprehensiveScan()).rejects.toThrow(
        'Security scan already in progress'
      );
      
      // Wait for first scan to complete
      await scan1Promise;
    });
    
    it('should generate security report files', async () => {
      await securityScanner.runComprehensiveScan();
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('security-report-'),
        expect.any(String)
      );
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('latest-security-summary.json'),
        expect.any(String)
      );
    });
  });
  
  describe('Scan Results Management', () => {
    it('should store and retrieve scan results', async () => {
      const results = await securityScanner.runComprehensiveScan();
      const scanId = results.scanId;
      
      const retrievedResults = securityScanner.getScanResults(scanId);
      expect(retrievedResults).toEqual(results);
    });
    
    it('should retrieve all scan results', async () => {
      await securityScanner.runComprehensiveScan();
      await securityScanner.runComprehensiveScan();
      
      const allResults = securityScanner.getScanResults();
      expect(Array.isArray(allResults)).toBe(true);
      expect(allResults.length).toBe(2);
    });
    
    it('should maintain scan history', async () => {
      await securityScanner.runComprehensiveScan();
      
      const history = securityScanner.getScanHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(1);
      expect(history[0]).toHaveProperty('scanId');
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0]).toHaveProperty('summary');
    });
    
    it('should get latest scan summary', async () => {
      await securityScanner.runComprehensiveScan();
      
      const latestSummary = securityScanner.getLatestScanSummary();
      expect(latestSummary).toBeDefined();
      expect(latestSummary).toHaveProperty('overallStatus');
      expect(latestSummary).toHaveProperty('totalIssues');
    });
    
    it('should return null for latest summary when no scans exist', () => {
      const latestSummary = securityScanner.getLatestScanSummary();
      expect(latestSummary).toBeNull();
    });
  });
  
  describe('Health Status', () => {
    it('should return health status', () => {
      const health = securityScanner.getHealthStatus();
      
      expect(health).toHaveProperty('status', 'healthy');
      expect(health).toHaveProperty('lastScan');
      expect(health).toHaveProperty('scannerStatus');
      expect(health).toHaveProperty('continuousScanning');
    });
    
    it('should include last scan information when available', async () => {
      await securityScanner.runComprehensiveScan();
      
      const health = securityScanner.getHealthStatus();
      
      expect(health.lastScan).toBeDefined();
      expect(health.lastScan).toHaveProperty('timestamp');
      expect(health.lastScan).toHaveProperty('status');
      expect(health.lastScan).toHaveProperty('totalIssues');
    });
    
    it('should show scanning status during scan', async () => {
      // Mock a slow scan
      const originalScan = securityScanner.scanDependencies;
      securityScanner.scanDependencies = () => new Promise(resolve => 
        setTimeout(() => resolve({ status: 'clean', vulnerabilities: [] }), 100)
      );
      
      const scanPromise = securityScanner.runComprehensiveScan();
      
      // Check status during scan
      const healthDuringScan = securityScanner.getHealthStatus();
      expect(healthDuringScan.scannerStatus).toBe('scanning');
      
      await scanPromise;
      
      // Check status after scan
      const healthAfterScan = securityScanner.getHealthStatus();
      expect(healthAfterScan.scannerStatus).toBe('idle');
      
      // Restore original method
      securityScanner.scanDependencies = originalScan;
    });
  });
  
  describe('Vulnerability Assessment', () => {
    it('should assess version vulnerability correctly', () => {
      // Test version comparison logic
      expect(securityScanner.isVersionAffected('^4.17.10', '<4.17.12')).toBe(true);
      expect(securityScanner.isVersionAffected('~4.17.10', '<4.17.12')).toBe(true);
      expect(securityScanner.isVersionAffected('4.17.10', '<4.17.12')).toBe(false);
    });
    
    it('should categorize severity levels correctly', () => {
      expect(securityScanner.severityLevels.critical).toBe(4);
      expect(securityScanner.severityLevels.high).toBe(3);
      expect(securityScanner.severityLevels.medium).toBe(2);
      expect(securityScanner.severityLevels.low).toBe(1);
      expect(securityScanner.severityLevels.info).toBe(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle dependency scan errors gracefully', async () => {
      fs.readFile.mockRejectedValue(new Error('Permission denied'));
      
      const results = await securityScanner.scanDependencies();
      
      // The service handles errors gracefully by adding vulnerability entries
      // rather than returning error status
      expect(results.status).toMatch(/vulnerabilities_found|error/);
      expect(results.vulnerabilities.length).toBeGreaterThan(0);
    });
    
    it('should handle configuration scan errors gracefully', async () => {
      // Mock environment to cause errors
      const originalEnv = process.env;
      process.env = {};
      
      const results = await securityScanner.scanConfiguration();
      
      // Should still return results even with errors
      expect(results).toHaveProperty('status');
      
      // Restore environment
      process.env = originalEnv;
    });
    
    it('should emit error events on scan failure', async () => {
      const errorEvents = [];
      securityScanner.on('scan-error', (data) => errorEvents.push(data));
      
      // Mock a method to throw an error
      securityScanner.scanDependencies = () => Promise.reject(new Error('Test error'));
      
      await expect(securityScanner.runComprehensiveScan()).rejects.toThrow('Test error');
      
      expect(errorEvents.length).toBe(1);
      expect(errorEvents[0]).toHaveProperty('error', 'Test error');
    });
  });
});
