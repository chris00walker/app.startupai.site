---
kind: pack
id: BDD-ECOM-DISCOVERY
title: BDD eCommerce Discovery Workflow (End‑to‑End)
objective: Implement the end‑to‑end discovery flow aligned to behavior‑driven goals.
inputs:
  - docs/architecture/40-quality/tdd-bdd.md#behavior-driven-development-bdd-scenarios
outputs:
  - orchestrations: workflow definitions
  - tests: e2e scenarios reflecting user behaviors
  - docs: updated guides and diagrams
definition_of_done:
  - stage gates enforced by evaluators; partial results recoverable
  - real‑time progress and human‑AI iteration supported
acceptance_criteria:
  - rubrics: evaluation/rubrics.md thresholds per canvas type
  - slo: operations/operations.md targets
  - client_deliverables: decision pack + evidence pack + iteration log
constraints:
  - inherit: docs/prompts/constraints.md
plan:
  - step_01: codify BDD scenarios and acceptance tests
  - step_02: implement orchestrations and guardrails
  - step_03: wire evaluators and fallback policies
  - step_04: document runbook and handoff
file_contracts:
  - docs/architecture/diagrams/c4_context.mmd
  - docs/architecture/diagrams/domain_context_map.mmd
  - docs/architecture/diagrams/thin_slice_sequence.mmd
timebox_hours: 12
abort_conditions:
  - evaluator thresholds cannot be met within timebox
  - orchestrator policy routing blocked >30m
stage_gates:
  - BDD scenarios green; evaluators meet thresholds
  - human review of flow and risks completed
changed_files:
  - <fill in paths>
---

## Execution Guide

Use golden tasks to prevent regressions during subsequent changes.
