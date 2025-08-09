---
title: Unit Economics — Thin Slice
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Assumptions

- Standard tier target ≤ $0.75 per artefact; Premium ≤ $2.00.
- Render avg 2 pages per canvas; evaluator runs ≤ 3 per artefact.

## Cost Model (illustrative)

- canvas.generate (model): $0.20
- evidence.collect (search+rerank): $0.15
- evaluator (N=3): $0.18
- render.export (chromium): $0.10
- storage/egress amortized: $0.05

Total (Standard): $0.68 — within budget.

## Sensitivities

- Model price variance ±30%
- Retry rate up to 5% under load
- Renderer cold starts add +20% latency

## Levers

- Route to cheaper models for Standard via policy DSL
- Batch rendering; cache templates
- Early-stop evaluators on pass
