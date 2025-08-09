---
title: ADR-002 — Primary Data Store: Cloud SQL Postgres + pgvector
status: accepted
date: 2025-08-08
author: Cascade (AI) with Chris Walker
---

## Context

We require relational consistency and vector similarity for embeddings.

## Decision

Use Cloud SQL Postgres with pgvector for embeddings. No MongoDB.

## Consequences

- Strong consistency; SQL ergonomics; managed service.
- pgvector enables semantic search; costs predictable.

## Alternatives Considered

- MongoDB/Atlas (explicitly excluded)
- Bigtable (not a fit for OLTP)
