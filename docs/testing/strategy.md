---
purpose: "Private technical source of truth for testing strategy"
status: "active"
last_reviewed: "2026-01-19"
---

# Testing Strategy

## Test Pyramid

| Level | Count | Purpose |
|-------|-------|---------|
| **Unit** | 824+ | Component/function logic |
| **Integration** | ~50 | API + Supabase interactions |
| **E2E** | 101 | User journey validation |

### Current Coverage

```
Unit Tests:        824+ passing
Integration Tests: ~50 (Supabase + API)
E2E Tests:         101 specs in 11 Playwright files
```

## Testing Layers

### 1. Unit Tests
React components, utility functions, hooks.

```bash
pnpm test              # Run all unit tests
pnpm test -- --watch   # Watch mode
pnpm test -- --coverage # Coverage report
```

### 2. Integration Tests
API routes with real or mocked Supabase connections.

**Key test files**:
- `src/__tests__/integration/webhook-to-dashboard.integration.test.ts`
- `src/__tests__/api/` - API route tests

### 3. End-to-End Tests
Playwright flows covering auth, onboarding, dashboard.

```bash
pnpm test:e2e              # Run E2E tests
pnpm test:e2e --headed     # With browser UI
pnpm test:e2e --ui         # Interactive mode
```

### 4. Specification-Driven Tests
Tests derived from marketing promises.

See [`testing/specification-driven.md`](specification-driven.md) (archived).

---

## Journey-Driven Testing (Jan 2026)

### Problem

The 824+ unit tests primarily verify that mocks work correctly, not that user outcomes are achieved:
- Tests derived from code implementation, not user requirements
- Heavy mocking disconnects tests from real behavior
- No connection to journey maps or user goals

### Evolution to JDTD

**Journey-Driven Test Development (JDTD)** derives tests from user journey maps:

```
Journey Map → User Goal → Test Case
```

### Approach

1. **Derive tests from journey maps**
   - Source: `docs/user-experience/founder-journey-map.md`
   - Map each journey step to a test case
   - Test user outcomes, not implementation details

2. **Map E2E to journey touchpoints**
   - Each E2E test covers a journey milestone
   - Test the "happy path" end-to-end
   - Add negative cases for critical paths

3. **Acceptance test layer**
   - Tests verify user outcomes
   - Stories defined in [`user-stories.md`](../user-experience/user-stories.md)
   - Example: US-F01 "Complete AI-Guided Onboarding"
   - Example: US-C02 "Invite Client"

4. **Integration tests with real DB**
   - Reduce mock dependency
   - Test actual Supabase interactions
   - Use test environment, not production

### Journey Test Matrix

| Journey | User Goal | Test Type | File |
|---------|-----------|-----------|------|
| Founder Onboarding | Complete 7 stages | E2E | `onboarding.spec.ts` |
| Founder Onboarding | Brief extracted correctly | Integration | `brief-extraction.test.ts` |
| Consultant Setup | Create profile | E2E | `consultant-onboarding.spec.ts` |
| Client Invite | Invite accepted | Integration | `invite-flow.test.ts` |
| Validation | Review HITL checkpoint | E2E | `approvals.spec.ts` |

### Reference

- User Personas: [`user-personas.md`](../user-experience/user-personas.md) - Role definitions
- User Stories: [`user-stories.md`](../user-experience/user-stories.md) - 18 stories with acceptance criteria
- Founder Journey: [`founder-journey-map.md`](../user-experience/founder-journey-map.md) - 15-step journey
- Consultant Journey: [`consultant-journey-map.md`](../user-experience/consultant-journey-map.md) - 6-phase journey
- Coverage Matrix: [`journey-test-matrix.md`](./journey-test-matrix.md) - Story-to-test mapping with gap analysis

---

## Integration Test Categories

### Webhook to Dashboard Integration

Tests the complete CrewAI validation flow:

**Location**: `src/__tests__/integration/webhook-to-dashboard.integration.test.ts`

**What it tests**:
- Webhook payload persistence to 5 tables
- Dashboard hook compatibility (useCrewAIState, useInnovationSignals, useVPCData)
- D-F-V (Desirability-Feasibility-Viability) signal persistence

**Run**:
```bash
pnpm test -- --testPathPatterns="webhook-to-dashboard"
```

**Note**: Skips automatically when using test.supabase.co (fake) URL.

### API Route Tests

Tests for all 53 API routes:

| Category | Route Count | Test Status |
|----------|-------------|-------------|
| Onboarding | 9 | ✅ Complete |
| Consultant | 8 | ✅ Complete |
| CrewAI | 5 | ✅ Complete |
| Approvals | 3 | ✅ Complete |
| Auth | 3 | ✅ Complete |
| Other | 25 | Partial |

### Gate Scoring Integration

Tests gate progression and evidence quality calculations.

---

## Tooling

| Tool | Purpose |
|------|---------|
| **Jest** | Unit/integration tests |
| **Playwright** | Cross-browser E2E testing |
| **Testing Library** | Component testing utilities |
| **MSW** | API mocking (where needed) |

## CI Pipeline

### Pull Request

```bash
pnpm lint          # ESLint
pnpm type-check    # TypeScript
pnpm test          # Jest unit tests
pnpm test:e2e --headed=false  # Playwright smoke subset
```

### Nightly

- Full Playwright suite
- Accessibility checks
- Integration tests with staging Supabase

### Integration Test Behavior

- **Local**: Runs with real Supabase (test project)
- **CI**: Skips when using fake Supabase URL
- **Staging**: Full integration with staging database

---

## Test Organization

```
frontend/src/
├── __tests__/
│   ├── api/                    # API route tests
│   │   ├── consultant/
│   │   ├── onboarding/
│   │   ├── crewai/
│   │   └── approvals/
│   ├── hooks/                  # Hook tests
│   ├── lib/                    # Library tests
│   │   ├── onboarding/
│   │   └── auth/
│   ├── integration/            # Integration tests
│   └── production/             # Smoke tests
├── components/
│   └── */__tests__/            # Component tests
└── e2e/                        # Playwright specs
    ├── auth.spec.ts
    ├── onboarding.spec.ts
    ├── consultant.spec.ts
    └── dashboard.spec.ts
```

---

## Failure Triage

- Issues tracked in GitHub Issues
- Critical failures escalate to Slack #engineering
- Flaky tests tracked in `docs/testing/flaky-tests.md`

## Related Documentation

- **Work Tracking**: `docs/work/in-progress.md` (TDD Effectiveness - P1)
- **Journey Maps**: `docs/user-experience/founder-journey-map.md`
- **API Specs**: `docs/specs/api-*.md`
