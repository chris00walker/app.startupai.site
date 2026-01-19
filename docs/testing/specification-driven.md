---
purpose: "Specification-driven testing approach (evolving to journey-driven)"
status: "active"
last_reviewed: "2026-01-18"
---

# Specification-Driven Testing

> **Note (Jan 2026)**: This approach is evolving into **Journey-Driven Test Development (JDTD)**. See [`testing/strategy.md`](strategy.md) for the updated methodology that derives tests from user journey maps.

Specification-driven tests encode product requirements as executable scenarios. Sources include PRD, onboarding specs, and gate scoring rules.

## Workflow

1. Capture requirement in Gherkin-style YAML under `tests/specifications/`.
2. Implement Playwright + Supabase fixtures to satisfy scenarios.
3. Wire evaluation into CI `pnpm test:specification` job.
4. On failure, file issue referencing the spec ID.

## Current Coverage

- **Onboarding flow** – Validates stage progression, CrewAI triggers, analytics events.
- **Trial gating** – Ensures trial users hit usage limits per `trial_usage_counters`.
- **Gate scoring** – Cross-checks expected scoring outputs.

Link new features to specification IDs in feature folders under [`work/features/`](../work/features/).
