---
purpose: "Private technical source of truth for testing strategy"
status: "active"
last_reviewed: "2025-10-25"
---

# Testing Strategy

## Pyramid

1. **Unit tests** – React components, utility functions (`pnpm test -- --watch`).
2. **Integration tests** – API + Supabase interactions using Vitest + MSW.
3. **End-to-end** – Playwright flows covering auth, onboarding, and dashboard.
4. **Specification-driven** – See [`testing/specification-driven.md`](specification-driven.md).

## Tooling

- Jest/Vitest for unit/integration.
- Playwright for cross-browser UI testing (runs in CI).
- Supabase Test Containers for database assertions.

## CI Pipeline

- PR: `pnpm lint`, `pnpm test`, `pnpm test:e2e --headed=false` (smoke subset).
- Nightly: full Playwright suite + accessibility checks.

Failure triage recorded in Notion runbook and linked to relevant GitHub issues.
