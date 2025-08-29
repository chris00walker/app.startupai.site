---
title: Architecture Brief — Chris Walker Consulting
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Purpose

Provide a concise statement of system intent, scope, and key constraints to guide Design‑Build execution.

## Intent

An AI‑first, GCP‑native consulting platform producing Strategyzer‑style deliverables;
validates ideas via online experiments with guardrailed, deterministic AI workflows.

## Scope

- Core orchestration (policy router + evaluators)
- Canvas authoring/export (PDF/SVG)
- Evidence collection and scoring
- Client deliverables portal

## Key Constraints

- Hexagonal Modular Monolith with strict ports/adapters and path to service extraction
- GCP: Cloud Run, Cloud SQL Postgres + pgvector, Pub/Sub/Tasks, Secret Manager, Cloud Monitoring
- PII minimization; column‑level encryption; explicit retention
- SLOs: discovery p95 ≤ 180s; per‑agent p95 ≤ 8s; render p95 ≤ 8s
- Cost per artefact ≤ $0.75 (Standard), ≤ $2.00 (Premium)

## Non‑Goals (v1)

- Full multi‑tenant workspace isolation beyond row‑level scoping
- Non‑GCP deployment targets

## References

- `docs/comprehensive_requirements.md`
- `docs/architecture/data.md#canvas-artifacts`
- `docs/evaluation/rubrics.md`
- `docs/operations/operations.md`
