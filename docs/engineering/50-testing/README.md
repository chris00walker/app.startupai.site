# StartupAI Platform Testing Strategy

**Context:** Product platform testing with cross-site integration focus  
**Status:** ✅ Testing infrastructure complete (Oct 4, 2025)  
**Reference:** [Implementation Plan - Testing Strategy](../../../startupai.site/docs/technical/two-site-implementation-plan.md#72-testing-strategy)

This platform uses comprehensive testing to ensure reliable cross-site authentication, AI workflows, and user experience.

## Current Test Status

**Test Suites:** 12 suites, 162 tests passing ✅  
**Coverage:** Unit tests + Integration tests + E2E tests  
**Frameworks:** Jest (unit/integration) + Playwright (E2E)  
**Last Build:** Both sites building successfully  
**Last Updated:** October 4, 2025

## Test Infrastructure

### Test Frameworks & Configuration

#### Jest (Unit & Integration Tests)
- **Configuration:** `frontend/jest.config.js`
- **Setup Files:** `jest.setup.js`, `jest.env.js`, `jest.polyfills.js`
- **Test Pattern:** `**/*.test.{ts,tsx}`
- **Environment:** jsdom for React components
- **Coverage Target:** ≥90% (current baseline established)

**Key Features:**
- Testing Library for React component testing
- MSW (Mock Service Worker) for API mocking
- Supabase client mocking via test doubles
- Environment variable injection via dotenv
- Trial guard test coverage

#### Playwright (E2E Tests)
- **Configuration:** `frontend/playwright.config.ts` ✅ **NEW**
- **Test Directory:** `src/__tests__/e2e/`
- **Test Pattern:** `**/*.spec.ts`
- **Browsers:** Chromium, Firefox, WebKit
- **Total E2E Tests:** 45 tests (15 scenarios × 3 browsers)

**Key Features:**
- Multi-browser testing (Chrome, Firefox, Safari)
- Auto-start Next.js dev server
- Visual regression ready
- Network mocking and error simulation
- Mobile/tablet viewport testing
- Artifact capture (screenshots, videos, traces)

### Test Organization & Separation

```
frontend/
├── src/__tests__/
│   ├── e2e/                          # Playwright E2E (*.spec.ts)
│   │   └── user-journeys.spec.ts    # 15 E2E scenarios
│   ├── components/                   # Jest component tests
│   │   ├── BusinessModelCanvas.test.tsx
│   │   ├── ValuePropositionCanvas.test.tsx
│   │   ├── TestingBusinessIdeasCanvas.test.tsx
│   │   ├── CanvasEditor.test.tsx
│   │   └── CanvasGallery.test.tsx
│   ├── integration/                  # Jest integration tests
│   │   └── ClientDashboard.integration.test.tsx
│   ├── trial-guard.test.ts           # Trial limits enforcement
│   ├── dashboard-debug.test.tsx      # Dashboard smoke tests
│   └── canvas-tdd-validation.test.tsx # TDD validation suite
├── src/components/Forms/__tests__/   # Form tests
│   └── IntakeForm.test.tsx
├── src/tests/components/             # Health check tests
│   ├── HealthCheck.test.tsx
│   └── HealthCheck.simple.test.tsx
├── jest.config.js                    # Jest configuration
├── playwright.config.ts              # Playwright configuration
└── package.json                      # Test scripts
```

**Test Isolation Strategy:**
- Jest runs `*.test.*` files (unit + integration)
- Playwright runs `*.spec.ts` files (E2E only)
- No shared globals or configuration conflicts
- Separate artifact directories prevent collisions

## Testing Priorities for Product Platform

### ✅ Implemented Tests

#### Canvas Tools (5 suites)
- Business Model Canvas component
- Value Proposition Canvas component
- Testing Business Ideas Canvas component
- Canvas Editor with save/load functionality
- Canvas Gallery with filtering

#### Dashboard & Integration (3 suites)
- Client Dashboard integration tests
- Dashboard debug and smoke tests
- Health check with backend status verification

#### Forms & Validation (2 suites)
- Intake Form multi-step wizard
- Canvas TDD validation suite

#### Trial Guardrails (1 suite)
- Trial usage counter enforcement
- API endpoint `/api/trial/allow` validation
- Project/workflow/report limits

#### E2E User Journeys (15 scenarios)
- Homepage to dashboard navigation
- Client card selection and routing
- Dashboard component rendering
- Intake form completion
- Agent status and interaction
- Kanban board task management
- Responsive design (mobile/tablet)
- Error handling and fallbacks
- Performance benchmarks

### ✅ Backend Implementation Complete - Ready for Testing

The following backend components are now implemented and ready for integration testing:

#### Cross-Site Integration ✅
- **JWT Token Validation**: ✅ IMPLEMENTED in `crew-analyze.py` (Supabase JWT verification)
- **User Session Creation**: ✅ IMPLEMENTED in `auth/callback/route.ts` (OAuth + session management)
- **Handoff Error Recovery**: ✅ IMPLEMENTED with error handling and redirect fallbacks
- **Analytics Tracking**: ✅ IMPLEMENTED - PostHog integration with GDPR consent (See `lib/analytics/`)

#### AI Workflows (CrewAI) ✅
- **CrewAI Integration**: ✅ IMPLEMENTED - 5 agents, sequential process, real-time execution
- **Report Generation**: ✅ IMPLEMENTED - `ReportGeneratorTool` in backend
- **Evidence Analysis**: ✅ IMPLEMENTED - `VectorSearchTool` with pgvector semantic search
- **Web Search**: ✅ IMPLEMENTED - `WebSearchTool` retrieving real data (MIT Sloan, TechInsights, etc.)
- **Evidence Storage**: ✅ IMPLEMENTED - `EvidenceStoreTool` with Supabase integration
- **Gate Scoring**: ✅ IMPLEMENTED - Complete gate evaluation logic with 51 comprehensive tests

#### Database Integration ✅
- **Project Management**: ✅ IMPLEMENTED - `useProjects` hook uses LIVE Supabase queries
- **Evidence Collection**: ✅ IMPLEMENTED - EvidenceStoreTool with CRUD operations
- **Hypothesis Management**: ⏳ PENDING - Database schema exists, frontend queries need tests
- **File Upload**: ⏳ PENDING - Storage buckets configured, upload API needs implementation

### 🎯 Next Testing Priorities

**Ready for E2E Tests:**
1. Test CrewAI analysis workflow (POST `/api/analyze`)
2. Test JWT authentication with real tokens
3. Test project CRUD operations via `useProjects`
4. Test OAuth callback and session creation
5. Test error handling and rate limiting

**Need Implementation:**
1. Analytics tracking integration
2. File upload API endpoint
3. Hypothesis CRUD frontend integration
4. Gate scoring calculation tests

### Performance & Reliability Targets

**Current Baselines:**
- **Build Time:** ~36 seconds (Jest suite)
- **Page Load:** <5 seconds (E2E assertion)
- **Component Render:** <1 second (unit tests)

**Future Targets:**
- **Token Validation:** <2 seconds response time
- **AI Generation:** <30 seconds for report creation
- **Database Operations:** <100ms average query time
- **Cross-Site Handoff:** <3 seconds total user experience

## Running Tests

### Jest (Unit & Integration Tests)

```bash
# Run all unit and integration tests
pnpm test

# Watch mode for development
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run only unit tests
pnpm test:unit

# Run only integration tests
pnpm test:integration
```

### Playwright (E2E Tests)

```bash
# Run all E2E tests (45 tests across 3 browsers)
pnpm test:e2e

# Run with UI mode for debugging
pnpm test:e2e:ui

# Run specific browser
pnpm exec playwright test --project=chromium

# List all available tests
pnpm exec playwright test --list

# Run with headed browsers (visible)
pnpm exec playwright test --headed
```

### Run All Tests

```bash
# Unit + Integration + E2E (comprehensive)
pnpm test:all

# CI pipeline tests
pnpm test:ci
```

## Test Development Guidelines

### When to Use Jest vs. Playwright

**Use Jest for:**
- React component behavior and rendering
- Business logic and utility functions
- API route handlers and middleware
- Database query functions
- Supabase client interactions
- State management and hooks

**Use Playwright for:**
- Full user journeys across multiple pages
- Cross-browser compatibility testing
- Authentication flows and redirects
- Network failure scenarios
- Performance and loading time validation
- Responsive design verification

### Test Naming Conventions

- **Unit/Integration Tests:** `ComponentName.test.tsx` or `functionName.test.ts`
- **E2E Tests:** `feature-name.spec.ts`
- **Test Suites:** Use descriptive `describe()` blocks
- **Test Cases:** Start with "should" for clear behavior description

### Outside-in TDD Flow

1. Start from BDD scenario → ensure there is a failing acceptance/spec.
2. Write a failing **contract test** for the relevant port (e.g., `OrchestrationPort.planRequest`).
3. Drive **unit tests** to green in the domain; keep adapters as fakes first.
4. Attach real **adapters** behind interfaces; promote to **integration tests** at the edges.
5. Lock **API contracts** with OpenAPI-based checks and example payloads.
6. Add **non-functionals** as tests (p95, cost budgets, retries).

## Test Artifacts & Reports

### Jest Artifacts
- **Coverage Reports:** `frontend/coverage/`
- **Test Results:** Console output only (no HTML report)

### Playwright Artifacts
- **HTML Reports:** `test-results/playwright-report/`
- **Screenshots:** `test-results/playwright/artifacts/`
- **Videos:** `test-results/playwright/artifacts/`
- **Traces:** `test-results/playwright/artifacts/`

**Viewing Playwright Reports:**
```bash
pnpm exec playwright show-report test-results/playwright-report
```

## CI/CD Integration

### Netlify Build Pipeline

**Current Build Process:**
```bash
1. pnpm install           # Install dependencies
2. pnpm build            # Next.js production build
3. Deploy to Netlify     # Static export deployment
```

**Recommended CI Pipeline (Future):**
```bash
1. Lint & Type Check     # ESLint + TypeScript
2. pnpm test            # Jest unit + integration tests
3. pnpm build           # Production build
4. pnpm test:e2e        # Playwright E2E tests (optional in CI)
5. Deploy to Netlify    # If all tests pass
```

### Quality Gates

**Current Status:**
- ✅ All 162 tests passing
- ✅ Production builds successful
- ✅ TypeScript compilation clean
- ⚠️ Coverage baseline established (target: ≥90%)
- ⚠️ E2E tests manual (not in CI yet)

**Future Targets:**
- Coverage ≥ 90%
- Mutation score ≥ 70%
- API p95 ≤ 3s
- Render p95 ≤ 8s
- No blocking accessibility violations

## Test Environment Configuration

### Environment Variables

**Jest Test Environment:**
- `.env.test.local` - Test-specific overrides
- `jest.env.js` - Environment setup script
- Database URL mocking for isolated tests

**Playwright Test Environment:**
- `PLAYWRIGHT_BASE_URL` - Base URL for tests (default: http://localhost:3000)
- `PLAYWRIGHT_PORT` - Port for dev server (default: 3000)
- Auto-loads from Next.js `.env.local` when dev server starts

### Database Testing

**Current Approach:**
- Mock Supabase client for unit tests
- Use test doubles for Drizzle ORM operations
- Real Supabase connection for manual integration testing

**Future Approach:**
- Seeded test database for integration tests
- Transaction rollback for test isolation
- Deterministic fixtures for repeatable tests

## Accessibility Testing

### Current Implementation

**Manual Testing:**
- Keyboard navigation testing
- Screen reader compatibility checks
- Color contrast validation

**Automated Testing:**
- Jest DOM assertions for ARIA attributes
- Semantic HTML validation
- Focus management testing

### Future Enhancements

**Planned Integrations:**
1. **@axe-core/playwright** - Automated accessibility scanning in E2E tests
2. **jest-axe** - Accessibility assertions in component tests
3. **Lighthouse CI** - Performance and accessibility scoring
4. **pa11y** - Continuous accessibility monitoring

## Notes

- **Test Isolation:** Jest and Playwright run independently with no conflicts
- **Test Doubles:** Prefer mocking adapters in unit tests; keep E2E tests lean
- **Database Seeding:** See `docs/operations/database-seeding.md` for test data setup
- **Performance Testing:** E2E tests include load time assertions
- **Accessibility:** Follow WCAG 2.0/2.1/2.2 AA standards (see `docs/design/accessibility-standards.md`)

## Backend Testing (Python/CrewAI)

### Multi-Layer Testing Strategy

The CrewAI backend uses a hybrid testing approach:

```
Layer 1: Python Unit Tests (pytest)
  ├─ Test individual tools (WebSearch, EvidenceStore)
  ├─ Test agent configurations
  └─ Test task definitions

Layer 2: Python Integration Tests (pytest)
  ├─ Test crew execution end-to-end
  ├─ Test tool interactions
  └─ Test error handling

Layer 3: Netlify Function Tests (Python)
  ├─ Test function handler
  ├─ Test JWT validation
  ├─ Test rate limiting
  └─ Test request/response formatting

Layer 4: API Integration Tests (Jest/Playwright)
  ├─ Test frontend → Netlify function calls
  ├─ Test authentication flow
  └─ Test error scenarios

Layer 5: E2E User Flows (Playwright)
  ├─ Test complete analysis workflow
  ├─ Test UI → API → CrewAI → Results
  └─ Test real user scenarios
```

### Backend Test Setup

**Install pytest:**
```bash
cd backend
source crewai-env/bin/activate
pip install pytest pytest-asyncio pytest-mock pytest-cov
```

**Test Structure:**
```
backend/
├── src/startupai/
│   ├── crew.py
│   ├── tools.py
│   └── main.py
└── tests/
    ├── conftest.py           # Shared fixtures
    ├── unit/
    │   ├── test_tools.py     # Test individual tools
    │   ├── test_agents.py    # Test agent creation
    │   └── test_tasks.py     # Test task creation
    ├── integration/
    │   ├── test_crew.py      # Test crew execution
    │   └── test_workflow.py  # Test end-to-end
    └── fixtures/
        └── test_data.py      # Test data
```

**Run backend tests:**
```bash
# Run all tests
pytest

# With coverage
pytest --cov=src/startupai --cov-report=html

# Specific tests
pytest tests/unit/test_tools.py -v
pytest -m "not slow"  # Skip slow integration tests
```

### Testing Commands Reference

**Backend (Python):**
```bash
cd backend && pytest                    # All tests
cd backend && pytest --cov=src         # With coverage
cd backend && pytest tests/unit        # Unit tests only
```

**Frontend (JavaScript):**
```bash
cd frontend && pnpm test               # Jest unit tests
cd frontend && pnpm test:e2e           # Playwright e2e
cd frontend && pnpm test:all           # Everything
```

**Full Stack Integration:**
```typescript
// frontend/src/__tests__/e2e/api/crewai.spec.ts
test('CrewAI API integration', async ({ request }) => {
  const response = await request.post('/api/analyze', {
    headers: { 'Authorization': `Bearer ${token}` },
    data: {
      strategic_question: 'Test question',
      project_id: 'test-123',
      priority_level: 'medium'
    }
  });
  expect(response.ok()).toBeTruthy();
});
```

### Test Coverage Targets

**Backend Coverage:**
- Unit Tests: 80%+ coverage
- Integration Tests: Critical paths only
- Function Tests: 100% of public endpoints

**Frontend Coverage:**
- Unit Tests: 70%+ coverage
- Integration Tests: API calls, auth flows
- E2E Tests: 3-5 critical user journeys

## Related Documentation

- [Database Seeding](../../operations/database-seeding.md)
- [Implementation Status](../../operations/implementation-status.md)
- [Accessibility Standards](../../../startupai.site/docs/design/accessibility-standards.md)
- [Two-Site Implementation Plan](../../../startupai.site/docs/technical/two-site-implementation-plan.md)
- [Netlify Functions](../../../netlify/functions/README.md)
