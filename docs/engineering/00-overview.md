# Engineering Plan Set Overview
<!-- markdownlint-disable MD013 -->

> Mode: Design-Build · Runtime: Node.js 20.x LTS · Cloud: GCP · DB: Cloud SQL Postgres + pgvector · Secrets: Secret Manager

This plan set operationalizes the approved ML/AI-first architecture documented in `docs/ARCHITECTURE.md` and `docs/architecture/overview.md`.

- System: Cloud Run microservices (Renderer, Orchestrator, Policy Router, Evaluators) with shared libraries and clear module boundaries.
- Data: Postgres (Cloud SQL) with `pgvector` for embeddings; Prisma ORM ≥ 5.x.
- Interfaces: OpenAPI Gateway `docs/architecture/20-contracts/openapi-gateway.yaml` (canonical).
- Security: Least privilege, non-root containers, read-only FS, dropped capabilities, HTTPS-only, SBOM.
- Observability: OTel traces/metrics/logs, Prometheus metrics endpoint, correlation IDs.
- SLOs: API p95 ≤ 3s; DB avg < 100ms; render p95 ≤ 8s; end-to-end canvas ≤ 30s.
- Determinism: Linting for Markdown and OpenAPI; diagram compilation in CI; prompt structure validation.

See subfolders for requirements, system design, data, API, testing, CI/CD, deployment, operations, and governance.
