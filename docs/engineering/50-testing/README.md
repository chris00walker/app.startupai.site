# CWC Agentic Platform Testing Strategy

**Context:** Product platform testing with cross-site integration focus  
**Reference:** [Implementation Plan - Testing Strategy](../../../startupai.site/docs/technical/two-site-implementation-plan.md#72-testing-strategy)

This platform uses comprehensive testing to ensure reliable cross-site authentication, AI workflows, and user experience.

## Testing Priorities for Product Platform

### Cross-Site Integration Tests
- **JWT Token Validation**: Test `/api/auth/handoff` with valid/invalid/expired tokens
- **User Session Creation**: Verify user account creation from token data
- **Handoff Error Recovery**: Test fallback mechanisms for failed authentication
- **Analytics Tracking**: Verify cross-site event tracking works correctly

### Core Platform Features
- **Project Management**: CRUD operations for user projects
- **Hypothesis Management**: Create, update, link hypotheses to evidence
- **Evidence Collection**: File upload, URL parsing, manual entry
- **AI Workflows**: CrewAI integration and response handling
- **Report Generation**: AI-powered business model canvas creation

### Performance & Reliability
- **Token Validation**: <2 seconds response time
- **AI Generation**: <30 seconds for report creation
- **Database Operations**: <100ms average query time
- **Cross-Site Handoff**: <3 seconds total user experience

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
