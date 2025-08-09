---
kind: template
id: TEMPLATE-EVALUATOR-SPEC
title: Evaluator / Metric Spec
objective: Define or adjust evaluator metrics and thresholds.
inputs:
  - docs/evaluation/rubrics.md
outputs:
  - evaluator: code/config
  - tests: metric correctness and thresholds
  - docs: rubric updates and rationale
definition_of_done:
  - metric stable across seed set; false positive/negative rates acceptable
acceptance_criteria:
  - rubrics: evaluation/rubrics.md updated
constraints:
  - inherit: docs/prompts/constraints.md
plan:
  - step_01: define signal, scoring, thresholds
  - step_02: implement and test
  - step_03: update documentation
changed_files:
  - <fill in>
---

## Execution Guide

Run on golden tasks and compare deltas before rollout.
