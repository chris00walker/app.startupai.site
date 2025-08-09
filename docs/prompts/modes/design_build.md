# Design‑Build Mode

Operate AI work in a deterministic, gated way. When a pack is run in Design‑Build Mode, the AI must produce exactly the files and artifacts defined by the pack contract — no scope expansion.

## Principles

- Do exactly what the pack specifies: inputs → plan → file_contracts → outputs → stage_gates.
- Prefer small, high‑confidence increments gated by validators and lint.
- Enforce timeboxing and abort conditions; fail fast, document findings.
- Honor org constraints in `docs/prompts/constraints.md` (security, PII, SLOs, docs, CI).

## Controls & Knobs

- target_quality: rubric + thresholds from `docs/evaluation/rubrics.md`.
- latency_budget_ms: pack SLO target and budget tier.
- cost_tier: standard | frugal | premium.
- pii_policy: none | low | high (impacts routing, redaction, logging).
- degradation_rules: permitted fallbacks when a gate fails.

## Process

1) Read the pack front‑matter.
2) Validate inputs exist and constraints apply.
3) Execute the `plan` step-by-step.
4) Produce files listed in `file_contracts` and update `changed_files` paths.
5) Run validators and lint. If a stage gate fails, apply degradation_rules or stop.
6) Stop on `abort_conditions` or when timebox expires; summarize findings.

## Definition of Done (mode)

- All `stage_gates` in the pack pass.
- All `file_contracts` exist and lint clean.
- Acceptance criteria met: rubrics/SLO/client deliverables.
- No secrets committed; traceability preserved.
