---
purpose: "E2E testing infrastructure implementation"
status: "active"
last_reviewed: "2025-11-12"
---

# E2E Testing Infrastructure Implementation

**Status:** ✅ Implemented, Needs UI data-testid Attributes
**Purpose:** Automated end-to-end testing for authentication and onboarding flows

---

## Overview

Implemented comprehensive Playwright E2E testing infrastructure to validate:
1. **Authentication flows** (Consultant and Founder users)
2. **Onboarding conversation flows** (AI assistant interactions)
3. **Session management** (persistence, recovery)
4. **Progress tracking** (stage progression, UI updates)

---

## Test Infrastructure

### Playwright Configuration

**File:** `frontend/playwright.config.ts`

**Key Settings:**
```typescript
{
  testDir: 'tests/e2e',
  testMatch: ['**/*.spec.ts'],
  timeout: 60_000,  // 60 seconds per test
  fullyParallel: false,  // Sequential execution
  workers: 1,  // Single worker for sequential tests
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
}
```

**Browser:** Playwright's bundled Chromium (Chrome-equivalent)
- Windows Chrome cannot be controlled from WSL due to pipe communication issues
- Chromium provides identical behavior in clean state

---

## Test Files Structure

```
frontend/tests/e2e/
├── helpers/
│   ├── auth.ts                  # Authentication helper functions
│   └── onboarding.ts            # Onboarding flow helper functions
├── 01-login.spec.ts             # Authentication flow tests
└── 02-onboarding-flow.spec.ts   # Onboarding conversation tests
```

---

## Test User Credentials

### Consultant User
```typescript
{
  email: 'chris00walker@gmail.com',
  password: 'Test123!',
  type: 'consultant'
}
```

### Founder User
```typescript
{
  email: 'chris00walker@proton.me',
  password: 'W7txYdr7bV0Tc30U0bv&',
  type: 'founder'
}
```

---

## Test Coverage

### 01-login.spec.ts (6 tests)

1. **✅ Should successfully login as Consultant**
   - Fills email/password form
   - Submits login
   - Verifies authenticated elements appear

2. **✅ Should redirect Consultant to appropriate dashboard**
   - Logs in as consultant
   - Clicks "AI Assistant" button
   - Verifies redirect to `/onboarding/consultant`

3. **❌ Should successfully login as Founder**
   - Currently failing: timeout waiting for networkidle

4. **❌ Should redirect Founder to onboarding if not completed**
   - Currently failing: cannot find chat interface elements

5. **❌ Should display validation errors for invalid credentials**
   - Currently failing: login form not found after login

6. **❌ Should maintain session across page reloads**
   - Currently failing: timeout on page reload

### 02-onboarding-flow.spec.ts (9 tests)

1. **❌ Should display chat interface with welcome message**
2. **❌ Should send message and receive AI response**
3. **❌ Should progress through Stage 1: Problem Discovery**
4. **❌ Should handle multi-turn conversation in Stage 2: Solution Validation**
5. **❌ Should track conversation progress**
6. **❌ Should handle empty message submission gracefully**
7. **❌ Should display loading state during AI response**
8. **❌ Should maintain conversation context across multiple messages**
9. **❌ Should resume conversation after page reload**

**Note:** All onboarding tests failed due to missing UI `data-testid` attributes (see below).

---

## Test Results Summary

**Run Date:** 2025-11-12
**Duration:** 27.9 minutes
**Results:** 1 passed, 14 failed

### ✅ Passing Tests
- Authentication Flow - Consultant User - should redirect to appropriate dashboard (48.2s)

### ❌ Failing Tests

**Primary Failure Causes:**

1. **Missing `data-testid` Attributes** (Most Common)
   - Tests cannot locate UI elements for verification
   - Required attributes not yet added to components

2. **Network Idle Timeout Issues**
   - Some tests timeout waiting for `networkidle` state
   - Page continues making network requests beyond timeout

3. **Server Connection Issues**
   - Later tests failed with `ERR_CONNECTION_REFUSED`
   - Server may have stopped responding during long test run

---

## Required UI Attributes

The following `data-testid` attributes need to be added to components:

### Dashboard Page
```tsx
<div data-testid="dashboard">
  {/* Dashboard content */}
</div>
```

### Onboarding Page
```tsx
<div data-testid="onboarding">
  {/* Onboarding content */}
</div>
```

### User Menu Component
```tsx
<div data-testid="user-menu">
  {/* User menu content */}
</div>
```

### Chat Interface
```tsx
<div data-testid="chat-interface">
  <textarea
    placeholder="Type your message..."
    aria-label="Chat message input"
  />
  <button type="submit">Send</button>
</div>
```

### Additional Required Selectors
- `textarea` elements for chat input
- Elements with `placeholder` attribute containing "message"
- `aria-label` containing "user" for user-related elements

---

## Running Tests

### Prerequisites
```bash
# Ensure both backend and frontend servers are running
cd /home/chris/projects/app.startupai.site/backend
pnpm dev  # Port 3000

cd /home/chris/projects/app.startupai.site/frontend
pnpm dev  # Port 3001
```

### Run All Tests
```bash
cd frontend
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test 01-login.spec.ts
npx playwright test 02-onboarding-flow.spec.ts
```

### Run in Headed Mode (Watch Browser)
```bash
npx playwright test --headed
```

### Run Single Test
```bash
npx playwright test -g "should redirect Consultant"
```

### View Test Report
```bash
npx playwright show-report test-results/playwright-report
```

---

## Test Artifacts

When tests fail, Playwright captures:

1. **Screenshots** - `test-results/playwright/artifacts/[test-name]/test-failed-1.png`
2. **Videos** - `test-results/playwright/artifacts/[test-name]/video.webm`
3. **Traces** - Available when running with `--trace on`
4. **Error Context** - `error-context.md` with page DOM snapshot

---

## Next Steps

### 1. Add Missing data-testid Attributes
**Priority:** HIGH

Search for and update these components:
- Dashboard page layout
- Onboarding page layout
- User menu component
- Chat interface component

### 2. Fix Network Idle Timeouts
**Priority:** MEDIUM

Investigate why pages don't reach `networkidle`:
- Long-running API calls
- WebSocket connections
- Polling intervals

Consider alternative waiting strategies:
```typescript
// Instead of networkidle
await page.waitForLoadState('domcontentloaded');
await page.waitForSelector('[data-testid="chat-interface"]');
```

### 3. Improve Test Stability
**Priority:** MEDIUM

- Add retry logic for flaky tests
- Increase timeouts for AI response tests (they take 5-10 seconds)
- Add better error messages for debugging

### 4. Add More Test Coverage
**Priority:** LOW

Once existing tests pass, add:
- Multi-stage onboarding completion tests
- Tool calling verification tests
- Error handling tests
- Edge case tests (network errors, invalid inputs)

---

## Consultant vs Founder Clarification

**Ambiguity Identified:** Tests reveal confusion about Consultant onboarding vs Founder onboarding.

**Current Behavior:**
- Consultants redirect to `/onboarding/consultant` (307 redirect)
- Founders go to `/onboarding/founder` (200 success)

**Questions to Resolve:**
1. Do Consultants onboard themselves or their clients?
2. Should Consultants have a different onboarding flow?
3. What happens after Consultant clicks "AI Assistant"?

See `CONSULTANT_VS_FOUNDER_CLARIFICATION.md` for detailed analysis.

---

## References

- **Playwright Documentation:** https://playwright.dev/docs/intro
- **Test Files:** `frontend/tests/e2e/`
- **Configuration:** `frontend/playwright.config.ts`
- **Helper Functions:** `frontend/tests/e2e/helpers/`

---

**Last Updated:** 2025-11-12
**Next Review:** After adding data-testid attributes
