---
kind: template
id: TEMPLATE-DATA-CHANGE
title: Data Change / Migration
objective: Change schema with safe rollout and backfill.
inputs:
  - docs/architecture/data.md
outputs:
  - migration: scripts/manifests
  - code: dual‑write/read changes
  - docs: data contracts
definition_of_done:
  - backfill complete; dual‑write validated; rollback plan documented
acceptance_criteria:
  - slo: no performance regressions
constraints:
  - inherit: docs/prompts/constraints.md
plan:
  - step_01: design schema and dual‑write plan
  - step_02: implement migration/backfill
  - step_03: switch read‑path and retire legacy
changed_files:
  - <fill in>
---

## Execution Guide

Include feature flags and metrics to watch during rollout.
