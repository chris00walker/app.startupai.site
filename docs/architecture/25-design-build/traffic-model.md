---
title: Traffic Model — Thin Slice
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Demand Scenarios

- Baseline: 20 engagements/month, 4 artefacts each → 80 artefacts
- Peak: +3x during end-of-quarter → 240 artefacts

## Workload Characteristics

- Burstiness: medium; rendering is spiky
- Concurrency: 5–20 in baseline, 50 in peak

## Capacity Targets

- Gateway p95 < 150ms; Orchestrator per-agent p95 < 8s; Render p95 < 8s
- Queue depth alert > 200

## Scaling Strategy

- Cloud Run min instances: 1 (orchestrator, renderer), 0 (gateway ok)
- Max instances tuned to budget caps; backpressure via queue
