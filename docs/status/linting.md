# Linting Status

## Current Approach

- `pnpm lint` intentionally prints a status message instead of running ESLint.
- Frontend code uses patterns that violate current ESLint defaults (for example conditional hook usage and unescaped entities).
- Running `next lint` today would immediately fail with dozens of findings and block CI.

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

