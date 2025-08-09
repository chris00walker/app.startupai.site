---
title: Module Layout — Thin Slice
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Modules

- gateway/
  - api/, auth/, rate_limit/
- orchestrator/
  - policy_router/, workflow/, evaluator/, cost_guard/
- renderer/
  - export/
- shared/
  - telemetry/, db/, queue/
