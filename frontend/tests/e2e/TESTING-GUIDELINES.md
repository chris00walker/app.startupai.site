# E2E Testing Guidelines

**Full audit report:** [`docs/testing/e2e-audit-report.md`](../../../docs/testing/e2e-audit-report.md)

## 8 Anti-Patterns to Avoid

| # | Anti-Pattern | Rule |
|---|--------------|------|
| 1 | **Permissive patterns** | Never use `if (await element.isVisible())` guards |
| 2 | **Incomplete assertions** | Navigation tests must verify destination page content |
| 3 | **Skipped tests** | All `test.skip()` must have TODO comment with story ID |
| 4 | **Hardcoded timeouts** | Use `waitForLoadState()` or `expect().toBeVisible()`, not `waitForTimeout(3000)` |
| 5 | **Generic selectors** | Use `data-testid`, roles, or semantic attributes |
| 6 | **Mock mismatch** | Prefer real API; if mocking, validate against production schema |
| 7 | **Auth bypass** | Always go through login flow via `helpers/auth.ts` |
| 8 | **Order dependence** | Each test must setup its own data, run independently |

## Quick Checklist

Before submitting tests:
- [ ] No `if (await x.isVisible())` guards (#1)
- [ ] Navigation verifies page content, not just URL (#2)
- [ ] No unexplained `test.skip()` (#3)
- [ ] No magic number timeouts (#4)
- [ ] Semantic selectors only (#5)
- [ ] Tests run independently in any order (#8)

## Test Structure

```typescript
test('should [action] and [expected outcome]', async ({ page }) => {
  // ARRANGE → ACT → ASSERT (verify outcome, not just action)
});
```

See audit report for detailed examples and remediation patterns.
