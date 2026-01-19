---
purpose: "Testing documentation index"
status: "active"
last_reviewed: "2026-01-18"
---

# Testing Documentation

Testing infrastructure for the StartupAI platform.

## Overview

The platform uses **Jest** for unit/integration testing and **Playwright** for end-to-end testing, with React Testing Library for component testing and axe-core for accessibility checks.

## Test Stack

| Purpose | Tool | Location |
|---------|------|----------|
| Unit/Integration | Jest + React Testing Library | `*.test.tsx`, `*.spec.ts` |
| E2E | Playwright | `e2e/`, `*.spec.ts` |
| Accessibility | axe-core + @axe-core/react | Integrated in component tests |

## Running Tests

```bash
# All tests
pnpm test

# Watch mode (development)
pnpm test:watch

# Coverage report
pnpm test:coverage

# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests (Playwright)
pnpm test:e2e

# E2E with UI (visual debugging)
pnpm test:e2e:ui

# Backend integration E2E
pnpm test:e2e:backend

# Run all test types
pnpm test:all

# CI pipeline (coverage + E2E)
pnpm test:ci
```

## Test Structure

```
frontend/
├── src/
│   ├── __tests__/           # Unit and integration tests
│   │   └── production/      # Production validation tests
│   └── components/
│       └── *.test.tsx       # Component-adjacent tests
├── e2e/                     # Playwright E2E tests
│   └── *.spec.ts
└── jest.config.js           # Jest configuration
```

## Test Categories

### Unit Tests

Test individual functions and utilities in isolation.

```typescript
// Example: src/__tests__/utils/validation.test.ts
import { validateEmail } from '@/lib/validation';

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
});
```

### Component Tests

Test React components with React Testing Library.

```typescript
// Example: src/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Integration Tests

Test API routes and database interactions.

```typescript
// Example: src/__tests__/integration/api.test.ts
describe('API /api/projects', () => {
  it('returns user projects', async () => {
    const response = await fetch('/api/projects');
    expect(response.status).toBe(200);
  });
});
```

### E2E Tests (Playwright)

Test complete user journeys.

```typescript
// Example: e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test';

test('user can complete onboarding', async ({ page }) => {
  await page.goto('/onboarding');
  await page.fill('[data-testid="business-idea"]', 'My startup idea');
  await page.click('[data-testid="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

### Accessibility Tests

Integrated with component tests using axe-core.

```typescript
// Example: src/components/Form.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<Form />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Configuration

### Jest (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};
```

### Playwright (`playwright.config.ts`)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

## Quality Gates

### Pre-Deployment Requirements

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Coverage targets met for critical paths
- [ ] No accessibility violations in component tests

### CI Pipeline

The `test:ci` script runs:
1. `test:coverage` - Unit/integration with coverage
2. `test:e2e` - Playwright end-to-end tests

## Related Documentation

- [Business Requirements Testing](./business-requirements-testing.md)
- [User Journey Validation](./user-journey-validation.md)
- [Accessibility Testing](./accessibility-testing.md)

---

**Last Updated**: 2025-12-01
**Status**: Jest + Playwright infrastructure implemented

*Note: Verify available commands with `pnpm run` in the frontend directory. Some commands may vary based on package.json configuration.*
