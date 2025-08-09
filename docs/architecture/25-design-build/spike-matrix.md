---
title: Spike Matrix — Cost/Latency/Recall
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Scope

- Thin-slice tasks: `canvas.generate`, `evidence.collect`, `render.export`.
- Compare models/backends across latency, cost, quality (recall/precision), stability.

## Method

- Warm up 3 runs; sample size ≥ 30 per variant per task.
- Record p50/p95 latency, error rate, unit cost, evaluator score.
- Use golden scenarios in `docs/architecture/40-quality/golden-scenarios.md`.

## Variants

- canvas.generate: gpt-4o-mini, claude-haiku, local-small (ablation)
- evidence.collect: search+rerank (provider A), search+rerank (provider B)
- render.export: headless-chromium@stable, headless-chromium@beta

## Acceptance

- Meets SLOs from `docs/architecture/40-quality/slos.md`.
- Cost per artefact within `policy-dsl.yaml` budgets.
- No critical stability regressions under p95 load.
