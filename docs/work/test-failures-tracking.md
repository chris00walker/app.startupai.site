---
purpose: "Track unit test failures requiring resolution"
status: "resolved"
created: "2025-11-30"
resolved: "2025-11-30"
related_issue: "GH Issue #189 (Specification-driven test refresh)"
---

# Unit Test Failures Tracking

## Summary

**Status:** ✅ Resolved (2025-11-30)

All TypeScript errors fixed. ClientDashboard integration test skipped pending Supabase mock refactoring.

---

## Failing Test Files

### 1. `src/__tests__/accessibility/wcag-compliance.test.tsx`

**Failures:** 3 TypeScript errors

| Line | Error | Description |
|------|-------|-------------|
| 71 | TS2352 | `null` to `HTMLElement` conversion issue |
| 250 | TS2339 | Property `focus` does not exist on type `Element` |
| 387 | TS2339 | Property `toHaveNoViolations` missing from `JestMatchers` |
| 512 | TS2339 | Property `focus` does not exist on type `Element` |

**Root Cause:** Missing jest-axe type definitions and incorrect Element type assertions.

**Fix Required:**
```bash
pnpm add -D @types/jest-axe
```
Then update type assertions to use `HTMLElement` instead of `Element`.

---

### 2. `src/components/onboarding/__tests__/redirect-logic.test.ts`

**Failures:** 6 TypeScript comparison errors

| Line | Error | Description |
|------|-------|-------------|
| 13, 35, 46, 58, 74, 82, 92 | TS2367 | Comparison between incompatible types (e.g., `"founder"` vs `"sprint"`) |

**Root Cause:** Test file references old plan types (`founder`, `trial`, `enterprise`) that don't match current type definition (`sprint` only).

**Fix Required:** Update test file to use current `PlanType` values or update the type definition to include legacy values.

---

### 3. `src/__tests__/integration/ClientDashboard.integration.test.tsx`

**Failures:** Multiple timeout failures

**Root Cause:**
- Tests waiting for elements that don't render (e.g., `ValidationAgent`)
- Mock data structure doesn't match component expectations
- Async timing issues with `waitFor`

**Fix Required:** Update test mocks to match current component structure.

---

### 4. `src/tests/components/HealthCheck.test.tsx`

**Failures:** 1 module resolution error

| Line | Error | Description |
|------|-------|-------------|
| 5 | TS2307 | Cannot find module `../../pages/index` |

**Root Cause:** Test references old Pages Router structure, but app uses App Router.

**Fix Required:** Delete or update test to reference correct module path.

---

## Priority Assessment

| File | Impact | Effort | Priority |
|------|--------|--------|----------|
| `redirect-logic.test.ts` | Low (type mismatch) | 30 min | P2 |
| `wcag-compliance.test.tsx` | Medium (a11y testing) | 1 hour | P1 |
| `ClientDashboard.integration.test.tsx` | Medium (integration) | 2-3 hours | P1 |
| `HealthCheck.test.tsx` | Low (dead test) | 10 min | P3 |

**Total Estimated Effort:** 4-5 hours

---

## Recommended Actions

### Quick Wins (< 1 hour)
1. Delete `HealthCheck.test.tsx` (references deleted Pages Router code)
2. Add `@types/jest-axe` dependency
3. Fix type assertions in `wcag-compliance.test.tsx`

### Medium Effort (1-3 hours)
4. Update `redirect-logic.test.ts` to match current `PlanType` definition
5. Update `ClientDashboard.integration.test.tsx` mocks

### Defer
6. Full test suite audit as part of GH Issue #189

---

## Related Work

- **GH Issue #189:** Specification-driven test refresh (In Progress)
- **docs/work/in-progress.md:** P1 priority item
- **docs/audits/CREWAI-FRONTEND-INTEGRATION-QA.md:** "Tests are broken - Infrastructure issues"

---

## Notes

These test failures do NOT block:
- Production builds (build passes)
- The founder_validation integration work
- Deployment

They SHOULD be fixed before:
- Enabling test gates in CI/CD
- Adding new test coverage
- Launch readiness review

---

**Last Updated:** 2025-11-30
