---
purpose: "E2E testing guide for backend integration"
status: "active"
last_reviewed: "2026-01-19"
---

# E2E Testing Guide: Backend Integration

## Overview

Comprehensive E2E tests for backend integration covering:
1. ✅ CrewAI analysis workflow
2. ✅ JWT authentication
3. ✅ Project CRUD operations
4. ✅ OAuth callback handling
5. ✅ Error handling and rate limiting

## Story-Driven Test Mapping

E2E tests are organized by user journeys and map to user stories. See [`journey-test-matrix.md`](./journey-test-matrix.md) for the complete coverage matrix.

| Test File | Stories Covered | Primary Focus |
|-----------|-----------------|---------------|
| `01-login.spec.ts` | Cross-cutting | Authentication flows |
| `02-onboarding-flow.spec.ts` | US-F01, US-F08, US-FT01 | Founder onboarding |
| `04-founder-analysis-journey.spec.ts` | US-F02, US-F06 | Dashboard & analysis |
| `05-hitl-approval-flow.spec.ts` | US-F03 | Approval workflows |
| `06-consultant-portfolio.spec.ts` | US-C03, US-C04 | Portfolio management |
| `09-consultant-practice-setup.spec.ts` | US-C01 | Consultant setup |
| `10-consultant-client-onboarding.spec.ts` | US-C02, US-C07 | Client onboarding |

**Stories Reference:** [`user-stories.md`](../user-experience/user-stories.md)

## Quick Start

```bash
# 1. Set up environment variables
cp .env.test.local .env.test

# 2. Add your test JWT token (get from Supabase dashboard)
echo "TEST_JWT_TOKEN=your-token-here" >> .env.test

# 3. Start local backend (optional, for full integration)
cd ../backend
source crewai-env/bin/activate
python src/startupai/main.py &

# 4. Start Netlify Dev (for function testing)
cd ../
netlify dev --port 8888 &

# 5. Run E2E tests
cd frontend
pnpm test:e2e -- backend-integration.spec.ts
```

## Test Suites

### 1. CrewAI Analysis Workflow (3 tests)

**What it tests:**
- Full AI analysis flow from request to response
- Graceful degradation when Supabase unavailable
- Invalid request handling

**Run:**
```bash
pnpm exec playwright test backend-integration.spec.ts -g "CrewAI Analysis"
```

**Expected Results:**
- ✅ 200 response with analysis results
- ✅ Execution time < 60 seconds
- ✅ Rate limit headers present
- ✅ Graceful error for invalid requests

**Prerequisites:**
- TEST_JWT_TOKEN configured
- Netlify Dev running on port 8888
- OPENAI_API_KEY set in backend

### 2. JWT Authentication (4 tests)

**What it tests:**
- Request rejection without auth
- Invalid token rejection
- Valid token acceptance
- Malformed header handling

**Run:**
```bash
pnpm exec playwright test backend-integration.spec.ts -g "JWT Authentication"
```

**Expected Results:**
- ✅ 401 for missing/invalid auth
- ✅ 200/500 for valid auth (depending on backend state)
- ✅ Proper error messages

**Prerequisites:**
- Netlify Dev running
- Valid TEST_JWT_TOKEN (for positive tests)

### 3. Project CRUD Operations (4 tests)

**What it tests:**
- Fetching user projects
- Creating new projects
- Updating project details
- Error handling when database unavailable

**Run:**
```bash
pnpm exec playwright test backend-integration.spec.ts -g "Project CRUD"
```

**Expected Results:**
- ✅ Projects load from Supabase
- ✅ CRUD operations work through UI
- ✅ Graceful error handling

**Prerequisites:**
- Frontend dev server running
- Supabase configured
- User authenticated

### 4. OAuth Callback (5 tests)

**What it tests:**
- Code-based OAuth flow
- Token-based OAuth flow
- Error handling
- Next parameter preservation

**Run:**
```bash
pnpm exec playwright test backend-integration.spec.ts -g "OAuth Callback"
```

**Expected Results:**
- ✅ Redirects to dashboard on success
- ✅ Redirects to error page on failure
- ✅ Preserves next parameter

**Prerequisites:**
- Frontend dev server running
- Auth callback route implemented

### 5. Error Handling & Rate Limiting (5 tests)

**What it tests:**
- Rate limit enforcement (10 req/15min)
- Network error handling
- 500 error messages
- Request retry logic
- Payload validation

**Run:**
```bash
pnpm exec playwright test backend-integration.spec.ts -g "Error Handling"
```

**Expected Results:**
- ✅ 429 after 11 requests
- ✅ Retry-After header present
- ✅ User-friendly error messages
- ✅ 400 for invalid payloads

**Prerequisites:**
- Netlify Dev running
- Fresh rate limit window

## Environment Variables

### Required

```bash
# .env.test
TEST_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Get from Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Optional

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000  # Frontend URL
NETLIFY_FUNCTION_URL=http://localhost:8888  # Netlify Dev URL
```

## Getting a Test JWT Token

### Option 1: From Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
2. Click on a test user
3. Copy the JWT token from user details
4. Add to `.env.test`

### Option 2: Generate via Script

```typescript
// scripts/generate-test-token.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'test-password',
});

console.log('JWT Token:', data.session?.access_token);
```

### Option 3: Skip Auth Tests

If you don't have a valid token, tests will automatically skip:

```typescript
if (!testToken) {
  console.warn('⚠️  TEST_JWT_TOKEN not set - skipping');
  test.skip();
}
```

## Running Tests

### All Backend Integration Tests

```bash
pnpm exec playwright test backend-integration.spec.ts
```

### Specific Test Suite

```bash
pnpm exec playwright test backend-integration.spec.ts -g "CrewAI"
```

### With UI Mode (Debug)

```bash
pnpm exec playwright test backend-integration.spec.ts --ui
```

### Watch Mode

```bash
pnpm exec playwright test backend-integration.spec.ts --watch
```

### Headed Mode (See Browser)

```bash
pnpm exec playwright test backend-integration.spec.ts --headed
```

### Single Browser

```bash
pnpm exec playwright test backend-integration.spec.ts --project=chromium
```

## Test Execution Workflow

### Full Local Testing

```bash
# Terminal 1: Backend
cd backend
source crewai-env/bin/activate
python src/startupai/main.py

# Terminal 2: Netlify Functions
cd app.startupai.site
netlify dev --port 8888

# Terminal 3: Frontend
cd frontend
pnpm dev

# Terminal 4: Tests
cd frontend
pnpm test:e2e -- backend-integration.spec.ts
```

### Partial Testing (Functions Only)

```bash
# Terminal 1: Netlify Functions
netlify dev --port 8888

# Terminal 2: Tests
cd frontend
pnpm exec playwright test backend-integration.spec.ts -g "JWT|Rate"
```

### CI/CD Testing

```bash
# GitHub Actions will run:
pnpm test:e2e -- backend-integration.spec.ts --project=chromium
```

## Troubleshooting

### Tests Timing Out

**Problem:** Tests exceed 60s timeout

**Solutions:**
1. Increase timeout in test:
   ```typescript
   test.setTimeout(120000); // 2 minutes
   ```
2. Check OPENAI_API_KEY is set
3. Verify CrewAI backend is responsive

### 401 Errors on All Tests

**Problem:** JWT token invalid/expired

**Solutions:**
1. Generate fresh token
2. Check Supabase project is active
3. Verify SUPABASE_URL and ANON_KEY

### Rate Limit Tests Failing

**Problem:** Rate limits not triggering

**Solutions:**
1. Restart Netlify Dev (resets in-memory rate limiter)
2. Wait 15 minutes for window to reset
3. Check rate limit logic in `crew-analyze.py`

### Network Errors

**Problem:** ECONNREFUSED or timeout errors

**Solutions:**
1. Verify all services running:
   ```bash
   lsof -i :3000  # Frontend
   lsof -i :8888  # Netlify Dev
   ```
2. Check firewall settings
3. Use correct URLs in env vars

### Mock Mode Always Active

**Problem:** Backend using mock data

**Solutions:**
1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
2. Verify Supabase project is not paused
3. Check network connectivity to Supabase

## Test Reports

### HTML Report

After tests run:
```bash
pnpm exec playwright show-report test-results/playwright-report
```

### Artifacts

Located in `test-results/playwright/artifacts/`:
- Screenshots on failure
- Videos of test execution
- Trace files for debugging

### CI Reports

GitHub Actions uploads reports as artifacts:
- Go to Actions → Latest run → Artifacts → playwright-report

## Expected Coverage

**Total Tests:** 21 tests  
**Estimated Duration:** 5-10 minutes (depending on API response times)

**Coverage:**
- ✅ Happy path flows
- ✅ Authentication edge cases
- ✅ Error scenarios
- ✅ Rate limiting
- ✅ CRUD operations

## Next Steps

After these tests pass:

1. **Add Performance Tests**
   - Measure CrewAI response times
   - Test concurrent requests
   - Profile memory usage

2. **Add Security Tests**
   - SQL injection attempts
   - XSS prevention
   - CSRF protection

3. **Add Load Tests**
   - Stress test rate limiter
   - Test background functions
   - Verify timeout handling

4. **Integration with CI/CD**
   - Add to GitHub Actions
   - Set up test environment
   - Configure secrets

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Netlify Functions Testing](https://docs.netlify.com/functions/test/)
- [Supabase Auth Testing](https://supabase.com/docs/guides/auth/testing)
- [CrewAI Documentation](https://docs.crewai.com/)

---

**Status:** ✅ Ready for execution
**Last Updated:** January 19, 2026
**Maintainer:** Development Team

## Related Documentation

- [`strategy.md`](./strategy.md) - Testing strategy overview
- [`journey-test-matrix.md`](./journey-test-matrix.md) - Story-to-test coverage matrix
- [`user-stories.md`](../user-experience/user-stories.md) - User story definitions
