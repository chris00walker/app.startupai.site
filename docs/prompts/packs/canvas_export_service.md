---
kind: pack
id: CANVAS-EXPORT-SVC
title: Canvas Export Service (PDF/SVG)
objective: Render canvases via serverless export-service with caching.
inputs:
  - docs/architecture/data.md#canvas-artifacts
  - docs/architecture/overview.md#architecture-diagrams
outputs:
  - api: POST /export {canvas_id, format}
  - artifacts: gs://…/exports/{canvas_id}.{pdf|svg}
  - docs: integrations/overview.md updated with usage
definition_of_done:
  - unit tests: routes/renderer/cache
  - e2e: sample canvas renders valid PDF/SVG
  - ops: error rate < 2%; latency p95 < 2000ms
acceptance_criteria:
  - rubrics: evaluation/rubrics.md#evidence-quality-score >= threshold
  - slo: operations/operations.md latency p95 target met
  - client_deliverables:
    - decision_pack: product/decision_pack.md updated
    - exports: PDF/PNG + editable source attached
constraints:
  - inherit: docs/prompts/constraints.md
plan:
  - step_01: design API and cache keys
  - step_02: implement renderer and caching
  - step_03: add tests and CI checks
  - step_04: update docs
file_contracts:
  - docs/architecture/diagrams/c4_context.mmd
  - docs/architecture/diagrams/c4_container.mmd
  - docs/architecture/diagrams/thin_slice_sequence.mmd
timebox_hours: 8
abort_conditions:
  - render engine cannot generate valid PDF/SVG within timebox
  - storage or auth dependencies degraded >30m
stage_gates:
  - API contract approved; golden canvas renders pass
  - p95 latency < 2000ms in staging; error rate < 2%
changed_files:
  - <fill in paths>
---

## Execution Guide

Add tracing to renderer calls and capture failures with actionable logs.
