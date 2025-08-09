---
title: Executable Preliminary Design — Thin Slice
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Goal

- Stand up a minimal, runnable flow for the thin slice:
  - POST /intake → orchestrator policy route → workflow run → persist → enqueue render → status query.

## Commands

- Orchestrator local run (simulate):
  
  ```bash
  node scripts/prelim/run_workflow.js \
    --task canvas.generate \
    --pii_level low \
    --budget_tier standard
  ```

- Render local run (simulate):
  
  ```bash
  node scripts/prelim/run_render.js --job <job_id>
  ```

## Telemetry Hooks

- Emit counters/histograms using a simple logging shim to stdout (to be swapped for Cloud Monitoring in CI/CD).

## Acceptance

- End-to-end returns status with links and stores artefact metadata.
- p95 end-to-end under 15s in local simulation, errors < 2%.
