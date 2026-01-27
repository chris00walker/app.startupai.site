# E2E Test Quality Audit Report

**Generated:** 2026-01-27
**Audited by:** Claude Code
**Severity:** CRITICAL - Test suite provides false confidence

## Executive Summary

The E2E test suite has **systemic quality issues** that allow bugs to reach production undetected. Two critical patterns were identified:

| Issue | Count | Impact |
|-------|-------|--------|
| **Permissive patterns** | 168 instances | Tests pass when they should fail |
| **Skipped tests** | 308 tests | Tests exist but never run |

**Combined:** 476 test quality issues across 45 test files.

---

## Critical Issue #1: Permissive Patterns (168 instances)

### The Problem

Tests use `if (await element.isVisible())` guards that **silently pass when elements don't exist**:

```typescript
// WRONG: This test passes whether the feature works OR NOT
const pivotCard = page.locator('[data-testid="approval-card"]');
if (await pivotCard.isVisible()) {
  await expect(pivotCard).toBeVisible();  // Only runs if already visible
  await pivotCard.click();
}
// If pivotCard doesn't exist, test passes silently - NO FAILURE
```

### Why This Is Dangerous

1. **False confidence**: Test reports "PASS" when feature is broken
2. **Silent regression**: Feature can break and tests still pass
3. **No failure signal**: CI/CD won't catch the issue

### Correct Pattern

```typescript
// CORRECT: This test FAILS if the feature is broken
const pivotCard = page.locator('[data-testid="approval-card"]');
await expect(pivotCard).toBeVisible({ timeout: 10000 });  // FAILS if not visible
await pivotCard.click();
```

### Files Affected (17 files, 168 instances)

| File | Count | Priority |
|------|-------|----------|
| `15-pivot-workflows.spec.ts` | 42 | CRITICAL |
| `11-project-lifecycle.spec.ts` | 27 | CRITICAL |
| `12-client-lifecycle.spec.ts` | 26 | CRITICAL |
| `14-hitl-extended.spec.ts` | 22 | CRITICAL |
| `13-trial-limits.spec.ts` | 10 | HIGH |
| `28-data-imports.spec.ts` | 8 | HIGH |
| `29-data-sync.spec.ts` | 8 | HIGH |
| `20-admin-operations.spec.ts` | 6 | HIGH |
| `39-ai-insights.spec.ts` | 5 | MEDIUM |
| `21-admin-audit.spec.ts` | 3 | MEDIUM |
| `30-field-mappings.spec.ts` | 3 | MEDIUM |
| `36-assumption-map.spec.ts` | 2 | MEDIUM |
| `37-evidence-features.spec.ts` | 2 | MEDIUM |
| `05-hitl-approval-flow.spec.ts` | 1 | LOW |
| `06-consultant-portfolio.spec.ts` | 1 | LOW |
| `38-gate-evaluation.spec.ts` | 1 | LOW |
| `04-founder-analysis-journey.spec.ts` | 1 | LOW |

### Root Cause

Tests were written for features that **may or may not be implemented**, using conditional logic to avoid failures. This is a test design anti-pattern.

### Remediation

For each instance:
1. Determine if the feature **should** exist
2. If YES: Remove `if` guard, use strict `expect().toBeVisible()`
3. If NO: Delete the test or mark as `test.skip()` with TODO comment

---

## Critical Issue #2: Skipped Tests (308 tests)

### The Problem

Tests are explicitly skipped using `test.skip()` but remain in the codebase:

```typescript
test('should display billing history in settings', async ({ page }) => {
  // TODO: Implement when billing flow is built
  test.skip();
});
```

### Why This Is Dangerous

1. **False coverage**: Appears in test counts but provides zero protection
2. **Stale placeholders**: May reference outdated UI/API patterns
3. **Maintenance burden**: Clutter in test files

### Files Affected (20 files, 308 skipped tests)

| File | Skipped | Category | Reason |
|------|---------|----------|--------|
| `25-billing.spec.ts` | 46 | Billing | Feature not built |
| `27-account-settings.spec.ts` | 31 | Settings | Partial implementation |
| `26-notifications.spec.ts` | 27 | Notifications | Feature not built |
| `24-offboarding.spec.ts` | 25 | Offboarding | Feature not built |
| `23-support.spec.ts` | 24 | Support | Feature not built |
| `29-platform-tooling.spec.ts` | 23 | Platform | Feature not built |
| `18-edge-cases.spec.ts` | 23 | Edge Cases | Complex scenarios |
| `22-consultant-trial.spec.ts` | 20 | Trial | Partial implementation |
| `36-auto-approval.spec.ts` | 14 | Auto-Approval | Recently added |
| `35-agent-hitl-checkpoints.spec.ts` | 14 | HITL | Backend dependency |
| `31-agent-vpc-discovery.spec.ts` | 14 | Agent | Backend dependency |
| `32-agent-desirability.spec.ts` | 11 | Agent | Backend dependency |
| `30-agent-brief-generation.spec.ts` | 11 | Agent | Backend dependency |
| `34-agent-viability.spec.ts` | 10 | Agent | Backend dependency |
| `33-agent-feasibility.spec.ts` | 7 | Agent | Backend dependency |
| `17-quick-start-consultant.spec.ts` | 3 | Onboarding | Partial |
| `10-consultant-client-onboarding.spec.ts` | 2 | Onboarding | Partial |
| `28-integrations.spec.ts` | 1 | Integrations | OAuth testing |
| `07-adr005-persistence.spec.ts` | 1 | Persistence | Complex |
| `04-founder-analysis-journey.spec.ts` | 1 | Journey | Complex |

### Categorization

| Category | Count | Action |
|----------|-------|--------|
| **Feature not built** | 176 | Delete or move to backlog |
| **Backend dependency** | 81 | Keep, implement when backend ready |
| **Partial implementation** | 36 | Implement what's possible |
| **Complex/Infrastructure** | 15 | Evaluate individually |

### Remediation

1. **Delete tests for non-existent features** (billing, offboarding, support, notifications)
2. **Keep skeleton tests for backend-dependent features** (agent flows)
3. **Implement tests for partial features** (settings, trial)

---

## Additional Issues Found

### Hardcoded Timeouts (8 instances)

```typescript
// WRONG: Magic number, flaky on slow CI
await page.waitForTimeout(3000);

// CORRECT: Wait for specific condition
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
```

**Files:** `08-ui-indicators.spec.ts` (4), `07-adr005-persistence.spec.ts` (1), `38-gate-evaluation.spec.ts` (1), `helpers/auth.ts` (1), `04-founder-analysis-journey.spec.ts` (1)

### Heavy API Mocking (75 instances, 16 files)

Many tests mock APIs instead of testing real behavior. This hides:
- Schema mismatches between mock and production
- Authentication/authorization bugs
- Network error handling

---

## Recommendations

### Immediate Actions (This Sprint)

1. **Fix 19-admin-user-management.spec.ts** - Already done (RLS bug found)
2. **Fix top 4 permissive files** (168 → ~70 instances):
   - `15-pivot-workflows.spec.ts`
   - `11-project-lifecycle.spec.ts`
   - `12-client-lifecycle.spec.ts`
   - `14-hitl-extended.spec.ts`

### Short-Term (Next 2 Sprints)

3. **Delete placeholder tests** for non-existent features:
   - `25-billing.spec.ts` (46 tests) - Feature not built
   - `24-offboarding.spec.ts` (25 tests) - Feature not built
   - `23-support.spec.ts` (24 tests) - Feature not built
   - `26-notifications.spec.ts` (27 tests) - Feature not built

4. **Replace hardcoded timeouts** with proper waits (8 instances)

### Medium-Term (Next Quarter)

5. **Add error assertions** to all happy-path tests
6. **Reduce API mocking** in favor of test database
7. **Implement negative testing** for critical flows

---

## Test Quality Metrics

### Before Remediation

| Metric | Value | Target |
|--------|-------|--------|
| Total test files | 45 | - |
| Total tests | ~500 | - |
| Skipped tests | 308 (62%) | <5% |
| Permissive patterns | 168 | 0 |
| Hardcoded timeouts | 8 | 0 |
| Effective coverage | ~38% | >90% |

### After Remediation (Target)

| Metric | Before | After |
|--------|--------|-------|
| Skipped tests | 308 | <25 |
| Permissive patterns | 168 | 0 |
| Effective coverage | ~38% | >80% |

---

## Appendix: Pattern Detection Commands

```bash
# Find permissive patterns
grep -r "if (await.*\.isVisible())" frontend/tests/e2e/*.spec.ts | wc -l

# Find skipped tests
grep -r "test\.skip(" frontend/tests/e2e/*.spec.ts | wc -l

# Find hardcoded timeouts
grep -r "waitForTimeout(\d+)" frontend/tests/e2e/*.spec.ts

# Count tests per file
for f in frontend/tests/e2e/*.spec.ts; do
  echo "$f: $(grep -c "test\('" $f 2>/dev/null || echo 0)"
done
```

---

## Remediation Progress

### Completed Files (17 files, 168 patterns fixed)

| File | Patterns Fixed | Status |
|------|----------------|--------|
| `15-pivot-workflows.spec.ts` | 42 | COMPLETE |
| `11-project-lifecycle.spec.ts` | 27 | COMPLETE |
| `12-client-lifecycle.spec.ts` | 26 | COMPLETE |
| `14-hitl-extended.spec.ts` | 22 | COMPLETE |
| `13-trial-limits.spec.ts` | 10 | COMPLETE |
| `28-data-imports.spec.ts` | 8 | COMPLETE |
| `29-data-sync.spec.ts` | 8 | COMPLETE |
| `20-admin-operations.spec.ts` | 6 | COMPLETE |
| `39-ai-insights.spec.ts` | 5 | COMPLETE |
| `21-admin-audit.spec.ts` | 3 | COMPLETE |
| `30-field-mappings.spec.ts` | 3 | COMPLETE |
| `36-assumption-map.spec.ts` | 2 | COMPLETE |
| `37-evidence-features.spec.ts` | 2 | COMPLETE |
| `38-gate-evaluation.spec.ts` | 1 | COMPLETE |
| `04-founder-analysis-journey.spec.ts` | 1 | COMPLETE |
| `05-hitl-approval-flow.spec.ts` | 1 | COMPLETE (exploratory test) |
| `06-consultant-portfolio.spec.ts` | 1 | COMPLETE (exploratory test) |

### Progress Summary

- **Started:** 168 permissive patterns
- **Fixed:** 168 patterns (100%)
- **Remaining:** 0 patterns

---

**Report Status:** PERMISSIVE PATTERNS REMEDIATION COMPLETE
**Next Action:** Address skipped tests (308 tests) and other audit findings
