---
purpose: "Deprecated - superseded by testing/strategy.md (JDTD)"
status: "archived"
last_reviewed: "2026-01-19"
---

# Specification-Driven Testing

> ⚠️ **ARCHIVED**: This document has been superseded by [`testing/strategy.md`](../../testing/strategy.md) which covers Journey-Driven Test Development (JDTD).

> **Note (Jan 2026)**: This approach evolved into **Journey-Driven Test Development (JDTD)**. See [`testing/strategy.md`](../../testing/strategy.md) for the updated methodology that derives tests from user journey maps.

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
