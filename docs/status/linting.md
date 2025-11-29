# Linting Status

## Current Approach

- `pnpm lint` intentionally prints a status message instead of running ESLint.
- Frontend code uses patterns that violate current ESLint defaults (for example conditional hook usage and unescaped entities).
- Running `next lint` today would immediately fail with dozens of findings and block CI.

## Accessibility Linting (Available Now)

A separate accessibility-focused ESLint config is available:

```bash
pnpm lint:a11y
```

This runs only jsx-a11y rules as **warnings** (not errors), giving developers visibility into accessibility issues without blocking CI. The config is in `frontend/eslint.config.a11y.mjs`.

Current baseline: 38 warnings (label associations, autoFocus usage, click events without keyboard handlers).

## Next Steps

1. Decide on the baseline rule-set (e.g., Next.js defaults or a custom profile).
2. Capture the known violations in issues.
3. Introduce ESLint configuration and re-enable the command once the backlog is addressed.

## Developer Notes

Run:

```bash
pnpm lint
```

to confirm linting remains deferred. The command exits successfully but reminds you to review this file.

