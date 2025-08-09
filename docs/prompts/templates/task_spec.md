---
kind: template
id: TEMPLATE-TASK-SPEC
title: Generic Task Spec
objective: Implement a single, well‑scoped feature/change.
inputs:
  - docs/README.md
outputs:
  - code: path(s) listed under changed_files
  - tests: unit/integration as appropriate
  - docs: updated guides and README links
definition_of_done:
  - tests passing
  - lints pass (code + markdown)
  - docs updated
  - CI green
acceptance_criteria:
  - rubrics: evaluation/rubrics.md (if applicable)
  - slo: operations/operations.md (if applicable)
  - client_deliverables: N/A unless client‑facing
constraints:
  - inherit: docs/prompts/constraints.md
plan:
  - step_01: analyze impacted components
  - step_02: implement code and tests
  - step_03: update docs and diagrams
  - step_04: run validators and prepare PR
changed_files:
  - <fill in>
---

## Execution Guide

1. Follow the plan steps, keeping commits small.
2. Keep scope to this spec; defer extras to follow‑up packs.
