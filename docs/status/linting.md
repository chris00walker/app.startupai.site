---
purpose: "Linting status, staged re-enablement plan, and best-practice guidance"
status: "active"
last_reviewed: "2026-01-28"
supersedes: "docs/archive/status/linting.md"
---

# Linting Status (Staged Re-Enablement)

## Current State

- `pnpm lint` now runs **warning-only** ESLint using `eslint.config.warn.mjs`.
- A strict baseline config exists at `eslint.config.base.mjs` for Stage 3 enforcement.
- Accessibility linting remains available via `pnpm lint:a11y` (warnings only).
- Baseline report output: `docs/status/linting-baseline.json`.

## Why It Was Deferred

Enabling the default ESLint ruleset immediately would fail with many existing violations
(e.g., conditional hook usage, unescaped entities), causing CI failures and blocking delivery.

## Best-Practice Setup (Approved Plan)

We will re-enable linting **in stages** to prevent new debt while paying down the backlog.

### Stage 1 — Baseline + Visibility (Non-Blocking)

1. **Generate a baseline report** of current ESLint violations:
   - `pnpm lint:baseline`
2. **Run lint in CI as warning-only** (does not fail builds):
   - `pnpm lint` (uses `eslint.config.warn.mjs`)
3. **Keep accessibility lint enabled** (warnings) to surface a11y issues continuously:
   - `pnpm lint:a11y`

### Stage 2 — Enforce on New/Changed Files

1. Introduce **changed-files-only linting** in PRs (via `lint-staged` or scoped ESLint runs).
2. Prevent **new violations** while existing debt is tracked and reduced.

Command (strict on changed files only):
```bash
pnpm lint:changed
```

CI integration:
- PRs run `pnpm lint:changed` (strict) to block new violations without failing on existing debt.

### Stage 3 — Full Enforcement

1. Once baseline issues are addressed, **switch to blocking** ESLint (`--max-warnings=0`).
2. Switch `pnpm lint` to `eslint.config.base.mjs` (or use `pnpm lint:strict`).
3. Keep `pnpm lint` in the quality gate permanently.

## Recommendations

- Start with Stage 1 immediately to regain lint visibility without blocking.
- Use Stage 2 to halt new lint debt while the backlog is burned down.
- Move to Stage 3 only when baseline issues are near zero.

## Tracking

- Baseline violations are captured in `docs/status/linting-baseline.json`.
- Revisit this file after each stage to update status and next steps.
