# Testing Strategy (TDD outside-in)

This repo practices BDD for intent and TDD for implementation. BDD features live in `features/` and run via Cucumber (see `docs/architecture/40-quality/bdd.md`). TDD is executed outside-in starting from ports/contracts and driving domain code to green.

## Suite types

- **Contract (ports/APIs)**: Tests on hexagonal ports and OpenAPI contracts. No external I/O beyond agreed boundaries.
- **Unit (domain logic)**: Pure functions/classes; no network, no filesystem.
- **Integration (adapters/DB)**: Real adapter + seeded Postgres via Prisma; minimal surface area.
- **E2E (thin slice)**: User journeys mapped from BDD scenarios; smoke + golden tasks.
- **Performance/Resilience**: Load (p95 latency), retry/idempotency, back-pressure; chaos where safe.
- **Mutation**: Mutation score to ensure test effectiveness.

## Outside-in TDD flow

1. Start from BDD scenario → ensure there is a failing acceptance/spec.
2. Write a failing **contract test** for the relevant port (e.g., `OrchestrationPort.planRequest`).
3. Drive **unit tests** to green in the domain; keep adapters as fakes first.
4. Attach real **adapters** behind interfaces; promote to **integration tests** at the edges.
5. Lock **API contracts** with OpenAPI-based checks and example payloads.
6. Add **non-functionals** as tests (p95, cost budgets, retries).

## Repository layout (tests)

```text
tests/
  contract/
  unit/
  integration/
  e2e/              # step defs in tests/e2e; features/ at repo root
  perf/
  mutation/
```

## Guardrails & pipelines

- Pipeline order: lint → unit → contract → integration → e2e → perf → mutation → deploy.
- Quality gates (initial targets): coverage ≥ 90%, mutation ≥ 70%, API p95 ≤ 3s, render p95 ≤ 8s, cost/artefact ≤ $0.75.
- Deterministic fixtures; seeded Postgres for integration; ephemeral envs for isolation.
- Observe spans/metrics in critical paths; assert on retries/backoff where applicable.

## Notes

- Prefer testing via **ports** over UI; keep UI/E2E lean.
- Keep adapters behind fakes in unit/contract tests; run a small set of golden integrations.
- See also: `docs/engineering/20-system/observability.md` for OTEL/metrics expectations.
