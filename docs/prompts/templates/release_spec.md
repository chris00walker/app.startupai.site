---
kind: template
id: TEMPLATE-RELEASE-SPEC
title: Release Spec
objective: Ship a version with quality, security, and docs in place.
inputs:
  - docs/engineering/releases/
outputs:
  - tag: vX.Y.Z
  - notes: engineering/releases/vX.Y.Z.md
  - artifacts: container images/builds
definition_of_done:
  - SBOM & security scan green; e2e smoke passing; rollback strategy
acceptance_criteria:
  - client_deliverables: updated decision pack if applicable
constraints:
  - inherit: docs/prompts/constraints.md
plan:
  - step_01: finalize scope and cut branch
  - step_02: run full test/security pipeline
  - step_03: publish notes and artifacts
changed_files:
  - docs/engineering/releases/*
---

## Execution Guide

Ensure SLOs and rubrics regressions are addressed before tagging.
