/**
 * WCAG 2.2 AA Compliance Tests
 * Source: accessibility-standards.md + onboarding-agent-integration.md Lines 66-73
 * 
 * Tests validate complete accessibility compliance for AI-powered onboarding:
 * - WCAG 2.0 foundation requirements
 * - WCAG 2.1 enhancements  
 * - WCAG 2.2 latest standards
 * - AI-specific accessibility patterns
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { 
  AccessibilityTester,
  ACCESSIBILITY_REQUIREMENTS 
} from '../utils/test-helpers';
import { OnboardingWizard } from '../../components/onboarding/OnboardingWizard';

// Extend Jest matchers for accessibility
expect.extend(toHaveNoViolations);

// Mock components and APIs
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('WCAG 2.2 AA Compliance Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Mock successful API response for component rendering
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        sessionId: 'test-session',
        stageInfo: { currentStage: 1, totalStages: 7 },
        agentIntroduction: 'Welcome to your AI consultation',
        firstQuestion: 'Tell me about your business idea'
      }), { status: 200 })
    );
  });

  describe('WCAG 2.0 Foundation Requirements', () => {
    describe('Perceivable', () => {
      it('should meet color contrast requirements (4.5:1 minimum)', async () => {
        // Test Requirement: WCAG 2.0 - Perceivable content
        const { container } = render(
          <OnboardingWizard
            userId="test-user"
            planType="trial"
            userEmail="test@example.com"
          />
        );

        await screen.findByText(/welcome to your ai consultation/i);

        // Test color contrast for all text elements
        const textElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, label');
        
        for (const element of textElements) {
          const contrastRatio = await AccessibilityTester.testColorContrast(element as HTMLElement);
          expect(contrastRatio).toBeGreaterThanOrEqual(ACCESSIBILITY_REQUIREMENTS.wcag20.perceivable.colorContrastRatio.min);
        }
      });

      it('should provide text alternatives for all non-text content', async () => {
        const { container } = render(
          <OnboardingWizard
            userId="test-user"
            planType="trial"
            userEmail="test@example.com"
          />
        );

        await screen.findByText(/welcome to your ai consultation/i);

        // Check for images without alt text
        const images = container.querySelectorAll('img');
        images.forEach(img => {
          expect(img).toHaveAttribute('alt');
        });

        // Check for icons with proper labels
        const icons = container.querySelectorAll('[data-lucide]');
        icons.forEach(icon => {
          const hasLabel = icon.hasAttribute('aria-label') || 
                          icon.hasAttribute('aria-labelledby') ||
                          icon.closest('[aria-label]') !== null;
          expect(hasLabel).toBe(true);
        });
      });

      it('should have proper heading structure', async () => {
        const { container } = render(
          <OnboardingWizard
            userId="test-user"
            planType="trial"
            userEmail="test@example.com"
          />
        );

        await screen.findByText(/welcome to your ai consultation/i);

        // Check heading hierarchy (h1 → h2 → h3, no skipping)
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;

        headings.forEach(heading => {
          const currentLevel = parseInt(heading.tagName.charAt(1));
          expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
          previousLevel = currentLevel;
        });

        // Ensure there's at least one h1
        expect(container.querySelector('h1')).toBeTruthy();
      });
    });

    describe('Operable', () => {
      it('should be fully keyboard accessible', async () => {
        const user = userEvent.setup();
        const { container } = render(
          <OnboardingWizard
            userId="test-user"
            planType="trial"
            userEmail="test@example.com"
          />
        );

        await screen.findByText(/welcome to your ai consultation/i);

        // Test keyboard navigation through all interactive elements
        const isKeyboardAccessible = await AccessibilityTester.testKeyboardNavigation(container);
        expect(isKeyboardAccessible).toBe(true);

        // Test Tab navigation
        const interactiveElements = container.querySelectorAll(
          'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        // Verify all interactive elements are focusable
        for (const element of interactiveElements) {
          element.focus();
          expect(document.activeElement).toBe(element);
        }
      });

      it('should have visible focus indicators', async () => {
        const { container } = render(
          <OnboardingWizard
            userId="test-user"
            planType="trial"
            userEmail="test@example.com"
          />
        );

        await screen.findByText(/welcome to your ai consultation/i);

        // Test focus indicators on interactive elements
        const focusableElements = container.querySelectorAll(
          'button, a, input, select, textarea'
        );

        focusableElements.forEach(element => {
          element.focus();
          const styles = window.getComputedStyle(element);
          const hasFocusIndicator = 
            styles.outline !== 'none' || 
            styles.boxShadow !== 'none' ||
            element.matches(':focus-visible');
          
          expect(hasFocusIndicator).toBe(true);
        });
      });

      it('should have skip navigation links', async () => {
        const { container } = render(
          <OnboardingWizard
            userId="test-user"
            planType="trial"
            userEmail="test@example.com"
          />
        );

        // Check for skip links (usually hidden until focused)
        const skipLinks = container.querySelectorAll('a[href^="#"]');
        const hasSkipToMain = Array.from(skipLinks).some(link => 
          link.textContent?.toLowerCase().includes('skip to main') ||
          link.textContent?.toLowerCase().includes('skip to content')
        );

        expect(hasSkipToMain).toBe(true);
      });
    });

    describe('Understandable', () => {
      it('should use appropriate reading level', async () => {
        const { container } = render(
          <OnboardingWizard
            userId="test-user"
            planType="trial"
            userEmail="test@example.com"
          />
        );

        await screen.findByText(/welcome to your ai consultation/i);

        // Check text content for reading level (Grade 8 target)
        const textElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
        
        textElements.forEach(element => {
          const text = element.textContent || '';
          // Simple heuristic: avoid overly complex sentences
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          sentences.forEach(sentence => {
            const words = sentence.trim().split(/\s+/);
            // Sentences should generally be under 20 words for Grade 8 level
            expect(words.length).toBeLessThanOrEqual(25);
          });
        });
      });

      it('should have consistent navigation', async () => {
        const { container } = render(
          <OnboardingWizard
            userId="test-user"
            planType="trial"
            userEmail="test@example.com"
          />
        );

        await screen.findByText(/welcome to your ai consultation/i);

        // Check for consistent navigation patterns
        const navigationElements = container.querySelectorAll('nav, [role="navigation"]');
        expect(navigationElements.length).toBeGreaterThan(0);

        // Verify navigation has proper labels
        navigationElements.forEach(nav => {
          const hasLabel = nav.hasAttribute('aria-label') || 
                          nav.hasAttribute('aria-labelledby') ||
                          nav.querySelector('h1, h2, h3, h4, h5, h6');
          expect(hasLabel).toBe(true);
        });
      });

      it('should provide clear error identification and recovery', async () => {
        const user = userEvent.setup();
        
        // Mock API error
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const { container } = render(
          <OnboardingWizard
            userId="test-user"
            planType="trial"
            userEmail="test@example.com"
          />
        );

        // Wait for error state
        await screen.findByText(/unable to start onboarding/i);

        // Check error message clarity
        const errorMessage = screen.getByText(/network error/i);
        expect(errorMessage).toBeInTheDocument();

        // Check for recovery options
        const retryButton = screen.getByText(/try again/i);
        const dashboardButton = screen.getByText(/go to dashboard/i);
        
        expect(retryButton).toBeInTheDocument();
        expect(dashboardButton).toBeInTheDocument();

        // Verify error is properly associated with form/context
        expect(errorMessage.closest('[role="alert"]')).toBeTruthy();
      });
    });

    describe('Robust', () => {
      it('should have valid HTML structure', async () => {
        const { container } = render(
          <OnboardingWizard
            userId="test-user"
            planType="trial"
            userEmail="test@example.com"
          />
        );

        await screen.findByText(/welcome to your ai consultation/i);

        // Run axe accessibility tests
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should be compatible with assistive technologies', async () => {
        const { container } = render(
          <OnboardingWizard
            userId="test-user"
            planType="trial"
            userEmail="test@example.com"
          />
        );

        await screen.findByText(/welcome to your ai consultation/i);

        // Test screen reader compatibility
        const isScreenReaderCompatible = await AccessibilityTester.testScreenReaderCompatibility(container);
        expect(isScreenReaderCompatible).toBe(true);

        // Check for proper ARIA usage
        const ariaElements = container.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
        expect(ariaElements.length).toBeGreaterThan(0);

        // Verify semantic HTML usage
        const semanticElements = container.querySelectorAll('main, nav, section, article, aside, header, footer');
        expect(semanticElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('WCAG 2.1 Enhancements', () => {
    it('should support reflow at 320px width', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Simulate 320px viewport
      Object.defineProperty(window, 'innerWidth', { value: 320, writable: true });
      window.dispatchEvent(new Event('resize'));

      // Check that content reflows without horizontal scrolling
      const body = document.body;
      expect(body.scrollWidth).toBeLessThanOrEqual(320);
    });

    it('should identify input purposes', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Check for autocomplete attributes on inputs
      const inputs = container.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        if (input.getAttribute('type') === 'email') {
          expect(input).toHaveAttribute('autocomplete', 'email');
        }
        if (input.getAttribute('name')?.includes('name')) {
          expect(input.getAttribute('autocomplete')).toMatch(/name/);
        }
      });
    });

    it('should provide consistent help', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Check for help mechanisms in consistent locations
      const helpElements = container.querySelectorAll('[aria-describedby], [title], .help-text');
      
      // Verify help is available and consistently placed
      if (helpElements.length > 0) {
        helpElements.forEach(element => {
          expect(element.textContent || element.getAttribute('title')).toBeTruthy();
        });
      }
    });
  });

  describe('WCAG 2.2 Latest Standards', () => {
    it('should have adequate focus visibility (2px minimum outline)', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Test focus outline width on interactive elements
      const focusableElements = container.querySelectorAll('button, a, input, textarea');
      
      focusableElements.forEach(element => {
        element.focus();
        const styles = window.getComputedStyle(element);
        
        // Check outline width (should be at least 2px)
        const outlineWidth = parseInt(styles.outlineWidth) || 0;
        const borderWidth = parseInt(styles.borderWidth) || 0;
        
        expect(outlineWidth + borderWidth).toBeGreaterThanOrEqual(ACCESSIBILITY_REQUIREMENTS.wcag22.focusOutlineWidth.min);
      });
    });

    it('should have minimum touch target sizes (24×24px)', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Test touch target sizes
      const touchTargets = await AccessibilityTester.testTouchTargets(container);
      
      touchTargets.forEach(({ width, height, element }) => {
        expect(width).toBeGreaterThanOrEqual(ACCESSIBILITY_REQUIREMENTS.wcag22.touchTargetSize.min);
        expect(height).toBeGreaterThanOrEqual(ACCESSIBILITY_REQUIREMENTS.wcag22.touchTargetSize.min);
      });
    });

    it('should support accessible authentication', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Check that authentication doesn't rely solely on cognitive function tests
      // (e.g., no CAPTCHAs without alternatives)
      const authElements = container.querySelectorAll('input[type="password"], [data-auth]');
      
      authElements.forEach(element => {
        // Verify no cognitive-only authentication barriers
        const hasCognitiveTest = element.closest('.captcha, .puzzle, .cognitive-test');
        if (hasCognitiveTest) {
          // Should have alternative authentication method
          const hasAlternative = container.querySelector('[data-auth-alternative]');
          expect(hasAlternative).toBeTruthy();
        }
      });
    });
  });

  describe('AI-Specific Accessibility Patterns', () => {
    it('should announce AI processing states to screen readers', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Check for live regions for AI status updates
      const liveRegions = container.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      // Verify AI processing states are announced
      liveRegions.forEach(region => {
        expect(['polite', 'assertive']).toContain(region.getAttribute('aria-live'));
      });
    });

    it('should provide text alternatives for AI-generated visualizations', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Check for charts, graphs, or visual AI outputs
      const visualElements = container.querySelectorAll('canvas, svg, .chart, .visualization');
      
      visualElements.forEach(element => {
        // Should have text alternative or description
        const hasTextAlternative = 
          element.hasAttribute('aria-label') ||
          element.hasAttribute('aria-labelledby') ||
          element.hasAttribute('aria-describedby') ||
          element.querySelector('.sr-only, .visually-hidden');
        
        expect(hasTextAlternative).toBe(true);
      });
    });

    it('should support multi-modal AI interaction', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Check for voice input alternatives
      const voiceInputs = container.querySelectorAll('[data-voice-input]');
      voiceInputs.forEach(input => {
        // Should have keyboard/text alternative
        const hasTextAlternative = input.closest('form')?.querySelector('input[type="text"], textarea');
        expect(hasTextAlternative).toBeTruthy();
      });

      // Check for AI help systems
      const helpSystems = container.querySelectorAll('[data-ai-help]');
      helpSystems.forEach(help => {
        // Should be keyboard accessible
        expect(help.getAttribute('tabindex')).not.toBe('-1');
      });
    });
  });

  describe('Cross-Disability Support', () => {
    it('should support users with visual impairments', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Screen reader compatibility
      const isScreenReaderCompatible = await AccessibilityTester.testScreenReaderCompatibility(container);
      expect(isScreenReaderCompatible).toBe(true);

      // High contrast support
      const textElements = container.querySelectorAll('p, h1, h2, h3, button, label');
      for (const element of textElements) {
        const contrastRatio = await AccessibilityTester.testColorContrast(element as HTMLElement);
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('should support users with hearing impairments', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Visual indicators for audio content
      const audioElements = container.querySelectorAll('audio, video, [data-audio]');
      audioElements.forEach(element => {
        // Should have visual alternatives (captions, transcripts)
        const hasVisualAlternative = 
          element.querySelector('track[kind="captions"]') ||
          element.closest('.media-container')?.querySelector('.transcript, .captions');
        
        if (audioElements.length > 0) {
          expect(hasVisualAlternative).toBeTruthy();
        }
      });
    });

    it('should support users with motor impairments', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Large touch targets
      const touchTargets = await AccessibilityTester.testTouchTargets(container);
      touchTargets.forEach(({ width, height }) => {
        expect(width).toBeGreaterThanOrEqual(24);
        expect(height).toBeGreaterThanOrEqual(24);
      });

      // Keyboard accessibility
      const isKeyboardAccessible = await AccessibilityTester.testKeyboardNavigation(container);
      expect(isKeyboardAccessible).toBe(true);
    });

    it('should support users with cognitive impairments', async () => {
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      await screen.findByText(/welcome to your ai consultation/i);

      // Simple language and clear instructions
      const instructions = container.querySelectorAll('.instruction, .help-text, [data-help]');
      instructions.forEach(instruction => {
        const text = instruction.textContent || '';
        // Instructions should be concise and clear
        expect(text.length).toBeLessThan(200); // Keep instructions under 200 characters
      });

      // Progress indicators
      const progressIndicators = container.querySelectorAll('[role="progressbar"], .progress, [data-progress]');
      expect(progressIndicators.length).toBeGreaterThan(0);

      // Error prevention and recovery
      const forms = container.querySelectorAll('form');
      forms.forEach(form => {
        // Should have clear error handling
        const errorElements = form.querySelectorAll('[role="alert"], .error, [data-error]');
        // If there are inputs, there should be error handling capability
        const inputs = form.querySelectorAll('input, textarea, select');
        if (inputs.length > 0) {
          // Form should have validation or error handling structure
          expect(form.querySelector('[data-validation]') || errorElements.length > 0).toBeTruthy();
        }
      });
    });
  });
});
