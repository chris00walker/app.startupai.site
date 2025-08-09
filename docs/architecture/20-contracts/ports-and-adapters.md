---
title: Ports & Adapters — Gateway + Orchestrator
version: v1.0.0
date: 2025-08-08
author: Cascade (AI) with Chris Walker
status: draft
---

## Inbound Ports (Gateway)

- port: `IntakePort`
  description: Accepts intake requests from clients
  transport: HTTP/JSON
  endpoint: POST `/intake`
  auth: OIDC (JWT bearer)

- port: `StatusPort`
  description: Exposes job status and links
  transport: HTTP/JSON
  endpoint: GET `/status/{id}`
  auth: OIDC (JWT bearer)

## Outbound Ports (Gateway)

- port: `OrchestratorCommandPort`
  description: Forwards validated intake requests to orchestrator
  transport: HTTP/gRPC

## Inbound Ports (Orchestrator)

- port: `CommandPort`
  description: Accepts new job commands from gateway
  transport: HTTP/gRPC

## Domain Ports (Orchestrator)

- port: `PolicyRouter`
  description: Route by `pii_level`, `budget_tier`, `task_type`
- port: `WorkflowRunner`
  description: Executes thin-slice workflows and evaluators
- port: `CostGuard`
  description: Enforces budgets, breakers, retries

## Outbound Ports (Orchestrator)

- port: `DBPort`
  description: Persist artefacts, evidence, metrics
  transport: SQL (Postgres + pgvector)
- port: `QueuePort`
  description: Enqueue render jobs
  transport: Pub/Sub or Cloud Tasks
- port: `TelemetryPort`
  description: Emit counters, histograms, logs
  transport: Cloud Monitoring

## Adapters

- adapter: `HttpApiAdapter` (Gateway)
  ports: [`IntakePort`, `StatusPort`]
- adapter: `AuthAdapter` (Gateway)
  concern: OIDC/JWT verification
- adapter: `HttpClientAdapter` (Gateway)
  ports: [`OrchestratorCommandPort`]
- adapter: `OrchestratorHttpAdapter` (Orchestrator)
  ports: [`CommandPort`]
- adapter: `PgAdapter` (Orchestrator)
  ports: [`DBPort`]
- adapter: `QueueAdapter` (Orchestrator)
  ports: [`QueuePort`]
- adapter: `TelemetryAdapter` (Orchestrator)
  ports: [`TelemetryPort`]
