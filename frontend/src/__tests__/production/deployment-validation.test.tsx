/**
 * Netlify Function Validation Tests
 *
 * These tests validate Netlify Functions work correctly in the local dev environment.
 * Netlify handles production validation automatically through their platform.
 *
 * Run with: pnpm test:netlify (starts netlify dev automatically)
 * Or manually: netlify dev & PRODUCTION_URL=http://localhost:8888 pnpm test
 *
 * These tests are SKIPPED by default in unit test runs (pnpm test) because they
 * require a running server. Set PRODUCTION_URL to enable them.
 */

// Skip these integration tests unless explicitly running against a server
const SHOULD_RUN = Boolean(process.env.PRODUCTION_URL);
const describeOrSkip = SHOULD_RUN ? describe : describe.skip;

describeOrSkip('Production Deployment Validation', () => {
  const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://app-startupai-site.netlify.app';
  const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id';

  beforeAll(() => {
    if (!process.env.PRODUCTION_URL) {
      console.warn('⚠️  PRODUCTION_URL not set. Using default:', PRODUCTION_URL);
    }
  });

  describe('Netlify Functions Validation', () => {
    it('should successfully call onboarding-start function', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/onboarding/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          planType: 'trial',
          userContext: {
            referralSource: 'production_test',
            previousExperience: 'first_time',
            timeAvailable: 30,
          },
        }),
      });

      // Log response for debugging
      const responseText = await response.text();
      console.log('Production API Response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });

      // Basic response validation
      expect(response.status).toBeLessThan(500); // Should not be server error
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        fail(`Response is not valid JSON: ${responseText}`);
      }

      // Validate response structure
      expect(responseData).toHaveProperty('success');
      
      if (responseData.success) {
        // Success case validation
        expect(responseData).toHaveProperty('sessionId');
        expect(responseData).toHaveProperty('agentIntroduction');
        expect(responseData).toHaveProperty('firstQuestion');
        expect(responseData.stageInfo.currentStage).toBe(1);
        expect(responseData.stageInfo.totalStages).toBe(7);
      } else {
        // Error case validation - should be structured error
        expect(responseData).toHaveProperty('error');
        expect(responseData.error).toHaveProperty('code');
        expect(responseData.error).toHaveProperty('message');
        expect(responseData.error).toHaveProperty('retryable');
        
        // Log the error for debugging
        console.log('Production API Error:', responseData.error);
      }
    }, 30000); // 30 second timeout for production calls

    it('should handle invalid requests gracefully', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/onboarding/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error.code).toBe('INVALID_REQUEST');
    });

    it('should handle CORS properly', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/onboarding/start`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('Frontend Deployment Validation', () => {
    it('should serve the onboarding page without 404', async () => {
      const response = await fetch(`${PRODUCTION_URL}/onboarding`);
      
      expect(response.status).not.toBe(404);
      
      if (response.status === 200) {
        const html = await response.text();
        expect(html).toContain('onboarding'); // Should contain onboarding content
      } else {
        console.log('Onboarding page response:', {
          status: response.status,
          statusText: response.statusText,
        });
      }
    });

    it('should serve static assets correctly', async () => {
      const response = await fetch(`${PRODUCTION_URL}/favicon.ico`);
      expect([200, 404]).toContain(response.status); // 404 is ok for favicon
    });

    it('should have proper meta tags for SEO', async () => {
      const response = await fetch(`${PRODUCTION_URL}/`);
      
      if (response.status === 200) {
        const html = await response.text();
        expect(html).toContain('<title>');
        expect(html).toContain('<meta');
      }
    });
  });

  describe('Environment Configuration Validation', () => {
    it('should have required environment variables configured', async () => {
      // Test that the function can access required env vars by making a request
      const response = await fetch(`${PRODUCTION_URL}/api/onboarding/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'env-test-user',
          planType: 'trial',
        }),
      });

      const responseData = await response.json();
      
      // If we get a specific error about missing env vars, that's what we're testing
      if (!responseData.success && responseData.error.message.includes('environment')) {
        fail(`Missing environment variables: ${responseData.error.message}`);
      }
      
      // Any response other than env var error means env vars are configured
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Database Connectivity Validation', () => {
    it('should be able to connect to Supabase', async () => {
      const response = await fetch(`${PRODUCTION_URL}/api/onboarding/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'db-test-user',
          planType: 'trial',
        }),
      });

      const responseData = await response.json();
      
      // Check if we get database-related errors
      if (!responseData.success) {
        const errorMessage = responseData.error.message.toLowerCase();
        
        if (errorMessage.includes('database') || 
            errorMessage.includes('connection') || 
            errorMessage.includes('supabase')) {
          fail(`Database connectivity issue: ${responseData.error.message}`);
        }
      }
      
      // Any structured response means database connectivity is working
      expect(responseData).toHaveProperty('success');
    });
  });

  describe('Performance Validation', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${PRODUCTION_URL}/api/onboarding/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'perf-test-user',
          planType: 'trial',
        }),
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`Production API response time: ${responseTime}ms`);
      
      // API should respond within 10 seconds (generous for cold starts)
      expect(responseTime).toBeLessThan(10000);
      
      // Log warning if response is slow
      if (responseTime > 5000) {
        console.warn(`⚠️  Slow API response: ${responseTime}ms`);
      }
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 3 }, (_, i) =>
        fetch(`${PRODUCTION_URL}/api/onboarding/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: `concurrent-test-user-${i}`,
            planType: 'trial',
          }),
        })
      );

      const responses = await Promise.all(requests);
      
      // All requests should complete
      expect(responses).toHaveLength(3);
      
      // All should return structured responses
      for (const response of responses) {
        expect(response.status).toBeLessThan(500);
        const data = await response.json();
        expect(data).toHaveProperty('success');
      }
    });
  });

  describe('Error Handling Validation', () => {
    it('should return structured errors for all failure cases', async () => {
      // Note: userId is optional - the API uses session auth for user identification
      // userId is only used for test mode detection (userId === 'test-user-id')
      const testCases = [
        {
          name: 'missing planType',
          body: { userId: 'test-user' },
          expectedError: 'INVALID_REQUEST',
        },
        {
          name: 'invalid planType',
          body: { userId: 'test-user', planType: 'invalid' },
          expectedError: 'INVALID_REQUEST',
        },
      ];

      for (const testCase of testCases) {
        const response = await fetch(`${PRODUCTION_URL}/api/onboarding/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCase.body),
        });

        const responseData = await response.json();
        
        expect(responseData.success).toBe(false);
        expect(responseData.error).toHaveProperty('code');
        expect(responseData.error).toHaveProperty('message');
        expect(responseData.error).toHaveProperty('retryable');
        
        console.log(`${testCase.name} error:`, responseData.error);
      }
    });
  });
});
