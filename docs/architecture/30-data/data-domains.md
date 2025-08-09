---
title: Data Domains
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Bounded Contexts → Tables (logical)

- Engagements: engagements, assumptions, iteration_log
- Canvas: canvases, canvas_items, exports
- Evidence: evidence, evidence_links, scores
- Orchestration: jobs, tasks, evaluations, metrics
- Operations: budgets, alerts, dashboards

## Security & PII

- PII minimization; AES-256 column encryption where applicable
- Access via service accounts; least-privilege IAM
- Retention per `pii-retention-policy.md`
