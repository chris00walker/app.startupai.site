---
kind: pack
id: ARCH-DESIGN-BUILD
title: Architecture Completion — Design‑Build
objective: Finish architecture to buildable quality with Design‑Build Mode.
inputs:
  - docs/architecture/overview.md
  - docs/architecture/data.md#canvas-artifacts
outputs:
  - docs: full architecture tree (views, contracts, data, quality, ADRs, ops)
definition_of_done:
  - all file_contracts created and non-empty; diagrams compile without errors
  - executable preliminary design runs locally; commands documented
acceptance_criteria:
  - rubrics: docs/evaluation/rubrics.md#evidence-quality-score >= threshold
  - slos: docs/operations/operations.md p95 targets met
constraints:
  - style: Hexagonal Modular Monolith (ports/adapters) on GCP
  - inherit: docs/prompts/constraints.md
plan:
  - step_01: Author C4 views (context, container, components) and thin-slice sequence
  - step_02: Write contracts (ports/adapters, OpenAPI, policy DSL) and align names with diagrams
  - step_03: Draft Design-Build docs (spike matrix, executable prelim, CBOM, unit economics, traffic model, constructability)
  - step_04: Complete data docs (domains, logical schema, PII retention policy)
  - step_05: Quality & governance (SLOs, evaluator rubric JSON, golden scenarios)
  - step_06: Decisions & implementation (ADRs, module layout, CI/CD, runbooks, dashboards)
  - step_07: Compile diagrams; run validators; request human gate review
  - note: Thin-slice aligns with docs/prompts/packs/bdd_ecommerce_discovery.md; telemetry aligns with docs/prompts/packs/router_decision_log.md
file_contracts:
  - docs/architecture/01-brief.md
  - docs/architecture/02-business-context.md
  - docs/architecture/03-risks-assumptions.md
  - docs/architecture/04-success-metrics.md
  - docs/architecture/10-views/c4-context.puml
  - docs/architecture/10-views/c4-container.puml
  - docs/architecture/10-views/c4-components-orchestrator.puml
  - docs/architecture/10-views/c4-components-gateway.puml
  - docs/architecture/10-views/domain-context-map.puml
  - docs/architecture/10-views/sequence-thin-slice.mmd
  - docs/architecture/20-contracts/ports-and-adapters.md
  - docs/architecture/20-contracts/openapi-gateway.yaml
  - docs/architecture/20-contracts/policy-dsl.yaml
  - docs/architecture/25-design-build/spike-matrix.md
  - docs/architecture/25-design-build/executable-prelim.md
  - docs/architecture/25-design-build/cbom.md
  - docs/architecture/25-design-build/unit-economics.md
  - docs/architecture/25-design-build/traffic-model.md
  - docs/architecture/25-design-build/constructability-checklist.md
  - docs/architecture/30-data/data-domains.md
  - docs/architecture/30-data/logical-schema.sql
  - docs/architecture/30-data/pii-retention-policy.md
  - docs/architecture/40-quality/slos.md
  - docs/architecture/40-quality/evaluator-rubric.json
  - docs/architecture/40-quality/golden-scenarios.md
  - docs/architecture/50-decisions/adr-000-template.md
  - docs/architecture/50-decisions/adr-001-architecture-style.md
  - docs/architecture/50-decisions/adr-002-data-store.md
  - docs/architecture/60-implementation/module-layout.md
  - docs/architecture/60-implementation/cicd-outline.md
  - docs/architecture/60-implementation/runbooks.md
  - docs/architecture/60-implementation/monitoring-dashboards.md
  - docs/architecture/25-design-build/cbom.md
  - docs/architecture/25-design-build/unit-economics.md
  - docs/architecture/25-design-build/traffic-model.md
  - docs/architecture/25-design-build/constructability-checklist.md
  - docs/architecture/30-data/data-domains.md
  - docs/architecture/30-data/logical-schema.sql
  - docs/architecture/30-data/pii-retention-policy.md
  - docs/architecture/40-quality/slos.md
  - docs/architecture/40-quality/evaluator-rubric.json
  - docs/architecture/40-quality/golden-scenarios.md
  - docs/architecture/50-decisions/adr-000-template.md
  - docs/architecture/50-decisions/adr-001-architecture-style.md
  - docs/architecture/50-decisions/adr-002-data-store.md
  - docs/architecture/60-implementation/module-layout.md
  - docs/architecture/60-implementation/cicd-outline.md
  - docs/architecture/60-implementation/runbooks.md
  - docs/architecture/60-implementation/monitoring-dashboards.md
timebox_hours: 16
abort_conditions:
  - diagrams fail to compile after two consecutive fixes
  - evaluator thresholds cannot be met within timebox
  - SLO/cost targets cannot be met with >=2 value-engineering options
stage_gates:
  - views coherent across C4/domain/sequence; all compile clean
  - contracts consistent with views; OpenAPI/policy DSL validated
  - executable prelim runs locally; telemetry hooks present
  - SLOs & unit economics aligned to targets; golden scenarios defined
changed_files:
  - docs/architecture/01-brief.md
  - docs/architecture/02-business-context.md
  - docs/architecture/03-risks-assumptions.md
  - docs/architecture/04-success-metrics.md
  - docs/architecture/10-views/c4-context.puml
  - docs/architecture/10-views/c4-container.puml
  - docs/architecture/10-views/c4-components-orchestrator.puml
  - docs/architecture/10-views/domain-context-map.puml
  - docs/architecture/10-views/c4-components-gateway.puml
  - docs/architecture/10-views/sequence-thin-slice.mmd
  - docs/architecture/20-contracts/ports-and-adapters.md
  - docs/architecture/20-contracts/openapi-gateway.yaml
  - docs/architecture/20-contracts/policy-dsl.yaml
  - docs/architecture/25-design-build/spike-matrix.md
  - docs/architecture/25-design-build/executable-prelim.md
---

## Execution Guide

Follow Design‑Build Mode (`docs/prompts/modes/design_build.md`). Compile PlantUML (`*.puml`) via CLI/CI; view Mermaid sequence (`*.mmd`) with `docs/architecture/diagrams/viewer.html`. Align the thin slice with `docs/prompts/packs/bdd_ecommerce_discovery.md` and telemetry/decision logs with `docs/prompts/packs/router_decision_log.md`.
