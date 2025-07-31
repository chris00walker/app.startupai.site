import { test, expect } from '@playwright/test';

test.describe('Multi-Agent Platform - User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test.describe('Homepage to Client Dashboard Journey', () => {
    test('should navigate from homepage to client dashboard successfully', async ({ page }) => {
      // Verify homepage loads
      await expect(page.locator('h1')).toContainText('Multi-Agent Intelligence Platform');
      
      // Click on "View Strategic Dashboard" button
      await page.click('text=View Strategic Dashboard');
      
      // Should navigate to client selection or dashboard
      await expect(page).toHaveURL(/\/client/);
      
      // Verify dashboard elements are present
      await expect(page.locator('[data-testid="client-dashboard"]')).toBeVisible();
    });

    test('should display client cards and allow selection', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to dashboard
      await page.click('text=View Strategic Dashboard');
      
      // Verify client cards are displayed
      await expect(page.locator('text=TechStart Ventures')).toBeVisible();
      await expect(page.locator('text=Global Manufacturing Co')).toBeVisible();
      
      // Click on a client card
      await page.click('text=TechStart Ventures');
      
      // Should navigate to specific client dashboard
      await expect(page).toHaveURL(/\/client\/.*techstart/i);
    });
  });

  test.describe('Client Dashboard Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate directly to a client dashboard
      await page.goto('/client/techstart-ventures');
    });

    test('should display all dashboard components', async ({ page }) => {
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Verify main dashboard elements
      await expect(page.locator('h1')).toContainText('TechStart Ventures');
      await expect(page.locator('[data-testid="metrics-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
      await expect(page.locator('[data-testid="agent-status"]')).toBeVisible();
    });

    test('should handle backend offline gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/client/techstart-ventures');
      
      // Should show demo mode or fallback content
      await expect(page.locator('text=Demo Mode')).toBeVisible();
      
      // Dashboard should still be functional with demo data
      await expect(page.locator('h1')).toContainText('TechStart Ventures');
    });

    test('should display metrics with proper formatting', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Verify metrics are displayed
      const metricsPanel = page.locator('[data-testid="metrics-panel"]');
      await expect(metricsPanel).toBeVisible();
      
      // Check for specific metric values
      await expect(page.locator('text=/\\d+/')).toBeVisible(); // Numbers
      await expect(page.locator('text=/%/')).toBeVisible(); // Percentages
    });
  });

  test.describe('IntakeForm User Journey', () => {
    test('should complete intake form successfully', async ({ page }) => {
      await page.goto('/client/techstart-ventures');
      
      // Look for intake form or trigger
      const intakeButton = page.locator('text=Start Intake');
      if (await intakeButton.isVisible()) {
        await intakeButton.click();
      }
      
      // Fill out step 1 - Personal Information
      await page.fill('[data-testid="name-input"]', 'John Doe');
      await page.click('text=Next');
      
      // Fill out step 2 - Contact Details
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.click('text=Next');
      
      // Fill out step 3 - Project Description
      await page.fill('[data-testid="project-input"]', 'AI-powered customer service platform');
      
      // Submit form
      await page.click('text=Submit');
      
      // Verify success message or navigation
      await expect(page.locator('text=Success')).toBeVisible({ timeout: 10000 });
    });

    test('should validate form fields properly', async ({ page }) => {
      await page.goto('/client/techstart-ventures');
      
      // Navigate to intake form
      const intakeButton = page.locator('text=Start Intake');
      if (await intakeButton.isVisible()) {
        await intakeButton.click();
      }
      
      // Try to proceed without filling required field
      const nextButton = page.locator('text=Next');
      await expect(nextButton).toBeDisabled();
      
      // Fill required field
      await page.fill('[data-testid="name-input"]', 'John Doe');
      
      // Next button should be enabled
      await expect(nextButton).not.toBeDisabled();
    });
  });

  test.describe('Agent Interaction Journey', () => {
    test('should display agent statuses and allow interaction', async ({ page }) => {
      await page.goto('/client/techstart-ventures');
      await page.waitForLoadState('networkidle');
      
      // Verify agent status panel
      const agentPanel = page.locator('[data-testid="agent-status"]');
      await expect(agentPanel).toBeVisible();
      
      // Check for agent cards
      await expect(page.locator('text=Research Agent')).toBeVisible();
      await expect(page.locator('text=Compliance Agent')).toBeVisible();
      
      // Verify agent status indicators
      await expect(page.locator('[data-testid="agent-status-indicator"]')).toBeVisible();
    });

    test('should show task progress in kanban board', async ({ page }) => {
      await page.goto('/client/techstart-ventures');
      await page.waitForLoadState('networkidle');
      
      // Verify kanban board
      const kanbanBoard = page.locator('[data-testid="kanban-board"]');
      await expect(kanbanBoard).toBeVisible();
      
      // Check for task columns
      await expect(page.locator('text=To Do')).toBeVisible();
      await expect(page.locator('text=In Progress')).toBeVisible();
      await expect(page.locator('text=Completed')).toBeVisible();
      
      // Verify task cards are present
      await expect(page.locator('[data-testid="task-card"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design Journey', () => {
    test('should work properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Verify mobile navigation
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Navigate to dashboard
      await page.click('text=View Strategic Dashboard');
      
      // Verify mobile-friendly dashboard layout
      await expect(page.locator('[data-testid="client-dashboard"]')).toBeVisible();
    });

    test('should adapt layout for tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/client/techstart-ventures');
      
      // Verify tablet layout
      await expect(page.locator('[data-testid="metrics-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
    });
  });

  test.describe('Error Handling Journey', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Start with working page
      await page.goto('/client/techstart-ventures');
      await page.waitForLoadState('networkidle');
      
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      // Trigger a new request (e.g., refresh data)
      await page.reload();
      
      // Should show error state or fallback content
      await expect(page.locator('text=Demo Mode')).toBeVisible();
    });

    test('should handle 404 errors properly', async ({ page }) => {
      await page.goto('/client/non-existent-client');
      
      // Should show 404 page or redirect
      await expect(page.locator('text=Not Found')).toBeVisible();
    });
  });

  test.describe('Performance Journey', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/client/techstart-ventures');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Mock large dataset response
      await page.route('**/api/tasks**', route => {
        const largeTasks = Array.from({ length: 100 }, (_, i) => ({
          id: `task-${i}`,
          title: `Task ${i}`,
          status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in-progress' : 'todo',
          agent: `Agent ${i % 5}`,
        }));
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeTasks),
        });
      });
      
      await page.goto('/client/techstart-ventures');
      await page.waitForLoadState('networkidle');
      
      // Should still be responsive with large dataset
      await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
    });
  });
});
