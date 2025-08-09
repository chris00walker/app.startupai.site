---
title: Constructability Checklist — Thin Slice
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Readiness

- Diagrams compile (PlantUML/Mermaid)
- OpenAPI validated
- Policy DSL validated

## DevOps

- CI: lint → test → sbom → build → scan → deploy
- Secrets via GCP Secret Manager; no secrets in repo

## Operability

- Health probes and /status endpoints
- SLO dashboards and alerts
- Budget breakers and telemetry hooks
