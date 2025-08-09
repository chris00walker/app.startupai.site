---
title: CI/CD Outline — Thin Slice
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Pipeline

1. Lint: markdownlint, yaml/json schema
2. Test: unit (where available)
3. Security: TruffleHog, dependency scan (npm audit / Snyk)
4. Build: Docker images (gateway, orchestrator, renderer)
5. Scan: container scanning
6. Deploy: Cloud Run via GitHub Actions
7. Verify: smoke tests; SLO dashboards
