---
purpose: "Testing documentation index"
status: "active"
last_reviewed: "2026-01-23"
---

# Testing Documentation

Testing infrastructure for the StartupAI platform, centered on **Test-Driven Development (TDD)** and **Journey-Driven Test Development (JDTD)**.

## Quick Start

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode (TDD workflow)
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run with coverage
pnpm test:coverage
```

## Documentation Index

| Document | Purpose |
|----------|---------|
| **[tdd-workflow.md](tdd-workflow.md)** | TDD methodology, Red-Green-Refactor, practical examples |
| **[strategy.md](strategy.md)** | Test strategy, JDTD approach, test pyramid |
| **[journey-test-matrix.md](journey-test-matrix.md)** | Story-to-test coverage matrix with gap analysis |
| **[agent-journey-test-matrix.md](agent-journey-test-matrix.md)** | Agent journey test coverage matrix |
| **[e2e-guide.md](e2e-guide.md)** | E2E testing guide for backend integration |

## Test-Driven Development

**TDD is the primary development methodology for this codebase.**

The workflow is:
1. **Red** - Write a failing test that defines expected behavior
2. **Green** - Write minimal code to make the test pass
3. **Refactor** - Clean up while keeping tests green

See **[tdd-workflow.md](tdd-workflow.md)** for detailed guidance and examples.

## Journey-Driven Test Development (JDTD)

JDTD extends TDD by deriving tests from user journey maps:

```
Journey Map → User Goal → Test Case → Implementation
```

**Key principle:** Tests verify *user outcomes*, not *code mechanics*.

**Sources for test cases:**
- [`stories/README.md`](../user-experience/stories/README.md) - Story catalog with acceptance criteria
- [`founder-journey-map.md`](../user-experience/journeys/founder/founder-journey-map.md) - Founder journey steps
- [`consultant-journey-map.md`](../user-experience/journeys/consultant/consultant-journey-map.md) - Consultant journey phases
- [`agent-journey-map.md`](../user-experience/journeys/agents/agent-journey-map.md) - Agent journey phases

## Test Stack

| Layer | Tool | Location | Purpose |
|-------|------|----------|---------|
| **Unit** | Jest + RTL | `*.test.tsx`, `*.test.ts` | Component/function logic |
| **Integration** | Jest | `__tests__/integration/` | API + database interactions |
| **E2E** | Playwright | `tests/e2e/*.spec.ts` | Full user journey validation |
| **Accessibility** | axe-core | Integrated in E2E | WCAG 2.1 AA compliance |

## Test Organization

```
frontend/
├── src/
│   ├── __tests__/           # Unit and integration tests
│   │   ├── api/             # API route tests
│   │   ├── hooks/           # Hook tests
│   │   ├── integration/     # Integration tests
│   │   └── lib/             # Library tests
│   └── components/
│       └── */__tests__/     # Component-adjacent tests
└── tests/
    └── e2e/                 # Playwright E2E tests
        ├── helpers/         # Test utilities
        └── *.spec.ts        # Test specs
```

## Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Unit tests | >70% | ~65% |
| Story coverage | 100% | 27% (34/127 stories) |
| Critical paths | 100% | ~85% |

## Running Tests

### Development (TDD Mode)

```bash
# Watch mode - reruns on file changes
pnpm test:watch

# Run specific test file
pnpm test -- path/to/file.test.ts

# Run tests matching pattern
pnpm test -- -t "should handle"
```

### E2E Tests

```bash
# Headless
pnpm test:e2e

# With browser UI (debugging)
pnpm test:e2e:ui

# Specific test file
pnpm test:e2e -- 02-onboarding-flow.spec.ts
```

### CI Pipeline

```bash
# Full quality gate
pnpm type-check && pnpm test && pnpm test:e2e && pnpm build
```

## Writing Tests

### Before Writing Code

1. Check if a user story exists in [`stories/README.md`](../user-experience/stories/README.md)
2. Write a failing test based on acceptance criteria
3. Only then implement the feature

### Test File Naming

- Unit tests: `ComponentName.test.tsx` or `functionName.test.ts`
- Integration tests: `feature.integration.test.ts`
- E2E tests: `NN-feature-name.spec.ts` (numbered for execution order)

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('when [condition]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Cross-References

| Document | Purpose |
|----------|---------|
| **User Experience** | |
| [`stories/README.md`](../user-experience/stories/README.md) | Story definitions with acceptance criteria |
| [`founder-journey-map.md`](../user-experience/journeys/founder/founder-journey-map.md) | Founder journey steps |
| [`consultant-journey-map.md`](../user-experience/journeys/consultant/consultant-journey-map.md) | Consultant journey phases |
| [`agent-journey-map.md`](../user-experience/journeys/agents/agent-journey-map.md) | Agent journey phases |
| **Specs** | |
| [`api-onboarding.md`](../specs/api-onboarding.md) | Onboarding API specification |
| [`accessibility-standards.md`](../specs/accessibility-standards.md) | WCAG compliance requirements |

## Archived Documentation

The following docs were archived during the Jan 2026 reorganization:

| Document | Reason | Location |
|----------|--------|----------|
| `specification-driven.md` | Evolved into JDTD | `archive/legacy/` |
| `specification-driven-implementation.md` | Outdated (Oct 2025) | `archive/legacy/` |
| `TESTING_CHECKLIST.md` | Hotfix-specific | `archive/legacy/` |
| `E2E_TEST_IMPLEMENTATION.md` | Outdated status | `archive/legacy/` |

---

**Last Updated**: 2026-01-23
**Maintainer**: Engineering Team
