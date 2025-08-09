---
title: ADR-001 — Architecture Style: Hexagonal Modular Monolith on GCP
status: accepted
date: 2025-08-08
author: Cascade (AI) with Chris Walker
---

## Context

We need a pragmatic, evolvable baseline with strict boundaries and a path to services.

## Decision

Adopt a Hexagonal Modular Monolith (ports/adapters) deployed on GCP (Cloud Run, Cloud SQL Postgres+pgvector, Pub/Sub/Tasks, Secret Manager, Cloud Monitoring).

## Consequences

- Clear seams for extraction; adapters isolate infrastructure.
- Faster delivery and simpler ops initially.

## Alternatives Considered

- Microservices from day 1 (overhead too high)
- Serverless only (limits long-running orchestration)
