# Non-Functional Requirements

- Reliability: 99.9% monthly uptime target for public endpoints.
- Performance: API p95 ≤ 3s; render p95 ≤ 8s; DB avg latency < 100ms.
- Scalability: Horizontal autoscaling on Cloud Run based on concurrency and CPU.
- Security: No secrets in code; use GCP Secret Manager; least privilege IAM.
- Compliance: PII encrypted at rest (AES-256); access logged; data retention policies enforced.
- Observability: OTel traces/logs/metrics with correlation IDs; Prometheus metrics endpoint.
- Cost: ≤ $2 per complete canvas; budgets, alerts, and breakers configured.
- Determinism: Linting gates (Markdown/OpenAPI), diagrams compile, prompt packs validate.
