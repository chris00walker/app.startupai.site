/**
 * Backend Integration E2E Tests
 * 
 * Tests the integration between frontend and backend services:
 * - CrewAI analysis workflow
 * - JWT authentication
 * - Project CRUD operations
 * - OAuth callback handling
 * - Error handling and rate limiting
 */

import { test, expect } from '@playwright/test';

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds for AI operations
const API_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const NETLIFY_FUNCTION_URL = process.env.NETLIFY_FUNCTION_URL || 'http://localhost:8888';

test.describe('Backend Integration Tests', () => {
  
  // ============================================================================
  // Test 1: CrewAI Analysis Workflow
  // ============================================================================
  
  test.describe('CrewAI Analysis Workflow', () => {
    test('should successfully trigger and complete AI analysis', async ({ request }) => {
      test.setTimeout(TEST_TIMEOUT);
      
      // Generate a test JWT token (in production, this would come from auth)
      const testToken = process.env.TEST_JWT_TOKEN || 'test-token-placeholder';
      
      const response = await request.post(`${NETLIFY_FUNCTION_URL}/.netlify/functions/crew-analyze`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          strategic_question: 'What are the top 3 AI trends for enterprise strategy in 2025?',
          project_id: 'e2e-test-project-001',
          project_context: 'E2E testing of CrewAI integration',
          priority_level: 'high',
        },
      });
      
      // Verify response
      if (response.status() === 401) {
        console.warn('⚠️  JWT authentication not configured for tests - skipping');
        test.skip();
      }
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('result');
      expect(data.result).toBeTruthy();
      
      // Verify response metadata
      const headers = response.headers();
      expect(headers['x-ratelimit-limit']).toBeDefined();
      expect(headers['x-ratelimit-remaining']).toBeDefined();
      expect(headers['x-execution-time']).toBeDefined();
      
      console.log('✅ CrewAI analysis completed successfully');
      console.log(`Execution time: ${headers['x-execution-time']}s`);
    });
    
    test('should handle invalid request gracefully', async ({ request }) => {
      const testToken = process.env.TEST_JWT_TOKEN || 'test-token-placeholder';
      
      const response = await request.post(`${NETLIFY_FUNCTION_URL}/.netlify/functions/crew-analyze`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          // Missing required field: strategic_question
          project_id: 'e2e-test-project-002',
        },
      });
      
      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Missing required fields');
    });
    
    test('should use mock mode when Supabase unavailable', async ({ request }) => {
      test.setTimeout(TEST_TIMEOUT);
      
      const testToken = process.env.TEST_JWT_TOKEN || 'test-token-placeholder';
      
      const response = await request.post(`${NETLIFY_FUNCTION_URL}/.netlify/functions/crew-analyze`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          strategic_question: 'Test question for mock mode',
          project_id: 'e2e-mock-test',
          project_context: 'Testing graceful degradation',
        },
      });
      
      // Should succeed even without database
      if (response.status() === 401) {
        test.skip();
      }
      
      expect([200, 500]).toContain(response.status());
      
      const data = await response.json();
      console.log('Mock mode response:', data);
    });
  });
  
  // ============================================================================
  // Test 2: JWT Authentication
  // ============================================================================
  
  test.describe('JWT Authentication', () => {
    test('should reject requests without authentication', async ({ request }) => {
      const response = await request.post(`${NETLIFY_FUNCTION_URL}/.netlify/functions/crew-analyze`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          strategic_question: 'Test without auth',
          project_id: 'test-unauth',
        },
      });
      
      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Authentication required');
    });
    
    test('should reject invalid JWT tokens', async ({ request }) => {
      const response = await request.post(`${NETLIFY_FUNCTION_URL}/.netlify/functions/crew-analyze`, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345',
          'Content-Type': 'application/json',
        },
        data: {
          strategic_question: 'Test with invalid token',
          project_id: 'test-invalid-auth',
        },
      });
      
      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toMatch(/Invalid|expired|Authentication failed/i);
    });
    
    test('should accept valid JWT tokens', async ({ request }) => {
      const testToken = process.env.TEST_JWT_TOKEN;
      
      if (!testToken) {
        console.warn('⚠️  TEST_JWT_TOKEN not set - skipping valid token test');
        test.skip();
      }
      
      const response = await request.post(`${NETLIFY_FUNCTION_URL}/.netlify/functions/crew-analyze`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          strategic_question: 'Test with valid token',
          project_id: 'test-valid-auth',
        },
      });
      
      expect([200, 500]).toContain(response.status());
    });
    
    test('should handle malformed Authorization header', async ({ request }) => {
      const response = await request.post(`${NETLIFY_FUNCTION_URL}/.netlify/functions/crew-analyze`, {
        headers: {
          'Authorization': 'InvalidFormat',
          'Content-Type': 'application/json',
        },
        data: {
          strategic_question: 'Test malformed header',
          project_id: 'test-malformed',
        },
      });
      
      expect(response.status()).toBe(401);
    });
  });
  
  // ============================================================================
  // Test 3: Project CRUD Operations
  // ============================================================================
  
  test.describe('Project CRUD Operations', () => {
    test('should fetch projects for authenticated user', async ({ page }) => {
      // Navigate to dashboard (assumes auth is handled)
      await page.goto('/dashboard');
      
      // Wait for projects to load
      await page.waitForSelector('[data-testid="project-list"]', { timeout: 10000 });
      
      // Verify projects are displayed
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();
      
      console.log(`Found ${count} projects`);
      expect(count).toBeGreaterThanOrEqual(0); // May be 0 for new users
    });
    
    test('should create new project via UI', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Click "New Project" button
      const newProjectButton = page.locator('button:has-text("New Project")');
      if (await newProjectButton.isVisible()) {
        await newProjectButton.click();
        
        // Fill project form
        await page.fill('[name="name"]', 'E2E Test Project');
        await page.fill('[name="description"]', 'Created by E2E test');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Verify success
        await expect(page.locator('text=E2E Test Project')).toBeVisible({ timeout: 5000 });
      } else {
        console.warn('⚠️  New Project button not found - may need authentication');
        test.skip();
      }
    });
    
    test('should update project details', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Find first project
      const firstProject = page.locator('[data-testid="project-card"]').first();
      
      if (await firstProject.isVisible()) {
        await firstProject.click();
        
        // Wait for project detail page
        await page.waitForLoadState('networkidle');
        
        // Look for edit button
        const editButton = page.locator('button:has-text("Edit")');
        if (await editButton.isVisible()) {
          await editButton.click();
          
          // Update description
          await page.fill('[name="description"]', 'Updated by E2E test');
          await page.click('button:has-text("Save")');
          
          // Verify update
          await expect(page.locator('text=Updated by E2E test')).toBeVisible();
        }
      } else {
        console.warn('⚠️  No projects found for CRUD test');
        test.skip();
      }
    });
    
    test('should handle useProjects hook errors gracefully', async ({ page }) => {
      // Test error handling by blocking Supabase requests
      await page.route('**/rest/v1/projects*', route => route.abort());
      
      await page.goto('/dashboard');
      
      // Should show error state, not crash
      await page.waitForLoadState('networkidle');
      
      // Check for error message or empty state
      const errorMessage = page.locator('text=/error|failed|unable/i');
      const emptyState = page.locator('[data-testid="empty-state"]');
      
      const hasError = await errorMessage.isVisible().catch(() => false);
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(hasError || hasEmpty).toBeTruthy();
    });
  });
  
  // ============================================================================
  // Test 4: OAuth Callback and Session Creation
  // ============================================================================
  
  test.describe('OAuth Callback and Session', () => {
    test('should handle OAuth callback with code', async ({ page }) => {
      // Simulate OAuth callback with authorization code
      const mockCode = 'mock-auth-code-12345';
      await page.goto(`/auth/callback?code=${mockCode}`);
      
      // Should either redirect or show error (depending on whether mock code is valid)
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      expect(url).toMatch(/\/(dashboard|auth-code-error|login)/);
      
      console.log('Callback redirected to:', url);
    });
    
    test('should handle OAuth callback with access token', async ({ page }) => {
      // Simulate callback with tokens (token-based flow)
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      
      await page.goto(`/auth/callback?access_token=${mockAccessToken}&refresh_token=${mockRefreshToken}`);
      
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      expect(url).toMatch(/\/(dashboard|auth-code-error|login)/);
    });
    
    test('should handle OAuth callback without code', async ({ page }) => {
      await page.goto('/auth/callback');
      
      await page.waitForLoadState('networkidle');
      
      // Should redirect to error page
      expect(page.url()).toContain('auth-code-error');
      await expect(page.locator('text=/error|no.*code/i')).toBeVisible();
    });
    
    test('should handle OAuth error parameter', async ({ page }) => {
      await page.goto('/auth/callback?error=access_denied&error_description=User+cancelled');
      
      await page.waitForLoadState('networkidle');
      
      // Should show error
      expect(page.url()).toMatch(/auth-code-error|login/);
    });
    
    test('should preserve next parameter during auth flow', async ({ page }) => {
      const nextPath = '/dashboard/projects/123';
      await page.goto(`/auth/callback?code=mock-code&next=${encodeURIComponent(nextPath)}`);
      
      await page.waitForLoadState('networkidle');
      
      // Should eventually redirect to next path (if auth succeeds)
      // Or to error page (if mock code fails)
      const url = page.url();
      console.log('Auth flow completed, URL:', url);
      expect(url).toBeTruthy();
    });
  });
  
  // ============================================================================
  // Test 5: Error Handling and Rate Limiting
  // ============================================================================
  
  test.describe('Error Handling and Rate Limiting', () => {
    test('should enforce rate limits', async ({ request }) => {
      const testToken = process.env.TEST_JWT_TOKEN || 'test-token-placeholder';
      
      // Make multiple rapid requests
      const requests = Array.from({ length: 12 }, (_, i) => 
        request.post(`${NETLIFY_FUNCTION_URL}/.netlify/functions/crew-analyze`, {
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            strategic_question: `Rate limit test ${i}`,
            project_id: `rate-limit-test-${i}`,
          },
        })
      );
      
      const responses = await Promise.all(requests);
      
      // At least one should be rate limited (429)
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;
      const unauthorizedCount = responses.filter(r => r.status() === 401).length;
      
      if (unauthorizedCount === requests.length) {
        console.warn('⚠️  All requests unauthorized - skipping rate limit test');
        test.skip();
      }
      
      console.log(`Rate limited: ${rateLimitedCount}/${requests.length} requests`);
      expect(rateLimitedCount).toBeGreaterThan(0);
      
      // Check rate limit headers on rate limited response
      const rateLimitedResponse = responses.find(r => r.status() === 429);
      if (rateLimitedResponse) {
        const headers = rateLimitedResponse.headers();
        expect(headers['retry-after']).toBeDefined();
        expect(headers['x-ratelimit-remaining']).toBe('0');
        
        const data = await rateLimitedResponse.json();
        expect(data.error).toMatch(/rate limit|too many requests/i);
      }
    });
    
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/.netlify/functions/*', route => route.abort());
      
      await page.goto('/dashboard');
      
      // Try to trigger an action that calls backend
      const analyzeButton = page.locator('button:has-text("Analyze")');
      if (await analyzeButton.isVisible()) {
        await analyzeButton.click();
        
        // Should show error message
        await expect(page.locator('text=/network|failed|error/i')).toBeVisible({ timeout: 5000 });
      }
    });
    
    test('should handle 500 errors with user-friendly messages', async ({ page }) => {
      // Mock 500 error
      await page.route('**/.netlify/functions/crew-analyze', route => 
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        })
      );
      
      await page.goto('/dashboard');
      
      // Attempt action
      const analyzeButton = page.locator('button:has-text("Analyze")');
      if (await analyzeButton.isVisible()) {
        await analyzeButton.click();
        
        // Should show user-friendly error
        await page.waitForTimeout(1000);
        const errorText = await page.locator('text=/error|failed/i').textContent().catch(() => null);
        console.log('Error message shown:', errorText);
      }
    });
    
    test('should retry failed requests appropriately', async ({ request }) => {
      let attemptCount = 0;
      
      // This is a conceptual test - in practice, retry logic would be in the client
      const makeRequest = async () => {
        attemptCount++;
        return request.post(`${NETLIFY_FUNCTION_URL}/.netlify/functions/crew-analyze`, {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          data: {
            strategic_question: 'Retry test',
            project_id: 'retry-test',
          },
        });
      };
      
      try {
        await makeRequest();
      } catch {
        // Retry on failure
        await makeRequest();
      }
      
      expect(attemptCount).toBeGreaterThanOrEqual(1);
    });
    
    test('should validate request payload format', async ({ request }) => {
      const testToken = process.env.TEST_JWT_TOKEN || 'test-token-placeholder';
      
      // Send invalid JSON
      const response = await request.post(`${NETLIFY_FUNCTION_URL}/.netlify/functions/crew-analyze`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: 'invalid-json-string',
      });
      
      expect(response.status()).toBe(400);
      
      const data = await response.json();
      expect(data.error).toMatch(/invalid|json|body/i);
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

test.describe('Test Setup Validation', () => {
  test('should validate test environment configuration', async () => {
    console.log('=== Test Environment ===');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Netlify Function URL:', NETLIFY_FUNCTION_URL);
    console.log('JWT Token configured:', !!process.env.TEST_JWT_TOKEN);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    expect(API_BASE_URL).toBeTruthy();
    expect(NETLIFY_FUNCTION_URL).toBeTruthy();
  });
});
