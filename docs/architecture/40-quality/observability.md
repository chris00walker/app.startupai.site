# Observability and Operations

## Telemetry

- OpenTelemetry traces/metrics/logs → Cloud Trace/Monitoring/Logging
- Per-request correlation IDs; 100% router decisions logged

## SLO Targets

- Quality: evaluator composite ≥ 0.85 (VPC), ≥ 0.80 (BMC/TBI)
- Latency: discovery p95 ≤ 180s; per-agent p95 ≤ 8s; renderer p95 ≤ 8s
- Cost: standard ≤ $0.75, premium ≤ $2.00 per canvas; per-client monthly cap; per-request max
- Reliability: error budget ≤ 2% failed publishes / 30 days

## Dashboards & Alerts

- Cloud Monitoring dashboards for quality/latency/cost
- Alerts on burn rate, error spikes, budget exhaustion

## Auditability

- Immutable `events` + `router_decisions` tables; replay tooling with budget + safety policies

Operational responses when SLOs breach:

- Quality: pause auto-publish, route to review, open incident, add golden tasks
- Latency: scale Cloud Run, reduce context, degrade to cheaper/faster model tier per policy
- Cost: trigger breaker, require approval, switch to degraded prompts/local tools, reschedule heavy jobs

Related:

- SLOs: `docs/engineering/10-requirements/slos-and-budgets.md`
- Operations: `docs/operations/operations.md`
