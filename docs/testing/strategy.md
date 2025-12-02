---
purpose: "Private technical source of truth for testing strategy"
status: "active"
last_reviewed: "2025-12-02"
---

# Testing Strategy

## Pyramid

1. **Unit tests** – React components, utility functions (`pnpm test -- --watch`).
2. **Integration tests** – API + Supabase interactions using Jest + real DB connections.
3. **End-to-end** – Playwright flows covering auth, onboarding, and dashboard.
4. **Specification-driven** – See [`testing/specification-driven.md`](specification-driven.md).

## Integration Test Categories

### Webhook to Dashboard Integration
Tests the complete CrewAI validation flow:
- **Location:** `src/__tests__/integration/webhook-to-dashboard.integration.test.ts`
- **What it tests:**
  - Webhook payload persistence to 5 tables (reports, evidence, crewai_validation_states, projects, public_activity_log)
  - Dashboard hook compatibility (useCrewAIState, useInnovationSignals, useVPCData)
  - Innovation Physics signals (D-F-V) persistence and retrieval
- **Run:** `pnpm test -- --testPathPatterns="webhook-to-dashboard"`
- **Note:** Skips automatically when using test.supabase.co (fake) URL

### Gate Scoring Integration
Tests gate progression and evidence quality calculations.

## Tooling

- Jest for unit/integration tests
- Playwright for cross-browser UI testing (runs in CI)
- Real Supabase connections for integration tests (with skip logic for CI)

## CI Pipeline

- PR: `pnpm lint`, `pnpm test`, `pnpm test:e2e --headed=false` (smoke subset).
- Nightly: full Playwright suite + accessibility checks.
- Integration tests skip in CI when using fake Supabase URL.

Failure triage recorded in Notion runbook and linked to relevant GitHub issues.
