---
title: Component Bill of Materials (CBOM)
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Runtime Components

- Gateway (Cloud Run): Express/Nest, OAuth/OIDC auth, OpenAPI
- Orchestrator (Cloud Run): Policy Router, Workflow Runner, Evaluator, Cost Guard
- Renderer (Cloud Run): Headless Chromium export to PDF/SVG
- Cloud SQL Postgres + pgvector: Projects, canvases, evidence, metrics
- Pub/Sub or Cloud Tasks: async jobs, retries
- Cloud Monitoring: SLOs, alerts, dashboards

## Images & Versions (initial)

- node:20-alpine (gateway/orchestrator)
- chromium-base image (renderer)

## Licenses

- OSS dependencies tracked via SBOM in CI (to be integrated)

## Supply Chain Controls

- Pin base images; weekly digest updates
- SLSA level targets in CI/CD; provenance attestations
