---
kind: template
id: TEMPLATE-AGENT-SPEC
title: Agent/Endpoint Spec
objective: Create/update an agent or endpoint with measurable quality/latency.
inputs:
  - docs/architecture/01-brief.md
  - docs/architecture/data.md
outputs:
  - api: route(s) and handler(s)
  - tests: unit + integration for agent flow
  - docs: usage in docs/integrations/overview.md
definition_of_done:
  - agent passes evaluator checks for its canvas/task
  - latency p95 within target; errors < 1%
  - observability: logs + metrics + correlation IDs
acceptance_criteria:
  - rubrics: evaluation/rubrics.md
  - slo: operations/operations.md
  - client_deliverables: updated decision pack if client‑visible
constraints:
  - inherit: docs/prompts/constraints.md
plan:
  - step_01: define inputs/outputs and telemetry
  - step_02: implement agent logic and retries/timeouts
  - step_03: add tests and dashboards/alerts
  - step_04: update docs
changed_files:
  - <fill in>
---

## Execution Guide

Follow the plan; ensure observability and failure modes are tested.
