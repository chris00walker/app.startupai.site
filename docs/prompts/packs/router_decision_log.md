---
kind: pack
id: ROUTER-DECISION-LOG
title: Policy Router Decision Logging & Dashboards
objective: Log router decisions with correlation IDs and build dashboards/alerts.
inputs:
  - docs/architecture/overview.md#router-telemetry-decision-log
outputs:
  - tables: events/router_decisions (schema + migrations)
  - dashboards: Cloud Monitoring views
  - alerts: burn rate, error spikes, budget exhaustion
definition_of_done:
  - 100% router decisions logged with correlation to requests/jobs
  - dashboards show quality/latency/cost; alerts fire correctly on thresholds
acceptance_criteria:
  - slo: operations/operations.md thresholds for latency and error rate
  - client_deliverables: risk & compliance summary updated
constraints:
  - inherit: docs/prompts/constraints.md
plan:
  - step_01: define schema and correlation strategy
  - step_02: implement logging and ingestion
  - step_03: build dashboards and alerts
  - step_04: document runbooks
file_contracts:
  - docs/architecture/diagrams/c4_context.mmd
  - docs/architecture/diagrams/c4_container.mmd
  - docs/architecture/diagrams/c4_components_orchestrator.mmd
timebox_hours: 8
abort_conditions:
  - cannot verify event correlation E2E within timebox
  - dashboard or alerting APIs unavailable for >30m
stage_gates:
  - schema + lineage approved
  - dashboards reviewed by ops; alerts tested with synthetic traffic
changed_files:
  - <fill in paths>
---

## Policy Router Decision Logging & Dashboards

## Execution Guide

Test with synthetic traffic and verify alert pathways.
