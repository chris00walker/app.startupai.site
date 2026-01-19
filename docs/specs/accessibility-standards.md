---
purpose: "WCAG compliance framework for accessibility"
status: "active"
last_reviewed: "2026-01-19"
---

# Accessibility Standards
## WCAG 2.0, 2.1, 2.2 AA Compliance Framework

**Version:** 2.0
**Compliance Target:** WCAG 2.2 AA

## Implementation Status

> **Current Status**: Partial implementation. Core infrastructure exists but comprehensive testing pending.

| Feature | Status | Implementation |
|---------|--------|----------------|
| Skip links | Partial | `app/onboarding/page.tsx`, `app/onboarding/founder/page.tsx` only |
| Screen reader announcements | Implemented | `hooks/useScreenReaderAnnouncement.ts` |
| Form accessibility | Implemented | `hooks/useFormAccessibility.ts` |
| Language declaration | Implemented | `<html lang="en">` in `app/layout.tsx` |
| ARIA attributes | Implemented | Across components (approvals, onboarding, canvas) |
| jest-axe | Installed | Package available, tests skipped |
| Playwright axe | Implemented | `tests/e2e/helpers/accessibility.ts` |
| prefers-reduced-motion | Not Implemented | No support found |
| Automated CI testing | Not Configured | Manual testing only |
| Color contrast validation | Untested | No automated checks |

## Executive Summary

StartupAI is committed to providing an inclusive platform accessible to all users, including entrepreneurs with disabilities. This document establishes comprehensive accessibility standards that meet WCAG 2.0, 2.1, and 2.2 AA compliance requirements, with special focus on AI-specific accessibility patterns.

## Core Accessibility Principles

### 1. Perceivable
**Users must be able to perceive the information being presented**

#### Visual Content
- **Color Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text and UI components
- **Alternative Text:** All images, charts, and visual content must have descriptive alternatives
- **Text Scaling:** Content must remain functional when text is scaled up to 200%
- **Color Independence:** Information cannot be conveyed by color alone

#### Audio Content
- **Captions:** All video content must include accurate captions
- **Audio Descriptions:** Complex visual content requires audio descriptions
- **Volume Control:** Users must be able to control audio volume independently

### 2. Operable
**Interface components must be operable by all users**

#### Keyboard Navigation
- **Full Keyboard Access:** All functionality available via keyboard
- **Visible Focus Indicators:** Minimum 2px outline with 4.5:1 contrast ratio
- **Logical Tab Order:** Sequential navigation follows content structure
- **No Keyboard Traps:** Users can navigate away from any component

#### Touch Targets (WCAG 2.2)
- **Minimum Size:** 24×24px for all interactive elements
- **Adequate Spacing:** 8px minimum between adjacent targets
- **Large Target Alternative:** Provide larger alternative when space allows

#### Timing and Motion
- **No Time Limits:** Or provide user controls to extend/disable
- **Pause Controls:** Users can pause auto-playing content
- **Motion Preferences:** Respect `prefers-reduced-motion` settings

### 3. Understandable
**Information and UI operation must be understandable**

#### Readable Content
- **Language Declaration:** Page language specified in HTML
- **Reading Level:** Target 8th-grade reading level when possible
- **Unusual Words:** Definitions provided for technical terms
- **Abbreviations:** Expansions provided on first use

#### Predictable Interface
- **Consistent Navigation:** Same relative order across pages
- **Consistent Identification:** Same functionality labeled consistently
- **Context Changes:** Only occur on user request or with warning

#### Input Assistance
- **Error Identification:** Errors clearly identified and described
- **Error Suggestions:** Provide correction suggestions when possible
- **Error Prevention:** Confirmation for important actions

### 4. Robust
**Content must be robust enough for various assistive technologies**

#### Semantic HTML
- **Proper Elements:** Use semantic HTML before adding ARIA
- **Valid Markup:** HTML validates according to specifications
- **Accessible Names:** All interactive elements have accessible names
- **Roles and Properties:** ARIA used correctly when HTML is insufficient

## AI-Specific Accessibility Requirements

### AI Content Identification
- **Clear Labeling:** All AI-generated content marked with `aria-label="AI-generated content"`
- **Source Attribution:** Clear indication when content is AI-created vs human-authored
- **Confidence Indicators:** When appropriate, indicate AI confidence levels

### AI Processing States
- **Progress Indicators:** Visual and auditory feedback for AI operations
- **Screen Reader Announcements:** Use `aria-live="polite"` for status updates
- **Cancellation Options:** Users can cancel long-running AI operations
- **Timeout Management:** Allow users to extend AI processing timeouts

### AI Output Accessibility
- **Reading Level Analysis:** AI responses target 8th-grade reading level
- **Alternative Formats:** Provide text alternatives for AI-generated visualizations
- **Multi-Modal Output:** Support both visual and auditory presentation
- **Structured Content:** Use proper headings and landmarks in AI responses

### AI Error Handling
- **Plain Language Errors:** AI failures explained in simple terms
- **Recovery Options:** Clear steps for users to recover from AI errors
- **Alternative Paths:** Provide non-AI alternatives when AI fails
- **Error Prevention:** Validate inputs before sending to AI systems

## Implementation Standards

### Semantic HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Descriptive Page Title</title>
</head>
<body>
  <header role="banner">
    <nav role="navigation" aria-label="Main navigation">
      <!-- Navigation content -->
    </nav>
  </header>
  
  <main role="main">
    <h1>Page Heading</h1>
    <!-- Main content -->
  </main>
  
  <aside role="complementary" aria-label="Related information">
    <!-- Sidebar content -->
  </aside>
  
  <footer role="contentinfo">
    <!-- Footer content -->
  </footer>
</body>
</html>
```

### ARIA Implementation Patterns
```html
<!-- Form with error handling -->
<form>
  <label for="email">Email Address</label>
  <input 
    type="email" 
    id="email" 
    aria-describedby="email-error"
    aria-invalid="true"
    required
  >
  <div id="email-error" role="alert">
    Please enter a valid email address
  </div>
</form>

<!-- AI processing indicator -->
<div 
  role="status" 
  aria-live="polite" 
  aria-label="AI analysis in progress"
>
  <span class="sr-only">Analyzing your business strategy...</span>
  <div class="spinner" aria-hidden="true"></div>
</div>

<!-- Data visualization with alternative -->
<div role="img" aria-labelledby="chart-title" aria-describedby="chart-data">
  <h3 id="chart-title">Revenue Growth Chart</h3>
  <canvas id="revenue-chart" aria-hidden="true"></canvas>
  <div id="chart-data" class="sr-only">
    Revenue increased from $10K in Q1 to $25K in Q4, showing 150% growth.
  </div>
</div>
```

### Focus Management

**Screen Reader Announcements** (implemented in `hooks/useScreenReaderAnnouncement.ts`):
```typescript
import { useScreenReaderAnnouncement, announceToScreenReader } from '@/hooks/useScreenReaderAnnouncement';

// Hook usage
const { announce, announceLoading, announceSuccess, announceError } = useScreenReaderAnnouncement();
announceLoading('Processing your request');
announceSuccess('Response received');
announceError('Failed to send message');

// One-off announcement
announceToScreenReader('New content loaded', 'polite');
```

**Form Accessibility** (implemented in `hooks/useFormAccessibility.ts`):
```typescript
import { useFormAccessibility } from '@/hooks/useFormAccessibility';

const emailA11y = useFormAccessibility('email');

<input id="email" {...emailA11y.fieldProps} />
{emailA11y.hasError && (
  <span {...emailA11y.errorProps}>{emailA11y.error}</span>
)}
```

**Skip Navigation** (implemented on onboarding pages):
```tsx
// app/onboarding/page.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
>
  Skip to main content
</a>
```

## Multi-Disability Support

### Visual Impairments
- **Screen Reader Compatibility:** Full compatibility with NVDA, JAWS, VoiceOver
- **High Contrast Mode:** Support for Windows High Contrast and custom themes
- **Magnification Support:** Content remains functional at 400% zoom
- **Color Blindness:** No information conveyed by color alone

### Hearing Impairments
- **Visual Indicators:** Visual alternatives for all audio alerts
- **Captions:** All video content includes accurate captions
- **Sign Language:** Consider sign language interpretation for critical content
- **Vibration Alerts:** Use device vibration where available

### Motor Impairments
- **Large Click Targets:** Minimum 24×24px for all interactive elements
- **Voice Control Support:** Compatible with Dragon NaturallySpeaking
- **Switch Navigation:** Support for switch-based navigation devices
- **Gesture Alternatives:** Provide alternatives to complex gestures

### Cognitive Impairments
- **Simple Language:** Use plain language and avoid jargon
- **Clear Instructions:** Step-by-step guidance for complex tasks
- **Progress Saving:** Allow users to save progress and return later
- **Error Prevention:** Validate inputs and provide clear feedback
- **Consistent Layout:** Maintain consistent navigation and layout patterns

## Testing and Validation

### Current Testing Infrastructure

**Jest + axe-core** (installed but tests skipped):
```typescript
// Package installed: jest-axe ^10.0.0
// Tests in: src/__tests__/accessibility/wcag-compliance.test.tsx (SKIPPED)
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<OnboardingWizard />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Playwright + axe-core** (implemented):
```typescript
// Location: tests/e2e/helpers/accessibility.ts
import { checkA11y, checkKeyboardNavigation, checkHeadingStructure } from './helpers/accessibility';

// Run WCAG 2.1 AA checks
await checkA11y(page, 'login page');

// Check keyboard navigation
await checkKeyboardNavigation(page, 5);

// Verify heading structure
await checkHeadingStructure(page);
```

### Manual Testing Protocols
1. **Keyboard Navigation Testing**
   - Navigate entire application using only keyboard
   - Verify all interactive elements are reachable
   - Check focus indicators are visible and logical

2. **Screen Reader Testing**
   - Test with NVDA (Windows), VoiceOver (Mac), TalkBack (Android)
   - Verify all content is announced correctly
   - Check that dynamic content updates are announced

3. **Color Contrast Validation**
   - Use tools like WebAIM Contrast Checker
   - Test all color combinations used in interface
   - Verify compliance with WCAG AA standards

4. **Zoom and Scaling Testing**
   - Test at 200% and 400% zoom levels
   - Verify content remains functional and readable
   - Check that horizontal scrolling is not required

### Accessibility Audit Schedule
- **Daily:** Automated testing in CI/CD pipeline
- **Weekly:** Manual keyboard navigation testing
- **Monthly:** Comprehensive screen reader testing
- **Quarterly:** Full accessibility audit with external tools

## Compliance Documentation

### VPAT (Voluntary Product Accessibility Template)
- Maintain current VPAT documentation
- Update with each major release
- Provide to enterprise customers upon request

### Accessibility Statement
- Public accessibility statement on website
- Contact information for accessibility feedback
- Regular updates reflecting current compliance status

### User Testing
- Include users with disabilities in testing process
- Gather feedback from accessibility community
- Implement improvements based on real user experiences

## Legal and Business Considerations

### Legal Compliance
- **ADA Section 508:** Compliance with US accessibility laws
- **EN 301 549:** European accessibility standard compliance
- **AODA:** Accessibility for Ontarians with Disabilities Act compliance

### Business Benefits
- **Market Expansion:** Access to $13 trillion disability market
- **Risk Mitigation:** Reduced legal liability from accessibility lawsuits
- **Brand Reputation:** Demonstrates commitment to inclusive design
- **Innovation Driver:** Accessibility improvements benefit all users

### Competitive Advantage
- Most SaaS platforms have poor accessibility
- Accessible AI tools are extremely rare
- Opportunity to lead in inclusive AI design

## Implementation Roadmap

### Completed
- [x] Semantic HTML landmarks in layout
- [x] Language declaration (`<html lang="en">`)
- [x] Screen reader announcement hooks
- [x] Form accessibility hooks with ARIA patterns
- [x] Skip links on onboarding pages
- [x] ARIA attributes in core components
- [x] E2E accessibility helper functions
- [x] jest-axe package installed

### Phase 1: Testing Foundation (Priority)
- [ ] Enable skipped WCAG unit tests
- [ ] Add axe checks to CI/CD pipeline
- [ ] Run accessibility audit on all pages
- [ ] Document color contrast compliance

### Phase 2: Core Accessibility
- [ ] Add skip links to ALL pages (not just onboarding)
- [ ] Implement `prefers-reduced-motion` support
- [ ] AI content identification labeling
- [ ] Processing state announcements in all AI interactions

### Phase 3: Advanced Features
- [ ] Voice input support
- [ ] High contrast mode support
- [ ] Comprehensive keyboard navigation testing
- [ ] User testing with assistive technology users

### Phase 4: Continuous Improvement
- [ ] Regular accessibility audits
- [ ] User feedback integration
- [ ] VPAT documentation
- [ ] Accessibility training for team

---

**Document Owner:** Product Team
**Review Cycle:** Monthly
**Last Reviewed:** 2026-01-19
**Compliance Contact:** accessibility@startupai.site

## Related Documentation

- **SLOs**: [slos.md](slos.md) (accessibility targets)
- **Frontend Components**: [frontend-components.md](frontend-components.md)
- **Testing Strategy**: [../testing/strategy.md](../testing/strategy.md)
