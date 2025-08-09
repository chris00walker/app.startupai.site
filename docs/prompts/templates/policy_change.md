---
kind: template
id: TEMPLATE-POLICY-CHANGE
title: Policy Router Change
objective: Modify policy DSL or presets safely.
inputs:
  - docs/policy/dsl.md
outputs:
  - policy: updated DSL/presets with tests
  - docs: changelog and rationale
definition_of_done:
  - policy decisions logged; backtest vs golden tasks
  - no regressions on evaluator metrics
acceptance_criteria:
  - rubrics: evaluation/rubrics.md
  - slo: unaffected unless specified
constraints:
  - inherit: docs/prompts/constraints.md
plan:
  - step_01: update DSL/presets and unit tests
  - step_02: backtest against golden tasks
  - step_03: document changes & rollout steps
changed_files:
  - docs/policy/*
---

## Execution Guide

Coordinate rollout with feature flags if needed.
